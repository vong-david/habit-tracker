import { DayInfo, TrackerCycleConfig } from "@/types/habit";

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

/**
 * Calculates the array of days to display based on the user's cycle configuration and current viewed date.
 *
 * Rules:
 * 1. "consecutive_days": durationDays from customCycleStartDate.
 * 2. "full_month": 1 to end of current month.
 * 3. "start_date_to_end" / "today_to_end" / "custom_start_day":
 *    - In the starting month: displays from `startDay` (e.g. 18) to the end of that month (30).
 *    - In next / future months: displays the full month (1 to end of month, e.g. Dec 1 to 31).
 *    - In past months (when user clicks back to view previous months): displays the full month (1 to end of month) with all old data kept!
 */
export function getDaysForView(
  currentDate: Date,
  cycleConfig: TrackerCycleConfig,
  customCycleStartDate?: Date
): DayInfo[] {
  const viewYear = currentDate.getFullYear();
  const viewMonth = currentDate.getMonth();

  if (cycleConfig.mode === "consecutive_days") {
    return getDaysForCycle(customCycleStartDate || currentDate, cycleConfig.durationDays || 30);
  }

  if (cycleConfig.mode === "full_month") {
    return getDaysInMonth(viewYear, viewMonth, 1);
  }

  // Parse start date (defaults to 2026-11-18 or today)
  let startYear = new Date().getFullYear();
  let startMonth = new Date().getMonth();
  let startDay = 18;

  if (cycleConfig.startDate) {
    const parts = cycleConfig.startDate.split("-").map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      startYear = parts[0];
      startMonth = parts[1] - 1;
      startDay = parts[2];
    }
  } else if (cycleConfig.startDay) {
    startDay = cycleConfig.startDay;
  }

  // 1. If viewing the exact starting month:
  // Displays from startDay (e.g. 18) to the end of that month (e.g. 30).
  // Notice: startDay is FIXED! It does NOT move to 19 tomorrow!
  if (viewYear === startYear && viewMonth === startMonth) {
    return getDaysInMonth(viewYear, viewMonth, startDay);
  }

  // 2. If viewing a future month (e.g. next month, December 2026):
  // "then next month will show next month" -> full month from day 1 to end!
  if (viewYear > startYear || (viewYear === startYear && viewMonth > startMonth)) {
    return getDaysInMonth(viewYear, viewMonth, 1);
  }

  // 3. If viewing a past month (e.g. October 2026):
  // "but keep old data if user click to view back month bro" -> full month so past data is shown!
  return getDaysInMonth(viewYear, viewMonth, 1);
}
