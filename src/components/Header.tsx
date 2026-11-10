"use client";

import React, { useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Download,
  Upload,
  RotateCcw,
  Calendar,
  CheckCircle2,
  Sun,
  Moon,
} from "lucide-react";
import { getKhmerMonthYear } from "@/lib/dateUtils";
import { UserProfile } from "@/types/auth";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";

interface HeaderProps {
  currentDate: Date;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  user: UserProfile | null;
  onLogin: (user: UserProfile) => void;
  onLogout: () => void;
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
  theme,
  onToggleTheme,
  user,
  onLogin,
  onLogout,
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
  const monthYearString = getKhmerMonthYear(currentDate);

  return (
    <header className="bg-white dark:bg-[#12141c] border-b border-gray-200 dark:border-gray-800/80 px-3 sm:px-6 py-3.5 shadow-sm transition-colors sticky top-0 z-30 backdrop-blur-md bg-white/95 dark:bg-[#12141c]/95">
      <div className="max-w-[1700px] mx-auto flex flex-col gap-3.5">
        
        {/* Top Bar: Brand, Month Navigator, Auth, Theme */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 font-black tracking-wider text-xs sm:text-sm shadow-[0_0_15px_rgba(16,185,129,0.15)] shrink-0">
              HT
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-1.5">
                <span>តាមដានទម្លាប់</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hidden xs:inline-block">
                  Vercel Free
                </span>
              </h1>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                កសាងទម្លាប់ល្អជារៀងរាល់ថ្ងៃ
              </p>
            </div>
          </div>

          {/* Month Navigator */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#181a24] p-1 rounded-lg border border-gray-200 dark:border-gray-800 text-xs sm:text-sm">
            <button
              onClick={onPrevMonth}
              className="p-1 sm:p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded transition-colors"
              title="ខែមុន"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-semibold text-gray-800 dark:text-white px-2 sm:px-3 text-center min-w-[105px] sm:min-w-[125px] select-none text-xs sm:text-sm">
              {monthYearString}
            </span>

            <button
              onClick={onNextMonth}
              className="p-1 sm:p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded transition-colors"
              title="ខែបន្ទាប់"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={onGoToToday}
              className="ml-0.5 px-2 py-1 text-[11px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors flex items-center gap-1"
            >
              <Calendar className="w-3 h-3" />
              <span>ថ្ងៃនេះ</span>
            </button>
          </div>

          {/* Right Section: Google Sign-in & Theme Switcher */}
          <div className="flex items-center gap-2">
            <GoogleAuthButton user={user} onLogin={onLogin} onLogout={onLogout} />

            {/* Theme Switcher Button */}
            <button
              onClick={onToggleTheme}
              title={theme === "dark" ? "ប្តូរទៅ Light Mode" : "ប្តូរទៅ Dark Mode"}
              className="p-2 bg-gray-100 dark:bg-[#181a24] hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 rounded-lg text-xs transition-all flex items-center gap-1.5 shadow-sm"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline text-xs font-medium">ពន្លឺ</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <span className="hidden sm:inline text-xs font-medium">ងងឹត</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Lower Row: Stats & Action Buttons (Mobile Optimized) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 border-t border-gray-100 dark:border-gray-800/50">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
            <div className="bg-gray-100/80 dark:bg-[#181a24] border border-gray-200 dark:border-gray-800 px-2.5 py-1.5 rounded-lg text-center sm:text-left sm:flex sm:items-center sm:gap-2">
              <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">ទម្លាប់សរុប</div>
              <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">{totalHabits}</div>
            </div>

            <div className="bg-gray-100/80 dark:bg-[#181a24] border border-gray-200 dark:border-gray-800 px-2.5 py-1.5 rounded-lg text-center sm:text-left sm:flex sm:items-center sm:gap-2">
              <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">ថ្ងៃនេះ</div>
              <div className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {todayPercentage}%
              </div>
            </div>

            <div className="bg-gray-100/80 dark:bg-[#181a24] border border-gray-200 dark:border-gray-800 px-2.5 py-1.5 rounded-lg text-center sm:text-left sm:flex sm:items-center sm:gap-2">
              <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">មធ្យមភាគខែ</div>
              <div className="text-xs sm:text-sm font-bold text-cyan-600 dark:text-cyan-400">{monthAveragePercentage}%</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={onOpenAddHabit}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 text-xs font-bold px-3 py-1.5 sm:py-2 rounded-lg transition-all shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>បន្ថែមទម្លាប់</span>
            </button>

            <button
              onClick={onExportData}
              title="ទាញយកទិន្នន័យជាឯកសារ JSON Backup"
              className="p-1.5 sm:px-2.5 sm:py-2 bg-gray-100 dark:bg-[#181a24] hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 rounded-lg text-xs transition-colors flex items-center gap-1 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ទាញយក</span>
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
              title="បញ្ចូលទិន្នន័យពីឯកសារ Backup"
              className="p-1.5 sm:px-2.5 sm:py-2 bg-gray-100 dark:bg-[#181a24] hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 rounded-lg text-xs transition-colors flex items-center gap-1 shrink-0"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">បញ្ចូល</span>
            </button>

            <button
              onClick={onResetData}
              title="កំណត់ទិន្នន័យឡើងវិញទៅលំនាំដើម"
              className="p-1.5 sm:p-2 bg-gray-100 dark:bg-[#181a24] hover:bg-red-500/10 hover:text-red-500 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:border-red-500/30 rounded-lg text-xs transition-colors shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
