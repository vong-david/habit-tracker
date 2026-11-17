export interface Habit {
  id: string;
  name: string;
  icon: string;
  category: string;
  color?: string;
  createdAt: string;
  startDate?: string;
}

export type HabitCompletionMap = Record<string, boolean>; // key: `${habitId}_${dateString}` (YYYY-MM-DD)
export type HabitNotesMap = Record<string, string>; // key: `${habitId}_${dateString}` (YYYY-MM-DD)

export interface WellnessData {
  mood?: number; // 1 to 5
  sleepHours?: number; // e.g. 7 or 7.5
  notes?: string;
}

export type WellnessMap = Record<string, WellnessData>; // key: dateString (YYYY-MM-DD)

export interface DayInfo {
  date: Date;
  dateString: string; // YYYY-MM-DD
  dayNumber: number; // 1 - 31
  dayOfWeek: string; // Mo, Tu, We, Th, Fr, Sa, Su
  weekNumber: number; // 1, 2, 3, 4, 5
  monthIndex: number; // 0 - 11
  monthName: string;
  isToday: boolean;
  cycleIndex?: number;
}

export interface TrackerCycleConfig {
  mode: "today_to_end" | "custom_start_day" | "full_month" | "consecutive_days";
  startDay?: number; // e.g. 12 or 17 (starts on this day of month to end of month)
  startDate?: string; // "YYYY-MM-DD"
  durationDays?: number; // default 30 for consecutive_days mode
}
