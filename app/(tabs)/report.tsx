import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Animated, Dimensions, Pressable, ScrollView, Text, View } from "react-native";
import ViewShot from "react-native-view-shot";
import { VictoryPie } from "victory-native";
import Card from "../src/components/Card";
import { loadActivities, loadRecord, loadSettings } from "../src/storage/storageRepo";
import { ui } from "../src/theme/styles";
import { Activity, DailyRecord, Settings } from "../src/types";
import { DateKey, fromDateKey, getWeekKeys } from "../src/utils/calendar";
import { formatWeekRange, getTopActivity, minutesToLabel, summarizeWeekRecords, toActivityReportItems } from "../src/utils/report";
import { getTodayKey } from "../src/utils/slots";

export default function Report() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [records, setRecords] = useState<(DailyRecord | null)[]>([]);
  const [loading, setLoading] = useState(true);

  const todayKey = useMemo(() => getTodayKey() as DateKey, []);
  const weekKeys = useMemo(() => getWeekKeys(fromDateKey(todayKey)), [todayKey]);

  const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
  const FAB_SIZE = 44;
  const FAB_MARGIN = 12;
  const [containerSize, setContainerSize] = useState({
    width: SCREEN_W,
    height: SCREEN_H,
  });
  const hasInitFab = useRef(false);

  const fabPos = useRef(
    new Animated.ValueXY({
      x: SCREEN_W - FAB_SIZE - FAB_MARGIN,
      y: SCREEN_H - FAB_SIZE - FAB_MARGIN,
    })
  ).current;

  const shotRef = useRef<any>(null);

  async function onCapture() {
    let uri: string | undefined;

    try {
      uri = await shotRef.current?.capture?.({
        format: "png",
        quality: 1,
      });

      if (!uri) return;

      try {
        const perm = await MediaLibrary.requestPermissionsAsync();
        if (perm.granted) {
          await MediaLibrary.saveToLibraryAsync(uri);

          Alert.alert("Saved", "Share it now?", [
            { text: "No", style: "cancel" },
            {
              text: "Share",
              onPress: async () => {
                if (await Sharing.isAvailableAsync()) {
                  await Sharing.shareAsync(uri!);
                }
              },
            },
          ]);

          return;
        }
      } catch (e) {}

      Alert.alert(
        "Saved",
        "Auto-save may not work in Expo Go. Open share sheet instead?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Share",
            onPress: async () => {
              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri!);
              } else {
                Alert.alert("Sharing not available");
              }
            },
          },
        ]
      );
    } catch (e: any) {
      Alert.alert("Capture failed", e?.message ?? "Unknown error");
    }
  }

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

  const weekRange = useMemo(() => {
    if (!weekKeys.length) return "";

    const start = fromDateKey(weekKeys[0] as DateKey);
    const end = fromDateKey(weekKeys[weekKeys.length-1] as DateKey);

    return formatWeekRange(start, end);
  }, [todayKey]);

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
    <View
      style={{flex: 1}}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setContainerSize({ width, height });
        if (!hasInitFab.current) {
          hasInitFab.current = true;
          fabPos.setValue({
            x: width - FAB_SIZE - FAB_MARGIN,
            y: height - FAB_SIZE - FAB_MARGIN,
          });
        }
      }}
    >
      <ScrollView style={ui.screen} contentContainerStyle={{ paddingBottom : 40 }}>
        <ViewShot ref={shotRef} options={{ format: "png", quality: 1 }}>
          <View style={[ui.stack, {gap: 12}]}>
            {loading && (
              <Card title="Loading">
                <Text style={ui.body}>Collecting your week...</Text>
              </Card>
            )}

            {!loading && (!settings || !report) && (
              <Card title="No data">
                <Text style={ui.body}>No tracked time this week.</Text>
                <Text style={ui.muted}>Go Home and paint your timeline to get a report.</Text>
              </Card>
            )}

            {!loading && report && (
              <>
                <Card title="Weekly summary">
                  <View style={{ gap: 6 }}>
                    <Row
                      label="Period"
                      value={weekRange}
                    />
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
        </ViewShot>
      </ScrollView>

      <Animated.View
        style={{
          position: "absolute",
          width: FAB_SIZE,
          height: FAB_SIZE,
          borderRadius: FAB_SIZE / 2,
          backgroundColor: "rgba(0,0,0,0.35)",
          alignItems: "center",
          justifyContent: "center",
          left: fabPos.x,
          top: fabPos.y,
        }}
      >
        <Pressable
          onPress={onCapture}
          style={{
            width: FAB_SIZE,
            height: FAB_SIZE,
            borderRadius: FAB_SIZE / 2,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 18, color: "white" }}>📸</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text style={ui.muted}>{label}</Text>
      <Text style={[ui.muted, { fontWeight: "700" }]}>{value}</Text>
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
          <Text style={[ui.body, {fontSize: 12}]}>{name}</Text>
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
