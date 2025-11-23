import { Image } from "expo-image";
import {
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  FlatList,
  Text,
} from "react-native";

import { HelloWave } from "@/components/hello-wave";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Link, router } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
// Removed toggleButtonStyle import since we'll mirror schedule2 styles inline
// import { toggleButtonStyle } from "@/components/ui/toggle-tab-button";
// import { NavigationMap } from '@/components/ui/map';
import React, { useState } from "react";
import { SearchWidget, SearchCriteria } from "@/components/ui/search-bar";

export default function MapScreen() {
  const handleCompoundSearch = (criteria: SearchCriteria) => {
    if (criteria.type === "location") {
      console.log("Searching by LOCATION:", criteria.building, criteria.room);
    } else {
      console.log("Searching by NAME:", criteria.query);
    }
  };

  return (
    <View style={styles.container}>
      {/* <NavigationMap /> */}
      <View style={styles.searchContainer}>
        {/* This component call remains the same */}
        <SearchWidget onSearch={handleCompoundSearch} />
      </View>

      {/* Navigation button (mirrors schedule2 position and size) */}
      <TouchableOpacity
        style={{
          position: "absolute",
          right: 20,
          bottom: 130,
          width: 60,
          height: 60,
          borderRadius: 24,
          backgroundColor: "#007AFF",
          borderWidth: 1,
          borderColor: "#007AFF",
          alignItems: "center",
          justifyContent: "center",
        }}
        onPress={() => router.push("/schedule2")}
        accessibilityLabel="Go to schedule"
      >
        <FontAwesome name="calendar" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  // … weitere Styles …
  searchContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    left: 20,
    right: 20,
    zIndex: 10,
  },
});
