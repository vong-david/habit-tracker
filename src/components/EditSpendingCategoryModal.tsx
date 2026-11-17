"use client";

import React, { useState, useEffect } from "react";
import { X, Check, Trash2, Eraser } from "lucide-react";
import { SpendingCategory } from "@/types/spending";

interface EditSpendingCategoryModalProps {
  category: SpendingCategory | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateCategory: (updated: SpendingCategory) => void;
  onDeleteCategory: (categoryId: string) => void;
  onClearCategoryLogs?: (categoryId: string) => void;
}

const COMMON_ICONS = ["🍱", "☕", "🚗", "🛒", "💡", "🍿", "📱", "💊", "📚", "👕", "🏋️", "✈️", "🎁", "🐶", "🏷️"];
const COLOR_PRESETS = [
  "#f97316",
  "#84cc16",
  "#06b6d4",
  "#a855f7",
  "#ef4444",
  "#ec4899",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#6b7280",
];

export const EditSpendingCategoryModal: React.FC<EditSpendingCategoryModalProps> = ({
  category,
  isOpen,
  onClose,
  onUpdateCategory,
  onDeleteCategory,
  onClearCategoryLogs,
}) => {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🏷️");
  const [budgetStr, setBudgetStr] = useState("");
  const [color, setColor] = useState("#3b82f6");

  useEffect(() => {
    if (category) {
      setName(category.name);
      setIcon(category.icon || "🏷️");
      setBudgetStr(category.budget ? category.budget.toString() : "");
      setColor(category.color || "#3b82f6");
    }
  }, [category, isOpen]);

  if (!isOpen || !category) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const budget = budgetStr ? parseFloat(budgetStr) : undefined;
    onUpdateCategory({
      ...category,
      name: name.trim(),
      icon: icon || "🏷️",
      budget: budget && budget > 0 ? budget : undefined,
      color,
    });
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`តើអ្នកប្រាកដជាចង់លុបប្រភេទ "${category.name}" នេះមែនទេ?`)) {
      onDeleteCategory(category.id);
      onClose();
    }
  };

  const handleClearLogs = () => {
    if (confirm(`តើអ្នកចង់សម្អាតកំណត់ត្រាចំណាយទាំងអស់នៃ "${category.name}" ក្នុងខែនេះមែនទេ?`)) {
      onClearCategoryLogs?.(category.id);
      onClose();
    }
  };

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
            <span
              className="p-2 rounded-xl text-lg border"
              style={{
                backgroundColor: `${color}15`,
                borderColor: `${color}40`,
              }}
            >
              {icon}
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                កែប្រែប្រភេទចំណាយ
              </h3>
              <p className="text-[11px] text-gray-400">Edit Spending Category</p>
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
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              ឈ្មោះប្រភេទចំណាយ *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              រូបតំណាង (Emoji)
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_ICONS.map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => setIcon(emoji)}
                  className={`w-9 h-9 rounded-xl text-base flex items-center justify-center transition-all ${
                    icon === emoji
                      ? "bg-emerald-500/20 border-2 border-emerald-500 scale-105"
                      : "bg-gray-50 dark:bg-[#1a1c28] border border-gray-200 dark:border-gray-800 hover:border-gray-400"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              ពណ៌សម្គាល់
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c ? "ring-2 ring-offset-2 ring-emerald-500 scale-110" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              ថវិកាកំណត់ ($ USD)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={budgetStr}
              onChange={(e) => setBudgetStr(e.target.value)}
              placeholder="ឧ. 50"
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Danger zone actions (Clear logs & Delete) */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            {onClearCategoryLogs && (
              <button
                type="button"
                onClick={handleClearLogs}
                className="text-xs text-gray-500 hover:text-amber-500 flex items-center gap-1 transition-colors"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>សម្អាតចំណាយ</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDelete}
              className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>លុបប្រភេទនេះ</span>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-slate-950 font-bold text-xs py-3 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>រក្សាទុក</span>
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
