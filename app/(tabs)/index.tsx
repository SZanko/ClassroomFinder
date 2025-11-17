import {Image} from 'expo-image';
import {Platform, StyleSheet, TouchableOpacity, View, FlatList, Text} from 'react-native';

import {HelloWave} from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import {ThemedText} from '@/components/themed-text';
import {ThemedView} from '@/components/themed-view';
import {Link, router} from 'expo-router';
import {FontAwesome} from "@expo/vector-icons";
import {toggleButtonStyle} from '@/components/ui/toggle-tab-button';
import {NavigationMap} from '@/components/ui/map';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {SearchWidget} from '@/components/ui/search-bar';
import {coordinator, graph} from "@/services/routing";
import {
    Camera,
    CameraRef
} from "@maplibre/maplibre-react-native";
import { GeoPoint } from '@/hooks/use-current-location';
import {AnySegment, LngLat} from "@/services/routing/types";


const startRoom='127'
const startRoomCoordinates:LngLat = [-9.205344, 38.662565]
const endRoom='116'

export default function MapScreen() {
    const [route, setRoute] = useState<AnySegment[] | null>(null);

    // TODO make this dynamic
    const startingPoint: GeoPoint = {
        longitude: -9.206151,
        latitude: 38.661847,
    };

  const handleCompoundSearch = async (building: string | null, room: string | null) => {
      console.log("Starting navigation to:", building, room);

      if(!building || !room) return;

      try {
          // This part depends on how your RouterCoordinator is defined.
          // Typical pattern: coordinator.route(from, to) => AnySegment[]
          // Assume LngLat is [number, number]:
          const from: [number, number] = [startingPoint.longitude, startingPoint.latitude];

          // However you encode your indoor target (this is just an example)
          const toId = `${building}-${room}`;

          const segments: AnySegment[] = await coordinator.routeGpsToRoom(from, toId);
          setRoute(segments);
      } catch (e) {
          console.warn('Failed to compute route', e);
          setRoute(null);
      }

  };


    //useEffect(() => {
    //    //const segments = coordinator.routeRoomToRoom(startRoom, endRoom);
    //    //const segments = coordinator.routeGpsToRoom(startRoomCoordinates, endRoom);
    //    setRoute(segments);
    //}, []);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const segments = await coordinator.outdoor.routeOutdoorToOutdoor(
                    "Building VIII",
                    "Building II",
                );
                if (!cancelled) setRoute(segments);
            } catch (e) {
                console.error(e);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [startRoomCoordinates, endRoom]);

    return (
        <View style={styles.container}>

          <NavigationMap route={route}/>
          <View style={styles.searchContainer}>
            <SearchWidget onSearch={handleCompoundSearch} />
          </View>


            <TouchableOpacity
                style={toggleButtonStyle.toggleButton}
                onPress={() => router.push('/schedule')}
                accessibilityLabel="Go to schedule"
            >
                <FontAwesome name="calendar" size={22} color="#fff"/>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1},
    map: {flex: 1},
    // … weitere Styles …
    searchContainer: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        left: 20,
        right: 20,
        zIndex: 10,
    },
});