// hooks/useCurrentLocation.ts
//import * as Location from 'expo-location';

export type GeoPoint = { longitude: number; latitude: number };

//export function useCurrentLocation() {
//    const getCurrentLocation = async (): Promise<GeoPoint | null> => {
//        const {status} = await Location.requestForegroundPermissionsAsync();
//        if (status !== 'granted') return null;
//
//        try {
//            const pos = await Location.getCurrentPositionAsync({
//                    accuracy: Location.Accuracy.High,
//                    timeInterval: 6000
//                }
//            );
//            return {latitude: pos.coords.latitude, longitude: pos.coords.longitude};
//        } catch {
//            const last = await Location.getLastKnownPositionAsync();
//            return last ? {latitude: last.coords.latitude, longitude: last.coords.longitude} : null;
//        }
//    };
//    return {getCurrentLocation};
//}
