import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import MonthView from "../src/components/MonthView";
import SelectedDayCard from "../src/components/SelectedDayCard";
import WeekView from "../src/components/WeekView";
import { toDateKey } from "../src/utils/calendar";

export default function Calendar() {
  const [tab, setTab] = useState<"month" | "week">("month");
  const [selectedDateKey, setSelectedDateKey] = useState(toDateKey(new Date()));
  
  const isToday = selectedDateKey === toDateKey(new Date());

  return (
    <View style={{ flex: 1, backgroundColor: "#F0F0F0" }}>
      <View style={styles.calendarHeader}>
        <View style={styles.tabRow}>
          <Pressable onPress={() => setTab("month")} style={styles.tabBtn}>
            <Text style={[styles.tabText, tab === "month" && styles.tabTextActive]}>
              Month
            </Text>
          </Pressable>

          <Pressable onPress={() => setTab("week")} style={styles.tabBtn}>
            <Text style={[styles.tabText, tab === "week" && styles.tabTextActive]}>
              Week
            </Text>
          </Pressable>
        </View>

        <Pressable
          disabled={isToday}
          style={[
            styles.todayBtn,
            isToday && { opacity: 0.4 },
          ]}
          onPress={() => setSelectedDateKey(toDateKey(new Date()))}
        >
          <Text>Today</Text>
        </Pressable>
      </View>
      <View style={{ flex: 1 }}>
        {tab === "month" ? (
          <View style={{ flex: 1 }}>
            <MonthView
              selectedDateKey={selectedDateKey}
              onSelectDate={setSelectedDateKey} 
            />

            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
              <SelectedDayCard dateKey={selectedDateKey} />
            </View>
          </View>
        ) : (
          <WeekView
            selectedDateKey={selectedDateKey}
            onSelectDate={setSelectedDateKey}
          />
        )}
      </View>
    </View>
  );
}

const styles = {
  calendarHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  tabRow: {
    flexDirection: "row",
    gap: 16,
  },

  tabBtn: {
    paddingVertical: 6,
  },

  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
  },

  tabTextActive: {
    fontWeight: "700",
    color: "#111827",
  },

  todayBtn: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#E8F5E1",
    borderWidth: 1,
    borderColor: "#A8DF8E",
  },

  todayText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2F6B1F",
  },
} as const;
