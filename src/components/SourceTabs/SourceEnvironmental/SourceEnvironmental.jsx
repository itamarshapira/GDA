// src/components/SourceTabs/SourceEnvironmental/SourceEnvironmental.jsx

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import {
  readTemperature,
  readMeasurementInterval,
  monitorTemperatureNotifications,
  writeMeasurementInterval,
} from "../../../services/environmentalService";

const SourceEnvironmental = ({ device }) => {
  // Current temperature value received from the Source.
  const [temperature, setTemperature] = useState(null);

  // Current measurement interval: 1, 3, 5, or 10 seconds.
  const [interval, setInterval] = useState(null);

  const [error, setError] = useState(null);

  // Controls the temperature notification icon/state.
  const [notifyTemperature, setNotifyTemperature] = useState(false);

  // Stores the active BLE notification subscription.
  // We need this reference so we can stop the subscription later.
  const temperatureSubRef = useRef(null);

  // --------------------------------------------------
  // ENABLE / DISABLE LIVE TEMPERATURE NOTIFICATIONS
  // --------------------------------------------------
  const toggleTemperatureNotify = () => {
    console.log("SourceEnvironmental.jsx: Toggling temperature notification");

    // Notification is currently OFF, so enable it.
    if (!notifyTemperature) {
      if (!device) {
        console.log(
          "SourceEnvironmental.jsx: Cannot enable temperature notify — no BLE device",
        );
        return;
      }

      console.log("SourceEnvironmental.jsx: Enabling live temperature updates");

      const subscription = monitorTemperatureNotifications(device, (value) => {
        console.log(
          "SourceEnvironmental.jsx: Live temperature received:",
          value,
        );

        setTemperature(value);
      });

      // Save the subscription so it can be removed later.
      temperatureSubRef.current = subscription;

      setNotifyTemperature(true);
      return;
    }

    // Notification is currently ON, so disable it.
    console.log("SourceEnvironmental.jsx: Disabling live temperature updates");

    if (temperatureSubRef.current) {
      temperatureSubRef.current.remove();
      temperatureSubRef.current = null;
    }

    setNotifyTemperature(false);
  };

  // --------------------------------------------------
  // INITIAL TEMPERATURE + INTERVAL READ
  // --------------------------------------------------
  useEffect(() => {
    console.log(
      "SourceEnvironmental.jsx: Component received device:",
      device?.name || "No device",
    );

    if (!device) {
      setError("No BLE device connected");
      setTemperature(null);
      setInterval(null);
      return;
    }

    const fetchData = async () => {
      try {
        setError(null);

        console.log(
          "SourceEnvironmental.jsx: Reading temperature and measurement interval",
        );

        const temperatureValue = await readTemperature(device);

        if (temperatureValue !== null) {
          setTemperature(temperatureValue);
        }

        const intervalValue = await readMeasurementInterval(device);

        if (intervalValue !== null) {
          setInterval(intervalValue);
        }

        if (temperatureValue === null) {
          setError("Failed to read Source temperature");
        }
      } catch (err) {
        console.log(
          "SourceEnvironmental.jsx: Environmental read error:",
          err.message,
        );

        setError("Read error");
      }
    };

    fetchData();

    /*
     * Cleanup runs when this component is removed or when the BLE
     * device changes. It prevents an old notification subscription
     * from remaining active.
     */
    return () => {
      console.log(
        "SourceEnvironmental.jsx: Cleaning temperature notification subscription",
      );

      if (temperatureSubRef.current) {
        temperatureSubRef.current.remove();
        temperatureSubRef.current = null;
      }
    };
  }, [device]);

  // --------------------------------------------------
  // CHANGE MEASUREMENT INTERVAL
  // --------------------------------------------------
  const handleSetInterval = async (seconds) => {
    if (!device) {
      return;
    }

    console.log(
      `SourceEnvironmental.jsx: Setting measurement interval to ${seconds}s`,
    );

    const success = await writeMeasurementInterval(device, seconds);

    if (success) {
      setInterval(seconds);

      console.log(
        "SourceEnvironmental.jsx: Measurement interval changed successfully",
      );
    } else {
      console.log(
        "SourceEnvironmental.jsx: Failed to change measurement interval",
      );
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="always"
      >
        <Text style={styles.header}>Environmental Sensing</Text>

        {error && <Text style={styles.error}>{error}</Text>}

        {/* Temperature value and live-notification control */}
        {temperature !== null ? (
          <View style={styles.sensorStrip}>
            <Text style={styles.sensorStripText}>
              Temperature:{" "}
              <Text style={styles.value}>{temperature.toFixed(2)} °C</Text>
            </Text>

            <TouchableOpacity
              onPress={toggleTemperatureNotify}
              activeOpacity={0.2}
            >
              <MaterialIcons
                name={notifyTemperature ? "notifications" : "notifications-off"}
                size={30}
                color={notifyTemperature ? "#04de71ff" : "#8f9aaa"}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.text}>Reading temperature…</Text>
        )}
      </ScrollView>

      {/* Measurement interval controls remain fixed at the bottom */}
      {interval !== null && (
        <View style={styles.intervalContainer}>
          <Text style={styles.text}>Set Measurement Interval:</Text>

          <View style={styles.buttonRow}>
            {[1, 3, 5, 10].map((seconds) => (
              <TouchableOpacity
                key={seconds}
                onPress={() => handleSetInterval(seconds)}
                activeOpacity={0.6}
              >
                <View
                  style={[
                    styles.intervalButton,
                    interval === seconds && styles.intervalActive,
                  ]}
                >
                  <Text style={styles.intervalButtonText}>{seconds}s</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

export default SourceEnvironmental;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,

    // Leaves space for the fixed interval controls.
    paddingBottom: 130,
  },

  header: {
    color: "#ffffff",
    fontSize: 24,
    marginBottom: 20,
    fontWeight: "bold",
  },

  text: {
    color: "#cccccc",
    fontSize: 18,
    marginBottom: 8,
    textAlign: "center",
  },

  value: {
    color: "rgb(139, 192, 252)",
    fontWeight: "bold",
  },

  error: {
    color: "tomato",
    marginBottom: 12,
  },

  sensorStrip: {
    width: "100%",
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "rgba(13, 27, 47, 0.88)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(66, 153, 225, 0.28)",

    paddingHorizontal: 16,
    marginBottom: 8,
  },

  sensorStripText: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 17,
    fontWeight: "700",
    marginRight: 12,
    textAlign: "center",
  },

  intervalContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,

    zIndex: 999,
    elevation: 20,

    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,

    backgroundColor: "#07111f",
    borderTopWidth: 1,
    borderTopColor: "rgba(66, 153, 225, 0.25)",
  },

  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

  intervalButton: {
    backgroundColor: "rgba(13, 27, 47, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(66, 153, 225, 0.28)",

    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 999,
    marginBottom: 4,
  },

  intervalActive: {
    backgroundColor: "#2f80ed",
    borderColor: "#2f80ed",
  },

  intervalButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
});
