import { Image } from 'expo-image';
import {Platform, StyleSheet, TouchableOpacity, View} from 'react-native';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {Link, router} from 'expo-router';
import {MapView} from "@maplibre/maplibre-react-native";
import {FontAwesome} from "@expo/vector-icons";
import { toggleButtonStyle } from '@/components/ui/toggle-tab-button';

export default function MapScreen() {
  return (
      <View style={styles.container}>


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
});