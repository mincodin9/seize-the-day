import type { Activity, DailyRecord, Goal, PlannerTemplate, TimeBlock } from "../types";

export const seedActivities: Activity[] = [
  { id: "coding", name: "Coding", colorHex: "#5B8CFF", sortOrder: 1 },
  { id: "study", name: "Study", colorHex: "#6BCB77", sortOrder: 2 },
  { id: "exercise", name: "Exercise", colorHex: "#FF8A5B", sortOrder: 3 },
  { id: "play", name: "Play", colorHex: "#B56BFF", sortOrder: 4 },
  { id: "sleep", name: "Sleep", colorHex: "#3A4A5F", sortOrder: 5 },
];

export const seedGoals: Goal[] = [
  {
    id: "goal_coding_daily",
    activityId: "coding",
    targetMinutesPerDay: 120,
    isEnabled: true,
  },
];

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

//Format today's date as YYYY-MM-DD
export function getTodayKey(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}