import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";

const HEALTH_URL = "http://192.168.4.1/video_feed";

const VideoStream = () => {
  const [videoKey, setVideoKey] = useState(0); // Key to force remount WebView

  const refreshVideo = () => {
    console.log("[VideoStream] 🔄 Refreshing video");
    setVideoKey((prev) => prev + 1);
  };

  const [videoError, setVideoError] = useState(false); // State to track video errors

  useEffect(() => {
    console.log("🧩 [VideoStream] mounted");
    return () => console.log("🧹 [VideoStream] unmounted");
  }, []);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        {/* <Text style={styles.title}>Live Video</Text> */}

        {/* <TouchableOpacity onPress={refreshVideo} activeOpacity={0.2}>
          <MaterialCommunityIcons name="refresh" size={25} color="#c2c2c2ff" />
        </TouchableOpacity> */}
      </View>

      {/* VIDEO */}
      <View style={styles.videoWrapper}>
        <WebView
          key={videoKey}
          source={{ uri: HEALTH_URL }}
          style={styles.webview}
          originWhitelist={["*"]}
          mixedContentMode="always"
        />

        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={refreshVideo}
          activeOpacity={0.5}
        >
          <MaterialCommunityIcons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    width: "100%",

    // rounded corners only bottom
    // borderBottomLeftRadius: 10,
    // borderBottomRightRadius: 10,
    // overflow: "hidden",
  },
  headerRow: {
    //flexDirection: "row",
    alignItems: "center",
    //justifyContent: "space-between",
    // width: "100%", // 👈 THIS is the right place
    //paddingHorizontal: 140, // keeps it visually balanced --? related to full width of title Dimensions.get("window").width
    // paddingBlockEnd: 4,
    // paddingHorizontal: 40,
  },

  title: {
    height: 30,
    // width: Dimensions.get("window").width, // full width -> it work well but effect all so i comment out and in header row do 100% with but it doesnt take it all so in addition i did paddingHorizontal to keep it centerand in full width

    color: "#b2b2f47c",
    textAlign: "center",
    fontSize: 15,
    lineHeight: 30, // centers text vertically
    fontWeight: "600",

    backgroundColor: "#000000ff", // subtle header look
  },

  webview: {
    flex: 1,
  },
  videoWrapper: {
    flex: 1,
  },

  refreshBtn: {
    position: "absolute",
    top: 55,
    right: 10,

    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 8,
  },
});

export default VideoStream;

// import { View, StyleSheet, Text, Dimensions } from "react-native";
// import { WebView } from "react-native-webview";

// const HEALTH_URL = "http://192.168.4.1/video_feed";

// const VideoStream = () => {
//   useEffect(() => {
//     console.log("🧩 [VideoStream] Component mounted");
//     console.log("🌐 [VideoStream] Target URL:", HEALTH_URL);

//     return () => {
//       console.log("🧹 [VideoStream] Component unmounted");
//     };
//   }, []);

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Live Video</Text>

//       <WebView
//         source={{ uri: HEALTH_URL }}
//         style={styles.webview}
//         originWhitelist={["*"]}
//         mixedContentMode="always"
//         /* ---------- LOAD LIFECYCLE ---------- */
//         onLoadStart={() => {
//           console.log("⏳ [WebView] onLoadStart");
//         }}
//         onLoad={() => {
//           console.log("✅ [WebView] onLoad (content loaded)");
//         }}
//         onLoadEnd={() => {
//           console.log("🏁 [WebView] onLoadEnd");
//         }}
//         /* ---------- ERROR HANDLING ---------- */
//         onError={(event) => {
//           console.log("❌ [WebView] onError");
//           console.log("   message:", event.nativeEvent.description);
//           console.log("   code:", event.nativeEvent.code);
//         }}
//         onHttpError={(event) => {
//           console.log("🚨 [WebView] onHttpError");
//           console.log("   statusCode:", event.nativeEvent.statusCode);
//           console.log("   description:", event.nativeEvent.description);
//         }}
//         /* ---------- NAVIGATION ---------- */
//         onNavigationStateChange={(navState) => {
//           console.log("🧭 [WebView] Navigation change:");
//           console.log("   url:", navState.url);
//           console.log("   loading:", navState.loading);
//           console.log("   canGoBack:", navState.canGoBack);
//         }}
//       />

//       <Text style={styles.debugText}>
//         🔍 Logs enabled – check Metro console
//       </Text>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1 },

//   title: {
//     color: "white",
//     textAlign: "center",
//     padding: 2,
//     fontSize: 17,
//     width: Dimensions.get("window").width,
//     height: 40,
//   },
//   webview: { flex: 1 },
//   debugText: {
//     position: "absolute",
//     bottom: 6,
//     alignSelf: "center",
//     color: "#888",
//     fontSize: 16,
//   },
// });

// export default VideoStream;
