"use client";

import React, { useRef } from "react";
import { ChevronLeft, ChevronRight, Plus, Download, Upload, RotateCcw, Calendar, CheckCircle2 } from "lucide-react";

interface HeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToToday: () => void;
  onOpenAddHabit: () => void;
  onResetData: () => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  totalHabits: number;
  todayPercentage: number;
  monthAveragePercentage: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onGoToToday,
  onOpenAddHabit,
  onResetData,
  onExportData,
  onImportData,
  totalHabits,
  todayPercentage,
  monthAveragePercentage,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const monthYearString = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <header className="bg-[#12141c] border-b border-gray-800/80 px-4 sm:px-6 py-4">
      <div className="max-w-[1700px] mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        
        {/* Brand & Month navigation */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black tracking-wider text-sm shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              HT
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white uppercase flex items-center gap-2">
                Habit Tracker
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Vercel Ready
                </span>
              </h1>
              <p className="text-xs text-gray-400">Master your daily consistency</p>
            </div>
          </div>

          <div className="h-6 w-px bg-gray-800 hidden sm:block mx-1" />

          {/* Month Navigator */}
          <div className="flex items-center gap-1.5 bg-[#181a24] p-1 rounded-lg border border-gray-800">
            <button
              onClick={onPrevMonth}
              className="p-1.5 hover:bg-gray-800 text-gray-300 hover:text-white rounded transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-sm font-semibold text-white px-3 min-w-[140px] text-center select-none">
              {monthYearString}
            </span>

            <button
              onClick={onNextMonth}
              className="p-1.5 hover:bg-gray-800 text-gray-300 hover:text-white rounded transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={onGoToToday}
              className="ml-1 px-2.5 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors flex items-center gap-1"
            >
              <Calendar className="w-3.5 h-3.5" />
              Today
            </button>
          </div>
        </div>

        {/* Quick Stats Banner */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-[#181a24] border border-gray-800 px-3 py-1.5 rounded-lg flex items-center gap-2.5">
            <div className="text-xs text-gray-400">Habits</div>
            <div className="text-sm font-bold text-white">{totalHabits}</div>
          </div>

          <div className="bg-[#181a24] border border-gray-800 px-3 py-1.5 rounded-lg flex items-center gap-2.5">
            <div className="text-xs text-gray-400">Today</div>
            <div className="text-sm font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {todayPercentage}%
            </div>
          </div>

          <div className="bg-[#181a24] border border-gray-800 px-3 py-1.5 rounded-lg flex items-center gap-2.5">
            <div className="text-xs text-gray-400">Monthly Avg</div>
            <div className="text-sm font-bold text-cyan-400">{monthAveragePercentage}%</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenAddHabit}
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Habit
          </button>

          <button
            onClick={onExportData}
            title="Export habit data as JSON"
            className="p-2 bg-[#181a24] hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 rounded-lg text-xs transition-colors flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={onImportData}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            title="Import habit data from JSON"
            className="p-2 bg-[#181a24] hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 rounded-lg text-xs transition-colors flex items-center gap-1"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Import</span>
          </button>

          <button
            onClick={onResetData}
            title="Reset to default sample habits"
            className="p-2 bg-[#181a24] hover:bg-red-500/10 hover:text-red-400 text-gray-400 border border-gray-800 hover:border-red-500/30 rounded-lg text-xs transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
