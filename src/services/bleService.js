// src/services/bleService.js

import { BleManager } from "react-native-ble-plx";
// import { characteristicNames } from "./services/bleUuidLabels";
// Create a shared BLE manager for the whole app
export const manager = new BleManager();

/**
 * Connects to the first FG device found.
 */
export async function connectToDevice() {
  console.log("🔍 Scanning for BLE devices... (bleService.js)");
  let isConnected = false;

  return new Promise((resolve, reject) => {
    manager.startDeviceScan(null, null, async (error, device) => {
      if (error) {
        console.log("❌ Scan error:", error);
        manager.stopDeviceScan();
        reject(error);
        return;
      }

      if (device && device.name && /^fg/i.test(device.name)) {
        console.log(`✅ Found FG device: ${device.name}`);
        manager.stopDeviceScan();

        try {
          console.log("🔗 Connecting...");
          const connectedDevice = await device.connect();
          console.log(`✅ Connected to: ${connectedDevice.name}`);
          isConnected = true;

          await connectedDevice.discoverAllServicesAndCharacteristics();
          console.log("🔎 Services & characteristics discovered");

          await logServicesAndCharacteristics(connectedDevice);
          resolve(connectedDevice);
        } catch (err) {
          console.log("❌ Connection error:", err);
          reject(err);
        }
      }
    });

    setTimeout(() => {
      if (!isConnected) {
        console.log("⏱️ Scan timeout — device not found.");
        manager.stopDeviceScan();
        reject(new Error("Device not found"));
      }
    }, 30000);
  });
}

/**
 * Disconnects from the connected BLE device.
 */
export async function disconnectDevice(device) {
  try {
    if (device) {
      console.log(`🔌 Disconnecting from ${device.name || "device"}...`);
      
      await device.cancelConnection();
      console.log("✅ Disconnected successfully.");
      return true;
    }
    console.log("⚠️ No device to disconnect.");
    return false;
  } catch (error) {
    console.log("❌ Disconnect error:", error);
    return false;
  }
}



/**
 * Lists all services and characteristics of a connected device.
 */
export async function logServicesAndCharacteristics(device) {
  try {
    const services = await device.services();
    const result = [];

    for (const service of services) {
      const serviceInfo = {
        uuid: service.uuid,
        characteristics: [],
      };

      const characteristics = await service.characteristics();
      for (const char of characteristics) {
        //const name = characteristicNames[char.uuid.toLowerCase()] || "Unknown";
        const charInfo = {
          uuid: char.uuid,
          isReadable: char.isReadable,
          isWritableWithResponse: char.isWritableWithResponse,
          isWritableWithoutResponse: char.isWritableWithoutResponse,
          isNotifiable: char.isNotifiable,
          isIndicatable: char.isIndicatable,
        };

        // ✅ Add characteristic info to array
        serviceInfo.characteristics.push(charInfo);

        // 🔍 Optional logging for each char (can remove later)
        console.log(`Service: ${service.uuid}`);
        console.log(`   Characteristic: ${char.uuid}`);
        console.log(`      Properties:`,
          char.isReadable ? "READ " : "",
          char.isWritableWithResponse ? "WRITE " : "",
          char.isWritableWithoutResponse ? "WRITE_NO_RESP " : "",
          char.isNotifiable ? "NOTIFY " : "",
          char.isIndicatable ? "INDICATE" : ""
        );
      }

      result.push(serviceInfo);
    }

    console.log("✅ Finished listing services.");
    return result; // 👈 this is the key new part
  } catch (error) {
    console.log("❌ Error listing services:", error.message);
    return null;
  }
}


/**
 * Forces Android to refresh the GATT table.
 * (Android caches the GATT after first connect.)
 */
export async function forceRefreshGatt(device) {
  try {
    if (!device) {
      console.log("[BleRefresh] ❌ No device provided");
      return null;
    }

    console.log("[BleRefresh] 🔄 Forcing GATT refresh...");
    await device.cancelConnection();
    await new Promise((r) => setTimeout(r, 1000));

    const newDevice = await manager.connectToDevice(device.id, {
      autoConnect: false,
    });
    await newDevice.discoverAllServicesAndCharacteristics();

    console.log("[BleRefresh]  GATT rediscovery complete");
    return newDevice;
  } catch (e) {
    console.log("[BleRefresh]  Failed to refresh GATT:", e.message);
    return null;
  }
}

//*  Helper to read a UTF-8 string from a characteristic (React Native version)
/** 
 * readStringCharacteristic
takes a connected device + service UUID + characteristic UUID,
asks the device for the characteristic,
gets its value as base64,
decodes it back to text,
and returns that text
 * @param {} device
 * @param {*} serviceUUID 
 * @param {*} characteristicUUID 
 * @returns 
 */
