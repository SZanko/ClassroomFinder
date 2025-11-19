import React, { useState } from "react";
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

// Local shape for painted blocks on the grid
type GridBlock = {
  dayIndex: number; // 0..4 for MON..FRI
  start: number; // hour index 0..15
  duration: number; // number of slots
  subject: string;
};

export default function ScheduleScreen() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);

  const [gridSize, setGridSize] = useState({ width: 0, height: 0 });
  const [manualVisible, setManualVisible] = useState(false);
  const [blocks, setBlocks] = useState<GridBlock[]>([]);

  const clearSelection = () => setSelectedCells(new Set());

  const getKey = (r: number, c: number) => `${r}-${c}`;
  const isCellSelected = (r: number, c: number) =>
    selectedCells.has(getKey(r, c));

  // Find grid block covering a given non-header cell
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

  const TOTAL_ROWS = 17;
  const TOTAL_COLS = 6;
  const pointToCell = (x: number, y: number) => {
    const { width, height } = gridSize;
    if (!width || !height) return null;
    const col = Math.floor((x / width) * TOTAL_COLS);
    const row = Math.floor((y / height) * TOTAL_ROWS);
    if (row <= 0 || col <= 0) return null; // ignore headers
    return { row, col } as const;
  };

  const addCell = (row: number, col: number) => {
    setSelectedCells((prev) => {
      const key = getKey(row, col);
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  };

  const handleGridGrant = (e: any) => {
    setIsSelecting(true);
    const { locationX, locationY } = e.nativeEvent;
    const cell = pointToCell(locationX, locationY);
    if (cell) addCell(cell.row, cell.col);
  };
  const handleGridMove = (e: any) => {
    if (!isSelecting) return;
    const { locationX, locationY } = e.nativeEvent;
    const cell = pointToCell(locationX, locationY);
    if (cell) addCell(cell.row, cell.col);
  };
  const handleGridRelease = () => {
    setIsSelecting(false);
    if (selectedCells.size > 0) setManualVisible(true);
  };
  const onGridLayout = (e: any) => {
    const { width, height } = e.nativeEvent.layout || {};
    if (width && height) setGridSize({ width, height });
  };

  // Convert current selection into vertical blocks per day
  const selectionToBlocks = (subject: string): GridBlock[] => {
    const perCol = new Map<number, number[]>();
    selectedCells.forEach((key) => {
      const [r, c] = key.split("-").map((n) => parseInt(n, 10));
      if (r === 0 || c === 0) return; // skip headers
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
          // finalize segment [start..prev]
          const startHour = start - 1;
          const duration = prev - start + 1;
          newBlocks.push({
            dayIndex: c - 1,
            start: startHour,
            duration,
            subject,
          });
          start = cur;
        }
        prev = cur;
      }
    });
    return newBlocks;
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
            flex: 1,
            marginTop: 16,
            borderWidth: 1,
            borderColor: "#000",
            borderRadius: 12,
            overflow: "hidden",
            // @ts-ignore RN Web: avoid text selection while dragging
            userSelect: "none",
          }}
        >
          {Array.from({ length: 17 }).map((_, rowIndex) => (
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
                      {/* Days */}
                      {rowIndex === 0 && colIndex > 0 ? (
                        <Text style={{ fontWeight: "600", color: "#333" }}>
                          {DAYS[colIndex - 1] ?? ""}
                        </Text>
                      ) : null}
                      {/* Hours */}
                      {rowIndex > 0 && colIndex === 0 ? (
                        <Text style={{ fontWeight: "600", color: "#333" }}>
                          {HOURS[rowIndex - 1] ?? ""}
                        </Text>
                      ) : null}
                    </View>
                  );
                }

                const covering = getBlockAt(rowIndex, colIndex);
                const hour = rowIndex - 1;
                const isTopOfBlock = covering ? hour === covering.start : false;
                const inBlock = !!covering;

                const bgColor = inBlock
                  ? "#DDEBFF"
                  : isCellSelected(rowIndex, colIndex)
                  ? "#cce5ff"
                  : "#fff";

                const borderTopWidth = inBlock && !isTopOfBlock ? 0 : 0.5;

                return (
                  <View
                    key={`cell-${rowIndex}-${colIndex}`}
                    style={{
                      flex: 1,
                      borderWidth: 0.5,
                      borderTopWidth,
                      borderColor: "#000",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: bgColor,
                      // @ts-ignore
                      cursor: "pointer",
                      paddingHorizontal: 4,
                    }}
                  >
                    {isTopOfBlock && (
                      <Text
                        numberOfLines={1}
                        style={{ fontWeight: "700", color: "#0A3069" }}
                      >
                        {covering?.subject}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
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
          }}
        >
          {/* Change Schedule Button */}
          <View
            style={{
              alignSelf: "flex-start",
              backgroundColor: "#fff",
              borderWidth: 1,
              borderColor: "#007AFF",
              borderRadius: 12,
              overflow: "hidden",
              position: "absolute",
            }}
          >
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 10,
                paddingHorizontal: 15,
                backgroundColor: "#007AFF",
                height: 60,
                width: 180,

                // borderRadius: 12,
              }}
              onPress={() => setIsMenuOpen(!isMenuOpen)}
            >
              {/* <Ionicons
                name={
                  isMenuOpen ? "remove-circle-outline" : "add-circle-outline"
                }
                size={24}
                color="#fff"
              /> */}
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

          {/* Navigation button */}
          <View
            style={{
              position: "absolute",
              right: 0,
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
          const subject = entry?.subject ?? "";
          const newBlocks = selectionToBlocks(subject);
          setBlocks((prev) => [...prev, ...newBlocks]);
          setManualVisible(false);
          clearSelection();
        }}
        currentSchedule={[] as unknown as ScheduleEntry[]}
      />
    </SafeAreaView>
  );
}
