"use client";

import React, { useRef } from "react";
import Link from "next/link";
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
  FileSpreadsheet,
} from "lucide-react";
import { getKhmerMonthYear } from "@/lib/dateUtils";
import { UserProfile, SyncStatus } from "@/types/auth";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";

interface HeaderProps {
  activeTab?: "habits" | "spending" | "journal";
  customTitle?: string;
  customSubtitle?: string;
  addButtonLabel?: string;
  currentDate: Date;
  dateRangeLabel?: string;
  isCustomCycle?: boolean;
  onOpenStartingDayModal?: () => void;
  excelStorageState?: {
    isConnected: boolean;
    needsPermission?: boolean;
    fileName: string | null;
    isSyncing?: boolean;
    onReAuthorize?: () => void;
  };
  onOpenExcelModal?: () => void;
  onExportExcel?: () => void;
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
  totalHabits?: number;
  todayPercentage?: number;
  monthAveragePercentage?: number;
  statPills?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab = "habits",
  customTitle,
  customSubtitle,
  addButtonLabel,
  currentDate,
  dateRangeLabel,
  isCustomCycle = false,
  onOpenStartingDayModal,
  excelStorageState,
  onOpenExcelModal,
  onExportExcel,
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
  totalHabits = 0,
  todayPercentage = 0,
  monthAveragePercentage = 0,
  statPills,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const monthYearString = getKhmerMonthYear(currentDate);

  const displayTitle =
    customTitle ||
    (activeTab === "journal"
      ? "Trading Journal"
      : activeTab === "spending"
      ? "តាមដានការចំណាយ"
      : "តាមដានទម្លាប់");

  const displaySubtitle =
    customSubtitle ||
    (activeTab === "journal"
      ? "កំណត់ត្រា និងវិភាគស្ថិតិការជួញដូរប្រចាំថ្ងៃ ព្រមទាំងរូបថត Chart"
      : activeTab === "spending"
      ? "កត់ត្រាការចំណាយប្រចាំថ្ងៃ និងវិភាគថវិកាដោយផ្ទាល់ក្នុង Excel"
      : "កត់ត្រាទិន្នន័យដោយផ្ទាល់ក្នុងឯកសារ Excel លើម៉ាស៊ីនរបស់អ្នក");

  const displayAddLabel =
    addButtonLabel ||
    (activeTab === "journal"
      ? "កត់ត្រា Trade ថ្មី"
      : activeTab === "spending"
      ? "បន្ថែមប្រភេទចំណាយ"
      : "បន្ថែមទម្លាប់ថ្មី");

