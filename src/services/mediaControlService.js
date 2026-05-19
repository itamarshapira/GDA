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
  AXIS_COORDINATE_UUID,
  RESOLUTION_CONTROL_UUID,
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

/**
 * Read Axis Coordinates (X/Y/Z) raw
 * We first log bytes to understand firmware format.
 */
export async function readAxisRaw(device) {
  if (!device) {
    console.log("[Axis] ❌ No device");
    return null;
  }

  try {
    console.log("[Axis] 📖 Reading raw axis data...");

    const char = await device.readCharacteristicForService(
      MEDIA_CONTROL_UUID,
      AXIS_COORDINATE_UUID
    );

    if (!char?.value) return null;

   const bytes = Buffer.from(char.value, "base64");

console.log("[AxisService] Raw bytes:", bytes);
console.log("[AxisService] Hex:", bytes.toString("hex"));

// Decode as Int16 Little Endian
if (bytes.length >= 6) {
  const x = bytes.readInt16LE(0);
  const y = bytes.readInt16LE(2);
  const z = bytes.readInt16LE(4);

  console.log("[AxisService] Decoded:", { x, y, z });

  // --- Add G-force conversion ---
  // Common IMU scale (we verify if correct)
  const SCALE = 20000;

  const gx = x / SCALE;
  const gy = y / SCALE;
  const gz = z / SCALE;

  console.log("[AxisService] Raw:", { x, y, z });
  console.log("[AxisService] G-force:", { gx, gy, gz });

  return { x, y, z, gx, gy, gz };
}
  } catch (err) {
    console.log("[AxisService] ❌ Read failed:", err.message);
    return null;
  }
}

/**
 * Monitor Axis G-force (X/Y/Z) using NOTIFY
 * Returns subscription (must remove() to stop)
 */
export const monitorAxis = (device, onValue) => {
  if (!device) {
    console.log("[AxisService] ❌ No device for monitor");
    return null;
  }

  console.log("[AxisService] 📡 Subscribing to Axis notify...");

  const subscription = device.monitorCharacteristicForService(
    MEDIA_CONTROL_UUID,
    AXIS_COORDINATE_UUID,
    (error, characteristic) => {
      if (error) {
        console.log("[AxisService] ❌ Notify error:", error.message);
        return;
      }

      if (!characteristic?.value) return;

      try {
        const bytes = Buffer.from(characteristic.value, "base64");

        if (bytes.length < 6) return;

        const x = bytes.readInt16LE(0);
        const y = bytes.readInt16LE(2);
        const z = bytes.readInt16LE(4);

        const SCALE = 20000;

        const gx = x / SCALE;
        const gy = y / SCALE;
        const gz = z / SCALE;

        console.log("[AxisService] 🔔 Notify:", { gx, gy, gz });

        if (typeof onValue === "function") {
          onValue({ x, y, z, gx, gy, gz });
        }
      } catch (e) {
        console.log("[AxisService] Decode failed:", e.message);
      }
    }
  );

  return subscription;
};

/**
 * Write video resolution command to the MCU.
 *
 * Values:
 * 0 = LOW  -> RPI maps to FoV 4   -> 640x480
 * 1 = HIGH -> RPI maps to FoV 100 -> Full
 */
export async function writeResolutionControl(device, value) {
  if (!device) {
    console.log("[ResolutionControl] ❌ No device");
    return false;
  }

  if (value !== 0 && value !== 1) {
    console.log("[ResolutionControl] ❌ Invalid value:", value);
    return false;
  }

  try {
    console.log("[ResolutionControl] ✍️ Writing resolution value:", value);

    const ok = await writeUint8Characteristic(
      device,
      MEDIA_CONTROL_UUID,
      RESOLUTION_CONTROL_UUID,
      value
    );

    console.log("[ResolutionControl] ✅ Write result:", ok);
    return ok;
  } catch (err) {
    console.log("[ResolutionControl] ❌ Failed to write:", err.message);
    return false;
  }
}