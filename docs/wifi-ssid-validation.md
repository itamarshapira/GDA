# Android Location activation and live Wi-Fi header

## Scope and verified baseline

The prior diagnostics were physically tested **by the project owner**: Location
OFF made the phone SSID unavailable; Location ON returned matching
`FGASD-0794` device/phone SSIDs, fine permission granted and Wi-Fi enabled.
That validates the earlier SSID approach on that phone, not this new prompt/UI.

This implementation uses the already installed NetInfo **11.4.1** and
expo-location **19.0.8** (compatible with the installed SDK 54 mapping,
`~19.0.7`). No dependencies were installed for this step. The prior local
permission/dependency changes remain intact. No native source, launcher icon,
Gradle configuration, app version, login, calibration, camera authentication,
or Zoom implementation was changed.

## Connect flow

Welcome -> App's `navbarRef.current.startConnection()` -> Navbar's
`handleBluetoothPress({ connectOnly: true })`.

Navbar Connect enters that same handler:

1. Existing immediate action/picker refs prevent overlapping operations.
2. Existing Bluetooth ON check stays first.
3. An already-connected Navbar press disconnects and returns **before** permissions
   or Location activation. Welcome remains connect-only.
4. Existing `requestBlePermissions()` runs. Coarse is now paired with fine
   in its runtime request, as Android 12+ requires. Fine is still required
   by the existing BLE permission policy; approximate-only is not enough.
5. `prepareLocationForConnection()` checks global Location. If OFF, it makes
   one `enableNetworkProviderAsync()` attempt, then checks again.
6. Existing scanning/retry -> device picker -> connection -> Login1 ->
   Detector/Source routing continues. The Location result is **not** a gate.

There is no startup/splash/Welcome-render prompt, no activation on disconnect,
and no automatic Settings redirect. No GPS coordinates, continuous location
tracking or background-location permission are requested.

Expo's native request uses Google Play Services network/high-accuracy settings,
not a guaranteed toggle of Android's global Location switch. Acceptance without
an enabled switch, rejection, cancellation, unsupported configuration or check
failure leave Location false/unknown. All these settled outcomes allow BLE to
continue. The action guard stays held until the request settles; a shared promise
also prevents overlapping native activation requests. Scan retries never repeat
the dialog. Another explicit Connect attempt may try again.

Some Android versions themselves need Location enabled for BLE discovery. The
new feature adds no additional BLE requirement but cannot bypass that OS rule.

## Shared device data and lifecycle

- `Tabs` / `SourceTabs` each own `useDeviceInformation`, passing their
  existing `readDeviceInformation` / `readSourceDeviceInformation` reader.
- One initial existing **full Info read** now belongs to the connected dashboard,
  not the conditionally mounted Info tab. Default Info already initiated this
  read before this change; it is not an additional competing query.
- The promise/result is cached for that dashboard's connected-device object.
  Even effect replay shares the pending promise. A tab/video remount does not
  re-read Info. Failures are not retried automatically; reconnect to start a
  new session if the initial read fails.
- Both Info tabs receive `info` and `error` as props. The same result's SSID
  feeds the Wi-Fi hook. This works even if Info is hidden before the read ends.
- A device replacement immediately hides old data; cleanup ignores late results.
  Disconnect before the deferred read starts prevents it from starting. Once
  running, the existing multi-step native reader cannot be cancelled by this
  hook; its late result is ignored. BLE services/characteristics are unchanged.
- One `useWifiSsidDiagnostics` monitor lives at dashboard level, independent
  of Info or VideoStream mounting. It returns status instead of just logging.

The **device SSID** is the expected hotspot name read over BLE. The **phone
SSID** is independently returned by Android via `NetInfo.fetch("wifi")`.

NetInfo 11.4.1 performs a fresh native Wi-Fi-details read for that explicit
interface. Its `isConnected` still describes the **default network**.
This implementation does not infer hotspot membership from that flag,
`type`, Internet reachability, or WebView events. Cellular being the default
route is **not** proof of Wi-Fi disconnection.

The monitor checks on mount, network events, foreground return (including
Settings), and every five seconds while foregrounded. Polling is necessary
because default-network events can miss hotspot changes while cellular remains
the default. Returning from Settings rechecks both permission and Location.

Checks coalesce while one native read is in flight. A network event or
background transition invalidates the previous result immediately; late
pre-event results are discarded. Normal quick polls retain the last snapshot
while reading; a stalled read is invalidated at the next polling tick. Android
updates are not instantaneous, so no-event transitions may take roughly five
seconds plus native-read time to appear. There is no background timer. Cleanup
removes both listeners and the foreground timer.

