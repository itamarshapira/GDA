import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import {
  readMethane,
  readTemperature,
  readMeasurementInterval,
  monitorMethaneNotifications,
  monitorTemperatureNotifications,
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
  const [notifyTemperature, setNotifyTemperature] = useState(false);

  // Refs for stable subscription + live toggle flag
  const methaneSubRef = useRef(null); // stores subscription (never removed)
  //const isLiveRef = useRef(false); // true = update UI, false = ignore
  const temperatureSubRef = useRef(null);

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
      "[Environmental] ⏹️ Disabling LIVE methane updates (hard stop)...",
    );

    if (methaneSubRef.current) {
      methaneSubRef.current.remove(); // ✅ REAL unsubscribe
      methaneSubRef.current = null;
    }

    setNotifyMethane(false);
  };

  // -------------------------------------------
  // SAFE TOGGLE FOR TEMPERATURE NOTIFY
  // -------------------------------------------
  const toggleTemperatureNotify = () => {
    console.log("[Environmental] Toggling temperature notify...");

    // OFF → ON
    // If temperature notify is currently OFF, we start listening to live BLE updates.
    if (!notifyTemperature) {
      console.log("[Environmental] ▶️ Enabling LIVE temperature updates...");

      // Safety check:
      // Without a connected BLE device, we cannot subscribe to notifications.
      if (!device) {
        console.log(
          "[Environmental] ❌ Cannot enable temperature notify — no device",
        );
        return;
      }

      // Start BLE notification for temperature.
      // Every time the device sends a new temperature value,
      // this callback runs and updates the UI state.
      const sub = monitorTemperatureNotifications(device, (value) => {
        console.log("[Environmental] 🔔 LIVE temperature raw:", value);

        // Store the raw value.
        // In the UI we divide by 100 before displaying Celsius.
        setTemperature(value);
      });

      // Store the subscription so we can remove it later.
      // This is important because BLE notifications must be stopped cleanly.
      temperatureSubRef.current = sub;

      // Update button/icon state to show that temperature notify is ON.
      setNotifyTemperature(true);
      return;
    }

    // ON → OFF
    // If temperature notify is currently ON, we stop the BLE subscription.
    console.log("[Environmental] ⏹️ Disabling LIVE temperature updates...");

    if (temperatureSubRef.current) {
      // remove() tells react-native-ble-plx to unsubscribe from this characteristic.
      temperatureSubRef.current.remove();

      // Clear the ref so we know there is no active temperature subscription.
      temperatureSubRef.current = null;
    }

    // Update button/icon state to show that temperature notify is OFF.
    setNotifyTemperature(false);
  };

  // -------------------------------------------
  // INITIAL READ OF METHANE + TEMPERATURE
  // -------------------------------------------
  useEffect(() => {
    console.log(
      "[Environmental] useEffect triggered. Device is:",
      device ? "OK" : "NULL",
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
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="always"
      >
        <Text style={styles.header}>Environmental Sensing</Text>

        {error && <Text style={styles.error}>{error}</Text>}

        {methane !== null ? (
          <>
            {/* Methane sensor card
    Why:
    - Makes methane look like an important dashboard value.
    - Separates the sensor name from the actual reading.
    - Keeps the notify icon in the top-right, like a control/status action.
*/}
            {/* Compact methane dashboard row
    Why:
    - Keeps everything on one line.
    - Still gives the value a clean dashboard look.
    - Does not waste vertical space like a large card.
*/}
            <View style={styles.sensorStrip}>
              <Text style={styles.sensorStripText}>
                Concentration: <Text style={styles.value}>{methane} LEL</Text>
              </Text>

              <TouchableOpacity
                onPress={toggleMethaneNotify}
                activeOpacity={0.2}
              >
                <MaterialIcons
                  name={notifyMethane ? "notifications" : "notifications-off"}
                  size={30}
                  color={notifyMethane ? "#04de71ff" : "#8f9aaa"}
                />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <Text style={styles.text}>Reading methane…</Text>
        )}

        {temperature !== null ? (
          <View style={styles.sensorStrip}>
            <Text style={styles.sensorStripText}>
              Temperature:{" "}
              <Text style={styles.value}>
                {(temperature / 100).toFixed(2)} °C
              </Text>
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
      {/* 🔘 STANDALONE INTERVAL BUTTONS (OUTSIDE ScrollView) */}
      {interval !== null && (
        <View style={styles.intervalContainer}>
          <Text style={styles.text}>Set Measurement Interval:</Text>

          <View style={styles.buttonRow}>
            {[1, 3, 5, 10].map((sec) => (
              <TouchableOpacity
                key={sec}
                onPress={() => handleSetInterval(sec)}
                activeOpacity={0.6}
              >
                <View
                  style={[
                    styles.intervalButton,
                    interval === sec && styles.intervalActive,
                  ]}
                >
                  <Text style={styles.intervalButtonText}>{sec}s</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
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
    marginBottom: 20,
    paddingBottom: 130, // ✅ space for buttons at bottom
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
    color: "rgb(139, 192, 252)",
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
  // Individual interval button.
  // Why:
  // - Makes the interval buttons look like dashboard controls.
  // - Uses the same dark navy + soft blue border as the rest of the app.
  // - Keeps the buttons small and compact.
  intervalButton: {
    backgroundColor: "rgba(13, 27, 47, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(66, 153, 225, 0.28)",
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 999,
    marginBottom: 4,
  },

  // Selected interval button.
  // Why:
  // - Shows clearly which interval is currently active.
  // - Uses the same FGD blue as the selected tab.
  intervalActive: {
    backgroundColor: "#2f80ed",
    borderColor: "#2f80ed",
  },
  sensorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },

  root: {
    flex: 1,
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
  // Compact sensor row.
  // Why:
  // - Keeps the row as a dashboard strip.
  // - Centers the text + icon group together.
  // - Prevents the text from sticking too much to the left.
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

  // Text inside compact sensor row.
  // Why:
  // - No flex: 1 here, because flex: 1 pushes the icon to the far right.
  // - This lets the text and icon stay together in the center.
  sensorStripText: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 17,
    fontWeight: "700",
    marginRight: 12,
    textAlign: "center",
  },
  // Text inside interval buttons.
  // Why:
  // - Keeps button text consistent and easier to adjust later.
  intervalButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
});

// Tal option for btn!!\
// <MaterialIcons
//               name={notifyMethane ? "stop" : "start"}
//               size={32}
//               color={notifyMethane ? "#e41a1aff" : "#0ee50be2"}
//               style={{ marginBottom: 8 }}
//             />
