// src/services/environmentalService.js

import { Buffer } from "buffer";
global.Buffer = global.Buffer || Buffer; // Ensure Buffer exists in React Native

import {
  ENVIRONMENTAL_SENSING_UUID,
  METHANE_UUID,
  TEMPERATURE_UUID,
  MEASUREMENT_INTERVAL_UUID,
} from "./bleUuidLabels";

import { readUint16BECharacteristic, readUint16LECharacteristic, monitorUint16LECharacteristic, writeUint16LECharacteristic  } from "./bleService";

/**
 * Reads methane concentration (0x2BD1) from Environmental Sensing Service (0x181A)
 * Returns numeric value (ppm)
 * 
 * @param {Object} device - connected BLE device
 * @returns {number|null} - methane concentration in ppm (or null if failed)
 */
export const readMethane = async (device) => {
  try {
    if (!device) {
      console.log("[MethaneService]  No device");
      return null;
    }

    console.log("[MethaneService]  Reading methane...");

    const value = await readUint16BECharacteristic(
      device,
      ENVIRONMENTAL_SENSING_UUID,
      METHANE_UUID
    );

    if (value === null) {
      console.log("[MethaneService]  Value is null");
      return null;
    }

    console.log(`[MethaneService]  Methane = ${value} LEL`);
    return value;
  } catch (err) {
    console.log("[MethaneService] ❌ Failed to read methane:", err.message);
    return null;
  }
};

/**
 * Reads temperature (0x2A6E) from Environmental Sensing Service (0x181A)
 * Returns numeric value (raw units from device)
 * @param {Object} device - connected BLE device
 * @returns {number|null} - temperature value (raw) or null on failure
 */
export const readTemperature = async (device) => {
  try {
    if (!device) {
      console.log("[TempService]  No device");
      return null;
    }

    console.log("[TempService]  Reading temperature...");

    const value = await readUint16LECharacteristic(
      device,
      ENVIRONMENTAL_SENSING_UUID,
      TEMPERATURE_UUID
    );

    if (value === null) {
      console.log("[TempService]  Value is null");
      return null;
    }

    console.log(`[TempService]  Temperature raw = ${value}`);
    return value;
  } catch (err) {
    console.log("[TempService]  Failed to read temperature:", err.message);
    return null;
  }
};

//* Read Measurement Interval (seconds)
export async function readMeasurementInterval(device) {
  if (!device) {
    console.log("[MesurmentService]  No device");
    return null;
  }

  try {
    const value = await readUint16LECharacteristic(
      device,
      ENVIRONMENTAL_SENSING_UUID,
      MEASUREMENT_INTERVAL_UUID
    );

    if (value !== null) {
      console.log(`[MesurmentService] Measurement Interval: ${value} sec`);
      return value;
    }
  } catch (err) {
    console.log("[MesurmentService]  Read measurement interval failed:", err.message);
  }

  return null;
}


/**
 ** Subscribes to methane notifications (live updates)
 * Callback: onValue(ppm) → UI updates methane state
 *
 * Returns: subscription (call .remove() to stop)
 */
export function monitorMethaneNotifications(device, onValue) {
  if (!device) {
    console.log("[MethaneServiceNotify]  No device");
    return null;
  }

  console.log("[MethaneServiceNotify]  Enabling methane NOTIFY...");

  return monitorUint16LECharacteristic(
    device,
    ENVIRONMENTAL_SENSING_UUID,
    METHANE_UUID,
    onValue
  );
}


/**
 ** Writes new measurement interval (seconds)
 * Allowed range: 1–60 sec
 */
export async function writeMeasurementInterval(device, seconds) {
  if (!device) {
    console.log("[EnvServiceWriting] ❌ No device");
    return false;
  }

  if (seconds < 1 || seconds > 60) {
    console.log("[EnvServiceWriting] ⚠️ Interval must be 1–60 sec");
    return false;
  }

    console.log(`[EnvServiceWriting...] ✍️ Writing measurement interval: ${seconds} sec`);

  return await writeUint16LECharacteristic(
    device,
    ENVIRONMENTAL_SENSING_UUID,
    MEASUREMENT_INTERVAL_UUID,
    seconds
  );
}


