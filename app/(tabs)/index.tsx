import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from "react-native";

import { seedActivities } from "@/app/src/seed/seed";
import type { TaskCard } from "@/app/src/types";
import DraggableFlatList, { RenderItemParams } from "react-native-draggable-flatlist";

//Local types=
type Activity = { id: string; name: string; colorHex: string; sortOrder: number };
type Cell = { activityId: string | null };

//Time utils
function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function slotLabel(startMin: number, idx: number) {
  const m = startMin + idx * 30;
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${pad2(hh)}:${pad2(mm)}`;
}

export default function Index() {
  //Data=
  const activities = seedActivities;

  //Settings(TODO: load from Settings screen)
  const startTime = "08:00";
  const endTime = "26:00";

  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  const totalSlots = Math.max(0, Math.floor((endMin - startMin) / 30));

  //State
  const [selectedActivityId, setSelectedActivityId] = useState<string>(activities[0]?.id ?? "");
  const [skipMode, setSkipMode] = useState(false);

  //Refs for focusing next TextInput
  const inputRefs = useRef<Record<string, TextInput | null>>({});

  const [cells, setCells] = useState<Cell[]>(
    () => Array.from({ length: totalSlots }, () => ({ activityId: null }))
  );

  const [cards, setCards] = useState<TaskCard[]>([
    {
      id: Date.now().toString(),
      title: "Today Tasks",
      items: [{ id: Date.now().toString(), text: "", done: false }],
    },
  ]);

  //Derived
  const activityById = useMemo(() => {
    const m = new Map<string, Activity>();
    for (const a of activities) m.set(a.id, a);
    return m;
  }, [activities]);

  //Handlers-Cards/Checklist
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
      //Keep at least 1 card
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
        c.id === cardId ? { ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, text } : i)) } : c
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

        //Keep at least 1 row
        if (c.items.length <= 1) return c;

        const items = c.items.filter((i) => i.id !== itemId);
        return {
          ...c,
          items: items.length ? items : [{ id: Date.now().toString(), text: "", done: false }],
        };
      })
    );
  };

  //Handlers-Timeline
  const onPressSlot = (idx: number) => {
    if (skipMode) return;

    setCells((prev) => {
      const next = [...prev];
      const cur = next[idx];

      if (!selectedActivityId) return prev;

      //Toggle fill/clear
      next[idx] = {
        activityId: cur.activityId === selectedActivityId ? null : selectedActivityId,
      };
      return next;
    });
  };

  const clearTimeline = () => {
    setCells(() => Array.from({ length: totalSlots }, () => ({ activityId: null })));
  };

  //Render helpers
  const renderSlot = ({ item: idx }: { item: number }) => {
    const cell = cells[idx];
    const activity = cell.activityId ? activityById.get(cell.activityId) : undefined;

    const bg = skipMode ? "#E5E7EB" : activity?.colorHex ?? "#EEF2F7";
    const label = idx % 2 === 0 ? slotLabel(startMin, idx) : "";

    return (
      <Pressable
        onPress={() => onPressSlot(idx)}
        disabled={skipMode}
        style={[styles.slotRow, skipMode && { opacity: 0.6 }]}
      >
        <Text style={styles.timeText}>{label}</Text>
        <View style={[styles.slotBar, { backgroundColor: bg }]} />
      </Pressable>
    );
  };

  //UI
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.twoCol}>
        {/* LEFT: Cards + Paint */}
        <View style={styles.leftPane}>
          {cards.map((card, index) => (
            <View key={card.id} style={styles.card}>
              {/* Card header */}
              <View style={styles.cardHeader}>
                <TextInput
                  value={card.title}
                  onChangeText={(t) => updateCardTitle(card.id, t)}
                  style={styles.cardTitleInput}
                  placeholder="Card title"
                  placeholderTextColor="#9CA3AF"
                />

                {/* First card: add card, others: delete card */}
                {index === 0 ? (
                  <Pressable style={styles.iconBtn} onPress={addTaskCard} hitSlop={10}>
                    <Text style={styles.iconPlus}>＋</Text>
                  </Pressable>
                ) : (
                  <Pressable style={styles.iconBtn} onPress={() => confirmRemoveCard(card.id)} hitSlop={10}>
                    <Text style={styles.iconX}>✕</Text>
                  </Pressable>
                )}
              </View>

              <View style={styles.underline} />

              {/* Reorderable checklist */}
              <DraggableFlatList
                data={card.items}
                keyExtractor={(item) => item.id}
                activationDistance={12}
                onDragEnd={({ data }) => {
                  setCards((prev) =>
                    prev.map((c) => (c.id === card.id ? { ...c, items: data } : c))
                  );
                }}
                renderItem={({ item, drag, isActive }: RenderItemParams<(typeof card.items)[number]>) => (
                  <View style={[styles.taskRow, isActive && { opacity: 0.7 }]}>
                    {/* Checkbox: tap = toggle, long press = drag */}
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
                        requestAnimationFrame(() => {
                          inputRefs.current[newId]?.focus();
                        });
                      }}
                      style={[styles.taskInput, item.done && styles.taskDoneText]}
                    />

                    <Pressable onPress={() => removeTaskItem(card.id, item.id)} style={styles.deleteBtn} hitSlop={10}>
                      <Text style={styles.deleteBtnText}>✕</Text>
                    </Pressable>
                  </View>
                )}
              />
            </View>
          ))}

          {/* Paint */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Paint</Text>

            <View style={styles.paintActions}>
              <Pressable
                onPress={() => setSkipMode((v) => !v)}
                style={[styles.pill, { backgroundColor: skipMode ? "#111" : "#EEE" }]}
              >
                <Text style={{ color: skipMode ? "#FFF" : "#111", fontWeight: "600" }}>
                  {skipMode ? "Skip" : "Record"}
                </Text>
              </Pressable>

              <Pressable onPress={clearTimeline} style={styles.clearPill}>
                <Text style={styles.clearText}>Clear</Text>
              </Pressable>
            </View>

            <FlatList
              data={activities}
              horizontal
              keyExtractor={(a) => a.id}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => {
                const selected = item.id === selectedActivityId;
                return (
                  <Pressable
                    disabled={skipMode}
                    onPress={() => setSelectedActivityId(item.id)}
                    style={[
                      styles.paletteItem,
                      {
                        borderColor: selected ? "#111" : "transparent",
                        backgroundColor: item.colorHex,
                        opacity: skipMode ? 0.5 : 1,
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
          {skipMode && (
            <View style={styles.skipOverlay}>
              <Text style={styles.skipText}>Skipped time range</Text>
            </View>
          )}

          <View style={styles.rightHeader}>
            <Text style={styles.rightTitle}>
              {startTime} → {endTime}
            </Text>
          </View>

          <FlatList
            data={Array.from({ length: totalSlots }, (_, i) => i)}
            keyExtractor={(i) => String(i)}
            renderItem={renderSlot}
            contentContainerStyle={styles.timeline}
          />
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

  cardTitle: { fontSize: 14, fontWeight: "800", marginBottom: 8 },

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

  slotRow: { flexDirection: "row", alignItems: "center", paddingVertical: 3 },
  timeText: { width: 54, fontSize: 11, opacity: 0.55 },
  slotBar: { flex: 1, height: 16, borderRadius: 6 },

  skipOverlay: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  skipText: {
    color: "#111",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 14,
    fontWeight: "700",
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
