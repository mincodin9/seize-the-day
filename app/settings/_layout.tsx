import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Settings"}} />
      <Stack.Screen name="activities" options={{ title: "Activities" }} />
      <Stack.Screen name="goals" options={{ title: "Goals" }} />
    </Stack>
  );
}
