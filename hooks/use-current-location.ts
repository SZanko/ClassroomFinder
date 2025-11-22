// // hooks/useCurrentLocation.ts
// //import * as Location from 'expo-location';
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

// export type GeoPoint = { longitude: number; latitude: number };
export type GeoPoint = {
  latitude: number;
  longitude: number;
};

// //export function useCurrentLocation() {
// //    const getCurrentLocation = async (): Promise<GeoPoint | null> => {
// //        const {status} = await Location.requestForegroundPermissionsAsync();
// //        if (status !== 'granted') return null;
// //
// //        try {
// //            const pos = await Location.getCurrentPositionAsync({
// //                    accuracy: Location.Accuracy.High,
// //                    timeInterval: 6000
// //                }
// //            );
// //            return {latitude: pos.coords.latitude, longitude: pos.coords.longitude};
// //        } catch {
// //            const last = await Location.getLastKnownPositionAsync();
// //            return last ? {latitude: last.coords.latitude, longitude: last.coords.longitude} : null;
// //        }
// //    };
// //    return {getCurrentLocation};
// //}


import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

export type GeoPoint = {
  latitude: number;
  longitude: number;
};

export const useCurrentLocation = () => {
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      
      // 1. Vyžiadanie povolenia
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        Alert.alert("Chyba", "Na navigáciu potrebujeme prístup k vašej polohe.");
        setIsLoading(false);
        return;
      }

      // 2. Získanie aktuálnej polohy
      try {
        let locationResult = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High, // Chceme čo najvyššiu presnosť
        });
        
        setLocation({
            latitude: locationResult.coords.latitude,
            longitude: locationResult.coords.longitude
        });
      } catch (error) {
         setErrorMsg('Could not fetch location');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return { location, errorMsg, isLoading };
};
export const useCurrentLocation = () => {
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        Alert.alert("Chyba", "Na navigáciu potrebujeme prístup k vašej polohe.");
        setIsLoading(false);
        return;
      }

      try {
        let locationResult = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });
        
        setLocation({
            latitude: locationResult.coords.latitude,
            longitude: locationResult.coords.longitude
        });
      } catch (error) {
         setErrorMsg('Could not fetch location');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return { location, errorMsg, isLoading };
};