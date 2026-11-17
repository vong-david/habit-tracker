"use client";

import React, { useState } from "react";
import { Habit, DayInfo, HabitCompletionMap } from "@/types/habit";
import { Trash2, Check, ArrowLeftRight, Pencil, ChevronUp, ChevronDown, GripVertical } from "lucide-react";

interface HabitGridProps {
  habits: Habit[];
  days: DayInfo[];
  weeks: { weekNumber: number; days: DayInfo[] }[];
  completions: HabitCompletionMap;
  onToggleHabit: (habitId: string, dateString: string) => void;
  onDeleteHabit: (habitId: string) => void;
  onEditHabit: (habit: Habit) => void;
  onMoveHabit: (habitId: string, direction: "up" | "down") => void;
  onReorderHabits?: (reorderedHabits: Habit[]) => void;
}

const KHMER_NUMBERS = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];
function toKhmerNum(num: number): string {
  return num
    .toString()
    .split("")
    .map((d) => KHMER_NUMBERS[parseInt(d, 10)] || d)
    .join("");
}

export const HabitGrid: React.FC<HabitGridProps> = ({
  habits,
  days,
  weeks,
  completions,
  onToggleHabit,
  onDeleteHabit,
  onEditHabit,
  onMoveHabit,
  onReorderHabits,
}) => {
  const [draggedHabitId, setDraggedHabitId] = useState<string | null>(null);
  const [dragOverHabitId, setDragOverHabitId] = useState<string | null>(null);

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, habitId: string) => {
    setDraggedHabitId(habitId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", habitId);
  };

  const handleDragOver = (e: React.DragEvent, habitId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverHabitId !== habitId) {
      setDragOverHabitId(habitId);
    }
  };

  const handleDrop = (e: React.DragEvent, targetHabitId: string) => {
    e.preventDefault();
    if (!draggedHabitId || draggedHabitId === targetHabitId) {
      setDraggedHabitId(null);
      setDragOverHabitId(null);
      return;
    }

    const sourceIndex = habits.findIndex((h) => h.id === draggedHabitId);
    const targetIndex = habits.findIndex((h) => h.id === targetHabitId);

    if (sourceIndex !== -1 && targetIndex !== -1 && onReorderHabits) {
      const copy = [...habits];
      const [moved] = copy.splice(sourceIndex, 1);
      copy.splice(targetIndex, 0, moved);
      onReorderHabits(copy);
    }

    setDraggedHabitId(null);
    setDragOverHabitId(null);
  };

  const handleDragEnd = () => {
    setDraggedHabitId(null);
    setDragOverHabitId(null);
  };

  return (
    <div className="bg-white dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm dark:shadow-xl transition-colors">
      {/* Mobile scroll hint */}
      <div className="sm:hidden px-3 py-1.5 bg-emerald-500/10 border-b border-emerald-500/20 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-medium">
          <ArrowLeftRight className="w-3.5 h-3.5 animate-pulse" />
          អូសទៅឆ្វេង-ស្តាំ ដើម្បីមើលថ្ងៃទាំងអស់
        </span>
        <span className="text-[10px] text-gray-500">{days.length} ថ្ងៃ</span>
      </div>

      <div className="overflow-x-auto relative">
        <table className="w-full border-collapse text-xs select-none">
          <thead>
            {/* 1. Group Headers: Week 1, Week 2, Week 3, etc. */}
            <tr className="bg-gray-50 dark:bg-[#181a24] text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-800">
              <th className="sticky left-0 z-20 bg-gray-50 dark:bg-[#181a24] px-3 sm:px-4 py-2 sm:py-2.5 text-left font-bold uppercase tracking-wider text-xs border-r border-gray-200 dark:border-gray-800 min-w-[170px] sm:min-w-[240px] shadow-[2px_0_5px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                <div className="flex items-center justify-between">
                  <span>ទម្លាប់ ({habits.length})</span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-normal text-gray-400 dark:text-gray-500 lowercase">
                    <GripVertical className="w-3 h-3 text-emerald-500" />
                    អូសរៀបលំដាប់
                  </span>
                </div>
              </th>

              {weeks.map((week) => (
                <th
                  key={`week-head-${week.weekNumber}`}
                  colSpan={week.days.length}
                  className="px-2 py-2 text-center font-bold tracking-wider text-xs border-r border-gray-200 dark:border-gray-800 bg-gray-100/70 dark:bg-[#151722] text-gray-800 dark:text-gray-200"
                >
                  សប្តាហ៍ទី {toKhmerNum(week.weekNumber)}
                </th>
              ))}

              <th className="px-2 sm:px-3 py-2 text-center font-bold tracking-wider text-xs bg-gray-50 dark:bg-[#181a24] min-w-[70px] sm:min-w-[90px] text-gray-800 dark:text-gray-200">
                លទ្ធផល
              </th>
            </tr>

            {/* 2. Sub-Header: Day of week */}
            <tr className="bg-gray-100/60 dark:bg-[#141620] text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800 text-[11px]">
              <th className="sticky left-0 z-20 bg-gray-100/60 dark:bg-[#141620] px-3 sm:px-4 py-1 sm:py-1.5 text-left font-medium border-r border-gray-200 dark:border-gray-800 shadow-[2px_0_5px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_5px_rgba(0,0,0,0.3)] text-[10px] sm:text-[11px]">
                ប្រភេទ
              </th>

              {days.map((day) => {
                const isWeekend = day.dayOfWeek === "អា" || day.dayOfWeek === "ស";
                return (
                  <th
                    key={`dow-${day.dateString}`}
                    title={`${day.dayOfWeek} ទី ${day.dayNumber} ${day.monthName}`}
                    className={`px-1 py-1 text-center font-semibold border-r border-gray-200 dark:border-gray-800/80 min-w-[32px] sm:min-w-[36px] ${
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

              <th className="px-1 sm:px-2 py-1 text-center font-medium border-gray-200 dark:border-gray-800 text-[10px]">
                សម្រេច
              </th>
            </tr>

            {/* 3. Sub-Header: Day Numbers */}
            <tr className="bg-gray-200/50 dark:bg-[#10121a] text-gray-700 dark:text-gray-300 border-b-2 border-gray-300 dark:border-gray-700 text-xs">
              <th className="sticky left-0 z-20 bg-gray-200/50 dark:bg-[#10121a] px-3 sm:px-4 py-1 sm:py-1.5 text-left font-semibold border-r border-gray-200 dark:border-gray-800 shadow-[2px_0_5px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_5px_rgba(0,0,0,0.3)] text-gray-600 dark:text-gray-400 text-[10px] sm:text-xs">
                ថ្ងៃទី
              </th>

              {days.map((day) => (
                <th
                  key={`num-${day.dateString}`}
                  title={`${day.dayNumber} ${day.monthName}`}
                  className={`px-1 py-1 text-center font-bold border-r border-gray-200 dark:border-gray-800 min-w-[32px] sm:min-w-[36px] ${
                    day.isToday
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black"
                      : "text-gray-800 dark:text-gray-300"
                  }`}
                >
                  {day.dayNumber}
                </th>
              ))}

              <th className="px-1 sm:px-2 py-1 text-center font-bold text-gray-600 dark:text-gray-400 text-[10px]">
                អត្រា %
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 dark:divide-gray-800/70">
            {habits.map((habit, index) => {
              let completedInMonth = 0;
              days.forEach((day) => {
                const key = `${habit.id}_${day.dateString}`;
                if (completions[key]) completedInMonth++;
              });
              const habitRate = days.length > 0 ? Math.round((completedInMonth / days.length) * 100) : 0;
              const isBeingDragged = draggedHabitId === habit.id;
              const isDragOver = dragOverHabitId === habit.id && !isBeingDragged;

              return (
                <tr
                  key={habit.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, habit.id)}
                  onDragOver={(e) => handleDragOver(e, habit.id)}
                  onDrop={(e) => handleDrop(e, habit.id)}
                  onDragEnd={handleDragEnd}
                  className={`hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors group ${
                    isBeingDragged ? "opacity-35 bg-emerald-500/10" : ""
                  } ${isDragOver ? "border-t-2 border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10" : ""}`}
                >
                  {/* Left Column: Sticky Habit Info & Drag Handle & Actions */}
                  <td className="sticky left-0 z-10 bg-white dark:bg-[#12141c] group-hover:bg-gray-50 dark:group-hover:bg-[#181a24] px-2 sm:px-3 py-1.5 border-r border-gray-200 dark:border-gray-800 shadow-[2px_0_5px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_5px_rgba(0,0,0,0.3)] transition-colors max-w-[170px] sm:max-w-none">
                    <div className="flex items-center justify-between gap-1.5">
                      
                      {/* Drag Handle */}
                      <div
                        className="cursor-grab active:cursor-grabbing p-0.5 text-gray-300 dark:text-gray-600 hover:text-emerald-500 transition-colors shrink-0"
                        title="ចុចទាញអូសឡើងលើ/ចុះក្រោម ដើម្បីរៀបលំដាប់ (Drag to reorder)"
                      >
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>

                      {/* Habit Name & Icon (clickable to edit) */}
                      <div
                        onClick={() => onEditHabit(habit)}
                        className="flex items-center gap-1.5 sm:gap-2 truncate cursor-pointer flex-1 py-0.5 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        title="ចុចដើម្បីកែប្រែទម្លាប់នេះ"
                      >
                        <span className="text-sm sm:text-base select-none shrink-0" role="img" aria-label="icon">
                          {habit.icon || "📌"}
                        </span>
                        <div className="truncate">
                          <p className="font-semibold text-gray-800 dark:text-gray-200 truncate group-hover:text-black dark:group-hover:text-white text-xs sm:text-sm">
                            {habit.name}
                          </p>
                          <span className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                            {habit.category}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons (Edit, Reorder, Delete) */}
                      <div className="flex items-center gap-0.5 shrink-0 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        {/* Reorder Up/Down Fallback */}
                        <div className="hidden sm:flex flex-col">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveHabit(habit.id, "up");
                            }}
                            className="p-0.5 text-gray-400 hover:text-emerald-500 disabled:opacity-20 transition-colors"
                            title="រំកិលឡើងលើ"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={index === habits.length - 1}
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveHabit(habit.id, "down");
                            }}
                            className="p-0.5 text-gray-400 hover:text-emerald-500 disabled:opacity-20 transition-colors"
                            title="រំកិលចុះក្រោម"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditHabit(habit);
                          }}
                          className="p-1 text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                          title="កែប្រែទម្លាប់"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteHabit(habit.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          title="លុបទម្លាប់"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

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
                        className={`px-0.5 sm:px-1 py-1.5 text-center border-r border-gray-200 dark:border-gray-800/80 cursor-pointer select-none transition-all active:scale-90 ${
                          day.isToday
                            ? "bg-emerald-500/10 hover:bg-emerald-500/20"
                            : "hover:bg-gray-100/70 dark:hover:bg-gray-800/40"
                        }`}
                      >
                        <div className="flex items-center justify-center">
                          <div
                            className={`w-5 h-5 rounded flex items-center justify-center transition-all border ${
                              isChecked
                                ? "bg-emerald-500 border-emerald-500 text-slate-950 font-black shadow-sm"
                                : "bg-transparent border-gray-300 dark:border-gray-700 hover:border-emerald-500/50"
                            }`}
                          >
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3.5]" />}
                          </div>
                        </div>
                      </td>
                    );
                  })}

                  {/* Results: Done Count */}
                  <td className="px-2 py-1.5 text-center font-bold text-gray-800 dark:text-gray-200 border-r border-gray-200 dark:border-gray-800 text-[11px] sm:text-xs">
                    {completedInMonth}/{days.length}
                  </td>

                  {/* Results: Percentage */}
                  <td className="px-2 py-1.5 text-center font-extrabold text-[11px] sm:text-xs">
                    <span
                      className={
                        habitRate === 100
                          ? "text-emerald-500"
                          : habitRate >= 70
                          ? "text-emerald-600 dark:text-emerald-400"
                          : habitRate >= 40
                          ? "text-cyan-600 dark:text-cyan-400"
                          : "text-gray-400"
                      }
                    >
                      {habitRate}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
