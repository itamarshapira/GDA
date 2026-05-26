import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { writePasskey } from "../../services/loginService";
import {
  forceRefreshGatt,
  logServicesAndCharacteristics,
  manager,
} from "../../services/bleService";

const Login1 = ({ device, onLogin }) => {
  // ✅ user types passkey here
  const [passkey, setPasskey] = useState("");

  // ✅ UI states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLoginPress = async () => {
    if (!device) {
      setErrorMsg("No device connected.");
      return;
    }

    // ✅ basic validation
    if (!passkey || passkey.length < 4) {
      setErrorMsg("Please enter a valid passkey.");
      return;
    }

    try {
      setErrorMsg("");
      setIsLoading(true);

      console.log("[Login1] 🔐 Writing passkey...");
      const ok = await writePasskey(device, passkey);

      if (!ok) {
        setErrorMsg("Passkey write failed. Please try again.");
        return;
      }

      console.log("[Login1] ✅ Passkey written — refreshing GATT...");
      const refreshed = await forceRefreshGatt(device, manager);

      if (!refreshed) {
        setErrorMsg("GATT refresh failed. Please reconnect and try again.");
        return;
      }

      // Optional debug: log services map
      const uuidMap = await logServicesAndCharacteristics(refreshed);
      if (uuidMap) {
        console.log("[Login1] 📦 UUID MAP:");
        console.log(JSON.stringify(uuidMap, null, 2));
      }

      console.log("[Login1] ✅ Login complete");
      onLogin(); // ✅ go to Tabs
    } catch (err) {
      console.log("[Login1] ❌ Login flow failed:", err.message);
      setErrorMsg(err.message || "Login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* ✅ Card wrapper: gives the login a "panel" look */}
      <View style={styles.card}>
        <Text style={styles.title}>FGAS Login</Text>
        <Text style={styles.subtitle}>Enter detector passkey</Text>

        <TextInput
          style={styles.input}
          value={passkey}
          onChangeText={setPasskey}
          placeholder="Passkey (e.g. 123456)"
          placeholderTextColor="#9aa0a6"
          keyboardType="numeric"
          editable={!isLoading}
        />

        {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLoginPress}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#ffffff" />
              <Text style={styles.buttonText}>Logging in...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        {!device && (
          <Text style={styles.hint}>Connect Bluetooth device first.</Text>
        )}
      </View>
    </View>
  );
};

export default Login1;

const styles = StyleSheet.create({
  // Main screen background.
  // Why:
  // - Uses dark navy instead of neutral black.
  // - Feels closer to a technical FGD system UI.
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
    backgroundColor: "#07111f",
  },

  // Login card / panel.
  // Why:
  // - Looks like a clean control panel.
  // - Blue border connects it visually to the FGD app colors.
  card: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    backgroundColor: "#0d1b2f",
    borderRadius: 22,
    paddingVertical: 42,
    paddingHorizontal: 34,
    marginBottom: 180,

    // Android shadow.
    elevation: 10,

    // Blue/white FGD-style border.
    borderWidth: 1,
    borderColor: "rgba(66, 153, 225, 0.45)",
  },

  // Main title.
  // Why:
  // - White and bold for clear hierarchy.
  title: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 0.3,
    marginBottom: 6,
    textAlign: "center",
  },

  // Small explanation under the title.
  // Why:
  // - Softer white keeps it readable but not too strong.
  subtitle: {
    color: "rgba(255,255,255,0.70)",
    marginTop: 6,
    marginBottom: 22,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },

  // Passkey input.
  // Why:
  // - Dark input fits the card.
  // - Blue border makes it feel connected to the app theme.
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(66, 153, 225, 0.35)",
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 15,
    color: "#ffffff",
    fontSize: 16,
    backgroundColor: "#07111f",
  },

  // Primary login button.
  // Why:
  // - Blue replaces green, so the screen matches FGD colors.
  // - Still strong enough to show this is the main action.
  button: {
    width: "100%",
    marginTop: 24,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#2f80ed",
  },

  // Used while login is running.
  // Why:
  // - Shows the user they cannot press again while BLE login is in progress.
  buttonDisabled: {
    opacity: 0.65,
  },

  // Button text.
  // Why:
  // - White works better on blue than dark text.
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },

  // Loading spinner + text row.
  // Why:
  // - Keeps spinner and text aligned nicely.
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  // Error message.
  // Why:
  // - Red stays because errors must be obvious.
  error: {
    marginTop: 10,
    color: "#ff6b6b",
    fontWeight: "700",
    textAlign: "center",
  },

  // Small helper text when no BLE device exists.
  // Why:
  // - Soft white avoids making it look like an error.
  hint: {
    marginTop: 14,
    color: "rgba(255,255,255,0.60)",
    fontSize: 13,
    textAlign: "center",
  },
});
