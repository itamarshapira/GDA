// src/services/deviceInfoService.js

import {
  DEVICE_INFORMATION_UUID,
  MANUFACTURER_UUID,
  MODEL_NUMBER_UUID,
  SYSTEM_ID_UUID,
  SERIAL_NUMBER_UUID,
} from "./bleUuidLabels";

import { readStringCharacteristic } from "./bleService";
import { Buffer } from "buffer";

global.Buffer = global.Buffer || Buffer;


// Both Detector Wi-Fi values use the same UUID.
const WIFI_INFO_UUID =
  "00002a3d-0000-1000-8000-00805f9b34fb";

// Standard Characteristic User Description descriptor.
const USER_DESCRIPTION_UUID =
  "00002901-0000-1000-8000-00805f9b34fb";


// --------------------------------------------------
// Decode BLE string
// --------------------------------------------------
const decodeStringValue = (base64Value) => {
  if (!base64Value) return null;

  return Buffer.from(base64Value, "base64")
    .toString("utf-8")
    .replace(/\0/g, "")
    .trim();
};


// --------------------------------------------------
// Check whether value looks like IPv4
// --------------------------------------------------
const isIPv4Address = (value) => {
  if (!value) return false;

  const parts = value.split(".");

  if (parts.length !== 4) return false;

  return parts.every((part) => {
    if (!/^\d+$/.test(part)) return false;

    const number = Number(part);

    return number >= 0 && number <= 255;
  });
};


// --------------------------------------------------
// Read 0x2901 description
// --------------------------------------------------
const readCharacteristicDescription = async (characteristic) => {
  try {
    const descriptors = await characteristic.descriptors();

    const userDescription = descriptors.find(
      (descriptor) =>
        descriptor.uuid.toLowerCase() === USER_DESCRIPTION_UUID,
    );

    if (!userDescription) {
      console.log(
        "deviceInfoService.js: No 0x2901 descriptor for:",
        characteristic.uuid,
      );

      return null;
    }

    const result = await userDescription.read();

    const description = decodeStringValue(result?.value);

    console.log(
      "deviceInfoService.js: 0x2901 description:",
      description,
    );

    return description;
  } catch (error) {
    console.log(
      "deviceInfoService.js: Failed reading 0x2901 description:",
      error.message,
    );

    return null;
  }
};


// --------------------------------------------------
// Resolve duplicated SSID / IP characteristics
// --------------------------------------------------
const resolveWifiCharacteristics = async (device) => {
  console.log(
    "deviceInfoService.js: Resolving Detector Wi-Fi characteristics",
  );

  await device.discoverAllServicesAndCharacteristics();

  const allCharacteristics =
    await device.characteristicsForService(
      DEVICE_INFORMATION_UUID,
    );

  // Find both duplicated 0x2A3D characteristics.
  const wifiCharacteristics = allCharacteristics.filter(
    (characteristic) =>
      characteristic.uuid.toLowerCase() === WIFI_INFO_UUID,
  );

  console.log(
    "deviceInfoService.js: 0x2A3D characteristics found:",
    wifiCharacteristics.length,
  );

  if (wifiCharacteristics.length !== 2) {
    console.log(
      "deviceInfoService.js: Expected exactly 2 Wi-Fi characteristics",
    );

    return {
      ssidCharacteristic: null,
      ipCharacteristic: null,
      ssidValue: null,
      ipValue: null,
    };
  }

  const candidates = [];

  for (const characteristic of wifiCharacteristics) {
    const description =
      await readCharacteristicDescription(characteristic);

    let value = null;

    try {
      const result = await characteristic.read();

      value = decodeStringValue(result?.value);
    } catch (error) {
      console.log(
        "deviceInfoService.js: Failed reading Wi-Fi characteristic:",
        error.message,
      );
    }

    candidates.push({
      characteristic,
      id: characteristic.id, // debug only
      description,
      value,
    });

    console.log(
      "deviceInfoService.js: Wi-Fi candidate:",
      {
        id: characteristic.id,
        description,
        value,
      },
    );
  }


  // First try the 0x2901 descriptions.
  let ssidCandidate = candidates.find((candidate) => {
    const description =
      candidate.description?.toLowerCase() || "";

    return description.includes("ssid");
  });

  let ipCandidate = candidates.find((candidate) => {
    const description =
      candidate.description?.toLowerCase() || "";

    return (
      description.includes("ip") ||
      description.includes("address")
    );
  });


  // Fallback: identify IP from the actual value.
  if (!ipCandidate) {
    ipCandidate = candidates.find((candidate) =>
      isIPv4Address(candidate.value),
    );
  }


  // Once IP is known, the other 0x2A3D is SSID.
  if (!ssidCandidate && ipCandidate) {
    ssidCandidate = candidates.find(
      (candidate) =>
        candidate.characteristic !==
        ipCandidate.characteristic,
    );
  }


  // Or the opposite.
  if (!ipCandidate && ssidCandidate) {
    ipCandidate = candidates.find(
      (candidate) =>
        candidate.characteristic !==
        ssidCandidate.characteristic,
    );
  }


  console.log(
    "deviceInfoService.js: Final Detector Wi-Fi resolution:",
    {
      ssid: ssidCandidate?.value || null,
      ip: ipCandidate?.value || null,
    },
  );


  return {
    ssidCharacteristic:
      ssidCandidate?.characteristic || null,

    ipCharacteristic:
      ipCandidate?.characteristic || null,

    ssidValue:
      ssidCandidate?.value || null,

    ipValue:
      ipCandidate?.value || null,
  };
};


