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

const HABITS_STORAGE_KEY = "habit_tracker_habits_km_v2";
const COMPLETIONS_STORAGE_KEY = "habit_tracker_completions_km_v2";
const WELLNESS_STORAGE_KEY = "habit_tracker_wellness_km_v2";

export function loadHabits(): Habit[] {
  if (typeof window === "undefined") return DEFAULT_HABITS;
  try {
    const raw = localStorage.getItem(HABITS_STORAGE_KEY);
    if (!raw) {
      saveHabits(DEFAULT_HABITS);
      return DEFAULT_HABITS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load habits from localStorage", e);
    return DEFAULT_HABITS;
  }
}

export function saveHabits(habits: Habit[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(habits));
  } catch (e) {
    console.error("Failed to save habits to localStorage", e);
  }
}

export function loadCompletions(): HabitCompletionMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(COMPLETIONS_STORAGE_KEY);
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
      saveCompletions(sampleCompletions);
      return sampleCompletions;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load completions from localStorage", e);
    return {};
  }
}

export function saveCompletions(completions: HabitCompletionMap): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COMPLETIONS_STORAGE_KEY, JSON.stringify(completions));
  } catch (e) {
    console.error("Failed to save completions to localStorage", e);
  }
}

export function loadWellness(): WellnessMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(WELLNESS_STORAGE_KEY);
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
      saveWellness(sampleWellness);
      return sampleWellness;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load wellness from localStorage", e);
    return {};
  }
}

export function saveWellness(wellness: WellnessMap): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WELLNESS_STORAGE_KEY, JSON.stringify(wellness));
  } catch (e) {
    console.error("Failed to save wellness to localStorage", e);
  }
}
