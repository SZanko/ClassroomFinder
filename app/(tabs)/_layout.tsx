import {Tabs} from 'expo-router';
import React from 'react';

import {HapticTab} from '@/components/haptic-tab';
import {IconSymbol} from '@/components/ui/icon-symbol';
import {Colors} from '@/constants/theme';
import {useColorScheme} from '@/hooks/use-color-scheme';
import {FontAwesome} from "@expo/vector-icons";

export default function TabLayout() {
    const colorScheme = useColorScheme();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarStyle: { display: 'none' },
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Map',
                    tabBarIcon: ({color}) => <FontAwesome size={28} name="map" color={color}/>,
                }}
            />
            <Tabs.Screen
                name="schedule"
                options={{
                    title: 'Schedule',
                    tabBarIcon: ({color}) => <FontAwesome size={28} name="calendar" color={color}/>,
                }}
            />
        </Tabs>
    );
}
