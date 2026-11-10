import { Habit, HabitCompletionMap, WellnessMap } from "@/types/habit";

export const DEFAULT_HABITS: Habit[] = [
  { id: "1", name: "Wake up at 6:00 AM", icon: "⏰", category: "Morning", createdAt: new Date().toISOString() },
  { id: "2", name: "Morning Meditation (10m)", icon: "🧘", category: "Mindfulness", createdAt: new Date().toISOString() },
  { id: "3", name: "Read 20 Pages", icon: "📖", category: "Growth", createdAt: new Date().toISOString() },
  { id: "4", name: "Workout / Gym (45m)", icon: "🏋️", category: "Fitness", createdAt: new Date().toISOString() },
  { id: "5", name: "Drink 2.5L Water", icon: "💧", category: "Health", createdAt: new Date().toISOString() },
  { id: "6", name: "No Sugar / Detox Diet", icon: "🥗", category: "Health", createdAt: new Date().toISOString() },
  { id: "7", name: "Deep Work / Code (2h)", icon: "💻", category: "Productivity", createdAt: new Date().toISOString() },
  { id: "8", name: "Learn New Skills", icon: "🚀", category: "Growth", createdAt: new Date().toISOString() },
  { id: "9", name: "Clean Workspace", icon: "✨", category: "Organization", createdAt: new Date().toISOString() },
  { id: "10", name: "Sleep by 10:30 PM", icon: "🌙", category: "Night", createdAt: new Date().toISOString() },
];

const HABITS_STORAGE_KEY = "habit_tracker_habits_v1";
const COMPLETIONS_STORAGE_KEY = "habit_tracker_completions_v1";
const WELLNESS_STORAGE_KEY = "habit_tracker_wellness_v1";

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
      // Pre-populate some realistic sample data for current month (first 10 days) like in the screenshot
      const sampleCompletions: HabitCompletionMap = {};
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const todayDate = now.getDate();
      
      const maxSampleDay = Math.min(todayDate, 12);
      DEFAULT_HABITS.forEach((h, hIdx) => {
        for (let d = 1; d <= maxSampleDay; d++) {
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          // Give ~80-90% check rate for realistic visual
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

