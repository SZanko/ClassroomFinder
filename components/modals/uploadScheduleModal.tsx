// components/ui/UploadScheduleModal.tsx

import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScheduleEntry, HOURS_MAP, DAYS, SAMPLE_SCHEDULE } from '@/assets/data/sample-schedule';

const { width } = Dimensions.get('window');
const CELL_WIDTH = (width - 60) / (DAYS.length + 0.5); // Adjust for time column
const CELL_HEIGHT = 40;

interface UploadScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  onUpload: (schedule: ScheduleEntry[]) => void;
}

export const UploadScheduleModal: React.FC<UploadScheduleModalProps> = ({
  visible,
  onClose,
  onUpload,
}) => {
  if (!visible) return null;

  // Function to render content inside a grid cell
  const renderCellContent = (day: string, hourIndex: number) => {
    const entry = SAMPLE_SCHEDULE.find(
      (e) => e.day === day && hourIndex >= e.start && hourIndex < e.end
    );
    if (!entry) return null;
    const isFirstHour = hourIndex === entry.start;
    return (
      <View style={[styles.entryContent, !isFirstHour && { opacity: 0.5 }]}> 
        {isFirstHour && (
          <Text style={styles.entryText} numberOfLines={1}>
            {entry.subject}
          </Text>
        )}
        <Text style={styles.entryType}>({entry.type}) {entry.building}/{entry.room}</Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Preview & Upload Schedule</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle-outline" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <Text style={styles.previewDescription}>This is a sample schedule. Tap Upload to use it.</Text>

          <View style={styles.gridContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.grid}>
                  {/* Header Row (Days) */}
                  <View style={styles.row}>
                    <View style={[styles.cell, styles.timeCell, styles.headerCell]} />
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

          <TouchableOpacity style={styles.uploadButton} onPress={() => onUpload(SAMPLE_SCHEDULE)}>
            <Text style={styles.uploadButtonText}>Upload This Schedule</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxHeight: '85%',
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  previewDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  gridContainer: {
    flex: 1,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
  },
  grid: {
    // No specific width needed here as cells define it
  },
  row: {
    flexDirection: 'row',
    height: CELL_HEIGHT,
  },
  cell: {
    width: CELL_WIDTH,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeCell: {
    width: CELL_WIDTH * 0.7,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 5,
  },
  headerCell: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#333',
  },
  timeText: {
    fontSize: 10,
    color: '#666',
  },
  entryContent: {
    alignItems: 'center',
  },
  entryText: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  entryType: {
      fontSize: 8,
      textAlign: 'center',
      color: '#555',
  },
  entrySubText: {
    fontSize: 8,
    color: '#555',
    textAlign: 'center',
  },
  uploadButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});