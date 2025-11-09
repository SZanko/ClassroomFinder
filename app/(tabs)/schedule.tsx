import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from "expo-router";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { toggleButtonStyle } from "@/components/ui/toggle-tab-button";
import { ProfileIcon } from '@/components/ui/profile_icon_button';

// --- Constants ---
// Simplified time format for cleaner display in bigger cells
const HOURS = [
  '8-9', '9-10', '10-11', '11-12', '12-13', '13-14', '14-15', '15-16',
  '16-17', '17-18', '18-19', '19-20', '20-21', '21-22', '22-23', '23-00'
];
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export default function Schedule() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuOption = (option: string) => {
    setIsMenuOpen(false);
    Alert.alert("Selected", option);
  };

  const handleProfilePress = () => {
      console.log("Profile icon pressed");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Schedule</Text>
          <ProfileIcon onPress={handleProfilePress}/>
        </View>

        {/* --- Grid Container --- */}
        <View style={styles.gridContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Added Horizontal ScrollView for wider cells */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.grid}>
                {/* Header Row */}
                <View style={styles.row}>
                  <View style={[styles.cell, styles.timeCell, styles.headerCell]} />
                  {DAYS.map((day) => (
                    <View key={day} style={[styles.cell, styles.headerCell]}>
                      <Text style={styles.headerText}>{day}</Text>
                    </View>
                  ))}
                </View>

                {/* Time Rows */}
                {HOURS.map((hour) => (
                  <View key={hour} style={styles.row}>
                    <View style={[styles.cell, styles.timeCell]}>
                      <Text style={styles.timeText}>{hour}</Text>
                    </View>
                    {DAYS.map((day) => (
                      <View key={`${day}-${hour}`} style={styles.cell}>
                        {/* Class info goes here */}
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          </ScrollView>
        </View>

        {/* --- "Change Schedule" Dropdown Section --- */}
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={styles.dropdownTrigger} 
            onPress={() => setIsMenuOpen(!isMenuOpen)}
            activeOpacity={0.8}
          >
            <Ionicons name={isMenuOpen ? "remove-circle-outline" : "add-circle-outline"} size={24} color="#333" />
            <Text style={styles.dropdownText}>Change Schedule</Text>
          </TouchableOpacity>

          {isMenuOpen && (
            <View style={styles.dropdownMenu}>
              <TouchableOpacity style={styles.menuOption} onPress={() => handleMenuOption('Upload Schedule')}>
                <Text style={styles.menuText}>Upload Schedule</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.menuOption} onPress={() => handleMenuOption('Add Manually')}>
                <Text style={styles.menuText}>Add Manually</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.menuOption} onPress={() => handleMenuOption('Add Test/Exam')}>
                <Text style={styles.menuText}>Add Test/Exam</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity
            style={toggleButtonStyle.toggleButton}
            onPress={() => router.push('/')}
            accessibilityLabel="Go to Map"
        >
            <FontAwesome name="map" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  gridContainer: {
    flex: 1,
    marginBottom: 20,
  },
  grid: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#333',
  },
  row: {
    flexDirection: 'row',
    minHeight: 40, // UPDATED: Much taller rows
  },
  cell: {
    // flex: 1,  <-- Removed flex:1 so it respects minWidth
    minWidth: 55, // UPDATED: Wider cells (forces horizontal scroll)
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  timeCell: {
    minWidth: 60, // Fixed width for time column
    backgroundColor: '#f9f9f9',
  },
  headerCell: {
    backgroundColor: '#f0f0f0',
    height: 40,
    minHeight: 40, // Keep header slightly shorter than data rows
  },
  headerText: {
    fontWeight: '600',
    fontSize: 14,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  actionContainer: {
    zIndex: 10,
    marginBottom: 70, // Give a little more space above the map button
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
  },
  dropdownText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  dropdownMenu: {
    position: 'absolute',
    // top: 50,
    bottom: '110%', //opens upwards
    left: 0,
    width: 200,
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  menuOption: {
    padding: 15,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
  }
});