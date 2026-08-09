// src/components/SourceTabs/SourceSettings/SourceSettings.jsx

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
  readPulsePeriod,
  writePulsePeriod,
  readPulseWidth,
  writePulseWidth,
  readChargerFrequency,
  writeChargerFrequency,
  readChargerDutyCycle,
  writeChargerDutyCycle,
  readHighVoltage,
  writeHighVoltage,
} from "../../../services/sourceSettingsService";

// --------------------------------------------------
// EDITABLE SETTING ROW
// --------------------------------------------------
/*
 * This component must remain outside SourceSettings.
 *
 * Why:
 * When it was declared inside SourceSettings, every input
 * state update created a new SettingRow component type.
 * React then unmounted the old TextInput, causing it to
 * lose focus and close the keyboard after every character.
 */
const SettingRow = ({
  label,
  value,
  inputValue,
  setInputValue,
  fieldName,
  savingField,
  onSave,
}) => {
  const isSaving = savingField === fieldName;
  const writeInProgress = savingField !== null;

  if (value === null) {
    return <Text style={styles.text}>Reading {label}…</Text>;
  }

  return (
    <View style={styles.row}>
      {/* Setting name */}
      <View style={styles.colLabel}>
        <Text style={styles.label}>{label}:</Text>
      </View>

      {/* Confirmed value currently stored by the Source */}
      <View style={styles.colValue}>
        <Text style={styles.value}>{value}</Text>
      </View>

      {/* Editable value */}
      <View style={styles.colInput}>
        <TextInput
          value={inputValue}
          onChangeText={setInputValue}
          keyboardType="number-pad"
          placeholder="edit value"
          placeholderTextColor="rgba(255,255,255,0.45)"
          selectionColor="#8ecbff"
          style={styles.input}
          editable={!writeInProgress}
        />
      </View>

      {/* Save button */}
      <View style={styles.colButton}>
        <TouchableOpacity
          onPress={onSave}
          disabled={writeInProgress}
          activeOpacity={0.75}
          style={[styles.saveButton, writeInProgress && styles.buttonDisabled]}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? "Saving" : "Save"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const SourceSettings = ({ device }) => {
  // --------------------------------------------------
  // CONFIRMED VALUES READ FROM THE SOURCE
  // --------------------------------------------------
  const [pulsePeriod, setPulsePeriod] = useState(null);
  const [pulseWidth, setPulseWidth] = useState(null);

  const [chargerFrequency, setChargerFrequency] = useState(null);

  const [chargerDutyCycle, setChargerDutyCycle] = useState(null);

  const [highVoltage, setHighVoltage] = useState(null);

  // --------------------------------------------------
  // EDITABLE INPUT VALUES
  // --------------------------------------------------
  const [pulsePeriodInput, setPulsePeriodInput] = useState("");

  const [pulseWidthInput, setPulseWidthInput] = useState("");

  const [chargerFrequencyInput, setChargerFrequencyInput] = useState("");

  const [chargerDutyCycleInput, setChargerDutyCycleInput] = useState("");

  const [highVoltageInput, setHighVoltageInput] = useState("");

  /*
   * Name of the setting currently being written.
   *
   * null means that no write operation is running.
   */
  const [savingField, setSavingField] = useState(null);

  const [error, setError] = useState(null);

  // --------------------------------------------------
  // READ ALL SOURCE SETTINGS
  // --------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    const fetchSourceSettings = async () => {
      if (!device) {
        setError("No BLE device connected");
        return;
      }

      setError(null);

      console.log("SourceSettings.jsx: Reading all Source settings");

      try {
        /*
         * Read sequentially so BLE requests are not performed
         * simultaneously.
         */

        // Pulse Period
        const pulsePeriodValue = await readPulsePeriod(device);

        if (cancelled) return;

        if (pulsePeriodValue !== null) {
          setPulsePeriod(pulsePeriodValue);
          setPulsePeriodInput(String(pulsePeriodValue));
        }

        console.log("SourceSettings.jsx: Pulse Period:", pulsePeriodValue);

        // Pulse Width
        const pulseWidthValue = await readPulseWidth(device);

        if (cancelled) return;

        if (pulseWidthValue !== null) {
          setPulseWidth(pulseWidthValue);
          setPulseWidthInput(String(pulseWidthValue));
        }

        console.log("SourceSettings.jsx: Pulse Width:", pulseWidthValue);

        // Charger Frequency
        const chargerFrequencyValue = await readChargerFrequency(device);

        if (cancelled) return;

        if (chargerFrequencyValue !== null) {
          setChargerFrequency(chargerFrequencyValue);

          setChargerFrequencyInput(String(chargerFrequencyValue));
        }

        console.log(
          "SourceSettings.jsx: Charger Frequency:",
          chargerFrequencyValue,
        );

        // Charger Duty Cycle
        const chargerDutyCycleValue = await readChargerDutyCycle(device);

        if (cancelled) return;

        if (chargerDutyCycleValue !== null) {
          setChargerDutyCycle(chargerDutyCycleValue);

          setChargerDutyCycleInput(String(chargerDutyCycleValue));
        }

        console.log(
          "SourceSettings.jsx: Charger Duty Cycle:",
          chargerDutyCycleValue,
        );

        // High Voltage
        const highVoltageValue = await readHighVoltage(device);

        if (cancelled) return;

        if (highVoltageValue !== null) {
          setHighVoltage(highVoltageValue);
          setHighVoltageInput(String(highVoltageValue));
        }

        console.log("SourceSettings.jsx: High Voltage:", highVoltageValue);

        const values = [
          pulsePeriodValue,
          pulseWidthValue,
          chargerFrequencyValue,
          chargerDutyCycleValue,
          highVoltageValue,
        ];

        if (values.some((value) => value === null)) {
          setError("One or more Source settings could not be read");
        }

        console.log("SourceSettings.jsx: All Source Settings read:", {
          pulsePeriod: pulsePeriodValue,
          pulseWidth: pulseWidthValue,
          chargerFrequency: chargerFrequencyValue,
          chargerDutyCycle: chargerDutyCycleValue,
          highVoltage: highVoltageValue,
        });
      } catch (readError) {
        if (cancelled) return;

        console.log(
          "SourceSettings.jsx: Settings read error:",
          readError.message,
        );

        setError("Failed to read Source settings");
      }
    };

    fetchSourceSettings();

    return () => {
      cancelled = true;
    };
  }, [device]);

  // --------------------------------------------------
  // GENERIC WRITE + READ-BACK VERIFICATION
  // --------------------------------------------------
  const saveSetting = async ({
    fieldName,
    label,
    inputValue,
    writeFunction,
    readFunction,
    setConfirmedValue,
    setInputValue,
  }) => {
    if (!device || savingField !== null) {
      return;
    }

    const trimmedInput = inputValue.trim();

    if (trimmedInput === "") {
      setError(`${label} cannot be empty`);
      return;
    }

    const requestedValue = Number(trimmedInput);

    /*
     * All five Source settings currently use unsigned
     * 16-bit values:
     *
     * Minimum: 0
     * Maximum: 65535
     *
     * Specific operational restrictions will be added
     * later after their valid ranges are known.
     */
    if (
      !Number.isInteger(requestedValue) ||
      requestedValue < 0 ||
      requestedValue > 0xffff
    ) {
      setError(`${label} must be a whole number from 0 to 65535`);
      return;
    }

    setSavingField(fieldName);
    setError(null);

    console.log(`SourceSettings.jsx: Writing ${label}:`, requestedValue);

    try {
      const writeSucceeded = await writeFunction(device, requestedValue);

      if (!writeSucceeded) {
        setError(`Failed to write ${label}`);
        return;
      }

      /*
       * Read the characteristic again.
       *
       * This verifies the value actually returned by the
       * Source instead of assuming the write was accepted.
       */
      const confirmedValue = await readFunction(device);

      console.log(`SourceSettings.jsx: ${label} read-back:`, confirmedValue);

      if (confirmedValue === null) {
        setError(`${label} was written, but read-back failed`);
        return;
      }

      setConfirmedValue(confirmedValue);
      setInputValue(String(confirmedValue));

      if (confirmedValue !== requestedValue) {
        setError(
          `Requested ${requestedValue}, but the Source returned ${confirmedValue}`,
        );
        return;
      }

      console.log(`SourceSettings.jsx: ${label} write verified successfully`);
    } catch (writeError) {
      console.log(
        `SourceSettings.jsx: ${label} write error:`,
        writeError.message,
      );

      setError(`${label} write error`);
    } finally {
      setSavingField(null);
    }
  };

  // --------------------------------------------------
  // INDIVIDUAL SAVE HANDLERS
  // --------------------------------------------------
  const handleSavePulsePeriod = () => {
    saveSetting({
      fieldName: "pulsePeriod",
      label: "Pulse Period",
      inputValue: pulsePeriodInput,
      writeFunction: writePulsePeriod,
      readFunction: readPulsePeriod,
      setConfirmedValue: setPulsePeriod,
      setInputValue: setPulsePeriodInput,
    });
  };

  const handleSavePulseWidth = () => {
    saveSetting({
      fieldName: "pulseWidth",
      label: "Pulse Width",
      inputValue: pulseWidthInput,
      writeFunction: writePulseWidth,
      readFunction: readPulseWidth,
      setConfirmedValue: setPulseWidth,
      setInputValue: setPulseWidthInput,
    });
  };

  const handleSaveChargerFrequency = () => {
    saveSetting({
      fieldName: "chargerFrequency",
      label: "Charger Frequency",
      inputValue: chargerFrequencyInput,
      writeFunction: writeChargerFrequency,
      readFunction: readChargerFrequency,
      setConfirmedValue: setChargerFrequency,
      setInputValue: setChargerFrequencyInput,
    });
  };

  const handleSaveChargerDutyCycle = () => {
    saveSetting({
      fieldName: "chargerDutyCycle",
      label: "Charger Duty Cycle",
      inputValue: chargerDutyCycleInput,
      writeFunction: writeChargerDutyCycle,
      readFunction: readChargerDutyCycle,
      setConfirmedValue: setChargerDutyCycle,
      setInputValue: setChargerDutyCycleInput,
    });
  };

  const handleSaveHighVoltage = () => {
    saveSetting({
      fieldName: "highVoltage",
      label: "High Voltage",
      inputValue: highVoltageInput,
      writeFunction: writeHighVoltage,
      readFunction: readHighVoltage,
      setConfirmedValue: setHighVoltage,
      setInputValue: setHighVoltageInput,
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={80}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>Source Settings</Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <SettingRow
          label="Pulse Period"
          value={pulsePeriod}
          inputValue={pulsePeriodInput}
          setInputValue={setPulsePeriodInput}
          fieldName="pulsePeriod"
          savingField={savingField}
          onSave={handleSavePulsePeriod}
        />

        <SettingRow
          label="Pulse Width"
          value={pulseWidth}
          inputValue={pulseWidthInput}
          setInputValue={setPulseWidthInput}
          fieldName="pulseWidth"
          savingField={savingField}
          onSave={handleSavePulseWidth}
        />

        <SettingRow
          label="Charger Freq"
          value={chargerFrequency}
          inputValue={chargerFrequencyInput}
          setInputValue={setChargerFrequencyInput}
          fieldName="chargerFrequency"
          savingField={savingField}
          onSave={handleSaveChargerFrequency}
        />

        <SettingRow
          label="Duty Cycle"
          value={chargerDutyCycle}
          inputValue={chargerDutyCycleInput}
          setInputValue={setChargerDutyCycleInput}
          fieldName="chargerDutyCycle"
          savingField={savingField}
          onSave={handleSaveChargerDutyCycle}
        />

        <SettingRow
          label="High Voltage"
          value={highVoltage}
          inputValue={highVoltageInput}
          setInputValue={setHighVoltageInput}
          fieldName="highVoltage"
          savingField={savingField}
          onSave={handleSaveHighVoltage}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SourceSettings;

const styles = StyleSheet.create({
  // Same main layout as Detector DeviceSettings.
  container: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "stretch",
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 120,
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

  // Same compact setting row used by Detector settings.
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

  // Fixed-width label column keeps every row aligned.
  colLabel: {
    width: 85,
    justifyContent: "center",
  },

  label: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 14,
    fontWeight: "800",
  },

  // Confirmed value from the Source.
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

  // Editable value.
  colInput: {
    flex: 1,
    alignItems: "stretch",
  },

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

  colButton: {
    width: 68,
    alignItems: "center",
  },

  saveButton: {
    height: 38,
    paddingHorizontal: 14,
    backgroundColor: "#2f80ed",
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonDisabled: {
    opacity: 0.45,
  },

  saveButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },
});
