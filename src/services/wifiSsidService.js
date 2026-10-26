import NetInfo from "@react-native-community/netinfo";
import { PermissionsAndroid, Platform } from "react-native";
import * as Location from "expo-location";

// Share a pending Android permission dialog for explicit service callers. A native
// dialog cannot be cancelled by React cleanup, so never open a second one.
let permissionRequest = null;
let lastPermissionResult = "not-granted";

// Empty/redacted names are unknown, not evidence that Wi-Fi is disconnected.
// Preserve case and meaningful spaces: SSID comparisons are case-sensitive.
export const normalizeSsid = (value) => {
  if (typeof value !== "string") return null;
  const placeholder = value.trim().toLowerCase();
  if (!placeholder || placeholder === "<unknown ssid>" ||
      placeholder === '"<unknown ssid>"') return null;
  return value;
};

const getLocationPermission = async (requestPermission) => {
  const { ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION } =
    PermissionsAndroid.PERMISSIONS;
  if (await PermissionsAndroid.check(ACCESS_FINE_LOCATION)) return "granted";
  if (permissionRequest) return permissionRequest;
  // A grant cached from a previous dialog is not valid after Settings revokes
  // it. The live check above is the authority for every subsequent SSID read.
  if (!requestPermission) {
    return lastPermissionResult === "granted" ? "not-granted" : lastPermissionResult;
  }

  // Android 12+ requires coarse and fine to be requested together. Approximate
  // location alone is insufficient for SSID access. No GPS coordinates or
  // background location are requested; this permission gates Android Wi-Fi data.
  permissionRequest = PermissionsAndroid.requestMultiple([
    ACCESS_COARSE_LOCATION,
    ACCESS_FINE_LOCATION,
  ]).then((results) => {
    lastPermissionResult = results[ACCESS_FINE_LOCATION] || "denied";
    return lastPermissionResult;
  }).finally(() => {
    permissionRequest = null;
  });
  return permissionRequest;
};

/**
 * Read the PHONE's current Wi-Fi SSID, separately from the device's BLE SSID.
 * Callers choose whether this check may show a runtime permission dialog.
 * Polls and foreground/network callbacks must check permission without asking.
 */
export const readPhoneWifiSsid = async ({ requestPermission = false } = {}) => {
  const result = {
    phoneSsid: null,
    wifiEnabled: null,
    permission: "unknown",
    locationEnabled: null,
    reason: "unsupported-platform",
  };
  if (Platform.OS !== "android") return result;

  try {
    result.permission = await getLocationPermission(requestPermission);
    if (result.permission !== "granted") {
      result.reason = result.permission === "never_ask_again"
        ? "permission-blocked"
        : "precise-location-not-granted";
      return result;
    }

    // Permission and the global Location switch are separate Android gates.
    // This is a passive check only: dashboard polling never opens a dialog.
    result.locationEnabled = await Location.hasServicesEnabledAsync();

    // In NetInfo 11.4.1, specifying "wifi" forces a fresh native WifiManager
    // details read, rather than returning cached default-network information.
    // Its type is then labelled "wifi", but isConnected still describes the
    // DEFAULT network. Neither that flag nor Internet reachability proves
    // association with the camera AP; cellular may remain the default route.
    const state = await NetInfo.fetch("wifi");
    result.wifiEnabled = typeof state.isWifiEnabled === "boolean"
      ? state.isWifiEnabled
      : null;
    if (result.wifiEnabled === false) {
      result.reason = "wifi-disabled";
      return result; // Ignore any stale SSID accompanying an explicit radio-off.
    }

    if (result.locationEnabled !== true) {
      result.reason = "location-disabled";
      return result; // Do not trust a possibly cached SSID with Location off.
    }

    result.phoneSsid = normalizeSsid(state.details?.ssid);
    result.reason = result.phoneSsid === null ? "ssid-unavailable" : "ssid-read";
    // Android can redact the SSID even with a granted permission (for example,
    // when system Location is off). NetInfo cannot distinguish every cause.
    return result;
  } catch {
    // Permission/native failures do not change BLE/video behavior and must
    // never be converted into a false "disconnected" result.
    return { ...result, phoneSsid: null, reason: "read-error" };
  }
};

/**
 * This is an SSID comparison, NOT a camera-health or Wi-Fi association verdict.
 * The expected name is reused from the existing BLE read; no GATT read occurs.
 */
export const compareDeviceSsid = (phoneSsid, deviceSsid) => {
  const phone = normalizeSsid(phoneSsid);
  const device = normalizeSsid(deviceSsid);
  if (phone === null || device === null) return "unknown";
  // NetInfo 11.4.1 removes all double quotes from Android SSIDs. If the BLE name
  // contains a quote, the available API cannot support a trustworthy comparison.
  if (device.includes('"')) return "unknown";
  return phone === device ? "match" : "different";
};

/** Map evidence to the header's three states; this is NOT camera health. */
export const getDeviceWifiStatus = (phone, deviceSsid) => {
  const unknown = (reason) => ({ status: "unknown", reason });
  if (!phone) return unknown("checking");
  if (phone.reason === "wifi-disabled" && phone.wifiEnabled === false) {
    return { status: "disconnected", reason: "wifi-disabled" };
  }
  if (phone.reason !== "ssid-read") return unknown(phone.reason);
  if (phone.permission !== "granted" || phone.locationEnabled !== true ||
      phone.wifiEnabled !== true) return unknown("ambiguous-network");
  if (!normalizeSsid(deviceSsid)) return unknown("device-ssid-unavailable");
  const comparison = compareDeviceSsid(phone.phoneSsid, deviceSsid);
  if (comparison === "unknown") return unknown("ssid-unavailable");
  return {
    status: comparison === "match" ? "matched" : "disconnected",
    reason: comparison === "match" ? "ssid-match" : "ssid-mismatch",
  };
};
