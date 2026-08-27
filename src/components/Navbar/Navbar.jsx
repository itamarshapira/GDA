// src/components/Navbar/Navbar.js

import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Animated,
  StyleSheet,
  ActivityIndicator, // ✅ NEW: for spinner/loading UI
  Modal,
  FlatList,
} from "react-native";
import styles from "./NavbarStyles";
import { MaterialCommunityIcons } from "@expo/vector-icons"; // https://static.enapter.com/rn/icons/material-community.html
import {
  scanForFGDevices,
  connectToSelectedDevice,
  disconnectDevice,
  logServicesAndCharacteristics,
  forceRefreshGatt,
  manager,
} from "../../services/bleService";
import { requestBlePermissions } from "../../services/androidService";
import { writePasskey } from "../../services/loginService";

//* new label for device type detection
const getDeviceTypeFromName = (deviceName = "") => {
  // Find the final letter immediately before the numeric serial.
  // Examples:
  // FGASD794 → D → detector
  // FGASS794 → S → source
  const match = deviceName.trim().match(/([A-Za-z])(?=\d)/); // ([A-Za-z]) = capture one letter, \d+ = followed by one or more numbers,  $ = the numbers must be at the end of the name

  if (!match) {
    return null;
  }

  const typeLetter = match[1].toUpperCase();

  if (typeLetter === "D") {
    return "detector";
  }

  if (typeLetter === "S") {
    return "source";
  }

  return null;
};

