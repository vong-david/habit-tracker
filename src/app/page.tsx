"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Habit, HabitCompletionMap, WellnessMap, TrackerCycleConfig, HabitNotesMap, DayInfo } from "@/types/habit";
import { UserProfile, SyncStatus } from "@/types/auth";
import { getStoredUser, saveUserSession } from "@/lib/auth";
import {
  DEFAULT_HABITS,
  loadHabits,
  saveHabits,
  loadCompletions,
  saveCompletions,
  loadWellness,
  saveWellness,
  loadCycleConfig,
  saveCycleConfig,
  loadHabitNotes,
  saveHabitNotes,
} from "@/lib/storage";
import {
  getDaysInMonth,
  getDaysForCycle,
  groupDaysByWeek,
  getKhmerMonthYear,
  getKhmerDateRangeLabel,
  toKhmerNum,
} from "@/lib/dateUtils";
import { syncHabitDataToSheet } from "@/lib/googleSheets";
import {
  writeToExcelFileHandle,
  downloadExcelFile,
  getStoredHandle,
} from "@/lib/excelStorage";
import { Header } from "@/components/Header";
import { DailyProgressBarChart, DailyProgressData } from "@/components/DailyProgressBarChart";
import { WeeklyProgressBarChart } from "@/components/WeeklyProgressBarChart";
import { HabitGrid } from "@/components/HabitGrid";
import { WellnessTracker } from "@/components/WellnessTracker";
import { AddHabitModal } from "@/components/AddHabitModal";
import { EditHabitModal } from "@/components/EditHabitModal";
import { StartingDayModal } from "@/components/StartingDayModal";
import { ExcelConnectionModal } from "@/components/ExcelConnectionModal";
import { HabitNoteModal } from "@/components/HabitNoteModal";

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  // Local Excel File Storage State
  const [excelState, setExcelState] = useState<{
    isConnected: boolean;
    fileName: string | null;
    fileHandle: FileSystemFileHandle | null;
    lastSyncedAt: string | null;
    isSyncing: boolean;
  }>({
    isConnected: false,
    fileName: null,
    fileHandle: null,
    lastSyncedAt: null,
    isSyncing: false,
  });
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  // Starting Day / Cycle State (Default to today_to_end)
  const [cycleConfig, setCycleConfig] = useState<TrackerCycleConfig>({ mode: "today_to_end" });
  const [customCycleStartDate, setCustomCycleStartDate] = useState<Date>(new Date());
  const [isStartingDayModalOpen, setIsStartingDayModalOpen] = useState(false);

  const [habits, setHabits] = useState<Habit[]>(DEFAULT_HABITS);
  const [completions, setCompletions] = useState<HabitCompletionMap>({});
  const [habitNotes, setHabitNotes] = useState<HabitNotesMap>({});
  const [activeNoteTarget, setActiveNoteTarget] = useState<{ habit: Habit; day: DayInfo } | null>(null);
  const [wellness, setWellness] = useState<WellnessMap>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Initialize on mount
  useEffect(() => {
    setIsClient(true);
    const storedUser = getStoredUser();
    setUser(storedUser);

    const userId = storedUser?.id;
    setHabits(loadHabits(userId));
    setCompletions(loadCompletions(userId));
    setHabitNotes(loadHabitNotes(userId));
    setWellness(loadWellness(userId));

    // Load cycle configuration (defaults to today_to_end)
    const savedCycle = loadCycleConfig(userId);
    if (savedCycle && savedCycle.mode) {
      setCycleConfig(savedCycle);
      if (savedCycle.startDate) {
        const [y, m, d] = savedCycle.startDate.split("-").map(Number);
        setCustomCycleStartDate(new Date(y, m - 1, d));
      }
    } else {
      setCycleConfig({ mode: "today_to_end" });
    }

    // Check if an Excel File Handle was previously saved
    getStoredHandle().then(async (handle) => {
      if (handle) {
        try {
          // @ts-ignore
          const perm = await handle.queryPermission({ mode: "readwrite" });
          if (perm === "granted") {
            setExcelState({
              isConnected: true,
              fileName: handle.name,
              fileHandle: handle,
              lastSyncedAt: new Date().toLocaleTimeString(),
              isSyncing: false,
            });
            return;
          }
        } catch (e) {
          console.warn("Could not query handle permission", e);
        }
      }
      // If no connected Excel file, prompt the user with the Excel Connection modal!
      setIsExcelModalOpen(true);
    });

    const savedTheme = localStorage.getItem("habit_tracker_theme") as "dark" | "light" | null;
    const initialTheme = savedTheme || "dark";
    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Sync to user-scoped LocalStorage whenever state changes
  useEffect(() => {
    if (!isClient) return;
    saveHabits(habits, user?.id);
  }, [habits, user?.id, isClient]);

  useEffect(() => {
    if (!isClient) return;
    saveCompletions(completions, user?.id);
  }, [completions, user?.id, isClient]);

  useEffect(() => {
    if (!isClient) return;
    saveWellness(wellness, user?.id);
  }, [wellness, user?.id, isClient]);

  useEffect(() => {
    if (!isClient) return;
    saveHabitNotes(habitNotes, user?.id);
  }, [habitNotes, user?.id, isClient]);

  // Calendar Month values
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Days in current selected view (Today-to-end, Custom-day-to-end, or Full Month)
  const isCustomCycle = cycleConfig.mode !== "full_month";

  const days = useMemo(() => {
    const today = new Date();
    const isViewingCurrentMonth =
      today.getFullYear() === currentDate.getFullYear() &&
      today.getMonth() === currentDate.getMonth();

    if (cycleConfig.mode === "consecutive_days") {
      return getDaysForCycle(customCycleStartDate, cycleConfig.durationDays || 30);
    }

    if (cycleConfig.mode === "today_to_end") {
      const startDay = isViewingCurrentMonth ? today.getDate() : 1;
      return getDaysInMonth(year, month, startDay);
    }

    if (cycleConfig.mode === "custom_start_day") {
      const startDay = cycleConfig.startDay || (isViewingCurrentMonth ? today.getDate() : 1);
      return getDaysInMonth(year, month, startDay);
    }

    // Default: full_month (from day 1 to end of month)
    return getDaysInMonth(year, month, 1);
  }, [cycleConfig, customCycleStartDate, year, month, currentDate]);

  const weeks = useMemo(() => groupDaysByWeek(days), [days]);

  // Date Range Label displayed in Header
  const dateRangeLabel = useMemo(() => {
    return getKhmerDateRangeLabel(days);
  }, [days]);

  // Auto-sync debounced to linked Local Excel File (.xlsx)
  useEffect(() => {
    if (!isClient || !excelState.isConnected || !excelState.fileHandle) return;

    setExcelState((prev) => ({ ...prev, isSyncing: true }));
    const timer = setTimeout(async () => {
      try {
        await writeToExcelFileHandle(
          excelState.fileHandle!,
          habits,
          completions,
          wellness,
          days,
          dateRangeLabel,
          cycleConfig,
          habitNotes
        );
        setExcelState((prev) => ({
          ...prev,
          isSyncing: false,
          lastSyncedAt: new Date().toLocaleTimeString(),
        }));
      } catch (err) {
        console.warn("Auto-sync to Excel file failed", err);
        setExcelState((prev) => ({ ...prev, isSyncing: false }));
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [habits, completions, habitNotes, wellness, days, dateRangeLabel, cycleConfig, excelState.isConnected, excelState.fileHandle, isClient]);

  // Auto-sync debounced to Google Sheet (if user has connected Google Sheets)
  useEffect(() => {
    if (!isClient || !user?.accessToken || !user?.spreadsheetId) return;

    setSyncStatus("syncing");
    const timer = setTimeout(async () => {
      try {
        await syncHabitDataToSheet(
          user.accessToken!,
          user.spreadsheetId!,
          habits,
          completions,
          wellness,
          days,
          dateRangeLabel
        );
        setSyncStatus("synced");
      } catch (err) {
        console.warn("Auto-sync error", err);
        setSyncStatus("error");
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [habits, completions, wellness, days, dateRangeLabel, user, isClient]);

  // Manual sync handler
  const handleManualSync = useCallback(async () => {
    if (!user?.accessToken || !user?.spreadsheetId) return;
    setSyncStatus("syncing");
    try {
      await syncHabitDataToSheet(
        user.accessToken,
        user.spreadsheetId,
        habits,
        completions,
        wellness,
        days,
        dateRangeLabel
      );
      setSyncStatus("synced");
      alert("បាន Sync ទិន្នន័យទៅកាន់ Google Sheets រួចរាល់!");
    } catch (err) {
      console.error(err);
      setSyncStatus("error");
      alert("មានបញ្ហាក្នុងការ Sync ទៅ Google Sheets។");
    }
  }, [user, dateRangeLabel, habits, completions, wellness, days]);

  // Handle Login
  const handleLogin = (newUser: UserProfile) => {
    setUser(newUser);
    saveUserSession(newUser);
    setHabits(loadHabits(newUser.id));
    setCompletions(loadCompletions(newUser.id));
    setHabitNotes(loadHabitNotes(newUser.id));
    setWellness(loadWellness(newUser.id));
    const userCycle = loadCycleConfig(newUser.id);
    if (userCycle && userCycle.mode) {
      setCycleConfig(userCycle);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setUser(null);
    saveUserSession(null);
    setSyncStatus("idle");
    setHabits(loadHabits(undefined));
    setCompletions(loadCompletions(undefined));
    setHabitNotes(loadHabitNotes(undefined));
    setWellness(loadWellness(undefined));
    const guestCycle = loadCycleConfig(undefined);
    setCycleConfig(guestCycle || { mode: "today_to_end" });
  };

  // Theme switcher handler
  const handleToggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("habit_tracker_theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Previous Month
  const handlePrevDate = () => {
    if (cycleConfig.mode === "consecutive_days") {
      const duration = cycleConfig.durationDays || 30;
      setCustomCycleStartDate(
        (prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - duration)
      );
    } else {
      setCurrentDate(new Date(year, month - 1, 1));
    }
  };

  // Next Month
  const handleNextDate = () => {
    if (cycleConfig.mode === "consecutive_days") {
      const duration = cycleConfig.durationDays || 30;
      setCustomCycleStartDate(
        (prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + duration)
      );
    } else {
      setCurrentDate(new Date(year, month + 1, 1));
    }
  };

  // Go to Today
  const handleGoToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    if (cycleConfig.mode === "consecutive_days") {
      setCustomCycleStartDate(now);
    }
  };

  // Save Cycle Config
  const handleSaveCycleConfig = (newConfig: TrackerCycleConfig) => {
    setCycleConfig(newConfig);
    saveCycleConfig(newConfig, user?.id);
    if (newConfig.mode === "consecutive_days" && newConfig.startDate) {
      const [y, m, d] = newConfig.startDate.split("-").map(Number);
      setCustomCycleStartDate(new Date(y, m - 1, d));
    }
  };

  // Drag and drop reorder habits
  const handleReorderHabits = (newHabits: Habit[]) => {
    setHabits(newHabits);
    saveHabits(newHabits, user?.id);
  };

  // Toggle habit checkbox
  const handleToggleHabit = (habitId: string, dateString: string) => {
    const key = `${habitId}_${dateString}`;
    setCompletions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Add new habit
  const handleAddHabit = (newHabit: { name: string; icon: string; category: string }) => {
    const created: Habit = {
      id: "habit_" + Date.now(),
      name: newHabit.name,
      icon: newHabit.icon,
      category: newHabit.category,
      createdAt: new Date().toISOString(),
    };
    setHabits((prev) => [...prev, created]);
  };

  // Edit / Update habit
  const handleUpdateHabit = (updated: Habit) => {
    setHabits((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
  };

  // Delete habit
  const handleDeleteHabit = (habitId: string) => {
    if (!confirm("តើអ្នកប្រាកដជាចង់លុបទម្លាប់នេះមែនទេ?")) return;
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    setCompletions((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (key.startsWith(`${habitId}_`)) {
          delete next[key];
        }
      });
      return next;
    });
    setHabitNotes((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (key.startsWith(`${habitId}_`)) {
          delete next[key];
        }
      });
      return next;
    });
  };

  // Move habit up or down
  const handleMoveHabit = (habitId: string, direction: "up" | "down") => {
    setHabits((prev) => {
      const index = prev.findIndex((h) => h.id === habitId);
      if (index === -1) return prev;
      if (direction === "up" && index === 0) return prev;
      if (direction === "down" && index === prev.length - 1) return prev;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  // Clear checks for a habit in current view
  const handleClearHabitMonthLogs = (habitId: string) => {
    setCompletions((prev) => {
      const next = { ...prev };
      days.forEach((day) => {
        const key = `${habitId}_${day.dateString}`;
        delete next[key];
      });
      return next;
    });
    setHabitNotes((prev) => {
      const next = { ...prev };
      days.forEach((day) => {
        const key = `${habitId}_${day.dateString}`;
        delete next[key];
      });
      return next;
    });
  };

  // Save Note & Completion from HabitNoteModal
  const handleSaveNote = (completed: boolean, note: string) => {
    if (!activeNoteTarget) return;
    const key = `${activeNoteTarget.habit.id}_${activeNoteTarget.day.dateString}`;
    setCompletions((prev) => ({
      ...prev,
      [key]: completed,
    }));
    setHabitNotes((prev) => {
      const next = { ...prev };
      const trimmed = note.trim();
      if (trimmed.length > 0) {
        next[key] = trimmed;
      } else {
        delete next[key];
      }
      return next;
    });
  };

  // Update wellness metric
  const handleUpdateWellness = (dateString: string, field: "mood" | "sleepHours", value: number) => {
    setWellness((prev) => ({
      ...prev,
      [dateString]: {
        ...prev[dateString],
        [field]: value,
      },
    }));
  };

  // Reset to default habits
  const handleResetData = () => {
    if (confirm("តើអ្នកពិតជាចង់កំណត់ទិន្នន័យទម្លាប់ និងការតាមដានឡើងវិញទៅលំនាំដើមមែនទេ?")) {
      saveHabits(DEFAULT_HABITS, user?.id);
      saveCompletions({}, user?.id);
      saveHabitNotes({}, user?.id);
      saveWellness({}, user?.id);
      setHabits(DEFAULT_HABITS);
      setCompletions({});
      setHabitNotes({});
      setWellness({});
    }
  };

  // Export Excel (.xlsx)
  const handleExportExcel = () => {
    downloadExcelFile(
      habits,
      completions,
      wellness,
      days,
      dateRangeLabel,
      excelState.fileName || "habit-tracker-data.xlsx",
      cycleConfig,
      habitNotes
    );
  };

  // Export JSON Backup
  const handleExportData = () => {
    const backup = {
      user: user ? { email: user.email, name: user.name, spreadsheetUrl: user.spreadsheetUrl } : null,
      cycleConfig,
      habits,
      completions,
      habitNotes,
      wellness,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `habit-tracker-backup-${user?.email || "guest"}-${year}-${month + 1}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON Backup
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.habits && Array.isArray(parsed.habits)) {
          setHabits(parsed.habits);
          if (parsed.completions) setCompletions(parsed.completions);
          if (parsed.habitNotes) {
            setHabitNotes(parsed.habitNotes);
            saveHabitNotes(parsed.habitNotes, user?.id);
          }
          if (parsed.wellness) setWellness(parsed.wellness);
          if (parsed.cycleConfig) {
            setCycleConfig(parsed.cycleConfig);
            saveCycleConfig(parsed.cycleConfig, user?.id);
          }
          alert("ទិន្នន័យត្រូវបាននាំចូល (Import) ដោយជោគជ័យ!");
        } else {
          alert("ឯកសារ Backup មិនត្រឹមត្រូវទេ។");
        }
      } catch (err) {
        console.error(err);
        alert("មិនអាចអានឯកសារដែលបានជ្រើសរើសបានទេ។");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Import from Excel file
  const handleImportFromExcel = (data: {
    habits?: Habit[];
    completions?: HabitCompletionMap;
    habitNotes?: HabitNotesMap;
    wellness?: WellnessMap;
    cycleConfig?: TrackerCycleConfig;
  }) => {
    if (data.habits && data.habits.length > 0) {
      setHabits(data.habits);
      saveHabits(data.habits, user?.id);
    }
    if (data.completions) {
      setCompletions(data.completions);
      saveCompletions(data.completions, user?.id);
    }
    if (data.habitNotes) {
      setHabitNotes(data.habitNotes);
      saveHabitNotes(data.habitNotes, user?.id);
    }
    if (data.wellness) {
      setWellness(data.wellness);
      saveWellness(data.wellness, user?.id);
    }
    if (data.cycleConfig) {
      setCycleConfig(data.cycleConfig);
      saveCycleConfig(data.cycleConfig, user?.id);
    }
  };

  // Calculate Daily Progress Data for the chart
  const dailyChartData: DailyProgressData[] = useMemo(() => {
    const totalHabits = habits.length;
    return days.map((day) => {
      let completedCount = 0;
      habits.forEach((h) => {
        if (completions[`${h.id}_${day.dateString}`]) completedCount++;
      });

      const percentage = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;

      return {
        dayInfo: day,
        dayLabel: `${day.dayOfWeek} ${day.dayNumber}`,
        dayOfWeek: day.dayOfWeek,
        dayNumber: day.dayNumber,
        dateString: day.dateString,
        percentage,
        completed: completedCount,
        total: totalHabits,
      };
    });
  }, [days, habits, completions]);

  // Calculate Weekly Progress Data for the chart
  const weeklyChartData = useMemo(() => {
    const totalHabits = habits.length;

    return weeks.map((week) => {
      const totalPossible = totalHabits * week.days.length;
      let totalDone = 0;
      week.days.forEach((day) => {
        habits.forEach((h) => {
          if (completions[`${h.id}_${day.dateString}`]) totalDone++;
        });
      });

      const percentage = totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;

      return {
        weekLabel: `សប្តាហ៍ ${toKhmerNum(week.weekNumber)}`,
        weekNumber: week.weekNumber,
        percentage,
        completed: totalDone,
        total: totalPossible,
      };
    });
  }, [weeks, habits, completions]);

  // Summary stats
  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }, []);

  const todayPercentage = useMemo(() => {
    const total = habits.length;
    if (total === 0) return 0;
    let done = 0;
    habits.forEach((h) => {
      if (completions[`${h.id}_${todayStr}`]) done++;
    });
    return Math.round((done / total) * 100);
  }, [habits, completions, todayStr]);

  const monthAveragePercentage = useMemo(() => {
    if (dailyChartData.length === 0) return 0;
    const sum = dailyChartData.reduce((acc, curr) => acc + curr.percentage, 0);
    return Math.round(sum / dailyChartData.length);
  }, [dailyChartData]);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#090a0f] flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
        កំពុងដំណើរការកម្មវិធីតាមដានទម្លាប់...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#090a0f] text-gray-900 dark:text-gray-100 flex flex-col pb-12 transition-colors duration-200">
      {/* 1. Header Bar with Local Excel Storage, Google Auth, Theme */}
      <Header
        currentDate={currentDate}
        dateRangeLabel={dateRangeLabel}
        isCustomCycle={isCustomCycle}
        onOpenStartingDayModal={() => setIsStartingDayModalOpen(true)}
        excelStorageState={excelState}
        onOpenExcelModal={() => setIsExcelModalOpen(true)}
        onExportExcel={handleExportExcel}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        user={user}
        syncStatus={syncStatus}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onManualSync={handleManualSync}
        onPrevMonth={handlePrevDate}
        onNextMonth={handleNextDate}
        onGoToToday={handleGoToToday}
        onOpenAddHabit={() => setIsAddModalOpen(true)}
        onResetData={handleResetData}
        onExportData={handleExportData}
        onImportData={handleImportData}
        totalHabits={habits.length}
        todayPercentage={todayPercentage}
        monthAveragePercentage={monthAveragePercentage}
      />

      <main className="max-w-[1700px] w-full mx-auto px-2 sm:px-6 pt-4 sm:pt-6 flex-1 space-y-4 sm:space-y-6">
        {/* 2. Top Charts Section (Stacked on mobile, 3:1 on desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="lg:col-span-3">
            <DailyProgressBarChart data={dailyChartData} theme={theme} />
          </div>
          <div className="lg:col-span-1">
            <WeeklyProgressBarChart data={weeklyChartData} theme={theme} />
          </div>
        </div>

        {/* 3. Middle Habit Grid Table (Mobile Responsive with Drag and Drop Reordering) */}
        <HabitGrid
          habits={habits}
          days={days}
          weeks={weeks}
          completions={completions}
          habitNotes={habitNotes}
          onOpenNoteModal={(habit, day) => setActiveNoteTarget({ habit, day })}
          onToggleHabit={handleToggleHabit}
          onDeleteHabit={handleDeleteHabit}
          onEditHabit={(habit) => setEditingHabit(habit)}
          onMoveHabit={handleMoveHabit}
          onReorderHabits={handleReorderHabits}
        />

        {/* 4. Bottom Overall Wellness Row */}
        <WellnessTracker
          days={days}
          wellness={wellness}
          onUpdateWellness={handleUpdateWellness}
        />
      </main>

      {/* Starting Day & Cycle Configuration Modal */}
      <StartingDayModal
        isOpen={isStartingDayModalOpen}
        onClose={() => setIsStartingDayModalOpen(false)}
        cycleConfig={cycleConfig}
        onSaveCycleConfig={handleSaveCycleConfig}
        currentDate={currentDate}
      />

      {/* Local Excel Storage Connection Modal */}
      <ExcelConnectionModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onConnected={(fileName, fileHandle) => {
          setExcelState({
            isConnected: true,
            fileName,
            fileHandle,
            lastSyncedAt: new Date().toLocaleTimeString(),
            isSyncing: false,
          });
        }}
        habits={habits}
        completions={completions}
        habitNotes={habitNotes}
        wellness={wellness}
        days={days}
        dateRangeLabel={dateRangeLabel}
        cycleConfig={cycleConfig}
        onImportData={handleImportFromExcel}
        canDismiss={true}
      />

      {/* Habit Note Daily Modal Popup */}
      <HabitNoteModal
        isOpen={!!activeNoteTarget}
        onClose={() => setActiveNoteTarget(null)}
        habit={activeNoteTarget?.habit || null}
        day={activeNoteTarget?.day || null}
        initialCompleted={
          activeNoteTarget
            ? !!completions[`${activeNoteTarget.habit.id}_${activeNoteTarget.day.dateString}`]
            : false
        }
        initialNote={
          activeNoteTarget
            ? habitNotes[`${activeNoteTarget.habit.id}_${activeNoteTarget.day.dateString}`] || ""
            : ""
        }
        onSave={handleSaveNote}
      />

      {/* Add Habit Modal */}
      <AddHabitModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddHabit={handleAddHabit}
      />

      {/* Edit Habit Modal */}
      <EditHabitModal
        habit={editingHabit}
        isOpen={!!editingHabit}
        onClose={() => setEditingHabit(null)}
        onUpdateHabit={handleUpdateHabit}
        onDeleteHabit={handleDeleteHabit}
        onClearHabitMonthLogs={handleClearHabitMonthLogs}
      />
    </div>
  );
}
