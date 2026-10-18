// src/components/Login1/Login1.jsx

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { writePasskey } from "../../services/loginService";
import {
  forceRefreshGatt,
  logServicesAndCharacteristics,
  manager,
} from "../../services/bleService";

const Login1 = ({ device, onLogin }) => {
  const scrollViewRef = useRef(null);

  // Keep the passkey field in view once the keyboard has finished opening.
  useEffect(() => {
    const keyboardSubscription = Keyboard.addListener("keyboardDidShow", () => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });

    return () => keyboardSubscription.remove();
  }, []);

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={["#061629", "#082b50", "#0b3d6e"]}
        locations={[0, 0.55, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.background}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient
            colors={[
              "rgba(74, 170, 255, 0.80)",
              "rgba(77, 112, 255, 0.45)",
              "rgba(41, 103, 176, 0.22)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardBorder}
          >
            <LinearGradient
              colors={[
                "rgba(17, 59, 99, 0.97)",
                "rgba(8, 34, 62, 0.98)",
                "rgba(6, 25, 47, 0.99)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              {/* <LinearGradient               // FGD LOGO BADGE cuurently removed
                colors={["#35a7ff", "#347cff", "#5c6cff"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.productBadge}
              >
                <Text style={styles.productBadgeText}>FGD MOBILE</Text>
              </LinearGradient> */}

              <LinearGradient
                colors={["rgba(62,161,255,0.24)", "rgba(38,91,151,0.11)"]}
                style={styles.iconCircle}
              >
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={27}
                  color="#8ecbff"
                />
              </LinearGradient>

              <Text style={styles.title}>Device Login</Text>
              <Text style={styles.subtitle}>
                Enter your device passkey to continue
              </Text>

              <LinearGradient
                colors={[
                  "rgba(70,174,255,0)",
                  "#46aeff",
                  "#6675ff",
                  "rgba(102,117,255,0)",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.divider}
              />

              <View style={styles.form}>
                <Text style={styles.inputLabel}>DEVICE PASSKEY</Text>
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
                  style={[
                    styles.buttonTouchable,
                    isLoading && styles.buttonDisabled,
                  ]}
                  onPress={handleLoginPress}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={["#35a7ff", "#347cff", "#5c6cff"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.buttonGradient}
                  >
                    {isLoading ? (
                      <View style={styles.loadingRow}>
                        <ActivityIndicator color="#ffffff" />
                        <Text style={styles.buttonText}>Logging in...</Text>
                      </View>
                    ) : (
                      <View style={styles.loadingRow}>
                        <MaterialCommunityIcons
                          name="login"
                          size={20}
                          color="#ffffff"
                        />
                        <Text style={styles.buttonText}>Login</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {!device && (
                  <Text style={styles.hint}>
                    Connect Bluetooth device first.
                  </Text>
                )}
              </View>
            </LinearGradient>
          </LinearGradient>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

export default Login1;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  cardBorder: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 29,
    padding: 1.2,
    shadowColor: "#2d96ff",
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 7 },
    elevation: 10,
  },
  card: {
    width: "100%",
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    alignItems: "center",
  },
  productBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 999,
    marginBottom: 19,
  },
  productBadgeText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(111, 190, 255, 0.22)",
  },
  title: {
    color: "#ffffff",
    fontSize: 27,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  subtitle: {
    color: "rgba(219, 238, 255, 0.72)",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 7,
    paddingHorizontal: 10,
  },
  divider: {
    width: "72%",
    height: 1,
    marginTop: 20,
    marginBottom: 24,
  },
  form: {
    width: "100%",
  },
  inputLabel: {
    color: "rgba(219, 238, 255, 0.86)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 9,
  },
  input: {
    width: "100%",
    minHeight: 49,
    borderWidth: 1,
    borderColor: "rgba(83, 169, 255, 0.32)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 15,
    color: "#ffffff",
    fontSize: 16,
    backgroundColor: "rgba(6, 25, 47, 0.85)",
  },
  error: {
    marginTop: 11,
    color: "#ff8585",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  buttonTouchable: {
    width: "100%",
    marginTop: 22,
    borderRadius: 14,
    overflow: "hidden",
  },
  buttonGradient: {
    minHeight: 50,
    paddingVertical: 13,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  hint: {
    marginTop: 14,
    color: "rgba(204, 228, 249, 0.62)",
    fontSize: 13,
    textAlign: "center",
  },
});
