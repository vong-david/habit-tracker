"use client";

import React, { useMemo } from "react";
import { Trade, DayTradesSummary } from "@/types/trading";
import { formatPnl } from "@/lib/tradingStorage";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { KHMER_MONTH_NAMES, toKhmerNum } from "@/lib/dateUtils";

interface TradingCalendarProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectYear: (year: number) => void;
  onSelectDay: (summary: DayTradesSummary) => void;
  trades: Trade[];
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const ENGLISH_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const TradingCalendar: React.FC<TradingCalendarProps> = ({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onSelectYear,
  onSelectDay,
  trades,
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Map trades by date: [YYYY-MM-DD] -> Trade[]
  const tradesByDate = useMemo(() => {
    const map = new Map<string, Trade[]>();
    trades.forEach((trade) => {
      const existing = map.get(trade.dateString) || [];
      existing.push(trade);
      map.set(trade.dateString, existing);
    });
    return map;
  }, [trades]);

  // Generate 7-column calendar grid (Mon..Sun)
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const daysInMonth = lastDay.getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // In JS: 0 = Sun, 1 = Mon ... 6 = Sat
    // Convert to 0 = Mon, 6 = Sun
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const cells: DayTradesSummary[] = [];

    // 1. Padding days from previous month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const dateString = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      const dayTrades = tradesByDate.get(dateString) || [];
      const totalPnl = dayTrades.reduce((acc, curr) => acc + curr.pnl, 0);

      cells.push({
        dateString,
        dayNumber: dayNum,
        dayOfWeek: WEEKDAYS[(startDayOfWeek - 1 - i) % 7],
        isCurrentMonth: false,
        totalPnl,
        tradesCount: dayTrades.length,
        winningCount: dayTrades.filter((t) => t.pnl > 0).length,
        losingCount: dayTrades.filter((t) => t.pnl < 0).length,
        trades: dayTrades,
      });
    }

    // 2. Days of current month
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const currDate = new Date(year, month, dayNum);
      const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      const dayTrades = tradesByDate.get(dateString) || [];
      const totalPnl = dayTrades.reduce((acc, curr) => acc + curr.pnl, 0);
      const dayOfWeekIdx = (startDayOfWeek + dayNum - 1) % 7;

      cells.push({
        dateString,
        dayNumber: dayNum,
        dayOfWeek: WEEKDAYS[dayOfWeekIdx],
        isCurrentMonth: true,
        totalPnl,
        tradesCount: dayTrades.length,
        winningCount: dayTrades.filter((t) => t.pnl > 0).length,
        losingCount: dayTrades.filter((t) => t.pnl < 0).length,
        trades: dayTrades,
      });
    }

    // 3. Padding days for next month to complete the grid (up to 35 or 42 cells)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      const dateString = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      const dayTrades = tradesByDate.get(dateString) || [];
      const totalPnl = dayTrades.reduce((acc, curr) => acc + curr.pnl, 0);

      cells.push({
        dateString,
        dayNumber: i,
        dayOfWeek: WEEKDAYS[(cells.length) % 7],
        isCurrentMonth: false,
        totalPnl,
        tradesCount: dayTrades.length,
        winningCount: dayTrades.filter((t) => t.pnl > 0).length,
        losingCount: dayTrades.filter((t) => t.pnl < 0).length,
        trades: dayTrades,
      });
    }

    return cells;
  }, [year, month, tradesByDate]);

  const yearOptions = [year - 2, year - 1, year, year + 1];

  return (
    <div className="bg-white dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-3xl p-4 sm:p-7 shadow-sm transition-colors">
      {/* Top Header Section (Matching user's requested calendar layout) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>ប្រតិទិនជួញដូរ (Calendar)</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            មើលភ្លាមដឹងភ្លាមថាតើថ្ងៃណាដែលអ្នកចំណេញ ឬខាតបង់។ ចុចលើថ្ងៃណាមួយដើម្បីមើលព័ត៌មាន Trade លម្អិត។
          </p>
        </div>

        {/* Year Pills Selector */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#181a24] p-1 rounded-2xl border border-gray-200 dark:border-gray-800 text-xs self-start sm:self-center">
          {yearOptions.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => onSelectYear(y)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                y === year
                  ? "bg-white dark:bg-[#252836] text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Month Navigator Bar (< February >) */}
      <div className="flex items-center justify-center gap-3 my-5">
        <button
          type="button"
          onClick={onPrevMonth}
          className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
          title="ខែមុន"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-50 dark:bg-[#181a24] border border-gray-200 dark:border-gray-800 rounded-2xl">
          <CalendarIcon className="w-4 h-4 text-emerald-500" />
          <span className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white min-w-[130px] text-center">
            {ENGLISH_MONTHS[month]} {year}
          </span>
          <span className="text-xs text-gray-400 hidden sm:inline">
            ({KHMER_MONTH_NAMES[month]})
          </span>
        </div>

        <button
          type="button"
          onClick={onNextMonth}
          className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
          title="ខែបន្ទាប់"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 7 Columns Header (Mon, Tue, Wed, Thu, Fri, Sat, Sun) */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 text-center text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-1 uppercase tracking-wider text-[11px] sm:text-xs">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid Cells */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
        {calendarDays.map((cell) => {
          const hasTrades = cell.tradesCount > 0;
          const isGreen = hasTrades && cell.totalPnl > 0;
          const isRed = hasTrades && cell.totalPnl < 0;
          const isBreakeven = hasTrades && cell.totalPnl === 0;

          return (
            <div
              key={cell.dateString}
              onClick={() => onSelectDay(cell)}
              className={`min-h-[75px] sm:min-h-[115px] p-2 sm:p-2.5 rounded-2xl border transition-all duration-150 cursor-pointer flex flex-col justify-between text-left select-none group relative ${
                !cell.isCurrentMonth
                  ? "opacity-25 bg-gray-50 dark:bg-[#151722]/40 border-gray-100 dark:border-gray-800/40 hover:opacity-80"
                  : isGreen
                  ? "bg-[#22c55e] dark:bg-[#16a34a] border-emerald-500 text-white shadow-sm hover:brightness-105 active:scale-95 ring-1 ring-emerald-400/30"
                  : isRed
                  ? "bg-[#ef4444] dark:bg-[#dc2626] border-red-500 text-white shadow-sm hover:brightness-105 active:scale-95 ring-1 ring-red-400/30"
                  : isBreakeven
                  ? "bg-gray-400 dark:bg-gray-600 border-gray-400 text-white shadow-sm hover:brightness-105 active:scale-95"
                  : "bg-white dark:bg-[#161824] border-gray-200 dark:border-gray-800/80 hover:border-emerald-500/50 hover:bg-gray-50 dark:hover:bg-[#1c1f2e]"
              }`}
            >
              {/* Day Number */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs sm:text-sm font-extrabold ${
                    hasTrades ? "text-white" : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {cell.dayNumber}
                </span>

                {hasTrades && (
                  <span className="text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-md bg-black/25 text-white/90 font-medium">
                    {cell.tradesCount} {cell.tradesCount === 1 ? "trade" : "trades"}
                  </span>
                )}
              </div>

              {/* P&L Display in Center / Bottom */}
              <div className="my-auto py-1 text-center">
                <div
                  className={`text-xs sm:text-base font-black tracking-tight truncate ${
                    hasTrades ? "text-white drop-shadow-xs" : "text-gray-400 dark:text-gray-600"
                  }`}
                >
                  {hasTrades ? formatPnl(cell.totalPnl) : "$0.00"}
                </div>

                {!hasTrades && (
                  <div className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-600 font-medium">
                    0 trades
                  </div>
                )}
              </div>

              {/* Hover indicator for more details */}
              <div
                className={`text-[9px] text-center opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block ${
                  hasTrades ? "text-white/80" : "text-emerald-500 font-semibold"
                }`}
              >
                {hasTrades ? "ចុចមើល Trade" : "+ ចុចថែម Trade"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
