"use client";

import React, { useState, useMemo } from "react";
import { SpendingCategory, SpendingTransaction, Currency } from "@/types/spending";
import { DayInfo } from "@/types/habit";
import {
  Pencil,
  Trash2,
  Plus,
  GripVertical,
  ChevronUp,
  ChevronDown,
  DollarSign,
  TrendingDown,
} from "lucide-react";
import { formatCurrency, formatUsd, formatKhr } from "@/lib/spendingStorage";

interface SpendingGridProps {
  categories: SpendingCategory[];
  days: DayInfo[];
  transactions: SpendingTransaction[];
  onOpenEntryModal: (category: SpendingCategory, day: DayInfo) => void;
  onEditCategory: (category: SpendingCategory) => void;
  onDeleteCategory: (categoryId: string) => void;
  onMoveCategory: (categoryId: string, direction: "up" | "down") => void;
  onReorderCategories: (newCategories: SpendingCategory[]) => void;
  currency: Currency;
  exchangeRate: number;
}

export const SpendingGrid: React.FC<SpendingGridProps> = ({
  categories,
  days,
  transactions,
  onOpenEntryModal,
  onEditCategory,
  onDeleteCategory,
  onMoveCategory,
  onReorderCategories,
  currency,
  exchangeRate,
}) => {
  // Drag and drop state
  const [draggedCategoryId, setDraggedCategoryId] = useState<string | null>(null);
  const [dragOverCategoryId, setDragOverCategoryId] = useState<string | null>(null);

  // Lookup map: [categoryId_dateString] -> { totalUsd: number, count: number, hasNote: boolean, notes: string[] }
  const cellDataMap = useMemo(() => {
    const map = new Map<
      string,
      { totalUsd: number; count: number; hasNote: boolean; notes: string[] }
    >();

    transactions.forEach((tx) => {
      const key = `${tx.categoryId}_${tx.dateString}`;
      const existing = map.get(key) || { totalUsd: 0, count: 0, hasNote: false, notes: [] };
      existing.totalUsd += tx.amount;
      existing.count += 1;
      if (tx.note) {
        existing.hasNote = true;
        existing.notes.push(tx.note);
      }
      map.set(key, existing);
    });

    return map;
  }, [transactions]);

  // Compute category totals
  const categoryTotals = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach((tx) => {
      map.set(tx.categoryId, (map.get(tx.categoryId) || 0) + tx.amount);
    });
    return map;
  }, [transactions]);

  // Compute grand total
  const grandTotalUsd = useMemo(() => {
    return transactions.reduce((acc, curr) => acc + curr.amount, 0);
  }, [transactions]);

  // Compute daily totals (column totals)
  const dailyTotals = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach((tx) => {
      map.set(tx.dateString, (map.get(tx.dateString) || 0) + tx.amount);
    });
    return map;
  }, [transactions]);

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedCategoryId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedCategoryId && draggedCategoryId !== id) {
      setDragOverCategoryId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedCategoryId || draggedCategoryId === targetId) {
      setDraggedCategoryId(null);
      setDragOverCategoryId(null);
      return;
    }

    const currentIndex = categories.findIndex((c) => c.id === draggedCategoryId);
    const targetIndex = categories.findIndex((c) => c.id === targetId);

    if (currentIndex !== -1 && targetIndex !== -1) {
      const reordered = [...categories];
      const [removed] = reordered.splice(currentIndex, 1);
      reordered.splice(targetIndex, 0, removed);
      onReorderCategories(reordered);
    }

    setDraggedCategoryId(null);
    setDragOverCategoryId(null);
  };

  const handleDragEnd = () => {
    setDraggedCategoryId(null);
    setDragOverCategoryId(null);
  };

  return (
    <div className="bg-white dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm dark:shadow-xl overflow-hidden transition-colors">
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-800">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            {/* 1. Header: Day of week */}
            <tr className="bg-gray-100/60 dark:bg-[#141620] text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800 text-[11px]">
              <th className="sticky left-0 z-20 bg-gray-100/90 dark:bg-[#141620]/95 backdrop-blur px-3 sm:px-4 py-1.5 text-left font-medium border-r border-gray-200 dark:border-gray-800 shadow-[2px_0_5px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_5px_rgba(0,0,0,0.3)] min-w-[210px] sm:min-w-[250px]">
                ប្រភេទចំណាយ ({categories.length})
              </th>

              {days.map((day) => {
                const isWeekend = day.dayOfWeek === "អា" || day.dayOfWeek === "ស";
                return (
                  <th
                    key={`dow-${day.dateString}`}
                    className={`px-1 py-1 text-center font-semibold border-r border-gray-200 dark:border-gray-800/80 min-w-[50px] sm:min-w-[58px] ${
                      day.isToday
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                        : isWeekend
                        ? "text-gray-400 dark:text-gray-500"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {day.dayOfWeek}
                  </th>
                );
              })}

              <th className="px-2 py-1 text-center font-bold border-gray-200 dark:border-gray-800 text-[11px] min-w-[70px]">
                សរុប ({currency})
              </th>
            </tr>

            {/* 2. Sub-Header: Day number */}
            <tr className="bg-gray-200/50 dark:bg-[#10121a] text-gray-700 dark:text-gray-300 border-b-2 border-gray-300 dark:border-gray-700 text-xs">
              <th className="sticky left-0 z-20 bg-gray-200/90 dark:bg-[#10121a]/95 backdrop-blur px-3 sm:px-4 py-1.5 text-left font-semibold border-r border-gray-200 dark:border-gray-800 shadow-[2px_0_5px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_5px_rgba(0,0,0,0.3)] text-gray-600 dark:text-gray-400 text-[11px]">
                ថ្ងៃទី
              </th>

              {days.map((day) => (
                <th
                  key={`num-${day.dateString}`}
                  className={`px-1 py-1 text-center font-bold border-r border-gray-200 dark:border-gray-800 min-w-[50px] sm:min-w-[58px] ${
                    day.isToday
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black"
                      : "text-gray-800 dark:text-gray-300"
                  }`}
                >
                  {day.dayNumber}
                </th>
              ))}

              <th className="px-2 py-1 text-center font-bold text-gray-600 dark:text-gray-400 text-[10px]">
                ចំណែក %
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 dark:divide-gray-800/80">
            {categories.map((cat, index) => {
              const catTotal = categoryTotals.get(cat.id) || 0;
              const catPercentage =
                grandTotalUsd > 0 ? Math.round((catTotal / grandTotalUsd) * 100) : 0;
              const isOverBudget = cat.budget && catTotal > cat.budget;

              return (
                <tr
                  key={cat.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, cat.id)}
                  onDragOver={(e) => handleDragOver(e, cat.id)}
                  onDrop={(e) => handleDrop(e, cat.id)}
                  onDragEnd={handleDragEnd}
                  className={`group transition-all duration-150 ${
                    draggedCategoryId === cat.id
                      ? "opacity-30 bg-gray-100 dark:bg-gray-800"
                      : dragOverCategoryId === cat.id
                      ? "border-t-2 border-emerald-500 bg-emerald-500/5"
                      : "hover:bg-gray-50/80 dark:hover:bg-[#161824]/60"
                  }`}
                >
                  {/* Sticky Category Info Cell */}
                  <td className="sticky left-0 z-10 bg-white/95 dark:bg-[#12141c]/95 backdrop-blur px-3 sm:px-4 py-2 border-r border-gray-200 dark:border-gray-800 shadow-[2px_0_5px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Drag Handle */}
                        <div
                          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 shrink-0 p-0.5 rounded opacity-40 group-hover:opacity-100 transition-opacity"
                          title="អូសដើម្បីតម្រៀបលំដាប់ (Drag & drop to reorder)"
                        >
                          <GripVertical className="w-3.5 h-3.5" />
                        </div>

                        {/* Icon */}
                        <span
                          className="text-base sm:text-lg shrink-0 p-1 rounded-lg"
                          style={{
                            backgroundColor: `${cat.color || "#8b5cf6"}15`,
                          }}
                        >
                          {cat.icon || "🏷️"}
                        </span>

                        {/* Name & Budget */}
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 dark:text-gray-100 truncate text-xs sm:text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {cat.name}
                          </p>
                          <span className="text-[10px] text-gray-400 block">
                            {cat.budget ? (
                              <span
                                className={isOverBudget ? "text-red-500 font-semibold" : ""}
                              >
                                ថវិកា៖ ${cat.budget}
                              </span>
                            ) : (
                              "គ្មានថវិកាកំណត់"
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Actions (Move, Edit, Delete) */}
                      <div className="flex items-center gap-0.5 shrink-0 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        {/* Up/Down buttons */}
                        <div className="hidden sm:flex flex-col">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => onMoveCategory(cat.id, "up")}
                            className="p-0.5 text-gray-400 hover:text-emerald-500 disabled:opacity-20"
                            title="ឡើងលើ"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={index === categories.length - 1}
                            onClick={() => onMoveCategory(cat.id, "down")}
                            className="p-0.5 text-gray-400 hover:text-emerald-500 disabled:opacity-20"
                            title="ចុះក្រោម"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => onEditCategory(cat)}
                          className="p-1 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title="កែប្រែប្រភេទចំណាយ"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => onDeleteCategory(cat.id)}
                          className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          title="លុបប្រភេទចំណាយ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* Day Cells */}
                  {days.map((day) => {
                    const key = `${cat.id}_${day.dateString}`;
                    const cell = cellDataMap.get(key);
                    const hasSpent = cell && cell.totalUsd > 0;

                    return (
                      <td
                        key={key}
                        onClick={() => onOpenEntryModal(cat, day)}
                        title={
                          hasSpent
                            ? `${day.dayOfWeek} ទី ${day.dayNumber}: ${formatCurrency(
                                cell.totalUsd,
                                currency,
                                exchangeRate
                              )}${cell.hasNote ? `\nកំណត់ចំណាំ: ${cell.notes.join(", ")}` : ""}`
                            : "ចុចដើម្បីបន្ថែមការចំណាយ"
                        }
                        className={`px-1 py-2 text-center border-r border-gray-200 dark:border-gray-800/80 cursor-pointer select-none transition-all active:scale-95 group/cell relative min-w-[50px] sm:min-w-[58px] ${
                          day.isToday
                            ? "bg-emerald-500/10 hover:bg-emerald-500/20"
                            : "hover:bg-gray-100/70 dark:hover:bg-gray-800/40"
                        }`}
                      >
                        {hasSpent ? (
                          <div className="flex flex-col items-center justify-center">
                            <span className="font-extrabold text-[11px] sm:text-xs text-gray-900 dark:text-white px-1.5 py-0.5 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shadow-xs">
                              {currency === "USD"
                                ? `$${cell.totalUsd.toFixed(cell.totalUsd % 1 === 0 ? 0 : 2)}`
                                : `${Math.round((cell.totalUsd * exchangeRate) / 1000)}k`}
                            </span>

                            {/* Indicator for note or multiple entries */}
                            {cell.hasNote && (
                              <span
                                className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"
                                title={cell.notes.join(", ")}
                              />
                            )}
                          </div>
                        ) : (
                          <div className="h-6 flex items-center justify-center text-gray-300 dark:text-gray-700 opacity-0 group-hover/cell:opacity-100 transition-opacity">
                            <Plus className="w-3.5 h-3.5 text-gray-400 hover:text-emerald-500" />
                          </div>
                        )}
                      </td>
                    );
                  })}

                  {/* Row Total (Category Total) */}
                  <td className="px-2 py-2 text-center font-black text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-800 text-[11px] sm:text-xs">
                    {formatCurrency(catTotal, currency, exchangeRate)}
                  </td>

                  {/* Percentage */}
                  <td className="px-2 py-2 text-center font-bold text-gray-500 dark:text-gray-400 text-[11px]">
                    {catPercentage}%
                  </td>
                </tr>
              );
            })}

            {/* Bottom Row: Daily Total Row */}
            <tr className="bg-gray-100/80 dark:bg-[#151824] font-black border-t-2 border-gray-300 dark:border-gray-700">
              <td className="sticky left-0 z-10 bg-gray-100 dark:bg-[#151824] px-3 sm:px-4 py-2.5 text-left border-r border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white text-xs sm:text-sm flex items-center gap-2 shadow-[2px_0_5px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                <TrendingDown className="w-4 h-4 text-emerald-500" />
                <span>សរុបប្រចាំថ្ងៃ (Daily Total)</span>
              </td>

              {days.map((day) => {
                const dayTotal = dailyTotals.get(day.dateString) || 0;
                return (
                  <td
                    key={`total-${day.dateString}`}
                    className={`px-1 py-2 text-center border-r border-gray-200 dark:border-gray-800 text-[10px] sm:text-[11px] ${
                      day.isToday
                        ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-black"
                        : dayTotal > 0
                        ? "text-gray-900 dark:text-white font-bold"
                        : "text-gray-400 dark:text-gray-600 font-normal"
                    }`}
                  >
                    {dayTotal > 0
                      ? currency === "USD"
                        ? `$${dayTotal.toFixed(dayTotal % 1 === 0 ? 0 : 2)}`
                        : `${Math.round((dayTotal * exchangeRate) / 1000)}k`
                      : "-"}
                  </td>
                );
              })}

              <td className="px-2 py-2 text-center font-black text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm border-r border-gray-200 dark:border-gray-800">
                {formatCurrency(grandTotalUsd, currency, exchangeRate)}
              </td>

              <td className="px-2 py-2 text-center font-bold text-gray-500 dark:text-gray-400 text-[10px]">
                100%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
