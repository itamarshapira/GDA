// src/services/deviceInfoService.js
import {
  DEVICE_INFORMATION_UUID,
  MANUFACTURER_UUID,
  MODEL_NUMBER_UUID,
  SYSTEM_ID_UUID,
  SERIAL_NUMBER_UUID,
  PRESENTATION_FORMAT_UUID, // not used yet, but ok to keep
} from "./bleUuidLabels";

import { readStringCharacteristic } from "./bleService";
import { Buffer } from "buffer";
global.Buffer = global.Buffer || Buffer;

/**
 * Reads device info characteristics like Manufacturer, Model Number, etc.
 * @param {Object} device - The connected BLE device (from react-native-ble-plx)
 * @returns {Object|null} - Device info strings or null on failure
 */
export const readDeviceInformation = async (device) => {
  try {
    if (!device) {
      console.log("[DeviceInfo] ❌ No device provided");
      return null;
    }

    //*  Read string characteristics using the helper 
    const manufacturer = await readStringCharacteristic( // read Manufacturer Name
      device,
      DEVICE_INFORMATION_UUID,
      MANUFACTURER_UUID
    );
    
    const modelNumber = await readStringCharacteristic( // read Model Number
      device,
      DEVICE_INFORMATION_UUID,
      MODEL_NUMBER_UUID
    );

    const serialNumber = await readStringCharacteristic( // read Serial Number
      device,
      DEVICE_INFORMATION_UUID,
      SERIAL_NUMBER_UUID
    );

    //*  Read System ID (usually a byte array / serial-like value)
    const systemChar = await device.readCharacteristicForService(
      DEVICE_INFORMATION_UUID,
      SYSTEM_ID_UUID
    );

    //*  Convert System ID bytes to hex string */
    let systemIDHex = null;
    if (systemChar?.value) {
      const bytes = Buffer.from(systemChar.value, "base64"); // raw bytes
      systemIDHex = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(":");
    }

    return {
      manufacturer,  
      modelNumber, 
      serialNumber,
      systemID: systemIDHex, // formatted hex string
    };
  } catch (error) {
    console.error("[DeviceInfo] Failed to read device information:", error);
    return null;
  }
};
