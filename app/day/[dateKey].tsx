import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";

import { ScrollView } from "react-native-gesture-handler";
import TimelineGrid from "../src/components/TimelineGrid";
import { createEmptyDayRecord } from "../src/seed/seed";
import { loadActivities, loadRecord, loadSettings } from "../src/storage/storageRepo";
import type { Activity, DailyRecord, Settings } from "../src/types";
import { calcTotalSlots } from "../src/utils/slots";
import { summarizeRecord } from "../src/utils/summarize";

export default function DayDetail() {
  const { dateKey } = useLocalSearchParams<{ dateKey: string }>();

  const [record, setRecord] = useState<DailyRecord | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dateKey) return;

    (async () => {
      const [r, a, s] = await Promise.all([
        loadRecord(dateKey),
        loadActivities(),
        loadSettings(),
      ]);

      setActivities(a ?? []);
      setSettings(s);

      if (!r) {
        const totalSlots = calcTotalSlots(s);
        const empty = createEmptyDayRecord(dateKey, totalSlots);
        setRecord(empty);
      } else {
        setRecord(r);
      }

      setLoading(false);
    })();
  }, [dateKey]);

  const summary = useMemo(() => {
    if (!record || !settings) return null;
    return summarizeRecord(record, activities, settings.slotMinutes);
  }, [record, activities, settings]);

  if (loading) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!settings) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Text>Failed to load settings</Text>
      </View>
    );
  }

  if (!record) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: "700" }}>{dateKey}</Text>
        <Text>No record for this day</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Stack.Screen
        options={{
          title: "Daily Detail",
        }}
      />
      <Text style={{ fontSize: 20, fontWeight: "700" }}>
        {record.dateKey}
      </Text>

      <Text style={{ marginTop: 8, opacity: 0.7 }}>
        {summary?.topText ?? "No record"}
      </Text>

      {summary?.rows?.length ? (
        <View style={{ marginTop: 12, gap: 6 }}>
          {summary.rows.map((r) => (
            <Text key={r.activityId}>
              • {r.name}: {Math.round(r.minutes / 60 * 10) / 10}h
            </Text>
          ))}
        </View>
      ) : null}

      <ScrollView
        style={{ marginTop: 16, flex: 1}}
        contentContainerStyle={{ paddingBottom: 24, gap: 10 }}
        showsVerticalScrollIndicator={false}
      >
        <TimelineGrid
          record={record}
          activities={activities}
          settings={settings}
          readOnly
        />
      </ScrollView>
    </View>
  )
}