// src/services/mediaControlService.js

/**
 * Media Control Service
 * ---------------------
 * Service UUID: 0x1848
 * Characteristic: Media Control Point (0x2BA4)
 *
 * Values (enum, UInt8):
 * 0 = Normal
 * 1 = Alignment
 * 2 = Zero Calibration
 */

import {
  MEDIA_CONTROL_UUID,
  MEDIA_CONTROL_POINT_UUID,
} from "./bleUuidLabels";

import {
  readUint8Characteristic,
  writeUint8Characteristic,
} from "./bleService";

/**
 * Read current Media Control state
 * @returns {number|null} 0 | 1 | 2
 */
export async function readMediaControlState(device) {
  if (!device) {
    console.log("[MediaControl] ❌ No device");
    return null;
  }

  try {
    console.log("[MediaControl] 📖 Reading state...");

    const value = await readUint8Characteristic(
      device,
      MEDIA_CONTROL_UUID,
      MEDIA_CONTROL_POINT_UUID
    );

    if (value === null) {
      console.log("[MediaControl] ⚠️ State is null");
      return null;
    }

    console.log("[MediaControl] ✅ State =", value);
    return value;
  } catch (err) {
    console.log("[MediaControl] ❌ Failed to read state:", err.message);
    return null;
  }
}

/**
 * Write Media Control command
 * @param {number} value 0 | 1 | 2
 */
export async function writeMediaControlState(device, value) {
  if (!device) {
    console.log("[MediaControl] ❌ No device");
    return false;
  }

  try {
    console.log("[MediaControl] ✍️ Writing state:", value);

    const ok = await writeUint8Characteristic(
      device,
      MEDIA_CONTROL_UUID,
      MEDIA_CONTROL_POINT_UUID,
      value
    );

    return ok;
  } catch (err) {
    console.log("[MediaControl] ❌ Failed to write state:", err.message);
    return false;
  }
}
