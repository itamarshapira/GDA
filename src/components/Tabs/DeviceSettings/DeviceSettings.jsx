import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import {
  readFullScale,
  writeFullScale,
  readAlarmLevel,
  writeAlarmLevel,
  readWarnLevel,
  writeWarnLevel,
  readLowestLevel,
  writeLowestLevel,
  readResponseTime,
  writeResponseTime,
  readBlockDelay,
  writeBlockDelay,
  readGasType,
  GAS_TYPE_MAP,
  writeGasType,
} from "../../../services/deviceSettingsService";

import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { Picker } from "@react-native-picker/picker"; // for dropdown selection

const DeviceSettings = ({ device }) => {
  // * state for reding values from device
  const [fullScale, setFullScale] = useState(null);
  const [alarmLevel, setAlarmLevel] = useState(null);
  const [warnLevel, setWarnLevel] = useState(null);
  const [lowestLevel, setLowestLevel] = useState(null);
  const [responseTime, setResponseTime] = useState(null);
  const [blockDelay, setBlockDelay] = useState(null);
  const [error, setError] = useState(null);

  // * state for writing values to device
  const [fullScaleInput, setFullScaleInput] = useState("");
  const [alarmLevelInput, setAlarmLevelInput] = useState("");
  const [warnLevelInput, setWarnLevelInput] = useState("");
  const [lowestLevelInput, setLowestLevelInput] = useState("");
  const [responseTimeInput, setResponseTimeInput] = useState("");
  const [blockDelayInput, setBlockDelayInput] = useState("");

  //* Gas Type
  const [gasType, setGasType] = useState(null);
  const [gasTypeInput, setGasTypeInput] = useState(null);

  // * ------------------ Use Effect Start ------------------
  useEffect(() => {
    const fetchSettings = async () => {
      if (!device) {
        setError("No BLE device connected");
        return;
      }

      //* Read Full Scale
      console.log("[DeviceSettings.jsx]  Reading Full Scale...");
      const fullScaleValue = await readFullScale(device);
      if (fullScaleValue !== null) {
        setFullScale(fullScaleValue);
        setFullScaleInput(String(fullScaleValue)); // set input field as well
      } else {
        setError("Failed to read Full Scale");
      }

      //* Read Alarm Level
      console.log("[DeviceSettings.jsx]  Reading Alarm Level...");
      const alarmValue = await readAlarmLevel(device);
      if (alarmValue !== null) {
        setAlarmLevel(alarmValue);
        setAlarmLevelInput(String(alarmValue)); // set input field as well
      } else {
        setError("Failed to read Alarm Level");
      }

      //* Read Warn Level
      const warnValue = await readWarnLevel(device);
      if (warnValue !== null) {
        setWarnLevel(warnValue);
        setWarnLevelInput(String(warnValue)); // set input field as well
      } else {
        setError("Failed to read Warn Level");
      }

      //* Read Lowest Level
      const lowestLevelValue = await readLowestLevel(device);
      if (lowestLevelValue !== null) {
        setLowestLevel(lowestLevelValue);
        setLowestLevelInput(String(lowestLevelValue)); // set input field as well
      } else {
        setError("Failed to read Lowest Level");
      }

      //* Read Response Time
      const responseTimeValue = await readResponseTime(device);
      if (responseTimeValue !== null) {
        setResponseTime(responseTimeValue);
        setResponseTimeInput(String(responseTimeValue)); // set input field as well
      } else {
        setError("Failed to read Response Time");
      }

      //* Read Block Delay
      const blockDelayValue = await readBlockDelay(device);
      if (blockDelayValue !== null) {
        setBlockDelay(blockDelayValue);
        setBlockDelayInput(String(blockDelayValue)); // set input field as well
      } else {
        setError("Failed to read Block Delay");
      }

      //* Read Gas Type
      const gasTypeValue = await readGasType(device);
      if (gasTypeValue !== null) {
        const value = Number(gasTypeValue);
        setGasType(value);
        setGasTypeInput(value); // editable copy

        console.log("[GasType] state value:", gasType, typeof gasType);
      } else {
        setError("Failed to read Gas Type");
      }
    };

    fetchSettings();
  }, [device]);

  // * ------------------ Use Effect End ------------------

  // * -------------------------- writing ---------------------------

  //* Write Full Scale (test function)
  const handleSaveFullScale = async () => {
    if (!device) return;

    // Convert input string → number
    const value = Number(fullScaleInput);

    // Basic validation
    if (!Number.isInteger(value) || value <= 0) {
      setError("Full Scale must be a positive number");
      return;
    }

    console.log("[DeviceSettings] 💾 Saving Full Scale:", value);

    const ok = await writeFullScale(device, value);

    if (!ok) {
      setError("Failed to write Full Scale");
      return;
    }

    // Re-read from device (source of truth)
    const updated = await readFullScale(device);
    if (updated !== null) {
      setFullScale(updated);
      setFullScaleInput(String(updated));
      setError(null);
    }
  };

  const handleSaveAlarmLevel = async () => {
    if (!device) return;

    const value = Number(alarmLevelInput);

    if (!Number.isInteger(value) || value <= 0) {
      setError("Alarm Level must be a positive number");
      return;
    }

    const ok = await writeAlarmLevel(device, value);
    if (!ok) {
      setError("Failed to write Alarm Level");
      return;
    }

    const updated = await readAlarmLevel(device);
    if (updated !== null) {
      setAlarmLevel(updated);
      setAlarmLevelInput(String(updated));
      setError(null);
    }
  };

  const handleSaveWarnLevel = async () => {
    if (!device) return;

    const value = Number(warnLevelInput);

    if (!Number.isInteger(value) || value <= 0) {
      setError("Warn Level must be a positive number");
      return;
    }

    const ok = await writeWarnLevel(device, value);
    if (!ok) {
      setError("Failed to write Warn Level");
      return;
    }

    const updated = await readWarnLevel(device);
    if (updated !== null) {
      setWarnLevel(updated);
      setWarnLevelInput(String(updated));
      setError(null);
    }
  };

  const handleSaveLowestLevel = async () => {
    if (!device) return;

    const value = Number(lowestLevelInput);

    if (!Number.isInteger(value) || value <= 0) {
      setError("Lowest Level must be a positive number");
      return;
    }

    const ok = await writeLowestLevel(device, value);
    if (!ok) {
      setError("Failed to write Lowest Level");
      return;
    }

    const updated = await readLowestLevel(device);
    if (updated !== null) {
      setLowestLevel(updated);
      setLowestLevelInput(String(updated));
      setError(null);
    }
  };

  const handleSaveResponseTime = async () => {
    if (!device) return;

    const value = Number(responseTimeInput);

    if (!Number.isInteger(value) || value <= 0) {
      setError("Response Time must be a positive number");
      return;
    }

    const ok = await writeResponseTime(device, value);
    if (!ok) {
      setError("Failed to write Response Time");
      return;
    }

    const updated = await readResponseTime(device);
    if (updated !== null) {
      setResponseTime(updated);
      setResponseTimeInput(String(updated));
      setError(null);
    }
  };

  const handleSaveBlockDelay = async () => {
    if (!device) return;

    const value = Number(blockDelayInput);

    if (!Number.isInteger(value) || value <= 0) {
      setError("Block Delay must be a positive number");
      return;
    }

    const ok = await writeBlockDelay(device, value);
    if (!ok) {
      setError("Failed to write Block Delay");
      return;
    }

    const updated = await readBlockDelay(device);
    if (updated !== null) {
      setBlockDelay(updated);
      setBlockDelayInput(String(updated));
      setError(null);
    }
  };

  //! Gas Type writing make problem , try fix it later - need probably to cahnge method to not drop down!
  //   const handleSaveGasType = async (newGasType) => {
  //     if (!device) return;

  //     console.log("[GasType] 💾 Writing gas type:", newGasType);

  //     // UI update only
  //     setGasType(newGasType);

  //     const ok = await writeGasType(device, newGasType);

  //     if (!ok) {
  //       setError("Failed to write Gas Type");
  //       return;
  //     }

  //     // ❗ IMPORTANT:
  //     // Do NOT read anything after this
  //     // Device needs time to reconfigure internally
  //   };

  // * ------------------End Writing--------------------------------------------
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={80} // important for Tabs/header
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.header}>Device Settings</Text>
        {error && <Text style={styles.error}>{error}</Text>}

        {fullScale !== null ? (
          <View style={styles.row}>
            <View style={styles.colLabel}>
              <Text style={styles.label}>Full Scale:</Text>
            </View>

            <View style={styles.colValue}>
              <Text style={styles.value}>{fullScale}</Text>
            </View>

            {/* Input field for edit full scale */}
            <View style={styles.colInput}>
              <TextInput
                onChangeText={setFullScaleInput}
                keyboardType="number-pad"
                //inputMode="numeric"
                placeholder="edit value"
                placeholderTextColor="rgba(255,255,255,0.45)"
                selectionColor="#8ecbff"
                style={styles.input}
              />
            </View>

            {/* Save button */}
            <View style={styles.colButton}>
              <TouchableOpacity
                onPress={handleSaveFullScale}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : !error ? (
          <Text style={styles.text}>Reading Full Scale…</Text>
        ) : null}

        {alarmLevel !== null ? (
          <View style={styles.row}>
            <View style={styles.colLabel}>
              <Text style={styles.label}>Alarm Level:</Text>
            </View>

            <View style={styles.colValue}>
              <Text style={styles.value}>{alarmLevel}</Text>
            </View>

            <View style={styles.colInput}>
              <TextInput
                onChangeText={setAlarmLevelInput}
                keyboardType="number-pad"
                placeholder="edit value"
                placeholderTextColor="rgba(255,255,255,0.45)"
                selectionColor="#8ecbff"
                style={styles.input}
              />
            </View>

            <View style={styles.colButton}>
              <TouchableOpacity
                onPress={handleSaveAlarmLevel}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : !error ? (
          <Text style={styles.text}>Reading Alarm Level…</Text>
        ) : null}

        {warnLevel !== null ? (
          <View style={styles.row}>
            <View style={styles.colLabel}>
              <Text style={styles.label}>Warn Level:</Text>
            </View>

            <View style={styles.colValue}>
              <Text style={styles.value}>{warnLevel}</Text>
            </View>

            <View style={styles.colInput}>
              <TextInput
                onChangeText={setWarnLevelInput}
                keyboardType="numeric"
                placeholder="edit value"
                placeholderTextColor="rgba(255,255,255,0.45)"
                selectionColor="#8ecbff"
                style={styles.input}
              />
            </View>

            <View style={styles.colButton}>
              <TouchableOpacity
                onPress={handleSaveWarnLevel}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : !error ? (
          <Text style={styles.text}>Reading Warn Level…</Text>
        ) : null}

        {lowestLevel !== null ? (
          <View style={styles.row}>
            <View style={styles.colLabel}>
              <Text style={styles.label}>Lowest Level:</Text>
            </View>

            <View style={styles.colValue}>
              <Text style={styles.value}>{lowestLevel}</Text>
            </View>

            <View style={styles.colInput}>
              <TextInput
                onChangeText={setLowestLevelInput}
                keyboardType="numeric"
                placeholder="edit value"
                placeholderTextColor="rgba(255,255,255,0.45)"
                selectionColor="#8ecbff"
                style={styles.input}
              />
            </View>

            <View style={styles.colButton}>
              <TouchableOpacity
                onPress={handleSaveLowestLevel}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : !error ? (
          <Text style={styles.text}>Reading Lowest Level…</Text>
        ) : null}

        {responseTime !== null ? (
          <View style={styles.row}>
            <View style={styles.colLabel}>
              <Text style={styles.label}>Res Time:</Text>
            </View>

            <View style={styles.colValue}>
              <Text style={styles.value}>{responseTime}</Text>
            </View>

            <View style={styles.colInput}>
              <TextInput
                onChangeText={setResponseTimeInput}
                keyboardType="numeric"
                placeholder="edit value"
                placeholderTextColor="rgba(255,255,255,0.45)"
                selectionColor="#8ecbff"
                style={styles.input}
              />
            </View>

            <View style={styles.colButton}>
              <TouchableOpacity
                onPress={handleSaveResponseTime}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : !error ? (
          <Text style={styles.text}>Reading Response Time…</Text>
        ) : null}

        {blockDelay !== null ? (
          <View style={styles.row}>
            <View style={styles.colLabel}>
              <Text style={styles.label}>Block Delay:</Text>
            </View>

            <View style={styles.colValue}>
              <Text style={styles.value}>{blockDelay}</Text>
            </View>

            <View style={styles.colInput}>
              <TextInput
                onChangeText={setBlockDelayInput}
                keyboardType="numeric"
                placeholder="edit value"
                placeholderTextColor="rgba(255,255,255,0.45)"
                selectionColor="#8ecbff"
                style={styles.input}
              />
            </View>

            <View style={styles.colButton}>
              <TouchableOpacity
                onPress={handleSaveBlockDelay}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : !error ? (
          <Text style={styles.text}>Reading Block Delay…</Text>
        ) : null}

        {gasType !== null ? (
          <View style={styles.row}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Gas Type:</Text>
            </View>

            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={gasTypeInput}
                onValueChange={(v) => setGasTypeInput(v)}
                style={styles.picker}
              >
                {Object.keys(GAS_TYPE_MAP).map((key) => (
                  <Picker.Item
                    key={key}
                    label={GAS_TYPE_MAP[key]}
                    value={Number(key)}
                  />
                ))}
              </Picker>

              {/* <TouchableOpacity
              onPress={() => handleSaveGasType(gasTypeInput)}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity> */}
            </View>
          </View>
        ) : !error ? (
          <Text style={styles.text}>Reading Gas Type…</Text>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default DeviceSettings;

const styles = StyleSheet.create({
  // Main scroll content.
  // Why:
  // - Matches the new FGD dashboard style.
  // - alignItems: "stretch" lets rows use full width cleanly.
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "stretch",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 50,
    backgroundColor: "#07111f",
  },

  header: {
    color: "#ffffff",
    fontSize: 24,
    marginBottom: 16,
    fontWeight: "800",
    textAlign: "center",
  },

  text: {
    color: "rgba(255,255,255,0.70)",
    fontSize: 16,
    marginBottom: 8,
    textAlign: "center",
    fontWeight: "700",
  },

  error: {
    color: "#ff6b6b",
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "700",
  },

  // Each setting row.
  // Why:
  // - Makes every setting look like a compact dashboard strip.
  // - Keeps label, current value, input, and save button in one line.
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,

    backgroundColor: "rgba(13, 27, 47, 0.88)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(66, 153, 225, 0.26)",
  },

  // Label column.
  // Why:
  // - Fixed width keeps rows aligned.
  // - Slightly smaller font prevents long labels from breaking layout.
  colLabel: {
    width: 85,
    justifyContent: "center",
  },

  label: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 14,
    fontWeight: "800",
  },

  // Current value column.
  // Why:
  // - Shows confirmed value from the device.
  colValue: {
    width: 48,
    alignItems: "center",
    justifyContent: "center",
  },

  value: {
    color: "#b2d9ff",
    fontWeight: "900",
    fontSize: 16,
  },

  // Input column.
  colInput: {
    flex: 1,
    alignItems: "stretch",
  },

  // Editable input.
  // Why:
  // - Dark navy input matches the new style.
  // - Blue border shows it belongs to the FGD UI.
  input: {
    backgroundColor: "rgba(7, 17, 31, 0.95)",
    color: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(66, 153, 225, 0.24)",
    paddingVertical: 7,
    paddingHorizontal: 8,
    height: 38,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
  },

  // Button column.
  colButton: {
    width: 68,
    alignItems: "center",
  },

  // Save button.
  // Why:
  // - Uses FGD blue instead of old gray.
  // - Small pill style fits compact rows.
  saveButton: {
    height: 38,
    paddingHorizontal: 14,
    backgroundColor: "#2f80ed",
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },

  saveButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },

  // Gas type label container.
  // Why:
  // - Kept because Gas Type row uses a different JSX structure.
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: 92,
  },

  // Picker wrapper.
  // Why:
  // - Makes the picker match the same dark/blue style.
  pickerWrapper: {
    flex: 1,
    backgroundColor: "rgba(7, 17, 31, 0.95)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(66, 153, 225, 0.24)",
    height: 42,
    justifyContent: "center",
  },

  picker: {
    color: "#ffffff",
    height: 80,
  },
});
