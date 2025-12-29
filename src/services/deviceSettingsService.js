// src/services/deviceSettingsService.js


/**
 * FG Device Settings Service
 * --------------------------
 * This service handles READ / WRITE operations
 * for FG custom device settings.
 *
 * We will add one characteristic at a time.
 */

import {
  FG_SETTINGS_UUID,
  FULL_SCALE_UUID,
  ALARM_LEVEL_UUID,
  WARN_LEVEL_UUID,
  LOWEST_LEVEL_UUID,
  RESPONSE_TIME_UUID,
  BLOCK_DELAY_UUID,
  SELECT_GAS_TYPE_UUID,
} from "./bleUuidLabels";

import {
  readUint16LECharacteristic,
    readUint16BECharacteristic,
  writeUint16LECharacteristic,
  writeUint16BECharacteristic,
  writeUint8Characteristic
} from "./bleService";




/**
 ** Reads Full Scale value from FG Settings service
 * @param {Object} device - connected BLE device
 * @returns {number|null} Full scale value or null on failure
 */
export const readFullScale = async (device) => {
  if (!device) {
    console.log("[FGSettings]  No device");
    return null;
  }

  try {
    console.log("[FGSettings] Reading Full Scale...");

    const value = await readUint16BECharacteristic(
      device,
      FG_SETTINGS_UUID,
      FULL_SCALE_UUID
    );

    if (value === null) {
      console.log("[FGSettings]  Full Scale is null");
      return null;
    }

    console.log(`[FGSettings]  Full Scale = ${value}`);
    return value;
  } catch (err) {
    console.log("[FGSettings]  Failed to read Full Scale:", err.message);
    return null;
  }
};

/**
 ** Writes Full Scale value to FG Settings service
 * @param {Object} device - connected BLE device
 * @param {number} value - new full scale value
 * @returns {boolean} success
 */
export const writeFullScale = async (device, value) => {
  if (!device) {
    console.log("[FGSettings] ❌ No device");
    return false;
  }

  try {
    console.log(`[FGSettings] ✍️ Writing Full Scale = ${value}`);

    const ok = await writeUint16BECharacteristic(
      device,
      FG_SETTINGS_UUID,
      FULL_SCALE_UUID,
      value
    );

    return ok;
  } catch (err) {
    console.log("[FGSettings] ❌ Failed to write Full Scale:", err.message);
    return false;
  }
};



/**
 * Reads Alarm Level value from FG Settings service
 * @param {Object} device - connected BLE device
 * @returns {number|null} Alarm level value or null on failure
 */
export const readAlarmLevel = async (device) => {
  if (!device) {
    console.log("[FGSettings] ❌ No device");
    return null;
  }

  try {
    console.log("[FGSettings] 📖 Reading Alarm Level...");

    const value = await readUint16BECharacteristic(
      device,
      FG_SETTINGS_UUID,
      ALARM_LEVEL_UUID
    );

    if (value === null) {
      console.log("[FGSettings] ⚠️ Alarm Level is null");
      return null;
    }

    console.log(`[FGSettings] ✅ Alarm Level = ${value}`);
    return value;
  } catch (err) {
    console.log("[FGSettings] ❌ Failed to read Alarm Level:", err.message);
    return null;
  }
};

/**
 ** Writes FAlarm Level value to FG Settings service
 * @param {Object} device - connected BLE device
 * @param {number} value - new alarm level value
 * @returns {boolean} success
 */
export const writeAlarmLevel = async (device, value) => {
  if (!device) {
    console.log("[FGSettings] ❌ No device");
    return false;
  }

  try {
    console.log(`[FGSettings] ✍️ Writing Alarm Level = ${value}`);

    const ok = await writeUint16BECharacteristic(
      device,
      FG_SETTINGS_UUID,
      ALARM_LEVEL_UUID,
      value
    );

    return ok;
  } catch (err) {
    console.log("[FGSettings] ❌ Failed to write Full Scale:", err.message);
    return false;
  }
};

/**
 * Reads Warn Level value from FG Settings service
 * @param {Object} device - connected BLE device
 * @returns {number|null} Warn level value or null on failure
 */
export const readWarnLevel = async (device) => {
  if (!device) {
    console.log("[FGSettings] ❌ No device");
    return null;
  }

  try {
    console.log("[FGSettings] 📖 Reading Warn Level...");

    const value = await readUint16BECharacteristic(
      device,
      FG_SETTINGS_UUID,
      WARN_LEVEL_UUID
    );

    if (value === null) {
      console.log("[FGSettings] ⚠️ Warn Level is null");
      return null;
    }

    console.log(`[FGSettings] ✅ Warn Level = ${value}`);
    return value;
  } catch (err) {
    console.log("[FGSettings] ❌ Failed to read Warn Level:", err.message);
    return null;
  }
};

/**
 ** Writes Warn Level value to FG Settings service
 * @param {Object} device - connected BLE device
 * @param {number} value - new warn level value
 * @returns {boolean} success
 */
export const writeWarnLevel = async (device, value) => {
  if (!device) {
    console.log("[FGSettings] ❌ No device");
    return false;
  }

  try {
    console.log(`[FGSettings] ✍️ Writing Warn Level = ${value}`);

    const ok = await writeUint16BECharacteristic(
      device,
      FG_SETTINGS_UUID,
      WARN_LEVEL_UUID,
      value
    );

    return ok;
  } catch (err) {
    console.log("[FGSettings] ❌ Failed to write Full Scale:", err.message);
    return false;
  }
};

/**
 ** Reads Lowest Level value from FG Settings service
 * @param {Object} device - connected BLE device
 * @returns {number|null} Lowest level value or null on failure
 */
