"use client";

import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { Habit, DayInfo, HabitCompletionMap } from "@/types/habit";
import { DailyProgressData } from "@/components/DailyProgressBarChart";
import { toKhmerNum } from "@/lib/dateUtils";

interface WeeklyProgressItem {
  weekLabel: string;
  weekNumber: number;
  percentage: number;
  completed: number;
  total: number;
}

interface GamifiedHabitDashboardProps {
  habits: Habit[];
  days: DayInfo[];
  weeks: { weekNumber: number; days: DayInfo[] }[];
  completions: HabitCompletionMap;
  dailyChartData: DailyProgressData[];
  weeklyChartData: WeeklyProgressItem[];
  theme?: "dark" | "light";
}

export const GamifiedHabitDashboard: React.FC<GamifiedHabitDashboardProps> = ({
  habits,
  days,
  completions,
  dailyChartData,
  weeklyChartData,
  theme,
}) => {
  const [chartMode, setChartMode] = useState<"weekly" | "daily">("weekly");

  const isDark =
    theme !== undefined
      ? theme === "dark"
      : typeof document !== "undefined" &&
        document.documentElement.classList.contains("dark");

  // 1. KPI Calculations (Matching Excel Gamified Tracker)
  const totalGoal = useMemo(() => habits.length * days.length, [habits.length, days.length]);

  const totalCompleted = useMemo(() => {
    let count = 0;
    habits.forEach((h) => {
      days.forEach((d) => {
        if (completions[`${h.id}_${d.dateString}`]) count++;
      });
    });
    return count;
  }, [habits, days, completions]);

  const totalLeft = Math.max(0, totalGoal - totalCompleted);
  const overallPercentage = totalGoal > 0 ? Math.round((totalCompleted / totalGoal) * 100) : 0;

  // Donut SVG circumference calculation
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallPercentage / 100) * circumference;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
      
      {/* 1. LEFT: Daily / Weekly Progress Chart (Col 1 to 6) */}
      <div className="lg:col-span-6 bg-white dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm flex flex-col transition-colors">
        {/* Header bar */}
        <div className="bg-gray-50 dark:bg-[#181a24] border-b border-gray-200 dark:border-gray-800 px-4 py-2.5 flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-black tracking-wide uppercase text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <span>Daily Progress (ការរីកចម្រើន)</span>
          </h2>

          {/* Toggle between Weekly and Daily */}
          <div className="flex items-center bg-gray-200/80 dark:bg-[#20222f] p-0.5 rounded-lg text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setChartMode("weekly")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                chartMode === "weekly"
                  ? "bg-white dark:bg-[#12141c] text-emerald-600 dark:text-emerald-400 shadow-xs font-black"
                  : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              តាមសប្តាហ៍
            </button>
            <button
              type="button"
              onClick={() => setChartMode("daily")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                chartMode === "daily"
                  ? "bg-white dark:bg-[#12141c] text-emerald-600 dark:text-emerald-400 shadow-xs font-black"
                  : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              ប្រចាំថ្ងៃ
            </button>
          </div>
        </div>

        {/* Chart View */}
        <div className="p-3 sm:p-4 pt-4 flex-1 min-h-[190px] w-full">
          {chartMode === "weekly" ? (
            <ResponsiveContainer width="100%" height={175}>
              <BarChart
                data={weeklyChartData}
                margin={{ top: 8, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={isDark ? "#222634" : "#e2e8f0"}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fill: isDark ? "#9ca3af" : "#475569", fontSize: 9 }}
                  axisLine={{ stroke: isDark ? "#2a2f3f" : "#cbd5e1" }}
                  tickLine={false}
                />
                <XAxis
                  dataKey="weekLabel"
                  tickLine={false}
                  axisLine={{ stroke: isDark ? "#2a2f3f" : "#cbd5e1" }}
                  tick={{ fill: isDark ? "#cbd5e1" : "#334155", fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip
                  cursor={{ fill: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload as WeeklyProgressItem;
                      return (
                        <div className="bg-white dark:bg-[#1a1d28] border border-gray-200 dark:border-gray-700 p-2.5 rounded-xl shadow-xl text-xs text-gray-900 dark:text-white space-y-1">
                          <div className="font-bold">{d.weekLabel}</div>
                          <div className="text-emerald-500 font-black text-sm">{d.percentage}%</div>
                          <div className="text-[10px] text-gray-400">
                            {d.completed} / {d.total} ទម្លាប់សម្រេច
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="percentage" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {weeklyChartData.map((entry, index) => (
                    <Cell
                      key={`weekly-cell-${index}`}
                      fill={entry.percentage > 0 ? (isDark ? "#10b981" : "#059669") : isDark ? "#1e2230" : "#e2e8f0"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={175}>
              <BarChart
                data={dailyChartData}
                margin={{ top: 8, right: 6, left: -22, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={isDark ? "#222634" : "#e2e8f0"}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fill: isDark ? "#9ca3af" : "#475569", fontSize: 9 }}
                  axisLine={{ stroke: isDark ? "#2a2f3f" : "#cbd5e1" }}
                  tickLine={false}
                />
                <XAxis
                  dataKey="dateString"
                  interval={0}
                  tickLine={false}
                  axisLine={{ stroke: isDark ? "#2a2f3f" : "#cbd5e1" }}
                  tick={({ x, y, payload }) => {
                    const item = dailyChartData.find(
                      (d) => d.dateString === payload.value || d.dayInfo.dateString === payload.value
                    );
                    const isToday = item?.dayInfo.isToday;
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text
                          x={0}
                          y={7}
                          dy={4}
                          textAnchor="middle"
                          fill={isToday ? (isDark ? "#34d399" : "#059669") : isDark ? "#94a3b8" : "#475569"}
                          fontSize={8}
                          fontWeight={isToday ? "bold" : "600"}
                        >
                          {item?.dayOfWeek}
                        </text>
                        <text
                          x={0}
                          y={17}
                          dy={4}
                          textAnchor="middle"
                          fill={isToday ? (isDark ? "#34d399" : "#059669") : isDark ? "#f1f5f9" : "#0f172a"}
                          fontSize={9}
                          fontWeight={isToday ? "bold" : "600"}
                        >
                          {item?.dayNumber ?? payload.value}
                        </text>
                      </g>
                    );
                  }}
                  height={30}
                />
                <Tooltip
                  cursor={{ fill: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload as DailyProgressData;
                      return (
                        <div className="bg-white dark:bg-[#1a1d28] border border-gray-200 dark:border-gray-700 p-2.5 rounded-xl shadow-xl text-xs text-gray-900 dark:text-white space-y-1">
                          <div className="font-semibold flex items-center justify-between gap-3">
                            <span>ថ្ងៃ {d.dayOfWeek} ទី {d.dayNumber}</span>
                            <span className="text-emerald-500 font-bold">{d.percentage}%</span>
                          </div>
                          <div className="text-[10px] text-gray-400">
                            សម្រេច {d.completed} / {d.total} ទម្លាប់
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="percentage" radius={[4, 4, 0, 0]} maxBarSize={20}>
                  {dailyChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.percentage > 0 ? (isDark ? "#10b981" : "#059669") : isDark ? "#1e2230" : "#e2e8f0"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2. CENTER: Stacked KPI Metric Cards (Goal, Completed, Left) (Col 7 to 9) */}
      <div className="lg:col-span-3 flex flex-col justify-between gap-2.5">
        
        {/* Card 1: Goal */}
        <div className="flex-1 bg-white dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="bg-gray-100/80 dark:bg-[#181a24] px-4 py-1.5 text-center border-b border-gray-200 dark:border-gray-800">
            <span className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Goal (គោលដៅ)
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center p-3">
            <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              {totalGoal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Card 2: Completed */}
        <div className="flex-1 bg-white dark:bg-[#12141c] border border-emerald-500/30 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="bg-emerald-500/10 dark:bg-emerald-500/15 px-4 py-1.5 text-center border-b border-emerald-500/20">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              Completed (សម្រេច)
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center p-3">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {totalCompleted.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Card 3: Left */}
        <div className="flex-1 bg-white dark:bg-[#12141c] border border-amber-500/30 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="bg-amber-500/10 dark:bg-amber-500/15 px-4 py-1.5 text-center border-b border-amber-500/20">
            <span className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
              Left (នៅសល់)
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center p-3">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
              {totalLeft.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 3. RIGHT: Overall Stats (Donut Chart) (Col 10 to 12) */}
      <div className="lg:col-span-3 bg-white dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm flex flex-col transition-colors">
        {/* Header */}
        <div className="bg-gray-50 dark:bg-[#181a24] border-b border-gray-200 dark:border-gray-800 px-4 py-2.5 text-center">
          <h2 className="text-xs sm:text-sm font-black tracking-wide uppercase text-gray-800 dark:text-gray-200">
            Overall Stats (ស្ថិតិរួម)
          </h2>
        </div>

        {/* Donut Chart Container */}
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 128 128">
              {/* Background Circle */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                className="stroke-gray-100 dark:stroke-[#202330]"
                strokeWidth="14"
                fill="transparent"
              />
              {/* Animated Progress Circle */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                className="stroke-emerald-500 transition-all duration-700 ease-out"
                strokeWidth="14"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            {/* Center Percentage */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                {overallPercentage}%
              </span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                សម្រេច
              </span>
            </div>
          </div>

          <div className="mt-2 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
              {totalCompleted} នៃ {totalGoal} ដង ({overallPercentage}%)
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
