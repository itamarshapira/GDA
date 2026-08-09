// src/services/sourceDeviceInfoService.js

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

// --------------------------------------------------
// UUIDs
// --------------------------------------------------

// Both Source Wi-Fi characteristics use the same UUID.
const WIFI_INFO_UUID =
  "00002a3d-0000-1000-8000-00805f9b34fb";

// Standard Bluetooth Characteristic User Description descriptor.
const USER_DESCRIPTION_UUID =
  "00002901-0000-1000-8000-00805f9b34fb";

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

/**
 * Decode a BLE base64 value into a clean UTF-8 string.
 */
const decodeStringValue = (base64Value) => {
  if (!base64Value) {
    return null;
  }

  return Buffer.from(base64Value, "base64")
    .toString("utf-8")
    .replace(/\0/g, "")
    .trim();
};

/**
 * Check whether a string is a valid-looking IPv4 address.
 *
 * Examples:
 * 10.42.0.1     -> true
 * 192.168.1.50  -> true
 * FGASS-0361    -> false
 */
const isIPv4Address = (value) => {
  if (!value) {
    return false;
  }

  const parts = value.split(".");

  if (parts.length !== 4) {
    return false;
  }

  return parts.every((part) => {
    if (!/^\d+$/.test(part)) {
      return false;
    }

    const number = Number(part);

    return number >= 0 && number <= 255;
  });
};

/**
 * Read the standard 0x2901 Characteristic User Description.
 *
 * Example descriptions may be something like:
 *
 * "SSID"
 * "IP"
 * "Device IP"
 *
 * We do not rely on the characteristic instance ID.
 */
const readCharacteristicDescription = async (
  characteristic,
) => {
  try {
    const descriptors =
      await characteristic.descriptors();

    const userDescription = descriptors.find(
      (descriptor) =>
        descriptor.uuid.toLowerCase() ===
        USER_DESCRIPTION_UUID,
    );

    if (!userDescription) {
      console.log(
        "sourceDeviceInfoService.js: No 0x2901 descriptor for characteristic:",
        characteristic.uuid,
      );

      return null;
    }

    const result = await userDescription.read();

    const description =
      decodeStringValue(result?.value);

    console.log(
      "sourceDeviceInfoService.js: 0x2901 description:",
      description,
    );

    return description;
  } catch (error) {
    console.log(
      "sourceDeviceInfoService.js: Failed reading 0x2901 description:",
      error.message,
    );

    return null;
  }
};

/**
 * Resolve the two duplicated 0x2A3D characteristics.
 *
 * IMPORTANT:
 *
 * We intentionally do NOT use characteristic.id.
 *
 * The ID can change after reconnect / GATT refresh.
 */
