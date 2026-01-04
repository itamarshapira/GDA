/**
 * Alert Notification Service
 * --------------------------
 * Service UUID: 0x1811
 * Characteristic: Alert Status (0x2A3F)
 *
 * Value: UInt16 bitmask (BIG-ENDIAN)
 */

import {
  ALERT_NOTIFICATION_UUID,
  ALERT_STATUS_UUID,
} from "./bleUuidLabels";

import {
  readUint16BECharacteristic,
  monitorUint16BECharacteristic,
  monitorUint16LECharacteristic
} from "./bleService";

/**
 * Read Alert Status once
 * @param {object} device
 * @returns {number|null}
 */
export async function readAlertStatus(device) {
  if (!device) {
    console.log("[AlertService] ❌ No device");
    return null;
  }

  try {
    console.log("[AlertService] 📖 Reading alert status...");

    const value = await readUint16BECharacteristic(
      device,
      ALERT_NOTIFICATION_UUID,
      ALERT_STATUS_UUID
    );

    if (value === null) {
      console.log("[AlertService] ⚠️ Alert status is null");
      return null;
    }

    console.log("[AlertService] ✅ Alert status =", value);
    return value;
  } catch (err) {
    console.log(
      "[AlertService] ❌ Failed to read alert status:",
      err.message
    );
    return null;
  }
}

/**
 * Start Alert Status NOTIFY
 * Ownership: COMPONENT
 *
 * @param {object} device
 * @param {function} onValue callback(newValue)
 * @returns {object|null} subscription (call .remove() to stop)
 */
export function startAlertStatusNotify(device, onValue) {
  if (!device) {
    console.log("[AlertService] ❌ No device");
    return null;
  }

  console.log("[AlertService] 🔔 Starting alert notify");

  return monitorUint16LECharacteristic(
    device,
    ALERT_NOTIFICATION_UUID,
    ALERT_STATUS_UUID,
    onValue
  );
}
