"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Habit,
  HabitCompletionMap,
  WellnessMap,
  TrackerCycleConfig,
  HabitNotesMap,
  DayInfo,
} from "@/types/habit";
import { UserProfile, SyncStatus } from "@/types/auth";
import { getStoredUser, saveUserSession } from "@/lib/auth";
import {
  DEFAULT_HABITS,
  loadHabits,
  saveHabits,
  loadCompletions,
  saveCompletions,
  loadWellness,
  saveWellness,
  loadCycleConfig,
  saveCycleConfig,
  loadHabitNotes,
  saveHabitNotes,
} from "@/lib/storage";
import {
  SpendingCategory,
  SpendingTransaction,
  SpendingBudgetConfig,
  Currency,
} from "@/types/spending";
import {
  DEFAULT_SPENDING_CATEGORIES,
  DEFAULT_BUDGET_CONFIG,
  loadSpendingCategories,
  saveSpendingCategories,
  loadSpendingTransactions,
  saveSpendingTransactions,
  loadSpendingBudget,
  saveSpendingBudget,
  formatCurrency,
  formatUsd,
} from "@/lib/spendingStorage";
import {
  Trade,
  DayTradesSummary,
} from "@/types/trading";
import {
  loadTrades,
  saveTrades,
  calculateTradingStats,
  formatPnl,
  SAMPLE_TRADES,
} from "@/lib/tradingStorage";
import { deleteTradeImage } from "@/lib/tradeImageStorage";
import {
  getDaysInMonth,
  getDaysForCycle,
  getDaysForView,
  groupDaysByWeek,
  getKhmerMonthYear,
  getKhmerDateRangeLabel,
  toKhmerNum,
} from "@/lib/dateUtils";
import { syncHabitDataToSheet } from "@/lib/googleSheets";
import {
  writeToExcelFileHandle,
  downloadExcelFile,
  getStoredHandle,
  requestFileHandlePermission,
  UnifiedSpendingData,
  parseExcelFileData,
} from "@/lib/excelStorage";

import { Header } from "@/components/Header";
// Habit Tracker components
import { DailyProgressBarChart, DailyProgressData } from "@/components/DailyProgressBarChart";
import { WeeklyProgressBarChart } from "@/components/WeeklyProgressBarChart";
import { HabitGrid } from "@/components/HabitGrid";
import { WellnessTracker } from "@/components/WellnessTracker";
import { AddHabitModal } from "@/components/AddHabitModal";
import { EditHabitModal } from "@/components/EditHabitModal";
import { StartingDayModal } from "@/components/StartingDayModal";
import { HabitNoteModal } from "@/components/HabitNoteModal";
// Spending Tracker components
import { SpendingKpiCards } from "@/components/SpendingKpiCards";
import { SpendingCharts, DailySpendingBarData } from "@/components/SpendingCharts";
import { SpendingGrid } from "@/components/SpendingGrid";
import { SpendingEntryModal } from "@/components/SpendingEntryModal";
import { AddSpendingCategoryModal } from "@/components/AddSpendingCategoryModal";
import { EditSpendingCategoryModal } from "@/components/EditSpendingCategoryModal";
import { BudgetSettingsModal } from "@/components/BudgetSettingsModal";
// Trading Journal components
import { TradingStatsCards } from "@/components/TradingStatsCards";
import { TradingCalendar } from "@/components/TradingCalendar";
import { DayTradesDetailModal } from "@/components/DayTradesDetailModal";
import { TradeEntryModal } from "@/components/TradeEntryModal";
import { ImageViewerModal } from "@/components/ImageViewerModal";
// Shared Modal
import { ExcelConnectionModal } from "@/components/ExcelConnectionModal";

import { CheckCircle2, Sparkles, TrendingUp } from "lucide-react";

interface UnifiedTrackerAppProps {
  initialTab?: "habits" | "spending" | "journal";
}

