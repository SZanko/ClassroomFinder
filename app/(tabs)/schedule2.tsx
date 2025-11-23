import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

import { View, Text, TouchableOpacity, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, FontAwesome } from "@expo/vector-icons";

import {
  DAYS,
  HOURS_MAP,
  ScheduleEntry,
} from "../../assets/data/sample-schedule";
import { AddManualScheduleModal } from "../../components/modals/add-manually-modal";

// Build HOURS array by index from HOURS_MAP (second method)
const HOURS: string[] = (() => {
  const arr: string[] = [];
  Object.entries(HOURS_MAP).forEach(([label, idx]) => {
    arr[idx as number] = label;
  });
  return arr;
})();

// Fixed height for the schedule grid (increase as requested)
// const GRID_HEIGHT = 640; // adjust this value if you want it even taller
const GRID_HEIGHT = 640; // adjust this value if you want it even taller

// Local shape for painted blocks on the grid
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
  const [manualVisible, setManualVisible] = useState(false);
  const [blocks, setBlocks] = useState<GridBlock[]>([]);
  const [clickedExistingBlock, setClickedExistingBlock] = useState(false);

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
    const block = getBlockAt(cell.row, cell.col);
    if (block) {
      console.log(`${block.subject} ${block.building} ${block.room}`);
      setClickedExistingBlock(true);
      clearSelection();
      setIsSelecting(false);
      return;
    }
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
    if (selectedCells.size > 0) setManualVisible(true);
  };
  const onGridLayout = (e: any) => {
    const { width, height } = e.nativeEvent.layout || {};
    if (width && height) setGridSize({ width, height });
  };

  const selectionToBlocks = (entry: ScheduleEntry): GridBlock[] => {
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
            type: entry.type
          });
          start = cur;
        }
        prev = cur;
      }
    });
    return newBlocks;
  };

  // Color helper: 'T' -> light blue, 'P' -> dark blue
  const getColorsForBlock = (b: GridBlock) => {
    const subj = b.subject || "";
    if (subj.includes("P")) return { bg: "#0A3069", fg: "#fff" }; // practical -> dark
    if (subj.includes("T")) return { bg: "#cce5ff", fg: "#0A3069" }; // theoretical -> light
    return { bg: "#DDEBFF", fg: "#0A3069" }; // default
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
                <View
                  key={`block-${i}`}
                  pointerEvents="none"
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
                </View>
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
                    console.log("Upload Schedule");
                    setIsMenuOpen(false);
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
                    console.log("Add Manually");
                    setIsMenuOpen(false);
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

      {/* Manual Add Modal */}
      <AddManualScheduleModal
        visible={manualVisible}
        onClose={() => {
          setManualVisible(false);
          clearSelection();
        }}
        onAdd={(entry: any) => {
          const newBlocks = selectionToBlocks(entry as ScheduleEntry);
          setBlocks((prev) => {
            const next = [...prev, ...newBlocks];
            return next;
          });
          setManualVisible(false);
          clearSelection();
        }}
        currentSchedule={[] as unknown as ScheduleEntry[]}
      />
    </SafeAreaView>
  );
}
