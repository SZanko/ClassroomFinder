import React, { useState, useMemo } from 'react';
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
  TextInput // Important import for typing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScheduleEntry, DAYS } from '@/assets/data/sample-schedule';

// --- Constants for Buildings and Rooms ---
const BUILDINGS = ['VII', 'II', 'VIII', 'IV']; // You can add more
const ROOMS_BY_BUILDING: Record<string, string[]> = {
  'VII': ['1A', '1B', '2A', '2B', 'Auditório'],
  'II': ['128', '127', 'Lab. 120'],
  'VIII': ['H1', 'H2'],
  'IV': ['Amphitheater'],
};

interface AddManualScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (entry: ScheduleEntry) => void;
  currentSchedule: ScheduleEntry[];
}

export const AddManualScheduleModal: React.FC<AddManualScheduleModalProps> = ({
  visible,
  onClose,
  onAdd,
  currentSchedule,
}) => {
  // --- Form State ---
  const [subject, setSubject] = useState(''); // Now it's text input
  const [type, setType] = useState<'T' | 'P'>('T');
  const [building, setBuilding] = useState('');
  const [room, setRoom] = useState('');
  const [day, setDay] = useState<(typeof DAYS)[number]>(DAYS[0]);
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(9);

  // --- Dropdown State (only for Building and Room) ---
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'BUILDING' | 'ROOM'>('BUILDING');

  const hours = useMemo(() => Array.from({ length: 16 }, (_, i) => i + 8), []);
  const availableRooms = useMemo(() => building ? ROOMS_BY_BUILDING[building] || [] : [], [building]);

  // --- Dropdown Functions ---
  const openModal = (type: 'BUILDING' | 'ROOM') => {
     if (type === 'ROOM' && !building) {
       Alert.alert("Select Building First", "Please select a building before choosing a room.");
       return;
     }
     setModalType(type);
     setModalVisible(true);
  };

  const handleSelect = (item: string) => {
     switch (modalType) {
       case 'BUILDING': setBuilding(item); setRoom(''); break;
       case 'ROOM': setRoom(item); break;
     }
     setModalVisible(false);
  };

  const getModalData = () => {
      switch (modalType) {
       case 'BUILDING': return BUILDINGS;
       case 'ROOM': return availableRooms;
       default: return [];
      }
  };

  // --- Submission ---
  const handleSubmit = () => {
    if (!subject || !building || !room) {
      Alert.alert("Missing Info", "Please fill in subject, building and room.");
      return;
    }
    if (endHour <= startHour) {
      Alert.alert("Invalid Time", "End time must be after start time.");
      return;
    }

    const newStart = startHour - 8;
    const newDuration = endHour - startHour;
    const newEnd = newStart + newDuration;

    // Conflict Check (overlapping classes)
    const hasConflict = currentSchedule.some((entry) => {
      if (entry.day !== day) return false;
      const entryStart = entry.hourIndex;
      const entryEnd = entry.hourIndex + entry.duration;
      return newStart < entryEnd && entryStart < newEnd;
    });

    if (hasConflict) {
      Alert.alert("Schedule Conflict", `You already have a class at this time (${day}).`);
      return;
    }

    // Create new entry
    const newEntry: ScheduleEntry = {
      id: Math.random().toString(36).substr(2, 9), // Random ID
      subject, // Stores what was typed
      type,
      building,
      room,
      day,
      hourIndex: newStart,
      duration: newDuration,
    };

    onAdd(newEntry);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setSubject('');
    setBuilding('');
    setRoom('');
    setType('T');
    setStartHour(8);
    setEndHour(9);
    setDay(DAYS[0]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView 
        // FIX: On Android, 'height' often causes jumping. 'undefined' lets native OS handle it.
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          
          {/* Modal Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add Class</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled" // Helps with dismissing keyboard
          >
            
            {/* --- Subject as TextInput --- */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 2, marginRight: 10 }]}>
                <Text style={styles.label}>Subject Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="E.g. IPM"
                  value={subject}
                  onChangeText={setSubject}
                  placeholderTextColor="#999"
                />
              </View>
              
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Type</Text>
                <View style={styles.typeSelector}>
                  <TouchableOpacity 
                    style={[styles.typeButton, type === 'T' && styles.activeType]} 
                    onPress={() => setType('T')}>
                    <Text style={[styles.typeText, type === 'T' && styles.activeTypeText]}>T</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.typeButton, type === 'P' && styles.activeType]} 
                    onPress={() => setType('P')}>
                    <Text style={[styles.typeText, type === 'P' && styles.activeTypeText]}>P</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Building and Room Selection */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Building</Text>
                <DropdownField 
                  placeholder="Select..." 
                  value={building} 
                  onPress={() => openModal('BUILDING')} 
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Room</Text>
                <DropdownField 
                  placeholder="Select..." 
                  value={room} 
                  onPress={() => openModal('ROOM')}
                  disabled={!building}
                />
              </View>
            </View>

            {/* Day Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Day</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalSelect}>
                {DAYS.map((d) => (
                  <TouchableOpacity key={d} style={[styles.selectButton, day === d && styles.activeSelectButton]} onPress={() => setDay(d)}>
                    <Text style={[styles.selectText, day === d && styles.activeSelectText]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Time Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Start</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalSelect}>
                  {hours.map((h) => (
                      <TouchableOpacity key={`start-${h}`} style={[styles.timeButton, startHour === h && styles.activeSelectButton]} onPress={() => setStartHour(h)}>
                        <Text style={[styles.selectText, startHour === h && styles.activeSelectText]}>{h}:00</Text>
                      </TouchableOpacity>
                  ))}
              </ScrollView>
            </View>
            <View style={[styles.inputGroup, { marginTop: 15 }]}>
              <Text style={styles.label}>End (Duration: {endHour - startHour}h)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalSelect}>
                  {hours.map((h) => (
                      <TouchableOpacity key={`end-${h}`} style={[styles.timeButton, endHour === h && styles.activeSelectButton]} onPress={() => setEndHour(h)}>
                        <Text style={[styles.selectText, endHour === h && styles.activeSelectText]}>{h}:00</Text>
                      </TouchableOpacity>
                  ))}
              </ScrollView>
            </View>

          </ScrollView>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Add to Schedule</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Helper Modal for Building/Room Selection */}
      <Modal visible={modalVisible} transparent={true} animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={styles.selectionModalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.selectionModalContent}>
            <Text style={styles.selectionModalTitle}>Select {modalType === 'BUILDING' ? 'Building' : 'Room'}</Text>
            <FlatList
              data={getModalData()}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.selectionItem} onPress={() => handleSelect(item)}>
                  <Text style={styles.selectionItemText}>{item}</Text>
                  {(
                    (modalType === 'BUILDING' && item === building) ||
                    (modalType === 'ROOM' && item === room)
                  ) && <Ionicons name="checkmark" size={20} color="#007AFF" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
};

