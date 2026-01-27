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
        <Text style={styles.title}>Enter Passkey</Text>
        <Text style={styles.subtitle}>Type the device passkey to continue</Text>

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
              <ActivityIndicator color="#0b0f0c" />
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
  // Background canvas (kept dark + centered)
  container: {
    flex: 1,
    justifyContent: "center", //
    alignItems: "center", // ✅ centers horizontally
    paddingHorizontal: 18,
    backgroundColor: "#0f1115",
  },

  // The actual "card"
  card: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    backgroundColor: "#171a21",
    borderRadius: 18,
    paddingVertical: 42,
    paddingHorizontal: 38,
    marginBottom: 180,

    // // iOS shadow
    // shadowColor: "#000",
    // shadowOpacity: 0.35,
    // shadowRadius: 18,
    // shadowOffset: { width: 0, height: 10 },

    // Android elevation
    elevation: 10,

    // Subtle border to separate from background
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.41)",
  },

  title: {
    color: "#ffffff",

    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.2,
    marginBottom: 6,
  },

  subtitle: {
    color: "rgba(255,255,255,0.65)",
    marginTop: 6,
    marginBottom: 18,
    fontSize: 14,
    lineHeight: 18,
  },

  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    color: "#fff",
    fontSize: 16,
    backgroundColor: "#0f1115",
  },

  button: {
    width: "100%",
    marginTop: 24,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    backgroundColor: "#22c55e",
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#0b0f0c",
    fontSize: 16,
    fontWeight: "800",
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  error: {
    marginTop: 10,
    color: "#ff5a5a",
    fontWeight: "700",
  },

  hint: {
    marginTop: 14,
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
  },
});
