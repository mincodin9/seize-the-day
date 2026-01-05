import { router, Tabs } from 'expo-router';
import React from 'react';
import { Pressable, Text } from 'react-native';
import "react-native-gesture-handler";

import { useColorScheme } from '@/hooks/use-color-scheme';
import { GestureHandlerRootView } from "react-native-gesture-handler";

function SettingsButton() {
  return(
    <Pressable onPress={()=> router.push("../settings")} style={{ paddingRight: 12 }}>
      <Text style={{ fontSize: 18 }}>⚙️</Text>
    </Pressable>
  )
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerRight: () => <SettingsButton/>,
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="calendar" options={{ title: "Calendar"}} />
        <Tabs.Screen name="report" options={{ title: "Report" }} />
      </Tabs>
    </GestureHandlerRootView>
  );
}
