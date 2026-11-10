"use client";

import React from "react";
import { Habit, DayInfo, HabitCompletionMap } from "@/types/habit";
import { Trash2, Check } from "lucide-react";

interface HabitGridProps {
  habits: Habit[];
  days: DayInfo[];
  weeks: { weekNumber: number; days: DayInfo[] }[];
  completions: HabitCompletionMap;
  onToggleHabit: (habitId: string, dateString: string) => void;
  onDeleteHabit: (habitId: string) => void;
}

export const HabitGrid: React.FC<HabitGridProps> = ({
  habits,
  days,
  weeks,
  completions,
  onToggleHabit,
  onDeleteHabit,
}) => {
  return (
    <div className="bg-white dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm dark:shadow-xl transition-colors">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs select-none">
          <thead>
            {/* 1. Group Headers: Week 1, Week 2, Week 3, etc. */}
            <tr className="bg-gray-50 dark:bg-[#181a24] text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-800">
              <th className="sticky left-0 z-20 bg-gray-50 dark:bg-[#181a24] px-4 py-2.5 text-left font-bold uppercase tracking-wider text-xs border-r border-gray-200 dark:border-gray-800 min-w-[220px] shadow-[2px_0_5px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                Habits ({habits.length})
              </th>

              {weeks.map((week) => (
                <th
                  key={`week-head-${week.weekNumber}`}
                  colSpan={week.days.length}
                  className="px-2 py-2 text-center font-bold uppercase tracking-wider text-xs border-r border-gray-200 dark:border-gray-800 bg-gray-100/70 dark:bg-[#151722] text-gray-800 dark:text-gray-200"
                >
                  Week {week.weekNumber}
                </th>
              ))}

              <th className="px-3 py-2 text-center font-bold uppercase tracking-wider text-xs bg-gray-50 dark:bg-[#181a24] min-w-[90px] text-gray-800 dark:text-gray-200">
                Progress
              </th>
            </tr>

            {/* 2. Sub-Header: Day of week (Mo, Tu, We, Th, Fr, Sa, Su) */}
            <tr className="bg-gray-100/60 dark:bg-[#141620] text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800 text-[11px]">
              <th className="sticky left-0 z-20 bg-gray-100/60 dark:bg-[#141620] px-4 py-1.5 text-left font-medium border-r border-gray-200 dark:border-gray-800 shadow-[2px_0_5px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                Category
              </th>

              {days.map((day) => {
                const isWeekend = day.dayOfWeek === "Sa" || day.dayOfWeek === "Su";
                return (
                  <th
                    key={`dow-${day.dateString}`}
                    className={`px-1 py-1 text-center font-semibold border-r border-gray-200 dark:border-gray-800/80 min-w-[34px] ${
                      day.isToday
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                        : isWeekend
                        ? "text-gray-400 dark:text-gray-500"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {day.dayOfWeek}
                  </th>
                );
              })}

              <th className="px-2 py-1 text-center font-medium border-gray-200 dark:border-gray-800 text-[10px]">
                Done
              </th>
            </tr>

            {/* 3. Sub-Header: Day Numbers (1, 2, 3... 31) */}
            <tr className="bg-gray-200/50 dark:bg-[#10121a] text-gray-700 dark:text-gray-300 border-b-2 border-gray-300 dark:border-gray-700 text-xs">
              <th className="sticky left-0 z-20 bg-gray-200/50 dark:bg-[#10121a] px-4 py-1.5 text-left font-semibold border-r border-gray-200 dark:border-gray-800 shadow-[2px_0_5px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_5px_rgba(0,0,0,0.3)] text-gray-600 dark:text-gray-400">
                Days
              </th>

              {days.map((day) => (
                <th
                  key={`num-${day.dateString}`}
                  className={`px-1 py-1 text-center font-bold border-r border-gray-200 dark:border-gray-800 min-w-[34px] ${
                    day.isToday
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : "text-gray-800 dark:text-gray-300"
                  }`}
                >
                  {day.dayNumber}
                </th>
              ))}

              <th className="px-2 py-1 text-center font-bold text-gray-600 dark:text-gray-400 text-[10px]">
                % Rate
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 dark:divide-gray-800/70">
            {habits.map((habit) => {
              let completedInMonth = 0;
              days.forEach((day) => {
                const key = `${habit.id}_${day.dateString}`;
                if (completions[key]) completedInMonth++;
              });
              const habitRate = days.length > 0 ? Math.round((completedInMonth / days.length) * 100) : 0;

              return (
                <tr
                  key={habit.id}
                  className="hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors group"
                >
                  {/* Left Column: Sticky Habit Info */}
                  <td className="sticky left-0 z-10 bg-white dark:bg-[#12141c] group-hover:bg-gray-50 dark:group-hover:bg-[#181a24] px-4 py-2 border-r border-gray-200 dark:border-gray-800 shadow-[2px_0_5px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_5px_rgba(0,0,0,0.3)] transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="text-base select-none shrink-0" role="img" aria-label="icon">
                          {habit.icon || "📌"}
                        </span>
                        <div className="truncate">
                          <p className="font-semibold text-gray-800 dark:text-gray-200 truncate group-hover:text-black dark:group-hover:text-white">
                            {habit.name}
                          </p>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {habit.category}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteHabit(habit.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 rounded transition-all shrink-0"
                        title="Delete habit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                  {/* Day Checkboxes */}
                  {days.map((day) => {
                    const key = `${habit.id}_${day.dateString}`;
                    const isChecked = !!completions[key];

                    return (
                      <td
                        key={key}
                        onClick={() => onToggleHabit(habit.id, day.dateString)}
                        className={`px-1 py-1.5 text-center border-r border-gray-200 dark:border-gray-800/80 cursor-pointer select-none transition-all ${
                          day.isToday
                            ? "bg-emerald-500/10 hover:bg-emerald-500/20"
                            : "hover:bg-gray-100/70 dark:hover:bg-gray-800/40"
                        }`}
                      >
                        <div className="flex items-center justify-center">
                          <div
                            className={`w-5 h-5 rounded flex items-center justify-center transition-all border ${
                              isChecked
                                ? "bg-slate-900 border-slate-900 text-white dark:bg-slate-200 dark:border-white dark:text-gray-950 shadow-sm"
                                : "bg-white dark:bg-transparent border-gray-300 dark:border-gray-700/80 hover:border-gray-500"
                            }`}
                          >
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      </td>
                    );
                  })}

                  {/* Progress Column */}
                  <td className="px-2 py-1.5 text-center font-medium bg-white dark:bg-[#12141c] text-gray-700 dark:text-gray-300">
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-[11px] font-bold text-gray-900 dark:text-gray-200">
                        {completedInMonth}/{days.length}
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        {habitRate}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* Daily Total Summary Row */}
            <tr className="bg-gray-100/90 dark:bg-[#151722] font-semibold text-gray-700 dark:text-gray-300 border-t-2 border-gray-300 dark:border-gray-700">
              <td className="sticky left-0 z-10 bg-gray-100/90 dark:bg-[#151722] px-4 py-2 border-r border-gray-200 dark:border-gray-800 shadow-[2px_0_5px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_5px_rgba(0,0,0,0.3)] text-gray-600 dark:text-gray-400">
                Daily Completed
              </td>

              {days.map((day) => {
                let dayTotal = 0;
                habits.forEach((h) => {
                  if (completions[`${h.id}_${day.dateString}`]) dayTotal++;
                });

                return (
                  <td
                    key={`daily-total-${day.dateString}`}
                    className={`px-1 py-2 text-center border-r border-gray-200 dark:border-gray-800 text-[11px] font-bold ${
                      day.isToday
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : dayTotal > 0
                        ? "text-gray-900 dark:text-gray-200"
                        : "text-gray-400 dark:text-gray-600"
                    }`}
                  >
                    {dayTotal}
                  </td>
                );
              })}

              <td className="px-2 py-2 text-center text-gray-500 dark:text-gray-400 text-[10px]">
                Total
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
