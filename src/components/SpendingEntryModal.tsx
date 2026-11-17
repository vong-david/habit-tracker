"use client";

import React, { useState, useEffect } from "react";
import {
  SpendingCategory,
  SpendingTransaction,
  PaymentMethod,
  Currency,
} from "@/types/spending";
import { DayInfo } from "@/types/habit";
import {
  X,
  Plus,
  Trash2,
  DollarSign,
  Calendar,
  Sparkles,
  CreditCard,
  Banknote,
  Building2,
  FileText,
  Check,
} from "lucide-react";
import { toKhmerNum, KHMER_MONTH_NAMES } from "@/lib/dateUtils";
import { formatCurrency, formatUsd, formatKhr, DEFAULT_EXCHANGE_RATE } from "@/lib/spendingStorage";

interface SpendingEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: SpendingCategory | null;
  day: DayInfo | null;
  transactions: SpendingTransaction[];
  onAddTransaction: (newTx: Omit<SpendingTransaction, "id" | "createdAt">) => void;
  onDeleteTransaction: (id: string) => void;
  exchangeRate?: number;
}

const QUICK_AMOUNTS_USD = [1, 2, 3, 5, 10, 20, 50];
const QUICK_AMOUNTS_KHR = [2000, 4000, 5000, 10000, 20000, 50000, 100000];

const QUICK_TAGS = [
  "🍱 អាហារថ្ងៃត្រង់",
  "🍲 អាហារពេលល្ងាច",
  "☕ កាហ្វេព្រឹក",
  "🚗 ចាក់សាំង",
  "🛒 ទិញម្ហូប/ផ្សារ",
  "🍿 ញ៉ាំអីក្រៅ",
  "📱 កាតទូរស័ព្ទ",
  "💡 ថ្លៃបន្ទប់/ភ្លើង",
  "💊 ថ្នាំពេទ្យ",
  "✨ ចំណាយចាំបាច់",
];

