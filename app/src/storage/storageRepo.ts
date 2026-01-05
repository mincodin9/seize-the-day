import AsyncStorage from "@react-native-async-storage/async-storage";
import { createEmptyDayRecord, seedActivities, seedGoals, seedSettings } from "../seed/seed";
import type { Activity, DailyRecord, Goal, Settings } from "../types";
import { calcTotalSlots } from "../utils/slots";

const KEY_ACTIVITIES = "@std/activities";
const KEY_GOALS = "@std/goals";
const KEY_RECORD_PREFIX = "@std/record:"; //@std/record:2025-12-29
const KEY_SETTINGS = "@std/settings";

function recordKey(date: string) {
  return `${KEY_RECORD_PREFIX}${date}`;
}

async function safeJsonParse<T>(raw: string | null): Promise<T | null> {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

//Activities
export async function loadActivities(): Promise<Activity[] | null> {
  const raw = await AsyncStorage.getItem(KEY_ACTIVITIES);
  const parsed = await safeJsonParse<Activity[]>(raw);
  return parsed && parsed.length ? parsed : seedActivities;
}

export async function saveActivities(activities: Activity[]): Promise<void> {
  await AsyncStorage.setItem(KEY_ACTIVITIES, JSON.stringify(activities));
}

//Goals
export async function loadGoals(): Promise<Goal[] | null> {
  const raw = await AsyncStorage.getItem(KEY_GOALS);
  const parsed = await safeJsonParse<Goal[]>(raw);
  return parsed && parsed.length ? parsed : seedGoals;
}

export async function saveGoals(goals: Goal[]): Promise<void> {
  await AsyncStorage.setItem(KEY_GOALS, JSON.stringify(goals));
}

//Settings
export async function loadSettings(): Promise<Settings> {
  const raw = await AsyncStorage.getItem(KEY_SETTINGS);
  const parsed = await safeJsonParse<Settings>(raw);
  return parsed ?? seedSettings;
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(KEY_SETTINGS, JSON.stringify(settings))
}

//DayRecord (per-date)
export async function loadRecord(date: string): Promise<DailyRecord | null> {
  const raw = await AsyncStorage.getItem(recordKey(date));
  return safeJsonParse<DailyRecord>(raw);
}

export async function saveRecord(date: string, record: DailyRecord): Promise<void> {
  await AsyncStorage.setItem(recordKey(date), JSON.stringify(record));
}

//Debug/reset
export async function resetAll(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const targets = keys.filter(
    (k) => k === KEY_ACTIVITIES || k === KEY_GOALS || k=== KEY_SETTINGS || k.startsWith(KEY_RECORD_PREFIX)
  );
  if (targets.length > 0) {
    await AsyncStorage.multiRemove(targets);
  }
}

//Bootstrap
export async function bootstrap(date: string): Promise<{
  activities: Activity[];
  goals: Goal[];
  settings: Settings;
  record: DailyRecord;
}> {
  //Activities
  let activities = await loadActivities();
  if (!activities || activities.length === 0) {
    activities = seedActivities;
    await saveActivities(activities);
  }

  //Goals
  let goals = await loadGoals();
  if (!goals || goals.length === 0) {
    goals = seedGoals;
    await saveGoals(goals);
  }

  //Record
  const settings = await loadSettings();
  await saveSettings(settings);
  const totalSlots = calcTotalSlots(settings);

  let record = await loadRecord(date);
  if (!record) {
    record = createEmptyDayRecord(date, totalSlots);
    await saveRecord(date, record);
  }

  return { activities, goals, settings, record };
}