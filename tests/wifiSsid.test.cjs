// Run with: node --test tests/wifiSsid.test.cjs
// These tests exercise the real JS modules with mocked React Native APIs.
// They do not establish how a particular Android phone exposes its SSID.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { load, hooks, flush, deferred, find } = require("./testHarness.cjs");

function service(options = {}) {
  const calls = { requests: [], fetches: [] };
  const permissions = {
    PERMISSIONS: { ACCESS_FINE_LOCATION: "fine", ACCESS_COARSE_LOCATION: "coarse" },
    check: options.check || (async () => options.granted !== false),
    requestMultiple: async values => {
      calls.requests.push(values);
      return options.request ? options.request() : { fine: options.answer || "denied" };
    },
  };
  const api = load("src/services/wifiSsidService.js", {
    "expo-location": { hasServicesEnabledAsync: async () => {
      if (options.locationError) throw new Error("Location unavailable");
      return options.locationEnabled !== false;
    } },
    "react-native": { PermissionsAndroid: permissions, Platform: { OS: options.os || "android" } },
    "@react-native-community/netinfo": { fetch: async type => {
      calls.fetches.push(type);
      if (options.error) throw new Error("Native read failed");
      return options.state || { isWifiEnabled: true, details: { ssid: "FGD-123" } };
    } },
  });
  return { ...api, calls };
}

test("Existing fine-location grant is reused; force a Wi-Fi-specific native read", async () => {
  const s = service();
  const result = await s.readPhoneWifiSsid({ requestPermission: true });
  assert.equal(result.phoneSsid, "FGD-123");
  assert.equal(result.reason, "ssid-read");
  assert.equal(result.permission, "granted");
  assert.deepEqual(s.calls.requests, []);
  assert.deepEqual(s.calls.fetches, ["wifi"]);
});

test("Runtime request includes coarse AND fine; granted result allows SSID access", async () => {
  const s = service({ granted: false, answer: "granted" });
  assert.equal((await s.readPhoneWifiSsid({ requestPermission: true })).phoneSsid, "FGD-123");
  assert.deepEqual(s.calls.requests, [["coarse", "fine"]]);
});

test("Denied, approximate-only and blocked permission never become disconnected", async () => {
  for (const answer of ["denied", "never_ask_again"]) {
    const s = service({ granted: false, request: async () => ({ coarse: "granted", fine: answer }) });
    const result = await s.readPhoneWifiSsid({ requestPermission: true });
    assert.equal(result.phoneSsid, null);
    assert.equal(result.reason, answer === "denied" ? "precise-location-not-granted" : "permission-blocked");
    await s.readPhoneWifiSsid(); // Later background/event checks cannot prompt.
    assert.equal(s.calls.requests.length, 1);
    assert.equal(s.calls.fetches.length, 0);
  }
});

test("A permission revoked after a previous grant is checked again", async () => {
  const s = service({ granted: false, answer: "granted" });
  await s.readPhoneWifiSsid({ requestPermission: true });
  const result = await s.readPhoneWifiSsid();
  assert.equal(result.permission, "not-granted");
  assert.equal(result.phoneSsid, null);
  assert.equal(s.calls.fetches.length, 1);
});

test("Concurrent permission requests share one native dialog", async () => {
  let finish;
  const dialog = new Promise(resolve => { finish = resolve; });
  const s = service({ granted: false, request: () => dialog });
  const first = s.readPhoneWifiSsid({ requestPermission: true });
  const second = s.readPhoneWifiSsid({ requestPermission: true });
  await Promise.resolve();
  assert.equal(s.calls.requests.length, 1);
  finish({ fine: "granted" });
  assert.equal((await first).phoneSsid, "FGD-123");
  assert.equal((await second).phoneSsid, "FGD-123");
});

test("Radio-off discards any stale SSID", async () => {
  const s = service({ state: { isWifiEnabled: false, details: { ssid: "old-SSID" } } });
  const result = await s.readPhoneWifiSsid();
  assert.equal(result.phoneSsid, null);
  assert.equal(result.reason, "wifi-disabled");
});

