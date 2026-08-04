import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function AnimatedSplash({ onFinish }) {
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.95)).current;
  const pulseOpacity = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(0.82)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.sequence([
      // Smooth screen fade-in
      Animated.timing(screenOpacity, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),

      // Logo fade + scale in
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 8,
          tension: 42,
          useNativeDriver: true,
        }),
      ]),

      // D sensor pulse + sparkle
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseOpacity, {
            toValue: 0.88,
            duration: 240,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0,
            duration: 360,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(pulseScale, {
            toValue: 1.18,
            duration: 240,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulseScale, {
            toValue: 1.34,
            duration: 360,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(70),
          Animated.timing(sparkleOpacity, {
            toValue: 1,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleOpacity, {
            toValue: 0,
            duration: 260,
            useNativeDriver: true,
          }),
        ]),
      ]),

      // Subtitle appears after D flicker
      Animated.parallel([
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(subtitleY, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),

      // Keep "Gas Detector" visible for a moment
      Animated.delay(350),

      // Smoothly fade out the whole splash before opening the app
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 450,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => onFinish?.());
  }, [
    logoOpacity,
    logoScale,
    onFinish,
    pulseOpacity,
    pulseScale,
    screenOpacity,
    sparkleOpacity,
    subtitleOpacity,
    subtitleY,
  ]);

  return (
    <Animated.View style={[styles.root, { opacity: screenOpacity }]}>
      <ImageBackground
        source={require("../../../assets/fgd_splash_bg_fullscreen.png")}
        resizeMode="cover"
        style={styles.background}
      >
        <View style={styles.content}>
          <View style={styles.logoWrap}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.dPulse,
                {
                  opacity: pulseOpacity,
                  transform: [{ scale: pulseScale }],
                },
              ]}
            />

            <Animated.View
              pointerEvents="none"
              style={[styles.dSparkle, { opacity: sparkleOpacity }]}
            />

            <Animated.Image
              source={require("../../../assets/fgd_splash_logo_transparent.png")}
              resizeMode="contain"
              style={[
                styles.logo,
                {
                  opacity: logoOpacity,
                  transform: [{ scale: logoScale }],
                },
              ]}
            />
          </View>

          <Animated.Text
            style={[
              styles.subtitle,
              {
                opacity: subtitleOpacity,
                transform: [{ translateY: subtitleY }],
              },
            ]}
          >
            Gas Detector
          </Animated.Text>
        </View>
      </ImageBackground>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#041A34",
  },
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrap: {
    width: "84%",
    aspectRatio: 3.05,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  subtitle: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 18,
    fontWeight: "500",
    letterSpacing: 1.8,
  },
  dPulse: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    right: "8.3%",
    top: "37%",
    backgroundColor: "rgba(38, 168, 255, 0.30)",
    shadowColor: "#40B4FF",
    shadowOpacity: 0.95,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 16,
  },
  dSparkle: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    right: "7.7%",
    top: "33%",
    backgroundColor: "rgba(255,255,255,0.98)",
    shadowColor: "#FFFFFF",
    shadowOpacity: 0.95,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 18,
  },
});
