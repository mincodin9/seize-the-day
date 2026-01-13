import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const KEYS = {
  daily: "@std/dailyReminderNotificationId",
  weeklyReport: "@std/noti:weeklyReportId",
} as const;

type ReminderKind = keyof typeof KEYS;
type ScheduleResult = { ok: boolean; reason?: "permission_denied" | "unknown" };

export async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "Default",
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

async function cancelByKey(key: string) {
  const id = await AsyncStorage.getItem(key);
  if (!id) return;

  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } finally {
    await AsyncStorage.removeItem(key);
  }
}

export async function isReminderEnabled(kind: ReminderKind): Promise<boolean> {
  const id = await AsyncStorage.getItem(KEYS[kind]);
  return !!id;
}

export async function cancelReminder(kind: ReminderKind): Promise<void> {
  await cancelByKey(KEYS[kind]);
}

function withAndroidChannelId<T extends object>(trigger: T): T & { channelId?: string } {
  return {
    ...trigger,
    ...(Platform.OS === "android" ? { channelId: "default" } : {}),
  };
}

type DailyOpts = { hour?: number; minute?: number; title?: string; body?: string };
type WeeklyReportOpts = { title?: string; body?: string };

export async function setReminder(
  kind: "daily",
  enabled: boolean,
  opts?: DailyOpts
): Promise<ScheduleResult>;
export async function setReminder(
  kind: "weeklyReport",
  enabled: boolean,
  opts?: WeeklyReportOpts
): Promise<ScheduleResult>;
export async function setReminder(
  kind: ReminderKind,
  enabled: boolean,
  opts?: any
): Promise<ScheduleResult> {
  if (!enabled) {
    await cancelReminder(kind);
    return { ok: true };
  }

  const granted = await requestNotificationPermission();
  if (!granted) return { ok: false, reason: "permission_denied" };

  await ensureAndroidChannel();
  await cancelReminder(kind);

  const content =
    kind === "daily"
      ? {
          title: opts?.title ?? "Seize the Day",
          body: opts?.body ?? "Time to record",
          sound: true,
        }
      : {
          title: opts?.title ?? "Weekly Report",
          body: opts?.body ?? "Check out the report of this week!",
          sound: true,
          data: { href: "/report" as any },
        };
    
  const trigger = 
    kind === "daily"
      ? withAndroidChannelId({
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: opts?.hour ?? 21,
          minute: opts?.minute ?? 0,
        })
      : withAndroidChannelId({
          weekday: 7,
          hour: 19,
          minute: 0,
          repeats: true,
        });
      
  const id = await Notifications.scheduleNotificationAsync({
    content,
    trigger: trigger as any,
  });

  await AsyncStorage.setItem(KEYS[kind], id);
  return { ok: true };
}

//Alert debug(DEV only)
export async function testNotifySeconds(seconds = 5) {
  const granted = await requestNotificationPermission();
  if (!granted) return { ok: false, reason: "permission_denied" as const };

  await ensureAndroidChannel();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "TEST",
      body: `Fires in ${seconds}s`,
      sound: true,
      data: { href: "/report" as any},
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      repeats: false,
      ...(Platform.OS === "android" ? { channelId: "default" } : {}),
    },
  });

  return { ok: true as const, id};
}

export async function debugListScheduled() {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  console.log("scheduled:", all.map(n => ({
    id: n.identifier,
    title: n.content.title,
    trigger: n.trigger,
  })));
}

