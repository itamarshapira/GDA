// src/components/Tabs/Tabs.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from "react-native";
import DeviceInfo from "./DeviceInfo/DeviceInfo";
import GenericAccess from "./GenericAccess/GenericAccess";
import Environmental from "./Environmental/Environmental";


const Tabs = ({ device }) => {

  const [selectedTab, setSelectedTab] = useState("deviceInfo");

  const TabButton = (id, label) => (
    <TouchableOpacity key={id} onPress={() => setSelectedTab(id)}>
      <Text style={[
        styles.menuItem,
        selectedTab === id && styles.active
      ]}>
        {label}
      </Text>
    </TouchableOpacity> 
  );

  return (
    <View style={styles.container}>

      {/* Top Half */}
      <View style={styles.videoContainer}>
        <Text style={styles.videoText}>Video Placeholder</Text>
      </View>

      {/* Bottom Half */}
      <View style={styles.bottomContainer}>
        
        {/* TAbs Scrollable! */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabMenu}
        >
          {TabButton("deviceInfo", "Device Info")}
          {TabButton("generic", "Generic Access")}
          {TabButton("environmental", "Env Sensing")}

          {TabButton("alert", "Alert Notification")}
          {TabButton("settings", "Settings")}
          {TabButton("battery", "Battery")}
          {TabButton("logs", "Logs")}
          {TabButton("upgrade", "Firmware")}
        </ScrollView>

        {/* Tab scrren chosen */}
        <View style={styles.screenArea}>
          {selectedTab === "deviceInfo" && <DeviceInfo device={device} />}
          {selectedTab === "generic" && <GenericAccess device={device} />}
          {selectedTab === "environmental" && <Environmental device={device} />}

          {selectedTab === "alert" && (
            <Text style={styles.fakeText}>Alerts Data Coming Soon</Text>
          )}
          {selectedTab === "settings" && (
            <Text style={styles.fakeText}>Settings Coming Soon</Text>
          )}
          {selectedTab === "battery" && (
            <Text style={styles.fakeText}>Battery Coming Soon </Text>
          )}
          {selectedTab === "logs" && (
            <Text style={styles.fakeText}>Logs Coming Soon</Text>
          )}
          {selectedTab === "upgrade" && (
            <Text style={styles.fakeText}>Firmware Update Coming Soon</Text>
          )}
        </View>

      </View>
    </View>
  );
};

export default Tabs;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },

  videoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2d2d2d",
  },
  videoText: {
    fontSize: 20,
    color: "#aaa",
  },

  bottomContainer: {
    flex: 1,
    backgroundColor: "#222",
    //alignItems: "stretch",      // <- ensures children expand correctly
  },

  /* scroll menu */
  tabMenu: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    backgroundColor: "#333",
    borderBottomWidth: 1,
    borderBottomColor: "#444",
    
  },

  menuItem: {
    color: "#bbb",
    fontSize: 15,
    paddingHorizontal: 12,
  },

  active: {
    color: "#b2b2f4ff",
    fontWeight: "bold",
    textDecorationLine: "underline",
  },

  screenArea: { // area where tab content shows - could came from the component itself
    flex: 18, // 18 full?
    
   //backgroundColor: "#751414ff",
    
    
    
    // paddingHorizontal: 10,
    // paddingVertical: 6,
  },

  fakeText: {
    textAlign: "center",
    color: "white",
    marginTop: 25,
    fontSize: 18,
  },
});
