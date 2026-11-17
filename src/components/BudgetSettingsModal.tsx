"use client";

import React, { useState, useEffect } from "react";
import { X, Check, Target, DollarSign, Calculator } from "lucide-react";
import { SpendingBudgetConfig, Currency } from "@/types/spending";
import { formatUsd, formatKhr } from "@/lib/spendingStorage";

interface BudgetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SpendingBudgetConfig;
  onSaveConfig: (newConfig: SpendingBudgetConfig) => void;
}

export const BudgetSettingsModal: React.FC<BudgetSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [monthlyBudget, setMonthlyBudget] = useState<string>("400");
  const [exchangeRate, setExchangeRate] = useState<string>("4100");
  const [currency, setCurrency] = useState<Currency>("USD");

  useEffect(() => {
    if (config) {
      setMonthlyBudget(config.monthlyBudget.toString());
      setExchangeRate((config.exchangeRate || 4100).toString());
      setCurrency(config.currency || "USD");
    }
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const b = parseFloat(monthlyBudget) || 400;
    const r = parseFloat(exchangeRate) || 4100;

    onSaveConfig({
      monthlyBudget: b,
      currency,
      exchangeRate: r,
    });
    onClose();
  };

  const parsedBudget = parseFloat(monthlyBudget) || 0;
  const parsedRate = parseFloat(exchangeRate) || 4100;
  const khrEquivalent = Math.round(parsedBudget * parsedRate);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#151722] border border-gray-200 dark:border-gray-800 w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl relative text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 font-bold text-lg">
              <Target className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                កំណត់ថវិកាប្រចាំខែ
              </h3>
              <p className="text-[11px] text-gray-400">Monthly Budget & Currency Settings</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Monthly Budget Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              គោលដៅថវិកាចំណាយសរុប (Monthly Target in USD) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 font-bold">
                $
              </div>
              <input
                type="number"
                step="any"
                min="1"
                required
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                placeholder="400"
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-all"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              ស្មើនឹងប្រមាណ៖ <span className="font-semibold text-emerald-500">{formatKhr(khrEquivalent)}</span>
            </p>
          </div>

          {/* Exchange Rate */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
              <Calculator className="w-3.5 h-3.5 text-emerald-500" />
              <span>អត្រាប្តូរប្រាក់ (Exchange Rate 1 USD = ? ៛)</span>
            </label>
            <input
              type="number"
              step="any"
              min="1000"
              required
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
              placeholder="4100"
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              type="submit"
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs py-3 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>រក្សាទុកថវិកា</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl text-xs text-gray-600 dark:text-gray-400 transition-colors"
            >
              បោះបង់
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
