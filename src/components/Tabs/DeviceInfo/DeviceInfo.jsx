import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  StyleSheet,
  View,
  Linking,
  Button,
  TouchableOpacity,
} from "react-native";
import AndroidOpenSettings from "react-native-android-open-settings";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { readDeviceInformation } from "../../../services/deviceInfoService";

const DeviceInfo = ({ device }) => {
  const [info, setInfo] = useState(null); // device info state to hold info from BLE
  const [error, setError] = useState(null);

  const openWifiSettings = () => {
    AndroidOpenSettings.wifiSettings();
    // Opens system settings screen (user can tap Wi-Fi)
  };

  useEffect(() => {
    // on component mount or device change
    const fetchInfo = async () => {
      if (!device) {
        setError("No BLE device");
        return;
      }

      console.log("[DeviceInfo]  Reading...");
      const result = await readDeviceInformation(device);
      if (result) {
        console.log("[DeviceInfo]  Success:", result);
        setInfo(result);
      } else {
        setError("Failed to read");
      }
    };

    fetchInfo();
  }, [device]);

  return (
    <ScrollView
      style={styles.scrollArea}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.header}>Device Information</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      {info ? ( // if info is available, show it
        <>
          <View style={styles.row}>
            <View style={styles.colLabel}>
              <Text style={styles.label}>Device IP:</Text>
            </View>
            <View style={styles.colValueWide}>
              <Text style={styles.value}>{info.deviceIP}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.colLabel}>
              <Text style={styles.label}>SSID:</Text>
            </View>
            <View style={styles.colValueWide}>
              <Text style={styles.value}>{info.ssid}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.wifiButton}
            onPress={openWifiSettings}
          >
            <MaterialCommunityIcons name="wifi-cog" size={28} color="#fff" />
            <Text style={styles.wifiButtonText}>Open Wi-Fi Settings</Text>
          </TouchableOpacity>
          <View style={styles.row}>
            <View style={styles.colLabel}>
              <Text style={styles.label}>Manufacturer:</Text>
            </View>
            <View style={styles.colValueWide}>
              <Text style={styles.value}>{info.manufacturer}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.colLabel}>
              <Text style={styles.label}>Model:</Text>
            </View>
            <View style={styles.colValueWide}>
              <Text style={styles.value}>{info.modelNumber}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.colLabel}>
              <Text style={styles.label}>Serial:</Text>
            </View>
            <View style={styles.colValueWide}>
              <Text style={styles.value}>{info.serialNumber}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.colLabel}>
              <Text style={styles.label}>System ID:</Text>
            </View>
            <View style={styles.colValueWide}>
              <Text style={styles.value}>{info.systemID}</Text>
              {/* (MAC Address) helper text */}
              <Text style={styles.subText}>(MAC Address)</Text>
            </View>
          </View>

          {/* Extra text just to test scrolling */}
          {/* {Array.from({ length: 40 }).map((_, i) => (
      <Text key={i} style={styles.text}>scroll down...</Text>
    ))} */}
        </>
      ) : !error ? (
        <Text style={styles.text}>Reading...</Text>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // Full scroll area.
  // Why:
  // - Matches the new FGD dark navy dashboard style.
  // - Keeps the whole Device Info screen visually connected to the app.
  scrollArea: {
    flex: 1,
    backgroundColor: "#07111f",
  },

  // Inner content.
  // Why:
  // - alignItems: "stretch" lets each info row use full width.
  // - This creates clean dashboard strips instead of floating text rows.
  content: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "stretch",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 40,
  },

  header: {
    color: "#ffffff",
    fontSize: 24,
    marginBottom: 16,
    fontWeight: "800",
    textAlign: "center",
  },

  text: {
    color: "rgba(255,255,255,0.70)",
    fontSize: 17,
    marginBottom: 8,
    textAlign: "center",
    fontWeight: "700",
  },

  error: {
    color: "#ff6b6b",
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "700",
  },

  // One device information row.
  // Why:
  // - Compact dashboard strip style.
  // - Same visual language as Environmental and Device Settings.
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    marginBottom: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,

    backgroundColor: "rgba(13, 27, 47, 0.88)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(66, 153, 225, 0.26)",
  },

  // Label column.
  // Why:
  // - Fixed width keeps all values aligned.
  // - 118 is enough for "Manufacturer" without making the value too tight.
  colLabel: {
    width: 118,
    justifyContent: "center",
  },

  label: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 15,
    fontWeight: "800",
  },

  // Value column.
  // Why:
  // - flex: 1 lets long values use remaining space.
  // - Better than fixed width for IP, SSID, model, serial, etc.
  colValueWide: {
    flex: 1,
    justifyContent: "center",
  },

  value: {
    color: "#b2d9ff",
    fontWeight: "900",
    fontSize: 15,
  },

  subText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "600",
  },

  // Wi-Fi settings button.
  // Why:
  // - Uses the same blue dashboard action style.
  // - This is an important action because it helps the user connect to the detector AP.
  wifiButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#2f80ed",
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 999,
    marginTop: 4,
    marginBottom: 14,

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },

  wifiButtonText: {
    color: "#ffffff",
    marginLeft: 10,
    fontSize: 15,
    fontWeight: "800",
  },
});

export default DeviceInfo;
