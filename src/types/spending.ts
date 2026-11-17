export type Currency = "USD" | "KHR";

export interface SpendingCategory {
  id: string;
  name: string;
  icon: string;
  color?: string;
  budget?: number; // Optional monthly budget in USD
  createdAt: string;
}

export type PaymentMethod = "cash" | "aba" | "card" | "other";

export interface SpendingTransaction {
  id: string;
  categoryId: string;
  dateString: string; // "YYYY-MM-DD"
  amount: number; // Normalized amount in USD for consistency
  rawAmount: number; // Raw entered amount
  currency: Currency;
  note?: string;
  paymentMethod: PaymentMethod;
  createdAt: string;
}

export interface SpendingBudgetConfig {
  monthlyBudget: number; // in USD
  currency: Currency;
  exchangeRate: number; // e.g. 4100 KHR per 1 USD
}

export interface SpendingDayTotal {
  dateString: string;
  totalUsd: number;
  totalKhr: number;
  transactionsCount: number;
}

export interface CategorySummary {
  category: SpendingCategory;
  totalUsd: number;
  percentage: number;
  transactionsCount: number;
}