## Icon rules and interaction

The existing 42px Camera Header remains the same height. The new background-free
Wi-Fi target is 44x42px, separated by 6px from the unchanged refresh button.
It has no overlapping hitSlop. Green matches Navbar's `#0ee50be2`.

| Evidence | Icon |
|---|---|
| Fine permission + Location ON + Wi-Fi ON + usable phone/device SSIDs equal | Green `wifi` |
| Same readable prerequisites, but actual phone SSID differs | White `wifi-off` |
| Native check explicitly reports Wi-Fi disabled | White `wifi-off` |
| Checking, missing/redacted SSID, unavailable BLE SSID, denied/approximate permission, Location OFF, read failure or ambiguous result | Gray `wifi` |

Permission/native failures return Unknown before a reliable radio reading is
available. An explicit radio-off result discards any stale accompanying SSID,
even if Location is off or the expected SSID has not arrived.

A match is only SSID equality, **not** camera reachability, authentication,
fresh video, or unique device identity. Multiple APs can share an SSID.

- White: tap to open the existing Android Wi-Fi settings workflow.
- Gray: tap for a brief explanation. Location/permission cases offer a separate,
  explicit Settings button. No runtime/activation prompt is launched by the icon.
- Green: tap for a brief SSID-match explanation, including the camera-health caveat.

The passive monitor never asks permission. The service retains its explicit
`requestPermission` option for callers/tests, but dashboard calls always pass
false. Permission and global Location are checked each time; a stale cached
permission grant cannot survive Settings revocation.

New `[WiFiSSID]` diagnostics are **development-only**, log changes/resume only,
and contain permission, Location/radio state, SSID availability and reason—not
full SSIDs/device IDs. Existing BLE-service and video diagnostics are unchanged;
those older logs may still contain identifiers, so redact shared logs.

## Physical Android test checklist

Build/install a new APK if the installed binary predates expo-location or
NetInfo. Metro cannot add a native module to an old APK. If those native modules
were already included, these changes add no further native configuration, but a
Release APK still needs rebuilding to package the new JavaScript.

```powershell
cd C:\Users\Yizur\Desktop\GDA\android
$env:NODE_ENV = "production"
.\gradlew.bat :app:assembleRelease
```

APK: `android/app/build/outputs/apk/release/app-release.apk`.
Use your normal local installation workflow; do not uninstall just to test.

Test on both Detector and Source where available:

1. Launch app with Location OFF: no startup/splash/Welcome-render prompt.
2. Connect from **Welcome**, then separately from **Navbar**:
   - Location ON: no activation dialog.
   - Location OFF, accept: scan/picker continues; verify Android's Location switch.
   - Location OFF, decline/back: scan/picker continues where the OS permits it.
   - Unsupported/no Google Play Services: no blocking app error or redirect.
   - Rapid taps and empty-scan retry: at most one dialog per connection attempt.
3. Select/login, then immediately leave Info. Confirm the header still resolves.
   Switch tabs/Settings repeatedly; Info must reuse the same session data.
4. Check these icon states:

   | Phone setup | Expected |
   |---|---|
   | Connected to the BLE-reported hotspot | Green after Android exposes matching SSID |
   | Other readable Wi-Fi SSID | White crossed-out |
   | Correct hotspot with no Internet, cellular enabled/default | Still green if SSID verified |
   | Wi-Fi OFF, permission allows native check | White crossed-out |
   | Location OFF, Wi-Fi ON | Gray |
   | Missing/redacted phone SSID, missing device SSID or read error | Gray |
   | Denied/blocked/approximate-only location permission | Gray, no repeated prompts |

5. Switch Wi-Fi while cellular stays default. Check foreground polling updates.
   Background the app, change Wi-Fi/Location, return: gray until freshly verified,
   then the correct icon. No automatic permission prompts.
6. Tap white: Wi-Fi Settings. Tap gray with Location OFF: explanation first;
   only **Open Settings** redirects. Return after enabling Location: recheck.
7. Disconnect using Navbar: no Location prompt. Reconnect another device (also
   test same-device reconnect): never retain the previous device's green status.
8. Confirm manual refresh, video authentication, Zoom In/Out, Alignment/Zero
   Calibration and tab navigation still behave as before. Verify icon alignment,
   hit targets, and accessibility labels on the actual screen.

Important limitations:

- The existing BLE permission policy can prevent reaching the dashboard if fine
  permission is denied. That policy was not relaxed. Android may restart the app
  when precise permission is changed to approximate, dropping BLE.
