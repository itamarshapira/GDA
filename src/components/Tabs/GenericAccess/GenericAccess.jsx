// src/components/Tabs/GenericAccess/GenericAccess.js

import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import { readGenericAccessInfo } from "../../../services/genericAccessService";

const GenericAccess = ({ device }) => { // device prop passed from parent Tabs , and tabs get it from App, and app gets it from bleService
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInfo = async () => {
      if (!device) {
        setError("No BLE device");
        return;
      }

      console.log("[GenericAccess]  Reading...");
      const data = await readGenericAccessInfo(device);

      if (data) {
        console.log("🟪 [Generic Access] Sucsses:", data);
        setInfo(data);
        

      } else {
        setError("Failed to read Generic Access info");
      }
    };

    fetchInfo();
  }, [device]);

  return (
    <ScrollView style={styles.scrollArea} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Generic Access Service</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      {info ? (
        <>
          <Text style={styles.text}>Device Name: {info.deviceName}</Text>
          <Text style={styles.text}>
            Generic Sensor: {info.appearance !== null ? info.appearance : "N/A"} (Appearance)
          </Text>
        </>
      ) : !error ? (
        <Text style={styles.text}>Reading...</Text>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollArea: {
    flex: 1,
   // backgroundColor: "rgb(40,40,40)",
  },
  content: {
    paddingVertical: 20,
    paddingHorizontal: 12,
      alignItems: "center", // align center horizontally
  },
  header: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    
  },
  text: {
    color: "#ccc",
    fontSize: 18,
    //merginTop: 18,
    marginBottom: 18,
   
    
  },
  error: {
    color: "tomato",
    fontSize: 16,
    marginBottom: 10,
  },
});

export default GenericAccess;
