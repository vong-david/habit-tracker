"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  SpendingCategory,
  SpendingTransaction,
  SpendingBudgetConfig,
  Currency,
} from "@/types/spending";
import { DayInfo, TrackerCycleConfig } from "@/types/habit";
import { UserProfile, SyncStatus } from "@/types/auth";
import { getStoredUser, saveUserSession } from "@/lib/auth";
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
  getDaysInMonth,
  getDaysForCycle,
  groupDaysByWeek,
  getKhmerMonthYear,
  getKhmerDateRangeLabel,
  toKhmerNum,
} from "@/lib/dateUtils";
import { loadCycleConfig, saveCycleConfig } from "@/lib/storage";
import {
  writeSpendingToExcelFileHandle,
  downloadSpendingExcelFile,
  getStoredSpendingHandle,
} from "@/lib/spendingExcelStorage";
import { Header } from "@/components/Header";
import { SpendingKpiCards } from "@/components/SpendingKpiCards";
import { SpendingCharts, DailySpendingBarData } from "@/components/SpendingCharts";
import { SpendingGrid } from "@/components/SpendingGrid";
import { SpendingEntryModal } from "@/components/SpendingEntryModal";
import { AddSpendingCategoryModal } from "@/components/AddSpendingCategoryModal";
import { EditSpendingCategoryModal } from "@/components/EditSpendingCategoryModal";
import { BudgetSettingsModal } from "@/components/BudgetSettingsModal";
import { StartingDayModal } from "@/components/StartingDayModal";
import { SpendingExcelModal } from "@/components/SpendingExcelModal";

