import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
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

interface EditScheduleModal2Props {
  visible: boolean;
  entry: ScheduleEntry | null;
  onClose: () => void;
  onSave: (updated: ScheduleEntry) => void;
  currentSchedule: ScheduleEntry[];
}

export const EditScheduleModal2: React.FC<EditScheduleModal2Props> = ({
  visible,
  entry,
  onClose,
  onSave,
  currentSchedule,
}) => {

  const [subject, setSubject] = useState("");
  const [type, setType] = useState<"T" | "P">("T");
  const [building, setBuilding] = useState("");
  const [room, setRoom] = useState("");
  const [day, setDay] = useState<(typeof DAYS)[number] | "">("");
  const [startLabel, setStartLabel] = useState("");
  const [endLabel, setEndLabel] = useState("");

  const [selectionVisible, setSelectionVisible] = useState(false);
  const [selectionType, setSelectionType] = useState<
    | "SUBJECT"
    | "BUILDING"
    | "ROOM"
    | "DAY"
    | "START"
    | "END"
  >("SUBJECT");

 
  const hourLabels = useMemo(
    () => Object.entries(HOURS_MAP).sort((a, b) => a[1] - b[1]).map(([l]) => l),
    []
  );

  const availableRooms = useMemo(
    () => (building ? ROOMS_BY_BUILDING[building] || [] : []),
    [building]
  );

 
  useEffect(() => {
    if (visible && entry) {
      setSubject(entry.subject);
      setType(entry.type === "P" ? "P" : "T");
      setBuilding(entry.building);
      setRoom(entry.room);
      setDay(entry.day);
      const startL = hourLabels.find((l) => HOURS_MAP[l] === entry.start) || "";
      const endInclusiveIdx = entry.end - 1;
      const endL = hourLabels.find((l) => HOURS_MAP[l] === endInclusiveIdx) || "";
      setStartLabel(startL);
      setEndLabel(endL);
    }
    if (!visible) {
      setSelectionVisible(false);
    }
  }, [visible, entry, hourLabels]);

  const openSelection = (
    type: "SUBJECT" | "BUILDING" | "ROOM" | "DAY" | "START" | "END"
  ) => {
    if (type === "ROOM" && !building) {
      return;
    }
    if ((type === "START" || type === "END") && hourLabels.length === 0) {
    
      return;
    }
    setSelectionType(type);
    setSelectionVisible(true);
  };

  const handleSelect = (item: string) => {
    switch (selectionType) {
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
    setSelectionVisible(false);
  };

  const getSelectionData = () => {
    switch (selectionType) {
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

  const hasConflict = (candidate: ScheduleEntry): boolean => {
    return currentSchedule.some((e) => {
      if (e.id === candidate.id) return false;
      if (e.day !== candidate.day) return false;
      return !(candidate.end <= e.start || candidate.start >= e.end);
    });
  };

  const handleSave = () => {
    if (!entry) return;
    if (!subject || !building || !room || !day || !startLabel || !endLabel) {
 
      return;
    }
    const startIdx = HOURS_MAP[startLabel];
    const endIdx = HOURS_MAP[endLabel];
    if (endIdx < startIdx) {
     
      return;
    }
    const exclusiveEnd = endIdx + 1; 
    const updated: ScheduleEntry = {
      id: entry.id, 
      subject,
      type,
      building,
      room,
      day: day as (typeof DAYS)[number],
      start: startIdx,
      end: exclusiveEnd,
    };
    if (hasConflict(updated)) {
     
      return;
    }
    onSave(updated);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Edit Class</Text>
            <TouchableOpacity onPress={onClose}>
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
                  onPress={() => openSelection("SUBJECT")}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Type</Text>
                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[styles.typeButton, type === "T" && styles.typeButtonTSelected]}
                    onPress={() => setType("T")}
                  >
                    <Text style={[styles.typeText, type === "T" && styles.typeTextSelectedT]}>T</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeButton, type === "P" && styles.typeButtonPSelected]}
                    onPress={() => setType("P")}
                  >
                    <Text style={[styles.typeText, type === "P" && styles.typeTextSelectedP]}>P</Text>
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
                  onPress={() => openSelection("BUILDING")}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Room</Text>
                <DropdownField
                  placeholder="Select Room"
                  value={room}
                  onPress={() => openSelection("ROOM")}
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
                  onPress={() => openSelection("DAY")}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Start</Text>
                <DropdownField
                  placeholder="Start Hour"
                  value={startLabel}
                  onPress={() => openSelection("START")}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                <Text style={styles.label}>End</Text>
                <DropdownField
                  placeholder="End Hour"
                  value={endLabel}
                  onPress={() => openSelection("END")}
                  disabled={!startLabel}
                />
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.submitButton} onPress={handleSave}>
            <Text style={styles.submitButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={selectionVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectionVisible(false)}
      >
        <TouchableOpacity
          style={styles.selectionModalOverlay}
          activeOpacity={1}
          onPress={() => setSelectionVisible(false)}
        >
          <View style={styles.selectionModalContent}>
            <Text style={styles.selectionModalTitle}>
              Select {selectionType.charAt(0) + selectionType.slice(1).toLowerCase()}
            </Text>
            <FlatList
              data={getSelectionData()}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const selected =
                  (selectionType === "SUBJECT" && item === subject) ||
                  (selectionType === "BUILDING" && item === building) ||
                  (selectionType === "ROOM" && item === room) ||
                  (selectionType === "DAY" && item === day) ||
                  (selectionType === "START" && item === startLabel) ||
                  (selectionType === "END" && item === endLabel);
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
    <Ionicons name="chevron-down" size={20} color={disabled ? "#999" : "#666"} />
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
    backgroundColor: "#007AFF",
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
  typeButtonTSelected: {
    backgroundColor: "#0A3069",
  },
  typeButtonPSelected: {
    backgroundColor: "#cce5ff",
  },
  typeText: {
    fontWeight: "600",
    fontSize: 16,
    color: "#333",
  },
  typeTextSelectedT: {
    color: "#fff",
  },
  typeTextSelectedP: {
    color: "#0A3069",
  },
});

export default EditScheduleModal2;
