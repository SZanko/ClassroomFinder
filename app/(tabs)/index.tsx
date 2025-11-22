import { Image } from 'expo-image';
import { Platform, StyleSheet, TouchableOpacity, View, Text, Alert } from 'react-native';
import { router } from 'expo-router';
import { FontAwesome } from "@expo/vector-icons";
import { toggleButtonStyle } from '@/components/ui/toggle-tab-button';
import { NavigationMap } from '@/components/ui/map';
import React, { useEffect, useState } from 'react';
import { SearchWidget, SearchCriteria } from '@/components/ui/search-bar';
import { coordinator } from "@/services/routing";
import { GeoPoint, useCurrentLocation } from '@/hooks/use-current-location';
import { AnySegment } from "@/services/routing/types";
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfileIcon } from '@/components/ui/profile_icon_button';

const floatingButtonStyle = {
  position: 'absolute' as const,
  bottom: 20,
  right: 20,
  zIndex: 20,
};

export default function MapScreen() {
  const [route, setRoute] = useState<AnySegment[] | null>(null);

  // 1. Get current GPS location
  const { location: userLocation, isLoading } = useCurrentLocation();

  // 2. Starting point (GPS or School Fallback)
  const startingPoint: GeoPoint = userLocation || {
    longitude: -9.206151,
    latitude: 38.661847,
  };

  const handleProfilePress = () => {
    Alert.alert(
      "Student Name",
      "student@fct.unl.pt",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Log Out", style: "destructive", onPress: () => router.replace('/login') }
      ]
    );
  };

  const handleCompoundSearch = async (criteria: SearchCriteria) => {
    // FIX: We moved the console.log inside the if/else blocks.
    // TypeScript forbids accessing 'building' before checking criteria.type.

    try {
      // Convert GeoPoint to [lng, lat] array for the router
      const from: [number, number] = [startingPoint.longitude, startingPoint.latitude];
      let toId: string = ""; 
      
      if (criteria.type === 'location') {
        console.log("Searching for Location:", criteria.building, criteria.room);
        // Using only the room number as the ID based on your data structure
        // Added fallback to empty string to satisfy TypeScript
        toId = criteria.room || ""; 
      } else {
        console.log("Searching for Name:", criteria.query);
        toId = criteria.query || "";
      }

      // Validation: If ID is empty, do not proceed
      if (!toId) {
        Alert.alert("Error", "Invalid destination target.");
        return;
      }

      console.log("ID sent to graph:", toId);

      const segments: AnySegment[] = await coordinator.routeGpsToRoom(from, toId);
      
      if (segments && segments.length > 0) {
          console.log("Route found!");
          setRoute(segments);
      } else {
          console.warn("Route not found (empty result).");
          Alert.alert("Route not found", `Could not find a path to room '${toId}'.`);
      }

    } catch (e) {
      console.warn('Error computing route:', e);
      Alert.alert("Error", "Failed to compute route. Please check if the room exists in the data.");
      setRoute(null);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <NavigationMap route={route} />
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchWidget onSearch={handleCompoundSearch} />
        </View>

        {/* Profile Icon */}
        <View style={styles.profileContainer}>
            <ProfileIcon onPress={handleProfilePress} />
        </View>

        {/* Schedule Button */}
        <TouchableOpacity
          style={[toggleButtonStyle.toggleButton, floatingButtonStyle]}
          onPress={() => router.push('/schedule')}
        >
          <FontAwesome name="calendar" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  searchContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    right: 80, 
    zIndex: 10,
  },
  profileContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    zIndex: 20,
  },
  debugContainer: {
      position: 'absolute',
      bottom: 100,
      left: 20,
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: 5,
      borderRadius: 5,
  },
  debugText: {
      color: 'white',
      fontSize: 10,
  }
});