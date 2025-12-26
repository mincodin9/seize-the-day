import { router, Tabs } from 'expo-router';
import React from 'react';
import { Pressable, Text } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';

function SettingsButton() {
  return(
    <Pressable onPress={()=> router.push("/settings")} style={{ paddingRight: 12 }}>
      <Text style={{ fontSize: 18 }}>⚙️</Text>
    </Pressable>
  )
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerRight: () => <SettingsButton/>,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="calendar" options={{ title: "Calendar"}} />
      <Tabs.Screen name="report" options={{ title: "Report" }} />
    </Tabs>
  );
}
