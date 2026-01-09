import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { DateKey, fromDateKey } from "../utils/calendar";
import Card from "./Card";

type Props = {
  dateKey: DateKey;
  summaryText? : string;
};

function formatPretty(dateKey: string) {
  const d = fromDateKey(dateKey);
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()} `;
}

export default function SelectedDayCard({ dateKey, summaryText }: Props) {
  const router = useRouter();

  return (
    <Card title="Selected day">
      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: "700" }}>
          {formatPretty(dateKey)}
        </Text>

        <Text style={{ opacity: 0.7 }}>
          {summaryText ?? "Tap a day to view details"}
        </Text>

        <Pressable
          onPress={() => 
            router.push({
              pathname: "/day/[dateKey]",
              params: { dateKey },
            })
          }
          style={{
            alignSelf: "flex-start",
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderRadius: 10,
          }}
        >
          <Text style={{ fontWeight: "600" }}>View timeline →</Text>
        </Pressable>
      </View>
    </Card>
  )
}