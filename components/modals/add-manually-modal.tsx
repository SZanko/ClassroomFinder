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
import { ScheduleEntry, BasicManualEntry } from "@/assets/data/sample-schedule";

const SUBJECTS = ["IPM", "ML", "SBD", "MSP", "IIO", "ASPI"];
const BUILDINGS = ["VII", "II"];
const ROOMS_BY_BUILDING: Record<string, string[]> = {
  VII: ["1A", "1B", "2A", "2B"],
  II: ["128", "127", "Lab. 120"],
};

interface AddManualScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (entry: BasicManualEntry) => void;
  currentSchedule: ScheduleEntry[]; 
}

export const AddManualScheduleModal: React.FC<AddManualScheduleModalProps> = ({
  visible,
  onClose,
  onAdd,
}) => {
  const [subject, setSubject] = useState("");
  const [type, setType] = useState<"T" | "P">("T");
  const [building, setBuilding] = useState("");
  const [room, setRoom] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"SUBJECT" | "BUILDING" | "ROOM">(
    "SUBJECT"
  );
  const availableRooms = useMemo(
    () => (building ? ROOMS_BY_BUILDING[building] || [] : []),
    [building]
  );

  const openModal = (type: "SUBJECT" | "BUILDING" | "ROOM") => {
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
      default:
        return [];
    }
  };

  const resetForm = () => {
    setSubject("");
    setBuilding("");
    setRoom("");
    setType("T");
  };

  // Reset whenever modal transitions from visible to hidden (parent closed it)
  useEffect(() => {
    if (!visible) {
      resetForm();
      setModalVisible(false); // ensure any selection sub-modal also closes
    }
  }, [visible]);


  //TODO: Add conflict checking here if needed
  const handleSubmit = () => {
    if (!subject || !building || !room) {
      return;
    }
    const newEntry: BasicManualEntry = {
      id: Date.now().toString(),
      subject,
      type,
      building,
      room,
    };
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
                  placeholder="Select..."
                  value={building}
                  onPress={() => openModal("BUILDING")}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Room</Text>
                <DropdownField
                  placeholder="Select..."
                  value={room}
                  onPress={() => openModal("ROOM")}
                  disabled={!building}
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
                  (modalType === "ROOM" && item === room);
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
  value: string;
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
  // Scroll Selectors
  horizontalSelect: {
    flexDirection: "row",
  },
  selectButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    marginRight: 8,
    backgroundColor: "#f9f9f9",
  },
  timeButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginRight: 8,
    backgroundColor: "#f9f9f9",
    minWidth: 65,
    alignItems: "center",
  },
  activeSelectButton: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  selectText: {
    color: "#333",
    fontSize: 14,
  },
  activeSelectText: {
    color: "white",
    fontWeight: "600",
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
});
