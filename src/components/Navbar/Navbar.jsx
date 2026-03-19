// src/components/Navbar/Navbar.js

import React, { useState } from "react";
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

const Navbar = (props) => {
  // props.onBleConnected, props.onBleDisconnected from App.js to inform connection state of BLE
  const [isBluetoothOn, setIsBluetoothOn] = useState(false); // Bluetooth icon state
  const [connectedDevice, setConnectedDevice] = useState(null); // Connected device state
  const [foundDevices, setFoundDevices] = useState([]);
  const [showPicker, setShowPicker] = useState(false);

  // ✅ NEW STATE: show loading banner while scanning/connecting
  // This gives user feedback (10 sec wait sometimes)
  const [isConnecting, setIsConnecting] = useState(false);

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

  const handleBluetoothPress = async () => {
    console.log("🟦 Bluetooth icon clicked! (Navbar)");
    // ✅ 1) Check if Bluetooth is ON before doing anything
    const btState = await manager.state();
    console.log("[Navbar] Bluetooth state:", btState);

    if (btState !== "PoweredOn") {
      console.log("🚫 Bluetooth is OFF — ask user to turn it on");

      // show UI message
      showBluetoothOffToast(); // we will add this function next
      return;
    }
    // ✅ NEW:
    // If already connected → disconnect
    // We can optionally show loading while disconnecting
    if (connectedDevice) {
      setIsConnecting(true); // ✅ NEW: show spinner while disconnecting too
      const success = await disconnectDevice(connectedDevice);
      setIsConnecting(false); // ✅ NEW: stop spinner after disconnect attempt

      if (success) {
        setConnectedDevice(null);
        setIsBluetoothOn(false);
        props.onBleDisconnected(); // tell App.js we're disconnected
      }
      return;
    }

    const granted = await requestBlePermissions();
    if (!granted) {
      console.log("❌ Permissions denied — cannot scan BLE");
      return;
    }

    console.log("✅ Permissions granted — starting BLE scan...");

    // ✅ NEW:
    // From THIS moment until connection success/fail, we show "Connecting..." pill.
    // This matches exactly what you described:
    // Between: 🟦 Bluetooth icon clicked!
    // And:     ✅ Connected to: FG-OPGD
    setIsConnecting(true);
    setScanError(false); // ✅ optional: hide previous error toast if exists

    try {
      const devices = await scanForFGDevices();

      console.log(
        "📋 FG devices found:",
        devices.map((d) => d.name)
      );
      setFoundDevices(devices);
      console.log("STATE DEVICES:", devices.length);
      setShowPicker(true);
      setIsConnecting(false);

      if (!devices || devices.length === 0) {
        console.log(
          "🚫 No FG devices found — showing toast, not opening picker"
        );
        setIsConnecting(false);
        setShowPicker(false);
        showErrorToast();
        return;
      }
      // TEMP: just log for now — no connect yet
    } catch (error) {
      console.log("❌ Scan failed:", error.message);

      setIsConnecting(false);
      setShowPicker(false); // ✅ make sure picker never opens
      showErrorToast(); // ✅ reuse your existing red toast
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../../../assets/wideLogo.png")}
        style={styles.logo}
      />

      {/* ✅ NEW: Loading Banner UI */}
      {isConnecting && (
        <View style={loadingStyles.loadingPill}>
          <ActivityIndicator size="small" color="#ffffff" />
          <Text style={loadingStyles.loadingText}>Connecting…</Text>
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

      {/* ✅ NEW:
          Disable button while connecting so user doesn't spam clicks.
          Also reduce opacity while disabled for clear feedback.
      */}
      <TouchableOpacity
        onPress={handleBluetoothPress}
        disabled={isConnecting}
        style={{ opacity: isConnecting ? 0.5 : 1 }}
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
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{ padding: 12, borderBottomWidth: 1 }}
                  onPress={async () => {
                    try {
                      setShowPicker(false);
                      setIsConnecting(true);

                      console.log("🔗 Connecting to selected:", item.name);

                      const connected = await connectToSelectedDevice(item);

                      setConnectedDevice(connected);
                      setIsBluetoothOn(true);
                      props.onBleConnected(connected);

                      setIsConnecting(false);
                    } catch (e) {
                      console.log("❌ Selected connect failed:", e.message);
                      setIsConnecting(false);
                    }
                  }}
                >
                  <Text>{item.name}</Text>
                </TouchableOpacity>
              )}
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
    position: "absolute", // appears above navbar area
    top: 65, // below navbar
    left: 20,
    right: 20,
    backgroundColor: "#444",
    paddingVertical: 10,
    borderRadius: 10,
    zIndex: 9,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#fff",
    fontWeight: "bold",
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
