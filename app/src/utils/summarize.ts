import type { Activity, DailyRecord } from "../types";

type SummaryRow = { activityId: string; name: string; minutes: number };

export function summarizeRecord(
  record: DailyRecord,
  activities: Activity[],
  slotMinutes: number
): { topText: string; rows: SummaryRow[] } {
  const byId = new Map<string, Activity>();
  for (const a of activities) byId.set(a.id, a);

  const minutesByActivity = new Map<string, number>();

  for(const b of record.blocks) {
    if (!b?.activityId) continue;
    const prev = minutesByActivity.get(b.activityId) ?? 0;
    minutesByActivity.set(b.activityId, prev + slotMinutes);
  }

  const rows: SummaryRow[] = Array.from(minutesByActivity.entries())
    .map(([activityId, minutes]) => ({
      activityId,
      minutes,
      name: byId.get(activityId)?.name ?? activityId,
    }))
    .sort((a, b) => b.minutes - a.minutes);

    const top2 = rows.slice(0, 2).map((r) => `${r.name} ${formatHours(r.minutes)}`);
    const extra = Math.max(0, rows.length - 2);

    const topText =
      rows.length === 0 ? "No record" : `${top2.join(" · ")}${extra ? ` · + ${extra}` : ""}`;

    return { topText, rows };
}

export function formatHours(minutes: number) {
  const h = minutes / 60;
  const rounded = Math.round(h * 2) / 2;
  return `${rounded}h`;
}