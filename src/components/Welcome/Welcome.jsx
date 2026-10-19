// src/components/Welcome/Welcome.jsx

import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import styles from "./WelcomeStyles";

// The parent App provides the existing Navbar BLE connection action.
// Welcome only requests a connection; no BLE logic belongs in this screen.
const Welcome = ({ onConnect }) => {
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
          onPress={onConnect}
          accessibilityRole="button"
          accessibilityLabel="Connect Device"
          accessibilityHint="Scan for a nearby Detector or Source"
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
                  PRIMARY CONNECT ACTION (CTA)
                  The entire Welcome card is already touchable.
                  This is visual guidance, not a second nested button.
                  The existing onConnect callback still runs BLE via Navbar.
              -------------------------------------------------- */}
              <LinearGradient
                colors={["#2084eb", "#286bd6", "#444fbd"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.connectHint, ctaStyles.container]}
              >
                <View style={[styles.connectHintIcon, ctaStyles.iconContainer]}>
                  <MaterialCommunityIcons
                    name="bluetooth-connect"
                    size={24}
                    color="#ffffff"
                  />
                </View>

                <View style={styles.connectHintTextArea}>
                  <Text style={[styles.connectHintTitle, ctaStyles.title]}>
                    Connect Device
                  </Text>
                  <Text style={[styles.connectHintText, ctaStyles.subtitle]}>
                    Tap to scan for Detector or Source
                  </Text>
                </View>

                <View style={ctaStyles.arrowContainer}>
                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={20}
                    color="#ffffff"
                  />
                </View>
              </LinearGradient>
            </LinearGradient>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

// --------------------------------------------------
// WELCOME CONNECT CTA - LOCAL STYLE OVERRIDES
// --------------------------------------------------
// Only the new action banner is styled here so this update needs
// ONE file. All existing WelcomeStyles.js rules remain unchanged.
const ctaStyles = StyleSheet.create({
  container: {
    marginTop: 22,
    paddingVertical: 15,
    paddingHorizontal: 14,
    borderRadius: 17,
    borderColor: "rgba(171, 218, 255, 0.50)",
    shadowColor: "#328dff",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderColor: "rgba(255,255,255,0.22)",
    marginRight: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  subtitle: {
    color: "rgba(240,247,255,0.92)",
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 3,
  },
  arrowContainer: {
    width: 30,
    height: 30,
    marginLeft: 8,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.16)",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Welcome;
