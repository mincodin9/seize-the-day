import { addDays, formatWeekTitle, fromDateKey, getWeekKeys, type DateKey } from "@/app/src/utils/calendar";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { loadActivities, loadRecord, loadSettings } from "../storage/storageRepo";
import { Activity, DailyRecord, Settings } from "../types";
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

  useEffect(() => {
    setCursorWeek(fromDateKey(selectedDateKey));
  }, [selectedDateKey]);

  const weekKeys = useMemo(() => getWeekKeys(cursorWeek, 0), [cursorWeek]);
  
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [a, s] = await Promise.all([loadActivities(), loadSettings()]);
      if(cancelled) return;

      setActivities(a ?? []);
      setSettings(s);

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

          return (
            <Pressable key={k} onPress={() => onSelectDate(k)}>
              <Card title={k}>
                <Text style={{ opacity: 0.7 }}>
                  {summary ? summary.topText : "No record"}
                </Text>
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