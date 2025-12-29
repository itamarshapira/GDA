import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Device Settings</Text>
      {error && <Text style={styles.error}>{error}</Text>}

      {fullScale !== null ? (
        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Full Scale:</Text>
            <Text style={styles.value}>{fullScale}</Text>
          </View>

          {/* Input field for edit full scale */}
          <TextInput
            // value={fullScaleInput} show value immidiatly on input
            onChangeText={setFullScaleInput}
            keyboardType="numeric"
            placeholder="edit value"
            //placeholderTextColor="#888"
            style={styles.input}
          />

          {/* Save button */}
          <TouchableOpacity
            onPress={handleSaveFullScale}
            //activeOpacity={0.7}
            style={styles.saveButton}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      ) : !error ? (
        <Text style={styles.text}>Reading Full Scale…</Text>
      ) : null}

      {alarmLevel !== null ? (
        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Alarm Level:</Text>
            <Text style={styles.value}>{alarmLevel}</Text>
          </View>

          <TextInput
            // value={alarmLevelInput}
            onChangeText={setAlarmLevelInput}
            keyboardType="numeric"
            placeholder="edit value"
            //placeholderTextColor="#888"
            style={styles.input}
          />

          {/* Save button */}
          <TouchableOpacity
            onPress={handleSaveAlarmLevel}
            //activeOpacity={0.7}
            style={styles.saveButton}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      ) : !error ? (
        <Text style={styles.text}>Reading Alarm Level…</Text>
      ) : null}

      {warnLevel !== null ? (
        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Warn Level:</Text>
            <Text style={styles.value}>{warnLevel}</Text>
          </View>

          <TextInput
            //value={warnLevelInput}
            onChangeText={setWarnLevelInput}
            keyboardType="numeric"
            placeholder="edit value"
            style={styles.input}
          />

          <TouchableOpacity
            onPress={handleSaveWarnLevel}
            style={styles.saveButton}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      ) : !error ? (
        <Text style={styles.text}>Reading Warn Level…</Text>
      ) : null}

      {lowestLevel !== null ? (
        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Lowest Level:</Text>
            <Text style={styles.value}>{lowestLevel}</Text>
          </View>

          <TextInput
            //value={lowestLevelInput} show value immidiatly on input
            onChangeText={setLowestLevelInput}
            keyboardType="numeric"
            placeholder="edit value"
            style={styles.input}
          />

          <TouchableOpacity
            onPress={handleSaveLowestLevel}
            style={styles.saveButton}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      ) : !error ? (
        <Text style={styles.text}>Reading Lowest Level…</Text>
      ) : null}

      {responseTime !== null ? (
        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Res Time:</Text>
            <Text style={styles.value}>{responseTime}</Text>
          </View>

          <TextInput
            //value={responseTimeInput} show value immidiatly on input
            onChangeText={setResponseTimeInput}
            keyboardType="numeric"
            placeholder="edit value"
            style={styles.input}
          />

          <TouchableOpacity
            onPress={handleSaveResponseTime}
            style={styles.saveButton}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      ) : !error ? (
        <Text style={styles.text}>Reading Response Time…</Text>
      ) : null}

      {blockDelay !== null ? (
        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Block Delay:</Text>
            <Text style={styles.value}>{blockDelay}</Text>
          </View>

          <TextInput
            //value={blockDelayInput} show value immidiatly on input
            onChangeText={setBlockDelayInput}
            keyboardType="numeric"
            placeholder="edit value"
            style={styles.input}
          />

          <TouchableOpacity
            onPress={handleSaveBlockDelay}
            style={styles.saveButton}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
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
  );
};

export default DeviceSettings;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    color: "#fff",
    fontSize: 22,
    marginBottom: 20,
    fontWeight: "bold",
  },
  text: {
    color: "#ccc",
    fontSize: 18,
    marginBottom: 8,
  },
  //   value: {
  //     color: "#b2b2f4ff",
  //     fontWeight: "bold",
  //   },
  error: {
    color: "tomato",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },

  input: {
    backgroundColor: "#333",
    color: "#fff",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    height: 40,
    textAlign: "center",
    fontSize: 15,
  },

  saveButton: {
    height: 40,
    paddingHorizontal: 18,
    backgroundColor: "#333",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontSize: 14,
  },

  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: 150, // 🔒 fixed column width
  },

  label: {
    color: "#ccc",
    fontSize: 18,
    marginRight: 6,
  },

  value: {
    color: "#b2b2f4ff",
    fontWeight: "bold",
    fontSize: 18,
  },

  pickerWrapper: {
    backgroundColor: "#333",
    borderRadius: 6,
    height: 40,
    justifyContent: "center",
    width: 160,
  },

  picker: {
    color: "#fff",
    height: 80,
  },
});
