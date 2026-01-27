import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ALERT_PRIORITY } from "../../services/alertPriority";

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
    <View style={[styles.banner, styles.bannerBad]}>
      <Text style={styles.bannerText}>
        Status: {topAlert?.name || "Unknown alert"}
      </Text>
    </View>
  );
}

export default AlertBanner;

const styles = StyleSheet.create({
  banner: {
    paddingVertical: 0.2,
    // paddingHorizontal: 6,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 50,
    marginVertical: 1,
  },
  bannerOk: {
    backgroundColor: "#0ea91856",
    opacity: 0.85,
  },
  bannerBad: {
    marginTop: 15,
    backgroundColor: "#b1171795",
    //opacity: 0.85,
  },
  bannerText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.3,
  },
});