export const readLowestLevel = async (device) => {
  if (!device) {
    console.log("[FGSettings] ❌ No device");
    return null;
  }

  try {
    console.log("[FGSettings] 📖 Reading Lowest Level...");

    const value = await readUint16BECharacteristic(
      device,
      FG_SETTINGS_UUID,
      LOWEST_LEVEL_UUID
    );

    if (value === null) {
      console.log("[FGSettings] ⚠️ Lowest Level is null");
      return null;
    }

    console.log(`[FGSettings] ✅ Lowest Level = ${value}`);
    return value;
  } catch (err) {
    console.log("[FGSettings] ❌ Failed to read Lowest Level:", err.message);
    return null;
  }
};

/**
 ** Writes Lowest Level value to FG Settings service
 * @param {Object} device - connected BLE device
 * @param {number} value - new lowest level value
 * @returns {boolean} success
 */
export const writeLowestLevel = async (device, value) => {
  if (!device) {
    console.log("[FGSettings] ❌ No device");
    return false;
  }

  try {
    console.log(`[FGSettings] ✍️ Writing Lowest Level = ${value}`);

    const ok = await writeUint16BECharacteristic(
      device,
      FG_SETTINGS_UUID,
      LOWEST_LEVEL_UUID,
      value
    );

    return ok;
  } catch (err) {
    console.log("[FGSettings] ❌ Failed to write Full Scale:", err.message);
    return false;
  }
};

/**
 * Reads Response Time value from FG Settings service
 * @param {Object} device - connected BLE device
 * @returns {number|null} Response time value or null on failure
 */
export const readResponseTime = async (device) => {
  if (!device) {
    console.log("[FGSettings] ❌ No device");
    return null;
  }

  try {
    console.log("[FGSettings] 📖 Reading Response Time...");

    const value = await readUint16BECharacteristic(
      device,
      FG_SETTINGS_UUID,
      RESPONSE_TIME_UUID
    );

    if (value === null) {
      console.log("[FGSettings] ⚠️ Response Time is null");
      return null;
    }

    console.log(`[FGSettings] ✅ Response Time = ${value}`);
    return value;
  } catch (err) {
    console.log("[FGSettings] ❌ Failed to read Response Time:", err.message);
    return null;
  }
};

/**
 ** Writes Response Time value to FG Settings service
 * @param {Object} device - connected BLE device
 * @param {number} value - new response time value
 * @returns {boolean} success
 */
export const writeResponseTime = async (device, value) => {
  if (!device) {
    console.log("[FGSettings] ❌ No device");
    return false;
  }

  try {
    console.log(`[FGSettings] ✍️ Writing Response Time = ${value}`);

    const ok = await writeUint16BECharacteristic(
      device,
      FG_SETTINGS_UUID,
      RESPONSE_TIME_UUID,
      value
    );

    return ok;
  } catch (err) {
    console.log("[FGSettings] ❌ Failed to write Full Scale:", err.message);
    return false;
  }
};

/**
 * Reads Block Delay value from FG Settings service
 * @param {Object} device - connected BLE device
 * @returns {number|null} Block delay value or null on failure
 */
export const readBlockDelay = async (device) => {
  if (!device) {
    console.log("[FGSettings] ❌ No device");
    return null;
  }

  try {
    console.log("[FGSettings] 📖 Reading Block Delay...");

    const value = await readUint16BECharacteristic(
      device,
      FG_SETTINGS_UUID,
      BLOCK_DELAY_UUID
    );

    if (value === null) {
      console.log("[FGSettings] ⚠️ Block Delay is null");
      return null;
    }

    console.log(`[FGSettings] ✅ Block Delay = ${value}`);
    return value;
  } catch (err) {
    console.log("[FGSettings] ❌ Failed to read Block Delay:", err.message);
    return null;
  }
};

/**
 ** Writes Block Delay value to FG Settings service
 * @param {Object} device - connected BLE device
 * @param {number} value - new block delay value
 * @returns {boolean} success
 */
export const writeBlockDelay = async (device, value) => {
  if (!device) {
    console.log("[FGSettings] ❌ No device");
    return false;
  }

  try {
    console.log(`[FGSettings] ✍️ Writing Block Delay = ${value}`);

    const ok = await writeUint16BECharacteristic(
      device,
      FG_SETTINGS_UUID,
      BLOCK_DELAY_UUID,
      value
    );

    return ok;
  } catch (err) {
    console.log("[FGSettings] ❌ Failed to write Full Scale:", err.message);
    return false;
  }
};


//* Gas Type definitions (firmware enum)
export const GAS_TYPE_MAP = {
  0: "Methane",
  1: "Propane",
  2: "Butane",
};

/**
 ** Reads selected gas type (enum) from device
 * Returns: number (e.g. 0, 1, 2)
 */
export async function readGasType(device) {
  if (!device) {
    console.log("[GasType] ❌ No device");
    return null;
  }

  try {
    const value = await readUint16BECharacteristic(
      device,
      FG_SETTINGS_UUID,
      SELECT_GAS_TYPE_UUID
    );

    if (value === null) {
      console.log("[GasType] ❌ Value is null");
      return null;
    }

    console.log("[GasType] ✅ Gas type value:", value);
    return value;
  } catch (err) {
    console.log("[GasType] ❌ Failed to read gas type:", err.message);
    return null;
  }
}

/**
 ** Write Gas Type (enum, UInt8)
 * @param {Object} device - connected BLE device
 * @param {number} gasType - enum value (e.g. 0,1,2...)
 */
export async function writeGasType(device, gasType) {
  console.log("[GasType] ✍️ Writing gas type:", gasType);

  return await writeUint8Characteristic(
    device,
    FG_SETTINGS_UUID,
    SELECT_GAS_TYPE_UUID,
    gasType
  );
}
