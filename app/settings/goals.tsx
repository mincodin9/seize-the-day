import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Card from "../src/components/Card";
import { loadActivities, loadGoals, saveGoals } from "../src/storage/storageRepo";
import type { Activity, Goal } from "../src/types";

export default function GoalsScreen() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string>("");
  const [selectedMinutes, setSelectedMinutes] = useState<number>(60);
  const [openActivityDropdown, setOpenActivityDropdown] = useState(false);
  const [openMinutesDropdown, setOpenMinutesDropdown] = useState(false);

  const hydrate = useCallback(async () => {
    const loadedActivities = (await loadActivities()) ?? [];
    const loadedGoals = (await loadGoals()) ?? [];

    setActivities(loadedActivities);
    setGoals(loadedGoals);

    const enabled = loadedGoals.find(g => g.isEnabled);
    const activityId = enabled?.activityId ?? loadedActivities[0]?.id ?? "";
    const mins = enabled?.targetMinutesPerDay ?? 60;

    setSelectedActivityId(activityId);
    setSelectedMinutes(mins);
  }, []);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const safeActivities = (await loadActivities()) ?? [];
        const safeGoals = (await loadGoals()) ?? [];

        setActivities(safeActivities);
        setGoals(safeGoals);

        const g = safeGoals[0];
        setSelectedActivityId(g?.activityId ?? safeActivities[0]?.id ?? "");
        setSelectedMinutes(g?.targetMinutesPerDay ?? 60);
      })();
    }, [])
  );

  useEffect(() => {
    (async () => {
      const loadedActivities = await loadActivities();
      const loadedGoals = await loadGoals();
      const safeActivities = loadedActivities ?? [];
      const safeGoals = loadedGoals ?? [];

      setActivities(safeActivities);
      setGoals(safeGoals);

      const firstGoal = safeGoals[0];
      const initialActivityId = firstGoal?.activityId ?? safeActivities[0]?.id ?? "";
      setSelectedActivityId(initialActivityId);
      setSelectedMinutes(firstGoal?.targetMinutesPerDay ?? 60);
    })();
  }, []);

  const activityLabel = useMemo(() => {
    const target = activities.find((a) => a.id === selectedActivityId);
    return target?.name ?? "Select activity";
  }, [activities, selectedActivityId]);

  const minuteOptions = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => (i + 1) * 30);
  }, []);

  const onSelectActivity = (id: string) => {
    setSelectedActivityId(id);
    const goal = goals.find((g) => g.activityId === id);
    setSelectedMinutes(goal?.targetMinutesPerDay ?? 60);
    setOpenActivityDropdown(false);
  };

  const onSelectMinutes = (mins: number) => {
    setSelectedMinutes(mins);
    setOpenMinutesDropdown(false);
  };

  const onSave = async () => {
    if (!selectedActivityId) return;

    const next: Goal[] = [
      {
        id: "goal_daily",
        activityId: selectedActivityId,
        targetMinutesPerDay: selectedMinutes,
        isEnabled: true,
      },
    ];

    setGoals(next);
    await saveGoals(next);
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 12, backgroundColor: "#EFF3FA" }}>
      <Card title="Daily Goal">
        <View style={{ gap: 10 }}>
          <Text style={{}}>Choose Activity</Text>
          {!activities.length ? (
            <Text style={{ opacity: 0.6 }}>No activities yet. Add one first.</Text>
          ) : (
            <View style={{ gap: 8 }}>
              <Pressable
                onPress={() => setOpenActivityDropdown((prev) => !prev)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: "#F3F4F6",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                }}
              >
                <Text style={{ fontWeight: "700" }}>{activityLabel}</Text>
              </Pressable>

              {openActivityDropdown && (
                <View
                  style={{
                    borderRadius: 12,
                    backgroundColor: "#FFF",
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    overflow: "hidden",
                    maxHeight: 220, // ✅ 대략 5개 정도 보이게
                  }}
                >
                  <ScrollView nestedScrollEnabled>
                    {activities.map((activity) => {
                      const selected = activity.id === selectedActivityId;
                      return (
                        <Pressable
                          key={activity.id}
                          onPress={() => onSelectActivity(activity.id)}
                          style={{
                            paddingVertical: 10,
                            paddingHorizontal: 12,
                            backgroundColor: selected ? "#E8EEF9" : "#FFF",
                          }}
                        >
                          <Text style={{ fontWeight: selected ? "800" : "600" }}>
                            {activity.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          <Text style={{ marginTop: 6 }}>Target Minutes (per day)</Text>
          <View style={{ gap: 8 }}>
            <Pressable
              onPress={() => setOpenMinutesDropdown((prev) => !prev)}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 12,
                backgroundColor: "#F3F4F6",
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            >
              <Text style={{ fontWeight: "700" }}>{selectedMinutes} min</Text>
            </Pressable>

            {openMinutesDropdown && (
              <View
                style={{
                  borderRadius: 12,
                  backgroundColor: "#FFF",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  overflow: "hidden",
                  maxHeight: 220,
                }}
              >
                <ScrollView nestedScrollEnabled>
                  {minuteOptions.map((mins) => {
                    const selected = mins === selectedMinutes;
                    return (
                      <Pressable
                        key={mins}
                        onPress={() => onSelectMinutes(mins)}
                        style={{
                          paddingVertical: 10,
                          paddingHorizontal: 12,
                          backgroundColor: selected ? "#E8EEF9" : "#FFF",
                        }}
                      >
                        <Text style={{ fontWeight: selected ? "800" : "600" }}>
                          {mins} min
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>

          <Pressable
            onPress={onSave}
            disabled={!selectedActivityId}
            style={{
              marginTop: 8,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: selectedActivityId ? "#111" : "#9CA3AF",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#FFF", fontWeight: "800" }}>Save Goal</Text>
          </Pressable>
        </View>
      </Card>
    </View>
  );
}