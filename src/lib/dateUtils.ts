import { DayInfo } from "@/types/habit";

export const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function getDaysInMonth(year: number, monthIndex: number): DayInfo[] {
  // monthIndex: 0-11
  const daysCount = new Date(year, monthIndex + 1, 0).getDate();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const days: DayInfo[] = [];

  for (let d = 1; d <= daysCount; d++) {
    const date = new Date(year, monthIndex, d);
    const dayOfWeek = DAY_NAMES[date.getDay()];
    const dateString = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const weekNumber = Math.ceil(d / 7);

    days.push({
      date,
      dateString,
      dayNumber: d,
      dayOfWeek,
      weekNumber,
      isToday: dateString === todayStr,
    });
  }

  return days;
}

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

