// src/components/Navbar/Navbar.js

import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, Animated, StyleSheet } from "react-native";
import styles from "./NavbarStyles";
import { MaterialCommunityIcons } from "@expo/vector-icons"; // https://static.enapter.com/rn/icons/material-community.html
import {
  connectToDevice,
  disconnectDevice,
  logServicesAndCharacteristics,
  forceRefreshGatt,
  manager,
} from "../../services/bleService";
import { requestBlePermissions } from "../../services/androidService";
import { writePasskey } from "../../services/loginService";

const Navbar = (props) => { // props.onBleConnected, props.onBleDisconnected from App.js to inform connection state of BLE
  const [isBluetoothOn, setIsBluetoothOn] = useState(false); // Bluetooth icon state
  const [connectedDevice, setConnectedDevice] = useState(null); // Connected device state

  // NEW STATE: To control the visibility of the error message
  const [scanError, setScanError] = useState(false); 
  
  // Optional: Animated value for a smoother fade-in/out
  const fadeAnim = useState(new Animated.Value(0))[0]; 

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

    if (connectedDevice) {
      const success = await disconnectDevice(connectedDevice);
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
    try {
      const device = await connectToDevice();
      if (!device) return;

      setConnectedDevice(device);
      setIsBluetoothOn(true);

      // ✅ Let App know we're connected and send the device
      props.onBleConnected(device);
      console.log("[Navbar] Notified App of BLE connection, sent device.");
      console.log("[Navbar] now login1 can use the device to write passkey.");

    } catch (error) {
      console.log("❌ Connection process failed:", error.message);
      setIsBluetoothOn(false);
      // 👇 NEW LOGIC: Check for the specific device not found error
      if (error.message.includes("Device not found") || error.message.includes("Scan timeout")) {
        showErrorToast();
      }
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../../../assets/wideLogo.png")}
        style={styles.logo}
      />
      {/* NEW: Error Toast UI element */}
      {scanError && (
        <Animated.View style={[
            errorStyles.toastContainer, 
            { opacity: fadeAnim } 
        ]}>
          <Text style={errorStyles.toastText}>
            🚫 Device not found! Scan timed out.
          </Text>
        </Animated.View>
      )}
      {/* End Error Toast */}
      <TouchableOpacity onPress={handleBluetoothPress}>
        <MaterialCommunityIcons
          name={isBluetoothOn ? "bluetooth-connect" : "bluetooth-off"}
          size={40}
          color={isBluetoothOn ? "#04de71ff" : "#ffffff"}
          style={styles.icon}
        />
      </TouchableOpacity>
    </View>
  );
};

export default Navbar;

// NEW: Stylesheet for the Error UI (can be moved to NavbarStyles.js)
const errorStyles = StyleSheet.create({
  toastContainer: {
    position: 'absolute', // Position the toast absolutely
    top: 65, // Adjust this value to position it below the Navbar
    left: 20,
    right: 20,
    backgroundColor: '#ff0000', // Red background for error
    padding: 10,
    borderRadius: 8,
    zIndex: 10, // Ensure it's above other elements
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});