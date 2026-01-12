import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";

import { ScrollView } from "react-native-gesture-handler";
import TimelineGrid from "../src/components/TimelineGrid";
import { createEmptyDayRecord } from "../src/seed/seed";
import { loadActivities, loadRecord, loadSettings } from "../src/storage/storageRepo";
import type { Activity, DailyRecord, Settings, TaskCard } from "../src/types";
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

  const taskSummary =useMemo(() => {
    const cards = record?.cards ?? [];
    const total = cards.reduce((acc, c) => acc + (c.items?.length ?? 0), 0);
    const done = cards.reduce(
      (acc, c) => acc + (c.items ?? []).filter((it) => it.done).length,
      0
    );

    const hasAnyText = cards.some((c) =>
      (c.items ?? []).some((it) => (it.text?.trim?.() ?? "") !== "")
    );

    return { cards, total, done, hasAnyText };
  }, [record]);

  const renderTaskCardReadOnly = (card: TaskCard) => {
    const items = card.items ?? [];
    const total = items.length;
    const done = items.filter((it) => it.done).length;

    const visibleItems = items.filter((it) => (it.text?.trim?.() ?? "") !== "");
    const pending = visibleItems.filter((it) => !it.done);

    return (
      <View
        key={card.id}
        style={{
          backgroundColor: "#FFF",
          borderRadius: 14,
          padding: 12,
          borderWidth: 1,
          borderColor: "#E5E7EB",
        }}
      >
        <Text style={{ fontWeight: "800", fontSize: 14 }}>{card.title}</Text>
        
        <Text style={{ marginTop: 4, opacity: 0.7, fontSize: 12 }}>
          {done}/{total} done
        </Text>

        {visibleItems.length ? (
          <View style={{ marginTop: 10, gap: 6 }}>
            {/* Done */}
            {visibleItems
              .filter((it) => it.done)
              .slice(0, 5)
              .map((it) => (
                <Text key={it.id} style={{ opacity: 0.55, textDecorationLine: "line-through" }}>
                  ✓ {it.text}
                </Text>
              ))}

              {/* Pending */}
              {pending.slice(0, 5).map((it) => (
                <Text key={it.id} style={{ opacity: 0.9 }}>
                  • {it.text}
                </Text>
              ))}

              {(visibleItems.length > 10) && (
                <Text style={{ opacity: 0.5, fontSize: 12 }}>
                  +{visibleItems.length - 10} more
                </Text>
              )}
          </View>
        ) : (
          <Text style={{ marginTop: 10, opacity: 0.5, fontSize: 12 }}>
            No tasks written.
          </Text>
        )}
      </View>
    );
  };

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
      <ScrollView
        style={{ flex: 1}}
        contentContainerStyle={{ paddingBottom: 24, gap: 10 }}
        showsVerticalScrollIndicator={false}
      >
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

        {/* Today Tasks */}
        <View style={{ marginTop: 14 }}>
          <Text style={{ fontSize: 16, fontWeight: "800" }}>Today Tasks</Text>

          {!taskSummary.hasAnyText ? (
            <Text style={{ marginTop: 6, opacity: 0.6 }}>
              No tasks for this day.
            </Text>
          ) : (
            <>
              <Text style={{ marginTop: 6, opacity: 0.7 }}>
                Progress: {taskSummary.done}/{taskSummary.total} done
              </Text>

              <View style={{ marginTop: 10, gap: 10 }}>
                {taskSummary.cards.map(renderTaskCardReadOnly)}
              </View>
            </>
          )}
        </View>
        
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