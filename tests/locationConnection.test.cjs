const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { load, hooks, find, flush, deferred } = require("./testHarness.cjs");

function location(options = {}) {
  let enabled = options.enabled ?? false;
  const calls = [];
  const api = load("src/services/locationSettingsService.js", {
    "react-native": { Platform: { OS: options.os || "android" } },
    "expo-location": {
      hasServicesEnabledAsync: async () => {
        calls.push("check");
        if (options.checkError) throw new Error("Unsupported");
        return enabled;
      },
      enableNetworkProviderAsync: async () => {
        calls.push("prompt");
        if (options.prompt) return options.prompt();
        if (options.reject) throw new Error("Declined / Play Services unavailable");
        enabled = options.enableAfterPrompt ?? true;
      },
    },
  });
  return { ...api, calls };
}

test("Location already ON skips dialog; OFF prompts once and verifies actual state", async () => {
  for (const [options, result, calls] of [
    [{ enabled: true }, true, ["check"]],
    [{}, true, ["check", "prompt", "check"]],
    [{ enableAfterPrompt: false }, false, ["check", "prompt", "check"]],
    [{ reject: true }, false, ["check", "prompt", "check"]],
    [{ checkError: true }, null, ["check"]],
    [{ os: "ios" }, null, []],
  ]) {
    const l = location(options);
    assert.equal(await l.prepareLocationForConnection(), result);
    assert.deepEqual(l.calls, calls);
  }
});

test("Concurrent activation requests share one native dialog; later explicit attempt can retry", async () => {
  const pending = deferred();
  const l = location({ prompt: () => pending.promise });
  const first = l.prepareLocationForConnection();
  const second = l.prepareLocationForConnection();
  assert.equal(first, second);
  await flush();
  assert.equal(l.calls.filter(call => call === "prompt").length, 1);
  pending.reject(new Error("User cancelled"));
  assert.equal(await first, false);
  assert.equal(await second, false);
  await l.prepareLocationForConnection();
  assert.equal(l.calls.filter(call => call === "prompt").length, 2);
});

function navbar(options = {}) {
  const h = hooks(), calls = [], ref = { current: null };
  const l = location(options.location);
  const device = { id: "device-1", name: "FGASD794" };
  const animation = { start: fn => fn?.() };
  const { default: Navbar } = load("src/components/Navbar/Navbar.jsx", {
    react: h.react,
    "react-native": {
      View: "View", Text: "Text", Image: "Image", TouchableOpacity: "Button",
      ActivityIndicator: "Spinner", Modal: "Modal", FlatList: "List",
      Animated: {
        View: "AnimatedView", timing: () => animation,
        Value: class { setValue() {} interpolate() {} },
      },
    },
    "./NavbarStyles": {},
    "@expo/vector-icons": { MaterialCommunityIcons: "Icon" },
    "expo-linear-gradient": { LinearGradient: "Gradient" },
    "../../../assets/wideLogo.png": "logo",
    "../../services/bleService": {
      manager: {
        state: async () => { calls.push("bluetooth"); return options.bluetooth || "PoweredOn"; },
        onDeviceDisconnected: () => ({ remove() {} }),
      },
      scanForFGDevices: async () => { calls.push("scan"); return options.emptyScan ? [] : [device]; },
      connectToSelectedDevice: async () => { calls.push("connect"); return device; },
      disconnectDevice: async () => { calls.push("disconnect"); return true; },
    },
    "../../services/androidService": { requestBlePermissions: async () => {
      calls.push("permissions"); return options.granted !== false;
    } },
    "../../services/locationSettingsService": { prepareLocationForConnection: async () => {
      calls.push("location"); return l.prepareLocationForConnection();
    } },
    "../../services/loginService": {},
  }, {
    console: { log() {} }, setTimeout: () => 1, clearTimeout() {},
  });
  const props = {
    onBleConnected: (_, type) => calls.push(`connected:${type}`),
    onBleDisconnected: () => calls.push("disconnected"),
  };
  const render = () => h.render(() => Navbar(props, ref));
  const pressNavbar = () => {
    const button = find(render(), node => node.type === "Button" && node.children[0]?.props?.size === 40);
    return button.props.onPress();
  };
  render();
  return {
    calls, locationCalls: l.calls, render,
    welcome: () => ref.current.startConnection(),
    pressNavbar,
    select: () => find(render(), node => node.type === "List").props.renderItem({ item: device }).props.onPress(),
    cancel: () => find(render(), node => node.type === "Modal").props.onRequestClose(),
    unmount: h.unmount,
  };
}

