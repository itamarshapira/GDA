// src/components/SourceTabs/SourceAlertNotification/SourceAlertNotification.jsx

import React, { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import {
  readAlertStatus,
  startAlertStatusNotify,
} from "../../../services/alertNotificationService";

const SourceAlertNotification = ({ device }) => {
  // Raw 16-bit alert status received from the Source.
  const [alertStatus, setAlertStatus] = useState(null);

  const [error, setError] = useState(null);
  const [showDiagnostics, setShowDiagnostics] = useState(true);
  const [notifyOn, setNotifyOn] = useState(false);

  // Stores the active BLE notification subscription.
  const notifySubRef = useRef(null);

  // Keep the value inside the expected unsigned 16-bit range.
  const statusWord = alertStatus === null ? null : alertStatus & 0xffff;

  // --------------------------------------------------
  // READ CURRENT SOURCE ALERT STATUS ONCE
  // --------------------------------------------------
  const fetchAlertStatus = async () => {
    if (!device) {
      setError("No BLE device connected");
      return;
    }

    console.log("SourceAlertNotification.jsx: Reading Source alert status");

    const value = await readAlertStatus(device);

    if (value === null) {
      setError("Failed to read Source alert status");

      console.log("SourceAlertNotification.jsx: Failed to read alert status");

      return;
    }

    console.log("SourceAlertNotification.jsx: Alert status read:", value);

    setAlertStatus(value);
    setError(null);
  };

  // --------------------------------------------------
  // INITIAL READ + AUTOMATIC LIVE NOTIFICATION
  // --------------------------------------------------
  useEffect(() => {
    if (!device) {
      setError("No BLE device connected");
      return;
    }

    // Read the current value when the Source dashboard opens.
    fetchAlertStatus();

    /*
     * Automatically start live notifications.
     *
     * SourceTabs will keep this component mounted while the user
     * visits other tabs, so the notification can continue running.
     */
    if (!notifySubRef.current) {
      console.log(
        "SourceAlertNotification.jsx: Auto-starting live Source alert notification",
      );

      const subscription = startAlertStatusNotify(device, (value) => {
        console.log(
          "SourceAlertNotification.jsx: Live alert status received:",
          value,
        );

        setAlertStatus(value);
      });

      if (subscription) {
        notifySubRef.current = subscription;
        setNotifyOn(true);
      }
    }

    /*
     * Cleanup happens when SourceTabs closes, for example when
     * the BLE device disconnects.
     */
    return () => {
      console.log(
        "SourceAlertNotification.jsx: Cleaning alert notification subscription",
      );

      if (notifySubRef.current) {
        notifySubRef.current.remove();
        notifySubRef.current = null;
      }

      setNotifyOn(false);
    };
  }, [device]);

  // --------------------------------------------------
  // MANUALLY ENABLE / DISABLE LIVE NOTIFICATION
  // --------------------------------------------------
  const toggleNotify = () => {
    if (!device) {
      return;
    }

    // Notification is currently OFF, so start it.
    if (!notifyOn) {
      console.log(
        "SourceAlertNotification.jsx: Starting live alert notification",
      );

      const subscription = startAlertStatusNotify(device, (value) => {
        console.log(
          "SourceAlertNotification.jsx: Live alert status received:",
          value,
        );

        setAlertStatus(value);
      });

      if (subscription) {
        notifySubRef.current = subscription;
        setNotifyOn(true);
      }

      return;
    }

    // Notification is currently ON, so stop it.
    console.log(
      "SourceAlertNotification.jsx: Stopping live alert notification",
    );

    if (notifySubRef.current) {
      notifySubRef.current.remove();
      notifySubRef.current = null;
    }

    setNotifyOn(false);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator
    >
      <Text style={styles.header}>Source Alert Notification</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, notifyOn && styles.buttonLive]}
          onPress={toggleNotify}
        >
          <Text style={styles.buttonText}>
            {notifyOn ? "Stop Live" : "Start Live"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={fetchAlertStatus}>
          <Text style={styles.buttonText}>Refresh</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowDiagnostics((previous) => !previous)}
        >
          <Text style={styles.buttonText}>
            {showDiagnostics ? "Hide Diagnostic" : "Show Diagnostic"}
          </Text>
        </TouchableOpacity>
      </View>

      {statusWord === null ? (
        <Text style={styles.text}>Reading Source alert status…</Text>
      ) : (
        <>
          {/* Display the raw value without assigning meanings yet. */}
          <Text style={styles.text}>
            Raw status word:{" "}
            <Text style={styles.mono}>
              0x
              {statusWord.toString(16).padStart(4, "0").toUpperCase()}
            </Text>
          </Text>

          <Text style={styles.text}>
            Decimal value: <Text style={styles.mono}>{statusWord}</Text>
          </Text>

          {statusWord === 0 && (
            <Text style={[styles.text, styles.ok]}>
              No Source alert bits are active
            </Text>
          )}

          {showDiagnostics && (
            <View style={styles.list}>
              {Array.from({ length: 16 }, (_, bitIndex) => {
                const mask = 1 << bitIndex;
                const isOn = (statusWord & mask) !== 0;

                return (
                  <Text
                    key={bitIndex}
                    style={[styles.item, isOn ? styles.on : styles.off]}
                  >
                    Bit {bitIndex}: Unknown Source alert — {isOn ? "ON" : "OFF"}
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

export default SourceAlertNotification;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 30,
    backgroundColor: "#07111f",
  },

  header: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 16,
    textAlign: "center",
  },

  error: {
    color: "tomato",
    marginBottom: 8,
    textAlign: "center",
  },

  text: {
    color: "#cccccc",
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
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },

  button: {
    backgroundColor: "#0d1b2f",
    borderWidth: 1,
    borderColor: "rgba(66, 153, 225, 0.35)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
  },

  buttonLive: {
    backgroundColor: "#2f80ed",
    borderColor: "#2f80ed",
  },

  buttonText: {
    color: "#ffffff",
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
    color: "#777777",
  },
});
