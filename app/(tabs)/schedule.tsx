import { Image } from 'expo-image';
import {Platform, StyleSheet, TouchableOpacity, View} from 'react-native';

import { Collapsible } from '@/components/ui/collapsible';
import { ExternalLink } from '@/components/external-link';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';
import {toggleButtonStyle} from "@/components/ui/toggle-tab-button";
import {router} from "expo-router";
import {FontAwesome} from "@expo/vector-icons";

export default function Schedule() {
  return (
      <View style={styles.container}>


          <TouchableOpacity
              style={toggleButtonStyle.toggleButton}
              onPress={() => router.push('/')}
              accessibilityLabel="Go to Map"
          >
              <FontAwesome name="map" size={22} color="#fff" />
          </TouchableOpacity>
      </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
