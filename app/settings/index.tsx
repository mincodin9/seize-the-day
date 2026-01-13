import Card from "@/app/src/components/Card";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { ToggleRow } from "@/app/src/components/ToggleRow";
import { loadSettings, saveSettings } from "@/app/src/storage/storageRepo";
import type { Settings } from "@/app/src/types";
import { debugListScheduled, setReminder, testNotifySeconds } from "../src/notifications/notificationService";

export default function SettingsScreen() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    (async () => {
      const s = await loadSettings();
      setSettings(s);
    })();
  }, []);

  const updateSettings = async (patch: Partial<Settings>) => {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    await saveSettings(next);
  };

  const appearanceLabel = useMemo(() => {
    if (!settings) return "-";
    return settings.appearance;
  }, [settings]);

  const isDailyNotification = useMemo(() => !!settings?.isDailyNotification, [settings]);
  const isWeeklyReportNotification = useMemo(() => !!settings?.isWeeklyReportNotification, [settings]);

  const onToggleDailyNotification = async (next: boolean) => {
    await updateSettings({ isDailyNotification: next });
    const res = await setReminder("daily", next, { hour: 21, minute: 0 });
    if (!res.ok) {
      await updateSettings({ isDailyNotification: false });
    }
  };

  const onToggleWeeklyReport = async (next: boolean) => {
    await updateSettings({ isWeeklyReportNotification: next });
    const res = await setReminder("weeklyReport", next);
    if (!res.ok) {
      await updateSettings({ isWeeklyReportNotification: false });
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 12, backgroundColor: "#EFF3FA" }}>
      <Card title="Timeline">
        {!settings ? (
          <Text>Loading...</Text>
        ) : (
          <View style={{ gap: 8 }}>
            <Row label="Start time" value={settings.startTime} />
            <Row label="End time" value={settings.endTime} />

            {/* TODO: Put timepicker as dropdown */}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <SmallBtn text="08:00" onPress={() => updateSettings({ startTime: "08:00" })} />
              <SmallBtn text="06:00" onPress={() => updateSettings({ startTime: "06:00" })} />
              <SmallBtn text="26:00" onPress={() => updateSettings({ endTime: "26:00" })} />
              <SmallBtn text="24:00" onPress={() => updateSettings({ endTime: "24:00" })} />
            </View>
          </View>
        )}
      </Card>

      <Card title="Theme">
        {!settings ? (
          <Text>Loading...</Text>
        ) : (
          <View style={{ gap: 8 }}>
            <Row label="Appearance" value={appearanceLabel} />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <SmallBtn text="System" onPress={() => updateSettings({ appearance: "system" })} />
              <SmallBtn text="Light" onPress={() => updateSettings({ appearance: "light" })} />
              <SmallBtn text="Dark" onPress={() => updateSettings({ appearance: "dark" })} />
            </View>

            {/* TODO: Connect with app theme logic */}
          </View>
        )}
      </Card>

      <Card title="Reminders">
        {!settings ? (
          <Text>Loading...</Text>
        ) : (
          <View>
            <ToggleRow
              label="Daily reminder"
              value={isDailyNotification}
              onChange={onToggleDailyNotification}
            />
            <ToggleRow
              label="Weekly report"
              subtitle="Every Saturday 19:00"
              value={isWeeklyReportNotification}
              onChange={onToggleWeeklyReport}
            />

            {__DEV__ && (
              <View style={{ marginTop: 12, gap: 12 }}>
                <SmallBtn
                  text="Test in 5s" 
                  onPress={() => {
                    console.log("TEST BUTTON PRESSED");
                    testNotifySeconds(5);
                    debugListScheduled();
                  }}
                />
                <SmallBtn
                  text="Go report (Test)"
                  onPress={() => router.push("/report" as any)} 
                />
              </View>
            )}
          </View>
        )}
      </Card>

      <Card title="Manage">
        <Pressable
          onPress={() => router.push("/settings/activities")}
          style={btnStyle}
        >
          <Text style={btnText}>Activities</Text>
        </Pressable>

        <Pressable onPress={() => router.push("/settings/goals")} style={btnStyle}>
          <Text style={btnText}>Goals</Text>
        </Pressable>
      </Card>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text style={{ opacity: 0.7 }}>{label}</Text>
      <Text style={{ fontWeight: "700" }}>{value}</Text>
    </View>
  );
}

function SmallBtn({ text, onPress }: { text: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: "#F3F4F6",
        borderWidth: 1,
        borderColor: "#E5E7EB",
      }}
    >
      <Text style={{ fontWeight: "800", fontSize: 12 }}>{text}</Text>
    </Pressable>
  );
}

const btnStyle = {
  marginTop: 6,
  paddingVertical: 12,
  paddingHorizontal: 12,
  borderRadius: 12,
  backgroundColor: "#111",
} as const;

const btnText = { color: "#FFF", fontWeight: "800" } as const;