export const readStringCharacteristic = async (
  device,  // for example came from App.js via Tabs.jsx via for example readDeviceInformation 
  serviceUUID,
  characteristicUUID
) => {
  try {
    if (!device) {
      console.log("[BLE]  No device given to readStringCharacteristic");
      return null;
    }

    //  Read characteristic (returns an object with `.value` as base64 string)
    const characteristic = await device.readCharacteristicForService(
      serviceUUID,
      characteristicUUID
    );

    if (!characteristic?.value) {
      console.log(
        `[BLE]  Empty value for ${serviceUUID} / ${characterUUID}`
      );
      return null;
    }

    //  Decode base64 → bytes → UTF-8 string
    const bytes = Buffer.from(characteristic.value, "base64");
    const decoded = bytes.toString("utf-8");

    console.log(`[BLE] Read string from ${characteristicUUID}:`, decoded);
    return decoded;
  } catch (error) {
    console.error(
      `[BLE] Failed to read string ${characteristicUUID}:`,
      error.message || error
    );
    return null;
  }
};


/**
 * //* Read a 16-bit Big-endian unsigned integer (for now only read mathane use it)
 * UInt16 ⟶ smaller, 2 bytes → perfect for sensors
 * @param {*} device  the connected device 
 * @param {*} serviceUUID  
 * @param {*} characteristicUUID 
 * @returns 
 */
export const readUint16BECharacteristic = async (device, serviceUUID, characteristicUUID) => {
  try { 
    const characteristic = await device.readCharacteristicForService(
      serviceUUID,
      characteristicUUID
    );
    // Check if value exists
    if (!characteristic?.value) return null;

    // Decode base64 to bytes
    const bytes = Buffer.from(characteristic.value, "base64");

    // Ensure there are at least 2 bytes
    if (bytes.length < 2) return null;

    // BIG-endian decode
    const value = bytes.readUInt16BE(0); // readUInt16BE reads first 2 bytes as big-endian and converts to //*decimal number

    console.log(`[BLE] Uint16 read from ${characteristicUUID}: (Dec )`, value );
    console.log( `(Hex: 0x${value.toString(16).padStart(4, "0").toUpperCase()})`);
    return value;
  } catch (err) {
    console.log(`[BLE] Failed to read Uint16: ${err.message}`);
    return null;
  }
};

/**
 * //* Read a 16-bit little-endian!! unsigned integer 
 * @param {*} device  the connected device 
 * @param {*} serviceUUID  
 * @param {*} characteristicUUID 
 * @returns 
 */
export const readUint16LECharacteristic = async (device, serviceUUID, characteristicUUID) => {
  try { 
    const characteristic = await device.readCharacteristicForService(
      serviceUUID,
      characteristicUUID
    );
    // Check if value exists
    if (!characteristic?.value) return null;

    // Decode base64 to bytes
    const bytes = Buffer.from(characteristic.value, "base64");

    // Ensure there are at least 2 bytes
    if (bytes.length < 2) return null;

    // Litlle-endian decode
    const value = bytes.readUInt16LE(0);

    console.log(`[BLE] Uint16 read from ${characteristicUUID}:`, value);
    return value;
  } catch (err) {
    console.log(`[BLE] Failed to read Uint16: ${err.message}`);
    return null;
  }
};


/**
 ** Monitors a UInt16 Litlle-ENDIAN characteristic with NOTIFY. (mathene use it)
 * 
 * - device: connected BLE device
 * - serviceUUID: service that owns the characteristic
 * - characteristicUUID: the characteristic we subscribe to
 * - onValue: callback(value) → gets called every time new data arrives
 * 
 * Returns: subscription object (call subscription.remove() to stop)
 */
export const monitorUint16LECharacteristic = (
  device,
  serviceUUID,
  characteristicUUID,
  onValue // callback from environmentalService.js that came from Environmental.jsx
) => {
  if (!device) {
    console.log("[BLE] ❌ No device given to monitorUint16BECharacteristic");
    return null;
  }

  console.log(
    `[BLE] 📡 Subscribing (NOTIFY) to ${characteristicUUID} on service ${serviceUUID}`
  );

  // monitorCharacteristicForService sets up the notification listener
  const subscription = device.monitorCharacteristicForService(
    serviceUUID,
    characteristicUUID,
    (error, characteristic) => {
      if (error) {
        console.log("[BLE] ❌ Monitor error:", error.message);
        return;
      }

      if (!characteristic?.value) {
        // sometimes notifications come with empty payload
        return;
      }

      try {
        // base64 -> bytes
        const bytes = Buffer.from(characteristic.value, "base64");

        if (bytes.length < 2) {
          console.log("[BLE] ⚠️ Monitor: not enough bytes for UInt16");
          return;
        }

        // litlle-ENDIAN decode
        const value = bytes.readUInt16LE(0);

        console.log(
          `[BLE] 🔔 Notification from ${characteristicUUID}: ${value}`
        );

        // give decoded value to whoever called this helper
        if (typeof onValue === "function") {
          onValue(value);
        }
      } catch (e) {
        console.log("[BLE]  Failed to decode notification:", e.message);
      }
    }
  );

  // The caller must keep this and call .remove()
  return subscription;
};