export default function SpendingPage() {
  const [isClient, setIsClient] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [displayCurrency, setDisplayCurrency] = useState<Currency>("USD");

  // Local Excel File Storage State
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

  // Cycle Configuration
  const [cycleConfig, setCycleConfig] = useState<TrackerCycleConfig>({ mode: "today_to_end" });
  const [customCycleStartDate, setCustomCycleStartDate] = useState<Date>(new Date());
  const [isStartingDayModalOpen, setIsStartingDayModalOpen] = useState(false);

  // Spending Core State
  const [categories, setCategories] = useState<SpendingCategory[]>(DEFAULT_SPENDING_CATEGORIES);
  const [transactions, setTransactions] = useState<SpendingTransaction[]>([]);
  const [budgetConfig, setBudgetConfig] = useState<SpendingBudgetConfig>(DEFAULT_BUDGET_CONFIG);

  // Modals
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SpendingCategory | null>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [entryModalTarget, setEntryModalTarget] = useState<{
    category: SpendingCategory;
    day: DayInfo;
  } | null>(null);

  // Initialize on mount
  useEffect(() => {
    setIsClient(true);
    const storedUser = getStoredUser();
    setUser(storedUser);

    const userId = storedUser?.id;
    setCategories(loadSpendingCategories(userId));
    setTransactions(loadSpendingTransactions(userId));
    setBudgetConfig(loadSpendingBudget(userId));

    const savedCycle = loadCycleConfig(userId);
    if (savedCycle && savedCycle.mode) {
      setCycleConfig(savedCycle);
      if (savedCycle.startDate) {
        const [y, m, d] = savedCycle.startDate.split("-").map(Number);
        setCustomCycleStartDate(new Date(y, m - 1, d));
      }
    } else {
      setCycleConfig({ mode: "today_to_end" });
    }

    // Check saved Excel file handle
    getStoredSpendingHandle().then(async (handle) => {
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
        } catch (e) {
          console.warn("Could not query spending handle permission", e);
        }
      }
    });

    const savedTheme = localStorage.getItem("habit_tracker_theme") as "dark" | "light" | null;
    const initialTheme = savedTheme || "dark";
    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (!isClient) return;
    saveSpendingCategories(categories, user?.id);
  }, [categories, user?.id, isClient]);

  useEffect(() => {
    if (!isClient) return;
    saveSpendingTransactions(transactions, user?.id);
  }, [transactions, user?.id, isClient]);

  useEffect(() => {
    if (!isClient) return;
    saveSpendingBudget(budgetConfig, user?.id);
  }, [budgetConfig, user?.id, isClient]);

  // Calendar Month values
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const isCustomCycle = cycleConfig.mode !== "full_month";

  // Days in view
  const days = useMemo(() => {
    const today = new Date();
    const isViewingCurrentMonth =
      today.getFullYear() === currentDate.getFullYear() &&
      today.getMonth() === currentDate.getMonth();

    if (cycleConfig.mode === "consecutive_days") {
      return getDaysForCycle(customCycleStartDate, cycleConfig.durationDays || 30);
    }

    if (cycleConfig.mode === "today_to_end") {
      const startDay = isViewingCurrentMonth ? today.getDate() : 1;
      return getDaysInMonth(year, month, startDay);
    }

    if (cycleConfig.mode === "custom_start_day") {
      const startDay = cycleConfig.startDay || (isViewingCurrentMonth ? today.getDate() : 1);
      return getDaysInMonth(year, month, startDay);
    }

    return getDaysInMonth(year, month, 1);
  }, [cycleConfig, customCycleStartDate, year, month, currentDate]);

  const dateRangeLabel = useMemo(() => {
    return getKhmerDateRangeLabel(days);
  }, [days]);

  // Auto-sync to Linked Excel file (.xlsx)
  useEffect(() => {
    if (!isClient || !excelState.isConnected || !excelState.fileHandle) return;

    setExcelState((prev) => ({ ...prev, isSyncing: true }));
    const timer = setTimeout(async () => {
      try {
        await writeSpendingToExcelFileHandle(
          excelState.fileHandle!,
          categories,
          transactions,
          days,
          dateRangeLabel,
          budgetConfig,
          cycleConfig
        );
        setExcelState((prev) => ({
          ...prev,
          isSyncing: false,
          lastSyncedAt: new Date().toLocaleTimeString(),
        }));
      } catch (err) {
        console.warn("Auto-sync to spending Excel file failed", err);
        setExcelState((prev) => ({ ...prev, isSyncing: false }));
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [
    categories,
    transactions,
    days,
    dateRangeLabel,
    budgetConfig,
    cycleConfig,
    excelState.isConnected,
    excelState.fileHandle,
    isClient,
  ]);

  // Navigation handlers
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

  const handleSaveCycleConfig = (newConfig: TrackerCycleConfig) => {
    setCycleConfig(newConfig);
    saveCycleConfig(newConfig, user?.id);
    if (newConfig.mode === "consecutive_days" && newConfig.startDate) {
      const [y, m, d] = newConfig.startDate.split("-").map(Number);
      setCustomCycleStartDate(new Date(y, m - 1, d));
    }
  };

  // Transaction Management
  const handleAddTransaction = (newTx: Omit<SpendingTransaction, "id" | "createdAt">) => {
    const created: SpendingTransaction = {
      ...newTx,
      id: "tx_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString(),
    };
    setTransactions((prev) => [created, ...prev]);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Category Management
  const handleAddCategory = (newCat: {
    name: string;
    icon: string;
    budget?: number;
    color?: string;
  }) => {
    const created: SpendingCategory = {
      id: "cat_" + Date.now(),
      name: newCat.name,
      icon: newCat.icon,
      budget: newCat.budget,
      color: newCat.color || "#3b82f6",
      createdAt: new Date().toISOString(),
    };
    setCategories((prev) => [...prev, created]);
  };

  const handleUpdateCategory = (updated: SpendingCategory) => {
    setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleDeleteCategory = (catId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== catId));
    setTransactions((prev) => prev.filter((t) => t.categoryId !== catId));
  };

  const handleClearCategoryLogs = (catId: string) => {
    const dateStrings = new Set(days.map((d) => d.dateString));
    setTransactions((prev) =>
      prev.filter((t) => !(t.categoryId === catId && dateStrings.has(t.dateString)))
    );
  };

  const handleMoveCategory = (catId: string, direction: "up" | "down") => {
    setCategories((prev) => {
      const index = prev.findIndex((c) => c.id === catId);
      if (index === -1) return prev;
      if (direction === "up" && index === 0) return prev;
      if (direction === "down" && index === prev.length - 1) return prev;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleReorderCategories = (newCategories: SpendingCategory[]) => {
    setCategories(newCategories);
  };

  // Reset Data
  const handleResetData = () => {
    if (confirm("តើអ្នកពិតជាចង់កំណត់ទិន្នន័យចំណាយទាំងអស់ឡើងវិញទៅលំនាំដើមមែនទេ?")) {
      setCategories(DEFAULT_SPENDING_CATEGORIES);
      setTransactions([]);
      setBudgetConfig(DEFAULT_BUDGET_CONFIG);
      saveSpendingCategories(DEFAULT_SPENDING_CATEGORIES, user?.id);
      saveSpendingTransactions([], user?.id);
      saveSpendingBudget(DEFAULT_BUDGET_CONFIG, user?.id);
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    downloadSpendingExcelFile(
      categories,
      transactions,
      days,
      dateRangeLabel,
      budgetConfig,
      excelState.fileName || "daily-spending-data.xlsx",
      cycleConfig
    );
  };

  // Export JSON Backup
  const handleExportData = () => {
    const backup = {
      type: "spending_tracker_backup",
      version: "v1",
      user: user ? { email: user.email, name: user.name } : null,
      cycleConfig,
      budgetConfig,
      categories,
      transactions,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `spending-tracker-backup-${year}-${month + 1}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON Backup
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.categories && Array.isArray(parsed.categories)) {
          setCategories(parsed.categories);
          if (parsed.transactions) setTransactions(parsed.transactions);
          if (parsed.budgetConfig) setBudgetConfig(parsed.budgetConfig);
          if (parsed.cycleConfig) {
            setCycleConfig(parsed.cycleConfig);
            saveCycleConfig(parsed.cycleConfig, user?.id);
          }
          alert("ទិន្នន័យចំណាយត្រូវបាននាំចូល (Import) ដោយជោគជ័យ!");
        } else {
          alert("ឯកសារ Backup មិនត្រឹមត្រូវទេ។");
        }
      } catch (err) {
        console.error(err);
        alert("មិនអាចអានឯកសារបានឡើយ។");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Import from Excel file
  const handleImportFromExcel = (data: {
    categories?: SpendingCategory[];
    transactions?: SpendingTransaction[];
    budgetConfig?: SpendingBudgetConfig;
    cycleConfig?: TrackerCycleConfig;
  }) => {
    if (data.categories && data.categories.length > 0) {
      setCategories(data.categories);
      saveSpendingCategories(data.categories, user?.id);
    }
    if (data.transactions) {
      setTransactions(data.transactions);
      saveSpendingTransactions(data.transactions, user?.id);
    }
    if (data.budgetConfig) {
      setBudgetConfig(data.budgetConfig);
      saveSpendingBudget(data.budgetConfig, user?.id);
    }
    if (data.cycleConfig) {
      setCycleConfig(data.cycleConfig);
      saveCycleConfig(data.cycleConfig, user?.id);
    }
  };

  // Compute Metrics & Chart Data
  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;
  }, []);

  const totalSpentUsd = useMemo(() => {
    const dateStrings = new Set(days.map((d) => d.dateString));
    return transactions
      .filter((t) => dateStrings.has(t.dateString))
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [transactions, days]);

  const todaySpentUsd = useMemo(() => {
    return transactions
      .filter((t) => t.dateString === todayStr)
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [transactions, todayStr]);

  const dailyAverageUsd = useMemo(() => {
    if (days.length === 0) return 0;
    return Number((totalSpentUsd / days.length).toFixed(2));
  }, [totalSpentUsd, days]);

  const dailyChartData: DailySpendingBarData[] = useMemo(() => {
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

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#090a0f] flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
        កំពុងដំណើរការកម្មវិធីតាមដានការចំណាយ...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#090a0f] text-gray-900 dark:text-gray-100 flex flex-col pb-12 transition-colors duration-200">
      {/* 1. Header Bar with Tabs, Month Navigator, Excel Storage, Theme */}
      <Header
        activeTab="spending"
        currentDate={currentDate}
        dateRangeLabel={dateRangeLabel}
        isCustomCycle={isCustomCycle}
        onOpenStartingDayModal={() => setIsStartingDayModalOpen(true)}
        excelStorageState={excelState}
        onOpenExcelModal={() => setIsExcelModalOpen(true)}
        onExportExcel={handleExportExcel}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        user={user}
        syncStatus={syncStatus}
        onLogin={(u) => {
          setUser(u);
          saveUserSession(u);
          setCategories(loadSpendingCategories(u.id));
          setTransactions(loadSpendingTransactions(u.id));
          setBudgetConfig(loadSpendingBudget(u.id));
        }}
        onLogout={() => {
          setUser(null);
          saveUserSession(null);
          setCategories(loadSpendingCategories(undefined));
          setTransactions(loadSpendingTransactions(undefined));
          setBudgetConfig(loadSpendingBudget(undefined));
        }}
        onPrevMonth={handlePrevDate}
        onNextMonth={handleNextDate}
        onGoToToday={handleGoToToday}
        onOpenAddHabit={() => setIsAddCategoryModalOpen(true)}
        onResetData={handleResetData}
        onExportData={handleExportData}
        onImportData={handleImportData}
      />

      <main className="max-w-[1700px] w-full mx-auto px-2 sm:px-6 pt-4 sm:pt-6 flex-1 space-y-4 sm:space-y-6">
        {/* 2. Top Spending KPI Summary Cards */}
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

        {/* 3. Daily Spending Bar Chart & Category Breakdown */}
        <SpendingCharts
          dailyData={dailyChartData}
          categories={categories}
          transactions={transactions}
          theme={theme}
          currency={displayCurrency}
          exchangeRate={budgetConfig.exchangeRate || 4000}
        />

        {/* 4. Middle Daily Spending Grid Table */}
        <SpendingGrid
          categories={categories}
          days={days}
          transactions={transactions}
          onOpenEntryModal={(category, day) => setEntryModalTarget({ category, day })}
          onEditCategory={(category) => setEditingCategory(category)}
          onDeleteCategory={handleDeleteCategory}
          onMoveCategory={handleMoveCategory}
          onReorderCategories={handleReorderCategories}
          currency={displayCurrency}
          exchangeRate={budgetConfig.exchangeRate || 4000}
        />
      </main>

      {/* Entry Modal for cell */}
      <SpendingEntryModal
        isOpen={!!entryModalTarget}
        onClose={() => setEntryModalTarget(null)}
        category={entryModalTarget?.category || null}
        day={entryModalTarget?.day || null}
        transactions={transactions}
        onAddTransaction={handleAddTransaction}
        onDeleteTransaction={handleDeleteTransaction}
        exchangeRate={budgetConfig.exchangeRate || 4000}
      />

      {/* Add Category Modal */}
      <AddSpendingCategoryModal
        isOpen={isAddCategoryModalOpen}
        onClose={() => setIsAddCategoryModalOpen(false)}
        onAddCategory={handleAddCategory}
      />

      {/* Edit Category Modal */}
      <EditSpendingCategoryModal
        category={editingCategory}
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
        onClearCategoryLogs={handleClearCategoryLogs}
      />

      {/* Monthly Budget Settings Modal */}
      <BudgetSettingsModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        config={budgetConfig}
        onSaveConfig={(newConfig) => setBudgetConfig(newConfig)}
      />

      {/* Starting Day & Cycle Configuration Modal */}
      <StartingDayModal
        isOpen={isStartingDayModalOpen}
        onClose={() => setIsStartingDayModalOpen(false)}
        cycleConfig={cycleConfig}
        onSaveCycleConfig={handleSaveCycleConfig}
        currentDate={currentDate}
      />

      {/* Excel Connection Modal for Daily Spending */}
      <SpendingExcelModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onConnected={(fileName, fileHandle) => {
          setExcelState({
            isConnected: true,
            fileName,
            fileHandle,
            lastSyncedAt: new Date().toLocaleTimeString(),
            isSyncing: false,
          });
        }}
        categories={categories}
        transactions={transactions}
        days={days}
        dateRangeLabel={dateRangeLabel}
        budgetConfig={budgetConfig}
        cycleConfig={cycleConfig}
        onImportData={handleImportFromExcel}
        canDismiss={true}
      />
    </div>
  );
}
