import React from "react";
import { View, Text, ImageBackground, TouchableOpacity } from "react-native";
import styles from "./WelcomeStyles";

import bg from "../../../assets/bg.png"; // your new blue texture

const Welcome = () => {
  return (
    <ImageBackground source={bg} style={styles.bg} resizeMode="cover">
      <TouchableOpacity activeOpacity={0.4} style={styles.container}>
        <Text style={styles.title}>
          Welcome to Fire & Gas Detection Technologies Inc.
        </Text>

        <Text style={styles.paragraph}>
          We are committed to respond to the market requirements for improved
          performance and more reliable flame & gas detection products.
        </Text>

        <Text style={styles.sectionTitle}>That includes:</Text>

        <View style={styles.list}>
          <Text style={styles.listItem}>• Fastest speed of response</Text>
          <Text style={styles.listItem}>
            • Highest immunity to false alarms
          </Text>
          <Text style={styles.listItem}>
            • Operation in all weather conditions
          </Text>
          <Text style={styles.listItem}>• Reduced cost of ownership</Text>
          <Text style={styles.listItem}>
            • Expert technical & application support
          </Text>
        </View>
      </TouchableOpacity>
    </ImageBackground>
  );
};

export default Welcome;