export const UnifiedTrackerApp: React.FC<UnifiedTrackerAppProps> = ({
  initialTab = "habits",
}) => {
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<"habits" | "spending" | "journal">(initialTab);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Shared Excel File Storage State
  const [excelState, setExcelState] = useState<{
    isConnected: boolean;
    needsPermission?: boolean;
    fileName: string | null;
    fileHandle: FileSystemFileHandle | null;
    lastSyncedAt: string | null;
    isSyncing: boolean;
  }>({
    isConnected: false,
    needsPermission: false,
    fileName: null,
    fileHandle: null,
    lastSyncedAt: null,
    isSyncing: false,
  });
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  // Cycle Configuration (shared across Habits and Spending)
  const [cycleConfig, setCycleConfig] = useState<TrackerCycleConfig>({
    mode: "start_date_to_end",
    startDate: "2026-11-18",
    startDay: 18,
  });
  const [customCycleStartDate, setCustomCycleStartDate] = useState<Date>(new Date());
  const [isStartingDayModalOpen, setIsStartingDayModalOpen] = useState(false);

  // 1. Habit Tracker State
  const [habits, setHabits] = useState<Habit[]>(DEFAULT_HABITS);
  const [completions, setCompletions] = useState<HabitCompletionMap>({});
  const [habitNotes, setHabitNotes] = useState<HabitNotesMap>({});
  const [activeNoteTarget, setActiveNoteTarget] = useState<{ habit: Habit; day: DayInfo } | null>(null);
  const [wellness, setWellness] = useState<WellnessMap>({});
  const [isAddHabitModalOpen, setIsAddHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // 2. Spending Tracker State
  const [categories, setCategories] = useState<SpendingCategory[]>(DEFAULT_SPENDING_CATEGORIES);
  const [transactions, setTransactions] = useState<SpendingTransaction[]>([]);
  const [budgetConfig, setBudgetConfig] = useState<SpendingBudgetConfig>(DEFAULT_BUDGET_CONFIG);
  const [displayCurrency, setDisplayCurrency] = useState<Currency>("USD");
  const [selectedSpendingDay, setSelectedSpendingDay] = useState<DayInfo | null>(null);
  const [selectedSpendingCategory, setSelectedSpendingCategory] = useState<SpendingCategory | null>(null);
  const [isSpendingEntryModalOpen, setIsSpendingEntryModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SpendingCategory | null>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  // 3. Trading Journal State
  const [trades, setTrades] = useState<Trade[]>(SAMPLE_TRADES);
  const [selectedDaySummary, setSelectedDaySummary] = useState<DayTradesSummary | null>(null);
  const [isDayDetailModalOpen, setIsDayDetailModalOpen] = useState(false);
  const [isTradeEntryModalOpen, setIsTradeEntryModalOpen] = useState(false);
  const [tradeToEdit, setTradeToEdit] = useState<Trade | null>(null);
  const [targetDateForNewTrade, setTargetDateForNewTrade] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);

  // Synchronize Tab Change with Browser History (Instant 0ms tab switching)
  const handleTabChange = useCallback((tab: "habits" | "spending" | "journal") => {
    setActiveTab(tab);
    const targetUrl = tab === "habits" ? "/" : `/${tab}`;
    if (typeof window !== "undefined" && window.location.pathname !== targetUrl) {
      window.history.pushState(null, "", targetUrl);
    }
  }, []);

  // Handle browser Back / Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.includes("/spending")) {
        setActiveTab("spending");
      } else if (path.includes("/journal")) {
        setActiveTab("journal");
      } else {
        setActiveTab("habits");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Initialize on mount
  useEffect(() => {
    setIsClient(true);
    const storedUser = getStoredUser();
    setUser(storedUser);
    const userId = storedUser?.id;

    // Load Habits
    setHabits(loadHabits(userId));
    setCompletions(loadCompletions(userId));
    setHabitNotes(loadHabitNotes(userId));
    setWellness(loadWellness(userId));

    // Load Cycle Config
    const savedCycle = loadCycleConfig(userId);
    if (savedCycle && savedCycle.mode) {
      setCycleConfig(savedCycle);
      if (savedCycle.startDate) {
        const [y, m, d] = savedCycle.startDate.split("-").map(Number);
        setCustomCycleStartDate(new Date(y, m - 1, d));
      }
    } else {
      setCycleConfig({ mode: "start_date_to_end", startDate: "2026-11-18", startDay: 18 });
    }

    // Load Spending
    setCategories(loadSpendingCategories(userId));
    setTransactions(loadSpendingTransactions(userId));
    setBudgetConfig(loadSpendingBudget(userId));

    // Load Trading
    setTrades(loadTrades(userId));

    // Check Excel File Handle
    getStoredHandle().then(async (handle) => {
      if (handle) {
        try {
          // @ts-ignore
          const perm = await handle.queryPermission({ mode: "readwrite" });
          if (perm === "granted") {
            setExcelState({
              isConnected: true,
              needsPermission: false,
              fileName: handle.name,
              fileHandle: handle,
              lastSyncedAt: new Date().toLocaleTimeString(),
              isSyncing: false,
            });
            return;
          } else {
            setExcelState({
              isConnected: false,
              needsPermission: true,
              fileName: handle.name,
              fileHandle: handle,
              lastSyncedAt: null,
              isSyncing: false,
            });
            return;
          }
        } catch (e) {
          console.warn("Could not query handle permission", e);
        }
      }
    });

    // Theme initialization
    const savedTheme = localStorage.getItem("habit_tracker_theme") as "dark" | "light" | null;
    const initialT = savedTheme || "dark";
    setTheme(initialT);
    if (initialT === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Re-authorize Excel permission after browser restart
  const handleReAuthorizeExcel = async () => {
    if (!excelState.fileHandle) return;
    try {
      const granted = await requestFileHandlePermission(excelState.fileHandle);
      if (granted) {
        setExcelState((prev) => ({
          ...prev,
          isConnected: true,
          needsPermission: false,
          lastSyncedAt: new Date().toLocaleTimeString(),
        }));
        // Trigger auto-save immediately to verify write access
        handleUnifiedAutoSave();
      } else {
        alert("មិនបានទទួលការអនុញ្ញាតសរសេរលើឯកសារទេ។ សូមចុចម្តងទៀត!");
      }
    } catch (e) {
      console.error("Re-auth error", e);
      alert("មានបញ្ហាក្នុងការភ្ជាប់ឯកសារ។ សូមជ្រើសរើសឯកសារម្តងទៀត។");
    }
  };

  // Toggle Theme
  const handleToggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("habit_tracker_theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Year & Month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Days Calculation (Full month or Start-Date-to-End)
  const isCustomCycle = cycleConfig.mode !== "full_month";
  const days: DayInfo[] = useMemo(() => {
    return getDaysForView(currentDate, cycleConfig, customCycleStartDate);
  }, [currentDate, cycleConfig, customCycleStartDate]);

  const weeks = useMemo(() => groupDaysByWeek(days), [days]);
  const dateRangeLabel = useMemo(() => {
    if (cycleConfig.mode === "full_month") {
      return undefined;
    }
    return getKhmerDateRangeLabel(days);
  }, [cycleConfig.mode, days]);

  // Unified Excel Auto-Save (Saves Habits, Spending, and Trading together in one file!)
  const handleUnifiedAutoSave = useCallback(
    async (
      overrideHabits?: Habit[],
      overrideCompletions?: HabitCompletionMap,
      overrideWellness?: WellnessMap,
      overrideNotes?: HabitNotesMap,
      overrideCategories?: SpendingCategory[],
      overrideTransactions?: SpendingTransaction[],
      overrideBudget?: SpendingBudgetConfig,
      overrideTrades?: Trade[]
    ) => {
      const hHabits = overrideHabits ?? habits;
      const hCompletions = overrideCompletions ?? completions;
      const hWellness = overrideWellness ?? wellness;
      const hNotes = overrideNotes ?? habitNotes;
      const hCategories = overrideCategories ?? categories;
      const hTransactions = overrideTransactions ?? transactions;
      const hBudget = overrideBudget ?? budgetConfig;
      const hTrades = overrideTrades ?? trades;

      if (!excelState.fileHandle || !excelState.isConnected) {
        return;
      }

      setExcelState((prev) => ({ ...prev, isSyncing: true }));
      try {
        const spendingData: UnifiedSpendingData = {
          categories: hCategories,
          transactions: hTransactions,
          budgetConfig: hBudget,
        };

        await writeToExcelFileHandle(
          excelState.fileHandle,
          hHabits,
          hCompletions,
          hWellness,
          days,
          dateRangeLabel || getKhmerMonthYear(currentDate),
          cycleConfig,
          hNotes,
          spendingData,
          hTrades
        );

        setExcelState((prev) => ({
          ...prev,
          isSyncing: false,
          lastSyncedAt: new Date().toLocaleTimeString(),
        }));
      } catch (err: any) {
        console.error("Auto-save to Excel error:", err);
        if (err?.name === "NotAllowedError") {
          setExcelState((prev) => ({
            ...prev,
            isSyncing: false,
            isConnected: false,
            needsPermission: true,
          }));
        } else {
          setExcelState((prev) => ({ ...prev, isSyncing: false }));
        }
      }
    },
    [
      excelState.fileHandle,
      excelState.isConnected,
      habits,
      completions,
      wellness,
      habitNotes,
      categories,
      transactions,
      budgetConfig,
      trades,
      days,
      dateRangeLabel,
      cycleConfig,
    ]
  );

  // Month navigation handlers
  const handlePrevDate = () => {
    if (cycleConfig.mode === "consecutive_days") {
      const duration = cycleConfig.durationDays || 30;
      setCustomCycleStartDate(
        (prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - duration)
      );
    } else {
      setCurrentDate(new Date(year, month - 1, 1));
    }
  };

  const handleNextDate = () => {
    if (cycleConfig.mode === "consecutive_days") {
      const duration = cycleConfig.durationDays || 30;
      setCustomCycleStartDate(
        (prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + duration)
      );
    } else {
      setCurrentDate(new Date(year, month + 1, 1));
    }
  };

  const handleGoToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    if (cycleConfig.mode === "consecutive_days") {
      setCustomCycleStartDate(now);
    }
  };

  // Cycle Config Save
  const handleSaveCycleConfig = (newConfig: TrackerCycleConfig) => {
    setCycleConfig(newConfig);
    saveCycleConfig(newConfig, user?.id);
    if (newConfig.mode === "consecutive_days" && newConfig.startDate) {
      const [y, m, d] = newConfig.startDate.split("-").map(Number);
      setCustomCycleStartDate(new Date(y, m - 1, d));
    }
  };

  // ----------------------------------------------------
  // Habit Actions
  // ----------------------------------------------------
  const handleToggleHabit = (habitId: string, dateString: string) => {
    const key = `${habitId}_${dateString}`;
    const nextVal = !completions[key];
    const newCompletions = { ...completions, [key]: nextVal };
    setCompletions(newCompletions);
    saveCompletions(newCompletions, user?.id);
    handleUnifiedAutoSave(habits, newCompletions);
  };

  const handleAddHabit = (newHabit: { name: string; icon: string; category: string }) => {
    const created: Habit = {
      id: "habit_" + Date.now(),
      name: newHabit.name,
      icon: newHabit.icon,
      category: newHabit.category,
      createdAt: new Date().toISOString(),
    };
    const next = [...habits, created];
    setHabits(next);
    saveHabits(next, user?.id);
    handleUnifiedAutoSave(next);
  };

  const handleUpdateHabit = (updated: Habit) => {
    const next = habits.map((h) => (h.id === updated.id ? updated : h));
    setHabits(next);
    saveHabits(next, user?.id);
    handleUnifiedAutoSave(next);
  };

  const handleDeleteHabit = (id: string) => {
    const next = habits.filter((h) => h.id !== id);
    setHabits(next);
    saveHabits(next, user?.id);
    handleUnifiedAutoSave(next);
  };

  const handleClearHabitMonthLogs = (habitId: string) => {
    setCompletions((prev) => {
      const next = { ...prev };
      days.forEach((day) => {
        const key = `${habitId}_${day.dateString}`;
        delete next[key];
      });
      saveCompletions(next, user?.id);
      handleUnifiedAutoSave(habits, next);
      return next;
    });
  };

  const handleReorderHabits = (newHabits: Habit[]) => {
    setHabits(newHabits);
    saveHabits(newHabits, user?.id);
    handleUnifiedAutoSave(newHabits);
  };

  const handleMoveHabit = (habitId: string, direction: "up" | "down") => {
    const index = habits.findIndex((h) => h.id === habitId);
    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === habits.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const copy = [...habits];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setHabits(copy);
    saveHabits(copy, user?.id);
    handleUnifiedAutoSave(copy);
  };

  const handleSaveNote = (habitId: string, dateString: string, noteText: string) => {
    const key = `${habitId}_${dateString}`;
    const nextNotes = { ...habitNotes, [key]: noteText };
    setHabitNotes(nextNotes);
    saveHabitNotes(nextNotes, user?.id);
    handleUnifiedAutoSave(habits, completions, wellness, nextNotes);
  };

  const handleUpdateWellness = (dateStr: string, field: "mood" | "sleepHours", value: number) => {
    const prev = wellness[dateStr] || {};
    const nextWellness = {
      ...wellness,
      [dateStr]: {
        ...prev,
        [field]: value,
      },
    };
    setWellness(nextWellness);
    saveWellness(nextWellness, user?.id);
    handleUnifiedAutoSave(habits, completions, nextWellness);
  };

  // ----------------------------------------------------
  // Spending Actions
  // ----------------------------------------------------
  const handleAddSpendingTransaction = (newTx: Omit<SpendingTransaction, "id" | "createdAt">) => {
    const created: SpendingTransaction = {
      ...newTx,
      id: "tx_" + Date.now(),
      createdAt: new Date().toISOString(),
    };
    const next = [created, ...transactions];
    setTransactions(next);
    saveSpendingTransactions(next, user?.id);
    handleUnifiedAutoSave(undefined, undefined, undefined, undefined, categories, next, budgetConfig);
  };

  const handleSaveSpendingTransaction = (tx: SpendingTransaction) => {
    let next: SpendingTransaction[];
    const exists = transactions.some((t) => t.id === tx.id);
    if (exists) {
      next = transactions.map((t) => (t.id === tx.id ? tx : t));
    } else {
      next = [tx, ...transactions];
    }
    setTransactions(next);
    saveSpendingTransactions(next, user?.id);
    handleUnifiedAutoSave(undefined, undefined, undefined, undefined, categories, next, budgetConfig);
  };

  const handleDeleteSpendingTransaction = (txId: string) => {
    const next = transactions.filter((t) => t.id !== txId);
    setTransactions(next);
    saveSpendingTransactions(next, user?.id);
    handleUnifiedAutoSave(undefined, undefined, undefined, undefined, categories, next, budgetConfig);
  };

  const handleAddSpendingCategory = (cat: { name: string; icon: string; budget?: number; color?: string }) => {
    const newCat: SpendingCategory = {
      id: "cat_" + Date.now(),
      name: cat.name,
      icon: cat.icon,
      budget: cat.budget,
      color: cat.color || "#3b82f6",
      createdAt: new Date().toISOString(),
    };
    const next = [...categories, newCat];
    setCategories(next);
    saveSpendingCategories(next, user?.id);
    handleUnifiedAutoSave(undefined, undefined, undefined, undefined, next, transactions, budgetConfig);
  };

  const handleUpdateSpendingCategory = (cat: SpendingCategory) => {
    const next = categories.map((c) => (c.id === cat.id ? cat : c));
    setCategories(next);
    saveSpendingCategories(next, user?.id);
    handleUnifiedAutoSave(undefined, undefined, undefined, undefined, next, transactions, budgetConfig);
  };

  const handleMoveSpendingCategory = (catId: string, direction: "up" | "down") => {
    const index = categories.findIndex((c) => c.id === catId);
    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === categories.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const copy = [...categories];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setCategories(copy);
    saveSpendingCategories(copy, user?.id);
    handleUnifiedAutoSave(undefined, undefined, undefined, undefined, copy);
  };

  const handleReorderSpendingCategories = (newCats: SpendingCategory[]) => {
    setCategories(newCats);
    saveSpendingCategories(newCats, user?.id);
    handleUnifiedAutoSave(undefined, undefined, undefined, undefined, newCats);
  };

  const handleDeleteSpendingCategory = (catId: string) => {
    if (confirm("តើអ្នកពិតជាចង់លុបប្រភេទចំណាយនេះមែនទេ? រាល់ប្រតិបត្តិការដែលជាប់ទាក់ទងនឹងត្រូវបានលុបផងដែរ។")) {
      const nextCats = categories.filter((c) => c.id !== catId);
      const nextTxs = transactions.filter((t) => t.categoryId !== catId);
      setCategories(nextCats);
      setTransactions(nextTxs);
      saveSpendingCategories(nextCats, user?.id);
      saveSpendingTransactions(nextTxs, user?.id);
      handleUnifiedAutoSave(undefined, undefined, undefined, undefined, nextCats, nextTxs, budgetConfig);
    }
  };

  const handleSaveBudget = (newBudget: SpendingBudgetConfig) => {
    setBudgetConfig(newBudget);
    saveSpendingBudget(newBudget, user?.id);
    handleUnifiedAutoSave(undefined, undefined, undefined, undefined, categories, transactions, newBudget);
  };

  // ----------------------------------------------------
  // Trading Actions
  // ----------------------------------------------------
  const handleSaveTrade = (tradeData: Omit<Trade, "id" | "createdAt">, id?: string) => {
    let next: Trade[];
    if (id) {
      next = trades.map((t) => (t.id === id ? { ...t, ...tradeData } : t));
    } else {
      const newTrade: Trade = {
        ...tradeData,
        id: "trade_" + Date.now(),
        createdAt: new Date().toISOString(),
      };
      next = [newTrade, ...trades];
    }
    setTrades(next);
    saveTrades(next, user?.id);
    handleUnifiedAutoSave(undefined, undefined, undefined, undefined, undefined, undefined, undefined, next);
  };

  const handleDeleteTrade = (tradeId: string) => {
    if (!confirm("តើអ្នកប្រាកដជាចង់លុប Trade នេះមែនទេ?")) return;
    const target = trades.find((t) => t.id === tradeId);
    if (target?.imageUrls) {
      target.imageUrls.forEach((imgId) => {
        deleteTradeImage(imgId).catch(() => {});
      });
    }
    const next = trades.filter((t) => t.id !== tradeId);
    setTrades(next);
    saveTrades(next, user?.id);
    handleUnifiedAutoSave(undefined, undefined, undefined, undefined, undefined, undefined, undefined, next);
  };

  // ----------------------------------------------------
  // Export / Import / Reset
  // ----------------------------------------------------
  const handleExportExcel = () => {
    const spendingData: UnifiedSpendingData = {
      categories,
      transactions,
      budgetConfig,
    };
    downloadExcelFile(
      habits,
      completions,
      wellness,
      days,
      dateRangeLabel || getKhmerMonthYear(currentDate),
      excelState.fileName || "habit-and-spending-data.xlsx",
      cycleConfig,
      habitNotes,
      spendingData,
      trades
    );
  };

  const handleExportData = () => {
    const backup = {
      user: user ? { email: user.email, name: user.name, spreadsheetUrl: user.spreadsheetUrl } : null,
      cycleConfig,
      habits,
      completions,
      habitNotes,
      wellness,
      spending: {
        categories,
        transactions,
        budgetConfig,
      },
      trading: trades,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `life-tracker-backup-${user?.email || "guest"}-${year}-${month + 1}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.habits && Array.isArray(parsed.habits)) {
          setHabits(parsed.habits);
          saveHabits(parsed.habits, user?.id);
        }
        if (parsed.completions) {
          setCompletions(parsed.completions);
          saveCompletions(parsed.completions, user?.id);
        }
        if (parsed.habitNotes) {
          setHabitNotes(parsed.habitNotes);
          saveHabitNotes(parsed.habitNotes, user?.id);
        }
        if (parsed.wellness) {
          setWellness(parsed.wellness);
          saveWellness(parsed.wellness, user?.id);
        }
        if (parsed.cycleConfig) {
          setCycleConfig(parsed.cycleConfig);
          saveCycleConfig(parsed.cycleConfig, user?.id);
        }
        if (parsed.spending) {
          if (parsed.spending.categories) {
            setCategories(parsed.spending.categories);
            saveSpendingCategories(parsed.spending.categories, user?.id);
          }
          if (parsed.spending.transactions) {
            setTransactions(parsed.spending.transactions);
            saveSpendingTransactions(parsed.spending.transactions, user?.id);
          }
          if (parsed.spending.budgetConfig) {
            setBudgetConfig(parsed.spending.budgetConfig);
            saveSpendingBudget(parsed.spending.budgetConfig, user?.id);
          }
        }
        if (parsed.trading && Array.isArray(parsed.trading)) {
          setTrades(parsed.trading);
          saveTrades(parsed.trading, user?.id);
        }
        alert("បានបញ្ចូលទិន្នន័យពី Backup ដោយជោគជ័យ!");
      } catch (err) {
        console.error(err);
        alert("មិនអាចអានឯកសារ Backup បានទេ។");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleResetData = () => {
    if (confirm("តើអ្នកពិតជាចង់កំណត់ទិន្នន័យឡើងវិញមែនទេ? ទិន្នន័យទាំងអស់នឹងត្រូវលុប។")) {
      if (activeTab === "habits") {
        setHabits(DEFAULT_HABITS);
        setCompletions({});
        setHabitNotes({});
        setWellness({});
        saveHabits(DEFAULT_HABITS, user?.id);
        saveCompletions({}, user?.id);
        saveHabitNotes({}, user?.id);
        saveWellness({}, user?.id);
      } else if (activeTab === "spending") {
        setCategories(DEFAULT_SPENDING_CATEGORIES);
        setTransactions([]);
        setBudgetConfig(DEFAULT_BUDGET_CONFIG);
        saveSpendingCategories(DEFAULT_SPENDING_CATEGORIES, user?.id);
        saveSpendingTransactions([], user?.id);
        saveSpendingBudget(DEFAULT_BUDGET_CONFIG, user?.id);
      } else if (activeTab === "journal") {
        setTrades(SAMPLE_TRADES);
        saveTrades(SAMPLE_TRADES, user?.id);
      }
      alert("ទិន្នន័យត្រូវបានកំណត់ឡើងវិញដោយជោគជ័យ!");
    }
  };

  // ----------------------------------------------------
  // Statistics Calculations
  // ----------------------------------------------------
  // Habit Stats
  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }, []);

  const todayPercentage = useMemo(() => {
    const total = habits.length;
    if (total === 0) return 0;
    let done = 0;
    habits.forEach((h) => {
      if (completions[`${h.id}_${todayStr}`]) done++;
    });
    return Math.round((done / total) * 100);
  }, [habits, completions, todayStr]);

  const dailyChartData: DailyProgressData[] = useMemo(() => {
    const totalHabits = habits.length;
    return days.map((day) => {
      let completedCount = 0;
      habits.forEach((h) => {
        if (completions[`${h.id}_${day.dateString}`]) completedCount++;
      });
      const percentage = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;
      return {
        dayInfo: day,
        dayLabel: `${day.dayOfWeek} ${day.dayNumber}`,
        dayOfWeek: day.dayOfWeek,
        dayNumber: day.dayNumber,
        dateString: day.dateString,
        percentage,
        completed: completedCount,
        total: totalHabits,
        isToday: !!day.isToday,
      };
    });
  }, [days, habits, completions]);

  const monthAveragePercentage = useMemo(() => {
    if (dailyChartData.length === 0) return 0;
    const sum = dailyChartData.reduce((acc, curr) => acc + curr.percentage, 0);
    return Math.round(sum / dailyChartData.length);
  }, [dailyChartData]);

  const weeklyChartData = useMemo(() => {
    return weeks.map((week) => {
      const totalPossible = week.days.length * habits.length;
      let totalDone = 0;
      week.days.forEach((day) => {
        habits.forEach((h) => {
          if (completions[`${h.id}_${day.dateString}`]) totalDone++;
        });
      });
      const percentage = totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;
      return {
        weekLabel: `សប្តាហ៍ ${toKhmerNum(week.weekNumber)}`,
        weekNumber: week.weekNumber,
        percentage,
        completed: totalDone,
        total: totalPossible,
      };
    });
  }, [weeks, habits, completions]);

  // Spending Stats
  const activeCycleDateStrings = useMemo(() => new Set(days.map((d) => d.dateString)), [days]);
  const cycleTransactions = useMemo(
    () => transactions.filter((tx) => activeCycleDateStrings.has(tx.dateString)),
    [transactions, activeCycleDateStrings]
  );
  const totalSpentUsd = useMemo(
    () => cycleTransactions.reduce((acc, tx) => acc + tx.amount, 0),
    [cycleTransactions]
  );
  const todaySpentUsd = useMemo(
    () =>
      transactions
        .filter((tx) => tx.dateString === todayStr)
        .reduce((acc, tx) => acc + tx.amount, 0),
    [transactions, todayStr]
  );
  const dailyAverageUsd = useMemo(() => {
    if (days.length === 0) return 0;
    return Number((totalSpentUsd / days.length).toFixed(2));
  }, [totalSpentUsd, days]);

  const dailySpendingChartData: DailySpendingBarData[] = useMemo(() => {
    const map = new Map<string, { amount: number; count: number }>();
    transactions.forEach((tx) => {
      const existing = map.get(tx.dateString) || { amount: 0, count: 0 };
      existing.amount += tx.amount;
      existing.count += 1;
      map.set(tx.dateString, existing);
    });
    return days.map((day) => {
      const data = map.get(day.dateString) || { amount: 0, count: 0 };
      return {
        dayInfo: day,
        dayLabel: `${day.dayOfWeek} ${day.dayNumber}`,
        dayOfWeek: day.dayOfWeek,
        dayNumber: day.dayNumber,
        dateString: day.dateString,
        amountUsd: data.amount,
        transactionsCount: data.count,
        isToday: !!day.isToday,
      };
    });
  }, [days, transactions]);

  // Trading Stats
  const overallStats = useMemo(() => calculateTradingStats(trades), [trades]);
  const monthStats = useMemo(() => {
    const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
    const filtered = trades.filter((t) => t.dateString.startsWith(monthKey));
    return calculateTradingStats(filtered);
  }, [trades, year, month]);

  // Derive active day summary dynamically from trades so delete/add/edit updates immediately!
  const activeDaySummary = useMemo<DayTradesSummary | null>(() => {
    if (!selectedDaySummary) return null;
    const dateTrades = trades.filter((t) => t.dateString === selectedDaySummary.dateString);
    const totalPnl = Number(dateTrades.reduce((acc, curr) => acc + curr.pnl, 0).toFixed(2));
    const winningCount = dateTrades.filter((t) => t.pnl > 0).length;
    const losingCount = dateTrades.filter((t) => t.pnl < 0).length;

    return {
      ...selectedDaySummary,
      trades: dateTrades,
      tradesCount: dateTrades.length,
      totalPnl,
      winningCount,
      losingCount,
    };
  }, [selectedDaySummary, trades]);

  // Render context-specific Stat Pills in Header
  const renderHeaderStatPills = () => {
    if (activeTab === "habits") {
      return (
        <div className="flex items-center gap-1.5 sm:gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-[#181a24] border border-gray-200 dark:border-gray-800">
            <span className="text-gray-500 dark:text-gray-400">សរុប:</span>
            <span className="font-bold text-gray-900 dark:text-white">{habits.length} ទម្លាប់</span>
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
      );
    }

    if (activeTab === "spending") {
      return (
        <div className="flex items-center gap-1.5 sm:gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400">
            <span className="hidden sm:inline">ចំណាយសរុប:</span>
            <span className="font-extrabold">
              {displayCurrency === "USD"
                ? formatUsd(totalSpentUsd)
                : `${(totalSpentUsd * 4000).toLocaleString()} ៛`}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
            <span className="hidden sm:inline">ថ្ងៃនេះ:</span>
            <span className="font-extrabold">
              {displayCurrency === "USD"
                ? formatUsd(todaySpentUsd)
                : `${(todaySpentUsd * 4000).toLocaleString()} ៛`}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-[#181a24] border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300">
            <span className="hidden sm:inline">មធ្យម/ថ្ងៃ:</span>
            <span className="font-bold">
              {displayCurrency === "USD"
                ? formatUsd(dailyAverageUsd)
                : `${(dailyAverageUsd * 4000).toLocaleString()} ៛`}
            </span>
          </div>
        </div>
      );
    }

    if (activeTab === "journal") {
      return (
        <div className="flex items-center gap-1.5 sm:gap-2.5 text-xs">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-extrabold ${
              overallStats.netPnl >= 0
                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/10 border-red-500/25 text-red-600 dark:text-red-400"
            }`}
          >
            <span className="hidden sm:inline">Net P&L:</span>
            <span>{formatPnl(overallStats.netPnl)}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400">
            <span className="hidden sm:inline">Win Rate:</span>
            <span className="font-extrabold">{overallStats.winRate}%</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-[#181a24] border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300">
            <span className="hidden sm:inline">Trades:</span>
            <span className="font-bold">{overallStats.totalTrades}</span>
          </div>
        </div>
      );
    }

    return null;
  };

  // Extra action buttons for specific tabs
  const renderHeaderExtraButtons = () => {
    if (activeTab === "spending") {
      return (
        <>
          <button
            type="button"
            onClick={() => setIsBudgetModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-[#181a24] hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 text-xs font-semibold transition-all shadow-sm"
          >
            <span>⚙️ ថវិកា</span>
          </button>
          <button
            type="button"
            onClick={() => setDisplayCurrency((prev) => (prev === "USD" ? "KHR" : "USD"))}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all hover:bg-emerald-500/20"
            title="ប្តូររូបិយប័ណ្ណ (1$ = 4,000 ៛)"
          >
            {displayCurrency === "USD" ? "$ USD" : "៛ KHR"}
          </button>
        </>
      );
    }
    return null;
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#090a0f] flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
        កំពុងដំណើរការកម្មវិធី...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#090a0f] text-gray-900 dark:text-gray-100 flex flex-col pb-12 transition-colors duration-200">
      {/* 1. Global Reusable 2-Row Header */}
      <Header
        activeTab={activeTab}
        onTabChange={handleTabChange}
        currentDate={currentDate}
        dateRangeLabel={dateRangeLabel}
        isCustomCycle={isCustomCycle}
        onOpenStartingDayModal={
          activeTab === "habits" || activeTab === "spending"
            ? () => setIsStartingDayModalOpen(true)
            : undefined
        }
        excelStorageState={{
          ...excelState,
          onReAuthorize: handleReAuthorizeExcel,
        }}
        onOpenExcelModal={() => setIsExcelModalOpen(true)}
        onExportExcel={handleExportExcel}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        user={user}
        syncStatus={syncStatus}
        onLogin={(u) => {
          setUser(u);
          saveUserSession(u);
        }}
        onLogout={() => {
          setUser(null);
          saveUserSession(null);
        }}
        onPrevMonth={handlePrevDate}
        onNextMonth={handleNextDate}
        onGoToToday={handleGoToToday}
        onOpenAddHabit={() => {
          if (activeTab === "habits") setIsAddHabitModalOpen(true);
          else if (activeTab === "spending") setIsAddCategoryModalOpen(true);
          else if (activeTab === "journal") {
            setTradeToEdit(null);
            setTargetDateForNewTrade(new Date().toISOString().slice(0, 10));
            setIsTradeEntryModalOpen(true);
          }
        }}
        onResetData={handleResetData}
        onExportData={handleExportData}
        onImportData={handleImportData}
        statPills={renderHeaderStatPills()}
        extraActionButtons={renderHeaderExtraButtons()}
      />

      {/* 2. Main Tab Body (Instant 0ms switching without DOM teardown) */}
      <main className="max-w-[1700px] w-full mx-auto px-2 sm:px-6 pt-4 sm:pt-6 flex-1">
        
        {/* ======================= TAB 1: HABITS ======================= */}
        {activeTab === "habits" && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-150">
            {/* Daily & Weekly Progress Bar Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="lg:col-span-2">
                <DailyProgressBarChart data={dailyChartData} theme={theme} />
              </div>
              <div>
                <WeeklyProgressBarChart data={weeklyChartData} theme={theme} />
              </div>
            </div>

            {/* Habit Grid Tracker */}
            <HabitGrid
              habits={habits}
              days={days}
              weeks={weeks}
              completions={completions}
              habitNotes={habitNotes}
              onToggleHabit={handleToggleHabit}
              onEditHabit={(h) => setEditingHabit(h)}
              onDeleteHabit={handleDeleteHabit}
              onMoveHabit={handleMoveHabit}
              onReorderHabits={handleReorderHabits}
              onOpenNoteModal={(habit, day) => setActiveNoteTarget({ habit, day })}
            />

            {/* Wellness Tracker Section */}
            <WellnessTracker
              days={days}
              wellness={wellness}
              onUpdateWellness={handleUpdateWellness}
            />
          </div>
        )}

        {/* ======================= TAB 2: SPENDING ======================= */}
        {activeTab === "spending" && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-150">
            {/* Spending KPI Summary Cards */}
            <SpendingKpiCards
              totalSpentUsd={totalSpentUsd}
              todaySpentUsd={todaySpentUsd}
              dailyAverageUsd={dailyAverageUsd}
              budgetConfig={budgetConfig}
              daysCount={days.length}
              onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
              currency={displayCurrency}
              onToggleCurrency={() =>
                setDisplayCurrency((prev) => (prev === "USD" ? "KHR" : "USD"))
              }
            />

            {/* Daily Spending Bar Chart & Category Breakdown */}
            <SpendingCharts
              dailyData={dailySpendingChartData}
              categories={categories}
              transactions={transactions}
              currency={displayCurrency}
              exchangeRate={4000}
              theme={theme}
            />

            {/* Detailed Spending Matrix Grid */}
            <SpendingGrid
              categories={categories}
              days={days}
              transactions={transactions}
              currency={displayCurrency}
              exchangeRate={4000}
              onOpenEntryModal={(cat, day) => {
                setSelectedSpendingCategory(cat);
                setSelectedSpendingDay(day);
                setIsSpendingEntryModalOpen(true);
              }}
              onEditCategory={(cat) => setEditingCategory(cat)}
              onDeleteCategory={handleDeleteSpendingCategory}
              onMoveCategory={handleMoveSpendingCategory}
              onReorderCategories={handleReorderSpendingCategories}
            />
          </div>
        )}

        {/* ======================= TAB 3: TRADING JOURNAL ======================= */}
        {activeTab === "journal" && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-150">
            {/* Top Overview Banner */}
            <div className="bg-white dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    1 USD = 4,000 KHR • IndexedDB Screenshot Storage
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

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTradeToEdit(null);
                    setTargetDateForNewTrade(new Date().toISOString().slice(0, 10));
                    setIsTradeEntryModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-extrabold text-xs sm:text-sm shadow-md transition-all"
                >
                  + កត់ត្រា Trade
                </button>
              </div>
            </div>

            {/* Trading KPI Cards */}
            <TradingStatsCards stats={overallStats} monthStats={monthStats} />

            {/* P&L Calendar Grid */}
            <TradingCalendar
              currentDate={currentDate}
              onPrevMonth={handlePrevDate}
              onNextMonth={handleNextDate}
              onSelectYear={(yr) => setCurrentDate(new Date(yr, month, 1))}
              onSelectDay={(daySummary) => {
                setSelectedDaySummary(daySummary);
                setIsDayDetailModalOpen(true);
              }}
              trades={trades}
            />

            {/* Solution Explanation Card */}
            <div className="bg-white dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-3xl p-5 sm:p-7 shadow-sm">
              <div className="flex items-center gap-2.5 text-emerald-500 font-bold text-sm mb-2">
                <Sparkles className="w-4 h-4" />
                <span>ដំណោះស្រាយរក្សាទុករូបភាព Chart (Image Storage Solution):</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#181a24] border border-gray-100 dark:border-gray-800 space-y-1">
                  <span className="font-bold text-gray-900 dark:text-white block">1. IndexedDB Browser Cache</span>
                  <p>រូបភាព Screenshot ត្រូវបានរក្សាទុកដោយផ្ទាល់ក្នុង Browser Database (IndexedDB) ដោយឥតគិតថ្លៃ និងមិនចាំបាច់មាន Server។</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#181a24] border border-gray-100 dark:border-gray-800 space-y-1">
                  <span className="font-bold text-gray-900 dark:text-white block">2. Image Compression ស្វ័យប្រវត្ត</span>
                  <p>រាល់រូបភាពត្រូវបានកាត់បន្ថយទំហំ (Compress 1280px) ដើម្បីធានាល្បឿនលឿន និងសន្សំសំចៃទំហំផ្ទុក។</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#181a24] border border-gray-100 dark:border-gray-800 space-y-1">
                  <span className="font-bold text-gray-900 dark:text-white block">3. Excel Data Link</span>
                  <p>ទិន្នន័យ Trade ទាំងអស់ (Symbol, Session, Entry/Exit, P&L) ត្រូវបាន Save ទៅ Excel Sheet <strong>Trades_Log</strong> ស្វ័យប្រវត្តិ។</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* -------------------- SHARED MODALS -------------------- */}
      {/* Starting Day & Cycle Modal */}
      <StartingDayModal
        isOpen={isStartingDayModalOpen}
        onClose={() => setIsStartingDayModalOpen(false)}
        cycleConfig={cycleConfig}
        onSaveCycleConfig={handleSaveCycleConfig}
        currentDate={currentDate}
      />

      {/* Excel Connection Modal */}
      <ExcelConnectionModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onConnected={(fileName, handle) => {
          setExcelState({
            isConnected: true,
            needsPermission: false,
            fileName,
            fileHandle: handle,
            lastSyncedAt: new Date().toLocaleTimeString(),
            isSyncing: false,
          });
        }}
        habits={habits}
        completions={completions}
        habitNotes={habitNotes}
        wellness={wellness}
        days={days}
        dateRangeLabel={dateRangeLabel || getKhmerMonthYear(currentDate)}
        cycleConfig={cycleConfig}
        spending={{
          categories,
          transactions,
          budgetConfig,
        }}
        trading={trades}
        onImportData={(data) => {
          if (data.habits && data.habits.length > 0) {
            setHabits(data.habits);
            saveHabits(data.habits, user?.id);
          }
          if (data.completions) {
            setCompletions(data.completions);
            saveCompletions(data.completions, user?.id);
          }
          if (data.habitNotes) {
            setHabitNotes(data.habitNotes);
            saveHabitNotes(data.habitNotes, user?.id);
          }
          if (data.wellness) {
            setWellness(data.wellness);
            saveWellness(data.wellness, user?.id);
          }
          if (data.cycleConfig) {
            setCycleConfig(data.cycleConfig);
            saveCycleConfig(data.cycleConfig, user?.id);
          }
          if (data.spending) {
            if (data.spending.categories) {
              setCategories(data.spending.categories);
              saveSpendingCategories(data.spending.categories, user?.id);
            }
            if (data.spending.transactions) {
              setTransactions(data.spending.transactions);
              saveSpendingTransactions(data.spending.transactions, user?.id);
            }
            if (data.spending.budgetConfig) {
              setBudgetConfig(data.spending.budgetConfig);
              saveSpendingBudget(data.spending.budgetConfig, user?.id);
            }
          }
          if (data.trading && Array.isArray(data.trading)) {
            setTrades(data.trading);
            saveTrades(data.trading, user?.id);
          }
        }}
      />

      {/* -------------------- HABITS MODALS -------------------- */}
      <AddHabitModal
        isOpen={isAddHabitModalOpen}
        onClose={() => setIsAddHabitModalOpen(false)}
        onAddHabit={handleAddHabit}
      />

      {editingHabit && (
        <EditHabitModal
          habit={editingHabit}
          isOpen={!!editingHabit}
          onClose={() => setEditingHabit(null)}
          onUpdateHabit={handleUpdateHabit}
          onDeleteHabit={handleDeleteHabit}
          onClearHabitMonthLogs={handleClearHabitMonthLogs}
        />
      )}

      {activeNoteTarget && (
        <HabitNoteModal
          isOpen={!!activeNoteTarget}
          onClose={() => setActiveNoteTarget(null)}
          habit={activeNoteTarget.habit}
          day={activeNoteTarget.day}
          initialCompleted={
            !!completions[`${activeNoteTarget.habit.id}_${activeNoteTarget.day.dateString}`]
          }
          initialNote={
            habitNotes[`${activeNoteTarget.habit.id}_${activeNoteTarget.day.dateString}`] || ""
          }
          onSave={(completed, note) => {
            const hId = activeNoteTarget.habit.id;
            const dStr = activeNoteTarget.day.dateString;
            const newCompletions = { ...completions, [`${hId}_${dStr}`]: completed };
            const newNotes = { ...habitNotes, [`${hId}_${dStr}`]: note };
            setCompletions(newCompletions);
            setHabitNotes(newNotes);
            saveCompletions(newCompletions, user?.id);
            saveHabitNotes(newNotes, user?.id);
            handleUnifiedAutoSave(habits, newCompletions, wellness, newNotes);
            setActiveNoteTarget(null);
          }}
        />
      )}

      {/* -------------------- SPENDING MODALS -------------------- */}
      {isSpendingEntryModalOpen && (
        <SpendingEntryModal
          isOpen={isSpendingEntryModalOpen}
          onClose={() => {
            setIsSpendingEntryModalOpen(false);
            setSelectedSpendingDay(null);
            setSelectedSpendingCategory(null);
          }}
          category={selectedSpendingCategory}
          day={selectedSpendingDay}
          transactions={transactions.filter(
            (t) =>
              t.dateString === selectedSpendingDay?.dateString &&
              (!selectedSpendingCategory || t.categoryId === selectedSpendingCategory.id)
          )}
          onAddTransaction={handleAddSpendingTransaction}
          onDeleteTransaction={handleDeleteSpendingTransaction}
          exchangeRate={4000}
        />
      )}

      <AddSpendingCategoryModal
        isOpen={isAddCategoryModalOpen}
        onClose={() => setIsAddCategoryModalOpen(false)}
        onAddCategory={handleAddSpendingCategory}
      />

      {editingCategory && (
        <EditSpendingCategoryModal
          isOpen={!!editingCategory}
          onClose={() => setEditingCategory(null)}
          category={editingCategory}
          onUpdateCategory={handleUpdateSpendingCategory}
          onDeleteCategory={handleDeleteSpendingCategory}
        />
      )}

      <BudgetSettingsModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        config={budgetConfig}
        onSaveConfig={handleSaveBudget}
      />

      {/* -------------------- TRADING MODALS -------------------- */}
      {activeDaySummary && (
        <DayTradesDetailModal
          isOpen={isDayDetailModalOpen}
          onClose={() => {
            setIsDayDetailModalOpen(false);
            setSelectedDaySummary(null);
          }}
          daySummary={activeDaySummary}
          onOpenAddTrade={(dateStr) => {
            setIsDayDetailModalOpen(false);
            setTradeToEdit(null);
            setTargetDateForNewTrade(dateStr);
            setIsTradeEntryModalOpen(true);
          }}
          onEditTrade={(trade) => {
            setIsDayDetailModalOpen(false);
            setTradeToEdit(trade);
            setTargetDateForNewTrade(trade.dateString);
            setIsTradeEntryModalOpen(true);
          }}
          onDeleteTrade={handleDeleteTrade}
          onViewImage={(url) => setViewingImageUrl(url)}
        />
      )}

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

      <ImageViewerModal
        imageUrl={viewingImageUrl}
        onClose={() => setViewingImageUrl(null)}
      />
    </div>
  );
};
