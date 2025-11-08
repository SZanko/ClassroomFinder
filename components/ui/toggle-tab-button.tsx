import {StyleSheet, TouchableOpacity} from "react-native";
import {router} from "expo-router";
import {FontAwesome} from "@expo/vector-icons";

export function ToggleTabButton() {
}

export const toggleButtonStyle = StyleSheet.create({
    toggleButton: {
        position: 'absolute',
        bottom: 80,
        right: 80,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
})