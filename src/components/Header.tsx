"use client";

import React, { useRef, useState, useEffect } from "react";
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
  Settings2,
  ChevronDown,
} from "lucide-react";
import { getKhmerMonthYear } from "@/lib/dateUtils";
import { UserProfile, SyncStatus } from "@/types/auth";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";

export interface HeaderProps {
  activeTab?: "habits" | "spending" | "journal";
  onTabChange?: (tab: "habits" | "spending" | "journal") => void;
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
  extraActionButtons?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab = "habits",
  onTabChange,
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
  extraActionButtons,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dataMenuRef = useRef<HTMLDivElement>(null);
  const [isDataMenuOpen, setIsDataMenuOpen] = useState(false);
  const monthYearString = getKhmerMonthYear(currentDate);

  // Close data dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dataMenuRef.current && !dataMenuRef.current.contains(e.target as Node)) {
        setIsDataMenuOpen(false);
      }
    };
    if (isDataMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDataMenuOpen]);

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

  const handleTabClick = (tab: "habits" | "spending" | "journal") => {
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  return (
    <header className="bg-white/95 dark:bg-[#12141c]/95 border-b border-gray-200 dark:border-gray-800/80 px-3 sm:px-6 py-2.5 shadow-sm transition-colors sticky top-0 z-30 backdrop-blur-md">
      <div className="max-w-[1700px] mx-auto flex flex-col gap-2.5">
        
        {/* ROW 1: System Navigation, Date Navigator, Excel Storage, Auth, Theme */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          
          {/* Brand Logo & Navigation Segmented Tabs */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 font-black tracking-wider text-sm shadow-[0_0_15px_rgba(16,185,129,0.15)] shrink-0">
                {activeTab === "journal" ? "📈" : activeTab === "spending" ? "💰" : "🎯"}
              </div>
              <div className="hidden xs:block">
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-1.5 leading-tight">
                  <span>{displayTitle}</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hidden lg:inline-block">
                    Excel
                  </span>
                </h1>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 hidden xl:block leading-tight">
                  {displaySubtitle}
                </p>
              </div>
            </div>

            {/* Navigation Tabs (Habit Tracker vs Daily Spending vs Trading Journal) */}
            <nav className="flex items-center gap-1 bg-gray-100 dark:bg-[#181a24] p-1 rounded-xl border border-gray-200 dark:border-gray-800 text-xs shadow-inner">
              {onTabChange ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleTabClick("habits")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                      activeTab === "habits"
                        ? "bg-emerald-500 text-slate-950 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <span>🎯 ទម្លាប់</span>
                    <span className="hidden md:inline text-[10px] opacity-80">(Habits)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabClick("spending")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                      activeTab === "spending"
                        ? "bg-emerald-500 text-slate-950 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <span>💰 ចំណាយ</span>
                    <span className="hidden md:inline text-[10px] opacity-80">(Spending)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabClick("journal")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                      activeTab === "journal"
                        ? "bg-emerald-500 text-slate-950 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <span>📈 Trading Journal</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/"
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                      activeTab === "habits"
                        ? "bg-emerald-500 text-slate-950 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <span>🎯 ទម្លាប់</span>
                    <span className="hidden md:inline text-[10px] opacity-80">(Habits)</span>
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
                    <span className="hidden md:inline text-[10px] opacity-80">(Spending)</span>
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
                </>
              )}
            </nav>
          </div>

          {/* Month / Cycle Navigator */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#181a24] p-1 rounded-xl border border-gray-200 dark:border-gray-800 text-xs sm:text-sm">
            <button
              onClick={onPrevMonth}
              className="p-1 sm:p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg transition-colors"
              title={isCustomCycle ? "វដ្តមុន" : "ខែមុន"}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-bold text-gray-800 dark:text-white px-2 sm:px-3 text-center min-w-[95px] sm:min-w-[130px] select-none text-xs sm:text-sm">
              {dateRangeLabel || monthYearString}
            </span>

            <button
              onClick={onNextMonth}
              className="p-1 sm:p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg transition-colors"
              title={isCustomCycle ? "វដ្តបន្ទាប់" : "ខែបន្ទាប់"}
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={onGoToToday}
              className="ml-0.5 px-2 py-1 text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors flex items-center gap-1"
              title="ត្រឡប់មកថ្ងៃនេះវិញ"
            >
              <Calendar className="w-3 h-3" />
              <span>ថ្ងៃនេះ</span>
            </button>
          </div>

          {/* Right System Controls: Excel Storage, Starting Day, Auth, Theme */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
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
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
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
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                    excelStorageState?.isConnected
                      ? "text-emerald-500"
                      : "text-slate-950"
                  }`}
                />
                <span className="max-w-[100px] sm:max-w-[140px] truncate">
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

            {/* Starting Day & Cycle Configuration Button (Shown for Habits and Spending) */}
            {onOpenStartingDayModal && (
              <button
                onClick={onOpenStartingDayModal}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all shadow-sm ${
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

            {/* Google Sign-in */}
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
              className="p-1.5 sm:p-2 bg-gray-100 dark:bg-[#181a24] hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 rounded-lg text-xs transition-all flex items-center justify-center shadow-sm"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>
          </div>
        </div>

        {/* ROW 2: Primary Actions & Contextual Statistics (Clean, Non-wrapping 2-Row Design) */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1.5 border-t border-gray-100 dark:border-gray-800/60">
          
          {/* Left Action Buttons: Hero CTA + Extra + Unified Data Menu */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAddHabit}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{displayAddLabel}</span>
            </button>

            {extraActionButtons}

            {/* Unified Data Dropdown (Consolidating Export Excel, Export JSON, Import JSON, Reset) */}
            <div className="relative" ref={dataMenuRef}>
              <button
                type="button"
                onClick={() => setIsDataMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-[#181a24] hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 text-xs font-semibold transition-all shadow-sm"
                title="ជម្រើសទិន្នន័យ (Excel, Backup, Reset)"
              >
                <Settings2 className="w-3.5 h-3.5 text-gray-500" />
                <span>ទិន្នន័យ (Data)</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              {isDataMenuOpen && (
                <div className="absolute left-0 mt-1.5 w-60 rounded-xl bg-white dark:bg-[#181a24] border border-gray-200 dark:border-gray-800 shadow-2xl p-1.5 z-50 text-xs space-y-0.5 animate-in fade-in zoom-in-95">
                  {onExportExcel && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsDataMenuOpen(false);
                        onExportExcel();
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-gray-700 dark:text-gray-200 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div>
                        <div className="font-semibold">Export Excel (.xlsx)</div>
                        <div className="text-[10px] text-gray-400">ទាញយកឯកសារ Excel</div>
                      </div>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsDataMenuOpen(false);
                      onExportData();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors font-medium"
                  >
                    <Download className="w-4 h-4 text-gray-500 shrink-0" />
                    <div>
                      <div className="font-semibold">Export JSON</div>
                      <div className="text-[10px] text-gray-400">ទាញយក Backup កម្មវិធី</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsDataMenuOpen(false);
                      fileInputRef.current?.click();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors font-medium"
                  >
                    <Upload className="w-4 h-4 text-gray-500 shrink-0" />
                    <div>
                      <div className="font-semibold">Import JSON</div>
                      <div className="text-[10px] text-gray-400">បញ្ចូលទិន្នន័យពី Backup</div>
                    </div>
                  </button>

                  <div className="h-px bg-gray-200 dark:bg-gray-800 my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsDataMenuOpen(false);
                      onResetData();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors font-medium"
                  >
                    <RotateCcw className="w-4 h-4 text-red-500 shrink-0" />
                    <div>
                      <div className="font-semibold">កំណត់ឡើងវិញ (Reset)</div>
                      <div className="text-[10px] text-red-400/80">លុប និងដាក់លំនាំដើម</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={onImportData}
              accept=".json"
              className="hidden"
            />
          </div>

          {/* Right Statistics / KPI Pills (Contextual per Active Tab) */}
          {statPills ? (
            statPills
          ) : activeTab === "habits" ? (
            <div className="flex items-center gap-2 sm:gap-3 text-xs">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-[#181a24] border border-gray-200 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">សរុប:</span>
                <span className="font-bold text-gray-900 dark:text-white">{totalHabits} ទម្លាប់</span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden sm:inline">ថ្ងៃនេះ:</span>
                <span className="font-extrabold">{todayPercentage}%</span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-400">
                <span className="hidden sm:inline">{isCustomCycle ? "មធ្យមវដ្ត:" : "មធ្យមខែ:"}</span>
                <span className="font-extrabold">{monthAveragePercentage}%</span>
              </div>
            </div>
          ) : null}

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
