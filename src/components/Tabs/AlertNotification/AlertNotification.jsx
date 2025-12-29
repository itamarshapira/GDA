// src/components/Tabs/AlertNotification/AlertNotification.jsx

import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import { readAlertStatus } from "../../../services/alertNotificationService";
import { ALERT_PRIORITY } from "../../../services/alertPriority";

const AlertNotification = ({ device }) => {
  const [alertStatus, setAlertStatus] = useState(null);
  const [error, setError] = useState(null);
  const [showDiagnostics, setShowDiagnostics] = useState(true);

  const fetchAlertStatus = async () => {
    if (!device) {
      setError("No BLE device connected");
      return;
    }

    console.log("[AlertNotification.jsx] 📖 Reading alert status...");
    const value = await readAlertStatus(device);

    if (value === null) {
      setError("Failed to read alert status");
      return;
    }

    setAlertStatus(value);
    setError(null);
  };

  useEffect(() => {
    fetchAlertStatus();
  }, [device]);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={true}
    >
      <Text style={styles.header}>Alert Notification</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.button} onPress={fetchAlertStatus}>
          <Text style={styles.buttonText}>Refresh</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowDiagnostics((prev) => !prev)}
        >
          <Text style={styles.buttonText}>
            {showDiagnostics ? "Hide Diagnostic" : "Show Diagnostic"}
          </Text>
        </TouchableOpacity>
      </View>

      {alertStatus === null ? (
        <Text style={styles.text}>Reading alert status…</Text>
      ) : alertStatus === 0 ? (
        <Text style={[styles.text, styles.ok]}>
          All clear — no alerts active
        </Text>
      ) : (
        <>
          <Text style={styles.text}>
            Status word:{" "}
            <Text style={styles.mono}>
              0x{alertStatus.toString(16).padStart(4, "0").toUpperCase()}
            </Text>
          </Text>

          {showDiagnostics && (
            <View style={styles.list}>
              {Array.from({ length: 16 }, (_, i) => {
                const mask = 1 << i;
                const isOn = (alertStatus & mask) !== 0;
                const alertInfo = ALERT_PRIORITY[mask];

                return (
                  <Text
                    key={i}
                    style={[styles.item, isOn ? styles.on : styles.off]}
                  >
                    Bit {i}: {alertInfo ? alertInfo.name : "Unknown"} —{" "}
                    {isOn ? "ON" : "OFF"}
                  </Text>
                );
              })}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
};

export default AlertNotification;

const styles = StyleSheet.create({
  //   container: {
  //     flex: 1,
  //     padding: 16,
  //   },
  container: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 30,
  },

  header: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  error: {
    color: "tomato",
    marginBottom: 8,
    textAlign: "center",
  },
  text: {
    color: "#ccc",
    fontSize: 16,
    marginVertical: 6,
    textAlign: "center",
  },
  ok: {
    color: "#20aa29ff",
    fontWeight: "bold",
  },
  mono: {
    fontFamily: "monospace",
    color: "#b2b2f4ff",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#333",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
  },
  list: {
    marginTop: 10,
  },
  item: {
    fontSize: 14,
    marginVertical: 2,
    paddingBottom: 4,
  },
  on: {
    color: "#ff6b6b",
  },
  off: {
    color: "#777",
  },
});