test("Unavailable and redacted SSIDs are unknown", async () => {
  for (const ssid of [undefined, null, "", "   ", "<unknown ssid>", '"<unknown ssid>"']) {
    const s = service({ state: { isWifiEnabled: true, details: { ssid } } });
    const result = await s.readPhoneWifiSsid();
    assert.equal(result.reason, "ssid-unavailable");
    assert.equal(s.compareDeviceSsid(result.phoneSsid, "FGD-123"), "unknown");
  }
});

test("Default-network flags and Internet reachability do not override a Wi-Fi SSID read", async () => {
  const s = service({ state: {
    type: "wifi", isConnected: false, isInternetReachable: false,
    isWifiEnabled: true, details: { ssid: "FGD-123" },
  } });
  assert.equal((await s.readPhoneWifiSsid()).phoneSsid, "FGD-123");
});

test("Comparison preserves case/spaces and leaves quote-ambiguous names unknown", () => {
  const s = service();
  assert.equal(s.compareDeviceSsid("FGD", "FGD"), "match");
  assert.equal(s.compareDeviceSsid("fgd", "FGD"), "different");
  assert.equal(s.compareDeviceSsid("FGD ", "FGD"), "different");
  assert.equal(s.compareDeviceSsid("FGD", null), "unknown");
  assert.equal(s.compareDeviceSsid("FGD", 'F"GD'), "unknown");
});

test("Native and permission failures return unknown without throwing", async () => {
  for (const options of [{ error: true }, { check: async () => { throw new Error("permission"); } }]) {
    const result = await service(options).readPhoneWifiSsid();
    assert.equal(result.reason, "read-error");
    assert.equal(result.phoneSsid, null);
  }
});

test("Unsupported platforms do not request Android permissions or read Wi-Fi", async () => {
  const s = service({ os: "ios" });
  assert.equal((await s.readPhoneWifiSsid()).reason, "unsupported-platform");
  assert.equal(s.calls.fetches.length, 0);
  assert.equal(s.calls.requests.length, 0);
});

const verifiedPhone = (ssid = "FGD-123") => ({
  phoneSsid: ssid, wifiEnabled: true, permission: "granted",
  locationEnabled: true, reason: "ssid-read",
});

test("Location OFF or failed check never trusts a possibly cached SSID", async () => {
  for (const options of [{ locationEnabled: false }, { locationError: true }]) {
    const s = service(options);
    const phone = await s.readPhoneWifiSsid();
    assert.equal(phone.phoneSsid, null);
    assert.equal(s.getDeviceWifiStatus(phone, "FGD-123").status, "unknown");
  }
});

test("Header states are evidence-based, including missing and ambiguous inputs", async () => {
  const s = service();
  assert.equal(s.getDeviceWifiStatus(verifiedPhone(), "FGD-123").status, "matched");
  assert.equal(s.getDeviceWifiStatus(verifiedPhone("Other"), "FGD-123").status, "disconnected");
  assert.equal(s.getDeviceWifiStatus(await service({ state: { isWifiEnabled: false } }).readPhoneWifiSsid(), null).status, "disconnected");
  for (const [phone, expected] of [
    [null, "FGD-123"], [verifiedPhone(), null], [verifiedPhone(), 'F"GD-123'],
    [{ ...verifiedPhone(), phoneSsid: "<unknown ssid>" }, "FGD-123"],
    [{ ...verifiedPhone(), wifiEnabled: null }, "FGD-123"],
    [{ ...verifiedPhone(), locationEnabled: false }, "FGD-123"],
    [{ ...verifiedPhone(), permission: "denied" }, "FGD-123"],
    [{ reason: "read-error" }, "FGD-123"],
  ]) assert.equal(s.getDeviceWifiStatus(phone, expected).status, "unknown");
});

