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
  CalendarDays,
  CheckCircle2,
  Sun,
  Moon,
} from "lucide-react";
import { getKhmerMonthYear } from "@/lib/dateUtils";
import { UserProfile, SyncStatus } from "@/types/auth";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";

interface HeaderProps {
  currentDate: Date;
  dateRangeLabel?: string;
  isCustomCycle?: boolean;
  onOpenStartingDayModal?: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  user: UserProfile | null;
  syncStatus?: SyncStatus;
  onLogin: (user: UserProfile) => void;
  onLogout: () => void;
  onManualSync?: () => void;
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
  dateRangeLabel,
  isCustomCycle = false,
  onOpenStartingDayModal,
  theme,
  onToggleTheme,
  user,
  syncStatus = "idle",
  onLogin,
  onLogout,
  onManualSync,
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
                  Google Sheet Storage
                </span>
              </h1>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                កត់ត្រាទិន្នន័យក្នុង Excel Google Sheets ផ្ទាល់ខ្លួន
              </p>
            </div>
          </div>

          {/* Month / Cycle Navigator */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#181a24] p-1 rounded-lg border border-gray-200 dark:border-gray-800 text-xs sm:text-sm">
              <button
                onClick={onPrevMonth}
                className="p-1 sm:p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded transition-colors"
                title={isCustomCycle ? "វដ្តមុន" : "ខែមុន"}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-semibold text-gray-800 dark:text-white px-2 sm:px-3 text-center min-w-[105px] sm:min-w-[135px] select-none text-xs sm:text-sm">
                {dateRangeLabel || monthYearString}
              </span>

              <button
                onClick={onNextMonth}
                className="p-1 sm:p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded transition-colors"
                title={isCustomCycle ? "វដ្តបន្ទាប់" : "ខែបន្ទាប់"}
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={onGoToToday}
                className="ml-0.5 px-2 py-1 text-[11px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors flex items-center gap-1"
                title="ត្រឡប់មកថ្ងៃនេះវិញ"
              >
                <Calendar className="w-3 h-3" />
                <span>ថ្ងៃនេះ</span>
              </button>
            </div>

            {/* Starting Day & Cycle Configuration Button */}
            {onOpenStartingDayModal && (
              <button
                onClick={onOpenStartingDayModal}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all shadow-sm ${
                  isCustomCycle
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25"
                    : "bg-white dark:bg-[#181a24] border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-emerald-500/40"
                }`}
                title="កំណត់ថ្ងៃចាប់ផ្តើម និងចំនួនថ្ងៃតាមដាន"
              >
                <CalendarDays className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden sm:inline">ថ្ងៃចាប់ផ្តើម</span>
                {isCustomCycle && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                )}
              </button>
            )}
          </div>

          {/* Right Section: Google Sign-in & Theme Switcher */}
          <div className="flex items-center gap-2">
            <GoogleAuthButton
              user={user}
              syncStatus={syncStatus}
              onLogin={onLogin}
              onLogout={onLogout}
              onManualSync={onManualSync}
            />

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
                  <Moon className="w-4 h-4 text-slate-700" />
                  <span className="hidden sm:inline text-xs font-medium">ងងឹត</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bottom Bar: Action Buttons & Statistics Overview */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-gray-100 dark:border-gray-800/60">
          
          {/* Action Buttons: Add Habit, Export/Import, Reset */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenAddHabit}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>បន្ថែមទម្លាប់ថ្មី</span>
            </button>

            <button
              onClick={onExportData}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-[#181a24] hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 text-xs font-medium transition-colors"
              title="ទាញយកឯកសារ Backup"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              <span className="hidden sm:inline">Export JSON</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-[#181a24] hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 text-xs font-medium transition-colors"
              title="បញ្ចូលឯកសារ Backup មកវិញ"
            >
              <Upload className="w-3.5 h-3.5 text-gray-500" />
              <span className="hidden sm:inline">Import JSON</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={onImportData}
              accept=".json"
              className="hidden"
            />

            <button
              onClick={onResetData}
              className="p-1.5 rounded-lg bg-gray-100 dark:bg-[#181a24] hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-500 hover:text-red-500 border border-gray-200 dark:border-gray-800 transition-colors"
              title="កំណត់ទិន្នន័យឡើងវិញទៅលំនាំដើម"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Statistics Overview Pills */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            {/* Total Habits */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-[#181a24] border border-gray-200 dark:border-gray-800">
              <span className="text-gray-500 dark:text-gray-400">សរុប:</span>
              <span className="font-bold text-gray-900 dark:text-white">{totalHabits} ទម្លាប់</span>
            </div>

            {/* Today's Rate */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">ថ្ងៃនេះ:</span>
              <span className="font-extrabold">{todayPercentage}%</span>
            </div>

            {/* Cycle / Month Average Rate */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-400">
              <span className="hidden sm:inline">{isCustomCycle ? "មធ្យមវដ្ត:" : "មធ្យមខែ:"}</span>
              <span className="font-extrabold">{monthAveragePercentage}%</span>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
};
