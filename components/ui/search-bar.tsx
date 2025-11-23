import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SelectionModal } from '@/components/modals/selectionmodal';

import roomsIndexRaw from '@/assets/data/rooms_index.json';
type RoomEntry = { ref?: string; name?: string; center: [number, number] };
type RoomsIndex = Record<string, RoomEntry[]>;

const roomsIndex = roomsIndexRaw as unknown as RoomsIndex;

// Mock Data
const MANUAL: Record<string, string[]> = {
  'VII': ['1A', '2A', '2B'],
  'Library': ['Study Room 1', 'Main Floor', 'Quiet Zone'],
};

// Define the search criteria types
export type SearchCriteria =
  | { type: 'location', building: string | null, room: string | null }
  | { type: 'name', query: string };

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
  onSearch(criteria: SearchCriteria): void;
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

  // --- New State for Toggled Search ---
  const [searchMode, setSearchMode] = useState<'Location' | 'Name'>('Location');
  const [nameQuery, setNameQuery] = useState('');
  const [lastSearchText, setLastSearchText] = useState('Find a classroom...');

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'BUILDING' | 'ROOM'>('BUILDING');

  const buildings = useMemo(() => Object.keys(BUILDING_DATA), []);
  const rooms = useMemo(() => selectedBuilding ? BUILDING_DATA[selectedBuilding] : [], [selectedBuilding]);

  const openModal = (type: 'BUILDING' | 'ROOM') => {
    if (type === 'ROOM' && !selectedBuilding) {
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

  // --- Updated Search Handler ---
  const handleSearchPress = () => {
    let searchText = '';

    if (searchMode === 'Location') {
      if (!selectedBuilding) return; // Or show alert
      onSearch({ type: 'location', building: selectedBuilding, room: selectedRoom });
      searchText = selectedRoom ? `${selectedBuilding} - ${selectedRoom}` : (selectedBuilding || '');
      setNameQuery(''); // Clear other search type
    } else {
      if (nameQuery.trim() === '') return; // Or show alert
      onSearch({ type: 'name', query: nameQuery });
      searchText = nameQuery;
      // Clear other search type
      setSelectedBuilding(null);
      setSelectedRoom(null);
    }

    setLastSearchText(searchText);
    setExpanded(false);
    Keyboard.dismiss();
  };

  // --- Compact View ---
  if (!expanded) {
    return (
      <TouchableOpacity 
        style={styles.compactContainer} 
        activeOpacity={0.9} 
        onPress={() => setExpanded(true)}
      >
        <Ionicons name="search" size={20} color="#666" style={{ marginRight: 8 }} />
        <Text style={styles.placeholderText}>
          {lastSearchText}
        </Text>
      </TouchableOpacity>
    );
  }

  // --- Expanded View ---
  return (
    <View style={styles.expandedContainer}>
      <Text style={styles.headerText}>Find Classroom</Text>

      {/* --- Segmented Control --- */}
      <View style={styles.scopeContainer}>
        <TouchableOpacity
          style={[styles.scopeButton, searchMode === 'Location' && styles.activeScopeButton]}
          onPress={() => setSearchMode('Location')}
        >
          <Text style={[styles.scopeText, searchMode === 'Location' && styles.activeScopeText]}>By Location</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.scopeButton, searchMode === 'Name' && styles.activeScopeButton]}
          onPress={() => setSearchMode('Name')}
        >
          <Text style={[styles.scopeText, searchMode === 'Name' && styles.activeScopeText]}>By Name</Text>
        </TouchableOpacity>
      </View>

      {/* --- Conditional Inputs --- */}
      {searchMode === 'Location' ? (
        <>
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
            activeOpacity={!selectedBuilding ? 1 : 0.2}
          >
            <Text style={selectedRoom ? styles.selectorText : styles.placeholderText}>
              {selectedRoom || (selectedBuilding ? "Select Room" : "Select Building First")}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.label}>Classroom or Building Name:</Text>
          <TextInput
            style={styles.inputField}
            value={nameQuery}
            onChangeText={setNameQuery}
            placeholder="e.g., Lab 120 or VII"
            returnKeyType="search"
            onSubmitEditing={handleSearchPress}
          />
        </>
      )}

      {/* --- Action Buttons --- */}
      <View style={styles.buttonRow}>
          <TouchableOpacity onPress={() => setExpanded(false)} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleSearchPress} 
            style={[styles.searchButton, (searchMode === 'Location' && !selectedBuilding) && { opacity: 0.5 }, (searchMode === 'Name' && nameQuery.trim() === '') && { opacity: 0.5 }]}
            disabled={(searchMode === 'Location' && !selectedBuilding) || (searchMode === 'Name' && nameQuery.trim() === '')}
           >
              <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
      </View>

      {/* --- Reusable Modal --- */}
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

// --- Styles ---
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

  // --- New Styles ---
  scopeContainer: {
    flexDirection: 'row',
    backgroundColor: '#eee',
    borderRadius: 8,
    padding: 2,
    marginBottom: 10,
  },
  scopeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeScopeButton: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scopeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeScopeText: {
    color: '#000',
    fontWeight: '600',
  },
  inputField: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
  },
});