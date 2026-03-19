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
  scrollArea: {
    // full height scrollable
    flex: 1,
    // backgroundColor: "rgb(40,40,40)",
  },
  content: {
    // inner content area
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: "center", // align center horizontally
    // justifyContent: "center", // align center vertically
  },
  header: {
    color: "#fff",
    fontSize: 22,
    marginBottom: 20,
    fontWeight: "bold",
  },
  text: {
    color: "#ccc",
    fontSize: 18,
    marginBottom: 8,
  },
  error: {
    color: "tomato",
    marginBottom: 10,
  },
  info: {
    color: "#b2b2f4ff",
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },

  colLabel: {
    width: 130, // fixed label column like DeviceSettings
    justifyContent: "center",
  },

  colValueWide: {
    width: 180, // fixed value column to keep alignment stable
    justifyContent: "center",
  },

  label: {
    color: "#ccc",
    fontSize: 14,
  },

  value: {
    color: "#b2b2f4ff",
    fontWeight: "bold",
    fontSize: 14,
  },

  subText: {
    color: "#888",
    fontSize: 12,
    marginTop: 2,
  },

  label: {
    width: 140, // 👈 fixed column for names
    color: "#ccc",
    fontSize: 18,
  },

  value: {
    flex: 1, // 👈 takes remaining space
    color: "#b2b2f4ff",
    fontSize: 18,
    fontWeight: "bold",
  },
  wifiButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2c2c2c",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 12,
    marginBottom: 12,
  },

  wifiButtonText: {
    color: "#fff",
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default DeviceInfo;