  return (
    <header className="bg-white dark:bg-[#12141c] border-b border-gray-200 dark:border-gray-800/80 px-3 sm:px-6 py-3.5 shadow-sm transition-colors sticky top-0 z-30 backdrop-blur-md bg-white/95 dark:bg-[#12141c]/95">
      <div className="max-w-[1700px] mx-auto flex flex-col gap-3.5">
        
        {/* Top Bar: Brand, Navigation Switcher, Month Navigator, Excel Storage, Auth, Theme */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Brand & Page Navigation Tabs */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 font-black tracking-wider text-xs sm:text-sm shadow-[0_0_15px_rgba(16,185,129,0.15)] shrink-0">
              {activeTab === "journal" ? "📈" : activeTab === "spending" ? "💰" : "HT"}
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-1.5">
                <span>{displayTitle}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hidden xs:inline-block">
                  Excel Storage (.xlsx)
                </span>
              </h1>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                {displaySubtitle}
              </p>
            </div>

            {/* Navigation Tabs (Habit Tracker vs Daily Spending vs Trading Journal) */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#181a24] p-1 rounded-xl border border-gray-200 dark:border-gray-800 text-xs ml-1 sm:ml-2">
              <Link
                href="/"
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                  activeTab === "habits"
                    ? "bg-emerald-500 text-slate-950 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <span>🎯 ទម្លាប់</span>
                <span className="hidden lg:inline text-[10px] opacity-80">(Habits)</span>
              </Link>

              <Link
                href="/spending"
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                  activeTab === "spending"
                    ? "bg-emerald-500 text-slate-950 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <span>💰 ចំណាយ</span>
                <span className="hidden lg:inline text-[10px] opacity-80">(Spending)</span>
              </Link>

              <Link
                href="/journal"
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                  activeTab === "journal"
                    ? "bg-emerald-500 text-slate-950 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <span>📈 Trading Journal</span>
              </Link>
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

          {/* Right Section: Local Excel Storage, Google Sign-in, Theme Switcher */}
          <div className="flex items-center gap-2">
            {/* Local Excel Storage Connection Button */}
            {onOpenExcelModal && (
              <button
                onClick={() => {
                  if (excelStorageState?.needsPermission && excelStorageState.onReAuthorize) {
                    excelStorageState.onReAuthorize();
                  } else {
                    onOpenExcelModal();
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                  excelStorageState?.isConnected
                    ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                    : excelStorageState?.needsPermission
                    ? "bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold active:scale-95 animate-pulse"
                    : "bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold active:scale-95"
                }`}
                title={
                  excelStorageState?.isConnected
                    ? `ឯកសារ Excel: ${excelStorageState.fileName} (ចុចដើម្បីគ្រប់គ្រង)`
                    : excelStorageState?.needsPermission
                    ? `ចុចទីនេះដើម្បីបន្ត Auto-Save ទៅកាន់ ${excelStorageState.fileName}`
                    : "ភ្ជាប់ឯកសារ Excel (.xlsx) លើម៉ាស៊ីន"
                }
              >
                <FileSpreadsheet
                  className={`w-4 h-4 ${
                    excelStorageState?.isConnected
                      ? "text-emerald-500"
                      : "text-slate-950"
                  }`}
                />
                <span className="max-w-[120px] sm:max-w-[160px] truncate">
                  {excelStorageState?.isConnected
                    ? excelStorageState.isSyncing
                      ? "កំពុង Save..."
                      : excelStorageState.fileName || "Excel Linked"
                    : excelStorageState?.needsPermission
                    ? `⚠️ បន្ត Save (${excelStorageState.fileName})`
                    : "ភ្ជាប់ Excel"}
                </span>
                {excelStorageState?.isConnected && (
                  <span
                    className={`w-2 h-2 rounded-full inline-block ${
                      excelStorageState.isSyncing
                        ? "bg-amber-500 animate-spin"
                        : "bg-emerald-500 animate-pulse"
                    }`}
                  />
                )}
              </button>
            )}

            {/* Google Sign-in (optional) */}
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
          
          {/* Action Buttons: Add Habit, Export Excel, Export/Import JSON, Reset */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenAddHabit}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{displayAddLabel}</span>
            </button>

            {/* Direct Export to Excel (.xlsx) */}
            {onExportExcel && (
              <button
                onClick={onExportExcel}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors"
                title="ទាញយកទិន្នន័យជាឯកសារ Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                <span>Export Excel (.xlsx)</span>
              </button>
            )}

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
          {statPills ? (
            statPills
          ) : (
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
          )}

        </div>

        {/* Warning banner when Excel file needs re-authorization after browser restart */}
        {excelStorageState?.needsPermission && (
          <div className="bg-amber-500/15 border border-amber-500/30 rounded-2xl px-3.5 py-2.5 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>
                ឯកសារ Excel <strong>"{excelStorageState.fileName}"</strong> ត្រូវបានរកឃើញ! សូមចុចប៊ូតុងដើម្បីអនុញ្ញាត Auto-Save បន្តទៅកាន់ឯកសាររបស់អ្នក (ការពារកុំឱ្យបាត់ទិន្នន័យ)។
              </span>
            </div>
            <button
              onClick={() => {
                if (excelStorageState.onReAuthorize) {
                  excelStorageState.onReAuthorize();
                } else if (onOpenExcelModal) {
                  onOpenExcelModal();
                }
              }}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold rounded-xl transition-all text-xs shrink-0 ml-3 shadow-sm"
            >
              អនុញ្ញាត Auto-Save ឥឡូវនេះ
            </button>
          </div>
        )}

      </div>
    </header>
  );
};
