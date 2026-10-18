// src/components/Welcome/Welcome.jsx

import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import styles from "./WelcomeStyles";

const Welcome = () => {
  return (
    <LinearGradient
      // Brighter background than before, closer to the splash/logo feeling.
      colors={["#061629", "#082b50", "#0b3d6e"]}
      locations={[0, 0.55, 1]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.background}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* --------------------------------------------------
            MAIN WELCOME CARD
            Gradient border + dark glass-like interior.
        -------------------------------------------------- */}
        <TouchableOpacity
          activeOpacity={0.82}
          onPress={() => {}}
          style={styles.mainCardTouchable}
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
              {/* --------------------------------------------------
                TOP PRODUCT BADGE
            -------------------------------------------------- */}
              <LinearGradient
                colors={["#35a7ff", "#347cff", "#5c6cff"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.productBadge}
              >
                <Text style={styles.productBadgeText}>FGD MOBILE</Text>
              </LinearGradient>

              {/* --------------------------------------------------
                TITLE
            -------------------------------------------------- */}
              <Text style={styles.title}>Fire & Gas Detection</Text>

              <Text style={styles.subtitle}>Control your devices</Text>

              {/* Small decorative blue line */}
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

              {/* --------------------------------------------------
                FEATURE CARDS
            -------------------------------------------------- */}
              <View style={styles.featureRow}>
                {/* CONNECT */}
                <View style={styles.featureCard}>
                  <LinearGradient
                    colors={["rgba(62,161,255,0.24)", "rgba(38,91,151,0.11)"]}
                    style={styles.iconCircle}
                  >
                    <MaterialCommunityIcons
                      name="bluetooth-connect"
                      size={25}
                      color="#8ecbff"
                    />
                  </LinearGradient>

                  <Text style={styles.featureTitle}>Connect</Text>

                  <Text style={styles.featureText}>Detector &{"\n"}Source</Text>
                </View>

                {/* MONITOR */}
                <View style={styles.featureCard}>
                  <LinearGradient
                    colors={["rgba(62,161,255,0.24)", "rgba(38,91,151,0.11)"]}
                    style={styles.iconCircle}
                  >
                    <MaterialCommunityIcons
                      name="bell-ring-outline"
                      size={25}
                      color="#8ecbff"
                    />
                  </LinearGradient>

                  <Text style={styles.featureTitle}>Monitor</Text>

                  <Text style={styles.featureText}>
                    Alerts &{"\n"}sensor data
                  </Text>
                </View>

                {/* CONTROL */}
                <View style={styles.featureCard}>
                  <LinearGradient
                    colors={["rgba(62,161,255,0.24)", "rgba(38,91,151,0.11)"]}
                    style={styles.iconCircle}
                  >
                    <MaterialCommunityIcons
                      name="tune-variant"
                      size={25}
                      color="#8ecbff"
                    />
                  </LinearGradient>

                  <Text style={styles.featureTitle}>Control</Text>

                  <Text style={styles.featureText}>
                    Settings &{"\n"}alignment
                  </Text>
                </View>
              </View>

              {/* --------------------------------------------------
                CONNECTION INSTRUCTION
            -------------------------------------------------- */}
              <View style={styles.connectHint}>
                <View style={styles.connectHintIcon}>
                  <MaterialCommunityIcons
                    name="bluetooth"
                    size={19}
                    color="#9dd5ff"
                  />
                </View>

                <View style={styles.connectHintTextArea}>
                  <Text style={styles.connectHintTitle}>Ready to connect</Text>

                  <Text style={styles.connectHintText}>
                    Tap the Bluetooth icon above to begin
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

export default Welcome;
