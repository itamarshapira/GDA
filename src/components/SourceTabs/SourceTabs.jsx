// src/components/SourceTabs/SourceTabs.js

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import VideoStream from "../Video/VideoStream"; // Same video stream component used by Detector Tabs
import SourceDeviceInfo from "./SourceDeviceInfo/SourceDeviceInfo"; // New component for Source device information
import GenericAccess from "../Tabs/GenericAccess/GenericAccess"; // Same generic access component used by Detector Tabs
import SourceEnvironmental from "./SourceEnvironmental/SourceEnvironmental"; // New component for Source environmental sensing
import SourceAlertNotification from "./SourceAlertNotification/SourceAlertNotification"; // New component for Source alert notification
import SourceMediaControl from "./SourceMediaControl/SourceMediaControl"; // New component for Source media control
import SourceSettings from "./SourceSettings/SourceSettings";

const SourceTabs = ({ device }) => {
  // Device Information is currently the first and only Source tab.
  const [selectedTab, setSelectedTab] = useState("mediaControl");

  useEffect(() => {
    console.log(
      "SourceTabs.js: Source page opened for BLE device:",
      device?.name,
    );
  }, [device]);

  /*
   * Creates a tab button using the exact same active/inactive
   * design used by the Detector Tabs component.
   */
  const TabButton = (id, label) => {
    const isActive = selectedTab === id;

    return (
      <TouchableOpacity
        key={id}
        onPress={() => setSelectedTab(id)}
        activeOpacity={0.75}
      >
        {isActive ? ( // Active tab uses LinearGradient.
          <LinearGradient
            colors={[
              "rgba(120, 200, 255, 0.95)",
              "rgba(47, 128, 237, 0.95)",
              "rgba(53, 93, 163, 0.95)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.activeGradient}
          >
            <Text style={[styles.menuItem, styles.activeText]}>{label}</Text>
          </LinearGradient>
        ) : (
          <Text style={styles.menuItem}>{label}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    // Main container for the Source Tabs component
    <View style={styles.container}>
      {/* Top half — same VideoStream component used by Detector Tabs. */}
      {/* Hide video on Settings so Settings receives the full screen height */}
      {selectedTab !== "settings" && (
        <View style={styles.videoContainer}>
          <VideoStream device={device} />
        </View>
      )}

      {/*
       * Same thin separator used below the Detector video/alert area.
       * The Source currently has no AlertBanner.
       */}
      <View style={styles.alertWrapper} />

      {/* Bottom half — same structure as Detector Tabs. */}
      <View style={styles.bottomContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabMenu}
        >
          {TabButton("mediaControl", "Source Control")}
          {TabButton("settings", "Settings")}
          {TabButton("deviceInfo", "Source Info")}
          {TabButton("environmental", "Env Sensing")}
          {TabButton("alert", "Alert Notification")}
          {TabButton("genericAccess", "Generic Access")}
        </ScrollView>

        {/* Selected tab content. */}
        <View style={styles.screenArea}>
          {/*
              SourceMediaControl stays mounted so accelerometer
              notifications continue while visiting another tab.
            */}
          <View
            style={{
              flex: 1,
              display: selectedTab === "mediaControl" ? "flex" : "none",
            }}
          >
            <SourceMediaControl device={device} />
          </View>

          {selectedTab === "settings" && <SourceSettings device={device} />}
          {selectedTab === "deviceInfo" && <SourceDeviceInfo device={device} />}
          {selectedTab === "genericAccess" && <GenericAccess device={device} />}
          {/*
              SourceEnvironmental always stays mounted.

              Why:
              - Switching to another tab only hides the component.
              - The BLE temperature notification can continue running.
              - It unmounts only when SourceTabs itself closes, such as disconnecting.
            */}
          <View
            style={{
              flex: 1,
              display: selectedTab === "environmental" ? "flex" : "none",
            }}
          >
            <SourceEnvironmental device={device} />
          </View>

          {/*
                SourceAlertNotification always stays mounted.

                This allows the live BLE alert subscription to continue
                even when the user opens another Source tab.
              */}
          <View
            style={{
              flex: 1,
              display: selectedTab === "alert" ? "flex" : "none",
            }}
          >
            <SourceAlertNotification device={device} />
          </View>
        </View>
      </View>
    </View>
  );
};

export default SourceTabs;

const styles = StyleSheet.create({
  // Styles for the SourceTabs component, copied from Tabs.jsx for consistency
  // Copied from Tabs.jsx.
  container: {
    flex: 1,
    backgroundColor: "#000000ff",
  },

  // Copied from Tabs.jsx.
  videoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000ff",
  },

  // Copied from Tabs.jsx.
  bottomContainer: {
    flex: 1,
    backgroundColor: "#07111f",
  },

  // Copied from Tabs.jsx.
  tabMenu: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,

    backgroundColor: "#07111f",

    borderTopWidth: 1,
    borderTopColor: "rgba(66, 153, 225, 0.10)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(66, 153, 225, 0.22)",
  },

  // Copied from Tabs.jsx.
  menuItem: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 14,
    fontWeight: "600",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },

  // Copied from Tabs.jsx.
  activeGradient: {
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },

  // Copied from Tabs.jsx.
  activeText: {
    color: "#ffffff",
    fontWeight: "800",
  },

  /*
   * Important:
   * Detector Tabs uses flex: 18 here.
   * The previous Source version used flex: 1, which could make
   * DeviceInfo look slightly different or more compressed.
   */
  screenArea: {
    flex: 18,
    backgroundColor: "#07111f",
  },

  // Same visual separator used by Detector Tabs.
  alertWrapper: {
    backgroundColor: "#07111f",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(66, 153, 225, 0.25)",
  },
});