- Android/OEM redaction remains possible despite enabled Location/permissions.
  Unavailable SSID alone never proves disconnection.
- NetInfo strips quotes from SSIDs. A BLE SSID containing quotes is comparison-
  unknown. Arbitrary/non-UTF-8 names and whitespace altered by existing BLE
  decoding need separate device validation.
- A failed initial Info read remains failed for this session; tab switching no
  longer serves as an implicit retry. Reconnect to retry.
- The system prompt's exact wording/behavior, older-Android BLE availability,
  actual no-Internet hotspot routing, and touch layout require physical testing.

## Local verification

```powershell
cd C:\Users\Yizur\Desktop\GDA
node --test tests/wifiSsid.test.cjs tests/locationConnection.test.cjs
git diff --check
```

Tests exercise the real JS modules with mocked native APIs and a small hook/JSX
harness built with existing Babel. They cover activation, ordered connect checks,
disconnect bypass, duplicate guards, state mapping, lifecycle races, Info-read
deduplication, privacy, explicit settings actions and preserved refresh behavior.
They are not React Native rendering or physical-device tests.

Implementation verification: **35 tests passed**, all **43 JS/JSX source files**
parsed, and `git diff --check` passed. Protected-code comparisons confirmed
unchanged video URLs, refresh/effects/WebView, Zoom handling and Info markup/styles.
The Release JS bundle, manifest processing, NetInfo Java and Expo Kotlin/Java
compilation succeeded; generated registration includes `LocationModule` and
`NetInfoPackage`. No full APK was assembled/installed and no new physical-device
test was performed by the assistant. Existing Gradle/manifest and dependency-data
warnings were non-blocking; no dependency updates were made to silence them.

A before/after file-hash audit found only the 15 files listed below changed/added.
Native source/resources, package files, app config, BLE services and unrelated
files were unchanged in this step. No temporary source files were created or
files deleted; Gradle generated its normal ignored build outputs/caches.

Native verification (not an APK installation):

```powershell
cd C:\Users\Yizur\Desktop\GDA\android
$env:NODE_ENV = "production"
.\gradlew.bat :app:processReleaseMainManifest :react-native-community_netinfo:compileReleaseJavaWithJavac :expo:compileReleaseJavaWithJavac --console=plain
```

This project consumes expo-location as a prebuilt Expo Android dependency, so
`:expo-location:compileReleaseKotlin` is not an available Gradle project/task.
Verify the generated `ExpoModulesPackageList` includes `LocationModule`
and compile `expo` instead. Manifest processing also bundles Release JavaScript.
Build caches/generated files are expected outputs; this does not assemble a full
APK. No native source regeneration or new permissions were needed in this step.

### Files changed in this step

- `src/services/locationSettingsService.js` (new): best-effort native activation.
- `src/components/Navbar/Navbar.jsx`: one call in the shared connect-only branch.
- `src/services/androidService.js`: pair coarse/fine in the existing request.
- `src/hooks/useDeviceInformation.js` (new): session-owned shared Info read/cache.
- `src/hooks/useWifiSsidDiagnostics.js`: passive dashboard status/lifecycle.
- `src/services/wifiSsidService.js`: global Location check and evidence-to-icon rules.
- `src/components/Tabs/Tabs.jsx`, `src/components/SourceTabs/SourceTabs.jsx`:
  own shared Info/status and pass them to children.
- `src/components/Tabs/DeviceInfo/DeviceInfo.jsx`,
  `src/components/SourceTabs/SourceDeviceInfo/SourceDeviceInfo.jsx`:
  render shared data; no independent read/monitor.
- `src/components/Video/VideoStream.jsx`: compact icon, accessibility and tap help.
- `tests/wifiSsid.test.cjs`: expanded service/lifecycle/header tests.
- `tests/locationConnection.test.cjs` (new): prompt/connect integration tests.
- `tests/testHarness.cjs` (new): shared test-only mocks/hook harness.
- `docs/wifi-ssid-validation.md`: this architecture/testing guide.

Existing `package.json`, lockfile, `app.json` and native manifest changes from
the previous step/user installation are preserved, not modified by this step.

API references:
[Expo Location settings API](https://docs.expo.dev/versions/latest/sdk/location/#locationenablenetworkproviderasync),
[Android runtime location permissions](https://developer.android.com/develop/sensors-and-location/location/permissions/runtime),
[Android WifiInfo SSID redaction](https://developer.android.com/reference/android/net/wifi/WifiInfo#getSSID()).
Installed native/JS sources were inspected to verify version-specific behavior.
