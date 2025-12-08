
import React, { useState } from "react";

import { View, Text, StyleSheet, StatusBar, Platform } from "react-native";
import Navbar from "./src/components/Navbar/Navbar";


import { SafeAreaView } from "react-native-safe-area-context";
import { I18nManager } from 'react-native'; // import I18nManager to manage layout direction
 I18nManager.allowRTL(false);  // disable right-to-left layout
 I18nManager.forceRTL(false); // disable right-to-left layout

 import Welcome from "./src/components/Welcome/Welcome";
 import Login1 from "./src/components/Login1/Login1";
 import Tabs from "./src/components/Tabs/Tabs";



export default function App() {
  const [isConnected, setIsConnected] = useState(false); // welcome -> login. sent to Navbar
  const [isLoggedIn, setIsLoggedIn] = useState(false); // login -> tabs.
  const [connectedDevice, setConnectedDevice] = useState(null);


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent={false} // keep false so background color shows on Android
        backgroundColor="#4b46ac" // visible blue background
        barStyle="light-content" // light icons/text on top of blue
      />
      <Navbar
        onBleConnected={(device) => {
          setConnectedDevice(device); // Save device after BLE connection
          setIsConnected(true);       // BLE connected
        }}
        onBleDisconnected={() => {
          setConnectedDevice(null);  // Clear device
          setIsConnected(false);     // BLE disconnected
          setIsLoggedIn(false);      // Reset login state
        }}
      />
      
      {/* Render flow: Welcome → Login1 → Tabs */}
      {isConnected ? (
        isLoggedIn ? (
          <Tabs device={connectedDevice} /> // Pass device to Tabs 
        ) : (
          <Login1
            device={connectedDevice}          // Pass the BLE device to Login1
            onLogin={() => setIsLoggedIn(true)} // Login1 calls this after passkey
          />
        )
      ) : (
        <Welcome />
      )}
      
      {/* Main content area
      <View style={styles.content}>
        <Text style={styles.title}>FGD BLE!</Text>
        <Text style={styles.subtitle}>MY Expo app is connected!! </Text>
      </View> */}
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2d2d2d",
    elevation: 4,                // shadow for Android
    shadowColor: "#000",         // shadow for iOS
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,

    // Remove justifyContent and alignItems here 
    // because they center EVERYTHING in the middle
  },
  
  content: {
    flex: 1,
    justifyContent: "center",     // center only the text vertically
    alignItems: "center",         // center horizontally
    color: "#fff",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fdfdfdff",
  },
  subtitle: {
    fontSize: 16,
    color: "#ffffffff",
    marginTop: 8,
  },
});

