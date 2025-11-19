import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { toggleButtonStyle } from "@/components/ui/toggle-tab-button";
import { ProfileIcon } from "@/components/ui/profile_icon_button";
import { UploadScheduleModal } from "@/components/modals/uploadScheduleModal";
import { ScheduleEntry, HOURS_MAP, DAYS } from "@/assets/data/sample-schedule";
import { AddManualScheduleModal } from "@/components/modals/add-manually-modal";
import { ScheduleEntryModal } from "@/components/modals/schedule-entry-modal";
import { EditScheduleModal } from "@/components/modals/edit-schedule-modal";

const { width } = Dimensions.get("window");

const CELL_MIN_WIDTH = (width - 40 - 60) / DAYS.length;
const CELL_HEIGHT = 40;
const TIME_COLUMN_WIDTH = 60;

export default function Schedule() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [isAddManualModalVisible, setIsAddManualModalVisible] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState<ScheduleEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(
    null
  );
  const [isEntryModalVisible, setIsEntryModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const handleEntryPress = (entry: ScheduleEntry) => {
    setSelectedEntry(entry);
    setIsEntryModalVisible(true);
  };

  const handleCloseEntryModal = () => {
    setIsEntryModalVisible(false);
  };

  const handleCloseEditModal = () => {
    setIsEditModalVisible(false);
    setSelectedEntry(null);
  };

  const handleDelete = () => {
    if (!selectedEntry) return;
    setCurrentSchedule((prev) =>
      prev.filter((item) => item.id !== selectedEntry.id)
    );
    Alert.alert("Deleted", "Class removed from schedule.");
    handleCloseEntryModal();
  };

  const handleEditConfirm = (updatedEntry: ScheduleEntry) => {
    setCurrentSchedule((prev) =>
      prev.map((e) => (e.id === updatedEntry.id ? updatedEntry : e))
    );
    Alert.alert("Success", "Class updated.");
  };

  const handleEdit = () => {
    if (!selectedEntry) return;
    setIsEditModalVisible(true);
    setIsEntryModalVisible(false);
  };

  const handleNavigate = () => {
    if (!selectedEntry) return;
    // This will navigate to the Map screen and pass the building/room as params.
    // You will need to update MapScreen to receive these params.
    router.push({
      pathname: "/",
      params: { building: selectedEntry.building, room: selectedEntry.room },
    });
    handleCloseEntryModal();
  };

  const handleMenuOption = (option: string) => {
    setIsMenuOpen(false);
    if (option === "Upload Schedule") {
      setIsUploadModalVisible(true);
    } else if (option === "Add Manually") {
      setIsAddManualModalVisible(true);
    } else {
      Alert.alert("Selected", option);
    }
  };

  const handleProfilePress = () => {
    console.log("Profile icon pressed");
    // router.push('/profile');
  };

  const handleUploadConfirm = (schedule: ScheduleEntry[]) => {
    setCurrentSchedule(schedule);
    setIsUploadModalVisible(false);
    Alert.alert("Success", "Schedule uploaded!");
  };

  const handleAddManualConfirm = (newEntry: ScheduleEntry) => {
    // Add new entry to the existing array
    setCurrentSchedule((prev) => [...prev, newEntry]);
    Alert.alert("Success", "Class added to schedule.");
  };

  // Function to render content inside a grid cell
  const renderCellContent = (day: string, hourIndex: number) => {
    const entry = currentSchedule.find(
      (e) => e.day === day && e.hourIndex === hourIndex
    );
    if (!entry) return null;

    const itemHeight = CELL_HEIGHT * entry.duration;

    return (
      <TouchableOpacity
        style={[styles.scheduleEntry, { height: itemHeight - 2 }]}
        onPress={() => handleEntryPress(entry)}
        activeOpacity={0.8}
      >
        <Text style={styles.scheduleEntrySubject}>
          {entry.subject}
          {entry.type}
        </Text>
        <Text style={styles.scheduleEntryType}>
          ({entry.type.toUpperCase()})
        </Text>
        <Text style={styles.scheduleEntryLocation}>
          {entry.building}/{entry.room}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* --- Header --- */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Schedule</Text>
          <ProfileIcon onPress={handleProfilePress} />
        </View>

        {/* --- The Grid --- */}
        <View style={styles.gridContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.grid}>
                {/* Header Row (Days) */}
                <View style={styles.row}>
                  <View
                    style={[styles.cell, styles.timeCell, styles.headerCell]}
                  />
                  {DAYS.map((day) => (
                    <View key={day} style={[styles.cell, styles.headerCell]}>
                      <Text style={styles.headerText}>{day}</Text>
                    </View>
                  ))}
                </View>

                {/* Time Rows */}
                {Object.keys(HOURS_MAP).map((hourString) => {
                  const hourIndex = HOURS_MAP[hourString];
                  return (
                    <View key={hourString} style={styles.row}>
                      <View style={[styles.cell, styles.timeCell]}>
                        <Text style={styles.timeText}>{hourString}</Text>
                      </View>
                      {DAYS.map((day) => (
                        <View key={`${day}-${hourString}`} style={styles.cell}>
                          {renderCellContent(day, hourIndex)}
                        </View>
                      ))}
                    </View>
                  );
                })}
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
            <Ionicons
              name={isMenuOpen ? "remove-circle-outline" : "add-circle-outline"}
              size={24}
              color="#333"
            />
            <Text style={styles.dropdownText}>Change Schedule</Text>
          </TouchableOpacity>

          {isMenuOpen && (
            <View style={styles.dropdownMenu}>
              <TouchableOpacity
                style={styles.menuOption}
                onPress={() => handleMenuOption("Upload Schedule")}
              >
                <Text style={styles.menuText}>Upload Schedule</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.menuOption}
                onPress={() => handleMenuOption("Add Manually")}
              >
                <Text style={styles.menuText}>Add Manually</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.menuOption}
                onPress={() => handleMenuOption("Add Test/Exam")}
              >
                <Text style={styles.menuText}>Add Test/Exam</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* --- Navigation Button (Back to Map) --- */}
        <TouchableOpacity
          style={toggleButtonStyle.toggleButton}
          onPress={() => router.back()}
          accessibilityLabel="Go to Map"
        >
          <FontAwesome name="map" size={22} color="#fff" />
        </TouchableOpacity>

        {/* --- Upload Schedule Modal --- */}
        <UploadScheduleModal
          visible={isUploadModalVisible}
          onClose={() => setIsUploadModalVisible(false)}
          onUpload={handleUploadConfirm}
        />

        <AddManualScheduleModal
          visible={isAddManualModalVisible}
          onClose={() => setIsAddManualModalVisible(false)}
          onAdd={handleAddManualConfirm}
          currentSchedule={currentSchedule}
        />

        {selectedEntry && (
          <EditScheduleModal
            visible={isEditModalVisible}
            onClose={handleCloseEditModal}
            onSubmit={handleEditConfirm}
            currentSchedule={currentSchedule}
            entryToEdit={selectedEntry}
          />
        )}

        <ScheduleEntryModal
          visible={isEntryModalVisible}
          entry={selectedEntry}
          onClose={handleCloseEntryModal}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onNavigate={handleNavigate}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: Platform.OS === "android" ? 40 : 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  gridContainer: {
    flex: 1,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 5,
    overflow: "hidden", // Ensures inner borders don't spill
  },
  grid: {},
  row: {
    flexDirection: "row",
    height: CELL_HEIGHT,
  },
  cell: {
    width: CELL_MIN_WIDTH,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    padding: 2,
    position: "relative",
    zIndex: 1,
  },
  timeCell: {
    width: TIME_COLUMN_WIDTH,
    backgroundColor: "#f9f9f9",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingLeft: 5,
  },
  headerCell: {
    backgroundColor: "#f0f0f0",
    height: 40,
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    fontWeight: "600",
    fontSize: 14,
  },
  timeText: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
  },

  scheduleEntry: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ADD8E6",
    borderRadius: 4,
    padding: 3,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    //opacity: 0.9,
  },
  scheduleEntrySubject: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  scheduleEntryType: {
    fontSize: 9,
    fontWeight: "600",
    color: "#555",
    textAlign: "center",
    marginBottom: 2,
  },
  scheduleEntryLocation: {
    fontSize: 8,
    color: "#555",
    textAlign: "center",
  },

  actionContainer: {
    zIndex: 10,
    marginBottom: 70,
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignSelf: "flex-start",
    backgroundColor: "#fff",
  },
  dropdownText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "500",
  },
  dropdownMenu: {
    position: "absolute",
    bottom: "110%",
    left: 0,
    width: 200,
    backgroundColor: "white",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
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
    color: "#333",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
  },
});
