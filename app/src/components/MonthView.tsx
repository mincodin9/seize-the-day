import { formatMonthTitle, fromDateKey, getMonthMatrix, goalProgressOfDay } from "@/app/src/utils/calendar";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import type { DateKey } from "@/app/src/utils/calendar";
import { loadActivities, loadGoals, loadRecord, loadSettings } from "../storage/storageRepo";
import { Activity, DailyRecord, Goal, Settings } from "../types";

type Props = {
  selectedDateKey: DateKey;
  onSelectDate: (key: DateKey) => void;
};

export default function MonthView({ selectedDateKey, onSelectDate }: Props) {
  const [cursorMonth, setCursorMonth] = useState(() => new Date()); //As of today
  const [recordByKey, setRecordByKey] = useState<Record<string, DailyRecord | null>>({});

  const [activities, setActivities] = useState<Activity[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);

  const matrix = useMemo(() => getMonthMatrix(cursorMonth, 0), [cursorMonth]); //0-sun start

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const a = (await loadActivities()) ?? [];
      const g = (await loadGoals()) ?? [];
      const s = await loadSettings();

      if (cancelled) return;

      setActivities(a);
      setGoal(g[0] ?? null);
      setSettings(s);
    })();

    return () => { cancelled = true; };
  })

  useEffect(() => {
    setCursorMonth(fromDateKey(selectedDateKey));
  }, [selectedDateKey]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const map: Record<string, DailyRecord | null> = {};

      const keys: string[] = [];
      for (const row of matrix) {
        for (const cell of row) {
          if (cell) keys.push(cell.dateKey);
        }
      }

      for (const k of keys) {
        map[k] = await loadRecord(k);
      }

      if (!cancelled) setRecordByKey(map);
    })();

    return () => { cancelled = true; };
  }, [matrix.map(r => r.map(c => c?.dateKey ?? "").join(",")).join("|")]);

  function prevMonth() {
    setCursorMonth((d) => new Date(d.getFullYear(), d.getMonth() -1, 1));
  }
  function nextMonth() {
    setCursorMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  function hasAnyActivity(rec: any) {
    const blocks = (rec?.blocks ?? rec?.cells ?? []) as { activityId: string | null }[];
    return blocks.some((b) => !!b?.activityId);
  }

  return(
    <View style={{ flex: 1, padding: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Pressable onPress={prevMonth}><Text>{"<"}</Text></Pressable>
        <Text style={{ fontSize: 18, fontWeight: "700" }}>{formatMonthTitle(cursorMonth)}</Text>
        <Pressable onPress={nextMonth}><Text>{">"}</Text></Pressable>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <Text key={d} style={{ width: "14.285%", textAlign: "center", opacity: 0.7 }}>{d}</Text>
        ))}
      </View>

      <View style={{ margin: 8 }}>
        {matrix.map((row, r) => (
          <View key={r} style={{ flexDirection: "row" }}>
            {row.map((cell, c) => {
              if (!cell) {
                return (
                  <View
                    key={c}
                    style={{ width: "14.285%", aspectRatio: 1 }}
                  />
                );
              }

              const isSelected = cell.dateKey === selectedDateKey;
              const rec = cell ? recordByKey[cell.dateKey] : null;
              const hasData = !!(rec && hasAnyActivity(rec));
              const goalAct = activities.find(a => a.id === goal?.activityId);
              const gp = settings ? goalProgressOfDay(rec, goal, settings.slotMinutes) : null;
              const achieved = !!gp?.achieved;

              return (
                <Pressable
                  key={c}
                  onPress={() => cell && onSelectDate(cell.dateKey)}
                  style={{
                    width: "14.285%",
                    aspectRatio: 1,
                    padding: 6,
                    opacity: cell?.inMonth ? 1 : 0.35,
                    borderWidth: 1,
                    borderColor: isSelected ? "#96A78D" : "#ccc",
                    backgroundColor: isSelected ? "#D9E9CF" : "transparent",
                  }}
                >
                    <Text style={{ fontWeight: isSelected ? "700" : "600" }}>
                      {cell?.date.getDate()}
                    </Text>

                    <Text style={{ fontSize: 20, color: "#FD8A6B" }}>
                      {hasData ? "•" : ""}
                    </Text>

                    {achieved && (
                      <View
                        style={{
                          position: "absolute",
                          right: 6,
                          bottom: 6,
                          width: 18,
                          height: 18,
                          borderRadius: 9,
                          backgroundColor: goalAct?.colorHex ?? "#111",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: "900", color: "#fff" }}>✓</Text>
                      </View>
                    )}
                </Pressable>
              )
            })}
          </View>
        ))}
      </View>
    </View>
  );
}