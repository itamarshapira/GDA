import React from "react";
import { View, Text, ImageBackground, TouchableOpacity } from "react-native";
import styles from "./WelcomeStyles";

import bg from "../../../assets/bg.png"; // Background image used by the welcome screen

const Welcome = () => {
  return (
    <ImageBackground source={bg} style={styles.bg} resizeMode="cover">
      <TouchableOpacity activeOpacity={0.5} style={styles.container}>
        {/* Small label above the title.
            Why:
            - Gives a professional product/app feeling.
            - Keeps the screen minimal and not overloaded with text. */}
        <Text style={styles.badge}>FGAS MOBILE</Text>

        {/* Main title of the app opening screen */}
        <Text style={styles.title}>Fire & Gas Detection</Text>

        {/* Short explanation instead of a long company paragraph */}
        <Text style={styles.subtitle}>Control your detector</Text>

        {/* Feature cards.
            Why:
            - Easier to read than long paragraphs.
            - Good for a demo because each card explains one app capability. */}
        <View style={styles.featuresRow}>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>⌁</Text>
            <Text style={styles.featureTitle}>BLE</Text>
            <Text style={styles.featureText}>Connect to detector</Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>◉</Text>
            <Text style={styles.featureTitle}>Live</Text>
            <Text style={styles.featureText}>Monitor sensor data</Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>⚙</Text>
            <Text style={styles.featureTitle}>Control</Text>
            <Text style={styles.featureText}>Manage settings</Text>
          </View>
        </View>

        {/* Action hint.
            Why:
            - Tells the user what to do next without adding too much text. */}
        <Text style={styles.hint}>Use the Bluetooth icon above to connect</Text>
      </TouchableOpacity>
    </ImageBackground>
  );
};

export default Welcome;