function diagnostics(read, development = true) {
  const h = hooks();
  const calls = [], logs = [], listeners = new Set(), appListeners = new Set(), timers = new Map();
  let timerId = 0, subscriptions = 0;
  const defaultDevice = { id: "private-device" };
  const app = { currentState: "active", addEventListener: (_, fn) => {
    appListeners.add(fn);
    return { remove: () => appListeners.delete(fn) };
  } };
  const { default: hook } = load("src/hooks/useWifiSsidDiagnostics.js", {
    react: h.react,
    "react-native": { AppState: app, Platform: { OS: "android" } },
    "@react-native-community/netinfo": { addEventListener: fn => {
      subscriptions++;
      listeners.add(fn);
      return () => listeners.delete(fn);
    } },
    "../services/wifiSsidService": {
      ...service(),
      readPhoneWifiSsid: async options => {
        calls.push(options);
        return read ? read() : verifiedPhone();
      },
    },
  }, {
    __DEV__: development,
    console: { log: (_, json) => logs.push(JSON.parse(json)) },
    setInterval: (fn, delay) => {
      assert.equal(delay, 5000);
      timers.set(++timerId, fn);
      return timerId;
    },
    clearInterval: id => timers.delete(id),
  });
  return {
    calls, logs, listeners, appListeners, timers,
    get subscriptions() { return subscriptions; },
    render: (device = defaultDevice, ssid = "FGD-123") => h.render(() => hook(device, ssid)),
    current: () => h.render(),
    poll: () => [...timers.values()].forEach(fn => fn()),
    network: () => listeners.forEach(fn => fn({ type: "cellular", isConnected: true })),
    appState: state => {
      app.currentState = state;
      appListeners.forEach(fn => fn(state));
    },
    replay: h.replay,
    unmount: h.unmount,
  };
}

test("Shared dashboard monitor compares BLE SSID; cellular events do not mean disconnected", async () => {
  const h = diagnostics();
  assert.equal(h.render().status, "unknown");
  await flush();
  assert.equal(h.current().status, "matched");
  h.network();
  assert.equal(h.current().status, "unknown", "Network changes invalidate old green immediately");
  await flush();
  assert.equal(h.current().status, "matched");
  h.poll();
  await flush();
  assert.equal(h.logs.length, 1, "Unchanged polling should not spam logs");
  assert(h.calls.every(call => call.requestPermission === false));
  assert.equal(h.listeners.size, 1);
  assert.equal(h.timers.size, 1);
  assert(!JSON.stringify(h.logs).includes("FGD-123"));
  assert(!JSON.stringify(h.logs).includes("private-device"));
  h.unmount();
});

test("BLE SSID arrival and tab/video rerenders reuse the same listener and snapshot", async () => {
  const h = diagnostics();
  const device = { id: "same-session" };
  h.render(device, null);
  await flush();
  assert.equal(h.current().reason, "device-ssid-unavailable");
  assert.equal(h.render(device, "FGD-123").status, "matched");
  h.render(device, "FGD-123");
  assert.equal(h.subscriptions, 1);
  assert.equal(h.calls.length, 1);
  h.unmount();
});

test("Background removes timer and verified state; foreground rechecks Location/permission", async () => {
  let phone = verifiedPhone();
  const h = diagnostics(() => phone);
  h.render();
  await flush();
  const before = h.calls.length;
  h.appState("background");
  assert.equal(h.current().status, "unknown");
  assert.equal(h.timers.size, 0);
  h.network();
  h.poll();
  await flush();
  assert.equal(h.calls.length, before);
  phone = { reason: "location-disabled" };
  h.appState("active");
  await flush();
  assert.equal(h.current().reason, "location-disabled");
  assert.equal(h.timers.size, 1);
  phone = verifiedPhone();
  h.appState("background");
  h.appState("active");
  await flush();
  assert.equal(h.current().status, "matched");
  h.unmount();
});

test("Wi-Fi changes without default-network events are picked up by foreground polling", async () => {
  let phone = verifiedPhone();
  const h = diagnostics(() => phone);
  h.render();
  await flush();
  phone = verifiedPhone("Other-network");
  h.poll();
  await flush();
  assert.equal(h.current().status, "disconnected");
  phone = { reason: "wifi-disabled", wifiEnabled: false };
  h.poll();
  await flush();
  assert.equal(h.current().reason, "wifi-disabled");
  phone = { reason: "ssid-unavailable" };
  h.poll();
  await flush();
  assert.equal(h.current().status, "unknown");
  h.unmount();
});

