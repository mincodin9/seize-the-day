import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { VictoryPie } from "victory-native";
import Card from "../src/components/Card";
import { loadActivities, loadRecord, loadSettings } from "../src/storage/storageRepo";
import { ui } from "../src/theme/styles";
import { Activity, DailyRecord, Settings } from "../src/types";
import { DateKey, fromDateKey, getWeekKeys } from "../src/utils/calendar";
import { getTopActivity, minutesToLabel, summarizeWeekRecords, toActivityReportItems } from "../src/utils/report";
import { getTodayKey } from "../src/utils/slots";

export default function Report() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [records, setRecords] = useState<(DailyRecord | null)[]>([]);
  const [loading, setLoading] = useState(true);

  const todayKey = useMemo(() => getTodayKey() as DateKey, []);
  const weekKeys = useMemo(() => getWeekKeys(fromDateKey(todayKey)), [todayKey]);

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        setLoading(true);

        const [s, a] = await Promise.all([loadSettings(), loadActivities()]);
        if (!mounted) return;

        setSettings(s);
        setActivities(a ?? []);

        const recs = await Promise.all(weekKeys.map(k => loadRecord(k)));
        if (!mounted) return;

        setRecords(recs);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, [weekKeys]);

  const report = useMemo(() => {
    if (!settings) return null;

    const summary = summarizeWeekRecords(records, settings);
    const items = toActivityReportItems(summary, activities)
      .filter(x => x.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes);

    const top = getTopActivity(items);

    const pieData = items.map((it) => ({
      x: it.name,
      y: it.minutes,
      color: it.colorHex,
    }));

    return {
      summary,
      items,
      top,
      pieData,
    };
  }, [settings, records, activities]);

  return (
    <ScrollView style={ui.screen} contentContainerStyle={{ paddingBottom : 24 }}>
      <Text style={ui.title}>Report</Text>
      <Text style={ui.muted}>This week</Text>

      <View style={ui.stack}>
        {loading && (
          <Card title="Loading">
            <Text style={ui.body}>Collecting your week...</Text>
          </Card>
        )}

        {!loading && (!settings || !report) && (
          <Card title="No data">
            <Text style={ui.body}>Settings not loaded.</Text>
          </Card>
        )}

        {!loading && report && (
          <>
            <Card title="Weekly summary">
              <View style={{ gap: 6 }}>
                <Row
                  label="Total"
                  value={minutesToLabel(report.summary.totalMinutes)}
                />
                <Row
                  label="Top activity"
                  value={
                    report.top
                      ? `${report.top.name} · ${minutesToLabel(report.top.minutes)}`
                      : "-"
                  }
                />
              </View>
            </Card>

            <Card title="Chart">
              {report.items.length === 0 ? (
                <Text style={ui.body}>No tracked time this week.</Text>
              ) : (
                <View style={{ alignItems: "center" }}>
                  <VictoryPie
                    data={report.pieData}
                    x="x"
                    y="y"
                    innerRadius={60}
                    padAngle={2}
                    width={260}
                    height={260}
                    labels={() => ""}
                    style={{
                      data: {
                        fill: ({ datum }: any) => datum.color,
                      },
                    }}
                  />

                  <View
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: 0,
                      bottom: 0,
                      alignItems: "center",
                      justifyContent: "center",
                      pointerEvents: "none",
                    }}
                  >
                    <Text style={[ui.body, { fontWeight: "700" }]}>
                      {minutesToLabel(report.summary.totalMinutes)}
                    </Text>
                    <Text style={ui.muted}>This week</Text>
                  </View>
                </View>
              )}
            </Card>

            <Card title="By activitiy">
              {report.items.length === 0 ? (
                <Text style={ui.body}>No activities yet.</Text>
              ) : (
                <View style={{ gap: 10 }}>
                  {report.items.map(item => (
                    <ActivityRow
                      key={item.id}
                      name={item.name}
                      minutes={item.minutes}
                      totalMinutes={report.summary.totalMinutes}
                      colorHex={item.colorHex}
                    />
                  ))}
                </View>
              )}
            </Card>
          </>
        )}
      </View>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text style={ui.body}>{label}</Text>
      <Text style={[ui.body, { fontWeight: "700" }]}>{value}</Text>
    </View>
  );
}

function ActivityRow({
  name,
  minutes,
  totalMinutes,
  colorHex,
}: {
  name: string;
  minutes: number;
  totalMinutes: number;
  colorHex: string;
}) {
  const pct =
    totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0;

    return (
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={ui.body}>{name}</Text>
          <Text style={ui.muted}>
            {minutesToLabel(minutes)} · {pct}%
          </Text>
        </View>

        <View
          style={{
            height: 10,
            borderRadius: 999,
            backgroundColor: "rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: "100%",
              width: `${pct}%`,
              backgroundColor: colorHex,
            }}
          />
        </View>
      </View>
    )
}