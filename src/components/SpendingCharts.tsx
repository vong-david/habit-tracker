"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { DayInfo } from "@/types/habit";
import { SpendingCategory, SpendingTransaction, Currency } from "@/types/spending";
import { formatCurrency, formatUsd, formatKhr } from "@/lib/spendingStorage";
import { PieChart as PieIcon, BarChart3, TrendingUp } from "lucide-react";

export interface DailySpendingBarData {
  dayInfo: DayInfo;
  dayLabel: string;
  dayOfWeek: string;
  dayNumber: number;
  dateString: string;
  amountUsd: number;
  transactionsCount: number;
  isToday: boolean;
}

interface SpendingChartsProps {
  dailyData: DailySpendingBarData[];
  categories: SpendingCategory[];
  transactions: SpendingTransaction[];
  theme?: "dark" | "light";
  currency: Currency;
  exchangeRate: number;
}

export const SpendingCharts: React.FC<SpendingChartsProps> = ({
  dailyData,
  categories,
  transactions,
  theme = "dark",
  currency,
  exchangeRate,
}) => {
  const isDark = theme === "dark";

  // Compute category breakdown
  const categoryTotalMap = new Map<string, number>();
  let totalAll = 0;
  transactions.forEach((tx) => {
    categoryTotalMap.set(tx.categoryId, (categoryTotalMap.get(tx.categoryId) || 0) + tx.amount);
    totalAll += tx.amount;
  });

  const categoryBreakdown = categories
    .map((cat) => {
      const total = categoryTotalMap.get(cat.id) || 0;
      const percentage = totalAll > 0 ? Math.round((total / totalAll) * 100) : 0;
      return {
        category: cat,
        total,
        percentage,
      };
    })
    .sort((a, b) => b.total - a.total);

  // Highest spending day
  const maxDayAmount = Math.max(...dailyData.map((d) => d.amountUsd), 10);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Daily Spending Bar Chart (Left 3 columns) */}
      <div className="lg:col-span-3 bg-white dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm transition-colors flex flex-col">
        {/* Header */}
        <div className="bg-gray-50 dark:bg-[#181a24] border-b border-gray-200 dark:border-gray-800 px-3 sm:px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            <h2 className="text-xs sm:text-sm font-bold tracking-wide uppercase text-gray-800 dark:text-gray-200">
              ការចំណាយប្រចាំថ្ងៃ (Daily Spending)
            </h2>
          </div>
          <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
            គិតជា {currency === "USD" ? "ដុល្លារ ($)" : "រៀល (៛)"}
          </span>
        </div>

        {/* Chart Content */}
        <div className="p-2 sm:p-3 pt-3 sm:pt-4 h-48 sm:h-56 w-full flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dailyData}
              margin={{ top: 8, right: 6, left: -16, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={isDark ? "#222634" : "#f1f5f9"}
              />
              <YAxis
                domain={[0, (dataMax: number) => Math.ceil(Math.max(dataMax * 1.15, 20))]}
                tickFormatter={(val) =>
                  currency === "USD" ? `$${val}` : `${Math.round(val * exchangeRate / 1000)}k`
                }
                tick={{ fill: isDark ? "#9ca3af" : "#64748b", fontSize: 9 }}
                axisLine={{ stroke: isDark ? "#2a2f3f" : "#e2e8f0" }}
                tickLine={false}
              />
              <XAxis
                dataKey="dateString"
                interval={0}
                tickLine={false}
                axisLine={{ stroke: isDark ? "#2a2f3f" : "#e2e8f0" }}
                tick={({ x, y, payload }) => {
                  const item = dailyData.find(
                    (d) => d.dateString === payload.value || d.dayInfo.dateString === payload.value
                  );
                  const isToday = item?.dayInfo.isToday;
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text
                        x={0}
                        y={7}
                        dy={4}
                        textAnchor="middle"
                        fill={isToday ? "#10b981" : isDark ? "#9ca3af" : "#64748b"}
                        fontSize={8}
                        fontWeight={isToday ? "bold" : "normal"}
                      >
                        {item?.dayOfWeek}
                      </text>
                      <text
                        x={0}
                        y={17}
                        dy={4}
                        textAnchor="middle"
                        fill={isToday ? "#10b981" : isDark ? "#d1d5db" : "#334155"}
                        fontSize={8}
                        fontWeight={isToday ? "bold" : "500"}
                      >
                        {item?.dayNumber ?? payload.value}
                      </text>
                    </g>
                  );
                }}
                height={34}
              />
              <Tooltip
                cursor={{ fill: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as DailySpendingBarData;
                    const dateTxs = transactions.filter((t) => t.dateString === d.dateString);
                    return (
                      <div className="bg-white dark:bg-[#1a1d28] border border-gray-200 dark:border-gray-700 p-2.5 sm:p-3 rounded-xl shadow-xl text-xs text-gray-900 dark:text-white max-w-[220px]">
                        <div className="font-bold flex items-center justify-between pb-1.5 border-b border-gray-100 dark:border-gray-800">
                          <span>
                            {d.dayOfWeek} ទី {d.dayNumber}
                          </span>
                          <span className="text-emerald-500 font-black">
                            {formatCurrency(d.amountUsd, currency, exchangeRate)}
                          </span>
                        </div>
                        <div className="mt-1.5 space-y-1 max-h-32 overflow-y-auto">
                          {dateTxs.length === 0 ? (
                            <span className="text-gray-400 text-[10px]">គ្មានការចំណាយ</span>
                          ) : (
                            dateTxs.map((tx) => {
                              const c = categories.find((cat) => cat.id === tx.categoryId);
                              return (
                                <div
                                  key={tx.id}
                                  className="flex items-center justify-between text-[11px] gap-2"
                                >
                                  <span className="truncate text-gray-600 dark:text-gray-300">
                                    {c?.icon} {tx.note || c?.name}
                                  </span>
                                  <span className="font-semibold text-gray-900 dark:text-white shrink-0">
                                    {formatCurrency(tx.amount, currency, exchangeRate)}
                                  </span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="amountUsd" radius={[4, 4, 0, 0]} maxBarSize={28}>
                {dailyData.map((entry, index) => {
                  const isMax = entry.amountUsd > 0 && entry.amountUsd === maxDayAmount;
                  return (
                    <Cell
                      key={`bar-cell-${index}`}
                      fill={
                        entry.isToday
                          ? "#10b981"
                          : isMax
                          ? "#f59e0b"
                          : entry.amountUsd > 0
                          ? isDark
                            ? "#3b82f6"
                            : "#2563eb"
                          : isDark
                          ? "#1e2230"
                          : "#f1f5f9"
                      }
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Category Breakdown Card (Right 1 column) */}
      <div className="lg:col-span-1 bg-white dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm transition-colors flex flex-col">
        {/* Header */}
        <div className="bg-gray-50 dark:bg-[#181a24] border-b border-gray-200 dark:border-gray-800 px-3 sm:px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <PieIcon className="w-4 h-4 text-purple-500" />
            <h2 className="text-xs sm:text-sm font-bold tracking-wide uppercase text-gray-800 dark:text-gray-200">
              តាមប្រភេទចំណាយ
            </h2>
          </div>
          <span className="text-[10px] text-gray-400">ភាគរយ %</span>
        </div>

        {/* Content: List of categories with progress meters */}
        <div className="p-3 flex-1 flex flex-col justify-start space-y-2.5 max-h-[260px] overflow-y-auto">
          {categoryBreakdown.length === 0 || totalAll === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-6 text-xs">
              <span>មិនទាន់មានទិន្នន័យចំណាយ</span>
            </div>
          ) : (
            categoryBreakdown.map((item) => (
              <div key={item.category.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm shrink-0">{item.category.icon}</span>
                    <span className="truncate text-gray-700 dark:text-gray-300 font-medium text-[11px] sm:text-xs">
                      {item.category.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-bold text-gray-900 dark:text-white text-[11px] sm:text-xs">
                      {formatCurrency(item.total, currency, exchangeRate)}
                    </span>
                    <span className="text-[10px] font-semibold text-gray-400 w-8 text-right">
                      {item.percentage}%
                    </span>
                  </div>
                </div>

                <div className="w-full bg-gray-100 dark:bg-[#1e2230] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.category.color || "#8b5cf6",
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