export const SpendingEntryModal: React.FC<SpendingEntryModalProps> = ({
  isOpen,
  onClose,
  category,
  day,
  transactions,
  onAddTransaction,
  onDeleteTransaction,
  exchangeRate = DEFAULT_EXCHANGE_RATE,
}) => {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [amountStr, setAmountStr] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("aba");
  const [note, setNote] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setAmountStr("");
      setNote("");
    }
  }, [isOpen]);

  if (!isOpen || !category || !day) return null;

  const dateFormatted = `${day.dayOfWeek} ទី ${toKhmerNum(day.dayNumber)} ${
    KHMER_MONTH_NAMES[day.monthIndex]
  } ${toKhmerNum(day.date.getFullYear())}`;

  // Filter transactions for this specific cell
  const cellTransactions = transactions.filter(
    (t) => t.categoryId === category.id && t.dateString === day.dateString
  );
  const cellTotalUsd = cellTransactions.reduce((acc, curr) => acc + curr.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawVal = parseFloat(amountStr);
    if (isNaN(rawVal) || rawVal <= 0) return;

    // Normalize to USD
    const normalizedUsd = currency === "USD" ? rawVal : Number((rawVal / exchangeRate).toFixed(2));

    onAddTransaction({
      categoryId: category.id,
      dateString: day.dateString,
      amount: normalizedUsd,
      rawAmount: rawVal,
      currency,
      note: note.trim() || undefined,
      paymentMethod,
    });

    setAmountStr("");
    setNote("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleSubmit(e);
    }
  };

  const handleAddQuickAmount = (val: number) => {
    const current = parseFloat(amountStr) || 0;
    setAmountStr((current + val).toString());
  };

  const handleAddTag = (tag: string) => {
    setNote((prev) => (prev ? `${prev} | ${tag}` : tag));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#151722] border border-gray-200 dark:border-gray-800 w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto text-left"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="text-2xl sm:text-3xl shrink-0 p-2 rounded-2xl border"
              style={{
                backgroundColor: `${category.color || "#8b5cf6"}15`,
                borderColor: `${category.color || "#8b5cf6"}40`,
              }}
            >
              {category.icon || "🏷️"}
            </span>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">
                {category.name}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-emerald-500" />
                  <span>{dateFormatted}</span>
                </span>
                {cellTotalUsd > 0 && (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                    សរុបថ្ងៃនេះ៖ {formatUsd(cellTotalUsd)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Transactions List (if any recorded today) */}
        {cellTransactions.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
              <span>ការចំណាយដែលបានកត់ត្រា ({cellTransactions.length})</span>
              <span className="text-emerald-500 font-extrabold">{formatUsd(cellTotalUsd)}</span>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {cellTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between bg-white dark:bg-[#1a1c28] p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-xs shadow-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">
                      {tx.paymentMethod === "aba"
                        ? "ABA"
                        : tx.paymentMethod === "cash"
                        ? "សាច់ប្រាក់"
                        : tx.paymentMethod === "card"
                        ? "កាត"
                        : "ផ្សេងៗ"}
                    </span>
                    <span className="truncate text-gray-700 dark:text-gray-300 font-medium">
                      {tx.note || "គ្មានចំណាំ"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div className="font-extrabold text-gray-900 dark:text-white">
                        {tx.currency === "KHR"
                          ? formatKhr(tx.rawAmount)
                          : formatUsd(tx.amount)}
                      </div>
                      {tx.currency === "KHR" && (
                        <div className="text-[10px] text-gray-400">≈ {formatUsd(tx.amount)}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteTransaction(tx.id)}
                      className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                      title="លុបការចំណាយនេះ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form: Add New Transaction */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              បន្ថែមការចំណាយថ្មី (Add Expense)
            </label>

            {/* Currency Selector ($ USD vs ៛ KHR) */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#1a1c28] p-1 rounded-xl border border-gray-200 dark:border-gray-800 text-xs">
              <button
                type="button"
                onClick={() => setCurrency("USD")}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  currency === "USD"
                    ? "bg-emerald-500 text-slate-950 shadow-sm"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                $ ដុល្លារ (USD)
              </button>
              <button
                type="button"
                onClick={() => setCurrency("KHR")}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  currency === "KHR"
                    ? "bg-emerald-500 text-slate-950 shadow-sm"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                ៛ រៀល (KHR)
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 font-bold text-lg">
              {currency === "USD" ? "$" : "៛"}
            </div>
            <input
              type="number"
              step="any"
              min="0"
              autoFocus
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder={currency === "USD" ? "0.00" : "0"}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#12141c] border-2 border-gray-200 dark:border-gray-800 rounded-2xl text-xl font-black text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
            />
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex flex-wrap gap-1.5">
            {(currency === "USD" ? QUICK_AMOUNTS_USD : QUICK_AMOUNTS_KHR).map((amt) => (
              <button
                type="button"
                key={amt}
                onClick={() => handleAddQuickAmount(amt)}
                className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-[#1a1c28] hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-gray-200 dark:border-gray-800 transition-all active:scale-95"
              >
                +{currency === "USD" ? `$${amt}` : `${amt.toLocaleString()}៛`}
              </button>
            ))}
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              វិធីទូទាត់ប្រាក់ (Payment Method)
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("aba")}
                className={`py-2 px-1.5 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === "aba"
                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20"
                    : "bg-gray-50 dark:bg-[#1a1c28] border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-400"
                }`}
              >
                <Building2 className="w-4 h-4 text-emerald-500" />
                <span>ABA / KHQR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`py-2 px-1.5 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === "cash"
                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20"
                    : "bg-gray-50 dark:bg-[#1a1c28] border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-400"
                }`}
              >
                <Banknote className="w-4 h-4 text-amber-500" />
                <span>សាច់ប្រាក់</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`py-2 px-1.5 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === "card"
                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20"
                    : "bg-gray-50 dark:bg-[#1a1c28] border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-400"
                }`}
              >
                <CreditCard className="w-4 h-4 text-cyan-500" />
                <span>កាត (Card)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("other")}
                className={`py-2 px-1.5 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === "other"
                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20"
                    : "bg-gray-50 dark:bg-[#1a1c28] border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-400"
                }`}
              >
                <DollarSign className="w-4 h-4 text-purple-500" />
                <span>ផ្សេងៗ</span>
              </button>
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              កំណត់ចំណាំ / ព័ត៌មានលម្អិត (Note / Description)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ឧ. បាយថ្ងៃត្រង់ ជាមួយក្រុមការងារ, កាហ្វេ Amazon, ចាក់សាំង..."
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Quick Tags */}
          <div>
            <span className="text-[10px] text-gray-400 flex items-center gap-1 mb-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>ស្លាកចំណាំរហ័ស (Quick Tags)៖</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TAGS.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => handleAddTag(tag)}
                  className="text-[10px] px-2.5 py-1 rounded-xl bg-gray-50 dark:bg-[#1a1c28] hover:bg-emerald-500/10 text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-gray-200 dark:border-gray-800/80 transition-all active:scale-95"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              type="submit"
              disabled={!amountStr || parseFloat(amountStr) <= 0}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:hover:bg-emerald-500 active:scale-[0.99] text-slate-950 font-bold text-xs py-3 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>រក្សាទុកការចំណាយ (Save Expense)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl text-xs text-gray-600 dark:text-gray-400 transition-colors"
            >
              បិទ
            </button>
          </div>

          <p className="text-[10px] text-gray-400 text-center">
            💡 គន្លឹះ៖ ចុច <strong>Ctrl + Enter</strong> ដើម្បីរក្សាទុកភ្លាមៗ
          </p>
        </form>
      </div>
    </div>
  );
};
