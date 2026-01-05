import type { Settings } from "../types";

export function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function calcTotalSlots(s: Settings) {
  const startMin = timeToMinutes(s.startTime);
  const endMin = timeToMinutes(s.endTime);
  return Math.max(0, Math.floor((endMin - startMin) / s.slotMinutes));
}

export function slotLabel(startMin: number, idx: number, slotMinutes = 30) {
  const m = startMin + idx * slotMinutes;
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

//Format today's date as YYYY-MM-DD
export function getTodayKey(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
