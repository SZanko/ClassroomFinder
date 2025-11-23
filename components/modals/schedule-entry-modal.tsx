import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScheduleEntry } from "@/assets/data/sample-schedule";

interface ScheduleEntryModalProps {
  visible: boolean;
  entry: ScheduleEntry | null;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onNavigate: () => void;
}

export const ScheduleEntryModal: React.FC<ScheduleEntryModalProps> = ({
  visible,
  entry,
  onClose,
  onDelete,
  onEdit,
  onNavigate,
}) => {
  if (!entry) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        {/* Wrap content in TouchableOpacity without action to prevent modal closing when clicking inside */}
        <TouchableOpacity activeOpacity={1} style={styles.modalContentWrapper}>
          <View style={styles.modalContent}>
            {/* --- CLOSE BUTTON (Top Left Corner) --- */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#999" />
            </TouchableOpacity>

            {/* Header with Class Info */}
            <Text style={styles.title}>{entry.subject}</Text>
            <Text style={styles.subtitle}>
              ({entry.type.toUpperCase()}) {entry.building}/{entry.room}
            </Text>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <ActionButton
                icon="trash-outline"
                text="Delete"
                onPress={onDelete}
                color="#FF3B30"
              />
              <ActionButton
                icon="pencil-outline"
                text="Edit"
                onPress={onEdit}
                color="#007AFF"
              />
              <ActionButton
                icon="navigate-outline"
                text="Navigate"
                onPress={onNavigate}
                color="#34C759"
              />
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

// Small helper component for the icon buttons
const ActionButton = ({
  icon,
  text,
  onPress,
  color,
}: {
  icon: any;
  text: string;
  onPress: () => void;
  color: string;
}) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress}>
    <View style={[styles.iconContainer, { backgroundColor: color }]}>
      <Ionicons name={icon} size={26} color="white" />
    </View>
    <Text style={[styles.actionText, { color: color }]}>{text}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContentWrapper: {
    width: "100%",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    position: "relative", // Important for close button positioning
  },
  // --- Close Button Style ---
  closeButton: {
    position: "absolute",
    top: 15,
    left: 15,
    zIndex: 10,
    padding: 5, // Increases touch area
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginTop: 15, // Added margin to avoid overlap with close button
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 25,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  actionButton: {
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
