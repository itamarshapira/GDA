// src/services/deviceInfoService.js
import {
  DEVICE_INFORMATION_UUID,
  MANUFACTURER_UUID,
  MODEL_NUMBER_UUID,
  SYSTEM_ID_UUID,
  SERIAL_NUMBER_UUID,
  DEVICE_IP_UUID,

  SSID_UUID
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

    //*  Read System ID (usually a byte array / serial-like value) ---- start
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
 //---- end System ID read ----


 // ---- Read Wi-Fi SSID + IP from duplicated 0x2A3D characteristics ----
await device.discoverAllServicesAndCharacteristics();

// Get all characteristics under Device Information service
const allChars = await device.characteristicsForService(DEVICE_INFORMATION_UUID);

// Find the two known instances
const char18 = allChars.find((c) => c.id === 18); // SSID
const char20 = allChars.find((c) => c.id === 20); // IP

let ssid = null;
let deviceIP = null;

// Read SSID (instance 18)
if (char18) {
  const r1 = await char18.read();
  if (r1?.value) {
    ssid = Buffer.from(r1.value, "base64").toString("utf-8");
  }
}

// Read Device IP (instance 20)
if (char20) {
  const r2 = await char20.read();
  if (r2?.value) {
    deviceIP = Buffer.from(r2.value, "base64").toString("utf-8");
  }
}
// ---- End Wi-Fi read ----


    return {
      manufacturer,  
      modelNumber, 
      serialNumber,
      systemID: systemIDHex, // formatted hex string
      ssid,
      deviceIP
    };
  } catch (error) {
    console.error("[DeviceInfo] Failed to read device information:", error);
    return null;
  }
};
