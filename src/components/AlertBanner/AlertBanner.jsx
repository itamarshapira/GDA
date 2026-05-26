import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ALERT_PRIORITY } from "../../services/alertPriority";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

function AlertBanner({ alertStatus }) {
  if (alertStatus === null) return null;

  if (alertStatus === 0) {
    return null; // No banner when all clear

    // another option to show a green banner:
    // return (
    //   <View style={[styles.banner, styles.bannerOk]}>
    //     <Text style={styles.bannerText}>All clear</Text>
    //   </View>
    // );
  }

  const activeAlerts = [];
  for (let i = 0; i < 16; i++) {
    const mask = 1 << i;
    if ((alertStatus & mask) !== 0) {
      if (ALERT_PRIORITY[mask]) {
        activeAlerts.push(ALERT_PRIORITY[mask]);
      } else {
        activeAlerts.push({ name: `Unknown bit ${i}`, priority: 99 });
      }
    }
  }

  activeAlerts.sort((a, b) => a.priority - b.priority);
  const topAlert = activeAlerts[0];

  return (
    <View style={styles.bannerWrapper}>
      {/* 
      LinearGradient creates the faded alert line.

      Why:
      - React Native cannot do CSS linear-gradient directly.
      - This gives us the "fade from sides" look.
      - The center is stronger red, and the sides are softer/transparent.
    */}
      <LinearGradient
        colors={[
          "rgba(177, 23, 23, 0.05)", // left side: almost transparent
          "rgba(121, 10, 10, 0.85)", // middle: strong alert red
          "rgba(177, 23, 23, 0.05)", // right side: almost transparent
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.banner}
      >
        <Text style={styles.bannerText}>
          Status: {topAlert?.name || "Unknown alert"}
        </Text>
      </LinearGradient>
    </View>
  );
}

export default AlertBanner;

const styles = StyleSheet.create({
  bannerWrapper: {
    marginHorizontal: 12,
    marginTop: 6,
    marginBottom: 6,
  },

  banner: {
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",

    // Subtle border keeps it connected to the dashboard style.
    borderWidth: 1,
    borderColor: "rgba(255, 120, 120, 0.18)",
  },

  bannerText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.3,
    textAlign: "center",
  },

  // Optional OK style, currently unused because alertStatus === 0 returns null.
  bannerOk: {
    backgroundColor: "rgba(0, 180, 95, 0.22)",
    borderColor: "rgba(0, 220, 120, 0.35)",
  },

  // Active alert style.
  // Why:
  // - Dark red/magenta fits the FGD navy UI better than bright flat red.
  // - It looks close to the image: serious, but not ugly.
  bannerBad: {
    backgroundColor: "rgba(150, 18, 60, 0.82)",
    borderColor: "rgba(255, 90, 130, 0.35)",
  },
});
