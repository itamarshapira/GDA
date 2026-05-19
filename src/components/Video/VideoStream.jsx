/*
  VideoStream.jsx
  App opens VideoStream
→ WebView loads http://fgcam:admin@10.42.0.1/live_mjpeg.html
→ WebView gets/authenticates access
→ onLoadEnd switches to http://10.42.0.1/live_mjpeg.html
→ page fetches live2.mjpeg
→ video appears
*/

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
import DigestFetch from "react-native-digest-fetch";

// First URL: used only to "warm up" authentication.
// Warning: username/password in URL can appear in logs, so this is for testing/workaround.
const AUTH_WARMUP_URL = "http://fgcam:admin@10.42.0.1/live_mjpeg.html";

// Second URL: the real page we want to show after auth is accepted.
const VIDEO_URL = "http://10.42.0.1/live_mjpeg.html";

const VideoStream = () => {
  const [currentUrl, setCurrentUrl] = useState(AUTH_WARMUP_URL); // WebView first loads the auth warm-up URL.
  const [videoKey, setVideoKey] = useState(0); // Key to force WebView reload when URL changes.

  const refreshVideo = () => {
    // This function can be called to refresh the video stream, re-triggering the auth warm-up process.
    console.log("[VideoStream] Refreshing video with auth warm-up");
    setCurrentUrl(AUTH_WARMUP_URL);
    setVideoKey((prev) => prev + 1);
  };

  const [videoError, setVideoError] = useState(false); // State to track video errors

  useEffect(() => {
    console.log("🧩 [VideoStream] mounted");

    // Auto-refresh one time after the component opens.
    // Why: this imitates the user pressing the refresh button once.
    const autoRefreshTimer = setTimeout(() => {
      console.log("[VideoStream] Auto refresh once after mount");

      // Start again from the auth warm-up URL.
      setCurrentUrl(AUTH_WARMUP_URL);

      // Force WebView to fully remount.
      setVideoKey((prev) => prev + 1);
    }, 1000);

    return () => {
      clearTimeout(autoRefreshTimer);
      console.log("🧹 [VideoStream] unmounted");
    };
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
          source={{ uri: currentUrl }}
          style={styles.webview}
          originWhitelist={["*"]}
          mixedContentMode="always"
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onLoadEnd={() => {
            // This event fires when the page finishes loading (successfully or with an error).
            console.log("[WebView] Loaded:", currentUrl);

            // After the auth warm-up page loads, switch to the clean normal URL.
            if (currentUrl === AUTH_WARMUP_URL) {
              console.log(
                "[WebView] Auth warm-up finished, switching to normal URL",
              );
              setCurrentUrl(VIDEO_URL);
            }
          }}
          onHttpError={(event) => {
            console.log("[WebView] HTTP error:", event.nativeEvent.statusCode);
          }}
          onError={(event) => {
            console.log("[WebView] Error:", event.nativeEvent);
          }}
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
