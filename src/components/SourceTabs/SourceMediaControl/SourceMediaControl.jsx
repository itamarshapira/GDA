// src/components/SourceTabs/SourceMediaControl/SourceMediaControl.jsx

import React, { useEffect, useRef, useState } from "react";
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
} from "../../../services/mediaControlService";

/*
 * The Source supports only these two control states:
 *
 * 0 = Normal
 * 1 = Alignment
 */
const SOURCE_MEDIA_CONTROL_MAP = {
  0: "Normal",
  1: "Alignment",
};

const SourceMediaControl = ({ device }) => {
  // Current Media Control Point value.
  const [state, setState] = useState(null);

  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  // Accelerometer data.
  const [axis, setAxis] = useState(null);
  const [notifyAxis, setNotifyAxis] = useState(false);

  // Stores the active BLE accelerometer notification.
  const axisSubRef = useRef(null);

  // --------------------------------------------------
  // READ CURRENT SOURCE CONTROL STATE
  // --------------------------------------------------
  const refreshState = async () => {
    if (!device) {
      setError("No BLE device connected");
      return;
    }

    console.log("SourceMediaControl.jsx: Reading Source control state");

    const value = await readMediaControlState(device);

    if (value === null) {
      setError("Failed to read Source control state");
      return;
    }

    console.log("SourceMediaControl.jsx: Source control state:", value);

    setState(value);
    setError(null);
  };

  // --------------------------------------------------
  // INITIAL STATE + ACCELEROMETER READ
  // --------------------------------------------------
  useEffect(() => {
    if (!device) {
      setError("No BLE device connected");
      setState(null);
      setAxis(null);
      return;
    }

    refreshState();

    const loadAxis = async () => {
      console.log("SourceMediaControl.jsx: Reading Source accelerometer");

      const axisData = await readAxisRaw(device);

      if (axisData) {
        console.log(
          "SourceMediaControl.jsx: Source accelerometer received:",
          axisData,
        );

        setAxis(axisData);
      } else {
        console.log(
          "SourceMediaControl.jsx: Failed to read Source accelerometer",
        );
      }
    };

    loadAxis();

    /*
     * This cleanup runs when the Source disconnects or when this
     * component finally unmounts.
     *
     * SourceTabs should keep this component mounted while changing
     * tabs so an active accelerometer notification can continue.
     */
    return () => {
      console.log(
        "SourceMediaControl.jsx: Cleaning accelerometer subscription",
      );

      if (axisSubRef.current) {
        axisSubRef.current.remove();
        axisSubRef.current = null;
      }

      setNotifyAxis(false);
    };
  }, [device]);

  // --------------------------------------------------
  // ALIGNMENT / NORMAL TOGGLE
  // --------------------------------------------------
  const handleAlignmentPress = async () => {
    if (!device || busy) {
      return;
    }

    setBusy(true);
    setError(null);

    /*
     * Current state is Alignment:
     * Write 0 to return to Normal.
     *
     * Current state is anything else:
     * Write 1 to enter Alignment.
     */
    const nextValue = state === 1 ? 0 : 1;

    console.log("SourceMediaControl.jsx: Writing control state:", nextValue);

    const success = await writeMediaControlState(device, nextValue);

    if (!success) {
      setError(
        nextValue === 1
          ? "Failed to start Alignment"
          : "Failed to return to Normal",
      );

      console.log("SourceMediaControl.jsx: Failed to write control state");

      setBusy(false);
      return;
    }

    /*
     * Read the characteristic again instead of assuming that
     * the firmware accepted and applied the requested value.
     */
    await refreshState();

    setBusy(false);
  };

  // --------------------------------------------------
  // ACCELEROMETER NOTIFICATION TOGGLE
  // --------------------------------------------------
  const toggleAxisNotify = () => {
    if (!device) {
      return;
    }

    // Notification is currently OFF, so start it.
    if (!notifyAxis) {
      console.log(
        "SourceMediaControl.jsx: Starting accelerometer notification",
      );

      const subscription = monitorAxis(device, (data) => {
        console.log(
          "SourceMediaControl.jsx: Live accelerometer received:",
          data,
        );

        setAxis(data);
      });

      if (subscription) {
        axisSubRef.current = subscription;
        setNotifyAxis(true);
      }

      return;
    }

    // Notification is currently ON, so stop it.
    console.log("SourceMediaControl.jsx: Stopping accelerometer notification");

    if (axisSubRef.current) {
      axisSubRef.current.remove();
      axisSubRef.current = null;
    }

    setNotifyAxis(false);
  };

  // --------------------------------------------------
  // VALUES USED BY THE UI
  // --------------------------------------------------
  const alignmentActive = state === 1;

  const stateLabel =
    state !== null
      ? (SOURCE_MEDIA_CONTROL_MAP[state] ?? `Unknown (${state})`)
      : "Reading…";

  /*
   * readAxisRaw() already provides magnitude.
   * monitorAxis() currently provides gx, gy, and gz, so for live
   * values we calculate magnitude here.
   */
  const magnitude =
    typeof axis?.magnitude === "number"
      ? axis.magnitude
      : axis
        ? Math.sqrt(axis.gx * axis.gx + axis.gy * axis.gy + axis.gz * axis.gz)
        : null;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.header}>Source Control</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      {/* Current Normal / Alignment state */}
      <View style={styles.statusStrip}>
        <Text style={styles.statusText}>
          Current State: <Text style={styles.stateValue}>{stateLabel}</Text>
        </Text>
      </View>

      {/* Alignment control */}
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
              {busy
                ? "Please wait…"
                : alignmentActive
                  ? "Back to Normal"
                  : "Alignment"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Source accelerometer */}
      <View style={styles.section}>
        <View style={styles.axisHeader}>
          <Text style={styles.sectionTitle}>Accelerometer</Text>

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
            <View style={styles.axisGrid}>
              <View style={styles.axisBox}>
                <Text style={styles.axisLabel}>X</Text>
                <Text style={styles.axisValue}>
                  {typeof axis.gx === "number" ? axis.gx.toFixed(3) : "—"}g
                </Text>
              </View>

              <View style={styles.axisBox}>
                <Text style={styles.axisLabel}>Y</Text>
                <Text style={styles.axisValue}>
                  {typeof axis.gy === "number" ? axis.gy.toFixed(3) : "—"}g
                </Text>
              </View>

              <View style={styles.axisBox}>
                <Text style={styles.axisLabel}>Z</Text>
                <Text style={styles.axisValue}>
                  {typeof axis.gz === "number" ? axis.gz.toFixed(3) : "—"}g
                </Text>
              </View>
            </View>

            <Text style={styles.axisHint}>
              Magnitude:{" "}
              <Text style={styles.stateValue}>
                {magnitude !== null ? magnitude.toFixed(3) : "—"}g
              </Text>
            </Text>
          </>
        ) : (
          <Text style={styles.emptyText}>Reading accelerometer data…</Text>
        )}
      </View>
    </ScrollView>
  );
};

export default SourceMediaControl;

const styles = StyleSheet.create({
  scroll: {
    width: "100%",
    backgroundColor: "#07111f",
  },

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

  button: {
    minWidth: 150,
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
});
