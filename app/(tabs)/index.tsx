import { Image } from "expo-image";
import {
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  Alert,
  BackHandler,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  FontAwesome,
  FontAwesome6,
  AntDesign,
  Fontisto,
} from "@expo/vector-icons";
import { toggleButtonStyle } from "@/components/ui/toggle-tab-button";
import { NavigationMap } from "@/components/ui/map";
import React, { useCallback, useEffect, useState } from "react";
import { SearchWidget, SearchCriteria } from "@/components/ui/search-bar";
import { point as turfPoint } from "@turf/helpers";
import { coordinator, roomPolygonsFC } from "@/services/routing";
import { GeoPoint, useCurrentLocation } from "@/hooks/use-current-location";
import { AnySegment } from "@/services/routing/types";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProfileIcon } from "@/components/ui/profile_icon_button";
import { useFocusEffect } from "@react-navigation/native";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";

const floatingButtonStyle = {
  position: "absolute" as const,
  bottom: 20,
  right: 20,
  zIndex: 20,
};

const startStopButtonStyle = {
  position: "absolute" as const,
  bottom: 20,
  left: 20,
  zIndex: 20,
};

function findRoomAtLocation(lng: number, lat: number): string | null {
  const pt = turfPoint([lng, lat]);

  for (const f of roomPolygonsFC.features) {
    if (booleanPointInPolygon(pt, f as any)) {
      const ref = f.properties?.ref ?? f.properties?.name ?? null;
      if (ref) return ref;
    }
  }

  return null;
}

