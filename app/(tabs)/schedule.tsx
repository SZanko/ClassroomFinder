import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

import { View, Text, TouchableOpacity, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, FontAwesome } from "@expo/vector-icons";

import { DAYS, HOURS_MAP, ScheduleEntry, BasicManualEntry, SAMPLE_SCHEDULE } from "../../assets/data/sample-schedule";
import { UploadScheduleModal } from "../../components/modals/uploadScheduleModal";
import { ScheduleEntryModal } from "../../components/modals/schedule-entry-modal";
import { EditScheduleModal2 } from "../../components/modals/edit-schedule-modal";
import { AddManualTimeModal } from "../../components/modals/add-manually-time-modal";
import { AddManualScheduleModal } from "../../components/modals/add-manually-modal";

const HOURS: string[] = (() => {
  const arr: string[] = [];
  Object.entries(HOURS_MAP).forEach(([label, idx]) => {
    arr[idx as number] = label;
  });
  return arr;
})();

const GRID_HEIGHT = 640;

type GridBlock = {
  dayIndex: number;
  start: number;
  duration: number;
  subject: string;
  building: string;
  room: string;
  type: string;
};

export default function ScheduleScreen() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);

  const [gridSize, setGridSize] = useState({ width: 0, height: 0 });
  const [basicModalVisible, setBasicModalVisible] = useState(false);
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [blocks, setBlocks] = useState<GridBlock[]>([]);
  const [clickedExistingBlock, setClickedExistingBlock] = useState(false);
  const [entryModalVisible, setEntryModalVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);

  const STORAGE_KEY = "@schedule_blocks";
  const loadSchedule = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: GridBlock[] = JSON.parse(raw);
        setBlocks(parsed);
      }
    } catch (e) {
      console.warn("Failed to load schedule", e);
    }
  };
  const saveSchedule = async (next: GridBlock[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn("Failed to save schedule", e);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  useEffect(() => {
    if (blocks.length >= 0) saveSchedule(blocks);
  }, [blocks]);

  const clearSelection = () => setSelectedCells(new Set());

  const getKey = (r: number, c: number) => `${r}-${c}`;
  const isCellSelected = (r: number, c: number) =>
    selectedCells.has(getKey(r, c));

  const getBlockAt = (rowIndex: number, colIndex: number): GridBlock | null => {
    if (rowIndex === 0 || colIndex === 0) return null;
    const hour = rowIndex - 1;
    const dayIndex = colIndex - 1;
    return (
      blocks.find(
        (b) =>
          b.dayIndex === dayIndex &&
          hour >= b.start &&
          hour < b.start + b.duration
      ) || null
    );
  };

  const TOTAL_ROWS = 14;
  const TOTAL_COLS = 6;
  const pointToCell = (x: number, y: number) => {
    const { width, height } = gridSize;
    if (!width || !height) return null;
    const col = Math.floor((x / width) * TOTAL_COLS);
    const row = Math.floor((y / height) * TOTAL_ROWS);
    if (row <= 0 || col <= 0) return null;
    return { row, col } as const;
  };

  const addCell = (row: number, col: number) => {
    setSelectedCells((prev) => {
      const key = getKey(row, col);
      // Prevent selecting a cell that already belongs to an existing block
      if (prev.has(key)) return prev;
      if (getBlockAt(row, col)) return prev; // occupied -> skip so we don't overwrite
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  };

  const handleGridGrant = (e: any) => {
    const { locationX, locationY } = e.nativeEvent;
    const cell = pointToCell(locationX, locationY);
    if (!cell) return;
    setIsSelecting(true);
    addCell(cell.row, cell.col);
  };
  const handleGridMove = (e: any) => {
    if (!isSelecting) return;
    const { locationX, locationY } = e.nativeEvent;
    const cell = pointToCell(locationX, locationY);
    if (cell) addCell(cell.row, cell.col);
  };
  const handleGridRelease = () => {
    setIsSelecting(false);
    if (clickedExistingBlock) {
      setClickedExistingBlock(false);
      return;
    }
    if (selectedCells.size > 0) setBasicModalVisible(true);
  };
  const onGridLayout = (e: any) => {
    const { width, height } = e.nativeEvent.layout || {};
    if (width && height) setGridSize({ width, height });
  };



  // Color helper: 'T' -> dark blue, 'P' -> light blue (based on type field)
  const getColorsForBlock = (b: GridBlock) => {
    if (b.type === "T") return { bg: "#0A3069", fg: "#fff" }; // theoretical
    if (b.type === "P") return { bg: "#cce5ff", fg: "#0A3069" }; // practical
    return { bg: "#DDEBFF", fg: "#0A3069" }; // fallback
  };

  const handleNavigate = () => {
    if (!selectedEntry) return;
      router.push({
        pathname: "/",
        params: { building: selectedEntry.building, room: selectedEntry.room },
      });
      };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View
        style={{
          flex: 1,
          padding: 20,
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "bold", color: "#007AFF" }}>
            Schedule
          </Text>
          <TouchableOpacity
            onPress={() => {
              console.log("Add button pressed");
            }}
          >
            <Ionicons name="person-circle-outline" size={40} color="#007AFF" />
          </TouchableOpacity>
        </View>
        {/* Schedule Content */}
        <View
          onLayout={onGridLayout}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={handleGridGrant}
          onResponderMove={handleGridMove}
          onResponderRelease={handleGridRelease}
          style={{
            // Replace flex:1 with a fixed taller height
            height: GRID_HEIGHT,
            // flex:1,
            marginTop: 16,
            borderWidth: 1,
            borderColor: "#000",
            borderRadius: 12,
            overflow: "hidden",
            position: "relative",
            userSelect: "none",
          }}
        >
          {Array.from({ length: 14 }).map((_, rowIndex) => (
            <View
              key={`row-${rowIndex}`}
              style={{ flex: 1, flexDirection: "row" }}
            >
              {Array.from({ length: 6 }).map((_, colIndex) => {
                const isHeader = rowIndex === 0 || colIndex === 0;

                if (isHeader) {
                  return (
                    <View
                      key={`cell-${rowIndex}-${colIndex}`}
                      style={{
                        flex: 1,
                        borderWidth: 0.5,
                        borderColor: "#000",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#f7f7f7",
                      }}
                    >
                      {rowIndex === 0 && colIndex > 0 ? (
                        <Text style={{ fontWeight: "600", color: "#333" }}>
                          {DAYS[colIndex - 1] ?? ""}
                        </Text>
                      ) : null}
                      {rowIndex > 0 && colIndex === 0 ? (
                        <Text style={{ fontWeight: "600", color: "#333" }}>
                          {HOURS[rowIndex - 1] ?? ""}
                        </Text>
                      ) : null}
                    </View>
                  );
                }

                return (
                  <View
                    key={`cell-${rowIndex}-${colIndex}`}
                    style={{
                      flex: 1,
                      borderWidth: 0.5,
                      borderColor: "#000",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isCellSelected(rowIndex, colIndex)
                        ? "#cce5ff"
                        : "#fff",

                      cursor: "pointer",
                    }}
                  />
                );
              })}
            </View>
          ))}
          {/* Overlay merged blocks */}
          {gridSize.width > 0 &&
            gridSize.height > 0 &&
            blocks.map((b, i) => {
              const leftPct = ((b.dayIndex + 1) / TOTAL_COLS) * 100;
              const topPct = ((b.start + 1) / TOTAL_ROWS) * 100;
              const widthPct = (1 / TOTAL_COLS) * 100;
              const heightPct = (b.duration / TOTAL_ROWS) * 100;
              const { bg, fg } = getColorsForBlock(b);
              return (
                <TouchableOpacity
                  key={`block-${i}`}
                  activeOpacity={0.7}
                  style={{
                    position: "absolute",
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    width: `${widthPct}%`,
                    height: `${heightPct}%`,
                    backgroundColor: bg,
                    borderWidth: 0.5,
                    borderColor: "#000",
                    justifyContent: "center",
                    alignItems: "center",
                    paddingHorizontal: 4,
                  }}
                  onPress={() => {
                    const entry: ScheduleEntry = {
                      id: `b-${i}`,
                      subject: b.subject,
                      type: b.type === "T" || b.type === "P" ? (b.type as "T" | "P") : "T",
                      building: b.building,
                      room: b.room,
                      day: DAYS[b.dayIndex],
                      start: b.start,
                      end: b.start + b.duration,
                    };
                    setSelectedEntry(entry);
                    setSelectedBlockIndex(i);
                    setEntryModalVisible(true);
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      fontWeight: "700",
                      color: fg,
                      fontSize: 12,
                    }}
                  >
                    {b.subject}
                  </Text>
                  <Text numberOfLines={1} style={{ color: fg, fontSize: 10 }}>
                    {b.building} {b.room}
                  </Text>
                  <Text style={{ color: fg, fontSize: 10 }}>{b.type}</Text>
                </TouchableOpacity>
              );
            })}
        </View>
        {/* Close menu */}
        {isMenuOpen && (
          <Pressable
            onPress={() => setIsMenuOpen(false)}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9,
            }}
          />
        )}
        {/* Footer */}
        <View
          style={{
            zIndex: 10,
            marginBottom: 180,
            marginTop: 20,
            height: 60, // fixed height so grid above stays constant
            position: "relative", // allow absolute children
          }}
        >
          {/* Change Schedule Button */}
          <View
            style={{
              position: "absolute",
              left: 0,
              // top: 60,
              backgroundColor: "#fff",
              borderWidth: 1,
              borderColor: "#007AFF",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 10,
                paddingHorizontal: 15,
                backgroundColor: "#007AFF",
                height: 59,
                width: 180,
              }}
              onPress={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Ionicons
                name={
                  isMenuOpen ? "remove-circle-outline" : "add-circle-outline"
                }
                size={16}
                color="#fff"
              />
              <Text
                style={{
                  color: "#fff",
                  fontWeight: "600",
                  fontSize: 16,
                }}
              >
                Change Schedule
              </Text>
            </TouchableOpacity>
            {/* Other buttons */}
            {isMenuOpen && (
              <View style={{ backgroundColor: "#fff" }}>
                <View
                  style={{
                    height: 1,
                  }}
                />
                <TouchableOpacity
                  style={{
                    padding: 14,
                    alignItems: "center",
                    flexDirection: "row",
                  }}
                  onPress={() => {
                    setIsMenuOpen(false);
                    setUploadModalVisible(true);
                  }}
                >
                  <Ionicons
                    name="arrow-up-circle-outline"
                    size={20}
                    color="#007AFF"
                  />
                  <Text style={{ fontSize: 16, color: "#333", marginLeft: 8 }}>
                    Upload Schedule
                  </Text>
                </TouchableOpacity>

                <View style={{ height: 1, backgroundColor: "#007AFF" }} />
                <TouchableOpacity
                  style={{
                    padding: 14,
                    alignItems: "center",
                    flexDirection: "row",
                  }}
                  onPress={() => {
                    setIsMenuOpen(false);
                    clearSelection();
                    setTimeModalVisible(true);
                  }}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={20}
                    color="#007AFF"
                  />
                  <Text style={{ fontSize: 16, color: "333", marginLeft: 8 }}>
                    Add Manually
                  </Text>
                </TouchableOpacity>

                <View style={{ height: 1, backgroundColor: "007AFF" }} />
              </View>
            )}
          </View>
          {/* Trash button positioned separately so it doesn't affect layout */}
          {blocks.length > 0 && (
            <TouchableOpacity
              onPress={() => setBlocks([])}
              accessibilityLabel="Clear all classes"
              style={{
                position: "absolute",
                left: 190, // right of Change Schedule
                // top: 60,
                width: 60,
                height: 60,
                backgroundColor: "#FF3B30",
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="trash-outline" size={24} color="#fff" />
            </TouchableOpacity>
          )}
          {/* Navigation button */}
          <View
            style={{
              position: "absolute",
              right: 0,
              // top: 60,
              width: 60,
              height: 60,
              borderRadius: 24,
              backgroundColor: "#007AFF",
              borderWidth: 1,
              borderColor: "#007AFF",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TouchableOpacity
              style={{
                width: "100%",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 24,
                backgroundColor: "#007AFF",
              }}
              onPress={() => {
                router.replace("/");
              }}
            >
              <FontAwesome name="map" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Basic Modal triggered by slot selection */}
      <AddManualScheduleModal
        visible={basicModalVisible}
        onClose={() => {
          setBasicModalVisible(false);
          clearSelection();
        }}
        onAdd={(entry: BasicManualEntry) => {
          const perCol = new Map<number, number[]>();
          selectedCells.forEach((key) => {
            const [r, c] = key.split("-").map((n) => parseInt(n, 10));
            if (r === 0 || c === 0) return;
            const arr = perCol.get(c) ?? [];
            arr.push(r);
            perCol.set(c, arr);
          });
          const newBlocks: GridBlock[] = [];
          perCol.forEach((rows, c) => {
            rows.sort((a, b) => a - b);
            let start = rows[0];
            let prev = rows[0];
            for (let i = 1; i <= rows.length; i++) {
              const cur = rows[i];
              if (cur !== prev + 1) {
                const startHour = start - 1;
                const duration = prev - start + 1;
                newBlocks.push({
                  dayIndex: c - 1,
                  start: startHour,
                  duration,
                  subject: entry.subject,
                  building: entry.building,
                  room: entry.room,
                  type: entry.type,
                });
                start = cur;
              }
              prev = cur;
            }
          });
          setBlocks((prev) => [...prev, ...newBlocks]);
          setBasicModalVisible(false);
          clearSelection();
        }}
        currentSchedule={blocks.map((b, i) => ({
          id: `b-${i}`,
          subject: b.subject,
          type: b.type === "T" || b.type === "P" ? (b.type as "T" | "P") : "T",
          building: b.building,
          room: b.room,
          day: DAYS[b.dayIndex],
          start: b.start,
          end: b.start + b.duration,
        }))}
      />

      {/* Time Modal triggered from menu button */}
      <AddManualTimeModal
        visible={timeModalVisible}
        onClose={() => {
          setTimeModalVisible(false);
          clearSelection();
        }}
        onAdd={(entry: ScheduleEntry) => {
          const dayIndex = DAYS.indexOf(entry.day);
          if (dayIndex === -1) {
            console.warn("Invalid day in entry", entry.day);
            setTimeModalVisible(false);
            return;
          }
          const duration = entry.end - entry.start;
          const newBlock: GridBlock = {
            dayIndex,
            start: entry.start,
            duration,
            subject: entry.subject,
            building: entry.building,
            room: entry.room,
            type: entry.type,
          };
          setBlocks((prev) => [...prev, newBlock]);
          setTimeModalVisible(false);
          clearSelection();
        }}
        currentSchedule={blocks.map((b, i) => ({
          id: `b-${i}`,
          subject: b.subject,
          type: b.type === "T" || b.type === "P" ? (b.type as "T" | "P") : "T",
          building: b.building,
          room: b.room,
          day: DAYS[b.dayIndex],
          start: b.start,
          end: b.start + b.duration,
        }))}
      />

      {/* Entry detail modal when clicking existing block */}
      <ScheduleEntryModal
        visible={entryModalVisible}
        entry={selectedEntry}
        onClose={() => {
          setEntryModalVisible(false);
          setSelectedEntry(null);
          setSelectedBlockIndex(null);
        }}
        onDelete={() => {
          if (selectedBlockIndex !== null) {
            setBlocks((prev) => prev.filter((_, i) => i !== selectedBlockIndex));
          }
          setEntryModalVisible(false);
          setSelectedEntry(null);
          setSelectedBlockIndex(null);
        }}
        onEdit={() => {
          setEntryModalVisible(false);
          setEditModalVisible(true);
        }}
        onNavigate={() => {
          handleNavigate();
          setEntryModalVisible(false);
        }}
      />
      <EditScheduleModal2
        visible={editModalVisible}
        entry={selectedEntry}
        currentSchedule={blocks.map((b, i) => ({
          id: `b-${i}`,
          subject: b.subject,
          type: b.type === "T" || b.type === "P" ? (b.type as "T" | "P") : "T",
          building: b.building,
          room: b.room,
          day: DAYS[b.dayIndex],
          start: b.start,
          end: b.start + b.duration,
        }))}
        onClose={() => {
          setEditModalVisible(false);
        }}
        onSave={(updated) => {
          if (selectedBlockIndex !== null) {
            setBlocks((prev) => prev.map((b, i) => {
              if (i !== selectedBlockIndex) return b;
              const dayIndex = DAYS.indexOf(updated.day);
              return {
                dayIndex,
                start: updated.start,
                duration: updated.end - updated.start,
                subject: updated.subject,
                building: updated.building,
                room: updated.room,
                type: updated.type,
              };
            }));
          }
          setSelectedEntry(updated);
          setEditModalVisible(false);
        }}
      />
      <UploadScheduleModal
        visible={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        onUpload={(schedule: ScheduleEntry[]) => {
          // Convert uploaded schedule entries into GridBlocks
          const newBlocks = schedule.map((e) => {
            const dayIndex = DAYS.indexOf(e.day);
            return {
              dayIndex,
              start: e.start,
              duration: e.end - e.start,
              subject: e.subject,
              building: e.building,
              room: e.room,
              type: e.type,
            } as GridBlock;
          });
          setBlocks(newBlocks);
          setUploadModalVisible(false);
          clearSelection();
        }}
      />
    </SafeAreaView>
  );
}