test("Overlapping events coalesce; cleanup discards pending result and all subscriptions", async () => {
  const pending = deferred();
  const h = diagnostics(() => pending.promise);
  h.render();
  h.network();
  h.poll();
  assert.equal(h.calls.length, 1);
  h.unmount();
  pending.resolve(verifiedPhone());
  await flush();
  assert.equal(h.logs.length, 0);
  assert.equal(h.calls.length, 1);
  assert.equal(h.listeners.size, 0);
  assert.equal(h.appListeners.size, 0);
  assert.equal(h.timers.size, 0);
});

test("Reads predating a network event or background/resume cannot publish stale green", async () => {
  for (const change of [h => h.network(), h => { h.appState("background"); h.appState("active"); }]) {
    const pending = [];
    const h = diagnostics(() => { const p = deferred(); pending.push(p); return p.promise; });
    h.render();
    change(h);
    pending[0].resolve(verifiedPhone());
    await flush();
    assert.equal(h.current().status, "unknown");
    assert.equal(pending.length, 2, "Coalesced into one follow-up read");
    pending[1].resolve(verifiedPhone("Other"));
    await flush();
    assert.equal(h.current().status, "disconnected");
    h.unmount();
  }
});

test("Reconnect, even same device ID with a new object, clears old SSID/status", async () => {
  const pending = [];
  const h = diagnostics(() => { const p = deferred(); pending.push(p); return p.promise; });
  h.render({ id: "same" }, "old");
  h.render({ id: "same" }, "new");
  pending[0].resolve(verifiedPhone("old"));
  await flush();
  assert.equal(h.current().status, "unknown");
  pending[1].resolve(verifiedPhone("new"));
  await flush();
  assert.equal(h.current().status, "matched");
  assert.equal(h.listeners.size, 1);
  assert.equal(h.appListeners.size, 1);
  assert.equal(h.timers.size, 1);
  assert.equal(h.render(null).status, "unknown");
  assert.equal(h.listeners.size, 0);
  h.unmount();
});

test("A stalled poll cannot retain verified green indefinitely; production logs are silent", async () => {
  const pending = deferred();
  let first = true;
  const h = diagnostics(() => {
    if (first) { first = false; return verifiedPhone(); }
    return pending.promise;
  }, false);
  h.render();
  await flush();
  assert.equal(h.current().status, "matched");
  h.poll();
  h.poll();
  assert.equal(h.current().status, "unknown");
  assert.equal(h.logs.length, 0);
  h.unmount();
  pending.resolve(verifiedPhone());
  await flush();
});

test("Effect replay cleans up the previous monitor rather than doubling listeners", async () => {
  const h = diagnostics();
  h.render();
  h.replay();
  await flush();
  assert.equal(h.listeners.size, 1);
  assert.equal(h.appListeners.size, 1);
  assert.equal(h.timers.size, 1);
  assert.equal(h.current().status, "matched");
  h.unmount();
});

test("Device Info reads once per connected session, sharing pending result through effect replay", async () => {
  const h = hooks(), calls = [], pending = [];
  const read = device => {
    calls.push(device);
    const p = deferred();
    pending.push(p);
    return p.promise;
  };
  const hook = load("src/hooks/useDeviceInformation.js", { react: h.react }).default;
  const first = { id: "same" }, second = { id: "same" };
  const render = device => h.render(() => hook(device, read, "Failed to read"));
  render(first);
  h.replay();
  await flush();
  assert.equal(calls.length, 1);
  pending[0].resolve({ ssid: "old" });
  await flush();
  assert.equal(render(first).info.ssid, "old");
  assert.equal(render(second).info, null);
  await flush();
  assert.equal(calls.length, 2);
  pending[1].resolve({ ssid: "new" });
  await flush();
  assert.equal(render(second).info.ssid, "new");
  render(second); // Info/video tab remount does not own or restart the read.
  await flush();
  assert.equal(calls.length, 2);
  h.unmount();
});

