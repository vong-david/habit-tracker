import { Habit, HabitCompletionMap, WellnessMap } from "@/types/habit";

export const DEFAULT_HABITS: Habit[] = [
  { id: "1", name: "ក្រោកពីគេងម៉ោង 6:00 ព្រឹក", icon: "⏰", category: "ពេលព្រឹក", createdAt: new Date().toISOString() },
  { id: "2", name: "សមាធិពេលព្រឹក 10 នាទី", icon: "🧘", category: "ស្មារតី", createdAt: new Date().toISOString() },
  { id: "3", name: "អានសៀវភៅ 20 ទំព័រ", icon: "📖", category: "ការអភិវឌ្ឍ", createdAt: new Date().toISOString() },
  { id: "4", name: "ហាត់ប្រាណ / Gym 45 នាទី", icon: "🏋️", category: "កាយសម្បទា", createdAt: new Date().toISOString() },
  { id: "5", name: "ញ៉ាំទឹក 2.5 លីត្រ", icon: "💧", category: "សុខភាព", createdAt: new Date().toISOString() },
  { id: "6", name: "តមជាតិស្ករ / បរិភោគបន្លែ", icon: "🥗", category: "សុខភាព", createdAt: new Date().toISOString() },
  { id: "7", name: "ផ្តោតលើការងារ / កូដ 2 ម៉ោង", icon: "💻", category: "ផលិតភាព", createdAt: new Date().toISOString() },
  { id: "8", name: "រៀនជំនាញថ្មី 30 នាទី", icon: "🚀", category: "ការអភិវឌ្ឍ", createdAt: new Date().toISOString() },
  { id: "9", name: "រៀបចំតុ និងកន្លែងធ្វើការ", icon: "✨", category: "រៀបចំ", createdAt: new Date().toISOString() },
  { id: "10", name: "ចូលគេងមុនម៉ោង 10:30 យប់", icon: "🌙", category: "ពេលយប់", createdAt: new Date().toISOString() },
];

function getScopedKey(baseKey: string, userId?: string): string {
  const safeId = userId ? userId.replace(/[^a-zA-Z0-9_-]/g, "_") : "guest";
  return `${baseKey}_user_${safeId}`;
}

const BASE_HABITS_KEY = "habit_tracker_habits_v3";
const BASE_COMPLETIONS_KEY = "habit_tracker_completions_v3";
const BASE_WELLNESS_KEY = "habit_tracker_wellness_v3";

export function loadHabits(userId?: string): Habit[] {
  if (typeof window === "undefined") return DEFAULT_HABITS;
  const key = getScopedKey(BASE_HABITS_KEY, userId);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      saveHabits(DEFAULT_HABITS, userId);
      return DEFAULT_HABITS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load habits from localStorage", e);
    return DEFAULT_HABITS;
  }
}

export function saveHabits(habits: Habit[], userId?: string): void {
  if (typeof window === "undefined") return;
  const key = getScopedKey(BASE_HABITS_KEY, userId);
  try {
    localStorage.setItem(key, JSON.stringify(habits));
  } catch (e) {
    console.error("Failed to save habits to localStorage", e);
  }
}

export function loadCompletions(userId?: string): HabitCompletionMap {
  if (typeof window === "undefined") return {};
  const key = getScopedKey(BASE_COMPLETIONS_KEY, userId);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      const sampleCompletions: HabitCompletionMap = {};
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const todayDate = now.getDate();
      
      const maxSampleDay = Math.min(todayDate, 12);
      DEFAULT_HABITS.forEach((h, hIdx) => {
        for (let d = 1; d <= maxSampleDay; d++) {
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const isDone = ((d + hIdx * 3) % 7 !== 0);
          sampleCompletions[`${h.id}_${dateStr}`] = isDone;
        }
      });
      saveCompletions(sampleCompletions, userId);
      return sampleCompletions;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load completions from localStorage", e);
    return {};
  }
}

export function saveCompletions(completions: HabitCompletionMap, userId?: string): void {
  if (typeof window === "undefined") return;
  const key = getScopedKey(BASE_COMPLETIONS_KEY, userId);
  try {
    localStorage.setItem(key, JSON.stringify(completions));
  } catch (e) {
    console.error("Failed to save completions to localStorage", e);
  }
}

export function loadWellness(userId?: string): WellnessMap {
  if (typeof window === "undefined") return {};
  const key = getScopedKey(BASE_WELLNESS_KEY, userId);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      const sampleWellness: WellnessMap = {};
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const todayDate = now.getDate();
      for (let d = 1; d <= Math.min(todayDate, 12); d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        sampleWellness[dateStr] = {
          mood: 4,
          sleepHours: 7.5,
        };
      }
      saveWellness(sampleWellness, userId);
      return sampleWellness;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load wellness from localStorage", e);
    return {};
  }
}

export function saveWellness(wellness: WellnessMap, userId?: string): void {
  if (typeof window === "undefined") return;
  const key = getScopedKey(BASE_WELLNESS_KEY, userId);
  try {
    localStorage.setItem(key, JSON.stringify(wellness));
  } catch (e) {
    console.error("Failed to save wellness to localStorage", e);
  }
}
