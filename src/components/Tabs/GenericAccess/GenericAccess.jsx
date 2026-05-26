// src/components/Tabs/GenericAccess/GenericAccess.js

import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import { readGenericAccessInfo } from "../../../services/genericAccessService";

const GenericAccess = ({ device }) => {
  // device prop passed from parent Tabs , and tabs get it from App, and app gets it from bleService
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInfo = async () => {
      if (!device) {
        setError("No BLE device");
        return;
      }

      console.log("[GenericAccess]  Reading...");
      const data = await readGenericAccessInfo(device);

      if (data) {
        console.log("🟪 [Generic Access] Sucsses:", data);
        setInfo(data);
      } else {
        setError("Failed to read Generic Access info");
      }
    };

    fetchInfo();
  }, [device]); // re-run if device changes and when component mounts

  return (
    <ScrollView
      style={styles.scrollArea}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.header}>Generic Access </Text>

      {error && <Text style={styles.error}>{error}</Text>}

      {info ? (
        <>
          <Text style={styles.text}>
            Device Name: <Text style={styles.info}>{info.deviceName}</Text>
          </Text>
          <Text style={styles.text}>
            Appearance:{" "}
            <Text style={styles.info}>
              {info.appearance !== null ? info.appearance : "N/A"}
            </Text>{" "}
            (Generic Sensor)
          </Text>
        </>
      ) : !error ? (
        <Text style={styles.text}>Reading...</Text>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // Full screen background.
  // Why:
  // - Matches the FGD dark navy dashboard style.
  // - Keeps Generic Access visually consistent with Device Info.
  scrollArea: {
    flex: 1,
    backgroundColor: "#07111f",
  },

  // Inner content area.
  // Why:
  // - alignItems: "stretch" allows info rows to use full width.
  // - This makes the screen feel like a dashboard panel instead of loose text.
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
    fontWeight: "800",
    marginBottom: 16,
    textAlign: "center",
  },

  text: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,

    backgroundColor: "rgba(13, 27, 47, 0.88)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(66, 153, 225, 0.26)",
  },

  info: {
    color: "#b2d9ff",
    fontWeight: "900",
  },

  error: {
    color: "#ff6b6b",
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "700",
  },
});

export default GenericAccess;