const resolveSourceWifiCharacteristics = async (
  device,
) => {
  console.log(
    "sourceDeviceInfoService.js: Resolving Source Wi-Fi characteristics",
  );

  await device.discoverAllServicesAndCharacteristics();

  const allCharacteristics =
    await device.characteristicsForService(
      DEVICE_INFORMATION_UUID,
    );

  // Find both duplicated 0x2A3D characteristics by UUID.
  const wifiCharacteristics =
    allCharacteristics.filter(
      (characteristic) =>
        characteristic.uuid.toLowerCase() ===
        WIFI_INFO_UUID,
    );

  console.log(
    "sourceDeviceInfoService.js: 0x2A3D characteristics found:",
    wifiCharacteristics.length,
  );

  if (wifiCharacteristics.length !== 2) {
    console.log(
      "sourceDeviceInfoService.js: Expected exactly 2 Wi-Fi characteristics",
    );

    return {
      ssidCharacteristic: null,
      ipCharacteristic: null,
    };
  }

  /*
   * Store everything we learn about each characteristic.
   *
   * id is logged ONLY for debugging.
   * It is NOT used for identification.
   */
  const candidates = [];

  for (const characteristic of wifiCharacteristics) {
    const description =
      await readCharacteristicDescription(
        characteristic,
      );

    let value = null;

    try {
      const result = await characteristic.read();

      value = decodeStringValue(result?.value);
    } catch (error) {
      console.log(
        "sourceDeviceInfoService.js: Failed reading Wi-Fi characteristic:",
        error.message,
      );
    }

    const candidate = {
      characteristic,
      id: characteristic.id,
      description,
      value,
    };

    candidates.push(candidate);

    console.log(
      "sourceDeviceInfoService.js: Wi-Fi candidate:",
      {
        id: characteristic.id,
        uuid: characteristic.uuid,
        description,
        value,
      },
    );
  }

  // --------------------------------------------------
  // FIRST METHOD:
  // Resolve using 0x2901 description
  // --------------------------------------------------

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

  // --------------------------------------------------
  // SECOND METHOD:
  // Resolve by actual value if description was unclear
  // --------------------------------------------------

  if (!ipCandidate) {
    ipCandidate = candidates.find((candidate) =>
      isIPv4Address(candidate.value),
    );

    if (ipCandidate) {
      console.log(
        "sourceDeviceInfoService.js: IP identified from IPv4 value",
      );
    }
  }

  /*
   * Once the IP characteristic is known,
   * the other duplicated characteristic is the SSID.
   */
  if (!ssidCandidate && ipCandidate) {
    ssidCandidate = candidates.find(
      (candidate) =>
        candidate.characteristic !==
        ipCandidate.characteristic,
    );

    if (ssidCandidate) {
      console.log(
        "sourceDeviceInfoService.js: SSID identified as remaining 0x2A3D characteristic",
      );
    }
  }

  /*
   * Same logic in the opposite direction:
   * if SSID was identified by descriptor first,
   * the other characteristic must be IP.
   */
  if (!ipCandidate && ssidCandidate) {
    ipCandidate = candidates.find(
      (candidate) =>
        candidate.characteristic !==
        ssidCandidate.characteristic,
    );
  }

  console.log(
    "sourceDeviceInfoService.js: Final Wi-Fi resolution:",
    {
      ssid: ssidCandidate
        ? {
            id: ssidCandidate.id,
            description:
              ssidCandidate.description,
            value: ssidCandidate.value,
          }
        : null,

      ip: ipCandidate
        ? {
            id: ipCandidate.id,
            description:
              ipCandidate.description,
            value: ipCandidate.value,
          }
        : null,
    },
  );

  return {
    ssidCharacteristic:
      ssidCandidate?.characteristic || null,

    ipCharacteristic:
      ipCandidate?.characteristic || null,

    /*
     * We already read the values while resolving,
     * so return them too.
     */
    ssidValue:
      ssidCandidate?.value || null,

    ipValue:
      ipCandidate?.value || null,
  };
};

// --------------------------------------------------
// MAIN SOURCE DEVICE INFORMATION READ
// --------------------------------------------------

export const readSourceDeviceInformation = async (
  device,
) => {
  try {
    if (!device) {
      console.log(
        "sourceDeviceInfoService.js: No BLE device provided",
      );

      return null;
    }

    console.log(
      "sourceDeviceInfoService.js: Reading Source device information",
    );

    // --------------------------------------------------
    // MANUFACTURER
    // --------------------------------------------------
    const manufacturer =
      await readStringCharacteristic(
        device,
        DEVICE_INFORMATION_UUID,
        MANUFACTURER_UUID,
      );

    // --------------------------------------------------
    // MODEL NUMBER
    // --------------------------------------------------
    const modelNumber =
      await readStringCharacteristic(
        device,
        DEVICE_INFORMATION_UUID,
        MODEL_NUMBER_UUID,
      );

    // --------------------------------------------------
    // SERIAL NUMBER
    // --------------------------------------------------
    const serialNumber =
      await readStringCharacteristic(
        device,
        DEVICE_INFORMATION_UUID,
        SERIAL_NUMBER_UUID,
      );

    // --------------------------------------------------
    // SYSTEM ID
    // --------------------------------------------------
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

    // --------------------------------------------------
    // SOURCE SSID + DEVICE IP
    // --------------------------------------------------
    const {
      ssidCharacteristic,
      ipCharacteristic,
      ssidValue,
      ipValue,
    } = await resolveSourceWifiCharacteristics(device);

    let ssid = ssidValue;
    let deviceIP = ipValue;

    /*
     * Normally the resolver already read both values.
     *
     * These reads are only a fallback in case the
     * characteristic was resolved but its first read
     * did not return a value.
     */

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

    console.log(
      "sourceDeviceInfoService.js: Source SSID:",
      ssid,
    );

    console.log(
      "sourceDeviceInfoService.js: Source device IP:",
      deviceIP,
    );

    const information = {
      manufacturer,
      modelNumber,
      serialNumber,
      systemID: systemIDHex,
      ssid,
      deviceIP,
    };

    console.log(
      "sourceDeviceInfoService.js: Source information read successfully:",
      information,
    );

    return information;
  } catch (error) {
    console.log(
      "sourceDeviceInfoService.js: Failed to read Source information:",
      error.message,
    );

    return null;
  }
};