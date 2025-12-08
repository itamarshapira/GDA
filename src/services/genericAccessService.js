// src/services/genericAccessService.js

import { Buffer } from "buffer"; // for byte conversions
global.Buffer = global.Buffer || Buffer; // ensure Buffer is available

import {
  GENERIC_ACCESS_UUID,
  DEVICE_NAME_UUID,
  APPEARANCE_UUID,
} from "./bleUuidLabels"; 

import { readStringCharacteristic } from "./bleService";

/**
 * Reads the Generic Access service:
 * - Device name (UTF-8 string)
 * - Appearance (device type code)
 */
export const readGenericAccessInfo = async (device) => {
  try {
    if (!device) {
      console.log("[GenericAccessService] ❌ No device provided");
      return null;
    }

    //  Read the device name (string)
    const deviceName = await readStringCharacteristic(
      device,
      GENERIC_ACCESS_UUID, // service UUID
      DEVICE_NAME_UUID // characteristic UUID
    );

    //  Read the appearance code (number)
    let appearance = null;
    try {
      const char = await device.readCharacteristicForService(
        GENERIC_ACCESS_UUID,
        APPEARANCE_UUID
      );

      if (char?.value) { // 
        const bytes = Buffer.from(char.value, "base64");
        // Read 2 bytes as little-endian unsigned number
        appearance = bytes.readUInt16LE(0);
      }
    } catch (innerErr) {
      console.log(
        "[GenericAccessService] ⚠️ Appearance not available:", 
        innerErr.message || innerErr
      );
    }

    return {
      deviceName: deviceName || "Unknown",
      appearance: appearance,
    };
  } catch (err) {
    console.log(
      "[GenericAccessService] ❌ Failed to read Generic Access info:",
      err.message || err
    );
    return null;
  }
};
