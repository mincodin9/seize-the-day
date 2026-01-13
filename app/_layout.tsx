import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Notifications from "expo-notifications";
import { Href, router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEffect, useMemo, useState } from 'react';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ensureAndroidChannel } from './src/notifications/notificationService';
import { loadSettings } from './src/storage/storageRepo';
import { Appearance, Settings } from './src/types';

LogBox.ignoreLogs([
  "expo-notifications: Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go",
]);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function useNotificationDeepLink() {
  useEffect(() => {
    let mounted = true;

    (async () => {
      const last = await Notifications.getLastNotificationResponseAsync();
      const href = last?.notification.request.content.data?.href;
      if(mounted && typeof href === "string") router.push(href as Href);
    })();

    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      const href = res.notification.request.content.data?.href;
      if (typeof href === "string") router.push(href as Href);
    });
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);
}

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    (async () => {
      await ensureAndroidChannel();
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const s = await loadSettings();
      setSettings(s);
    })();
  }, []);

  const resolvedScheme = useMemo<"light" | "dark">(() => {
    const appearance: Appearance = settings?.appearance ?? "system";
    
    if (appearance === "system") {
      return colorScheme === "dark" ? "dark" : "light";
    }

    return appearance;
  }, [settings?.appearance, colorScheme]);

  useNotificationDeepLink();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={resolvedScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="settings" 
            options={{ presentation: 'modal', title: 'Settings', headerShown: false }} 
          />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
