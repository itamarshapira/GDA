// src/components/Tabs/Tabs.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import DeviceInfo from "./DeviceInfo/DeviceInfo";
import GenericAccess from "./GenericAccess/GenericAccess";
import Environmental from "./Environmental/Environmental";
import DeviceSettings from "./DeviceSettings/DeviceSettings";
import MediaControl from "./MediaControl/MediaControl";
import AlertNotification from "./AlertNotification/AlertNotification";
import VideoStream from "../Video/VideoStream";
import AlertBanner from "../AlertBanner/AlertBanner";
import { LinearGradient } from "expo-linear-gradient";
const Tabs = ({ device }) => {
  const [selectedTab, setSelectedTab] = useState("mediaControl"); // Default tab when the dashboard opens.

  // This key is used to tell VideoStream to refresh/remount.
  // When resolution changes, we increment this value.
  const [videoRefreshKey, setVideoRefreshKey] = useState(0);

  const TabButton = (id, label) => {
    const isActive = selectedTab === id;

    return (
      <TouchableOpacity
        key={id}
        onPress={() => setSelectedTab(id)}
        activeOpacity={0.75}
      >
        {isActive ? (
          /*
          Active tab uses LinearGradient.

        */
          <LinearGradient
            colors={[
              "rgba(120, 200, 255, 0.95)", // light sky blue
              "rgba(47, 128, 237, 0.95)", // FGD blue
              "rgba(53, 93, 163, 0.95)", // deeper blue edge
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

  const [alertStatus, setAlertStatus] = useState(null); // State for alert status and alert banner origanlly create in AlertNotification.jsx

  return (
    <View style={styles.container}>
      {/* Top Half */}
      {selectedTab !== "settings" && (
        <View style={styles.videoContainer}>
          <VideoStream refreshKey={videoRefreshKey} />
        </View>
      )}

      {/* 🔔 GLOBAL ALERT BANNER (attached to video) */}
      <View style={styles.alertWrapper}>
        <AlertBanner alertStatus={alertStatus} />
      </View>

      {/* Bottom Half */}
      <View style={styles.bottomContainer}>
        {/* TAbs Scrollable! */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabMenu}
        >
          {TabButton("mediaControl", "Device Control")}
          {TabButton("deviceInfo", "Device Info")}
          {TabButton("environmental", "Env Sensing")}
          {TabButton("settings", "Settings")}
          {TabButton("alert", "Alert Notification")}
          {TabButton("generic", "Generic Access")}

          {TabButton("battery", "Battery")}
          {TabButton("logs", "Logs")}
          {TabButton("upgrade", "Firmware")}
        </ScrollView>

        {/* Tab scrren chosen */}
        <View style={styles.screenArea}>
          {selectedTab === "deviceInfo" && <DeviceInfo device={device} />}
          <View
            style={{
              flex: 1,
              display: selectedTab === "alert" ? "flex" : "none",
            }}
          >
            <AlertNotification
              device={device}
              alertStatus={alertStatus}
              setAlertStatus={setAlertStatus}
            />
          </View>

          {selectedTab === "generic" && <GenericAccess device={device} />}
          {/* 
    NEW: Environmental is ALWAYS mounted.
    We hide it when it's not the active tab.
    This prevents BLE notify from running on an unmounted component.
  */}
          <View
            style={{
              flex: 1,
              display: selectedTab === "environmental" ? "flex" : "none",
            }}
          >
            {/* This component is always alive — notify keeps running safely */}
            <Environmental device={device} />
          </View>

          {selectedTab === "settings" && <DeviceSettings device={device} />}
          {selectedTab === "mediaControl" && (
            <MediaControl
              device={device}
              onResolutionChanged={() => {
                console.log("[Tabs] Resolution changed → refreshing video");
                setVideoRefreshKey((prev) => prev + 1);
              }}
            />
          )}

          {selectedTab === "battery" && (
            <Text style={styles.fakeText}>Battery Coming Soon </Text>
          )}
          {selectedTab === "logs" && (
            <Text style={styles.fakeText}>Logs Coming Soon</Text>
          )}
          {selectedTab === "upgrade" && (
            <Text style={styles.fakeText}>Firmware Update Coming Soon</Text>
          )}
        </View>
      </View>
    </View>
  );
};

export default Tabs;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000ff",
  },

  videoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000ff",
  },
  videoText: {
    fontSize: 20,
    color: "#853a3aff",
  },

  bottomContainer: {
    flex: 1,
    backgroundColor: "#07111f",
    //alignItems: "stretch",      // <- ensures children expand correctly
  },

  tabMenu: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,

    // Dark navy, matching the dashboard/video style.
    backgroundColor: "#07111f",

    // Slight top/bottom separation so the menu feels like its own control strip.
    borderTopWidth: 1,
    borderTopColor: "rgba(66, 153, 225, 0.10)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(66, 153, 225, 0.22)",
  },

  // Normal tab text.
  // Why:
  // - Soft white keeps inactive tabs readable but not too strong.
  menuItem: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 14,
    fontWeight: "600",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },

  // Gradient wrapper for the selected tab.
  // Why:
  // - The gradient must be on a View-like component, not directly on Text.
  // - This creates the selected pill shape.
  activeGradient: {
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },

  // Active tab text.
  // Why:
  // - Text stays white and bold over the blue gradient.
  activeText: {
    color: "#ffffff",
    fontWeight: "800",
  },

  screenArea: {
    // area where tab content shows - could came from the component itself
    flex: 18, // 18 full?

    backgroundColor: "#07111f",

    // paddingHorizontal: 10,
    // paddingVertical: 6,
  },

  fakeText: {
    textAlign: "center",
    color: "white",
    marginTop: 25,
    fontSize: 18,
  },
  alertWrapper: {
    backgroundColor: "#07111f",
    //justifyContent: "center",
    //alignItems: "center"
    //paddingVertical: 0,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(66, 153, 225, 0.25)", // subtle separator from tabs
  },
});
