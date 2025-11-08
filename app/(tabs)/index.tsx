import { Image } from 'expo-image';
import {Platform, StyleSheet, TouchableOpacity, View, FlatList, Text} from 'react-native';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {Link, router} from 'expo-router';
import {FontAwesome} from "@expo/vector-icons";
import { toggleButtonStyle } from '@/components/ui/toggle-tab-button';
import { NavigationMap } from '@/components/ui/map';
import React, { useState } from 'react';
import { SearchWidget } from '@/components/ui/search-bar';

export default function MapScreen() {
  const handleCompoundSearch = (building: string | null, room: string | null) => {
      console.log("Starting navigation to:", building, room);
      // Your logic here: e.g., zoom map to building, highlight room
  };


  return (
      <View style={styles.container}>

          <NavigationMap />
          <View style={styles.searchContainer}>
            <SearchWidget onSearch={handleCompoundSearch} />
          </View>


        <TouchableOpacity
            style={toggleButtonStyle.toggleButton}
            onPress={() => router.push('/schedule')}
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
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    right: 20,
    zIndex: 10,
  },
});