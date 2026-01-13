import { Switch, Text, View } from "react-native";

export function ToggleRow({
  label,
  value,
  onChange,
  subtitle,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  subtitle?: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View style={{ gap: 4 }}>
        <Text style={{ fontWeight: "600" }}>{label}</Text>
        {subtitle && <Text style={{ fontSize: 12, opacity: 0.6 }}>{subtitle}</Text>}
      </View>

      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#E5E7EB", true: "#A3DC9A" }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}
