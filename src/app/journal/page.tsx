"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Trade, DayTradesSummary } from "@/types/trading";
import { UserProfile, SyncStatus } from "@/types/auth";
import { getStoredUser, saveUserSession } from "@/lib/auth";
import {
  loadTrades,
  saveTrades,
  calculateTradingStats,
  formatPnl,
  SAMPLE_TRADES,
} from "@/lib/tradingStorage";
import {
  writeToExcelFileHandle,
  downloadExcelFile,
  getStoredHandle,
  parseExcelFileData,
  UnifiedSpendingData,
} from "@/lib/excelStorage";
import {
  loadHabits,
  loadCompletions,
  loadWellness,
  loadHabitNotes,
  loadCycleConfig,
} from "@/lib/storage";
import {
  loadSpendingCategories,
  loadSpendingTransactions,
  loadSpendingBudget,
} from "@/lib/spendingStorage";
import { getDaysInMonth, getKhmerDateRangeLabel } from "@/lib/dateUtils";
import { Header } from "@/components/Header";
import { TradingStatsCards } from "@/components/TradingStatsCards";
import { TradingCalendar } from "@/components/TradingCalendar";
import { DayTradesDetailModal } from "@/components/DayTradesDetailModal";
import { TradeEntryModal } from "@/components/TradeEntryModal";
import { ImageViewerModal } from "@/components/ImageViewerModal";
import { ExcelConnectionModal } from "@/components/ExcelConnectionModal";
import {
  Plus,
  FileSpreadsheet,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";

export default function TradingJournalPage() {
  const [isClient, setIsClient] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Trading Core State
  const [trades, setTrades] = useState<Trade[]>(SAMPLE_TRADES);

  // Local Excel File Storage State (Shared across Habits, Spending, and Journal)
  const [excelState, setExcelState] = useState<{
    isConnected: boolean;
    fileName: string | null;
    fileHandle: FileSystemFileHandle | null;
    lastSyncedAt: string | null;
    isSyncing: boolean;
  }>({
    isConnected: false,
    fileName: null,
    fileHandle: null,
    lastSyncedAt: null,
    isSyncing: false,
  });
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  // Modals State
  const [selectedDaySummary, setSelectedDaySummary] = useState<DayTradesSummary | null>(null);
  const [isDayDetailModalOpen, setIsDayDetailModalOpen] = useState(false);
  const [isTradeEntryModalOpen, setIsTradeEntryModalOpen] = useState(false);
  const [tradeToEdit, setTradeToEdit] = useState<Trade | null>(null);
  const [targetDateForNewTrade, setTargetDateForNewTrade] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);

  // Initialize on mount
  useEffect(() => {
    setIsClient(true);
    const storedUser = getStoredUser();
    setUser(storedUser);

    const userId = storedUser?.id;
    const loadedTrades = loadTrades(userId);
    setTrades(loadedTrades);

    // Check saved Excel file handle (shared across Habits, Spending, and Journal)
    getStoredHandle().then(async (handle) => {
      if (handle) {
        try {
          // @ts-ignore
          const perm = await handle.queryPermission({ mode: "readwrite" });
          if (perm === "granted") {
            setExcelState({
              isConnected: true,
              fileName: handle.name,
              fileHandle: handle,
              lastSyncedAt: new Date().toLocaleTimeString(),
              isSyncing: false,
            });
          }
        } catch {
          // ignore
        }
      }
    });

    // Sync theme with document class
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  // Theme toggle
  const handleToggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Month & Year Navigation
  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleSelectYear = (year: number) => {
    setCurrentDate((prev) => new Date(year, prev.getMonth(), 1));
  };

  const handleGoToToday = () => {
    setCurrentDate(new Date());
  };

  // Performance Statistics (Overall)
  const overallStats = useMemo(() => {
    return calculateTradingStats(trades);
  }, [trades]);

  // Performance Statistics (Current Month)
  const currentMonthTrades = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, "0");
    const prefix = `${y}-${m}`;
    return trades.filter((t) => t.dateString.startsWith(prefix));
  }, [trades, currentDate]);

  const monthStats = useMemo(() => {
    return calculateTradingStats(currentMonthTrades);
  }, [currentMonthTrades]);

  // Save trades to local storage & trigger auto-sync
  const persistTrades = useCallback(
    (newTrades: Trade[]) => {
      setTrades(newTrades);
      saveTrades(newTrades, user?.id);

      // If day detail modal is open, update its summary as well
      if (selectedDaySummary) {
        const matchingTrades = newTrades.filter(
          (t) => t.dateString === selectedDaySummary.dateString
        );
        const totalPnl = matchingTrades.reduce((acc, curr) => acc + curr.pnl, 0);
        setSelectedDaySummary({
          ...selectedDaySummary,
          trades: matchingTrades,
          tradesCount: matchingTrades.length,
          totalPnl,
          winningCount: matchingTrades.filter((t) => t.pnl > 0).length,
          losingCount: matchingTrades.filter((t) => t.pnl < 0).length,
        });
      }
    },
    [user?.id, selectedDaySummary]
  );

  // Auto-sync to Linked Excel file (.xlsx) - Preserves Habits, Spending, and Trading
  useEffect(() => {
    if (!isClient || !excelState.isConnected || !excelState.fileHandle) return;

    setExcelState((prev) => ({ ...prev, isSyncing: true }));
    const timer = setTimeout(async () => {
      try {
        const currentHabits = loadHabits(user?.id);
        const currentCompletions = loadCompletions(user?.id);
        const currentWellness = loadWellness(user?.id);
        const currentNotes = loadHabitNotes(user?.id);
        const currentCycle = loadCycleConfig(user?.id) || { mode: "today_to_end" };
        const currentDays = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const currentRangeLabel = getKhmerDateRangeLabel(currentDays);

        const spendingData: UnifiedSpendingData = {
          categories: loadSpendingCategories(user?.id),
          transactions: loadSpendingTransactions(user?.id),
          budgetConfig: loadSpendingBudget(user?.id),
        };

        await writeToExcelFileHandle(
          excelState.fileHandle!,
          currentHabits,
          currentCompletions,
          currentWellness,
          currentDays,
          currentRangeLabel,
          currentCycle,
          currentNotes,
          spendingData,
          trades
        );

        setExcelState((prev) => ({
          ...prev,
          isSyncing: false,
          lastSyncedAt: new Date().toLocaleTimeString(),
        }));
      } catch (err) {
        console.warn("Auto-sync to unified Excel file failed", err);
        setExcelState((prev) => ({ ...prev, isSyncing: false }));
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [trades, excelState.isConnected, excelState.fileHandle, isClient, user?.id, currentDate]);

  // Click on a calendar day cell
  const handleSelectDay = (summary: DayTradesSummary) => {
    setSelectedDaySummary(summary);
    setIsDayDetailModalOpen(true);
  };

  // Open modal to add a trade on a specific date
  const handleOpenAddTrade = (dateString?: string) => {
    const targetDate = dateString || new Date().toISOString().slice(0, 10);
    setTargetDateForNewTrade(targetDate);
    setTradeToEdit(null);
    setIsTradeEntryModalOpen(true);
  };

  // Open modal to edit a specific trade
  const handleEditTrade = (trade: Trade) => {
    setTradeToEdit(trade);
    setTargetDateForNewTrade(trade.dateString);
    setIsTradeEntryModalOpen(true);
  };

  // Save Trade handler (Add or Update)
  const handleSaveTrade = (
    tradeData: Omit<Trade, "id" | "createdAt">,
    existingId?: string
  ) => {
    if (existingId) {
      // Update
      const updated = trades.map((t) =>
        t.id === existingId
          ? {
              ...t,
              ...tradeData,
            }
          : t
      );
      persistTrades(updated);
    } else {
      // Create new
      const newTrade: Trade = {
        ...tradeData,
        id: "trade_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
        createdAt: new Date().toISOString(),
      };
      persistTrades([newTrade, ...trades]);
    }
    setIsTradeEntryModalOpen(false);
    setTradeToEdit(null);
  };

  // Delete trade handler
  const handleDeleteTrade = (tradeId: string) => {
    if (window.confirm("តើអ្នកប្រាកដជាចង់លុបប្រតិបត្តិការ Trade នេះមែនទេ?")) {
      const remaining = trades.filter((t) => t.id !== tradeId);
      persistTrades(remaining);
    }
  };

  // Export full unified Excel (.xlsx) file
  const handleExportExcel = () => {
    const currentHabits = loadHabits(user?.id);
    const currentCompletions = loadCompletions(user?.id);
    const currentWellness = loadWellness(user?.id);
    const currentNotes = loadHabitNotes(user?.id);
    const currentCycle = loadCycleConfig(user?.id) || { mode: "today_to_end" };
    const currentDays = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const currentRangeLabel = getKhmerDateRangeLabel(currentDays);

    const spendingData: UnifiedSpendingData = {
      categories: loadSpendingCategories(user?.id),
      transactions: loadSpendingTransactions(user?.id),
      budgetConfig: loadSpendingBudget(user?.id),
    };

    downloadExcelFile(
      currentHabits,
      currentCompletions,
      currentWellness,
      currentDays,
      currentRangeLabel,
      `trading-journal-${currentDate.getFullYear()}-${currentDate.getMonth() + 1}.xlsx`,
      currentCycle,
      currentNotes,
      spendingData,
      trades
    );
  };

  // Export JSON backup
  const handleExportData = () => {
    const data = {
      version: "trading_v1",
      exportedAt: new Date().toISOString(),
      trades,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trading-journal-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON or Excel data
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed.trades)) {
          persistTrades(parsed.trades);
          alert(`បាននាំចូលទិន្នន័យ Trade ចំនួន ${parsed.trades.length} ដោយជោគជ័យ!`);
        } else if (Array.isArray(parsed)) {
          persistTrades(parsed);
          alert(`បាននាំចូលទិន្នន័យ Trade ចំនួន ${parsed.length} ដោយជោគជ័យ!`);
        }
      } catch (err) {
        alert("ឯកសារនាំចូលមិនត្រឹមត្រូវ!");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Reset to sample trades
  const handleResetData = () => {
    if (window.confirm("តើអ្នកចង់កំណត់ទិន្នន័យ Trade ឡើងវិញទៅទម្រង់គំរូដើម (Sample Trades) ដែរឬទេ?")) {
      persistTrades(SAMPLE_TRADES);
    }
  };

  // Google Auth Handlers
  const handleLogin = (newUser: UserProfile) => {
    setUser(newUser);
    saveUserSession(newUser);
    setTrades(loadTrades(newUser.id));
  };

  const handleLogout = () => {
    setUser(null);
    saveUserSession(null);
    setTrades(loadTrades());
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0b0c10] text-gray-900 dark:text-gray-100 transition-colors">
      {/* Global Header */}
      <Header
        activeTab="journal"
        customTitle="Trading Journal"
        customSubtitle="ប្រតិទិនចំណេញ/ខាត (P&L Calendar) ស្ថិតិ និងរូបថត Chart ដោយផ្ទាល់ក្នុង Excel"
        addButtonLabel="កត់ត្រា Trade ថ្មី"
        currentDate={currentDate}
        excelStorageState={{
          isConnected: excelState.isConnected,
          fileName: excelState.fileName,
          isSyncing: excelState.isSyncing,
        }}
        onOpenExcelModal={() => setIsExcelModalOpen(true)}
        onExportExcel={handleExportExcel}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        user={user}
        syncStatus={syncStatus}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onGoToToday={handleGoToToday}
        onOpenAddHabit={() => handleOpenAddTrade()}
        onResetData={handleResetData}
        onExportData={handleExportData}
        onImportData={handleImportData}
      />

      <main className="max-w-[1700px] mx-auto p-3 sm:p-6 space-y-6">
        {/* Top Summary Banner */}
        <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-500/15 dark:via-emerald-500/5 dark:to-transparent border border-emerald-500/20 dark:border-emerald-500/30 rounded-3xl p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[11px] uppercase tracking-wider">
                Trading P&L
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                1 USD = 4,000 KHR • IndexedDB Local Screenshot Storage
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-1.5 flex items-center gap-2">
              <span>សរុបចំណេញ/ខាត:</span>
              <span
                className={`tracking-tight ${
                  overallStats.netPnl >= 0
                    ? "text-emerald-500 dark:text-emerald-400"
                    : "text-red-500 dark:text-red-400"
                }`}
              >
                {formatPnl(overallStats.netPnl)}
              </span>
              <span className="text-xs font-semibold text-gray-400">
                ({(overallStats.netPnl * 4000).toLocaleString()} ៛)
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              ជោគជ័យ {overallStats.winningTrades} / {overallStats.totalTrades} trades (Win Rate: {overallStats.winRate}%) • Profit Factor: {overallStats.profitFactor} • {overallStats.greenDaysCount} ថ្ងៃចំណេញ / {overallStats.redDaysCount} ថ្ងៃខាត
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleOpenAddTrade()}
              className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>កត់ត្រា Trade ថ្មី</span>
            </button>

            <button
              type="button"
              onClick={() => setIsExcelModalOpen(true)}
              className="px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#181a24] border border-gray-200 dark:border-gray-800 hover:border-emerald-500/40 text-gray-700 dark:text-gray-200 font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
              title="ភ្ជាប់ឯកសារ Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>{excelState.isConnected ? excelState.fileName : "ភ្ជាប់ Excel (.xlsx)"}</span>
              {excelState.isConnected && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#181a24] border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
              title="ទាញយកជា Excel (.xlsx)"
            >
              <Download className="w-4 h-4 text-gray-500" />
              <span className="hidden sm:inline">ទាញយក Excel</span>
            </button>
          </div>
        </div>

        {/* Trading KPI Cards */}
        <TradingStatsCards stats={overallStats} monthStats={monthStats} />

        {/* P&L Calendar Grid (Matching User Screenshot) */}
        <TradingCalendar
          currentDate={currentDate}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onSelectYear={handleSelectYear}
          onSelectDay={handleSelectDay}
          trades={trades}
        />

        {/* Feature Explanation & Image Storage Solution Card */}
        <div className="bg-white dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-3xl p-5 sm:p-7 shadow-sm">
          <div className="flex items-center gap-2.5 text-emerald-500 font-bold text-sm mb-2">
            <Sparkles className="w-4 h-4" />
            <span>ដំណោះស្រាយរក្សាទុករូបភាព Chart (Image Storage Solution):</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#181a24] border border-gray-100 dark:border-gray-800 space-y-1">
              <span className="font-bold text-gray-900 dark:text-white block">
                ⚡ 1. Paste រូបភ្លាមៗ (Ctrl + V)
              </span>
              <p>
                នៅពេលលោកអ្នកថតរូប Chart ពី TradingView ឬ Windows Snipping Tool អ្នកអាចចុច <code>Ctrl + V</code> ដោយផ្ទាល់ក្នុងផ្ទាំង Add Trade ដើម្បីបញ្ចូលរូបភាពភ្លាមៗ។
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#181a24] border border-gray-100 dark:border-gray-800 space-y-1">
              <span className="font-bold text-gray-900 dark:text-white block">
                💾 2. IndexedDB Compression
              </span>
              <p>
                រូបភាពត្រូវបានបង្រួមទំហំ (Client Canvas Compression) ទៅត្រឹម ~80-150KB ក្នុង WebP/JPEG ហើយរក្សាទុកក្នុង IndexedDB របស់ Browser ដោយសុវត្ថិភាព មិនអស់លុយ Server។
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#181a24] border border-gray-100 dark:border-gray-800 space-y-1">
              <span className="font-bold text-gray-900 dark:text-white block">
                📊 3. ឯកសារ Excel រួមមួយគត់
              </span>
              <p>
                ទិន្នន័យ Trade ទាំងអស់ត្រូវបានកត់ត្រា និង Auto-Sync ចូលក្នុងឯកសារ Excel <code>.xlsx</code> តែមួយជាមួយ Habit Tracker និង Daily Spending របស់លោកអ្នក។
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Day Trades Detail Modal (Shows all trades for clicked day) */}
      <DayTradesDetailModal
        isOpen={isDayDetailModalOpen}
        onClose={() => setIsDayDetailModalOpen(false)}
        daySummary={selectedDaySummary}
        onOpenAddTrade={(dateStr) => {
          handleOpenAddTrade(dateStr);
        }}
        onEditTrade={(trade) => {
          handleEditTrade(trade);
        }}
        onDeleteTrade={(tradeId) => {
          handleDeleteTrade(tradeId);
        }}
        onViewImage={(url) => {
          setViewingImageUrl(url);
        }}
      />

      {/* Trade Entry Modal (Add or Edit Trade) */}
      <TradeEntryModal
        isOpen={isTradeEntryModalOpen}
        onClose={() => {
          setIsTradeEntryModalOpen(false);
          setTradeToEdit(null);
        }}
        defaultDateString={targetDateForNewTrade}
        tradeToEdit={tradeToEdit}
        onSaveTrade={handleSaveTrade}
      />

      {/* Full-Screen Chart Image Viewer Lightbox */}
      <ImageViewerModal
        imageUrl={viewingImageUrl}
        onClose={() => setViewingImageUrl(null)}
      />

      {/* Excel Storage Connection Modal */}
      <ExcelConnectionModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onConnected={(fileName, handle) => {
          setExcelState({
            isConnected: true,
            fileName,
            fileHandle: handle,
            lastSyncedAt: new Date().toLocaleTimeString(),
            isSyncing: false,
          });
        }}
        habits={loadHabits(user?.id)}
        completions={loadCompletions(user?.id)}
        habitNotes={loadHabitNotes(user?.id)}
        wellness={loadWellness(user?.id)}
        days={getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth(), 1)}
        dateRangeLabel={getKhmerDateRangeLabel(
          getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth(), 1)
        )}
        cycleConfig={loadCycleConfig(user?.id) || { mode: "today_to_end" }}
        spending={{
          categories: loadSpendingCategories(user?.id),
          transactions: loadSpendingTransactions(user?.id),
          budgetConfig: loadSpendingBudget(user?.id),
        }}
        trading={trades}
        onImportData={(parsed) => {
          if (parsed.trading && parsed.trading.length > 0) {
            persistTrades(parsed.trading);
          }
        }}
      />
    </div>
  );
}
