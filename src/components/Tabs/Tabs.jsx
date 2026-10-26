// src/components/Tabs/Tabs.jsx
import React, { useLayoutEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import DeviceInfo from "./DeviceInfo/DeviceInfo";
import GenericAccess from "./GenericAccess/GenericAccess";
import Environmental from "./Environmental/Environmental";
import DeviceSettings from "./DeviceSettings/DeviceSettings";
import MediaControl from "./MediaControl/MediaControl";
import AlertNotification from "./AlertNotification/AlertNotification";
import VideoStream from "../Video/VideoStream";
import AlertBanner from "../AlertBanner/AlertBanner";
import HorizontalTabBar from "../HorizontalTabBar/HorizontalTabBar";
import { LinearGradient } from "expo-linear-gradient";
import { writeResolutionControl } from "../../services/mediaControlService";
import { readDeviceInformation } from "../../services/deviceInfoService";
import useDeviceInformation from "../../hooks/useDeviceInformation";
import useWifiSsidDiagnostics from "../../hooks/useWifiSsidDiagnostics";

// Keep the existing camera settling window. It is a refresh delay, not an
// acknowledgment that the MCU/Raspberry Pi has finished applying the new FoV.
const RESOLUTION_REFRESH_DELAY_MS = 5000;

const Tabs = ({ device }) => {
  // Session-owned Info read and Wi-Fi monitor survive tab/video remounts. Share
  // the same BLE result with Info and the header; neither child reads it again.
  const deviceInformation = useDeviceInformation(device, readDeviceInformation, "Failed to read");
  const wifiStatus = useWifiSsidDiagnostics(device, deviceInformation.info?.ssid);
  const [selectedTab, setSelectedTab] = useState("deviceInfo"); // Default tab when the dashboard opens.

  // This key is used to tell VideoStream to refresh/remount.
  // After a successful BLE zoom write and the settling window, increment it.
  const [videoRefreshKey, setVideoRefreshKey] = useState(0);

  // Zoom belongs to the connected dashboard, rather than the Device Control tab:
  // that tab unmounts when another tab is selected, but video can remain visible.
  // 1 preserves the initial Zoom Out highlight. This is an assumption at startup;
  // subsequent highlights mean "last successful BLE write", not confirmed FoV.
  const [selectedResolution, setSelectedResolution] = useState(1);
  const [resolutionBusy, setResolutionBusy] = useState(false);
  const [resolutionError, setResolutionError] = useState(null);
  const resolutionSessionRef = useRef(null);

  useLayoutEffect(() => {
    // A session object lets an awaited write distinguish its original device
    // from a later connection. Its synchronous pending flag blocks rapid taps
    // before React has rendered the disabled buttons, including tab remounts.
    // A layout effect prepares/invalidates the session at commit time, before
    // the user can press the newly displayed device's buttons.
    const session = {
      device,
      active: true,
      pending: false,
      timer: null,
      finishWait: null,
    };
    resolutionSessionRef.current = session;
    setSelectedResolution(1);
    setResolutionBusy(false);
    setResolutionError(null);

    return () => {
      session.active = false;
      if (session.timer !== null) {
        clearTimeout(session.timer);
        session.timer = null;
        console.log("Tabs.jsx: Cancelled pending zoom video refresh:", device?.id);
      }
      // Release the waiting promise as well as the timer. The handler checks
      // session.active before updating state or refreshing a later connection.
      session.finishWait?.();
      session.finishWait = null;
    };
  }, [device]);

  // Sequence one zoom operation: BLE write -> existing delay -> video refresh.
  // No automatic retry or assumed camera acknowledgment is added. A user may
  // resend the same value after completion because BLE success is not Pi success.
  const handleResolutionPress = async (value) => {
    const session = resolutionSessionRef.current;
    if (!device || !session?.active || session.device !== device) return;
    if (session.pending) {
      console.log("Tabs.jsx: Ignoring zoom press while an operation is pending:", value);
      return;
    }
    if (value !== 0 && value !== 1) return;

    session.pending = true;
    setResolutionBusy(true);
    setResolutionError(null);
    const startedAt = Date.now();
    const command = {
      deviceId: device.id,
      value,
      startedAt: new Date(startedAt).toISOString(),
    };
    console.log("Tabs.jsx: Zoom requested:", command);

    try {
      const ok = await writeResolutionControl(device, value);
      if (!session.active) {
        console.log("Tabs.jsx: Ignoring zoom result from a closed session:", command);
        return;
      }
      if (!ok) {
        // Preserve the previous highlight and do not refresh after a failed write.
        setResolutionError("Failed to write Resolution");
        return;
      }

      // Save selected button only after BLE write succeeds. Firmware completion
      // is unknown: this is requested-state feedback, not camera-state readback.
      setSelectedResolution(value);

      // Wait before refreshing the video: the RPI needs time to apply FoV changes.
      // Keep the operation busy through this window so another zoom cannot race
      // the first command or create another timer. Tabs survives tab switching.
      await new Promise((resolve) => {
        session.finishWait = resolve;
        session.timer = setTimeout(() => {
          session.timer = null;
          session.finishWait = null;
          resolve();
        }, RESOLUTION_REFRESH_DELAY_MS);
      });
      if (!session.active) return;

      console.log("Tabs.jsx: Refreshing video after zoom settling window (FoV unverified):", {
        ...command,
        elapsedMs: Date.now() - startedAt,
      });
      setVideoRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.log("Tabs.jsx: Zoom operation failed:", command, error?.message || error);
      if (session.active) setResolutionError("Failed to write Resolution");
    } finally {
      session.pending = false;
      if (session.active) setResolutionBusy(false);
    }
  };

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
          <VideoStream refreshKey={videoRefreshKey} wifiStatus={wifiStatus} />
        </View>
      )}

      {/* 🔔 GLOBAL ALERT BANNER (attached to video) */}
      <View style={styles.alertWrapper}>
        <AlertBanner alertStatus={alertStatus} />
      </View>

      {/* Bottom Half */}
      <View style={styles.bottomContainer}>
        {/* Shared scroll indicators; tab selection and button styling stay here. */}
        <HorizontalTabBar contentContainerStyle={styles.tabMenu}>
          {TabButton("deviceInfo", "Device Info")}
          {TabButton("mediaControl", "Device Control")}
          {TabButton("environmental", "Measurement")}{" "}
          {/*name cahnge from Environmental to Measurement */}
          {TabButton("settings", "Settings")}
          {TabButton("alert", "Alert Notification")}
          {TabButton("generic", "Generic Access")}
          {TabButton("maintenance", "Maintenance")}
        </HorizontalTabBar>

        {/* Tab scrren chosen */}
        <View style={styles.screenArea}>
          {selectedTab === "deviceInfo" && <DeviceInfo {...deviceInformation} />}
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
              selectedResolution={selectedResolution}
              resolutionBusy={resolutionBusy}
              resolutionError={resolutionError}
              onResolutionPress={handleResolutionPress}
            />
          )}

          {selectedTab === "maintenance" && (
            <Text style={styles.fakeText}>Maintenance Under Development </Text>
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
