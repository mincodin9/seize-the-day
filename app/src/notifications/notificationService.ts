import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const KEY_DAILY_REMINDER_ID = "@std/dailyReminderNotificationId";

export async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("daily-reminder", {
    name: "Daily Reminder",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

//Request authority
export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

//Send alarm once a day
export async function scheduleDailyReminder(opts?: {
  hour?: number;
  minute?: number;
  title?: string;
  body?: string;
}): Promise<{ ok: boolean; reason?: string}> {
  const hour = opts?.hour ?? 21;
  const minute = opts?.minute ?? 0;

  const granted = await requestNotificationPermission();
  if (!granted) return { ok: false, reason: "permission_denied" };

  await ensureAndroidChannel();
  await cancelDailyReminder();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: opts?.title ?? "Seize the Day",
      body: opts?.body ?? "오늘 기록할 시간이에요.",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      ...(Platform.OS === "android" ? { channelId: "daily-reminder" } : {}),
    },
  });

  await AsyncStorage.setItem(KEY_DAILY_REMINDER_ID, id);

  return { ok: true };
}

//Setting OFF
export async function cancelDailyReminder(): Promise<void> {
  const id = await AsyncStorage.getItem(KEY_DAILY_REMINDER_ID);
  if (!id) return;

  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } finally {
    await AsyncStorage.removeItem(KEY_DAILY_REMINDER_ID);
  }
}