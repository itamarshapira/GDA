import React, { useEffect } from "react";
import { View, StyleSheet, Text, Dimensions } from "react-native";
import { WebView } from "react-native-webview";

const HEALTH_URL = "http://192.168.4.1/video_feed";

const VideoStream = () => {
  useEffect(() => {
    console.log("🧩 [VideoStream] mounted");
    return () => console.log("🧹 [VideoStream] unmounted");
  }, []);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <Text style={styles.title}>Live Video</Text>

      {/* VIDEO */}
      <WebView
        source={{ uri: HEALTH_URL }}
        style={styles.webview}
        originWhitelist={["*"]}
        mixedContentMode="always"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },

  title: {
    height: 30,
    width: Dimensions.get("window").width,

    color: "white",
    textAlign: "center",
    fontSize: 15,
    lineHeight: 30, // centers text vertically
    fontWeight: "600",

    backgroundColor: "#111", // subtle header look
  },

  webview: {
    flex: 1,
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
