// src/components/Welcome/WelcomeStyles.jsx
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    backgroundColor: "#07111f",
  },

  container: {
    width: "90%",
    maxWidth: 520,
    alignSelf: "center",

    paddingVertical: 30,
    paddingHorizontal: 20,

    backgroundColor: "rgba(8, 24, 44, 0.88)",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(108, 180, 255, 0.28)",

    elevation: 10,
  },

  badge: {
    alignSelf: "center",

    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 14,

    borderRadius: 999,
    backgroundColor: "rgba(66, 153, 225, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(66, 153, 225, 0.32)",

    color: "#b9ddff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },

  title: {
    fontSize: 25,
    fontWeight: "900",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: 0.2,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "rgba(255,255,255,0.76)",
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 22,
  },

  featuresRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 20,
  },

  featureCard: {
    flex: 1,
    minHeight: 104,

    paddingVertical: 14,
    paddingHorizontal: 8,

    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",

    alignItems: "center",
    justifyContent: "center",
  },

  featureIcon: {
    fontSize: 22,
    color: "#8ecbff",
    marginBottom: 8,
    fontWeight: "900",
  },

  featureTitle: {
    fontSize: 15,
    color: "#ffffff",
    fontWeight: "900",
    marginBottom: 5,
    textAlign: "center",
  },

  featureText: {
    fontSize: 13,
    lineHeight: 15,
    color: "rgba(255,255,255,0.68)",
    fontWeight: "700",
    textAlign: "center",
  },

  hint: {
    fontSize: 13,
    lineHeight: 18,
    color: "#b2d9ff",
    textAlign: "center",
    fontWeight: "800",
  },
});

export default styles;
