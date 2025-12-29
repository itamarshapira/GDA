// src/services/alertNotificationService.js

/**
 * Alert Notification Service
 * --------------------------
 * Service UUID: 0x1811
 * Characteristic: Alert Status (0x2A3F)
 *
 * Value: UInt16 bitmask
 */

import {
  ALERT_NOTIFICATION_UUID,
  ALERT_STATUS_UUID,
} from "./bleUuidLabels";

import {
  readUint16BECharacteristic,
  monitorUint16BECharacteristic,
  readUint16LECharacteristic
} from "./bleService";

/**
 * Read Alert Status once
 * @returns {number|null} UInt16 bitmask
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
    console.log("[AlertService] ❌ Failed to read alert status:", err.message);
    return null;
  }
}

/**
 * Start Alert Status NOTIFY
 * @param {function} onValue callback(newValue)
 * @returns subscription (call remove() to stop)
 */
export function startAlertStatusNotify(device, onValue) {
  if (!device) {
    console.log("[AlertService] ❌ No device");
    return null;
  }

  console.log("[AlertService] 🔔 Starting alert notify");

  return monitorUint16BECharacteristic(
    device,
    ALERT_NOTIFICATION_UUID,
    ALERT_STATUS_UUID,
    onValue
  );
}
