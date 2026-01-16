import { Text, View } from "react-native";
import { ui } from "../theme/styles";
import { minutesToLabel } from "../utils/report";

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text style={ui.muted}>{label}</Text>
      <Text style={[ui.muted, { fontWeight: "700" }]}>{value}</Text>
    </View>
  );
}

export function ActivityRow({
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