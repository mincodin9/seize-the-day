import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View
} from "react-native";

import { bootstrap } from "@/app/src/storage/storageRepo";
import type { Activity, DailyRecord, Settings, TaskCard } from "@/app/src/types";
import { calcTotalSlots, getTodayKey, slotLabel, timeToMinutes } from "@/app/src/utils/slots";
import DraggableFlatList, {
  RenderItemParams,
} from "react-native-draggable-flatlist";

//Local types
type Cell = { activityId: string | null };
type DragMode = "PAINT" | "ERASE";

const SLOT_ROW_H = 20;
const TIME_COL_W = 54;

export default function Index() {
  //Data
  const [activities, setActivities] = useState<Activity[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [record, setRecord] = useState<DailyRecord | null>(null);

  //State
  const [selectedActivityId, setSelectedActivityId] = useState<string>(
    activities[0]?.id ?? ""
  );

  //One-body toggle: PAINT<->ERASE
  const [mode, setMode] = useState<DragMode>("PAINT");
  const isErase = mode === "ERASE";

  //Day-level skip lock(excluded from stats)
  const [daySkipped, setDaySkipped] = useState(false);

  const [cells, setCells] = useState<Cell[]>([]);

  const [cards, setCards] = useState<TaskCard[]>([
    {
      id: Date.now().toString(),
      title: "Today Tasks",
      items: [{ id: Date.now().toString(), text: "", done: false }],
    },
  ]);

  //Undo(1 step) - STATE for reliable rerender
  const undoRef = useRef<Cell[] | null>(null);
  const [canUndo, setCanUndo] = useState(false);

  const saveUndoSnapshot = (snapshot: Cell[]) => {
    undoRef.current = snapshot;
    setCanUndo(true);
  };

  const doUndo = () => {
    const snap = undoRef.current;
    if (!snap) return;
    setCells(snap);
    undoRef.current = null;
    setCanUndo(false);
  };

  //Refs for timeline drag
  const paintingRef = useRef(false);
  const startIdxRef = useRef<number | null>(null);
  const baseCellsRef = useRef<Cell[] | null>(null);
  const scrollYRef = useRef(0);

  //Refs for focusing next TextInput
  const inputRefs = useRef<Record<string, TextInput | null>>({});

  //Settings
  const hydrate = useCallback(async () => {
    const todayKey = getTodayKey();
    const data = await bootstrap(todayKey);

    setActivities(data.activities);
    setSettings(data.settings);
    setRecord(data.record);
    setSelectedActivityId((prev) => prev || data.activities[0]?.id || "");

    const slots = calcTotalSlots(data.settings);
    const loadedCells: Cell[] = (data.record as any).cells ?? [];
    const fixed = Array.from({ length: slots }, (_, i) => loadedCells[i] ?? { activityId: null });
    setCells(fixed);
  }, []);

  useFocusEffect(
    useCallback(() => {
      hydrate();
    }, [hydrate])
  );

  const startMin = useMemo(() => {
    if (!settings) return 0;
    return timeToMinutes(settings.startTime);
  }, [settings]);

  const totalSlots = useMemo(() => {
    if (!settings) return 0;
    return calcTotalSlots(settings);
  }, [settings]);

  const startTime = settings?.startTime ?? "--:--";
  const endTime = settings?.endTime ?? "--:--";

  //Derived
  const activityById = useMemo(() => {
    const m = new Map<string, Activity>();
    for (const a of activities) m.set(a.id, a);
    return m;
  }, [activities]);

  //Cards/Checklist handlers
  const addTaskCard = () => {
    setCards((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        title: "New Card",
        items: [{ id: Date.now().toString(), text: "", done: false }],
      },
    ]);
  };

  const removeTaskCard = (cardId: string) => {
    setCards((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((c) => c.id !== cardId);
    });
  };

  const confirmRemoveCard = (cardId: string) => {
    Alert.alert("Delete card?", "This will remove all tasks in this card.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => removeTaskCard(cardId) },
    ]);
  };

  const updateCardTitle = (cardId: string, title: string) => {
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, title } : c)));
  };

  const toggleItemDone = (cardId: string, itemId: string) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId
          ? { ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)) }
          : c
      )
    );
  };

  const updateItemText = (cardId: string, itemId: string, text: string) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId
          ? { ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, text } : i)) }
          : c
      )
    );
  };

  const addItemAfter = (cardId: string, itemId: string) => {
    const newId = Date.now().toString();

    setCards((prev) =>
      prev.map((card) => {
        if (card.id !== cardId) return card;
        const idx = card.items.findIndex((i) => i.id === itemId);
        if (idx === -1) return card;

        const items = [...card.items];
        items.splice(idx + 1, 0, { id: newId, text: "", done: false });
        return { ...card, items };
      })
    );

    return newId;
  };

  const removeTaskItem = (cardId: string, itemId: string) => {
    setCards((prev) =>
      prev.map((c) => {
        if (c.id !== cardId) return c;

        if (c.items.length <= 1) return c;
        const items = c.items.filter((i) => i.id !== itemId);
        return {
          ...c,
          items: items.length ? items : [{ id: Date.now().toString(), text: "", done: false }],
        };
      })
    );
  };

  //Timeline handlers
  const onPressSlot = (idx: number) => {
    //Skip lock: block all interactions
    if (daySkipped) return;

    setCells((prev) => {
      saveUndoSnapshot(prev);

      const next = [...prev];
      const cur = next[idx];

      if (isErase) {
        next[idx] = { activityId: null };
        return next;
      }

      if (!selectedActivityId) return prev;

      //Paint mode: tap again on same activity=>erase(toggle)
      next[idx] = {
        activityId: cur.activityId === selectedActivityId ? null : selectedActivityId,
      };
      return next;
    });
  };

  const yToIdx = (y: number) => {
    const yInContent = y + scrollYRef.current;
    const idx = Math.floor(yInContent / SLOT_ROW_H);
    if (idx < 0) return 0;
    if (idx >= totalSlots) return totalSlots - 1;
    return idx;
  };

  const applyContiguousFromStart = (currentIdx: number) => {
    const start = startIdxRef.current;
    const base = baseCellsRef.current;
    if (start == null || !base) return;

    const a = Math.min(start, currentIdx);
    const b = Math.max(start, currentIdx);

    const next = base.slice();

    for (let i = a; i <= b; i++) {
      if (isErase) {
        next[i] = { activityId: null };
      } else {
        if (!selectedActivityId) continue;
        next[i] = { activityId: selectedActivityId };
      }
    }
    setCells(next);
  };

  const clearTimeline = () => {
    if (!daySkipped) saveUndoSnapshot(cells);
    setCells(() => Array.from({ length: totalSlots }, () => ({ activityId: null })));
  };

  //Render helpers
  const renderSlot = ({ item: idx }: { item: number }) => {
    const cell = cells[idx] ?? { activityId: null };
    const activity = cell.activityId ? activityById.get(cell.activityId) : undefined;

    const bg = activity?.colorHex ?? "#EEF2F7";
    const label = idx % 2 === 0 ? slotLabel(startMin, idx) : "";

    return (
      <Pressable onPress={() => onPressSlot(idx)} style={styles.slotRow}>
        <Text style={styles.timeText}>{label}</Text>
        <View style={[styles.slotBar, { backgroundColor: bg }]} />
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.twoCol}>
        {/* LEFT: Cards+Paint */}
        <View style={styles.leftPane}>
          {cards.map((card, index) => (
            <View key={card.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <TextInput
                  value={card.title}
                  onChangeText={(t) => updateCardTitle(card.id, t)}
                  style={styles.cardTitleInput}
                  placeholder="Card title"
                  placeholderTextColor="#9CA3AF"
                />

                {index === 0 ? (
                  <Pressable style={styles.iconBtn} onPress={addTaskCard} hitSlop={10}>
                    <Text style={styles.iconPlus}>＋</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={styles.iconBtn}
                    onPress={() => confirmRemoveCard(card.id)}
                    hitSlop={10}
                  >
                    <Text style={styles.iconX}>✕</Text>
                  </Pressable>
                )}
              </View>

              <View style={styles.underline} />

              <DraggableFlatList
                data={card.items}
                keyExtractor={(item) => item.id}
                activationDistance={12}
                onDragEnd={({ data }) => {
                  setCards((prev) =>
                    prev.map((c) => (c.id === card.id ? { ...c, items: data } : c))
                  );
                }}
                renderItem={({
                  item,
                  drag,
                  isActive,
                }: RenderItemParams<(typeof card.items)[number]>) => (
                  <View style={[styles.taskRow, isActive && { opacity: 0.7 }]}>
                    <Pressable
                      onPress={() => toggleItemDone(card.id, item.id)}
                      onLongPress={drag}
                      delayLongPress={150}
                      hitSlop={8}
                      style={[styles.checkbox, item.done && styles.checkboxDone]}
                    />

                    <TextInput
                      ref={(ref) => {
                        inputRefs.current[item.id] = ref;
                      }}
                      value={item.text}
                      placeholder="Write task..."
                      onChangeText={(t) => updateItemText(card.id, item.id, t)}
                      returnKeyType="done"
                      blurOnSubmit={false}
                      onSubmitEditing={() => {
                        if (!item.text.trim()) return;
                        const newId = addItemAfter(card.id, item.id);
                        requestAnimationFrame(() => inputRefs.current[newId]?.focus());
                      }}
                      style={[styles.taskInput, item.done && styles.taskDoneText]}
                    />

                    <Pressable
                      onPress={() => removeTaskItem(card.id, item.id)}
                      style={styles.deleteBtn}
                      hitSlop={10}
                    >
                      <Text style={styles.deleteBtnText}>✕</Text>
                    </Pressable>
                  </View>
                )}
              />
            </View>
          ))}

          <View style={styles.card}>
            <View style={styles.paintHeader}>
              <Text style={styles.cardTitle}>Paint</Text>

              <Pressable
                onPress={() => setDaySkipped((v) => !v)}
                style={[styles.skipPill, daySkipped && styles.skipPillActive]}
              >
                <Text style={[styles.skipText, daySkipped && styles.skipTextActive]}>
                  Skip
                </Text>
              </Pressable>
            </View>

            {/* Actions */}
            <View style={styles.paintActions}>
              <Pressable
                disabled={daySkipped}
                onPress={() => setMode((m) => (m === "PAINT" ? "ERASE" : "PAINT"))}
                style={[
                  styles.pill,
                  { backgroundColor: "#111", opacity: daySkipped ? 0.4 : 1 },
                ]}
              >
                <Text style={{ color: "#FFF", fontWeight: "700" }}>
                  {mode === "PAINT" ? "Record" : "Erase"}
                </Text>
              </Pressable>

              <Pressable
                onPress={doUndo}
                disabled={!canUndo || daySkipped}
                style={[
                  styles.clearPill,
                  { opacity: !canUndo || daySkipped ? 0.4 : 1 },
                ]}
              >
                <Text style={styles.clearText}>Undo</Text>
              </Pressable>

              <Pressable
                onPress={clearTimeline}
                disabled={daySkipped}
                style={[styles.clearPill, { opacity: daySkipped ? 0.4 : 1 }]}
              >
                <Text style={styles.clearText}>Clear</Text>
              </Pressable>
            </View>

            {/* Palette */}
            <FlatList
              data={activities}
              horizontal
              keyExtractor={(a) => a.id}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => {
                const selected = item.id === selectedActivityId;
                return (
                  <Pressable
                    disabled={daySkipped}
                    onPress={() => setSelectedActivityId(item.id)}
                    style={[
                      styles.paletteItem,
                      {
                        borderColor: selected ? "#111" : "transparent",
                        backgroundColor: item.colorHex,
                        opacity: daySkipped ? 0.4 : 1,
                      },
                    ]}
                  >
                    <Text style={styles.paletteText}>{item.name}</Text>
                  </Pressable>
                );
              }}
            />
          </View>
        </View>

        {/* RIGHT: Timeline */}
        <View style={styles.rightPane}>
          <View style={styles.rightHeader}>
            <Text style={styles.rightTitle}>
              {startTime} → {endTime}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <FlatList
              data={Array.from({ length: totalSlots }, (_, i) => i)}
              keyExtractor={(i) => String(i)}
              renderItem={renderSlot}
              contentContainerStyle={styles.timeline}
              scrollEventThrottle={16}
              onScroll={(e) => {
                scrollYRef.current = e.nativeEvent.contentOffset.y;
              }}
            />

            <View
              style={styles.paintOverlay}
              pointerEvents={daySkipped ? "none" : "box-only"}
              onStartShouldSetResponder={() => !daySkipped}
              onMoveShouldSetResponder={() => !daySkipped}
              onResponderGrant={(e) => {
                if (daySkipped) return;

                paintingRef.current = true;

                const idx = yToIdx(e.nativeEvent.locationY);
                startIdxRef.current = idx;
                baseCellsRef.current = cells;

                saveUndoSnapshot(cells);
                applyContiguousFromStart(idx);
              }}
              onResponderMove={(e) => {
                if (daySkipped) return;
                if (!paintingRef.current) return;
                const idx = yToIdx(e.nativeEvent.locationY);
                applyContiguousFromStart(idx);
              }}
              onResponderRelease={() => {
                paintingRef.current = false;
                startIdxRef.current = null;
                baseCellsRef.current = null;
              }}
              onResponderTerminate={() => {
                paintingRef.current = false;
                startIdxRef.current = null;
                baseCellsRef.current = null;
              }}
            />

            {daySkipped && (
              <View style={styles.skipLockOverlay} pointerEvents="auto">
                <Text style={styles.skipLockText}>Skipped (excluded from stats)</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

//Styles
const styles = {
  screen: { flex: 1, padding: 12, backgroundColor: "#EFF3FA" },
  twoCol: { flex: 1, flexDirection: "row", gap: 10 },
  leftPane: { width: 280, gap: 10 },
  rightPane: { flex: 1 },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },

  paintHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardTitle: { fontSize: 14, fontWeight: "800", marginBottom: 8 },
  skipPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  skipPillActive: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  skipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111",
  },
  skipTextActive: {
    color: "#FFF",
  },

  cardTitleInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
    paddingVertical: 6,
    paddingHorizontal: 2,
  },

  iconBtn: {
    width: 17,
    height: 17,
    borderRadius: 5,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  iconPlus: { fontSize: 10, fontWeight: "600", color: "#fff", lineHeight: 10 },
  iconX: { fontSize: 10, fontWeight: "900", color: "#fff", lineHeight: 10 },

  underline: { height: 1, backgroundColor: "#E5E7EB", marginBottom: 10 },

  paintActions: { flexDirection: "row", gap: 8, marginBottom: 10, alignItems: "center" },
  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  clearPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  clearText: { fontWeight: "800", fontSize: 12, color: "#111" },

  paletteItem: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
    borderWidth: 2,
  },
  paletteText: { fontWeight: "800", color: "#111", fontSize: 12 },

  rightHeader: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  rightTitle: { fontWeight: "600", fontSize: 10 },
  timeline: { paddingBottom: 20 },

  slotRow: { height: SLOT_ROW_H, flexDirection: "row", alignItems: "center" },
  timeText: { width: 54, fontSize: 11, opacity: 0.55 },
  slotBar: { flex: 1, height: 16, borderRadius: 6 },

  paintOverlay: {
    position: "absolute",
    top: 0,
    left: TIME_COL_W,
    right: 0,
    bottom: 0,
  },

  skipLockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(229,231,235,0.55)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 50,
  },
  skipLockText: {
    color: "#111",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },

  taskRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#111",
    marginRight: 8,
  },
  checkboxDone: { backgroundColor: "#111" },

  taskInput: { flex: 1, fontSize: 13, paddingVertical: 4 },
  taskDoneText: { textDecorationLine: "line-through", opacity: 0.4 },

  deleteBtn: {
    width: 14,
    height: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    marginLeft: 3,
  },
  deleteBtnText: { fontSize: 9, fontWeight: "400", color: "#111", lineHeight: 9 },
} as const;
