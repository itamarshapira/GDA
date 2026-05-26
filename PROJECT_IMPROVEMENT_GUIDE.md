# Project Improvement Guide - GasApp / GDA

## Purpose of this document

This file records recommended improvements found during a read-only review of the Expo React Native application. The app connects to an FG gas detector over Bluetooth Low Energy (BLE), displays detector values and alerts, changes settings, and displays a camera stream.

The most important improvements are not cosmetic. They reduce the chance of:

- showing a connected state when the device is not usable,
- reading an alert incorrectly,
- leaving BLE notifications alive after disconnection,
- exposing passwords or camera credentials,
- sending unsafe settings to a detector.

No application code was changed when this guide was created.

---

## Project Areas Reviewed

The recommendations are based on these areas:

- `App.js` - top-level connected/logged-in flow
- `src/components/Navbar/Navbar.jsx` - BLE scan, connect, and disconnect UI
- `src/components/Login1/Login1.jsx` - passkey login and GATT refresh flow
- `src/components/Tabs/Tabs.jsx` - main dashboard tab ownership
- `src/components/Tabs/Environmental/Environmental.jsx` - sensor reads and notifications
- `src/components/Tabs/AlertNotification/AlertNotification.jsx` - alert subscription UI
- `src/components/Video/VideoStream.jsx` - camera WebView connection
- `src/components/Tabs/DeviceSettings/DeviceSettings.jsx` - detector setting writes
- `src/services/bleService.js` - shared BLE operations and binary decoding
- `src/services/loginService.js` - login characteristic write
- `src/services/alertNotificationService.js` - alert characteristic handling
- `src/services/environmentalService.js` - sensor characteristic handling
- `src/services/androidService.js` - Android permission requests
- `app.json` - Android cleartext network and permissions configuration
- `patches/react-native-ble-plx+3.5.0.patch` - native BLE error patch

---

## Recommended Priority Order

### Priority 1: Device connection and login state correctness

Fix the active BLE device reference after login refresh, prevent a false connected state, and handle unexpected disconnects.

Why first: every sensor read, setting write, alert, and video/dashboard flow depends on reliable connection state.

### Priority 2: Alert accuracy and notification cleanup

Fix alert byte decoding and ensure every live subscription is removed correctly.

Why second: inaccurate alerts or unstable notification handling can cause incorrect operator decisions or app crashes.

### Priority 3: Credentials and networking security

Remove secret logging, embedded video credentials, and unnecessarily broad cleartext access.

Why third: credentials can be recovered from logs/source, and cleartext traffic can be observed or altered.

### Priority 4: Detector setting validation and tests

Validate safety-related setting values and add automated checks for protocol logic.

Why fourth: once the connection flow is correct, tests protect it from regression and stop invalid writes.

---

# 1. Keep The Correct BLE Device After Login

## Current behavior

`Login1.jsx` performs login, then calls `forceRefreshGatt(device)`. In `bleService.js`, that function disconnects from the old connection and creates a newly connected `fresh` device object.

After this succeeds, `Login1.jsx` calls `onLogin()` without sending the `fresh` device back to `App.js`. As a result, the dashboard can continue receiving the older disconnected device object.

## Why this is a problem

The screen can show the user as logged in, while later BLE reads and writes fail because the components use the old device handle. This can look like random failures in Environmental, Device Info, Alerts, or Settings.

## Recommended improvement

When login completes after GATT refresh, update the top-level connected device to the refreshed device. A longer-term improvement is to place BLE connection/session ownership in one service or React context, rather than keeping related state in both `Navbar` and `App`.

## Conceptual change

Instead of only signaling that login succeeded:

```js
onLogin();
```

The login success flow should give the refreshed connection back to the state owner:

```js
onLogin(refreshedDevice);
```

Then the application should store that returned device before showing tabs.

## Helpful comment to add near the future fix

```js
// GATT refresh reconnects the detector and returns a new active Device object.
// Store this refreshed object so dashboard BLE operations never use the cancelled connection.
```

## Benefit

- Prevents logged-in screens from operating on a stale connection.
- Reduces confusing intermittent BLE read/write errors.
- Makes reconnect behavior predictable.

---

# 2. Do Not Mark The App Connected When Connect Failed

## Current behavior

`connectToSelectedDevice()` returns `null` when connection or service discovery fails. In `Navbar.jsx`, the selected-device handler currently proceeds to set the Bluetooth status and call `onBleConnected(connected)` without confirming that `connected` is a real device.

`App.js` then sets `isConnected` to `true` even when the device value may be `null`.

## Why this is a problem

