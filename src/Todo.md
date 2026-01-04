🚨 BIG TODO — Native BLE NOTIFY Crash Fix (DO NOT FORGET)
❗ What this is about

There is a known native Android crash in react-native-ble-plx related to BLE NOTIFY stream cancellation during device disconnect.

This crash does NOT originate in JavaScript and cannot be fixed at the JS level.

🧨 The symptom (what happens if this is not fixed)

App works normally while connected

NOTIFY (monitorCharacteristic) is active

User disconnects / device disconnects

App crashes immediately

JS try/catch does nothing

Stack trace includes:

PromiseImpl.reject

NullPointerException

BleDisconnectedException

safeMonitorCharacteristicForDevice

🔍 Root cause (important)

BLE NOTIFY is a continuous stream

When a stream ends due to disconnect:

Android BLE sends no error

Internal error == null

react-native-ble-plx native Android code does:

promise.reject(null, errorConverter.toJs(error));

❌ This is illegal in React Native

React Native requires:

Promise.reject(String code, String message)

Passing null causes a native crash before JS is notified.

✅ The fix (already implemented locally)

A native guard was added inside the BLE library:

if (code == null) {
promise.reject("BLE_ERROR", "BLE transaction cancelled");
return;
}

What this does

Translates “stream ended” into a valid rejection

Prevents native crash

Allows clean disconnect

JS code does not need hacks or workarounds

⚠️ Current status (VERY IMPORTANT)

✅ Fix exists locally

❌ Fix is inside node_modules

❌ Fix will be lost on clean install

Any of the following will REMOVE the fix:

npm install

npm ci

deleting node_modules

cloning the repo again

CI / fresh build machine

🛠️ REQUIRED FUTURE ACTION

Before production / CI / clean setup:

Option 1 (Recommended)

Use patch-package to persist the native fix.

Steps:

Install patch-package

Generate patch for react-native-ble-plx

Add postinstall hook

Option 2

Fork react-native-ble-plx and maintain the fix in the fork.

🧠 Why this matters

This is a real native bug

It only appears with NOTIFY + disconnect

It is extremely hard to debug after the fact

Without this fix, the app can crash in the field

🧾 One-sentence summary

The app previously crashed on BLE disconnect because react-native-ble-plx passed a null error into Promise.reject during NOTIFY cancellation; a native guard fixes this, but the fix must be preserved using patch-package or a fork before clean installs.

⛔ DO NOT DELETE THIS TODO
⛔ DO NOT ASSUME “IT’S FIXED FOREVER”
