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
import { LinearGradient } from "expo-linear-gradient";

// First URL: used only to "warm up" authentication.
// Warning: username/password in URL can appear in logs, so this is for testing/workaround.
const AUTH_WARMUP_URL = "http://fgcam:admin@10.42.0.1/live.html";

// Second URL: the real page we want to show after auth is accepted.
const VIDEO_URL = "http://10.42.0.1/live.html";

const VideoStream = ({ refreshKey }) => {
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

  useEffect(() => {
    // This runs when Tabs.jsx changes refreshKey.
    // Why: after resolution changes on the RPI, the current video page/stream
    // may still show the old stream until we reconnect.
    // How: we reuse the same auth warm-up flow as the refresh button.
    if (refreshKey === undefined) return;

    console.log("[VideoStream] refreshKey changed → reload video:", refreshKey);

    setCurrentUrl(AUTH_WARMUP_URL);
    setVideoKey((prev) => prev + 1);
  }, [refreshKey]);

  return (
    <View style={styles.container}>
      {/* Camera card
        Why:
        - Groups the LIVE badge, refresh button, and video into one clean panel.
        - This makes the video look like part of a dashboard instead of a raw WebView.
    */}
      <LinearGradient
        colors={[
          "rgba(47, 128, 237, 0.22)", // top/left: soft FGD blue glow
          "rgba(13, 27, 47, 1)", // middle: main dark navy card
          "rgba(7, 17, 31, 1)", // bottom/right: darker edge
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cameraCard}
      >
        {/* Top row above the video */}
        <View style={styles.cameraHeader}>
          {/* LIVE badge
            Why:
            - Gives the user immediate confidence that this is the live camera area.
            - Green dot is only visual for now; it does not check stream health yet.
        */}
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>

          {/* Refresh button
            Why:
            - Keeps the existing refreshVideo logic.
            - Moves the button into the card header instead of floating over the video.
        */}
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={refreshVideo}
            activeOpacity={0.5}
          >
            <MaterialCommunityIcons name="refresh" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Video window */}
        <View style={styles.videoFrame}>
          <WebView
            key={videoKey}
            source={{ uri: currentUrl }}
            style={styles.webview}
            originWhitelist={["*"]}
            mixedContentMode="always"
            javaScriptEnabled={true}
            domStorageEnabled={true}
            onLoadEnd={() => {
              console.log("[WebView] Loaded:", currentUrl);

              if (currentUrl === AUTH_WARMUP_URL) {
                console.log(
                  "[WebView] Auth warm-up finished, switching to normal URL",
                );
                setCurrentUrl(VIDEO_URL);
              }
            }}
            onHttpError={(event) => {
              console.log(
                "[WebView] HTTP error:",
                event.nativeEvent.statusCode,
              );
            }}
            onError={(event) => {
              console.log("[WebView] Error:", event.nativeEvent);
            }}
          />
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#07111f",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },

  // Outer video panel.
  // Why:
  // - Creates the professional card shape from the screenshot.
  // - overflow hidden keeps inner content inside rounded corners.
  cameraCard: {
    flex: 1,
    backgroundColor: "#0d1b2f",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(66, 153, 225, 0.28)",
    padding: 10,
    overflow: "hidden",
  },

  // Header row inside the camera card.
  // Why:
  // - Places LIVE on the left and refresh on the right.
  cameraHeader: {
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  // Small LIVE label.
  // Why:
  // - Gives the camera a real monitoring/dashboard feeling.
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
  },

  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#00d46a",
    marginRight: 8,
  },

  liveText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },

  // Rounded video area.
  // Why:
  // - The WebView itself does not always clip nicely,
  //   so we wrap it and apply overflow hidden here.
  videoFrame: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#000000",
  },

  webview: {
    flex: 1,
    backgroundColor: "#000000",
  },

  // Refresh button in the card header.
  // Why:
  // - Cleaner than floating above the video.
  refreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
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