export default function MapScreen() {
  const [route, setRoute] = useState<AnySegment[] | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const [externalSearch, setExternalSearch] = useState<{
    building: string;
    room: string;
  } | null>(null);

  const { location: userLocation, isLoading } = useCurrentLocation();

  const startingPoint: GeoPoint = userLocation || {
    longitude: -9.206151,
    latitude: 38.661847,
  };

  const params = useLocalSearchParams<{ building: string; room: string }>();

  useEffect(() => {
    if (params.building && params.room) {
      const building = params.building;
      const room = params.room;

      setExternalSearch({ building, room });

      handleCompoundSearch({
        type: "location",
        building: building,
        room: room,
      });
    }
  }, [params.building, params.room]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // If there is a route preview, clear it instead of exiting
        if (route && route.length > 0) {
          setRoute(null);
          setExternalSearch(null);
          // optional: stop navigation if you use this
          // setIsNavigating(false);
          return true;
        }

        // No route → let Android handle back (close app / go previous screen)
        return false;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => {
        subscription.remove();
      };
    }, [route]),
  );

  const handleProfilePress = () => {
    Alert.alert("Student Name", "student@fct.unl.pt", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: () => router.replace("/login"),
      },
    ]);
  };

  const handleCompoundSearch = async (criteria: SearchCriteria) => {
    if (criteria.type === "location") {
      console.log("Searching by LOCATION:", criteria.building, criteria.room);
    } else {
      console.log("Searching by NAME:", criteria.query);
    }

    try {
      // This part depends on how your RouterCoordinator is defined.
      // Typical pattern: coordinator.route(from, to) => AnySegment[]
      // Assume LngLat is [number, number]:
      const from: [number, number] = [
        startingPoint.longitude,
        startingPoint.latitude,
      ];

      // However you encode your indoor target (this is just an example)
      let toId;

      const currentRoom = findRoomAtLocation(from[0], from[1]);
      console.log("Current room:", currentRoom);
      if (
        criteria.type === "location" &&
        criteria.building !== null &&
        criteria.room !== null
      ) {
        if (currentRoom) {
          console.info("Inside current room");

          const segments = coordinator.routeRoomToRoom(
            currentRoom, // your build script can map this to the correct building
            criteria.room,
          );

          setRoute(segments);
          return;
        }

        const segments: AnySegment[] = await coordinator.routeGpsToBuildingRoom(
          from,
          criteria.building,
          criteria.room,
        );
        setRoute(segments);
        //const segments: AnySegment[] = await coordinator.routeBuildingToRoom(
        //    'Building VIII',
        //    criteria.building,
        //    criteria.room);
        //setRoute(segments);
      } else {
        const sequements = await coordinator.routeGpsToRoom(
          from,
          criteria.type,
        );
        setRoute(sequements);
      }
    } catch (e) {
      console.warn("Failed to compute route", e);
      setRoute(null);
    }
  };

  const handleRoomLongPress = async ({
    building,
    room,
  }: {
    building: string;
    room: string;
  }) => {
    try {
      const from: [number, number] = [
        startingPoint.longitude,
        startingPoint.latitude,
      ];

      const segments: AnySegment[] = await coordinator.routeGpsToBuildingRoom(
        from,
        building,
        room,
      );
      setRoute(segments);

      // optional: update search widget
      setExternalSearch({ building, room });
    } catch (e) {
      console.warn("Failed to compute route from long-pressed room", e);
      setRoute(null);
    }
  };

  const handleToggleNavigation = () => {
    if (isNavigating) {
      setIsNavigating(false);
      setRoute(null);
    } else {
      if (route && route.length > 0) {
        setIsNavigating(true);
      }
    }
  };

  //const handleCompoundSearch = async (criteria: SearchCriteria) => {
  //  try {
  //    const from: [number, number] = [
  //      startingPoint.longitude,
  //      startingPoint.latitude,
  //    ];
  //    let toId: string = "";

  //    if (criteria.type === "location") {
  //      console.log(
  //        "Searching for Location:",
  //        criteria.building,
  //        criteria.room,
  //      );
  //      toId = criteria.room || "";
  //    } else {
  //      console.log("Searching for Name:", criteria.query);
  //      toId = criteria.query || "";
  //    }

  //    if (!toId) {
  //      Alert.alert("Error", "Invalid destination target.");
  //      return;
  //    }

  //    console.log("ID sent to graph:", toId);

  //    const segments: AnySegment[] = await coordinator.routeGpsToRoom(
  //      from,
  //      toId,
  //    );

  //    if (segments && segments.length > 0) {
  //      console.log("Route found!");
  //      setRoute(segments);
  //    } else {
  //      console.warn("Route not found (empty result).");
  //      Alert.alert(
  //        "Route not found",
  //        `Could not find a path to room '${toId}'.`,
  //      );
  //    }
  //  } catch (e) {
  //    console.warn("Error computing route:", e);
  //    Alert.alert(
  //      "Error",
  //      "Failed to compute route. Please check if the room exists in the data.",
  //    );
  //    setRoute(null);
  //  }
  //};

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <NavigationMap
          route={route}
          userLocation={userLocation}
          followUser={isNavigating}
          onRoomLongPress={handleRoomLongPress}
        />

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchWidget
            onSearch={handleCompoundSearch}
            externalSearch={externalSearch}
          />
        </View>

        {/* Profile Icon */}
        <View style={styles.profileContainer}>
          <ProfileIcon onPress={handleProfilePress} />
        </View>

        {route && route.length > 0 && (
          <TouchableOpacity
            style={[
              toggleButtonStyle.toggleButton,
              startStopButtonStyle,
              //{ bottom: 100 }, // move it up a bit so it doesn't overlap your calendar button
            ]}
            onPress={handleToggleNavigation}
          >
            {isNavigating ? (
              <AntDesign name="close" size={28} color="#fff" />
            ) : (
              <Fontisto name="navigate" size={28} color="#fff" />
            )}
          </TouchableOpacity>
        )}

        {/* Schedule Button */}
        <TouchableOpacity
          style={[toggleButtonStyle.toggleButton, floatingButtonStyle]}
          onPress={() => router.push("/schedule")}
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
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    left: 20,
    right: 80,
    zIndex: 10,
  },
  profileContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    right: 20,
    zIndex: 20,
  },
  debugContainer: {
    position: "absolute",
    bottom: 100,
    left: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 5,
    borderRadius: 5,
  },
  debugText: {
    color: "white",
    fontSize: 10,
  },
});
