import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ProfileIconProps {
  onPress?: () => void;
  size?: number;
  color?: string;
}

export const ProfileIcon: React.FC<ProfileIconProps> = ({
  onPress,
  size = 40,
  color = "#333",
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.container}
    >
      <Ionicons name="person-circle-outline" size={size} color={color} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    // Optional: Add padding or background if needed later
    justifyContent: "center",
    alignItems: "center",
  },
});
