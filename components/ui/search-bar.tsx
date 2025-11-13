import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SelectionModal } from '@/components/modals/selectionmodal';
type RoomEntry = { ref?: string; name?: string; center: [number, number] };
type RoomsIndex = Record<string, RoomEntry[]>;

import roomsIndexRaw from '@/assets/data/rooms_index.json';

const roomsIndex = roomsIndexRaw as unknown as RoomsIndex;

// Mock Data
const MANUAL: Record<string, string[]> = {
  'VII': ['1A', '2A', '2B'],
  'Library': ['Study Room 1', 'Main Floor', 'Quiet Zone'],
};

function mergeData(a: Record<string,string[]>, b: Record<string,string[]>) {
  const out: Record<string,string[]> = { ...a };
  for (const [k, arr] of Object.entries(b)) {
    out[k] = Array.from(new Set([...(out[k] ?? []), ...arr]))
        .sort((x, y) => x.localeCompare(y, undefined, { numeric: true }));
  }
  return out;
}


const BUILDING_DATA: Record<string, string[]> = mergeData(
    buildBuildingData(roomsIndex),
    MANUAL
);


interface SearchWidgetProps {
  onSearch: (building: string | null, room: string | null) => void;
}

function normalizeBuildingName(name: string): string {
  const s = name.trim();

  // direct aliases you care about
  const ALIASES: Record<string, string> = {
    'Edification II': 'II',
    'Edifício II': 'II',
    'Edificio II': 'II',
    'Building II': 'II',
    'Edifício 2': 'II',
    'II': 'II',
  };
  if (ALIASES[s]) return ALIASES[s];

  // try to extract roman numeral
  const m = s.match(/\b([IVXLCDM]+)\b/i);
  if (m) return m[1].toUpperCase();

  return s;
}

function buildBuildingData(index: RoomsIndex): Record<string, string[]> {
  const out: Record<string, Set<string>> = {};

  for (const [rawName, rooms] of Object.entries(index)) {
    const key = normalizeBuildingName(rawName);
    if (!out[key]) out[key] = new Set<string>();

    for (const r of rooms) {
      const label = (r.ref || r.name || '').trim();
      if (label) out[key].add(label);
    }
  }

  return Object.fromEntries(
      Object.entries(out).map(([k, set]) => [
        k,
        Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
      ]),
  );
}



export const SearchWidget: React.FC<SearchWidgetProps> = ({ onSearch }) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'BUILDING' | 'ROOM'>('BUILDING');

  const buildings = useMemo(() => Object.keys(BUILDING_DATA), []);
  const rooms = useMemo(() => selectedBuilding ? BUILDING_DATA[selectedBuilding] : [], [selectedBuilding]);

  const openModal = (type: 'BUILDING' | 'ROOM') => {
    if (type === 'ROOM' && !selectedBuilding) {
         // Optional: You could use Alert.alert here instead
        console.warn("Select a building first"); 
        return;
    }
    setModalType(type);
    setModalVisible(true);
  };

  const handleSelect = (item: string) => {
    if (modalType === 'BUILDING') {
      setSelectedBuilding(item);
      setSelectedRoom(null);
    } else {
      setSelectedRoom(item);
    }
    setModalVisible(false);
  };

  const handleSearchPress = () => {
    onSearch(selectedBuilding, selectedRoom);
    setExpanded(false);
    Keyboard.dismiss();
  };

  if (!expanded) {
    return (
      <TouchableOpacity 
        style={styles.compactContainer} 
        activeOpacity={0.9} 
        onPress={() => setExpanded(true)}
      >
        <Ionicons name="search" size={20} color="#666" style={{ marginRight: 8 }} />
        <Text style={styles.placeholderText}>
          {selectedRoom ? `${selectedBuilding} - ${selectedRoom}` : "Find a classroom..."}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.expandedContainer}>
      <Text style={styles.headerText}>Find Classroom</Text>

      <Text style={styles.label}>Building:</Text>
      <TouchableOpacity style={styles.selector} onPress={() => openModal('BUILDING')}>
        <Text style={selectedBuilding ? styles.selectorText : styles.placeholderText}>
          {selectedBuilding || "Select Building"}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>

      <Text style={styles.label}>Room:</Text>
      <TouchableOpacity 
        style={[styles.selector, !selectedBuilding && styles.disabledSelector]} 
        onPress={() => openModal('ROOM')}
        activeOpacity={selectedBuilding ? 0.2 : 1} // Disable tap effect if disabled
      >
        <Text style={selectedRoom ? styles.selectorText : styles.placeholderText}>
          {selectedRoom || (selectedBuilding ? "Select Room" : "Select Building First")}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>

      <View style={styles.buttonRow}>
          <TouchableOpacity onPress={() => setExpanded(false)} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleSearchPress} 
            style={[styles.searchButton, (!selectedBuilding) && { opacity: 0.5 }]}
            disabled={!selectedBuilding}
           >
              <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
      </View>

      {/* REUSABLE MODAL COMPONENT */}
      <SelectionModal
        visible={modalVisible}
        title={modalType === 'BUILDING' ? 'Select Building' : 'Select Room'}
        data={modalType === 'BUILDING' ? buildings : rooms}
        selectedItem={modalType === 'BUILDING' ? selectedBuilding : selectedRoom}
        onClose={() => setModalVisible(false)}
        onSelect={handleSelect}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  placeholderText: { color: '#999', fontSize: 16 },
  expandedContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  headerText: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 10, marginBottom: 5 },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
  },
  disabledSelector: { backgroundColor: '#f5f5f5', borderColor: '#f0f0f0' },
  selectorText: { fontSize: 16, color: '#000' },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, gap: 10 },
  cancelButton: { paddingVertical: 10, paddingHorizontal: 15 },
  cancelButtonText: { color: '#666', fontSize: 16 },
  searchButton: { backgroundColor: '#007AFF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  searchButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});