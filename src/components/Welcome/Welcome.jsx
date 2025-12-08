// src/components/Welcome/Welcome.jsx
import React from "react";
import { View, Text } from "react-native";
import styles from "./WelcomeStyles"; // connects to the style file

const Welcome = () => {
  return (
    <View style={styles.container}>
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
        <Text style={styles.listItem}>• Highest immunity to false alarms</Text>
        <Text style={styles.listItem}>• Operation in all weather conditions</Text>
        <Text style={styles.listItem}>• Reduced cost of ownership</Text>
        <Text style={styles.listItem}>
          • Expert technical & application support
        </Text>
      </View>
    </View>
  );
};

export default Welcome;

