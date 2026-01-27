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
  footer: {
    height: 56,
    justifyContent: "center",
    alignItems: "center",

    //backgroundColor: "#1c1c1e", // slightly lighter than app background
    backgroundColor: "#082849e3",

    borderTopLeftRadius: 90,
    borderTopRightRadius: 90,
    // borderBottomLeftRadius: 1,

    borderTopWidth: 12,
    borderTopColor: "#ebf9faff",

    marginHorizontal: 90,

    // subtle elevation
    elevation: 6,
    shadowColor: "#000000ff",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 6,
  },

  text: {
    color: "#9aa0a6",
    fontSize: 12,
    letterSpacing: 0.3,
  },
});

export default Footer;
