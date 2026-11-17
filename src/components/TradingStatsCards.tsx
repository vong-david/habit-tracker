"use client";

import React from "react";
import { TradingStats } from "@/types/trading";
import { formatPnl } from "@/lib/tradingStorage";
import {
  TrendingUp,
  TrendingDown,
  Target,
  BarChart2,
  Calendar,
  Sparkles,
  Award,
} from "lucide-react";

interface TradingStatsCardsProps {
  stats: TradingStats;
  monthStats?: TradingStats;
}

export const TradingStatsCards: React.FC<TradingStatsCardsProps> = ({ stats, monthStats }) => {
  const isNetPositive = stats.netPnl > 0;
  const isNetNegative = stats.netPnl < 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {/* 1. Net P&L Card */}
      <div className="bg-white dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-2xl p-3.5 sm:p-4 shadow-sm relative overflow-hidden transition-all hover:border-emerald-500/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400">
            ចំណេញ/ខាតសរុប (Net P&L)
          </span>
          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center ${
              isNetPositive
                ? "bg-emerald-500/10 text-emerald-500"
                : isNetNegative
                ? "bg-red-500/10 text-red-500"
                : "bg-gray-100 dark:bg-gray-800 text-gray-400"
            }`}
          >
            {isNetPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : isNetNegative ? (
              <TrendingDown className="w-4 h-4" />
            ) : (
              <BarChart2 className="w-4 h-4" />
            )}
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span
            className={`text-xl sm:text-2xl font-black tracking-tight ${
              isNetPositive
                ? "text-emerald-600 dark:text-emerald-400"
                : isNetNegative
                ? "text-red-600 dark:text-red-400"
                : "text-gray-900 dark:text-white"
            }`}
          >
            {formatPnl(stats.netPnl)}
          </span>
        </div>

        <div className="mt-2 text-[10px] sm:text-[11px] text-gray-400 flex items-center justify-between">
          <span>សរុប {stats.totalTrades} trades</span>
          <span className="font-semibold text-emerald-500">
            Best: +${stats.bestDayPnl.toFixed(2)}
          </span>
        </div>
      </div>

      {/* 2. Win Rate Card */}
      <div className="bg-white dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-2xl p-3.5 sm:p-4 shadow-sm relative overflow-hidden transition-all hover:border-cyan-500/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400">
            អត្រាឈ្នះ (Win Rate)
          </span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            {stats.winRate}%
          </span>
          <span className="text-[10px] sm:text-xs text-gray-400 font-medium">
            ({stats.winningTrades}W - {stats.losingTrades}L)
          </span>
        </div>

        {/* Mini progress bar */}
        <div className="mt-2.5 w-full bg-gray-100 dark:bg-[#1e2230] h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${stats.winRate}%` }}
          />
        </div>

        <div className="mt-1.5 text-[10px] sm:text-[11px] text-gray-400">
          <span>{stats.breakevenTrades} Breakeven (BE)</span>
        </div>
      </div>

      {/* 3. Profit Factor Card */}
      <div className="bg-white dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-2xl p-3.5 sm:p-4 shadow-sm relative overflow-hidden transition-all hover:border-purple-500/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400">
            មេគុណផលចំណេញ (Profit Factor)
          </span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            {stats.profitFactor}
          </span>
          <span className="text-[10px] sm:text-xs text-gray-400 font-medium">
            {stats.profitFactor >= 2 ? "ល្អឥតខ្ចោះ 🌟" : stats.profitFactor >= 1.5 ? "ល្អ 👍" : ""}
          </span>
        </div>

        <div className="mt-2 text-[10px] sm:text-[11px] text-gray-400 flex items-center justify-between">
          <span className="text-emerald-500 font-semibold">Avg Win: +${stats.averageWin}</span>
          <span className="text-red-400 font-semibold">Avg Loss: -${stats.averageLoss}</span>
        </div>
      </div>

      {/* 4. Trading Days Breakdown Card */}
      <div className="bg-white dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-2xl p-3.5 sm:p-4 shadow-sm relative overflow-hidden transition-all hover:border-amber-500/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400">
            ថ្ងៃជួញដូរ (Trading Days)
          </span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            {stats.tradingDaysCount} ថ្ងៃ
          </span>
        </div>

        <div className="mt-2 flex items-center gap-2 text-[11px] font-bold">
          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {stats.greenDaysCount} ថ្ងៃបៃតង
          </span>
          <span className="text-gray-300 dark:text-gray-700">•</span>
          <span className="text-red-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            {stats.redDaysCount} ថ្ងៃក្រហម
          </span>
        </div>
      </div>
    </div>
  );
};
