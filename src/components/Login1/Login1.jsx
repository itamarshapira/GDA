import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { writePasskey } from "../../services/loginService";
import { forceRefreshGatt, logServicesAndCharacteristics, manager } from "../../services/bleService";

const Login1 = ({ device, onLogin }) => {
  useEffect(() => {
    const sendPasskey = async () => {
      if (!device) {
        console.log("[Login1] ❌ No device received");
        return;
      }

      try {
        await new Promise((r) => setTimeout(r, 1500)); // optional short delay

        console.log("[Login1] 🔐 Writing passkey...");
        const ok = await writePasskey(device, "123456");

        if (ok) {
          console.log("[Login1] ✅ Passkey written — refreshing GATT...");
          const refreshed = await forceRefreshGatt(device, manager);

          if (refreshed) {
            const uuidMap = await logServicesAndCharacteristics(refreshed);
            if (uuidMap) {
              console.log("[Login1] 📦 UUID MAP:");
              console.log(JSON.stringify(uuidMap, null, 2)); // Pretty-print
            } 
            console.log("[Login1] ✅ GATT refreshed — login complete");
            onLogin(); // ✅ move to Tabs
          } else {
            console.log("[Login1] ⚠️ GATT refresh failed — reconnect manually");
          }
        } else {
          console.log("[Login1] ❌ Passkey write failed");
        }
      } catch (error) {
        console.log("[Login1] ❌ Login flow failed:", error.message);
      }
    };

    sendPasskey(); // ⬅️ Run once on mount
  }, [device]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Logging in... 🔐</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgb(31,31,31)",
  },
  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
});

export default Login1;
