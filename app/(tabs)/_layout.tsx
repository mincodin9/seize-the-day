import { Ionicons } from "@expo/vector-icons";
import { router, Tabs } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text } from 'react-native';
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

function TabBarButton(props: any) {
  const isActive = !!props.accessibilityState?.selected;
  const scale = useRef(new Animated.Value(isActive ? 1.06 : 1)).current;

  useEffect(() => {
    Animated.spring(scale, { toValue: isActive ? 1.06 : 1, useNativeDriver: true }).start();
  }, [isActive, scale]);

  return (
    <Pressable
      {...props}
      onPressIn={() =>
        Animated.spring(scale, { toValue: isActive ? 1.08 : 1.04, useNativeDriver: true }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, { 
          toValue: isActive ? 1.0 : 1, useNativeDriver: true
         }).start()
      }
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {props.children}
      </Animated.View>
    </Pressable>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const activeColor = colorScheme === "dark" ? "#A8DF8E" : "#98CD00";
  const inactiveColor = "#aaa"

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerRight: () => <SettingsButton/>,
          tabBarActiveTintColor: activeColor,
          tabBarInactiveTintColor: inactiveColor,
          tabBarButton: (props) => <TabBarButton {...props} />,
          tabBarLabelStyle: { fontWeight: "600" },
        }}
      >
        <Tabs.Screen
          name="index" 
          options={{ 
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "home" : "home-outline"} size={focused ? 24 : 20} color={color} />
            )
          }}
        />
        <Tabs.Screen 
          name="calendar" 
          options={{ 
            title: "Calendar",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "calendar" : "calendar-outline"} size={focused ? 24 : 20} color={color} />
            )
          }}
        />
        <Tabs.Screen
          name="report"
          options={{ 
            title: "Report",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "bar-chart" : "bar-chart-outline"} size={focused ? 24 : 20} color={color} />
            )
          }}
        />
      </Tabs>
    </GestureHandlerRootView>
  );
}
