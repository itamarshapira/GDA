import { useEffect, useState } from "react";
import { AppState, Platform } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import {
  getDeviceWifiStatus,
  readPhoneWifiSsid,
} from "../services/wifiSsidService";

const CHECK_INTERVAL_MS = 5000;

/**
 * One passive Wi-Fi monitor per connected dashboard, not per tab or video mount.
 * deviceSsid is the expected hotspot name from the shared BLE Info result;
 * phoneSsid is independently read from Android. Neither is camera-health data.
 * Keeping the original diagnostics hook as the single owner avoids duplicate
 * network listeners and lets Source/Detector use the exact same status rules.
 */
export default function useWifiSsidDiagnostics(device, deviceSsid) {
  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => {
    if (Platform.OS !== "android" || !device) return;

    let disposed = false;
    let inFlight = false;
    let queued = false;
    let foreground = AppState.currentState === "active";
    let generation = 0;
    let lastReport = null;
    let timer = null;

    const invalidate = (reason = "checking") => {
      setSnapshot({ device, phone: { reason } });
    };

    const check = async (trigger) => {
      if (disposed || !foreground) return;
      if (inFlight) {
        queued = true; // Coalesce simultaneous resume/network/poll events.
        // A read taking longer than a polling period must not leave an old
        // green icon visible indefinitely. Normal quick polls do not flicker.
        if (trigger === "poll") invalidate();
        return;
      }
      inFlight = true;
      const startedGeneration = generation;

      try {
        const phone = await readPhoneWifiSsid({ requestPermission: false });
        // A native read cannot be cancelled. Ignore results from an obsolete
        // device, background session, or a read predating a network-change event.
        if (disposed || !foreground || generation !== startedGeneration) return;
        setSnapshot({ device, phone });
        const report = {
          permission: phone.permission,
          locationEnabled: phone.locationEnabled,
          wifiEnabled: phone.wifiEnabled,
          phoneSsidAvailable: Boolean(phone.phoneSsid),
          reason: phone.reason,
        };
        const signature = JSON.stringify(report);
        if (signature !== lastReport || trigger === "foreground") {
          lastReport = signature;
          // Log only changes in development, with no SSIDs/device identifiers.
          if (__DEV__) console.log("[WiFiSSID]", JSON.stringify({
            ...report,
            trigger,
            checkedAt: new Date().toISOString(),
          }));
        }
      } finally {
        inFlight = false;
        if (queued && !disposed && foreground) {
          queued = false;
          void check("queued");
        }
      }
    };

    // Permission prompts belong to explicit Connect, never render/poll/resume.
    // The expected BLE SSID is compared at render time, so its arrival does not
    // tear down/recreate this monitor or launch another GATT read.
    invalidate();
    const unsubscribe = NetInfo.addEventListener(() => {
      if (disposed) return;
      // Retire an in-flight snapshot taken before this network-change event.
      generation += 1;
      invalidate();
      void check("network-change");
    });
    const startTimer = () => {
      if (timer === null && foreground) {
        timer = setInterval(() => { void check("poll"); }, CHECK_INTERVAL_MS);
      }
    };
    const stopTimer = () => {
      if (timer !== null) clearInterval(timer);
      timer = null;
    };
    const appSubscription = AppState.addEventListener("change", (state) => {
      if (disposed) return;
      foreground = state === "active";
      generation += 1;
      invalidate(foreground ? "checking" : "background");
      stopTimer();
      if (foreground) {
        void check("foreground");
        startTimer();
      }
    });

    // NetInfo's events follow the DEFAULT network. A local AP/SSID can change
    // without a cellular default-route change, so also check every five seconds.
    // Remove the timer entirely in the background; resume also rechecks Location
    // and permission after Settings. No location coordinates are ever requested.
    void check("mount");
    startTimer();

    return () => {
      disposed = true;
      generation += 1;
      stopTimer();
      unsubscribe();
      appSubscription.remove();
    };
  }, [device]);

  if (Platform.OS !== "android") {
    return { status: "unknown", reason: "unsupported-platform" };
  }
  // Device object ownership prevents a previous connection's green icon from
  // appearing for even one render of a replacement device (including same ID).
  return getDeviceWifiStatus(snapshot && snapshot.device === device ? snapshot.phone : null, deviceSsid);
}
