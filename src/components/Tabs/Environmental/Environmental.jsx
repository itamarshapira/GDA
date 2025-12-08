// src/components/Tabs/Environmental/Environmental.js

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { readMethane, readTemperature, readMeasurementInterval, monitorMethaneNotifications, writeMeasurementInterval  } from "../../../services/environmentalService";

/**
 * Environmental tab
 * - Reads methane concentration ( LEL)
 * - Reads board temperature (raw units for now)
 * - Displays both in a simple centered layout
 */
const Environmental = ({ device }) => {
  // state for methane and temperature values
  const [methane, setMethane] = useState(null);
  const [temperature, setTemperature] = useState(null);
  const [interval, setInterval] = useState(null);

  const [notifyMethane, setNotifyMethane] = useState(false);
  const [methaneSubscription, setMethaneSubscription] = useState(null);


  // simple error state (e.g. no device, read failure)
  const [error, setError] = useState(null);

  useEffect(() => {

     // if no device was passed from Tabs/App – we can't read anything
      if (!device) {
        setError("No BLE device");
        return;
      }

      let methaneSub = null; // track subscription
       
    const fetchData = async () => {
     
      try {
        console.log("[Environmental]  Reading methane + temperature…");

        // 1) read methane from service file
        const methaneValue = await readMethane(device);

        // 2) read temperature from service file
        const tempValue = await readTemperature(device);

        // if at least methane worked – we show it
        if (methaneValue !== null) {
          setMethane(methaneValue);
        }

        // if temperature worked – we store it as well
        if (tempValue !== null) {
          setTemperature(tempValue);
        }

        // if both failed – set error
        if (methaneValue === null && tempValue === null) {
          setError("Failed to read Environmental Sensing");
        }

        const intervalValue = await readMeasurementInterval(device);
        if (intervalValue !== null) setInterval(intervalValue);

            // Subscribe live
        methaneSub = monitorMethaneNotifications(device, (value) => {
        console.log("[Live Methane]", value);
        setMethane(value);
        });

      } catch (err) {
        console.log("[Environmental]  Error:", err.message);
        setError("Read error");
      }
    };

    // run once when component mounts OR when device changes
    fetchData();
       

  }, [device]);

  //* Handler to change measurement interval  
  const handleSetInterval = async (sec) => {
  if (!device) return;

  console.log(`[Environmental] ✍️ Setting interval to ${sec}s`);

  const ok = await writeMeasurementInterval(device, sec);
  if (ok) {
    setInterval(sec); // update UI immediately
    console.log("[Environmental]  Interval changed!");
  } else {
    console.log("[Environmental]  Failed to change interval");
  }
};


  return (
    // ScrollView so if later we add more info / graph – it can scroll inside the bottom area
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Environmental Sensing</Text>

      {/* If there is an error – show it */}
      {error && <Text style={styles.error}>{error}</Text>}

      {/* Methane section */}
      {methane !== null ? (
        <>
          <Text style={styles.text}>
            Methane Concentration:{" "}
            <Text style={styles.value}>{methane} LEL</Text>
          </Text>
         
        </>
      ) : !error ? (
        <Text style={styles.text}>Reading methane…</Text>
      ) : null}

      {/* Temperature section */}
      {temperature !== null ? (
        <>
          <Text style={[styles.text, { marginTop: 18 }]}>
            Temperature:{" "}
            <Text style={styles.value}>{(temperature/100).toFixed(2)}</Text>
          </Text>
          {/* later, if we know the scaling, we can show °C here */}
          {/* Example: Temperature: (temperature / 100).toFixed(2) °C */}
        </>
      ) : !error ? (
        <Text style={styles.text}>Reading temperature…</Text>
      ) : null}

       {/* Measurement Interval quick set */}
        {interval !== null && (
        <View style={{ marginTop: 20, alignItems: "center" }}>
            <Text style={styles.text}>Set Measurement Interval:</Text>

            <View style={styles.buttonRow}>
            {[1, 3, 5, 10].map((sec) => (
                <Text
                key={sec}
                style={[
                    styles.intervalButton,
                    interval === sec && styles.intervalActive,
                ]}
                onPress={() => handleSetInterval(sec)}
                >
                {sec}s
                </Text>
            ))}
            </View>
        </View>
)}


    </ScrollView>
  );
};

export default Environmental;

// ───────── Styles ─────────
const styles = StyleSheet.create({
  // main area – fills the tab content (screenArea) and centers items
  container: {
    flexGrow: 1,                // important for ScrollView to fill available space
    justifyContent: "center", // centers vertically
    alignItems: "center",
    //backgroundColor: "rgb(40,40,40)",
   // padding: 16,
  },
  header: {
    color: "#fff",
    fontSize: 24,
    marginBottom: 20,
    fontWeight: "bold",
  },
  text: {
    color: "#ccc",
    fontSize: 18,
    marginBottom: 8,
    textAlign: "center",
  },
  value: {
    color: "#b2b2f4ff",
    fontWeight: "bold",
  },
  error: {
    color: "tomato",
    marginBottom: 12,
  },
  buttonRow: {
  flexDirection: "row",
  gap: 10,
  marginTop: 10,
},

intervalButton: {
  backgroundColor: "#444",
  color: "#fff",
  paddingVertical: 6,
  paddingHorizontal: 14,
  borderRadius: 8,
  fontSize: 16,
},

intervalActive: {
  backgroundColor: "#6a6af4",
  fontWeight: "bold",
},

});