test("Late Device Info result cannot replace a new session, and failures do not retry", async () => {
  const h = hooks(), pending = [];
  const read = () => { const p = deferred(); pending.push(p); return p.promise; };
  const hook = load("src/hooks/useDeviceInformation.js", { react: h.react }).default;
  const a = { id: "a" }, b = { id: "b" };
  h.render(() => hook(a, read, "Read failed"));
  await flush();
  h.render(() => hook(b, read, "Read failed"));
  await flush();
  pending[0].resolve({ ssid: "obsolete" });
  await flush();
  assert.equal(h.render().info, null);
  pending[1].reject(new Error("Disconnected"));
  await flush();
  assert.equal(h.render().error, "Read failed");
  h.render();
  await flush();
  assert.equal(pending.length, 2);
  h.unmount();
});

test("Disconnect before the initial Info microtask prevents starting a stale BLE read", async () => {
  const h = hooks();
  let reads = 0;
  const hook = load("src/hooks/useDeviceInformation.js", { react: h.react }).default;
  h.render(() => hook({ id: "gone" }, async () => { reads++; }, "Read failed"));
  h.unmount();
  await flush();
  assert.equal(reads, 0);
});

test("Camera Header icons, explicit Settings actions, and refresh remain separate", () => {
  const h = hooks(), alerts = [], actions = [], timers = new Set();
  const styles = { create: value => value };
  const { default: Video } = load("src/components/Video/VideoStream.jsx", {
    react: h.react,
    "react-native": {
      View: "View", Text: "Text", TouchableOpacity: "Button", StyleSheet: styles,
      Alert: { alert: (...args) => alerts.push(args) }, Platform: { OS: "android" },
    },
    "react-native-android-open-settings": {
      wifiSettings: () => actions.push("wifi"), locationSourceSettings: () => actions.push("location"),
      appDetailsSettings: () => actions.push("app"),
    },
    "@expo/vector-icons": { MaterialCommunityIcons: "Icon" },
    "react-native-webview": { WebView: "WebView" },
    "react-native-digest-fetch": {}, "expo-linear-gradient": { LinearGradient: "Gradient" },
  }, {
    console: { log: () => {} },
    setTimeout: fn => { timers.add(fn); return fn; }, clearTimeout: fn => timers.delete(fn),
  });
  const render = wifiStatus => h.render(() => Video({ wifiStatus }));
  for (const [status, name, color] of [
    ["matched", "wifi", "#0ee50be2"], ["disconnected", "wifi-off", "#ffffff"], ["unknown", "wifi", "#8293a8"],
  ]) {
    const tree = render({ status, reason: "checking" });
    const button = find(tree, node => node.props.accessibilityRole === "button");
    const icon = button.children[0];
    assert.equal(icon.props.name, name);
    assert.equal(icon.props.color, color);
    assert.equal(button.props.style.width, 44);
    assert.equal(button.props.style.height, 42);
    assert.equal(button.props.style.backgroundColor, undefined);
    assert.equal(button.props.hitSlop, undefined);
  }
  let tree = render({ status: "disconnected", reason: "ssid-mismatch" });
  find(tree, node => node.props.accessibilityRole === "button").props.onPress();
  assert.deepEqual(actions, ["wifi"]);
  tree = render({ status: "unknown", reason: "location-disabled" });
  find(tree, node => node.props.accessibilityRole === "button").props.onPress();
  assert.deepEqual(actions, ["wifi"], "Unknown tap explains; it must not auto-redirect");
  alerts.at(-1)[2].find(button => button.text === "Open Settings").onPress();
  assert.deepEqual(actions, ["wifi", "location"]);
  const webBefore = find(tree, node => node.type === "WebView");
  const refresh = find(tree, node => node.type === "Button" && node.children[0]?.props?.name === "refresh");
  refresh.props.onPress();
  tree = h.render();
  assert.equal(find(tree, node => node.type === "WebView").props.key, webBefore.props.key + 1);
  assert.equal(timers.size, 1, "Status renders must not remount the video auto-refresh timer");
  h.unmount();
  assert.equal(timers.size, 0);
});