test("Mount never prompts; Welcome and Navbar connect use identical ordered checks", async () => {
  for (const entry of ["welcome", "pressNavbar"]) {
    const h = navbar();
    assert.deepEqual(h.calls, []);
    assert.deepEqual(h.locationCalls, []);
    await h[entry]();
    assert.deepEqual(h.calls, ["bluetooth", "permissions", "location", "scan"]);
    assert.deepEqual(h.locationCalls, ["check", "prompt", "check"]);
    h.unmount();
  }
});

test("Declined, ineffective, or failed Location activation never prevents existing BLE scan", async () => {
  for (const settings of [{ reject: true }, { enableAfterPrompt: false }, { checkError: true }]) {
    const h = navbar({ location: settings, emptyScan: true });
    await h.welcome();
    assert.equal(h.calls.filter(call => call === "scan").length, 2, "Original empty-scan retry preserved");
    assert.equal(h.calls.filter(call => call === "location").length, 1, "No repeated dialog on retry");
    assert(!h.calls.includes("connected:detector"));
    h.unmount();
  }
});

test("Bluetooth off or denied BLE permissions never reach Location activation", async () => {
  for (const options of [{ bluetooth: "PoweredOff" }, { granted: false }]) {
    const h = navbar(options);
    await h.welcome();
    assert(!h.calls.includes("location"));
    assert(!h.calls.includes("scan"));
    h.unmount();
  }
});

test("Rapid Welcome/Navbar taps cannot overlap dialogs or scans; picker cancel permits retry", async () => {
  const pending = deferred();
  const h = navbar({ location: { prompt: () => pending.promise } });
  const first = h.welcome();
  await flush();
  await h.pressNavbar();
  await h.welcome();
  assert.equal(h.locationCalls.filter(call => call === "prompt").length, 1);
  assert(!h.calls.includes("scan"));
  pending.resolve();
  await first;
  await h.welcome(); // Open picker also blocks duplicate operations.
  assert.equal(h.calls.filter(call => call === "scan").length, 1);
  h.cancel();
  await h.welcome();
  assert.equal(h.calls.filter(call => call === "scan").length, 2);
  h.unmount();
});

test("After selection, Welcome cannot disconnect and Navbar disconnect never checks Location", async () => {
  const h = navbar();
  await h.welcome();
  await h.select();
  assert(h.calls.includes("connected:detector"));
  const before = h.calls.length;
  await h.welcome();
  assert.equal(h.calls.length, before);
  await h.pressNavbar();
  assert.deepEqual(h.calls.slice(before), ["bluetooth", "disconnect", "disconnected"]);
  assert.equal(h.calls.filter(call => call === "location").length, 1);
  h.unmount();
});

test("BLE permission request keeps its existing contract and pairs coarse/fine", async () => {
  let requested;
  const api = load("src/services/androidService.js", {
    "react-native": {
      Platform: { OS: "android" },
      PermissionsAndroid: {
        PERMISSIONS: { BLUETOOTH_SCAN: "scan", BLUETOOTH_CONNECT: "connect", ACCESS_COARSE_LOCATION: "coarse", ACCESS_FINE_LOCATION: "fine" },
        RESULTS: { GRANTED: "granted" },
        requestMultiple: async list => {
          requested = list;
          return Object.fromEntries(list.map(key => [key, "granted"]));
        },
      },
    },
  }, { console: { log() {}, error() {} } });
  assert.equal(await api.requestBlePermissions(), true);
  assert.deepEqual(requested, ["scan", "connect", "coarse", "fine"]);
});

test("Both dashboards share Info data with video; Info tabs no longer own reads or monitors", () => {
  const read = name => fs.readFileSync(path.resolve(__dirname, "..", name), "utf8");
  for (const [dashboard, info, reader] of [
    ["Tabs/Tabs.jsx", "Tabs/DeviceInfo/DeviceInfo.jsx", "readDeviceInformation"],
    ["SourceTabs/SourceTabs.jsx", "SourceTabs/SourceDeviceInfo/SourceDeviceInfo.jsx", "readSourceDeviceInformation"],
  ]) {
    const code = read(`src/components/${dashboard}`);
    assert.match(code, new RegExp(`useDeviceInformation\\([\\s\\S]*?device, ${reader}`));
    assert.match(code, /useWifiSsidDiagnostics\(device, deviceInformation\.info\?\.ssid\)/);
    assert.match(code, /<VideoStream[^>]*wifiStatus=\{wifiStatus\}/);
    assert.match(code, /<\w*DeviceInfo \{\.\.\.deviceInformation\}/);
    assert.doesNotMatch(read(`src/components/${info}`), /useWifiSsidDiagnostics|readDeviceInformation|readSourceDeviceInformation/);
  }
  assert.match(read("App.js"), /navbarRef\.current\?\.startConnection\(\)/);
  assert.doesNotMatch(read("App.js"), /enableNetworkProviderAsync|prepareLocationForConnection/);
});
