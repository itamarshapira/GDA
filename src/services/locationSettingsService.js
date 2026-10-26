import { Platform } from "react-native";
import * as Location from "expo-location";

// A native settings dialog outlives a React render. Share the pending request
// defensively; Navbar's existing action guard also prevents repeated Connect taps.
let activationRequest = null;

/**
 * Best-effort Location activation, ONLY for an explicit Navbar/Welcome Connect.
 * This changes settings, not permissions, and never requests GPS coordinates.
 * A false/unknown result must not become a new prerequisite for BLE scanning.
 */
export function prepareLocationForConnection() {
  if (Platform.OS !== "android") return Promise.resolve(null);
  if (activationRequest) return activationRequest;

  activationRequest = (async () => {
    try {
      if (await Location.hasServicesEnabledAsync()) return true;
      try {
        // Google Play Services requests network/high-accuracy settings. Some
        // phones cannot resolve them; rejection includes user cancellation.
        await Location.enableNetworkProviderAsync();
      } catch {
        // Do not block BLE, redirect to Settings, or retry the dialog here.
      }
      // Acceptance is not proof that the global Location switch was enabled.
      // Recheck after cancellation/failure too, in case settings changed meanwhile.
      return await Location.hasServicesEnabledAsync();
    } catch {
      return null; // Unsupported/native check failure: continue with unknown.
    }
  })().finally(() => {
    activationRequest = null;
  });
  return activationRequest;
}