/**
 ** Writes a UInt16 litlle-ENDIAN to a writable characteristic. 
 *
 * - device: connected BLE device
 * - serviceUUID: service containing the characteristic
 * - characteristicUUID: the target characteristic
 * - value: integer (0–65535)
 *
 * Returns: true if success
 */
export async function writeUint16LECharacteristic(
  device,
  serviceUUID,
  characteristicUUID,
  value
) {
  try {
    if (!device) {
      console.log("[BLE] ❌ No device given to write");
      return false;
    }

    
    const buffer = Buffer.alloc(2);
    buffer.writeUInt16LE(value); 

    const base64Payload = buffer.toString("base64");

    await device.writeCharacteristicWithResponseForService(
      serviceUUID,
      characteristicUUID,
      base64Payload
    );

    console.log(`[BLE] ✍️ Wrote UInt16 to ${characteristicUUID}:`, value);
    return true;
  } catch (err) {
    console.log("[BLE] ❌ Write failed:", err.message);
    return false;
  }
}


/**
 ** Writes a UInt16 **BIG-ENDIAN** to a writable characteristic. 
 *
 * - device: connected BLE device
 * - serviceUUID: service containing the characteristic
 * - characteristicUUID: the target characteristic
 * - value: integer (0–65535)
 *
 * Returns: true if success
 */
export async function writeUint16BECharacteristic(
  device,
  serviceUUID,
  characteristicUUID,
  value
) {
  try {
    if (!device) {
      console.log("[BLE] ❌ No device given to write");
      return false;
    }

    // Convert integer → 2-byte big endian
    const buffer = Buffer.alloc(2);
    buffer.writeUInt16BE(value);

    const base64Payload = buffer.toString("base64");

    await device.writeCharacteristicWithResponseForService(
      serviceUUID,
      characteristicUUID,
      base64Payload
    );

    console.log(`[BLE] ✍️ Wrote UInt16 to ${characteristicUUID}:`, value);
    return true;
  } catch (err) {
    console.log("[BLE] ❌ Write failed:", err.message);
    return false;
  }
}

/**
 * Write UInt8 (1 byte) to a BLE characteristic
 * Used for enum-like values (e.g. Gas Type)
 */
export async function writeUint8Characteristic(
  device,
  serviceUUID,
  characteristicUUID,
  value
) {
  try {
    if (!device) {
      console.log("[BLE] ❌ No device given to write UInt8");
      return false;
    }

    const buffer = Buffer.alloc(1); // 👈 EXACTLY 1 byte
    buffer.writeUInt8(value);

    const base64Payload = buffer.toString("base64");

    await device.writeCharacteristicWithResponseForService(
      serviceUUID,
      characteristicUUID,
      base64Payload
    );

    console.log(
      `[BLE] ✍️ Wrote UInt8 to ${characteristicUUID}:`,
      value
    );

    return true;
  } catch (err) {
    console.log("[BLE] ❌ UInt8 write failed:", err.message);
    return false;
  }
}

/**
 * Read a UInt8 (1 byte) from a BLE characteristic.
 * Perfect for enum values like Media Control Point (0/1/2).
 */
export const readUint8Characteristic = async (
  device,
  serviceUUID,
  characteristicUUID
) => {
  try {
    if (!device) {
      console.log("[BLE] ❌ No device given to read UInt8");
      return null;
    }

    const characteristic = await device.readCharacteristicForService(
      serviceUUID,
      characteristicUUID
    );

    if (!characteristic?.value) return null;

    const bytes = Buffer.from(characteristic.value, "base64");

    // Ensure at least 1 byte exists
    if (bytes.length < 1) return null;

    const value = bytes.readUInt8(0);

    console.log(`[BLE] UInt8 read from ${characteristicUUID}:`, value);
    return value;
  } catch (err) {
    console.log(`[BLE] Failed to read UInt8: ${err.message}`);
    return null;
  }
};


