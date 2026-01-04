import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import {
  readMethane,
  readTemperature,
  readMeasurementInterval,
  monitorMethaneNotifications,
  writeMeasurementInterval,
} from "../../../services/environmentalService";

const Environmental = ({ device }) => {
  // UI states
  const [methane, setMethane] = useState(null);
  const [temperature, setTemperature] = useState(null);
  const [interval, setInterval] = useState(null);
  const [error, setError] = useState(null);

  // NOTIFY toggle state
  const [notifyMethane, setNotifyMethane] = useState(false);

  // Refs for stable subscription + live toggle flag
  const methaneSubRef = useRef(null); // stores subscription (never removed)
  const isLiveRef = useRef(false); // true = update UI, false = ignore

  // -------------------------------------------
  // SAFE TOGGLE FOR METHANE NOTIFY (NO CRASH)
  // -------------------------------------------
  const toggleMethaneNotify = () => {
    console.log("[Environmental] Toggling methane notify...");

    // OFF → ON
    if (!notifyMethane) {
      console.log("[Environmental] ▶️ Enabling LIVE methane updates...");

      if (!device) return;

      const sub = monitorMethaneNotifications(device, (value) => {
        console.log("[Environmental] 🔔 LIVE methane:", value);
        setMethane(value);
      });

      methaneSubRef.current = sub;
      setNotifyMethane(true);
      return;
    }

    // ON → OFF
    console.log(
      "[Environmental] ⏹️ Disabling LIVE methane updates (hard stop)..."
    );

    if (methaneSubRef.current) {
      methaneSubRef.current.remove(); // ✅ REAL unsubscribe
      methaneSubRef.current = null;
    }

    setNotifyMethane(false);
  };

  // -------------------------------------------
  // INITIAL READ OF METHANE + TEMPERATURE
  // -------------------------------------------
  useEffect(() => {
    console.log(
      "[Environmental] useEffect triggered. Device is:",
      device ? "OK" : "NULL"
    );

    if (!device) {
      setError("No BLE device connected");
      setMethane(null);
      setTemperature(null);
      setInterval(null);
      return;
    }

    const fetchData = async () => {
      try {
        console.log("[Environmental] Reading methane + temperature…");

        const methaneValue = await readMethane(device);
        if (methaneValue !== null) setMethane(methaneValue);

        const tempValue = await readTemperature(device);
        if (tempValue !== null) setTemperature(tempValue);

        const intervalValue = await readMeasurementInterval(device);
        if (intervalValue !== null) setInterval(intervalValue);

        if (methaneValue === null && tempValue === null) {
          setError("Failed to read Environmental Sensing");
        }
      } catch (err) {
        console.log("[Environmental] Error:", err.message);
        setError("Read error");
      }
    };

    fetchData();

    // Cleanup — DO NOT REMOVE subscription here
    return () => {
      console.log("[Environmental] cleanup: removing methane subscription");

      if (methaneSubRef.current) {
        methaneSubRef.current.remove();
        methaneSubRef.current = null;
      }
    };
  }, [device]);

  // -------------------------------------------
  // CHANGE MEASUREMENT INTERVAL
  // -------------------------------------------
  const handleSetInterval = async (sec) => {
    if (!device) return;

    console.log(`[Environmental] ✍️ Setting interval to ${sec}s`);

    const ok = await writeMeasurementInterval(device, sec);
    if (ok) {
      setInterval(sec);
      console.log("[Environmental] Interval changed!");
    } else {
      console.log("[Environmental] Failed to change interval");
    }
  };

  // -------------------------------------------
  // UI RENDER
  // -------------------------------------------
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Environmental Sensing</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      {methane !== null ? (
        <>
          <Text style={styles.text}>
            Methane Concentration:{" "}
            <Text style={styles.value}>{methane} LEL</Text>
          </Text>

          {/* Toggle Methane Notify Button */}
          <Text
            onPress={toggleMethaneNotify}
            style={{
              marginTop: 20,
              paddingVertical: 10,
              paddingHorizontal: 20,
              backgroundColor: notifyMethane ? "#c62828" : "#2e7d32",
              color: "white",
              borderRadius: 8,
              fontSize: 18,
            }}
          >
            {notifyMethane ? "STOP Methane Notify" : "START Methane Notify"}
          </Text>
        </>
      ) : (
        <Text style={styles.text}>Reading methane…</Text>
      )}

      {temperature !== null ? (
        <>
          <Text style={[styles.text, { marginTop: 18 }]}>
            Temperature:{" "}
            <Text style={styles.value}>{(temperature / 100).toFixed(2)}</Text>
          </Text>
        </>
      ) : (
        <Text style={styles.text}>Reading temperature…</Text>
      )}

      {/* Measurement Interval quick set */}
      {interval !== null && (
        <View style={{ marginTop: 20, alignItems: "center" }}>
          <Text style={styles.text}>Set Measurement Interval:</Text>

          <View style={styles.buttonRow}>
            {[1, 3, 5, 10].map((sec) => (
              <Text
                key={sec}
                style={[
                  styles.intervalButton,
                  interval === sec && styles.intervalActive,
                ]}
                onPress={() => handleSetInterval(sec)}
              >
                {sec}s
              </Text>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default Environmental;

// -------------------------------------------
// STYLES
// -------------------------------------------
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    color: "#fff",
    fontSize: 24,
    marginBottom: 20,
    fontWeight: "bold",
  },
  text: {
    color: "#ccc",
    fontSize: 18,
    marginBottom: 8,
    textAlign: "center",
  },
  value: {
    color: "#b2b2f4ff",
    fontWeight: "bold",
  },
  error: {
    color: "tomato",
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  intervalButton: {
    backgroundColor: "#444",
    color: "#fff",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 30,
  },
  intervalActive: {
    backgroundColor: "#6a6af4",
    fontWeight: "bold",
  },
});
