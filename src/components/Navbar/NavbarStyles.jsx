// src/components/Navbar/NavbarStyles.js

import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  // --------------------------------------------------
  // NAVBAR
  // --------------------------------------------------
  container: {
    height: 55,
    width: "100%",

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    position: "relative",

    paddingHorizontal: 20,
    paddingTop: 4,

    // Subtle separator so the Navbar belongs to the same
    // visual system as the Welcome screen and Footer.
    borderBottomWidth: 1,
    borderBottomColor: "rgba(108, 180, 255, 0.22)",
  },

  logo: {
    width: 200,
    height: 50,

    resizeMode: "contain",
    alignSelf: "flex-start",
    marginLeft: 15,
  },

  icon: {
    marginRight: 15,
  },

  title: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
  },

  // --------------------------------------------------
  // LOADING / CONNECTION STATUS
  // --------------------------------------------------
  loadingPill: {
    position: "absolute",
    top: 65,
    left: 20,
    right: 20,

    paddingVertical: 11,
    paddingHorizontal: 14,

    borderRadius: 16,

    backgroundColor: "rgba(8, 24, 44, 0.97)",

    borderWidth: 1,
    borderColor: "rgba(108, 180, 255, 0.30)",

    zIndex: 20,
    elevation: 10,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 10,
  },

  loadingText: {
    color: "#d9ecff",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  // --------------------------------------------------
  // GENERIC NAVBAR TOAST
  // Used for connection lost, scan failure and Bluetooth off.
  // --------------------------------------------------
  toastContainer: {
    position: "absolute",
    top: 65,
    left: 20,
    right: 20,

    paddingVertical: 13,
    paddingHorizontal: 14,

    borderRadius: 16,

    backgroundColor: "rgba(8, 24, 44, 0.97)",

    borderWidth: 1,

    flexDirection: "row",
    alignItems: "center",

    zIndex: 25,
    elevation: 10,
  },

  toastErrorBorder: {
    borderColor: "rgba(255, 107, 107, 0.45)",
  },

  toastInfoBorder: {
    borderColor: "rgba(108, 180, 255, 0.34)",
  },

  toastIconContainer: {
    width: 40,
    height: 40,

    borderRadius: 20,

    alignItems: "center",
    justifyContent: "center",

    marginRight: 12,
  },

  toastErrorIcon: {
    backgroundColor: "rgba(255, 107, 107, 0.12)",
  },

  toastInfoIcon: {
    backgroundColor: "rgba(108, 180, 255, 0.12)",
  },

  toastTextContainer: {
    flex: 1,
  },

  toastTitle: {
    color: "#ffffff",

    fontSize: 15,
    fontWeight: "900",

    letterSpacing: 0.2,
  },

  toastMessage: {
    color: "rgba(217,236,255,0.72)",

    fontSize: 12,
    fontWeight: "600",

    marginTop: 2,
    lineHeight: 16,
  },

  // --------------------------------------------------
  // STARTUP BLE HINT
  // --------------------------------------------------
  bleHintContainer: {
    position: "absolute",

    top: 65,
    right: 25,

    width: 200,

    paddingVertical: 10,
    paddingHorizontal: 12,

    backgroundColor: "rgba(8, 24, 44, 0.97)",

    borderRadius: 14,

    borderWidth: 1,
    borderColor: "rgba(108, 180, 255, 0.30)",

    zIndex: 25,
    elevation: 8,
  },

  bleHintArrow: {
    position: "absolute",

    top: -7,
    right: 22,

    width: 0,
    height: 0,

    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: 7,

    borderLeftColor: "transparent",
    borderRightColor: "transparent",

    // Same color as the hint itself, so the arrow feels attached
    // instead of looking like a separate white triangle.
    borderBottomColor: "rgba(147, 183, 228, 0.97)",
  },

  bleHintRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  bleHintTextArea: {
    flex: 1,
    marginLeft: 9,
  },

  bleHintTitle: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },

  bleHintSubtitle: {
    color: "rgba(217,236,255,0.68)",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 1,
  },

  // --------------------------------------------------
  // DEVICE PICKER MODAL
  // --------------------------------------------------
  modalOverlay: {
    flex: 1,

    justifyContent: "center",

    paddingHorizontal: 20,

    backgroundColor: "rgba(2, 8, 16, 0.76)",
  },

  // Gradient border around the picker card.
  modalBorder: {
    width: "100%",

    maxHeight: "70%",

    padding: 1.2,

    borderRadius: 22,

    alignSelf: "center",

    elevation: 16,
  },

  modalCard: {
    width: "100%",

    paddingTop: 17,
    paddingHorizontal: 14,
    paddingBottom: 14,

    borderRadius: 21,

    backgroundColor: "rgba(7, 24, 43, 0.99)",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 3,
    paddingBottom: 14,

    borderBottomWidth: 1,
    borderBottomColor: "rgba(108, 180, 255, 0.16)",
  },

  modalHeaderIcon: {
    width: 42,
    height: 42,

    borderRadius: 21,

    alignItems: "center",
    justifyContent: "center",

    marginRight: 11,

    backgroundColor: "rgba(108, 180, 255, 0.12)",

    borderWidth: 1,
    borderColor: "rgba(108, 180, 255, 0.18)",
  },

  modalHeaderTextArea: {
    flex: 1,
  },

  modalTitle: {
    color: "#ffffff",

    fontSize: 17,
    fontWeight: "900",

    letterSpacing: 0.2,
  },

  modalSubtitle: {
    color: "rgba(217,236,255,0.58)",

    fontSize: 11,
    fontWeight: "600",

    marginTop: 2,
  },

  deviceList: {
    paddingTop: 8,
  },

  deviceRow: {
    minHeight: 64,

    flexDirection: "row",
    alignItems: "center",

    paddingVertical: 9,
    paddingHorizontal: 7,

    marginBottom: 6,

    borderRadius: 14,

    backgroundColor: "rgba(13, 38, 66, 0.70)",

    borderWidth: 1,
    borderColor: "rgba(108, 180, 255, 0.16)",
  },

  deviceIconContainer: {
    width: 40,
    height: 40,

    borderRadius: 20,

    alignItems: "center",
    justifyContent: "center",

    marginRight: 11,

    backgroundColor: "rgba(108, 180, 255, 0.10)",
  },

  deviceTextArea: {
    flex: 1,
  },

  deviceName: {
    color: "#ffffff",

    fontSize: 15,
    fontWeight: "800",
  },

  deviceType: {
    color: "rgba(217,236,255,0.58)",

    fontSize: 12,
    fontWeight: "600",

    marginTop: 2,
  },

  cancelButton: {
    height: 42,

    alignItems: "center",
    justifyContent: "center",

    marginTop: 7,

    borderRadius: 14,

    backgroundColor: "rgba(108, 180, 255, 0.08)",

    borderWidth: 1,
    borderColor: "rgba(108, 180, 255, 0.18)",
  },

  cancelButtonText: {
    color: "rgba(217,236,255,0.78)",

    fontSize: 13,
    fontWeight: "800",
  },
});

export default styles;