// --------------------------------------------------
// MAIN DETECTOR DEVICE INFORMATION READ
// --------------------------------------------------
export const readDeviceInformation = async (device) => {
  try {
    if (!device) {
      console.log(
        "deviceInfoService.js: No BLE device provided",
      );

      return null;
    }


    const manufacturer =
      await readStringCharacteristic(
        device,
        DEVICE_INFORMATION_UUID,
        MANUFACTURER_UUID,
      );


    const modelNumber =
      await readStringCharacteristic(
        device,
        DEVICE_INFORMATION_UUID,
        MODEL_NUMBER_UUID,
      );


    const serialNumber =
      await readStringCharacteristic(
        device,
        DEVICE_INFORMATION_UUID,
        SERIAL_NUMBER_UUID,
      );


    // System ID / MAC
    const systemCharacteristic =
      await device.readCharacteristicForService(
        DEVICE_INFORMATION_UUID,
        SYSTEM_ID_UUID,
      );

    let systemIDHex = null;

    if (systemCharacteristic?.value) {
      const bytes = Buffer.from(
        systemCharacteristic.value,
        "base64",
      );

      systemIDHex = Array.from(bytes)
        .map((byte) =>
          byte.toString(16).padStart(2, "0"),
        )
        .join(":");
    }


    // Resolve SSID + IP without hardcoded characteristic IDs.
    const {
      ssidCharacteristic,
      ipCharacteristic,
      ssidValue,
      ipValue,
    } = await resolveWifiCharacteristics(device);


    let ssid = ssidValue;
    let deviceIP = ipValue;


    // Fallback reads.
    if (!ssid && ssidCharacteristic) {
      const result =
        await ssidCharacteristic.read();

      ssid = decodeStringValue(result?.value);
    }


    if (!deviceIP && ipCharacteristic) {
      const result =
        await ipCharacteristic.read();

      deviceIP =
        decodeStringValue(result?.value);
    }


    const information = {
      manufacturer,
      modelNumber,
      serialNumber,
      systemID: systemIDHex,
      ssid,
      deviceIP,
    };


    console.log(
      "deviceInfoService.js: Detector information:",
      information,
    );


    return information;
  } catch (error) {
    console.log(
      "deviceInfoService.js: Failed to read Detector information:",
      error.message,
    );

    return null;
  }
};