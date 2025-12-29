import Card from "@/app/src/components/Card";
import { ui } from "@/app/src/theme/styles";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { getTodayKey } from "@/app/src/seed/seed";
import { bootstrap } from "@/app/src/storage/storageRepo";
import type { Activity, DayRecord, Goal } from "@/app/src/types";

export default function Home() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [record, setRecord] = useState<DayRecord | null>(null);

  useEffect(() => {
    const run = async () => {
      const today = getTodayKey();
      const state = await bootstrap(today);
      setActivities(state.activities);
      setGoals(state.goals);
      setRecord(state.record);
    };
    run();
  }, []);

  return (
    <View style={ui.screen}>
      <Text style={ui.title}>Home</Text>

      <View style={ui.stack}>
        <Card title="Debug">
          <Text style={ui.body}>Activities: {activities.length}</Text>
          <Text style={ui.body}>Goals: {goals.length}</Text>
          <Text style={ui.body}>Record loaded: {record ? "YES" : "NO"}</Text>
          <Text style={ui.muted}>Checking if data is loaded</Text>
          <Text style={ui.body}>Loaded Activities: </Text>
          {activities.map((activity) => (
            <Text 
              key={activity.id} 
              style={[ui.body, {color: activity.colorHex}]}
            >
              • {activity.name}
            </Text>
          ))}
        </Card>
      </View>
    </View>
  );
}
