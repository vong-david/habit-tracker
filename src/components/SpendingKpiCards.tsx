"use client";

import React from "react";
import {
  Wallet,
  Calendar,
  TrendingUp,
  Target,
  Sparkles,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  Settings,
} from "lucide-react";
import { SpendingBudgetConfig, Currency } from "@/types/spending";
import { formatCurrency, formatUsd, formatKhr } from "@/lib/spendingStorage";
import { toKhmerNum } from "@/lib/dateUtils";

interface SpendingKpiCardsProps {
  totalSpentUsd: number;
  todaySpentUsd: number;
  dailyAverageUsd: number;
  budgetConfig: SpendingBudgetConfig;
  daysCount: number;
  onOpenBudgetModal: () => void;
  currency: Currency;
  onToggleCurrency: () => void;
}

export const SpendingKpiCards: React.FC<SpendingKpiCardsProps> = ({
  totalSpentUsd,
  todaySpentUsd,
  dailyAverageUsd,
  budgetConfig,
  daysCount,
  onOpenBudgetModal,
  currency,
  onToggleCurrency,
}) => {
  const monthlyBudget = budgetConfig.monthlyBudget || 400;
  const exchangeRate = budgetConfig.exchangeRate || 4100;
  const budgetPercentage = monthlyBudget > 0 ? Math.round((totalSpentUsd / monthlyBudget) * 100) : 0;
  const remainingUsd = Math.max(0, monthlyBudget - totalSpentUsd);
  const isOverBudget = totalSpentUsd > monthlyBudget;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {/* 1. Total Spent Card */}
      <div className="bg-white dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-2xl p-3 sm:p-4 shadow-sm relative overflow-hidden transition-all hover:border-emerald-500/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400">
            ចំណាយសរុប (Total Spent)
          </span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            {formatCurrency(totalSpentUsd, currency, exchangeRate)}
          </span>
          {currency === "USD" ? (
            <span className="text-[10px] sm:text-xs text-gray-400 font-medium">
              ≈ {formatKhr(totalSpentUsd * exchangeRate)}
            </span>
          ) : (
            <span className="text-[10px] sm:text-xs text-gray-400 font-medium">
              ≈ {formatUsd(totalSpentUsd)}
            </span>
          )}
        </div>

        <div className="mt-2 text-[10px] sm:text-[11px] text-gray-400 flex items-center justify-between">
          <span>ក្នុងចន្លោះពេលនេះ ({toKhmerNum(daysCount)} ថ្ងៃ)</span>
          <button
            onClick={onToggleCurrency}
            className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
            title="ប្តូររូបិយប័ណ្ណបង្ហាញ ($ / ៛)"
          >
            ប្តូរជារូបិយប័ណ្ណ {currency === "USD" ? "៛ (KHR)" : "$ (USD)"}
          </button>
        </div>
      </div>

      {/* 2. Today's Spending Card */}
      <div className="bg-white dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-2xl p-3 sm:p-4 shadow-sm relative overflow-hidden transition-all hover:border-cyan-500/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400">
            ចំណាយថ្ងៃនេះ (Spent Today)
          </span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            {formatCurrency(todaySpentUsd, currency, exchangeRate)}
          </span>
          <span className="text-[10px] sm:text-xs text-gray-400 font-medium">
            {currency === "USD"
              ? `≈ ${formatKhr(todaySpentUsd * exchangeRate)}`
              : `≈ ${formatUsd(todaySpentUsd)}`}
          </span>
        </div>

        <div className="mt-2 text-[10px] sm:text-[11px] text-gray-400">
          <span>កត់ត្រាថ្ងៃនេះ</span>
        </div>
      </div>

      {/* 3. Daily Average Card */}
      <div className="bg-white dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-2xl p-3 sm:p-4 shadow-sm relative overflow-hidden transition-all hover:border-purple-500/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400">
            មធ្យមប្រចាំថ្ងៃ (Daily Avg)
          </span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            {formatCurrency(dailyAverageUsd, currency, exchangeRate)}
          </span>
          <span className="text-[10px] sm:text-xs text-gray-400">/ ថ្ងៃ</span>
        </div>

        <div className="mt-2 text-[10px] sm:text-[11px] text-gray-400">
          <span>ជាមធ្យមក្នុងមួយថ្ងៃ</span>
        </div>
      </div>

      {/* 4. Monthly Budget Progress Card */}
      <div className="bg-white dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-2xl p-3 sm:p-4 shadow-sm relative overflow-hidden transition-all hover:border-amber-500/40">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400">
              ថវិកាកំណត់ (Budget)
            </span>
            <button
              onClick={onOpenBudgetModal}
              className="p-0.5 text-gray-400 hover:text-emerald-500 transition-colors"
              title="កំណត់ថវិកាប្រចាំខែ"
            >
              <Settings className="w-3 h-3" />
            </button>
          </div>

          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center ${
              isOverBudget
                ? "bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400"
                : budgetPercentage >= 85
                ? "bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400"
                : "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            <Target className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline justify-between">
          <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            {budgetPercentage}%
          </span>
          <span className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400">
            {formatCurrency(totalSpentUsd, currency, exchangeRate)} / {formatCurrency(monthlyBudget, currency, exchangeRate)}
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div className="mt-2.5 w-full bg-gray-100 dark:bg-[#1e2230] h-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isOverBudget
                ? "bg-red-500"
                : budgetPercentage >= 85
                ? "bg-amber-500"
                : "bg-emerald-500"
            }`}
            style={{ width: `${Math.min(100, budgetPercentage)}%` }}
          />
        </div>

        <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-400">
          <span>
            {isOverBudget ? (
              <span className="text-red-500 font-semibold">លើសថវិកា!</span>
            ) : (
              <span>នៅសល់៖ {formatCurrency(remainingUsd, currency, exchangeRate)}</span>
            )}
          </span>
          <span
            onClick={onOpenBudgetModal}
            className="cursor-pointer hover:text-emerald-500 transition-colors"
          >
            កែប្រែថវិកា
          </span>
        </div>
      </div>
    </div>
  );
};
