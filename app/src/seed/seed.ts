import type { Activity, DailyRecord, Goal, PlannerTemplate, Settings, TimeBlock } from "../types";

export const seedActivities: Activity[] = [
  { id: "coding", name: "Coding", colorHex: "#5B8CFF", sortOrder: 1 },
  { id: "study", name: "Study", colorHex: "#6BCB77", sortOrder: 2 },
  { id: "exercise", name: "Exercise", colorHex: "#FF8A5B", sortOrder: 3 },
  { id: "play", name: "Play", colorHex: "#B56BFF", sortOrder: 4 },
  { id: "sleep", name: "Sleep", colorHex: "#3A4A5F", sortOrder: 5 },
  { id: "unknown", name: "Unknown", colorHex: "#9CA3AF", sortOrder: 0 },
];

export const seedGoals: Goal[] = [
  {
    id: "goal_coding_daily",
    activityId: "coding",
    targetMinutesPerDay: 120,
    isEnabled: true,
  },
];

export const seedSettings: Settings = {
  startTime: "08:00",
  endTime: "24:00",
  slotMinutes: 30,
  appearance: "system",
}

export function createEmptyBlocks(totalSlot: number): TimeBlock[] {
  //48 blocks = 24h * 2(30min)
  return Array.from({ length: totalSlot }, () => ({
    activityId: null,
    isSkipped: false,
  }));
}

export function createEmptyDayRecord(dateKey: string, totalSlot: number): DailyRecord&PlannerTemplate {
  return {
    dateKey,
    blocks: createEmptyBlocks(totalSlot),
    cards: []
  };
}