A user may be shown the login screen and connected icon after a failed connection. The next action produces errors such as "No device connected" even though the app showed a successful connection.

## Recommended improvement

Treat failure as failure at one clear boundary:

- Either make `connectToSelectedDevice()` throw an error on failure, and handle it in `Navbar`.
- Or check `if (!connected)` before updating any connected state.

Only call `onBleConnected()` after connection and service discovery are complete.

## Helpful comment to add near the future check

```js
// Do not update UI connection state until BLE connection and service discovery succeeded.
// A null device means the connection attempt failed and the user must remain disconnected.
```

## Benefit

- UI state matches the actual detector connection.
- Error handling becomes simpler for Login and Tabs.
- Prevents the app from entering an impossible state: connected without a device.

---

# 3. Add Unexpected Disconnect Handling

## Current behavior

The UI resets state when the user presses the Bluetooth button to disconnect. During review, no listener was found that responds when the detector disconnects unexpectedly, such as lost range, battery loss, or Bluetooth being turned off.

## Why this is a problem

The app can continue displaying stale readings or allow setting controls after the device is no longer connected. For a detector dashboard, stale status can be misleading.

## Recommended improvement

Register a BLE disconnection listener after connection succeeds. When the connected detector disconnects:

- stop active notification subscriptions,
- clear the current device,
- set connected/login state to false,
- show a clear message such as "Detector disconnected".

## Helpful comment to add near the future listener

```js
// A BLE link can drop without the user pressing Disconnect.
// Reset session state immediately so the dashboard never presents stale live data as connected.
```

## Benefit

- The app reflects real device availability.
- Operators receive immediate feedback when monitoring is interrupted.
- Reduces follow-on BLE failures after link loss.

---

# 4. Fix Alert Notification Byte Order

## Current behavior

`alertNotificationService.js` reads the alert status once with a big-endian helper. The same service subscribes to live alert updates using `monitorUint16LECharacteristic()`, which decodes the two bytes in little-endian order.

The import list mentions a big-endian monitor helper, but that helper is not implemented in `bleService.js`.

## Why this is a problem

An alert bitmask must be decoded consistently. For example, bytes representing one alarm flag can become a completely different bit flag if the order is reversed. Initial display and live notification display may disagree.

## Recommended improvement

Implement `monitorUint16BECharacteristic()` in `bleService.js` using `bytes.readUInt16BE(0)`, and use it for alert status notifications. Keep environmental characteristics on the byte order required by their protocol.

## Helpful comments to add near the future code

```js
// Alert Status is a UInt16 big-endian bitmask according to this device protocol.
// Read and NOTIFY decoding must use the same byte order or alarm flags will be wrong.
```

```js
// Environmental values use their protocol-specific endian format; do not reuse
// an alert decoder unless the characteristic definition matches exactly.
```

## Benefit

- Live alarm indication matches initial alarm reading.
- Avoids displaying the wrong detector condition.
- Makes protocol assumptions explicit and testable.

---

# 5. Own And Clean Up Every BLE Notification Subscription

## Current behavior

`Environmental.jsx` stores both methane and temperature subscriptions. Its cleanup function removes the methane subscription but does not remove the temperature subscription on component cleanup/device change.

`bleService.js` also starts a Service Changed notification during device connection without preserving the returned subscription for later cleanup.

A repository TODO describes an Android native crash associated with BLE NOTIFY cancellation/disconnect. A `patch-package` patch attempts to correct native rejection behavior, but JavaScript should still cleanly own subscriptions.

## Why this is a problem

Subscriptions that remain active can:

- call state updates after a component is gone,
- receive data from an obsolete device session,
- complicate reconnection,
- increase exposure to native BLE disconnect failures.

## Recommended improvement

Adopt one ownership rule: every call to `monitorCharacteristicForService()` must have a recorded subscription and a known cleanup path.

At minimum:

- remove both methane and temperature subscriptions in `Environmental` cleanup,
- store and remove the Service Changed subscription,
- remove notifications before intentional disconnect,
- clear notification state when a device changes or disconnects.

A BLE session manager would make this easier by holding all subscriptions in one place.

## Helpful comment to add near each monitor call

```js
// Subscription ownership: this component/session must call remove() before
// disconnect or unmount so no listener survives the active BLE session.
```

## Benefit

- Reduces stale callbacks and crashes around disconnect.
- Makes notification lifecycle easier to reason about.
- Supports clean reconnection to another detector.

---

# 6. Remove Passkey Logging

## Current behavior

`loginService.js` converts the passkey into base64 and logs the encoded payload.

