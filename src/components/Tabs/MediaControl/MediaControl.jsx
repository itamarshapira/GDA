// src/components/Tabs/MediaControl/MediaControl.jsx

import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import {
  readMediaControlState,
  writeMediaControlState,
  readAxisRaw,
  monitorAxis,
  writeResolutionControl,
} from "../../../services/mediaControlService";

// Firmware enum.
// These values come from the Media Control Point characteristic.
const MEDIA_CONTROL_MAP = {
  0: "Normal",
  1: "Alignment",
  2: "Zero Calibration",
};

const MediaControl = ({ device, onResolutionChanged }) => {
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  // Axis / G-force data.
  const [axis, setAxis] = useState(null);
  const [notifyAxis, setNotifyAxis] = useState(false);
  const axisSubRef = useRef(null);

  // Selected zoom/resolution button feedback.
  const [selectedResolution, setSelectedResolution] = useState(null);

  // -------------------------------------------
  // READ CURRENT MEDIA CONTROL STATE
  // -------------------------------------------
  const refreshState = async () => {
    if (!device) {
      setError("No BLE device connected");
      return;
    }

    const value = await readMediaControlState(device);

    if (value !== null) {
      setState(value);
      setError(null);
    }
  };

  // -------------------------------------------
  // INITIAL READ + CLEANUP
  // -------------------------------------------
  useEffect(() => {
    if (!device) {
      setError("No BLE device connected");
      return;
    }

    console.log("[MediaControl.jsx] 📖 Initial state read");

    refreshState();

    const loadAxis = async () => {
      // Reads axis once when the tab opens.
      // Why:
      // - Gives the user immediate G-force/orientation data.
      // - Notify can then be turned on for live updates.
      const axisData = await readAxisRaw(device);

      if (axisData) {
        setAxis(axisData);
      }
    };

    loadAxis();

    return () => {
      console.log("[Axis] cleanup");

      // Important:
      // Stop BLE notify when this component unmounts or device changes.
      // This prevents old subscriptions from staying alive.
      if (axisSubRef.current) {
        axisSubRef.current.remove();
        axisSubRef.current = null;
      }
    };
  }, [device]);

  // -------------------------------------------
  // ALIGNMENT BUTTON
  // -------------------------------------------
  const handleAlignmentPress = async () => {
    if (!device || busy) return;

    setBusy(true);
    setError(null);

    // Toggle logic:
    // If currently in Alignment mode, go back to Normal.
    // Otherwise enter Alignment mode.
    const nextValue = state === 1 ? 0 : 1;

    console.log("[MediaControl] 💾 Alignment pressed →", nextValue);

    const ok = await writeMediaControlState(device, nextValue);

    if (!ok) {
      setError("Failed to write Alignment");
      setBusy(false);
      return;
    }

    // Re-read actual state from device after writing.
    await refreshState();
    setBusy(false);
  };

  // -------------------------------------------
  // ZERO CALIBRATION BUTTON
  // -------------------------------------------
  const handleZeroCalibrationPress = async () => {
    if (!device || busy) return;

    setBusy(true);
    setError(null);

    console.log("[MediaControl] 💾 Zero Calibration pressed");

    const ok = await writeMediaControlState(device, 2);

    if (!ok) {
      setError("Failed to write Zero Calibration");
      setBusy(false);
      return;
    }

    // Hardware may return to Normal later,
    // so we read once after sending the command.
    await refreshState();
    setBusy(false);
  };

  // -------------------------------------------
  // ZOOM / RESOLUTION BUTTONS
  // -------------------------------------------
  const handleResolutionPress = async (value) => {
    if (!device || busy) return;

    setBusy(true);
    setError(null);

    console.log("[MediaControl] 💾 Resolution pressed →", value);

    const ok = await writeResolutionControl(device, value);

    if (!ok) {
      setError("Failed to write Resolution");
      setBusy(false);
      return;
    }

    // Save selected button only after BLE write succeeds.
    setSelectedResolution(value);

    // Wait before refreshing the video.
    // Why:
    // - The RPI needs time to apply FoV/resolution changes.
    // - Then Tabs.jsx remounts/refreshes VideoStream.
    setTimeout(() => {
      console.log("[MediaControl] ⏱️ Refreshing video after resolution change");

      if (onResolutionChanged) {
        onResolutionChanged();
      }
    }, 5000);

    console.log("[MediaControl] ✅ Resolution write completed:", value);

    setBusy(false);
  };

  // -------------------------------------------
  // AXIS NOTIFY TOGGLE
  // -------------------------------------------
  const toggleAxisNotify = () => {
    if (!device) return;

    // OFF → ON
    if (!notifyAxis) {
      console.log("[Axis] ▶️ Start notify");

      const sub = monitorAxis(device, (data) => {
        setAxis(data);
      });

      if (sub) {
        axisSubRef.current = sub;
        setNotifyAxis(true);
      }

      return;
    }

    // ON → OFF
    console.log("[Axis] ⏹️ Stop notify");

    if (axisSubRef.current) {
      axisSubRef.current.remove();
      axisSubRef.current = null;
    }

    setNotifyAxis(false);
  };

  // -------------------------------------------
  // DERIVED UI VALUES
  // -------------------------------------------
  const alignmentActive = state === 1;
  const zeroDisabled = state === 1 || busy;

  const stateLabel =
    state !== null
      ? (MEDIA_CONTROL_MAP[state] ?? `Unknown (${state})`)
      : "Reading…";

  const magnitude =
    typeof axis?.magnitude === "number"
      ? axis.magnitude
      : axis
        ? Math.sqrt(axis.gx * axis.gx + axis.gy * axis.gy + axis.gz * axis.gz)
        : null;

  // -------------------------------------------
  // DETECTOR ANGLE CALCULATION
  // -------------------------------------------
  // We calculate the detector body angle from accelerometer G-force values.
  // Important:
  // - Roll  = left/right tilt, mostly affected by X.
  // - Pitch = forward/backward tilt, mostly affected by Z.
  // - In our device, normal straight position is around:
  //   gx ≈ 0, gy ≈ -1, gz ≈ 0.
  //
  // Why Math.atan2?
  // atan2 gives the angle between two axes and handles positive/negative
  // directions better than simple division.
  const detectorAngle = axis
    ? {
        roll: Math.atan2(axis.gx, -axis.gy) * (180 / Math.PI),
        pitch: Math.atan2(axis.gz, -axis.gy) * (180 / Math.PI),
      }
    : null;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.header}>Device Control</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      {/* Current device mode strip */}
      <View style={styles.statusStrip}>
        <Text style={styles.statusText}>
          Current State: <Text style={styles.stateValue}>{stateLabel}</Text>
        </Text>
      </View>

      {/* Main control buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Control Mode</Text>

        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[
              styles.button,
              alignmentActive && styles.buttonActive,
              busy && styles.buttonDisabled,
            ]}
            onPress={handleAlignmentPress}
            disabled={busy}
            activeOpacity={0.75}
          >
            <Text style={styles.buttonText}>
              {alignmentActive ? "Stop Alignment" : "Alignment"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, zeroDisabled && styles.buttonDisabled]}
            onPress={handleZeroCalibrationPress}
            disabled={zeroDisabled}
            activeOpacity={0.75}
          >
            <Text style={styles.buttonText}>Zero Calibration</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Zoom / resolution control */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Camera Zoom</Text>

        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[
              styles.button,
              selectedResolution === 0 && styles.buttonActive,
              busy && styles.buttonDisabled,
            ]}
            onPress={() => handleResolutionPress(0)}
            disabled={busy}
            activeOpacity={0.75}
          >
            <Text style={styles.buttonText}>Zoom In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              selectedResolution === 1 && styles.buttonActive,
              busy && styles.buttonDisabled,
            ]}
            onPress={() => handleResolutionPress(1)}
            disabled={busy}
            activeOpacity={0.75}
          >
            <Text style={styles.buttonText}>Zoom Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Axis / G-force section */}
      <View style={styles.section}>
        <View style={styles.axisHeader}>
          <Text style={styles.sectionTitle}>G-Force Axis</Text>

          <TouchableOpacity onPress={toggleAxisNotify} activeOpacity={0.2}>
            <MaterialIcons
              name={notifyAxis ? "notifications" : "notifications-off"}
              size={30}
              color={notifyAxis ? "#04de71ff" : "#8f9aaa"}
            />
          </TouchableOpacity>
        </View>

        {axis ? (
          <>
            {/* Compact axis row */}
            <View style={styles.axisGrid}>
              <View style={styles.axisBox}>
                <Text style={styles.axisLabel}>X</Text>
                <Text style={styles.axisValue}>{axis.gx?.toFixed(3)}g</Text>
              </View>

              <View style={styles.axisBox}>
                <Text style={styles.axisLabel}>Y</Text>
                <Text style={styles.axisValue}>{axis.gy?.toFixed(3)}g</Text>
              </View>

              <View style={styles.axisBox}>
                <Text style={styles.axisLabel}>Z</Text>
                <Text style={styles.axisValue}>{axis.gz?.toFixed(3)}g</Text>
              </View>
            </View>

            <Text style={styles.axisHint}>
              Magnitude:{" "}
              <Text style={styles.stateValue}>
                {magnitude !== null ? magnitude.toFixed(3) : "—"}g
              </Text>
              {axis.orientationHint ? `  •  ${axis.orientationHint}` : ""}
            </Text>
          </>
        ) : (
          <Text style={styles.emptyText}>Reading axis data…</Text>
        )}

        {detectorAngle && (
          <View style={styles.angleCard}>
            <Text style={styles.angleTitle}>Detector Angle</Text>

            <View style={styles.angleRow}>
              <Text style={styles.angleLabel}>Roll</Text>
              <Text style={styles.angleValue}>
                {detectorAngle.roll.toFixed(1)}°
              </Text>
            </View>

            <View style={styles.angleRow}>
              <Text style={styles.angleLabel}>Pitch</Text>
              <Text style={styles.angleValue}>
                {detectorAngle.pitch.toFixed(1)}°
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default MediaControl;

const styles = StyleSheet.create({
  scroll: {
    width: "100%",
    backgroundColor: "#07111f",
  },

  // Main screen container.
  // Why:
  // - Matches the same FGD dark navy style as video/tabs/environmental.
  // - alignItems: "stretch" lets cards take the screen width cleanly.
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "stretch",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 30,
    backgroundColor: "#07111f",
  },

  header: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 14,
    textAlign: "center",
  },

  error: {
    color: "#ff6b6b",
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "700",
  },

  // Small strip for current state.
  // Why:
  // - Keeps the state visible without making it huge.
  // - Same compact dashboard style as Environmental sensor strips.
  statusStrip: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(13, 27, 47, 0.88)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(66, 153, 225, 0.28)",
    paddingHorizontal: 14,
    marginBottom: 12,
  },

  statusText: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },

  stateValue: {
    color: "#b2d9ff",
    fontWeight: "900",
  },

  // Section card.
  // Why:
  // - Groups related controls without taking too much space.
  section: {
    backgroundColor: "rgba(13, 27, 47, 0.72)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(66, 153, 225, 0.24)",
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
  },

  sectionTitle: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 10,
    textAlign: "center",
  },

  buttonsRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 10,
  },

  // Main action button.
  // Why:
  // - Dark button by default.
  // - Blue when active/selected.
  button: {
    minWidth: 130,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(7, 17, 31, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(66, 153, 225, 0.28)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
  },

  buttonActive: {
    backgroundColor: "#2f80ed",
    borderColor: "#2f80ed",
  },

  buttonDisabled: {
    opacity: 0.42,
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },

  axisHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 10,
  },

  axisGrid: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },

  // Small X/Y/Z value boxes.
  // Why:
  // - Easier to read than one long text line.
  // - Still compact enough for the Device Control tab.
  axisBox: {
    flex: 1,
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(7, 17, 31, 0.8)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(66, 153, 225, 0.22)",
  },

  axisLabel: {
    color: "rgba(255,255,255,0.60)",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 3,
  },

  axisValue: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },

  axisHint: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 10,
    textAlign: "center",
  },

  emptyText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 15,
    textAlign: "center",
    fontWeight: "700",
  },
  angleCard: {
    marginTop: 14,
    padding: 14,

    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(108, 180, 255, 0.24)",
  },

  angleTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: 12,
    textAlign: "center",
  },

  angleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    paddingVertical: 7,
  },

  angleLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "rgba(255,255,255,0.72)",
  },

  angleValue: {
    fontSize: 15,
    fontWeight: "900",
    color: "#8ecbff",
  },
});
