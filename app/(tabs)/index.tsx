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
    try {
      // 1. Prepare Origin
      const from: [number, number] = [startingPoint.longitude, startingPoint.latitude];
      let segments: AnySegment[] = [];

      // 2. Handle Search Logic
      if (criteria.type === 'location') {
        console.log("Searching by LOCATION:", criteria.building, criteria.room);

        if (!criteria.building || !criteria.room) {
           Alert.alert("Missing Info", "Please select both building and room.");
           return;
        }

        // Assuming your coordinator has a specific method for this:
        // If not, construct an ID string here.
        segments = await coordinator.routeGpsToBuildingRoom(
           from, 
           criteria.building, 
           criteria.room
        );

      } else {
        // Search by Name
        console.log("Searching by NAME:", criteria.query);
        
        const query = criteria.query || "";
        if (!query) return;

        segments = await coordinator.routeGpsToRoom(from, query);
      }

      // 3. Update State
      if (segments && segments.length > 0) {
        console.log("Route found!");
        setRoute(segments);
      } else {
        console.warn("Route not found (empty result).");
        Alert.alert("Route not found", "Could not find a path to the destination.");
        setRoute(null);
      }

    } catch (e) {
      console.warn('Error computing route:', e);
      Alert.alert("Error", "Failed to compute route. Please check if the destination exists.");
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