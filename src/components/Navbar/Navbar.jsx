// src/components/Navbar/Navbar.js

import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Animated,
  ActivityIndicator, // ✅ NEW: for spinner/loading UI
  Modal,
  FlatList,
} from "react-native";
import styles from "./NavbarStyles";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient"; // https://static.enapter.com/rn/icons/material-community.html
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

  // NEW refs to manage BLE disconnect events and avoid false positives when the user manually disconnects.
  const intentionalDisconnectRef = useRef(false);
  const disconnectSubscriptionRef = useRef(null);
  const disconnectVerificationTimerRef = useRef(null);
  const disconnectEventPendingRef = useRef(false);
  const monitoredDeviceRef = useRef(null);
  const disconnectMonitorGenerationRef = useRef(0);
  const onBleDisconnectedRef = useRef(props.onBleDisconnected);

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

  // NEW STATE: To control the visibility of the connection lost message
  const [connectionLost, setConnectionLost] = useState(false);
  const fadeConnectionLostAnim = useRef(new Animated.Value(0)).current;
  const connectionLostToastTimerRef = useRef(null);

  useEffect(() => {
    onBleDisconnectedRef.current = props.onBleDisconnected;
  }, [props.onBleDisconnected]);

  const showConnectionLostToast = () => {
    if (connectionLostToastTimerRef.current) {
      clearTimeout(connectionLostToastTimerRef.current);
    }

    setConnectionLost(true);
    fadeConnectionLostAnim.setValue(0);
    Animated.timing(fadeConnectionLostAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    connectionLostToastTimerRef.current = setTimeout(() => {
      // Hide the toast after 10 seconds
      Animated.timing(fadeConnectionLostAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setConnectionLost(false));
      connectionLostToastTimerRef.current = null;
    }, 10000);
  };

  useEffect(() => {
    disconnectSubscriptionRef.current?.remove();
    disconnectSubscriptionRef.current = null;

    if (disconnectVerificationTimerRef.current) {
      clearTimeout(disconnectVerificationTimerRef.current);
      disconnectVerificationTimerRef.current = null;
    }
    disconnectEventPendingRef.current = false;

    const monitorGeneration = ++disconnectMonitorGenerationRef.current;
    monitoredDeviceRef.current = connectedDevice;

    if (!connectedDevice) return;

    const deviceId = connectedDevice.id;

    disconnectSubscriptionRef.current = manager.onDeviceDisconnected(
      deviceId,
      () => {
        console.log(
          "Navbar.jsx: BLE disconnect event received:",
          deviceId,
          new Date().toISOString(),
        );

        if (intentionalDisconnectRef.current) {
          intentionalDisconnectRef.current = false;
          console.log(
            "Navbar.jsx: Manual disconnect - connection loss notification suppressed",
          );
          return;
        }

        if (disconnectEventPendingRef.current) return;
        disconnectEventPendingRef.current = true;

        disconnectVerificationTimerRef.current = setTimeout(async () => {
          disconnectVerificationTimerRef.current = null;

          if (
            monitorGeneration !== disconnectMonitorGenerationRef.current ||
            monitoredDeviceRef.current?.id !== deviceId
          ) {
            console.log(
              "Navbar.jsx: Stale disconnect event ignored:",
              deviceId,
            );
            disconnectEventPendingRef.current = false;
            return;
          }

          try {
            const isConnected = await manager.isDeviceConnected(deviceId);

            if (isConnected) {
              console.log(
                "Navbar.jsx: Device reconnected - ignoring temporary disconnect",
                new Date().toISOString(),
              );
              disconnectEventPendingRef.current = false;
              return;
            }
          } catch (error) {
            console.log(
              "Navbar.jsx: Connection verification failed; treating device as disconnected:",
              error?.message || error,
            );
          }

          if (
            monitorGeneration !== disconnectMonitorGenerationRef.current ||
            monitoredDeviceRef.current?.id !== deviceId
          ) {
            console.log(
              "Navbar.jsx: Stale disconnect result ignored:",
              deviceId,
            );
            disconnectEventPendingRef.current = false;
            return;
          }

          console.log(
            "Navbar.jsx: Unexpected BLE connection lost:",
            new Date().toISOString(),
          );
          disconnectSubscriptionRef.current?.remove();
          disconnectSubscriptionRef.current = null;
          monitoredDeviceRef.current = null;
          disconnectMonitorGenerationRef.current += 1;
          setConnectedDevice(null);
          setIsBluetoothOn(false);
          setConnectionPhase(null);
          showConnectionLostToast();
          onBleDisconnectedRef.current();
        }, 1800);
      },
    );

    return () => {
      disconnectSubscriptionRef.current?.remove();
      disconnectSubscriptionRef.current = null;

      if (disconnectVerificationTimerRef.current) {
        clearTimeout(disconnectVerificationTimerRef.current);
        disconnectVerificationTimerRef.current = null;
      }
      disconnectEventPendingRef.current = false;
    };
  }, [connectedDevice]);

  useEffect(() => {
    return () => {
      if (connectionLostToastTimerRef.current) {
        clearTimeout(connectionLostToastTimerRef.current);
      }
    };
  }, []);
  // End of the new connection lost toast logic

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
        intentionalDisconnectRef.current = true;

        const success = await disconnectDevice(connectedDevice);

        if (success) {
          monitoredDeviceRef.current = null;
          disconnectMonitorGenerationRef.current += 1;
          intentionalDisconnectRef.current = false;
          setConnectedDevice(null);
          setIsBluetoothOn(false);
          props.onBleDisconnected(); // Tell App.js we are disconnected
        } else {
          intentionalDisconnectRef.current = false;
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
    <LinearGradient
      colors={["#06182b", "#082b4f", "#092c52"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >
      <Image
        source={require("../../../assets/wideLogo.png")}
        style={styles.logo}
      />

      {/* Loading / scanning / connecting status */}
      {connectionPhase && (
        <View style={styles.loadingPill}>
          <ActivityIndicator size="small" color="#8ecbff" />

          <Text style={styles.loadingText}>
            {connectionPhase === "scanning"
              ? "Searching for FG devices…"
              : connectionPhase === "retrying"
                ? "Still searching for FG devices…"
                : connectionPhase === "connecting"
                  ? "Connecting to device…"
                  : connectionPhase === "disconnecting"
                    ? "Disconnecting…"
                    : "Preparing Bluetooth…"}
          </Text>
        </View>
      )}

      {/* Device scan / connection error */}
      {scanError && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toastContainer,
            styles.toastErrorBorder,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-8, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={[styles.toastIconContainer, styles.toastErrorIcon]}>
            <MaterialCommunityIcons name="radar" size={23} color="#ff6b6b" />
          </View>

          <View style={styles.toastTextContainer}>
            <Text style={styles.toastTitle}>Device Not Found</Text>
            <Text style={styles.toastMessage}>
              Scan timed out. Make sure the device is powered on and nearby.
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Unexpected BLE connection loss */}
      {connectionLost && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toastContainer,
            styles.toastErrorBorder,
            {
              opacity: fadeConnectionLostAnim,
              transform: [
                {
                  translateY: fadeConnectionLostAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-8, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={[styles.toastIconContainer, styles.toastErrorIcon]}>
            <MaterialCommunityIcons
              name="bluetooth-off"
              size={24}
              color="#ff6b6b"
            />
          </View>

          <View style={styles.toastTextContainer}>
            <Text style={styles.toastTitle}>Connection Lost</Text>
            <Text style={styles.toastMessage}>
              Device disconnected. Please reconnect.
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Small startup BLE hint */}
      {showBleHint && !isBluetoothOn && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.bleHintContainer,
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
          <View style={styles.bleHintArrow} />

          <View style={styles.bleHintRow}>
            <MaterialCommunityIcons
              name="bluetooth"
              size={19}
              color="#8ecbff"
            />

            <View style={styles.bleHintTextArea}>
              <Text style={styles.bleHintTitle}>Connect your device</Text>
              <Text style={styles.bleHintSubtitle}>Tap Bluetooth to begin</Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Bluetooth action button — intentionally kept clean, with no circle */}
      <TouchableOpacity
        onPress={handleBluetoothPress}
        disabled={!!connectionPhase}
        style={{ opacity: connectionPhase ? 0.5 : 1 }}
        activeOpacity={0.2}
      >
        <MaterialCommunityIcons
          name={isBluetoothOn ? "bluetooth-connect" : "bluetooth-off"}
          size={40}
          color={isBluetoothOn ? "#0ee50be2" : "#ffffff"}
          style={styles.icon}
        />
      </TouchableOpacity>

      {/* Bluetooth is disabled on the phone */}
      {bluetoothOff && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toastContainer,
            styles.toastInfoBorder,
            {
              opacity: fadeBtAnim,
              transform: [
                {
                  translateY: fadeBtAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-8, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={[styles.toastIconContainer, styles.toastInfoIcon]}>
            <MaterialCommunityIcons
              name="bluetooth-off"
              size={23}
              color="#8ecbff"
            />
          </View>

          <View style={styles.toastTextContainer}>
            <Text style={styles.toastTitle}>Bluetooth Is Off</Text>
            <Text style={styles.toastMessage}>
              Turn on Bluetooth on your phone to connect.
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Device picker */}
      <Modal transparent visible={showPicker} animationType="fade">
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={[
              "rgba(74, 170, 255, 0.72)",
              "rgba(77, 112, 255, 0.38)",
              "rgba(41, 103, 176, 0.22)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalBorder}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderIcon}>
                  <MaterialCommunityIcons
                    name="bluetooth"
                    size={22}
                    color="#8ecbff"
                  />
                </View>

                <View style={styles.modalHeaderTextArea}>
                  <Text style={styles.modalTitle}>Select FG Device</Text>
                  <Text style={styles.modalSubtitle}>
                    Choose a nearby Detector or Source
                  </Text>
                </View>
              </View>

              <FlatList
                data={foundDevices}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.deviceList}
                renderItem={({ item }) => {
                  // Use a fallback name in case the BLE device does not advertise a name.
                  const deviceName = item.name || "Unnamed device";

                  /*
                   * Read the final letter immediately before the numeric serial.
                   *
                   * Examples:
                   * FGASD794 -> D -> Detector
                   * FGASS794 -> S -> Source
                   */
                  const nameMatch = deviceName.trim().match(/([A-Za-z])\d+$/);

                  const typeLetter = nameMatch
                    ? nameMatch[1].toUpperCase()
                    : null;

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
                      style={styles.deviceRow}
                      activeOpacity={0.65}
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

                          // Send both the connected BLE device and its detected type to App.js.
                          props.onBleConnected(connected, deviceType);

                          // Hide the connection banner after successful connection.
                          setConnectionPhase(null);
                        } catch (e) {
                          console.log("❌ Selected connect failed:", e.message);

                          // Hide the connection banner if connection failed.
                          setConnectionPhase(null);

                          // Show the connection error notification.
                          showErrorToast();
                        }
                      }}
                    >
                      <View style={styles.deviceTextArea}>
                        <Text style={styles.deviceName}>{deviceName}</Text>
                        <Text style={styles.deviceType}>{deviceTypeLabel}</Text>
                      </View>

                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={24}
                        color="rgba(217,236,255,0.48)"
                      />
                    </TouchableOpacity>
                  );
                }}
              />

              <TouchableOpacity
                style={styles.cancelButton}
                activeOpacity={0.65}
                onPress={() => setShowPicker(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </LinearGradient>
  );
};

export default Navbar;
