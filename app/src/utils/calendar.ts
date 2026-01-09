export type DateKey = `${number}-${string}-${string}`;
export type MonthCell = { date: Date; dateKey: DateKey; inMonth: boolean };
export type MonthMatrix = (MonthCell | null)[][];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function toDateKey(d: Date): DateKey {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}` as DateKey;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d?? 1);
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function getMonthMatrix(
  cursorMonth: Date,
  weekStartsOn: 0 | 1 = 0
): MonthMatrix {
  const year = cursorMonth.getFullYear();
  const month = cursorMonth.getMonth();

  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);

  //JS getDay(): 0-sun ... 6-sat
  const firstDayOfWeek = firstOfMonth.getDay();
  const offset= (firstDayOfWeek - weekStartsOn + 7) % 7;

  //gird's starting day
  const gridStart = addDays(firstOfMonth, -offset);

  const totalCells = 6 * 7;
  const cells: (MonthCell | null)[] = [];

  for ( let i = 0; i < totalCells; i++) {
    const date = addDays(gridStart, i);
    const inMonth = date.getMonth() === month;

    cells.push({
      date,
      dateKey: toDateKey(date),
      inMonth,
    });
  }

  //divide in 6 rows
  const matrix: MonthMatrix = [];
  for (let r = 0; r < 6; r++) {
    matrix.push(cells.slice(r * 7, r * 7 + 7));
  }

  return matrix;
}

//Sun-Sat or Mon-Sun
export function getWeekKeys(
  selected: Date,
  weekStartsOn: 0 | 1 = 1
): DateKey[] {
  const dow = selected.getDay();
  const offset = (dow - weekStartsOn + 7) % 7;
  const weekStart = addDays(selected, -offset);

  const keys: DateKey[] = [];
  for (let i = 0; i < 7; i++) keys.push(toDateKey(addDays(weekStart, i)));
  return keys;
}

export function formatMonthTitle(d: Date) {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return `${y} / ${pad2(m)}`;
}

export function formatWeekTitle(d: Date) {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const w = weekOfMonthSundayStart(d);
  return `${y} / ${pad2(m)} / ${w}주차`
}

export function weekOfMonthSundayStart(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const firstOfMonth = new Date(year, month, 1);
  const offset = firstOfMonth.getDay();

  const day = date.getDate();
  const week = Math.floor((offset + (day - 1)) / 7) + 1;

  return week;
}

export function isSameDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}