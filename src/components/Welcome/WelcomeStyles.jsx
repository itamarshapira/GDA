// src/components/Welcome/WelcomeStyles.js

import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  background: {
    flex: 1,
    width: "100%",
  },

  scrollContent: {
    flexGrow: 1,

    justifyContent: "center",
    alignItems: "center",

    paddingHorizontal: 18,
    paddingVertical: 24,
  },

  // --------------------------------------------------
  // MAIN CARD
  // --------------------------------------------------

  // This outer gradient acts as a premium gradient border.
  cardBorder: {
    width: "100%",
    maxWidth: 520,

    borderRadius: 29,

    padding: 1.2,

    shadowColor: "#2d96ff",
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 7,
    },

    elevation: 10,
  },

  card: {
    width: "100%",

    borderRadius: 28,

    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,

    alignItems: "center",
  },

  // --------------------------------------------------
  // FGD MOBILE BADGE
  // --------------------------------------------------

  productBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    paddingVertical: 8,
    paddingHorizontal: 15,

    borderRadius: 999,

    marginBottom: 18,
  },

  productBadgeText: {
    color: "#ffffff",

    fontSize: 13,
    fontWeight: "900",

    letterSpacing: 1.4,

    marginLeft: 7,
  },

  // --------------------------------------------------
  // MAIN TEXT
  // --------------------------------------------------

  title: {
    color: "#ffffff",

    fontSize: 27,
    fontWeight: "900",

    textAlign: "center",

    letterSpacing: 0.2,
  },

  subtitle: {
    color: "rgba(219, 238, 255, 0.72)",

    fontSize: 14,
    fontWeight: "600",

    textAlign: "center",

    lineHeight: 20,

    marginTop: 7,

    paddingHorizontal: 10,
  },

  divider: {
    width: "72%",
    height: 1,

    marginTop: 20,
    marginBottom: 20,
  },

  // --------------------------------------------------
  // FEATURE CARDS
  // --------------------------------------------------

  featureRow: {
    width: "100%",

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
  },

  featureCard: {
    width: "31.5%",

    minHeight: 125,

    alignItems: "center",

    paddingVertical: 13,
    paddingHorizontal: 4,

    borderRadius: 17,

    backgroundColor: "rgba(10, 31, 55, 0.72)",

    borderWidth: 1,
    borderColor: "rgba(83, 169, 255, 0.20)",
  },

  iconCircle: {
    width: 46,
    height: 46,

    borderRadius: 23,

    justifyContent: "center",
    alignItems: "center",

    marginBottom: 9,

    borderWidth: 1,
    borderColor: "rgba(111, 190, 255, 0.22)",
  },

  featureTitle: {
    color: "#ffffff",

    fontSize: 13,
    fontWeight: "800",

    marginBottom: 4,

    textAlign: "center",
  },

  featureText: {
    color: "rgba(204, 228, 249, 0.62)",

    fontSize: 10.5,
    fontWeight: "600",

    lineHeight: 14,

    textAlign: "center",
  },

  // --------------------------------------------------
  // CONNECT HINT
  // --------------------------------------------------

  connectHint: {
    width: "100%",

    flexDirection: "row",
    alignItems: "center",

    marginTop: 20,

    paddingVertical: 12,
    paddingHorizontal: 14,

    borderRadius: 16,

    backgroundColor: "rgba(36, 107, 174, 0.15)",

    borderWidth: 1,
    borderColor: "rgba(83, 169, 255, 0.22)",
  },

  connectHintIcon: {
    width: 38,
    height: 38,

    borderRadius: 19,

    justifyContent: "center",
    alignItems: "center",

    backgroundColor: "rgba(72, 165, 255, 0.12)",

    marginRight: 11,
  },

  connectHintTextArea: {
    flex: 1,
  },

  connectHintTitle: {
    color: "#ffffff",

    fontSize: 13,
    fontWeight: "800",
  },

  connectHintText: {
    color: "rgba(204, 228, 249, 0.62)",

    fontSize: 11,
    fontWeight: "600",

    marginTop: 2,
  },
  mainCardTouchable: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 29,
  },
});

export default styles;
