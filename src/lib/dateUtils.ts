import { DayInfo } from "@/types/habit";

export const KHMER_DAY_NAMES = ["អា", "ច", "អ", "ព", "ព្រ", "សុ", "ស"];

export const KHMER_MONTH_NAMES = [
  "មករា",
  "កុម្ភៈ",
  "មីនា",
  "មេសា",
  "ឧសភា",
  "មិថុនា",
  "កក្កដា",
  "សីហា",
  "កញ្ញា",
  "តុលា",
  "វិច្ឆិកា",
  "ធ្នូ",
];

export const KHMER_NUMBERS = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];

export function toKhmerNum(num: number): string {
  return num
    .toString()
    .split("")
    .map((d) => KHMER_NUMBERS[parseInt(d, 10)] || d)
    .join("");
}

export function getKhmerMonthYear(date: Date): string {
  const monthName = KHMER_MONTH_NAMES[date.getMonth()];
  const year = toKhmerNum(date.getFullYear());
  return `${monthName} ${year}`;
}

export function getKhmerDateRangeLabel(days: DayInfo[]): string {
  if (days.length === 0) return "";
  const first = days[0].date;
  const last = days[days.length - 1].date;

  const firstDay = toKhmerNum(first.getDate());
  const lastDay = toKhmerNum(last.getDate());
  const firstMonth = KHMER_MONTH_NAMES[first.getMonth()];
  const lastMonth = KHMER_MONTH_NAMES[last.getMonth()];
  const year = toKhmerNum(last.getFullYear());

  if (first.getMonth() === last.getMonth() && first.getFullYear() === last.getFullYear()) {
    // If full month starting at 1
    if (first.getDate() === 1 && last.getDate() >= 28) {
      return `${firstMonth} ${year}`;
    }
    return `${firstDay} - ${lastDay} ${firstMonth} ${year}`;
  }

  return `${firstDay} ${firstMonth} - ${lastDay} ${lastMonth} ${year}`;
}

/**
 * Returns days in a specific calendar month from startDay (e.g. 12th or 17th) up to the end of the month
 */
export function getDaysInMonth(year: number, monthIndex: number, startDay: number = 1): DayInfo[] {
  const daysCount = new Date(year, monthIndex + 1, 0).getDate();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const validStartDay = Math.max(1, Math.min(startDay, daysCount));
  const days: DayInfo[] = [];

  for (let d = validStartDay; d <= daysCount; d++) {
    const date = new Date(year, monthIndex, d);
    const dayOfWeek = KHMER_DAY_NAMES[date.getDay()];
    const dateString = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const weekNumber = Math.floor((d - validStartDay) / 7) + 1;

    days.push({
      date,
      dateString,
      dayNumber: d,
      dayOfWeek,
      weekNumber,
      monthIndex,
      monthName: KHMER_MONTH_NAMES[monthIndex],
      isToday: dateString === todayStr,
      cycleIndex: d - validStartDay,
    });
  }

  return days;
}

/**
 * Returns consecutive days starting from any custom starting date for a given duration
 */
export function getDaysForCycle(startDate: Date, durationDays: number = 30): DayInfo[] {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const days: DayInfo[] = [];

  for (let i = 0; i < durationDays; i++) {
    const current = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
    const dayOfWeek = KHMER_DAY_NAMES[current.getDay()];
    const dateString = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
    const weekNumber = Math.floor(i / 7) + 1;
    const monthIndex = current.getMonth();

    days.push({
      date: current,
      dateString,
      dayNumber: current.getDate(),
      dayOfWeek,
      weekNumber,
      monthIndex,
      monthName: KHMER_MONTH_NAMES[monthIndex],
      isToday: dateString === todayStr,
      cycleIndex: i,
    });
  }

  return days;
}

/**
 * Group days into week chunks
 */
export function groupDaysByWeek(days: DayInfo[]): { weekNumber: number; days: DayInfo[] }[] {
  const groups: Record<number, DayInfo[]> = {};
  days.forEach((day) => {
    if (!groups[day.weekNumber]) {
      groups[day.weekNumber] = [];
    }
    groups[day.weekNumber].push(day);
  });

  return Object.keys(groups).map((key) => ({
    weekNumber: Number(key),
    days: groups[Number(key)],
  }));
}
