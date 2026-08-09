// src/services/sourceSettingsService.js

import {
  SOURCE_SETTINGS_UUID,
  SOURCE_PULSE_PERIOD_UUID,
  SOURCE_PULSE_WIDTH_UUID,
  SOURCE_CHARGER_SHARED_UUID,
  SOURCE_HIGH_VOLTAGE_UUID,
  CHARACTERISTIC_USER_DESCRIPTION_UUID,
} from "./bleUuidLabels";

import {
  readUint16BECharacteristic,
  writeUint16BECharacteristic,
} from "./bleService";

/*
 * Charger Frequency and Charger Duty Cycle have the same UUID.
 *
 * After identifying them through their 0x2901 descriptions,
 * this WeakMap stores their exact Characteristic objects for
 * the current connected device.
 */
const chargerCharacteristicCache = new WeakMap();

const normalizeUuid = (uuid = "") => uuid.toLowerCase();

const isValidUint16 = (value) =>
  Number.isInteger(value) && value >= 0 && value <= 0xffff;

/*
 * Descriptor values arrive as Base64.
 * Convert Base64 → UTF-8 text and remove null terminators.
 */
const decodeBase64Text = (base64Value) => {
  if (!base64Value) {
    return "";
  }

  return Buffer.from(base64Value, "base64")
    .toString("utf-8")
    .replace(/\0/g, "")
    .trim();
};

// --------------------------------------------------
// READ THE 0x2901 DESCRIPTION OF AN EXACT CHARACTERISTIC
// --------------------------------------------------
const readCharacteristicDescription = async (characteristic) => {
  /*
   * Get the descriptors belonging to this exact characteristic
   * instance, not merely the first characteristic with its UUID.
   */
  const descriptors = await characteristic.descriptors();

  const userDescriptionDescriptor = descriptors.find(
    (descriptor) =>
      normalizeUuid(descriptor.uuid) ===
      normalizeUuid(CHARACTERISTIC_USER_DESCRIPTION_UUID),
  );

  if (!userDescriptionDescriptor) {
    return null;
  }

  /*
   * Read using the exact Descriptor object.
   * This preserves the connection to its specific characteristic.
   */
  const updatedDescriptor =
    await userDescriptionDescriptor.read();

  return decodeBase64Text(updatedDescriptor?.value);
};

// --------------------------------------------------
// RESOLVE THE TWO DUPLICATE ...8903 CHARACTERISTICS
// --------------------------------------------------
const resolveChargerCharacteristics = async (device) => {
  if (!device) {
    throw new Error("No BLE device connected");
  }

  /*
   * Reuse the already-resolved characteristic objects during
   * this BLE connection.
   */
  const cachedResult = chargerCharacteristicCache.get(device);

  if (cachedResult) {
    return cachedResult;
  }

  /*
   * Store the Promise itself so simultaneous Frequency and
   * Duty Cycle reads do not start two resolution processes.
   */
  const resolverPromise = (async () => {
    console.log(
      "sourceSettingsService.js: Resolving duplicate charger characteristics",
    );

    const services = await device.services();

    const sourceSettingsService = services.find(
      (service) =>
        normalizeUuid(service.uuid) ===
        normalizeUuid(SOURCE_SETTINGS_UUID),
    );

    if (!sourceSettingsService) {
      throw new Error(
        "Source Settings service was not found",
      );
    }

    const characteristics =
      await sourceSettingsService.characteristics();

    const sharedUuidCharacteristics = characteristics.filter(
      (characteristic) =>
        normalizeUuid(characteristic.uuid) ===
        normalizeUuid(SOURCE_CHARGER_SHARED_UUID),
    );

    console.log(
      "sourceSettingsService.js: Duplicate ...8903 characteristics found:",
      sharedUuidCharacteristics.length,
    );

    let frequencyCharacteristic = null;
    let dutyCycleCharacteristic = null;

    /*
     * Read sequentially so BLE descriptor operations are not
     * unnecessarily performed at the same time.
     */
    for (const characteristic of sharedUuidCharacteristics) {
      const description =
        await readCharacteristicDescription(characteristic);

      const normalizedDescription =
        description?.toLowerCase() || "";

      console.log(
        "sourceSettingsService.js: Charger characteristic resolved:",
        {
          instanceId: characteristic.id,
          description,
        },
      );

      if (normalizedDescription.includes("frequency")) {
        frequencyCharacteristic = characteristic;
      }

      /*
       * This matches both:
       * "Charger Duty Cycle"
       * "Charger Duty Cycl"
       */
      if (normalizedDescription.includes("duty")) {
        dutyCycleCharacteristic = characteristic;
      }
    }

    if (!frequencyCharacteristic) {
      throw new Error(
        "Charger Frequency characteristic was not identified",
      );
    }

    if (!dutyCycleCharacteristic) {
      throw new Error(
        "Charger Duty Cycle characteristic was not identified",
      );
    }

    return {
      frequencyCharacteristic,
      dutyCycleCharacteristic,
    };
  })();

  chargerCharacteristicCache.set(device, resolverPromise);

  try {
    return await resolverPromise;
  } catch (error) {
    /*
     * Do not preserve a failed resolution.
     * A later attempt should be allowed to try again.
     */
    chargerCharacteristicCache.delete(device);
    throw error;
  }
};

