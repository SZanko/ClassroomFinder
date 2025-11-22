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