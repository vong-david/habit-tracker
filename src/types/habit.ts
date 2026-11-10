export interface Habit {
  id: string;
  name: string;
  icon: string;
  category: string;
  color?: string;
  createdAt: string;
}

export type HabitCompletionMap = Record<string, boolean>; // key: `${habitId}_${dateString}` (YYYY-MM-DD)

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
  isToday: boolean;
}