## Why this is a problem

Base64 is reversible encoding, not encryption. Anyone who reads application logs can recover the detector passkey. Logs are often captured during debugging, crash reports, or device support sessions.

## Recommended improvement

Do not log authentication payloads or raw passkeys. Log only safe events such as whether the operation succeeded or failed.

## Helpful comment to add near the future write operation

```js
// Never log the passkey or encoded payload. Base64 values can be decoded back to the secret.
```

## Benefit

- Protects device access credentials.
- Makes debug output safer to share.
- Reduces credential leakage risk during support work.

---

# 7. Replace Embedded Camera Credentials And Limit HTTP Access

## Current behavior

`VideoStream.jsx` includes a camera URL containing the username and password directly in source code:

```text
http://fgcam:admin@10.42.0.1/live_mjpeg.html
```

`app.json` also enables cleartext HTTP traffic broadly for Android.

## Why this is a problem

Credentials in a URL can appear in source control, JavaScript bundles, debug logs, WebView navigation history, or network inspection. Plain HTTP does not protect credentials or video data from interception or modification on the local network.

## Recommended improvement

Preferred order:

1. Use camera firmware support for HTTPS or another secure authenticated stream, if available.
2. Avoid placing username/password directly in the URL.
3. If the detector camera can only use HTTP, narrowly scope cleartext access to only the necessary host and do not log authenticated URLs.
4. Store any non-public configuration separately from UI source code; do not treat bundling as secret storage.

## Helpful comment to add if HTTP remains required

```js
// This detector camera currently requires local HTTP streaming.
// Do not include credentials in logs, and keep cleartext network access scoped to this endpoint only.
```

## Benefit

- Reduces credential exposure.
- Restricts unnecessary insecure network behavior.
- Makes security limitations deliberate and documented.

---

# 8. Validate Safety-Related Detector Settings Before Writing

## Current behavior

`DeviceSettings.jsx` checks several input values only as positive integers. The service writes these values as UInt16 data. It does not visibly enforce an upper bound of `65535` or relationships between values such as warning/alarm/full-scale thresholds.

## Why this is a problem

Out-of-range data may fail, wrap, or be rejected by firmware. More importantly, inconsistent alert thresholds can result in confusing or unsafe detector behavior.

## Recommended improvement

Define protocol validation rules in one reusable function before any write. Confirm the exact firmware requirements, then enforce rules such as:

- UInt16 values must be integers from `0` through `65535`, or narrower protocol ranges.
- Alarm and warning levels must not exceed full scale.
- Warning/alarm ordering must match the firmware/business rule.
- Time values must remain within documented acceptable bounds.

Show a specific validation error before performing a BLE write.

## Helpful comment to add near future validation

```js
// Validate detector safety settings before sending them over BLE.
// The UI must not write values outside the firmware range or invalid threshold ordering.
```

## Benefit

- Prevents invalid configuration writes.
- Produces clearer user errors.
- Protects safety-related detector behavior from accidental misconfiguration.

---

# 9. Request Android BLE Permissions By Android Version

## Current behavior

`androidService.js` requests Bluetooth scan, Bluetooth connect, and fine location permissions together for Android devices.

## Why this is a problem

Android BLE permission requirements differ by operating system version. Asking for unnecessary location permissions creates user distrust and may increase denied permission rates. Requesting the wrong combination can also lead to inconsistent scanning behavior across devices.

## Recommended improvement

Branch permission logic by Android API level:

- Android 12 and later: request the modern Bluetooth scan/connect permissions as required.
- Earlier Android versions: request location permission when required for BLE scan discovery.
- Document whether this app derives physical location from BLE; request only what the product actually needs.

## Helpful comment to add near future permission logic

```js
// BLE runtime permissions changed in Android 12 (API 31).
// Request only the permissions needed for this OS version and scan behavior.
```

## Benefit

- Better Android compatibility.
- Fewer unnecessary permission prompts.
- Easier explanation to users reviewing app permissions.

---

# 10. Clean Up The Native BLE Patch

## Current behavior

`patches/react-native-ble-plx+3.5.0.patch` includes the meaningful native Android rejection-code fix, but it also includes Eclipse/Buildship project metadata files generated under `node_modules`.

## Why this is a problem

Editor-specific generated files make a dependency patch noisy and harder to review. They can make future upgrades more difficult because it becomes unclear which patch content is required for runtime correctness.

## Recommended improvement

Retain only the required native code changes that fix BLE error rejection behavior, unless there is a confirmed build reason to include other files.

Also document:

