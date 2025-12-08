import React, { useEffect, useState } from "react";
import { ScrollView, Text, StyleSheet } from "react-native";
import { readDeviceInformation } from "../../../services/deviceInfoService";

const DeviceInfo = ({ device }) => {
  const [info, setInfo] = useState(null); // device info state to hold info from BLE
  const [error, setError] = useState(null);

  useEffect(() => { // on component mount or device change
    const fetchInfo = async () => {
      if (!device) {
        setError("No BLE device");
        return;
      }

      console.log("[DeviceInfo]  Reading...");
      const result = await readDeviceInformation(device);
      if (result) {
        console.log("[DeviceInfo]  Success:", result);
        setInfo(result);
      } else {
        setError("Failed to read");
      }
    };

    fetchInfo();
  }, [device]);

  return (
    <ScrollView style={styles.scrollArea} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Device Information</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      {info ? (
        <>
          <Text style={styles.text}>Manufacturer: {info.manufacturer}</Text>
          <Text style={styles.text}>Model: {info.modelNumber}</Text>
          <Text style={styles.text}>System ID: {info.systemID}{"\n"}(MAC Address) </Text> 
          

          {/* Extra text just to test scrolling */}
          {/* {Array.from({ length: 40 }).map((_, i) => (
            <Text key={i} style={styles.text}>scroll down...</Text>
          ))} */}
        </>
      ) : !error ? (
        <Text style={styles.text}>Reading...</Text>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollArea: { // full height scrollable
    flex: 1,
   // backgroundColor: "rgb(40,40,40)",
  },
  content: { // inner content area
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: "center", // align center horizontally
   // justifyContent: "center", // align center vertically
  },
  header: {
    color: "#fff",
    fontSize: 22,
    marginBottom: 20,
    fontWeight: "bold",
  },
  text: {
    color: "#ccc",
    fontSize: 18,
    marginBottom: 8,
  },
  error: {
    color: "tomato",
    marginBottom: 10,
  },
});

export default DeviceInfo;
