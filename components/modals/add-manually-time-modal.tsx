import React, { useState, useMemo, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScheduleEntry, DAYS, HOURS_MAP } from "@/assets/data/sample-schedule";

const SUBJECTS = ["IPM", "ML", "SBD", "MSP", "IIO", "ASPI"];
const BUILDINGS = ["VII", "II"];
const ROOMS_BY_BUILDING: Record<string, string[]> = {
  VII: ["1A", "1B", "2A", "2B"],
  II: ["128", "127", "Lab. 120"],
};

interface AddManualTimeModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (entry: ScheduleEntry) => void;
  currentSchedule: ScheduleEntry[];
}

export const AddManualTimeModal: React.FC<AddManualTimeModalProps> = ({
  visible,
  onClose,
  onAdd,
  currentSchedule,
}) => {
  const [subject, setSubject] = useState("");

  const [type, setType] = useState<"T" | "P">("T");
  const [building, setBuilding] = useState("");
  const [room, setRoom] = useState("");
  const [day, setDay] = useState<(typeof DAYS)[number] | "">("");
  const [startLabel, setStartLabel] = useState("");
  const [endLabel, setEndLabel] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<
    "SUBJECT" | "BUILDING" | "ROOM" | "DAY" | "START" | "END"
  >("SUBJECT");

  const availableRooms = useMemo(
    () => (building ? ROOMS_BY_BUILDING[building] || [] : []),
    [building],
  );

  const hourLabels = useMemo(
    () =>
      Object.entries(HOURS_MAP)
        .sort((a, b) => a[1] - b[1])
        .map(([l]) => l),
    [],
  );

  const openModal = (
    type: "SUBJECT" | "BUILDING" | "ROOM" | "DAY" | "START" | "END",
  ) => {
    if (type === "ROOM" && !building) {
      Alert.alert("Select Building First", "Choose a building before room.");
      return;
    }
    if ((type === "END" || type === "START") && hourLabels.length === 0) {
      Alert.alert("No Hours", "Hour slots unavailable.");
      return;
    }
    setModalType(type);
    setModalVisible(true);
  };

  const handleSelect = (item: string) => {
    switch (modalType) {
      case "SUBJECT":
        setSubject(item);
        break;
      case "BUILDING":
        setBuilding(item);
        setRoom("");
        break;
      case "ROOM":
        setRoom(item);
        break;
      case "DAY":
        setDay(item as (typeof DAYS)[number]);
        break;
      case "START":
        setStartLabel(item);

        if (endLabel && HOURS_MAP[endLabel] < HOURS_MAP[item]) setEndLabel("");
        break;
      case "END":
        setEndLabel(item);
        break;
    }
    setModalVisible(false);
  };

  const getModalData = () => {
    switch (modalType) {
      case "SUBJECT":
        return SUBJECTS;
      case "BUILDING":
        return BUILDINGS;
      case "ROOM":
        return availableRooms;
      case "DAY":
        return DAYS as unknown as string[];
      case "START":
        return hourLabels;
      case "END":
        if (!startLabel) return hourLabels;

        return hourLabels.filter((l) => HOURS_MAP[l] >= HOURS_MAP[startLabel]);
      default:
        return [];
    }
  };

  const resetForm = () => {
    setSubject("");
    setType("T");
    setBuilding("");
    setRoom("");
    setDay("");
    setStartLabel("");
    setEndLabel("");
  };

  // Reset when becoming hidden (parent closed it)
  useEffect(() => {
    if (!visible) {
      resetForm();
      setModalVisible(false); // ensure selection modal closed
    }
  }, [visible]);

  const hasConflict = (
    candidate: ScheduleEntry,
    existing: ScheduleEntry[],
  ): boolean => {
    return existing.some((e) => {
      if (e.day !== candidate.day) return false;
      // overlapping if ranges intersect
      return !(candidate.end <= e.start || candidate.start >= e.end);
    });
  };

  const handleSubmit = () => {
    if (
      !subject ||
      !type ||
      !building ||
      !room ||
      !day ||
      !startLabel ||
      !endLabel
    ) {
      Alert.alert("Missing Info", "Fill all fields.");
      return;
    }
    const startIdx = HOURS_MAP[startLabel];
    const endIdx = HOURS_MAP[endLabel];
    if (endIdx < startIdx) {
      Alert.alert("Invalid Time", "End cannot be before start.");
      return;
    }

    const exclusiveEnd = endIdx + 1;
    const newEntry: ScheduleEntry = {
      id: Date.now().toString(),
      subject,
      type,
      building,
      room,
      day: day as (typeof DAYS)[number],
      start: startIdx,
      end: exclusiveEnd,
    };
    if (hasConflict(newEntry, currentSchedule)) {
      Alert.alert(
        "Conflict",
        "This time overlaps with an existing entry for the same day.",
      );
      return;
    }
    onAdd(newEntry);
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        resetForm();
        onClose();
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Class</Text>
            <TouchableOpacity
              onPress={() => {
                resetForm();
                onClose();
              }}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 2, marginRight: 10 }]}>
                <Text style={styles.label}>Subject</Text>
                <DropdownField
                  placeholder="Select Subject"
                  value={subject}
                  onPress={() => openModal("SUBJECT")}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Type</Text>
                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      type === "T" && styles.activeType,
                    ]}
                    onPress={() => setType("T")}
                  >
                    <Text
                      style={[
                        styles.typeText,
                        type === "T" && styles.activeTypeText,
                      ]}
                    >
                      T
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      type === "P" && styles.activeType,
                    ]}
                    onPress={() => setType("P")}
                  >
                    <Text
                      style={[
                        styles.typeText,
                        type === "P" && styles.activeTypeText,
                      ]}
                    >
                      P
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Building</Text>
                <DropdownField
                  placeholder="Select Building"
                  value={building}
                  onPress={() => openModal("BUILDING")}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Room</Text>
                <DropdownField
                  placeholder="Select Room"
                  value={room}
                  onPress={() => openModal("ROOM")}
                  disabled={!building}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Day</Text>
                <DropdownField
                  placeholder="Select Day"
                  value={day}
                  onPress={() => openModal("DAY")}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Start</Text>
                <DropdownField
                  placeholder="Start Hour"
                  value={startLabel}
                  onPress={() => openModal("START")}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                <Text style={styles.label}>End</Text>
                <DropdownField
                  placeholder="End Hour"
                  value={endLabel}
                  onPress={() => openModal("END")}
                  disabled={!startLabel}
                />
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Add to Schedule</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.selectionModalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.selectionModalContent}>
            <Text style={styles.selectionModalTitle}>
              Select {modalType.charAt(0) + modalType.slice(1).toLowerCase()}
            </Text>
            <FlatList
              data={getModalData()}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const selected =
                  (modalType === "SUBJECT" && item === subject) ||
                  (modalType === "BUILDING" && item === building) ||
                  (modalType === "ROOM" && item === room) ||
                  (modalType === "DAY" && item === day) ||
                  (modalType === "START" && item === startLabel) ||
                  (modalType === "END" && item === endLabel);
                return (
                  <TouchableOpacity
                    style={styles.selectionItem}
                    onPress={() => handleSelect(item)}
                  >
                    <Text style={styles.selectionItemText}>{item}</Text>
                    {selected && (
                      <Ionicons name="checkmark" size={20} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
};

const DropdownField = ({
  placeholder,
  value,
  onPress,
  disabled = false,
}: {
  placeholder: string;
  value: string | undefined;
  onPress: () => void;
  disabled?: boolean;
}) => (
  <TouchableOpacity
    style={[styles.dropdownField, disabled && styles.disabledDropdown]}
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={[styles.dropdownText, !value && styles.placeholderText]}>
      {value || placeholder}
    </Text>
    <Ionicons
      name="chevron-down"
      size={20}
      color={disabled ? "#999" : "#666"}
    />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    marginBottom: 15,
  },
  inputGroup: {},
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  dropdownField: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#f9f9f9",
  },
  disabledDropdown: {
    backgroundColor: "#eee",
    opacity: 0.7,
  },
  dropdownText: {
    fontSize: 16,
    color: "#000",
  },
  placeholderText: {
    color: "#999",
  },
  submitButton: {
    backgroundColor: "#34C759",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 25,
    marginBottom: 20,
  },
  submitButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  selectionModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 30,
  },
  selectionModalContent: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    maxHeight: "50%",
  },
  selectionModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  selectionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  selectionItemText: {
    fontSize: 16,
  },

  typeSelector: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    overflow: "hidden",
    height: 48,
  },
  typeButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  activeType: {
    backgroundColor: "#007AFF",
  },
  typeText: {
    fontWeight: "600",
    fontSize: 16,
    color: "#333",
  },
  activeTypeText: {
    color: "white",
  },
  previewContainer: {
    marginTop: 4,
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#eef6ff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cce5ff",
  },
  previewText: {
    fontSize: 12,
    color: "#0A3069",
  },
});

export default AddManualTimeModal;
