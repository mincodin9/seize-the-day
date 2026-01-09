import { Pressable, Text, View } from "react-native";
import type { Activity, DailyRecord, Settings } from "../types";

type Props = {
  record: DailyRecord;
  activities: Activity[];
  settings: Settings;
  readOnly?: boolean;
  onPressSlot?: (index: number) => void;
};

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function slotLabel(startMin: number, idx: number, slotMinutes: number) {
  const m = startMin + idx * slotMinutes;
  const hh = Math.floor(m / 60);
  const mm = m% 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export default function TimelineGrid({
  record,
  activities,
  settings,
  readOnly = true,
  onPressSlot,
}: Props) {
  const startMin = timeToMinutes(settings.startTime);

  const colorById = new Map<string, string>();
  const nameById = new Map<string, string>();
  for (const a of activities) {
    colorById.set(a.id, a.colorHex);
    nameById.set(a.id, a.name);
  }

  return (
    <View style={{ borderWidth: 1, borderRadius: 12, overflow: "hidden" }}>
      {record.blocks.map((b, idx) => {
        const label = slotLabel(startMin, idx, settings.slotMinutes);
        const activityId = b?.activityId ?? null;
        const bg = activityId ? colorById.get(activityId) : undefined;
        const name = activityId ? nameById.get(activityId) : undefined;

        return (
          <Pressable
            key={idx}
            onPress={() => {
              if (readOnly) return;
              onPressSlot?.(idx);
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              height: 24,
              borderBottomWidth: idx === record.blocks.length - 1 ? 0 : 1,
              opacity: 1,
            }}
          >
            <View style={{ width: 64, paddingHorizontal: 8 }}>
              <Text style={{ fontSize: 12, opacity: 0.7 }}>{label}</Text>
            </View>

            <View
              style={{
                flex: 1,
                height: "100%",
                justifyContent: "center",
                paddingHorizontal: 10,
                backgroundColor: bg ?? "transparent",
              }}
            >
              <Text style={{ fontSize: 12, opacity: activityId ? 1 : 0.4 }}>
                {name ?? "-"}
              </Text>
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}