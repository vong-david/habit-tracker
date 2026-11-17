import {
  SpendingCategory,
  SpendingTransaction,
  SpendingBudgetConfig,
  Currency,
} from "@/types/spending";

export const DEFAULT_EXCHANGE_RATE = 4000; // 1 USD = 4,000 KHR

export const DEFAULT_SPENDING_CATEGORIES: SpendingCategory[] = [
  {
    id: "cat_food",
    name: "អាហារ & ភេសជ្ជៈ",
    icon: "🍱",
    color: "#f97316",
    budget: 120,
    createdAt: new Date().toISOString(),
  },
  {
    id: "cat_coffee",
    name: "កាហ្វេ & អាហារសម្រន់",
    icon: "☕",
    color: "#84cc16",
    budget: 35,
    createdAt: new Date().toISOString(),
  },
  {
    id: "cat_transport",
    name: "ធ្វើដំណើរ & សាំង",
    icon: "🚗",
    color: "#06b6d4",
    budget: 40,
    createdAt: new Date().toISOString(),
  },
  {
    id: "cat_market",
    name: "ផ្សារ & សម្ភារៈប្រើប្រាស់",
    icon: "🛒",
    color: "#a855f7",
    budget: 50,
    createdAt: new Date().toISOString(),
  },
  {
    id: "cat_bills",
    name: "វិក្កយបត្រ & បន្ទប់",
    icon: "💡",
    color: "#ef4444",
    budget: 60,
    createdAt: new Date().toISOString(),
  },
  {
    id: "cat_entertainment",
    name: "ការកម្សាន្ត & ជួបជុំ",
    icon: "🍿",
    color: "#ec4899",
    budget: 30,
    createdAt: new Date().toISOString(),
  },
  {
    id: "cat_phone",
    name: "ទូរស័ព្ទ & អ៊ីនធឺណិត",
    icon: "📱",
    color: "#3b82f6",
    budget: 15,
    createdAt: new Date().toISOString(),
  },
  {
    id: "cat_health",
    name: "សុខភាព & ថ្នាំពេទ្យ",
    icon: "💊",
    color: "#10b981",
    budget: 20,
    createdAt: new Date().toISOString(),
  },
  {
    id: "cat_other",
    name: "ចំណាយផ្សេងៗ",
    icon: "🏷️",
    color: "#6b7280",
    budget: 30,
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_BUDGET_CONFIG: SpendingBudgetConfig = {
  monthlyBudget: 400,
  currency: "USD",
  exchangeRate: DEFAULT_EXCHANGE_RATE,
};

const CATEGORIES_KEY = "habit_tracker_spending_categories_v1";
const TRANSACTIONS_KEY = "habit_tracker_spending_transactions_v1";
const BUDGET_KEY = "habit_tracker_spending_budget_v1";

function getScopedKey(baseKey: string, userId?: string): string {
  return `${baseKey}_${userId || "guest"}`;
}

export function loadSpendingCategories(userId?: string): SpendingCategory[] {
  if (typeof window === "undefined") return DEFAULT_SPENDING_CATEGORIES;
  try {
    const raw = localStorage.getItem(getScopedKey(CATEGORIES_KEY, userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Error loading spending categories", e);
  }
  return DEFAULT_SPENDING_CATEGORIES;
}

export function saveSpendingCategories(categories: SpendingCategory[], userId?: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getScopedKey(CATEGORIES_KEY, userId), JSON.stringify(categories));
  } catch (e) {
    console.error("Error saving spending categories", e);
  }
}

export function loadSpendingTransactions(userId?: string): SpendingTransaction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getScopedKey(TRANSACTIONS_KEY, userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Error loading spending transactions", e);
  }
  return [];
}

export function saveSpendingTransactions(transactions: SpendingTransaction[], userId?: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getScopedKey(TRANSACTIONS_KEY, userId), JSON.stringify(transactions));
  } catch (e) {
    console.error("Error saving spending transactions", e);
  }
}

export function loadSpendingBudget(userId?: string): SpendingBudgetConfig {
  if (typeof window === "undefined") return DEFAULT_BUDGET_CONFIG;
  try {
    const raw = localStorage.getItem(getScopedKey(BUDGET_KEY, userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.monthlyBudget === "number") {
        if (!parsed.exchangeRate || parsed.exchangeRate === 4100) {
          parsed.exchangeRate = DEFAULT_EXCHANGE_RATE;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error loading spending budget config", e);
  }
  return DEFAULT_BUDGET_CONFIG;
}

export function saveSpendingBudget(config: SpendingBudgetConfig, userId?: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getScopedKey(BUDGET_KEY, userId), JSON.stringify(config));
  } catch (e) {
    console.error("Error saving spending budget config", e);
  }
}

/**
 * Format currency amount with symbol
 */
export function formatCurrency(
  amountUsd: number,
  currency: Currency = "USD",
  exchangeRate: number = DEFAULT_EXCHANGE_RATE
): string {
  if (currency === "KHR") {
    const khr = Math.round(amountUsd * exchangeRate);
    return `${khr.toLocaleString()} ៛`;
  }
  // USD
  return `$${amountUsd.toFixed(amountUsd % 1 === 0 ? 0 : 2)}`;
}

/**
 * Format USD with 2 decimals
 */
export function formatUsd(amount: number): string {
  return `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format KHR
 */
export function formatKhr(amountKhr: number): string {
  return `${Math.round(amountKhr).toLocaleString()} ៛`;
}
