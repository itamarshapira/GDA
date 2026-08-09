// src/components/SourceTabs/SourceDeviceInfo/SourceDeviceInfo.jsx

import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
} from "react-native";

import AndroidOpenSettings from "react-native-android-open-settings";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { readSourceDeviceInformation } from "../../../services/sourceDeviceInfoService";

const SourceDeviceInfo = ({ device }) => {
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);

  const openWifiSettings = () => {
    AndroidOpenSettings.wifiSettings();
  };

  useEffect(() => {
    let cancelled = false;

    const fetchSourceInfo = async () => {
      if (!device) {
        setError("No BLE device");
        return;
      }

      setInfo(null);
      setError(null);

      console.log("SourceDeviceInfo.jsx: Reading Source device information");

      const result = await readSourceDeviceInformation(device);

      if (cancelled) {
        return;
      }

      if (result) {
        console.log(
          "SourceDeviceInfo.jsx: Source information received:",
          result,
        );

        setInfo(result);
      } else {
        setError("Failed to read Source information");
      }
    };

    fetchSourceInfo();

    return () => {
      cancelled = true;
    };
  }, [device]);

  return (
    <ScrollView
      style={styles.scrollArea}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.header}>Source Information</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      {info ? (
        <>
          <View style={styles.row}>
            <View style={styles.colLabel}>
              <Text style={styles.label}>Device IP:</Text>
            </View>

            <View style={styles.colValueWide}>
              <Text style={styles.value}>{info.deviceIP || "—"}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.colLabel}>
              <Text style={styles.label}>SSID:</Text>
            </View>

            <View style={styles.colValueWide}>
              <Text style={styles.value}>{info.ssid || "—"}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.wifiButton}
            onPress={openWifiSettings}
            activeOpacity={0.75}
          >
            <MaterialCommunityIcons name="wifi-cog" size={28} color="#ffffff" />

            <Text style={styles.wifiButtonText}>Open Wi-Fi Settings</Text>
          </TouchableOpacity>

          <View style={styles.row}>
            <View style={styles.colLabel}>
              <Text style={styles.label}>Manufacturer:</Text>
            </View>

            <View style={styles.colValueWide}>
              <Text style={styles.value}>{info.manufacturer || "—"}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.colLabel}>
              <Text style={styles.label}>Model:</Text>
            </View>

            <View style={styles.colValueWide}>
              <Text style={styles.value}>{info.modelNumber || "—"}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.colLabel}>
              <Text style={styles.label}>Serial:</Text>
            </View>

            <View style={styles.colValueWide}>
              <Text style={styles.value}>{info.serialNumber || "—"}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.colLabel}>
              <Text style={styles.label}>System ID:</Text>
            </View>

            <View style={styles.colValueWide}>
              <Text style={styles.value}>{info.systemID || "—"}</Text>

              <Text style={styles.subText}>(MAC Address)</Text>
            </View>
          </View>
        </>
      ) : !error ? (
        <Text style={styles.text}>Reading...</Text>
      ) : null}
    </ScrollView>
  );
};

export default SourceDeviceInfo;

const styles = StyleSheet.create({
  scrollArea: {
    flex: 1,
    backgroundColor: "#07111f",
  },

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

  colLabel: {
    width: 118,
    justifyContent: "center",
  },

  label: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 15,
    fontWeight: "800",
  },

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
