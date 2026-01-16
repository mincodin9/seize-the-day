import { addDays, formatWeekTitle, fromDateKey, getWeekKeys, goalProgressOfDay, type DateKey } from "@/app/src/utils/calendar";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { loadActivities, loadGoals, loadRecord, loadSettings } from "../storage/storageRepo";
import { Activity, DailyRecord, Goal, Settings } from "../types";
import { summarizeRecord } from "../utils/summarize";
import Card from "./Card";


type Props = {
  selectedDateKey: DateKey;
  onSelectDate: (key: DateKey) => void;
}

export default function WeekView({ selectedDateKey, onSelectDate }: Props) {
  const [cursorWeek, setCursorWeek] = useState<Date>(() => fromDateKey(selectedDateKey));
  const [recordByKey, setRecordByKey] = useState<Record<string, DailyRecord | null>>({});

  const [activities, setActivities] = useState<Activity[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);

  useEffect(() => {
    setCursorWeek(fromDateKey(selectedDateKey));
  }, [selectedDateKey]);

  const weekKeys = useMemo(() => getWeekKeys(cursorWeek, 0), [cursorWeek]);
  
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [a, s, g] = await Promise.all([loadActivities(), loadSettings(), loadGoals()]);
      if(cancelled) return;

      setActivities(a ?? []);
      setSettings(s);
      setGoal((g ?? [])[0] ?? null);

      const map: Record<string, DailyRecord | null> = {};
      for (const k of weekKeys) {
        map[k] = await loadRecord(k);
      }
      if(!cancelled) setRecordByKey(map);
    })();

    return () => {
      cancelled = true;
    };
  }, [weekKeys.join("|")]);

  function prevWeek() { setCursorWeek((d) => addDays(d, -7)); }
  function nextWeek() { setCursorWeek((d) => addDays(d, 7)); }
  
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Pressable onPress={prevWeek}><Text>{"<"}</Text></Pressable>
        <Text style={{ fontSize: 18, fontWeight: "700" }}>{formatWeekTitle(cursorWeek)}</Text>
        <Pressable onPress={nextWeek}><Text>{">"}</Text></Pressable>
      </View>

      <ScrollView
        style={{ flex: 1, marginTop: 12 }}
        contentContainerStyle={{ paddingBottom: 24, gap: 10 }}
        showsVerticalScrollIndicator={false}
      > 
        {weekKeys.map((k) => {
          const rec = recordByKey[k] ?? null;
          const isSelected = k === selectedDateKey;
          const summary =
            rec && settings ?
            summarizeRecord(rec, activities, settings.slotMinutes) : null;
          
          const goalAct = activities.find(a => a.id === goal?.activityId);
          const prog = settings ? goalProgressOfDay(rec, goal, settings.slotMinutes) : null;
          
          const ratio = prog?.ratio ?? 0;
          const achieved = !!prog?.achieved;
          const mins = prog?.minutes ?? 0;
          const target = prog?.target ?? 0;

          return (
            <Pressable key={k} onPress={() => onSelectDate(k)}>
              <Card title={k}>
                <Text style={{ opacity: 0.7 }}>
                  {summary ? summary.topText : "No record"}
                </Text>
                {target >= 0 && (
                  <View style={{ marginTop: 10, gap: 6 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ opacity: 0.7 }}>
                        Goal: {Math.floor(mins / 60)}h {mins % 60}m / {Math.floor(target / 60)}h {target % 60}m
                      </Text>
                      <Text style={{ opacity: 0.7, fontWeight: achieved ? "800" : "600" }}>
                        {Math.round(ratio * 100)}%
                      </Text>
                    </View>

                    <View
                      style={{
                        height: 8,
                        borderRadius: 999,
                        backgroundColor: "#E5E7EB",
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          width: `${Math.round(ratio * 100)}%`,
                          height: "100%",
                          backgroundColor: goalAct?.colorHex ?? "#111",
                        }}
                      />
                    </View>
                  </View>
                )}
                <Text style={{ marginTop: 6, fontWeight: isSelected ? "700" : "400" }}>
                  {isSelected ? "Selected" : ""}
                </Text>
              </Card>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}