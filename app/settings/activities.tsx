import Card from "@/app/src/components/Card";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, Text, TextInput, View } from "react-native";

import { loadActivities, saveActivities } from "@/app/src/storage/storageRepo";
import type { Activity } from "@/app/src/types";

const COLOR_PRESETS = [
  "#8aa2dbff", "#a4ebaeff", "#f1ad68ff", "#e0b2f3ff", "#466b9cff", "#e5d29eff", "#f6b9d8ff", "#b8bcc4ff"
];

export default function ActivitiesScreen() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [name, setName] = useState("");
  const [colorHex, setColorHex] = useState(COLOR_PRESETS[0]);

  useEffect(() => {
    (async () => {
      const a = await loadActivities();
      setActivities(a ?? []);
    })();
  }, []);

  const nextSortOrder = useMemo(() => {
    const max = activities.reduce((m, a) => Math.max(m, a.sortOrder ?? 0), 0);
    return max + 1;
  }, [activities]);

  const persist = async (next: Activity[]) => {
    setActivities(next);
    await saveActivities(next);
  };

  const addActivity = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const id = trimmed.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now().toString(36);

    const next: Activity[] = [
      ...activities,
      { id, name: trimmed, colorHex, sortOrder: nextSortOrder },
    ].sort((a, b) => a.sortOrder - b.sortOrder);

    await persist(next);

    setName("");
    setColorHex(COLOR_PRESETS[0]);
  };

  const confirmDelete = (id: string) => {
    Alert.alert("Delete activity?", "Records will be handled later (Unknown policy).", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const next = activities.filter((a) => a.id !== id);
          await persist(next);
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Activity }) => {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: "#E5E7EB",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: item.colorHex,
            }}
          />
          <Text style={{ fontWeight: "700" }}>{item.name}</Text>
        </View>

        <Pressable onPress={() => confirmDelete(item.id)} hitSlop={10}>
          <Text style={{ color: "#EF4444", fontWeight: "800" }}>Delete</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 12, backgroundColor: "#EFF3FA" }}>
      <Card title="Add Activity">
        <View style={{ gap: 10 }}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Activity name"
            placeholderTextColor="#9CA3AF"
            style={{
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 12,
              backgroundColor: "#F3F4F6",
            }}
          />

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {COLOR_PRESETS.map((c) => {
              const selected = c === colorHex;
              return (
                <Pressable
                  key={c}
                  onPress={() => setColorHex(c)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: c,
                    borderWidth: selected ? 3 : 1,
                    borderColor: selected ? "#111" : "#E5E7EB",
                  }}
                />
              );
            })}
          </View>

          <Pressable
            onPress={addActivity}
            style={{
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: "#111",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#FFF", fontWeight: "800" }}>Add</Text>
          </Pressable>
        </View>
      </Card>

      <Card title={`Activities (${activities.length})`}>
        <FlatList
          data={activities}
          keyExtractor={(a) => a.id}
          renderItem={renderItem}
        />
      </Card>
    </View>
  );
}