// --- Helper Component for Dropdown ---
const DropdownField = ({ placeholder, value, onPress, disabled = false }: { placeholder: string, value: string, onPress: () => void, disabled?: boolean }) => (
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

// --- Styles ---
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  inputGroup: {
    // marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  // Style for Text Input
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
    color: '#000',
  },
  dropdownField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  disabledDropdown: {
    backgroundColor: '#eee',
    opacity: 0.7,
  },
  dropdownText: {
    fontSize: 16,
    color: '#000',
  },
  placeholderText: {
    color: '#999',
  },
  typeSelector: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    height: 48, // To match input height
  },
  typeButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  activeType: {
    backgroundColor: '#007AFF',
  },
  typeText: {
    fontWeight: '600',
    fontSize: 16,
    color: '#333',
  },
  activeTypeText: {
    color: 'white',
  },
  horizontalSelect: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  selectButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    backgroundColor: '#f9f9f9',
  },
  timeButton: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#ddd',
      marginRight: 8,
      backgroundColor: '#f9f9f9',
      minWidth: 65,
      alignItems: 'center'
  },
  activeSelectButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  selectText: {
    color: '#333',
    fontSize: 14,
  },
  activeSelectText: {
    color: 'white',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 20, 
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 30,
  },
  selectionModalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    maxHeight: '50%',
  },
  selectionModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  selectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectionItemText: {
    fontSize: 16,
  }
});