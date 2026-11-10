"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Habit, HabitCompletionMap, WellnessMap } from "@/types/habit";
import {
  DEFAULT_HABITS,
  loadHabits,
  saveHabits,
  loadCompletions,
  saveCompletions,
  loadWellness,
  saveWellness,
} from "@/lib/storage";
import { getDaysInMonth, groupDaysByWeek } from "@/lib/dateUtils";
import { Header } from "@/components/Header";
import { DailyProgressBarChart } from "@/components/DailyProgressBarChart";
import { WeeklyProgressBarChart } from "@/components/WeeklyProgressBarChart";
import { HabitGrid } from "@/components/HabitGrid";
import { WellnessTracker } from "@/components/WellnessTracker";
import { AddHabitModal } from "@/components/AddHabitModal";

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [habits, setHabits] = useState<Habit[]>(DEFAULT_HABITS);
  const [completions, setCompletions] = useState<HabitCompletionMap>({});
  const [wellness, setWellness] = useState<WellnessMap>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Initialize from LocalStorage on mount
  useEffect(() => {
    setIsClient(true);
    setHabits(loadHabits());
    setCompletions(loadCompletions());
    setWellness(loadWellness());
  }, []);

  // Sync to LocalStorage whenever state changes
  useEffect(() => {
    if (!isClient) return;
    saveHabits(habits);
  }, [habits, isClient]);

  useEffect(() => {
    if (!isClient) return;
    saveCompletions(completions);
  }, [completions, isClient]);

  useEffect(() => {
    if (!isClient) return;
    saveWellness(wellness);
  }, [wellness, isClient]);

  // Days in current selected month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const weeks = useMemo(() => groupDaysByWeek(days), [days]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleGoToToday = () => {
    setCurrentDate(new Date());
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

  // Delete habit
  const handleDeleteHabit = (habitId: string) => {
    if (!confirm("Are you sure you want to remove this habit?")) return;
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
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
    if (confirm("Reset to default habits and sample tracking data?")) {
      localStorage.clear();
      setHabits(DEFAULT_HABITS);
      setCompletions(loadCompletions());
      setWellness(loadWellness());
    }
  };

  // Export JSON
  const handleExportData = () => {
    const backup = {
      habits,
      completions,
      wellness,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `habit-tracker-backup-${year}-${month + 1}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON
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
          if (parsed.wellness) setWellness(parsed.wellness);
          alert("Data imported successfully!");
        } else {
          alert("Invalid backup file format.");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to parse the uploaded file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Calculate Daily Progress Data for the chart
  const dailyChartData = useMemo(() => {
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
      let totalPossible = week.days.length * totalHabits;
      let totalDone = 0;
      week.days.forEach((day) => {
        habits.forEach((h) => {
          if (completions[`${h.id}_${day.dateString}`]) totalDone++;
        });
      });

      const percentage = totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;

      return {
        weekLabel: `week ${week.weekNumber}`,
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
      <div className="min-h-screen bg-[#0b0c10] flex items-center justify-center text-gray-400">
        Loading Habit Tracker...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090a0f] text-gray-100 flex flex-col pb-12">
      {/* 1. Header Bar */}
      <Header
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onGoToToday={handleGoToToday}
        onOpenAddHabit={() => setIsAddModalOpen(true)}
        onResetData={handleResetData}
        onExportData={handleExportData}
        onImportData={handleImportData}
        totalHabits={habits.length}
        todayPercentage={todayPercentage}
        monthAveragePercentage={monthAveragePercentage}
      />

      <main className="max-w-[1700px] w-full mx-auto px-4 sm:px-6 pt-6 flex-1 space-y-6">
        {/* 2. Top Charts Section (Matching the image layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <DailyProgressBarChart data={dailyChartData} />
          </div>
          <div className="lg:col-span-1">
            <WeeklyProgressBarChart data={weeklyChartData} />
          </div>
        </div>

        {/* 3. Middle Habit Grid Table */}
        <HabitGrid
          habits={habits}
          days={days}
          weeks={weeks}
          completions={completions}
          onToggleHabit={handleToggleHabit}
          onDeleteHabit={handleDeleteHabit}
        />

        {/* 4. Bottom Overall Wellness Row */}
        <WellnessTracker
          days={days}
          wellness={wellness}
          onUpdateWellness={handleUpdateWellness}
        />
      </main>

      {/* Add Habit Modal */}
      <AddHabitModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddHabit={handleAddHabit}
      />
    </div>
  );
}
