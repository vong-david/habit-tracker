"use client";

import React, { useMemo } from "react";
import { Habit, DayInfo, HabitCompletionMap } from "@/types/habit";
import { BarChart3 } from "lucide-react";

interface HabitAnalysisTableProps {
  habits: Habit[];
  days: DayInfo[];
  completions: HabitCompletionMap;
}

export const HabitAnalysisTable: React.FC<HabitAnalysisTableProps> = ({
  habits,
  days,
  completions,
}) => {
  const goalPerHabit = days.length;

  const analysisRows = useMemo(() => {
    return habits.map((habit) => {
      let actual = 0;
      days.forEach((day) => {
        if (completions[`${habit.id}_${day.dateString}`]) {
          actual++;
        }
      });
      const left = Math.max(0, goalPerHabit - actual);
      const percentage = goalPerHabit > 0 ? Math.round((actual / goalPerHabit) * 100) : 0;

      return {
        habit,
        goal: goalPerHabit,
        actual,
        left,
        percentage,
      };
    });
  }, [habits, days, completions, goalPerHabit]);

  const summary = useMemo(() => {
    const totalGoal = habits.length * goalPerHabit;
    const totalActual = analysisRows.reduce((acc, r) => acc + r.actual, 0);
    const totalLeft = Math.max(0, totalGoal - totalActual);
    const avgPercentage = totalGoal > 0 ? Math.round((totalActual / totalGoal) * 100) : 0;
    return { totalGoal, totalActual, totalLeft, avgPercentage };
  }, [habits.length, goalPerHabit, analysisRows]);

  if (habits.length === 0) return null;

  return (
    <div className="bg-white dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm flex flex-col transition-colors">
      {/* Header matching Excel image */}
      <div className="bg-gray-50 dark:bg-[#181a24] border-b border-gray-200 dark:border-gray-800 px-4 py-2.5 flex items-center justify-between">
        <h3 className="text-xs sm:text-sm font-black tracking-wide uppercase text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-500" />
          <span>Analysis (ការវិភាគលម្អិតតាមទម្លាប់)</span>
        </h3>
        <span className="text-[11px] text-gray-400 font-semibold">
          {habits.length} ទម្លាប់
        </span>
      </div>

      {/* Table matching the Excel Analysis sheet */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-100/70 dark:bg-[#151722] text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-800 text-[11px] font-black uppercase tracking-wider">
              <th className="py-2.5 px-3">ទម្លាប់ (Habit)</th>
              <th className="py-2.5 px-2 text-center w-14">Goal</th>
              <th className="py-2.5 px-2 text-center w-14">Actual</th>
              <th className="py-2.5 px-2 text-center w-14">Left</th>
              <th className="py-2.5 px-3 min-w-[120px] text-center">Progress</th>
              <th className="py-2.5 px-3 text-right w-14">%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 font-medium">
            {analysisRows.map(({ habit, goal, actual, left, percentage }) => (
              <tr
                key={habit.id}
                className="hover:bg-gray-50/80 dark:hover:bg-[#181a26] transition-colors"
              >
                {/* Habit name */}
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2 truncate max-w-[180px] sm:max-w-[220px]">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: habit.color || "#10b981" }}
                    />
                    <span className="text-gray-900 dark:text-gray-200 font-semibold truncate" title={habit.name}>
                      {habit.name}
                    </span>
                  </div>
                </td>

                {/* Goal */}
                <td className="py-2.5 px-2 text-center font-bold text-gray-600 dark:text-gray-400">
                  {goal}
                </td>

                {/* Actual */}
                <td className="py-2.5 px-2 text-center font-black text-emerald-600 dark:text-emerald-400">
                  {actual}
                </td>

                {/* Left */}
                <td className="py-2.5 px-2 text-center font-semibold text-amber-600 dark:text-amber-400">
                  {left}
                </td>

                {/* Progress Bar inside cell */}
                <td className="py-2.5 px-3">
                  <div className="w-full bg-gray-100 dark:bg-[#1a1d28] border border-gray-200 dark:border-gray-800 h-3.5 rounded-md overflow-hidden p-0.5 shadow-inner">
                    <div
                      className="h-full bg-emerald-500 rounded-sm transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </td>

                {/* Percentage */}
                <td className="py-2.5 px-3 text-right font-black text-gray-900 dark:text-white">
                  {percentage}%
                </td>
              </tr>
            ))}
          </tbody>

          {/* Summary Footer Row */}
          <tfoot>
            <tr className="bg-gray-50 dark:bg-[#151722] border-t-2 border-gray-200 dark:border-gray-700 font-black text-xs text-gray-900 dark:text-white">
              <td className="py-2.5 px-3 uppercase tracking-wider">សរុប (Total)</td>
              <td className="py-2.5 px-2 text-center text-gray-500 dark:text-gray-400">
                {summary.totalGoal}
              </td>
              <td className="py-2.5 px-2 text-center text-emerald-500">
                {summary.totalActual}
              </td>
              <td className="py-2.5 px-2 text-center text-amber-500">
                {summary.totalLeft}
              </td>
              <td className="py-2.5 px-3">
                <div className="w-full bg-gray-200 dark:bg-[#1a1d28] h-3.5 rounded-md overflow-hidden p-0.5">
                  <div
                    className="h-full bg-emerald-500 rounded-sm transition-all duration-500"
                    style={{ width: `${summary.avgPercentage}%` }}
                  />
                </div>
              </td>
              <td className="py-2.5 px-3 text-right text-emerald-500">
                {summary.avgPercentage}%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
