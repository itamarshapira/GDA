// src/components/Tabs/MediaControl/MediaControl.jsx

import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  readMediaControlState,
  writeMediaControlState,
  readAxisRaw,
  monitorAxis,
} from "../../../services/mediaControlService";

// Firmware enum
const MEDIA_CONTROL_MAP = {
  0: "Normal",
  1: "Alignment",
  2: "Zero Calibration",
};

const MediaControl = ({ device }) => {
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const [axis, setAxis] = useState(null);
  const [notifyAxis, setNotifyAxis] = useState(false);
  const axisSubRef = useRef(null);

  const refreshState = async () => {
    const value = await readMediaControlState(device);
    if (value !== null) {
      setState(value);
      setError(null);
    }
  };

  useEffect(() => {
    if (!device) {
      setError("No BLE device connected");
      return;
    }

    console.log("[MediaControl.jsx] 📖 Initial state read");
    refreshState();

    readAxisRaw(device); // Debug log to check if we can read axis on mount
    const loadAxis = async () => {
      const axisData = await readAxisRaw(device);
      if (axisData) {
        setAxis(axisData);
      }
    };

    loadAxis();

    return () => {
      console.log("[Axis] cleanup");

      if (axisSubRef.current) {
        axisSubRef.current.remove();
        axisSubRef.current = null;
      }
    };
  }, [device]);

  // -------- Button handlers --------

  const handleAlignmentPress = async () => {
    if (!device || busy) return;

    setBusy(true);

    // Toggle logic
    const nextValue = state === 1 ? 0 : 1;

    console.log("[MediaControl] 💾 Alignment pressed →", nextValue);

    const ok = await writeMediaControlState(device, nextValue);
    if (!ok) {
      setError("Failed to write Alignment");
      setBusy(false);
      return;
    }

    // Re-read (safe here)
    await refreshState();
    setBusy(false);
  };

  const handleZeroCalibrationPress = async () => {
    if (!device || busy) return;

    setBusy(true);

    console.log("[MediaControl] 💾 Zero Calibration pressed");

    const ok = await writeMediaControlState(device, 2);
    if (!ok) {
      setError("Failed to write Zero Calibration");
      setBusy(false);
      return;
    }

    // Read once (hardware may still be in 2)
    await refreshState();
    setBusy(false);
  };

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

  // -------- UI --------

  const alignmentActive = state === 1;
  const zeroDisabled = state === 1 || busy;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Device Control</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      {state !== null && (
        <Text style={styles.stateText}>
          Current State:{" "}
          <Text style={styles.stateValue}>
            {MEDIA_CONTROL_MAP[state] ?? `Unknown (${state})`}
          </Text>
        </Text>
      )}

      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={[styles.button, alignmentActive && styles.buttonActive]}
          onPress={handleAlignmentPress}
          disabled={busy}
        >
          <Text style={styles.buttonText}>
            {alignmentActive ? "Stop Alignment" : "Alignment"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, zeroDisabled && styles.buttonDisabled]}
          onPress={handleZeroCalibrationPress}
          disabled={zeroDisabled}
        >
          <Text style={styles.buttonText}>Zero Calibration</Text>
        </TouchableOpacity>
      </View>
      {axis && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.stateText}>
            G-Force:
            {"\n"}X:{" "}
            <Text style={styles.stateValue}>{axis.gx?.toFixed(3)}</Text>
            {"  "}Y:{" "}
            <Text style={styles.stateValue}>{axis.gy?.toFixed(3)}</Text>
            {"  "}Z:{" "}
            <Text style={styles.stateValue}>{axis.gz?.toFixed(3)}</Text>
          </Text>
          <View
            style={{
              flexDirection: "",
              alignItems: "center",
              paddingBottom: 20,
            }}
          >
            <TouchableOpacity onPress={toggleAxisNotify} activeOpacity={0.2}>
              <MaterialIcons
                name={notifyAxis ? "notifications" : "notifications-off"}
                size={32}
                color={notifyAxis ? "#04de71ff" : "#aea8a8ff"}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default MediaControl;

const styles = StyleSheet.create({
  container: {
    //flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  header: {
    color: "#fff",
    fontSize: 22,
    marginBottom: 20,
    fontWeight: "bold",
  },
  error: {
    color: "tomato",
    marginBottom: 10,
  },
  stateText: {
    color: "#ccc",
    fontSize: 18,
    marginBottom: 20,
  },
  stateValue: {
    color: "#b2b2f4ff",
    fontWeight: "bold",
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 16,
  },
  button: {
    backgroundColor: "#333",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 6,
  },
  buttonActive: {
    backgroundColor: "#4b4bbf",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
  },
});
