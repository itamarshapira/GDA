import { PermissionsAndroid, Platform } from "react-native";

/**
 * מבקש הרשאות BLE ומיקום (כנדרש לפי גרסת אנדרואיד)
 */
export async function requestBlePermissions() {
  try {
    // באנדרואיד בלבד נדרשות בקשות הרשאה
    if (Platform.OS === "android") {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ];

      const results = await PermissionsAndroid.requestMultiple(permissions);

      // בודקים אם כולן מאושרות
      const allGranted = Object.values(results).every(
        (status) => status === PermissionsAndroid.RESULTS.GRANTED
      );

      if (allGranted) {
        console.log(" All BLE permissions granted!");
        return true;
      } else {
        console.log(" Some permissions denied:", results);
        return false;
      }
    } else {
      console.log("iOS automatically handles BLE permissions.");
      return true;
    }
  } catch (error) {
    console.error("Error requesting BLE permissions:", error);
    return false;
  }
}
