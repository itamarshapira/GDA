import React, { useEffect, useState, useRef } from "react";
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

import AlertBanner from "../../AlertBanner/AlertBanner";

import { ALERT_PRIORITY } from "../../../services/alertPriority";

// // ✅ Small UI component: shows the "top alert" banner based on alertStatus bitmask
// function AlertBanner({ alertStatus }) {
//   // null = not loaded yet
//   if (alertStatus === null) return null;

//   // 0 = all clear
//   if (alertStatus === 0) {
//     return (
//       <View style={[styles.banner, styles.bannerOk]}>
//         <Text style={styles.bannerText}>All clear — no alerts</Text>
//       </View>
//     );
//   }

//   // Build list of active alerts from bits 0..15
//   const activeAlerts = [];
//   for (let i = 0; i < 16; i++) {
//     const mask = 1 << i;
//     if ((alertStatus & mask) !== 0) {
//       if (ALERT_PRIORITY[mask]) {
//         activeAlerts.push(ALERT_PRIORITY[mask]);
//       } else {
//         activeAlerts.push({ name: `Unknown bit ${i}`, priority: 99 });
//       }
//     }
//   }

//   // pick highest priority (smallest number)
//   activeAlerts.sort((a, b) => a.priority - b.priority);
//   const topAlert = activeAlerts[0];

//   return (
//     <View style={[styles.banner, styles.bannerBad]}>
//       <Text style={styles.bannerText}>
//         Status: {topAlert?.name || "Unknown alert"}
//       </Text>
//     </View>
//   );
// }

const AlertNotification = ({ device, alertStatus, setAlertStatus }) => {
  // const [alertStatus, setAlertStatus] = useState(null); moved to Tabs.jsx
  const [error, setError] = useState(null);
  const [showDiagnostics, setShowDiagnostics] = useState(true);

  const [notifyOn, setNotifyOn] = useState(false);

  // ✅ Component-owned subscription (same pattern as Environmental)
  const notifySubRef = useRef(null);

  // -------------------------------------------
  // READ ONCE
  // -------------------------------------------
  const fetchAlertStatus = async () => {
    if (!device) {
      setError("No BLE device connected");
      return;
    }

    console.log("[AlertNotification] 📖 Reading alert status...");

    const value = await readAlertStatus(device);

    if (value === null) {
      setError("Failed to read alert status");
      return;
    }

    setAlertStatus(value);
    setError(null);
  };

  // -------------------------------------------
  // INITIAL READ + CLEANUP
  // -------------------------------------------
  useEffect(() => {
    // When the dashboard opens, first read the current alert status once.
    fetchAlertStatus();

    // Then start live alert notifications automatically.
    // The alert status should keep updating even if the user is on another tab.
    if (device && !notifySubRef.current) {
      console.log("[AlertNotification] ▶️ Auto-starting LIVE alert notify");

      const sub = startAlertStatusNotify(device, (value) => {
        console.log("[AlertNotification] 🔔 AUTO LIVE alert:", value);
        setAlertStatus(value);
      });

      if (sub) {
        notifySubRef.current = sub;
        setNotifyOn(true);
      }
    }

    return () => {
      console.log("[AlertNotification] cleanup");

      if (notifySubRef.current) {
        notifySubRef.current.remove();
        notifySubRef.current = null;
      }
      // Reset the UI button state.
      // The actual BLE notification was stopped above with remove().
      setNotifyOn(false);
    };
  }, [device]);

  // -------------------------------------------
  // TOGGLE NOTIFY (LIVE)
  // -------------------------------------------
  const toggleNotify = () => {
    if (!device) return;

    // OFF → ON
    if (!notifyOn) {
      console.log("[AlertNotification] ▶️ Starting LIVE alert notify");

      const sub = startAlertStatusNotify(device, (value) => {
        console.log("[AlertNotification] 🔔 LIVE alert:", value);
        setAlertStatus(value);
      });

      if (sub) {
        notifySubRef.current = sub;
        setNotifyOn(true);
      }

      return;
    }

    // ON → OFF
    console.log("[AlertNotification] ⏹️ Stopping LIVE alert notify");

    if (notifySubRef.current) {
      notifySubRef.current.remove();
      notifySubRef.current = null;
    }

    setNotifyOn(false);
  };

  // -------------------------------------------
  // UI
  // -------------------------------------------
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator
    >
      <Text style={styles.header}>Alert Notification</Text>
      {/* <AlertBanner alertStatus={alertStatus} /> show top alert banner */}
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

// -------------------------------------------
// STYLES
// -------------------------------------------
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
  banner: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerOk: {
    backgroundColor: "#20aa29ff",
  },
  bannerBad: {
    backgroundColor: "#cc1436ff",
    opacity: 0.85,
  },
  bannerText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
