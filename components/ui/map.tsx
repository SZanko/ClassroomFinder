import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';

export function NavigationMap() {
  const mapRef = useRef<MapView | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied.');
          setLoading(false);
          return;
        }

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Highest,
            timeInterval: 1000,
            distanceInterval: 1,
          },
          (pos: Location.LocationObject) => {
            const coords = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            };
            setLocation(coords);

            const region: Region = {
              ...coords,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            };
            if (mapRef.current) {
              mapRef.current.animateToRegion(region, 500);
            }
          }
        );

        setLoading(false);
      } catch (err: any) {
        setErrorMsg(err?.message ?? 'Failed to get location');
        setLoading(false);
      }
    })();

    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading location…</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.errorContainer}>
        <Text style={{ color: 'red' }}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      provider={PROVIDER_GOOGLE}
      showsUserLocation={true}
      followsUserLocation={true}
      showsMyLocationButton={true}
    >
      {location && <Marker coordinate={location} title="Your location" pinColor="red" />}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { padding: 20, justifyContent: 'center', alignItems: 'center' },
});
