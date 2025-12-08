// src/services/loginService.js

import { Buffer } from "buffer";
global.Buffer = global.Buffer || Buffer;

// BLE UUIDs for login process
export const LOGIN_SERVICE_UUID = "ab896745-2310-cdab-8947-6f5e4d3c2b1a";
export const PASSKEY_CHAR_UUID = "ab896745-2311-cdab-8947-6f5e4d3c2b1a";

/**
 * Writes the passkey ("123456") to the BLE device.
 * Converts it to UTF-8 bytes → Base64 (required by BLE API).
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

    const bytes = Buffer.from(passkey, "utf-8");
    const base64Payload = bytes.toString("base64");
    console.log("[loginService] Prepared payload:", base64Payload);

    // Try with response first
    try {
      await device.writeCharacteristicWithResponseForService(
        LOGIN_SERVICE_UUID,
        PASSKEY_CHAR_UUID,
        base64Payload
      );
      console.log("[loginService] ✅ Wrote passkey (with response)");
    } catch (err1) {
      console.log("[loginService] ⚠️ Write with response failed:", err1.message);
      // Retry without response
      await device.writeCharacteristicWithoutResponseForService(
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
