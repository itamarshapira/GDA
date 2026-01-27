import { Buffer } from "buffer";
global.Buffer = global.Buffer || Buffer;

export const LOGIN_SERVICE_UUID = "ab896745-2310-cdab-8947-6f5e4d3c2b1a";
export const PASSKEY_CHAR_UUID = "ab896745-2311-cdab-8947-6f5e4d3c2b1a";

/**
 * ✅ Helper: checks if device is connected, and if not → reconnects.
 * Why:
 * - react-native-ble-plx sometimes gives you a device object that is no longer connected
 * - Write will fail with "Device is not connected"
 */
async function ensureConnected(device) {
  // 1) If already connected → good
  const connected = await device.isConnected();
  if (connected) return device;

  console.log("[loginService] ⚠️ Device not connected — reconnecting...");

  // 2) reconnect
  const reconnected = await device.connect({ autoConnect: false });
  console.log("[loginService] ✅ Reconnected successfully");

  // 3) rediscover services (important after reconnect)
  await reconnected.discoverAllServicesAndCharacteristics();
  console.log("[loginService] 🔎 Rediscovered services after reconnect");

  return reconnected;
}

/**
 * ✅ Writes passkey to device, with full connection protection.
 */
export async function writePasskey(device, passkey) {
  try {
    if (!device) {
      console.log("[loginService] ❌ No device provided");
      return false;
    }

    if (!passkey || typeof passkey !== "string") {
      console.log("[loginService] ❌ Invalid passkey");
      return false;
    }

    // ✅ Critical fix: make sure device is actually connected
    const readyDevice = await ensureConnected(device);

    const bytes = Buffer.from(passkey, "utf-8");
    const base64Payload = bytes.toString("base64");
    console.log("[loginService] Prepared payload:", base64Payload);

    // ✅ Try with response first
    try {
      await readyDevice.writeCharacteristicWithResponseForService(
        LOGIN_SERVICE_UUID,
        PASSKEY_CHAR_UUID,
        base64Payload
      );
      console.log("[loginService] ✅ Wrote passkey (with response)");
    } catch (err1) {
      console.log(
        "[loginService] ⚠️ Write with response failed:",
        err1.message
      );

      // Retry without response
      await readyDevice.writeCharacteristicWithoutResponseForService(
        LOGIN_SERVICE_UUID,
        PASSKEY_CHAR_UUID,
        base64Payload
      );
      console.log("[loginService] ✅ Wrote passkey (without response)");
    }

    return true;
  } catch (err) {
    console.log("[loginService] ❌ Passkey write failed:", err.message || err);
    return false;
  }
}