- the crash symptom,
- the patched dependency version,
- how to reproduce/verify the fix,
- whether a later upstream package version removes the need for the patch.

## Helpful comment for patch documentation

```text
This patch exists to prevent an Android native BLE error path from rejecting a Promise
with a null error code during notification/disconnection handling. Remove it only after
verifying the issue is fixed by an upgraded dependency on a real Android device.
```

## Benefit

- Keeps dependency modifications auditable.
- Makes future library upgrades safer.
- Avoids carrying local editor artifacts in a production patch.

---

# 11. Add Automated Tests For Protocol And Session Logic

## Current behavior

No application-level test files or test/lint scripts were identified during the review.

## Why this is a problem

BLE applications contain protocol details that are easy to break accidentally: byte order, allowed value ranges, state transitions, and cleanup behavior. Manual testing alone may miss a regression until it is tested on real hardware.

## Recommended improvement

Start with small tests for pure logic and state rules, before attempting full BLE hardware automation.

Recommended first tests:

- Big-endian alert byte decoding returns the expected alert bitmask.
- Little-endian environmental decoding remains correct.
- A failed connection never sets connected state.
- A login GATT refresh replaces the active device reference.
- Detector setting validation rejects invalid values and threshold relationships.
- Subscription cleanup removes every active monitor on disconnect/unmount.

Then maintain a manual hardware verification checklist for real device scenarios:

- connect and login,
- scan timeout/no device found,
- deliberate disconnect,
- unexpected detector power loss,
- notification active during disconnect,
- alarm event received live,
- setting change read-back verification,
- camera stream authentication and refresh.

## Helpful comment near testable decoding functions

```js
// Keep byte decoding as a small deterministic function so protocol behavior can be unit-tested.
```

## Benefit

- Prevents repeats of subtle byte-order and state bugs.
- Makes refactoring safer.
- Reduces the amount of hardware-only debugging.

---

# 12. Medium Priority Maintainability Improvements

These improvements matter, but should follow the correctness and security work above.

## A. Use one BLE session owner

Currently connection state is divided between UI components and services. A session context or hook can own:

- current device,
- connection phase (`disconnected`, `scanning`, `connecting`, `authenticating`, `ready`, `error`),
- subscriptions,
- connect/disconnect/reconnect actions,
- last user-visible BLE error.

Benefit: fewer contradictory state combinations and simpler screens.

## B. Replace heavy debug logs with controlled logging

The code contains extensive logs for characteristic data and UI actions. Keep useful diagnostics, but gate verbose binary/service dumps behind development mode and never log secrets.

Benefit: clearer production diagnostics and less exposure of device information.

## C. Remove unused or unfinished behavior from production UI until ready

`Tabs.jsx` exposes Battery, Logs, and Firmware pages as placeholders. Keep them only if communicating planned features is desirable for the current audience; otherwise hide incomplete operations from production users.

Benefit: reduces user confusion and keeps the interface focused on working detector functions.

## D. Normalize comments and encoding

Some comments/log strings appear with corrupted characters when read from the repository. Favor consistent UTF-8 handling, or ASCII-only diagnostic messages if compatibility is a concern.

Benefit: source code and logs remain readable across Windows terminals, editors, and build systems.

---

## Practical Implementation Checklist

Use this checklist when beginning implementation work:

- [ ] Pass the refreshed BLE device back to `App.js` after login.
- [ ] Refuse to set connected state if connection returns `null` or discovery fails.
- [ ] Add unexpected disconnect handling and reset session/UI state.
- [ ] Implement big-endian alert notification decoding and verify alert bit masks.
- [ ] Remove methane, temperature, alert, axis, and Service Changed subscriptions reliably.
- [ ] Remove passkey/base64 credential logs.
- [ ] Remove URL-embedded camera credentials and review HTTP requirement.
- [ ] Narrow Android cleartext networking if HTTP is unavoidable.
- [ ] Add protocol-aware validation for detector setting writes.
- [ ] Branch Android BLE permissions by OS version.
- [ ] Reduce the `react-native-ble-plx` patch to required source fixes only.
- [ ] Add tests for decoding, session state transitions, setting validation, and cleanup.
- [ ] Perform a real Android detector test pass after BLE changes.

---

## A Note On Change Strategy

Because this app communicates with physical detector hardware, improvements should be made in small verified steps:

1. Correct connection/session handling first.
2. Validate reads and live notifications against known detector values.
3. Validate writes against firmware requirements before enabling them broadly.
4. Test disconnect/reconnect behavior with active notifications.
5. Address network credential handling before distribution outside controlled testing.

This order improves reliability while keeping each change understandable and testable.