// --------------------------------------------------
// READ UINT16 BE FROM AN EXACT CHARACTERISTIC OBJECT
// --------------------------------------------------
const readUint16BEFromCharacteristic = async (
  characteristic,
  label,
) => {
  try {
    const updatedCharacteristic =
      await characteristic.read();

    if (!updatedCharacteristic?.value) {
      console.log(
        `sourceSettingsService.js: ${label} value is empty`,
      );

      return null;
    }

    const bytes = Buffer.from(
      updatedCharacteristic.value,
      "base64",
    );

    if (bytes.length < 2) {
      console.log(
        `sourceSettingsService.js: ${label} has fewer than two bytes`,
      );

      return null;
    }

    const value = bytes.readUInt16BE(0);

    console.log(
      `sourceSettingsService.js: ${label} read:`,
      value,
    );

    return value;
  } catch (error) {
    console.log(
      `sourceSettingsService.js: Failed to read ${label}:`,
      error.message,
    );

    return null;
  }
};

// --------------------------------------------------
// WRITE UINT16 BE TO AN EXACT CHARACTERISTIC OBJECT
// --------------------------------------------------
const writeUint16BEToCharacteristic = async (
  characteristic,
  label,
  value,
) => {
  if (!isValidUint16(value)) {
    console.log(
      `sourceSettingsService.js: Invalid ${label} value:`,
      value,
    );

    return false;
  }

  try {
    const buffer = Buffer.alloc(2);

    buffer.writeUInt16BE(value, 0);

    const base64Payload = buffer.toString("base64");

    await characteristic.writeWithResponse(base64Payload);

    console.log(
      `sourceSettingsService.js: ${label} written:`,
      value,
    );

    return true;
  } catch (error) {
    console.log(
      `sourceSettingsService.js: Failed to write ${label}:`,
      error.message,
    );

    return false;
  }
};

// --------------------------------------------------
// PULSE PERIOD — UNIQUE UUID ...8901
// --------------------------------------------------
export const readPulsePeriod = async (device) =>
  readUint16BECharacteristic(
    device,
    SOURCE_SETTINGS_UUID,
    SOURCE_PULSE_PERIOD_UUID,
  );

export const writePulsePeriod = async (device, value) =>
  writeUint16BECharacteristic(
    device,
    SOURCE_SETTINGS_UUID,
    SOURCE_PULSE_PERIOD_UUID,
    value,
  );

// --------------------------------------------------
// PULSE WIDTH — UNIQUE UUID ...8902
// --------------------------------------------------
export const readPulseWidth = async (device) =>
  readUint16BECharacteristic(
    device,
    SOURCE_SETTINGS_UUID,
    SOURCE_PULSE_WIDTH_UUID,
  );

export const writePulseWidth = async (device, value) =>
  writeUint16BECharacteristic(
    device,
    SOURCE_SETTINGS_UUID,
    SOURCE_PULSE_WIDTH_UUID,
    value,
  );

// --------------------------------------------------
// CHARGER FREQUENCY — RESOLVED DUPLICATE ...8903
// --------------------------------------------------
export const readChargerFrequency = async (device) => {
  try {
    const { frequencyCharacteristic } =
      await resolveChargerCharacteristics(device);

    return readUint16BEFromCharacteristic(
      frequencyCharacteristic,
      "Charger Frequency",
    );
  } catch (error) {
    console.log(
      "sourceSettingsService.js: Failed to resolve Charger Frequency:",
      error.message,
    );

    return null;
  }
};

export const writeChargerFrequency = async (
  device,
  value,
) => {
  try {
    const { frequencyCharacteristic } =
      await resolveChargerCharacteristics(device);

    return writeUint16BEToCharacteristic(
      frequencyCharacteristic,
      "Charger Frequency",
      value,
    );
  } catch (error) {
    console.log(
      "sourceSettingsService.js: Failed to resolve Charger Frequency:",
      error.message,
    );

    return false;
  }
};

// --------------------------------------------------
// CHARGER DUTY CYCLE — RESOLVED DUPLICATE ...8903
// --------------------------------------------------
export const readChargerDutyCycle = async (device) => {
  try {
    const { dutyCycleCharacteristic } =
      await resolveChargerCharacteristics(device);

    return readUint16BEFromCharacteristic(
      dutyCycleCharacteristic,
      "Charger Duty Cycle",
    );
  } catch (error) {
    console.log(
      "sourceSettingsService.js: Failed to resolve Charger Duty Cycle:",
      error.message,
    );

    return null;
  }
};

export const writeChargerDutyCycle = async (
  device,
  value,
) => {
  try {
    const { dutyCycleCharacteristic } =
      await resolveChargerCharacteristics(device);

    return writeUint16BEToCharacteristic(
      dutyCycleCharacteristic,
      "Charger Duty Cycle",
      value,
    );
  } catch (error) {
    console.log(
      "sourceSettingsService.js: Failed to resolve Charger Duty Cycle:",
      error.message,
    );

    return false;
  }
};

// --------------------------------------------------
// HIGH VOLTAGE SETTING — UNIQUE UUID ...8904
// --------------------------------------------------
export const readHighVoltage = async (device) =>
  readUint16BECharacteristic(
    device,
    SOURCE_SETTINGS_UUID,
    SOURCE_HIGH_VOLTAGE_UUID,
  );

export const writeHighVoltage = async (device, value) =>
  writeUint16BECharacteristic(
    device,
    SOURCE_SETTINGS_UUID,
    SOURCE_HIGH_VOLTAGE_UUID,
    value,
  );