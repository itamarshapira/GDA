// src/components/Welcome/WelcomeStyles.js
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    textAlign: "center",            // for text alignment
    maxWidth: 800,                  // similar to your CSS max-width
    alignSelf: "center",            // center the container horizontally
    marginTop: 50,
    marginBottom: 50,
    padding: 20,
    backgroundColor: "#b2b2f47c",
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
//    elevation: 5,                   // Android shadow
    color: "white",
  },
  title: {
    fontSize: 22,                   // roughly 1.8rem
    fontWeight: "bold",
    marginBottom: 15,
    color: "white",
    textAlign: "center",
  },
  paragraph: {
    fontSize: 16,                   // roughly 1rem
    lineHeight: 24,
    color: "white",
    textAlign: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    marginBottom: 5,
  },
  list: {
    alignItems: "flex-start",
    marginTop: 10,
  },
  listItem: {
    fontSize: 16,
    color: "white",
    marginBottom: 8,
  },
});

export default styles;