const Navbar = (props) => {
  // props.onBleConnected, props.onBleDisconnected from App.js to inform connection state of BLE
  const [isBluetoothOn, setIsBluetoothOn] = useState(false); // Bluetooth icon state
  const [connectedDevice, setConnectedDevice] = useState(null); // Connected device state
  const [foundDevices, setFoundDevices] = useState([]);
  const [showPicker, setShowPicker] = useState(false);

  // ✅ NEW STATE: show loading banner while scanning/connecting
  // This gives user feedback (10 sec wait sometimes)
  // Controls the small status banner under the Navbar.
  // null = no banner
  // "scanning" = app is searching for FG BLE devices
  // "retrying" = first scan was empty, so app is checking once more
  // "connecting" = user selected a device and app is connecting to it
  // "disconnecting" = app is disconnecting from the current device
  const [connectionPhase, setConnectionPhase] = useState(null);
  const bleActionInProgressRef = useRef(false);

  // Small startup hint that points the user toward the BLE button.
  const [showBleHint, setShowBleHint] = useState(false);

  const bleHintOpacity = useRef(new Animated.Value(0)).current;

  const bleHintTimerRef = useRef(null);

  // NEW STATE: To control the visibility of the error message
  const [scanError, setScanError] = useState(false);

  // Optional: Animated value for a smoother fade-in/out
  const fadeAnim = useState(new Animated.Value(0))[0];

  const [bluetoothOff, setBluetoothOff] = useState(false); // Bluetooth OFF toast state
  const fadeBtAnim = useState(new Animated.Value(0))[0]; // Animation value for Bluetooth OFF toast

  // Shows the Bluetooth OFF message with fade animation
  const showBluetoothOffToast = () => {
    setBluetoothOff(true);

    Animated.timing(fadeBtAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(fadeBtAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setBluetoothOff(false);
      });
    }, 4000);
  };

  /**
   * Shows the error message for 3 seconds with a fade animation.
   */
  const showErrorToast = () => {
    setScanError(true);

    // 1. Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // 2. Hide after 3 seconds
    setTimeout(() => {
      // 3. Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setScanError(false);
      });
    }, 5000); // 3 seconds visible
  };

  // *hide the BLE hint and clear any existing timers start
  const hideBleHint = () => {
    // this function hides the BLE hint and clears any existing timers
    if (bleHintTimerRef.current) {
      clearTimeout(bleHintTimerRef.current);
      bleHintTimerRef.current = null;
    }

    Animated.timing(bleHintOpacity, {
      toValue: 0,
      duration: 800, // Fade out over 0.5 seconds
      useNativeDriver: true,
    }).start(() => {
      setShowBleHint(false);
    });
  };

  useEffect(() => {
    // Show the BLE hint on first render
    // Wait a little so the screen finishes appearing first.
    const showTimer = setTimeout(() => {
      setShowBleHint(true);

      Animated.timing(bleHintOpacity, {
        toValue: 1, // Fade in to fully visible
        duration: 350, // Fade in over 0.35 seconds
        useNativeDriver: true,
      }).start();

      // Automatically disappear after a few seconds.
      bleHintTimerRef.current = setTimeout(() => {
        hideBleHint();
      }, 8000); // Hide after 8 seconds
    }, 700); // * Wait 0.7 seconds before showing the hint

    return () => {
      clearTimeout(showTimer);

      if (bleHintTimerRef.current) {
        clearTimeout(bleHintTimerRef.current);
      }
    };
  }, []);
  // *hide the BLE hint and clear any existing timers end

  // Handle Bluetooth icon press
  const handleBluetoothPress = async () => {
    hideBleHint(); // Hide the hint if the user presses the button
    // State updates are asynchronous, so use a ref to block a second press immediately.
    // This prevents overlapping scans while Bluetooth state/permissions are checked.
    if (bleActionInProgressRef.current) return;

    bleActionInProgressRef.current = true;
    setConnectionPhase("preparing");
    console.log("🟦 Bluetooth icon clicked! (Navbar)");

    try {
      // 1) Check if Bluetooth is ON before scanning/connecting.
      const btState = await manager.state();
      console.log("[Navbar] Bluetooth state:", btState);

      if (btState !== "PoweredOn") {
        console.log("🚫 Bluetooth is OFF — ask user to turn it on");
        showBluetoothOffToast();
        return;
      }

      // 2) If already connected, pressing the BLE icon means disconnect.
      if (connectedDevice) {
        setConnectionPhase("disconnecting");

        const success = await disconnectDevice(connectedDevice);

        if (success) {
          setConnectedDevice(null);
          setIsBluetoothOn(false);
          props.onBleDisconnected(); // Tell App.js we are disconnected
        }

        return;
      }

      // 3) Ask Android permissions before BLE scan.
      const granted = await requestBlePermissions();

      if (!granted) {
        console.log("❌ Permissions denied — cannot scan BLE");
        return;
      }

      console.log("✅ Permissions granted — starting BLE scan...");

      // 4) Search for nearby FG devices.
      setConnectionPhase("scanning");
      setScanError(false);

      let devices = await scanForFGDevices();

      // Some Android BLE scans can be empty while a nearby device is already
      // advertising. Retry once before presenting a failure to the user.
      if (devices.length === 0) {
        setConnectionPhase("retrying");
        console.log("[Navbar] First scan empty — retrying once...");
        devices = await scanForFGDevices(5000);
      }

      console.log(
        "📋 FG devices found:",
        devices.map((d) => d.name),
      );

      setFoundDevices(devices);
      console.log("STATE DEVICES:", devices.length);

      if (!devices || devices.length === 0) {
        console.log(
          "🚫 No FG devices found — showing toast, not opening picker",
        );

        setShowPicker(false);
        showErrorToast();
        return;
      }

      // Open picker only if devices were found.
      setShowPicker(true);
    } catch (error) {
      console.log("❌ Scan failed:", error.message);

      setShowPicker(false);
      showErrorToast();
    } finally {
      bleActionInProgressRef.current = false;
      setConnectionPhase(null);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../../../assets/wideLogo.png")}
        style={styles.logo}
      />

      {/* ✅ NEW: Loading Banner UI */}
      {connectionPhase && (
        <View style={loadingStyles.loadingPill}>
          <ActivityIndicator size="small" color="#8ecbff" />

          <Text style={loadingStyles.loadingText}>
            {connectionPhase === "scanning"
              ? "Searching for FG devices…"
              : connectionPhase === "retrying"
                ? "Still searching for FG devices…"
                : connectionPhase === "connecting"
                  ? "Connecting to detector…"
                  : connectionPhase === "disconnecting"
                    ? "Disconnecting…"
                    : "Preparing Bluetooth…"}
          </Text>
        </View>
      )}

      {/* NEW: Error Toast UI element */}
      {scanError && (
        <Animated.View
          style={[errorStyles.toastContainer, { opacity: fadeAnim }]}
        >
          <Text style={errorStyles.toastText}>
            🚫 Device not found! Scan timed out.
          </Text>
        </Animated.View>
      )}
      {/* End Error Toast */}

      {/* Small startup BLE hint */}
      {showBleHint && !isBluetoothOn && (
        <Animated.View
          pointerEvents="none"
          style={[
            bleHintStyles.container,
            {
              opacity: bleHintOpacity,
              transform: [
                {
                  translateY: bleHintOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-4, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={bleHintStyles.arrow} />

          <View style={bleHintStyles.row}>
            <MaterialCommunityIcons
              name="bluetooth"
              size={19}
              color="#8ecbff"
            />

            <View style={bleHintStyles.textArea}>
              <Text style={bleHintStyles.title}>Connect your device</Text>

              <Text style={bleHintStyles.subtitle}>Tap Bluetooth to begin</Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* ✅ NEW:
          Disable button while connecting so user doesn't spam clicks.
          Also reduce opacity while disabled for clear feedback.
      */}
      <TouchableOpacity
        onPress={handleBluetoothPress}
        disabled={!!connectionPhase}
        style={{ opacity: connectionPhase ? 0.5 : 1 }}
        activeOpacity={0.1}
      >
        <MaterialCommunityIcons
          name={isBluetoothOn ? "bluetooth-connect" : "bluetooth-off"}
          size={40}
          color={isBluetoothOn ? "#0ee50be2" : "#ffffff"}
          style={styles.icon}
        />
      </TouchableOpacity>
      {/* End Bluetooth Icon */}

      {/* NEW: Bluetooth OFF Toast */}
      {bluetoothOff && (
        <Animated.View
          style={[errorStyles.toastContainer, { opacity: fadeBtAnim }]}
        >
          <Text style={errorStyles.toastText}>
            Turn on Bluetooth on your phone
          </Text>
        </Animated.View>
      )}
      <Modal transparent visible={showPicker} animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              margin: 20,
              borderRadius: 10,
              padding: 10,
            }}
          >
            <Text style={{ fontWeight: "bold", marginBottom: 10 }}>
              Select FG Device
            </Text>

            <FlatList
              data={foundDevices}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                // Use a fallback name in case the BLE device does not advertise a name.
                const deviceName = item.name || "Unnamed device";

                /*
                 * Read the final letter immediately before the numeric serial.
                 *
                 * Examples:
                 * FGASD794 -> D -> Detector
                 * FGASS794 -> S -> Source
                 *
                 * The "$" means the numbers must be at the end of the device name.
                 */
                const nameMatch = deviceName.trim().match(/([A-Za-z])\d+$/);

                const typeLetter = nameMatch
                  ? nameMatch[1].toUpperCase()
                  : null;

                //* Convert the detected letter into a readable UI label:

                // Internal value used by the app's navigation logic.
                let deviceType = null;

                // Readable value displayed to the user in the BLE list.
                let deviceTypeLabel = "Unknown device type";

                if (typeLetter === "D") {
                  deviceType = "detector";
                  deviceTypeLabel = "Detector";
                } else if (typeLetter === "S") {
                  deviceType = "source";
                  deviceTypeLabel = "Source";
                }

                return (
                  <TouchableOpacity
                    style={{
                      padding: 12,
                      borderBottomWidth: 1,
                    }}
                    onPress={async () => {
                      try {
                        // Close the BLE device picker after the user selects a device.
                        setShowPicker(false);

                        // We finished scanning and are now connecting to the selected device.
                        setConnectionPhase("connecting");

                        console.log("🔗 Connecting to selected:", deviceName);

                        const connected = await connectToSelectedDevice(item);

                        // Save the connected BLE device locally inside Navbar.
                        setConnectedDevice(connected);

                        // Change the BLE icon to its connected state.
                        setIsBluetoothOn(true);

                        /*
                         * Tell App.js that BLE connected successfully.
                         *
                         * At this stage we are still sending only the BLE device.
                         * We are not routing to SourceTabs yet.
                         */
                        // Send both the connected BLE device and its detected type to App.js.
                        props.onBleConnected(connected, deviceType);

                        // Hide the connection banner after successful connection.
                        setConnectionPhase(null);
                      } catch (e) {
                        console.log("❌ Selected connect failed:", e.message);

                        // Hide the connection banner if connection failed.
                        setConnectionPhase(null);

                        // Show the existing connection error notification.
                        showErrorToast();
                      }
                    }}
                  >
                    {/* BLE advertised device name */}
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "700",
                      }}
                    >
                      {deviceName}
                    </Text>

                    {/* Device type detected automatically from the device name */}
                    <Text
                      style={{
                        fontSize: 13,
                        marginTop: 3,
                        color: "#666",
                      }}
                    >
                      {deviceTypeLabel}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Navbar;

// ✅ NEW: Loading pill styles
const loadingStyles = StyleSheet.create({
  loadingPill: {
    position: "absolute",
    top: 65,
    left: 20,
    right: 20,

    paddingVertical: 11,
    paddingHorizontal: 14,

    borderRadius: 16,
    backgroundColor: "rgba(8, 24, 44, 0.94)",
    borderWidth: 1,
    borderColor: "rgba(108, 180, 255, 0.28)",

    zIndex: 9,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",

    elevation: 8,
  },

  loadingText: {
    color: "#d9ecff",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
});

// NEW: Stylesheet for the Error UI (can be moved to NavbarStyles.js)
const errorStyles = StyleSheet.create({
  toastContainer: {
    position: "absolute", // Position the toast absolutely
    top: 65, // Adjust this value to position it below the Navbar
    left: 20,
    right: 20,
    backgroundColor: "#ff0000", // Red background for error
    padding: 10,
    borderRadius: 8,
    zIndex: 10, // Ensure it's above other elements
    alignItems: "center",
    justifyContent: "center",
  },
  toastText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
});

const bleHintStyles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 65,
    right: 25,

    width: 200,

    paddingVertical: 10,
    paddingHorizontal: 12,

    backgroundColor: "rgba(8, 24, 44, 0.97)",

    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(108, 180, 255, 0.28)",

    zIndex: 20,
    elevation: 8,
  },

  arrow: {
    position: "absolute",

    top: -7,
    right: 22,

    width: 0,
    height: 0,

    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: 7,

    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "rgba(240, 244, 248, 0.97)",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  textArea: {
    marginLeft: 9,
    flex: 1,
  },

  title: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },

  subtitle: {
    color: "rgba(217,236,255,0.68)",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 1,
  },
});
