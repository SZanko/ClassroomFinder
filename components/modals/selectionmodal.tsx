import React, { useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SelectionModalProps {
  visible: boolean;
  title: string;
  data: string[];
  selectedItem: string | null;
  onClose: () => void;
  onSelect: (item: string) => void;
  searchable?: boolean;
}

export const SelectionModal: React.FC<SelectionModalProps> = ({
  visible,
  title,
  data,
  selectedItem,
  onClose,
  onSelect,
  searchable,
}) => {
  const [query, setQuery] = useState("");
  const filteredData = useMemo(() => {
    if (!searchable || query.trim() === "") return data;
    const q = query.toLowerCase();
    return data.filter((item) => item.toLowerCase().includes(q));
  }, [data, query, searchable]);

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalHeader}>{title}</Text>

          {searchable && (
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder={`Search ${title.toLowerCase()}...`}
            />
          )}

          {data.length === 0 ? (
            <Text style={styles.emptyText}>No options available</Text>
          ) : (
            <FlatList
              data={filteredData}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => onSelect(item)}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      item === selectedItem && styles.selectedItemText,
                    ]}
                  >
                    {item}
                  </Text>
                  {item === selectedItem && (
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 15,
    maxHeight: "50%",
    padding: 20,
  },
  modalHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 10,
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalItemText: {
    fontSize: 16,
    color: "#333",
  },
  selectedItemText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    paddingVertical: 20,
  },
});
