import { Activity, ActivityId, DailyRecord, Settings } from "../types";
import { calcTotalSlots } from "./slots";

//Types(Report-only)
export type ActivityMinutesMap = Record<ActivityId, number>;

export type Summary = {
  totalMinutes: number;
  byActivity: ActivityMinutesMap;
};

export type ActivityReportItem = {
  id: ActivityId;
  name: string;
  colorHex: string;
  minutes: number;
};

//Day/Week Summary
export function summarizeDayRecord(
  record: DailyRecord,
  settings: Settings
): Summary {
  const slotMinutes = settings.slotMinutes;
  const expectedSlots = calcTotalSlots(settings);

  const blocks = record.blocks.slice(0, expectedSlots);

  let totalMinutes = 0;
  const byActivity: ActivityMinutesMap = {};

  for (const block of blocks) {
    if (!block.activityId) continue;
    if (block.isSkipped) continue;

    totalMinutes += slotMinutes;
    byActivity[block.activityId] = 
      (byActivity[block.activityId] ?? 0) + slotMinutes;
  }

  return { totalMinutes, byActivity };
}

//Merge two summaries(used for week aggregation)
export function mergeSummary(a: Summary, b: Summary): Summary {
  const byActivity: ActivityMinutesMap = { ...a.byActivity };

  for (const [id, minutes] of Object.entries(b.byActivity)) {
    const key = id as ActivityId;
    byActivity[key] = (byActivity[key] ?? 0) + minutes;
  }

  return {
    totalMinutes: a.totalMinutes + b.totalMinutes, byActivity,
  };
}

//Summarize multiple day records(a week)
export function summarizeWeekRecords(
  records: (DailyRecord | null)[],
  settings: Settings
): Summary {
  return records
    .filter((r): r is DailyRecord => r !== null)
    .map(r => summarizeDayRecord(r, settings))
    .reduce(
      (acc, cur) => mergeSummary(acc, cur),
      { totalMinutes: 0, byActivity: {} }
    );
}

//Enrich/Format
export function toActivityReportItems(
  summary: Summary,
  activities: Activity[]
): ActivityReportItem[] {
  return Object.entries(summary.byActivity).map(([id, minutes]) => {
    const activity = activities.find(a => a.id === id);
    return {
      id: id as ActivityId,
      name: activity?.name ?? "unknown",
      colorHex: activity?.colorHex ?? "#999",
      minutes,
    };
  });
}

//Get top acitivity by time
export function getTopActivity(
  items: ActivityReportItem[]
): ActivityReportItem | null {
  return (
    items.slice().sort((a, b) => b.minutes - a.minutes)[0] ?? null
  );
}

//Convert minutes to readdable Label
export function minutesToLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

//Chart helpers
//Donut/Pie char
export function toDonutChartData(items: ActivityReportItem[]) {
  return items.map(item => ({
    key: item.id,
    value: item.minutes,
    svg: { fill: item.colorHex },
  }));
}

//Bar chart
export function toBarChartData(items: ActivityReportItem[]) {
  return items.map(item => ({
    label: item.name,
    value: item.minutes,
    color: item.colorHex,
  }));
}