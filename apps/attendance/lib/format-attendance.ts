const DAY_NAMES = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"];

export function formatTime(timestamp: string | null): string | null {
  if (!timestamp) return null;
  const d = new Date(timestamp);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${month}-${day}`;
}

export function getDayName(dateStr: string): string {
  return DAY_NAMES[new Date(dateStr).getDay()];
}

export function formatDuration(minutes: number | null): string {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}ц ${m}м`;
}

export function isToday(dateStr: string): boolean {
  return new Date().toISOString().slice(0, 10) === dateStr.slice(0, 10);
}

const MONTH_NAMES_MN = [
  "1-р сар",
  "2-р сар",
  "3-р сар",
  "4-р сар",
  "5-р сар",
  "6-р сар",
  "7-р сар",
  "8-р сар",
  "9-р сар",
  "10-р сар",
  "11-р сар",
  "12-р сар",
];

export function formatMonth(monthDate: string | Date): string {
  const d = typeof monthDate === "string" ? new Date(monthDate) : monthDate;
  return `${d.getFullYear()} оны ${MONTH_NAMES_MN[d.getMonth()]}`;
}

export function monthFirstDay(monthDate: string | Date): Date {
  const d = typeof monthDate === "string" ? new Date(monthDate) : monthDate;
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function monthLastDay(monthDate: string | Date): Date {
  const d = typeof monthDate === "string" ? new Date(monthDate) : monthDate;
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function toMonthParam(monthDate: Date): string {
  const y = monthDate.getFullYear();
  const m = (monthDate.getMonth() + 1).toString().padStart(2, "0");
  return `${y}-${m}`;
}

export function parseMonthParam(param: string | null | undefined): Date {
  if (!param) return monthFirstDay(new Date());
  const match = /^(\d{4})-(\d{2})$/.exec(param);
  if (!match) return monthFirstDay(new Date());
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  if (month < 1 || month > 12) return monthFirstDay(new Date());
  return new Date(year, month - 1, 1);
}

export function addMonths(monthDate: Date, delta: number): Date {
  return new Date(monthDate.getFullYear(), monthDate.getMonth() + delta, 1);
}

export function toDateOnlyString(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr);
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

// Уурхайн ээлжийн ростер: 7+7 хоног. Долоо хоног нь баасан гарагаас эхэлж
// дараа долоо хоногийн баасан хүртэл (баасан..пүрэв 7 өдөр).
export function currentWeekStart(today: Date): Date {
  const d = new Date(today);
  d.setHours(0, 0, 0, 0);
  const dayOfWeek = d.getDay(); // 0=Sun..6=Sat, Friday=5
  const daysBack = (dayOfWeek - 5 + 7) % 7;
  d.setDate(d.getDate() - daysBack);
  return d;
}

export function currentWeekEnd(today: Date): Date {
  const start = currentWeekStart(today);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return end;
}
