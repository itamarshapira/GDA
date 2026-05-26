import React from "react";
import { View, Text, StyleSheet } from "react-native";

const Footer = () => {
  return (
    <View style={styles.footer}>
      <Text style={styles.text}>FG Detection © 2026</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  // Bottom footer strip.
  // Why:
  // - Matches the new FGD dark navy dashboard style.
  // - Removes the heavy half-circle shape, which felt separate from the app.
  // - Keeps it clean and professional like a system footer.
  footer: {
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",

    backgroundColor: "#07111f",

    borderTopWidth: 1,
    borderTopColor: "rgba(134, 187, 230, 0.22)",

    paddingVertical: 8,
  },

  // Footer text.
  // Why:
  // - Soft white/blue fits the dashboard style.
  // - Small text keeps footer secondary, not distracting.
  text: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
});

export default Footer;
