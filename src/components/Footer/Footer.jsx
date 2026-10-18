// src/components/Footer/Footer.jsx

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const Footer = () => {
  return (
    <LinearGradient
      colors={["rgba(8, 31, 57, 0.98)", "rgba(7, 22, 41, 0.99)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.footer}
    >
      {/* Soft blue accent line */}
      <LinearGradient
        colors={[
          "rgba(70,174,255,0)",
          "rgba(70,174,255,0.65)",
          "rgba(102,117,255,0.55)",
          "rgba(102,117,255,0)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topAccent}
      />

      <View style={styles.content}>
        <Text style={styles.brand}>FG Detection</Text>

        <Text style={styles.separator}>•</Text>

        <Text style={styles.year}>© 2026</Text>
      </View>
      <Text style={styles.versionText}>Version 1.1.0</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  footer: {
    minHeight: 46,

    justifyContent: "center",
    alignItems: "center",

    paddingVertical: 9,

    position: "relative",
  },

  topAccent: {
    position: "absolute",
    top: 0,

    width: "72%",
    height: 1,
  },

  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  brand: {
    color: "rgba(223, 240, 255, 0.72)",

    fontSize: 12,
    fontWeight: "800",

    letterSpacing: 0.5,
  },

  separator: {
    color: "rgba(108, 180, 255, 0.45)",

    fontSize: 10,

    marginHorizontal: 7,
  },

  year: {
    color: "rgba(255,255,255,0.38)",

    fontSize: 11,
    fontWeight: "600",

    letterSpacing: 0.3,
  },

  versionText: {
    color: "rgba(204, 228, 249, 0.5)",
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
  },
});

export default Footer;
