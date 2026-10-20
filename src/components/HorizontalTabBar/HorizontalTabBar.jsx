// Shared scroll navigation for the Detector and Source dashboards.
import React, { useCallback, useRef, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

// Native layout/scroll values can include fractions of a logical pixel.
// Ignore tiny differences at either edge so the arrows do not flicker.
const EDGE_TOLERANCE = 2;

const HorizontalTabBar = ({ children, contentContainerStyle }) => {
  const scrollViewRef = useRef(null);
  const measurementsRef = useRef({
    viewportWidth: 0,
    contentWidth: 0,
    offset: 0,
  });
  const [arrows, setArrows] = useState({ left: false, right: false });
  const arrowsRef = useRef(arrows);

  /*
   * Refs hold the latest native measurements without rendering on every swipe
   * frame. Only a change in arrow visibility updates React state. Keeping the
   * handlers independent of rendered state also avoids stale scroll offsets.
   */
  const updateArrows = useCallback((correctOffset = false) => {
    const measurements = measurementsRef.current;
    const { viewportWidth, contentWidth, offset } = measurements;
    let left = false;
    let right = false;

    // Both measurements must arrive before showing an indicator. A zero-width
    // layout (for example, while hidden) is not evidence of overflowing tabs.
    if (viewportWidth > 0 && contentWidth > 0) {
      const maxOffset = Math.max(0, contentWidth - viewportWidth);
      const boundedOffset = Math.max(0, Math.min(offset, maxOffset));
      measurements.offset = boundedOffset;

      // Resizing or shorter content may leave the old offset beyond the new end.
      // Correct that position immediately, but never interrupt a normal swipe
      // or its native overscroll animation from the onScroll handler.
      if (correctOffset && boundedOffset !== offset) {
        scrollViewRef.current?.scrollTo({ x: boundedOffset, animated: false });
      }

      if (maxOffset > EDGE_TOLERANCE) {
        left = boundedOffset > EDGE_TOLERANCE;
        right = maxOffset - boundedOffset > EDGE_TOLERANCE;
      }
    }

    if (arrowsRef.current.left !== left || arrowsRef.current.right !== right) {
      const next = { left, right };
      arrowsRef.current = next;
      setArrows(next);
    }
  }, []);

  const handleLayout = useCallback(
    (event) => {
      // Measure the ScrollView itself, excluding the two reserved arrow areas.
      measurementsRef.current.viewportWidth = event.nativeEvent.layout.width;
      updateArrows(true);
    },
    [updateArrows],
  );

  const handleContentSizeChange = useCallback(
    (width) => {
      // This includes the actual tab labels and their padding, not a tab count.
      measurementsRef.current.contentWidth = width;
      updateArrows(true);
    },
    [updateArrows],
  );

  const handleScroll = useCallback(
    (event) => {
      measurementsRef.current.offset = event.nativeEvent.contentOffset.x;
      updateArrows();
    },
    [updateArrows],
  );

  const scrollTabs = useCallback((direction) => {
    const { viewportWidth, contentWidth, offset } = measurementsRef.current;
    const maxOffset = Math.max(0, contentWidth - viewportWidth);
    if (viewportWidth <= 0 || maxOffset <= EDGE_TOLERANCE) return;

    // Move most of one visible page, leaving some overlap for orientation.
    // Clamp to the real edges and let native scroll events update the arrows;
    // do not pretend an animated scroll has already reached its destination.
    const target = Math.max(
      0,
      Math.min(maxOffset, offset + direction * viewportWidth * 0.8),
    );
    if (Math.abs(target - offset) > EDGE_TOLERANCE) {
      scrollViewRef.current?.scrollTo({ x: target, animated: true });
    }
  }, []);

  /*
   * The narrow side areas always keep their width, even when an arrow is hidden.
   * This prevents visibility changes from resizing the viewport in a feedback
   * loop. Arrows sit beside the ScrollView, never over a label or its touch area.
   * No timers or external listeners are created: ScrollView owns these handlers
   * and removes them when the dashboard unmounts.
   */
  return (
    <View style={styles.container}>
      <View style={styles.arrowArea}>
        {arrows.left && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Scroll tabs left"
            accessibilityHint="Show earlier tabs"
            activeOpacity={0.65}
            onPress={() => scrollTabs(-1)}
            style={styles.arrowButton}
          >
            <View style={styles.chevronBackground}>
              <MaterialIcons name="chevron-left" size={23} color="#8fc9ef" />
            </View>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={contentContainerStyle}
        onLayout={handleLayout}
        onContentSizeChange={handleContentSizeChange}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {children}
      </ScrollView>

      <View style={styles.arrowArea}>
        {arrows.right && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Scroll tabs right"
            accessibilityHint="Show more tabs"
            activeOpacity={0.65}
            onPress={() => scrollTabs(1)}
            style={styles.arrowButton}
          >
            <View style={styles.chevronBackground}>
              <MaterialIcons name="chevron-right" size={23} color="#8fc9ef" />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default HorizontalTabBar;

const styles = StyleSheet.create({
  container: {
    height: 50, // Preserve the existing compact tab-menu height.
    flexShrink: 0,
    flexDirection: "row",
    // App.js already disables RTL. Keep the English tabs and physical arrows LTR.
    direction: "ltr",
    backgroundColor: "#07111f13",
  },
  scrollView: {
    flex: 1,
  },
  arrowArea: {
    width: 18,
    borderTopWidth: 1,
    borderTopColor: "rgba(225, 66, 185, 0.1)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(66, 153, 225, 0.22)",
  },
  arrowButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chevronBackground: {
    width: 24,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(66, 153, 225, 0.08)",
  },
});
