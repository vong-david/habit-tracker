"use client";

import React, { useState, useEffect } from "react";
import { Habit } from "@/types/habit";
import { X, Pencil, Trash2, RotateCcw, Check } from "lucide-react";

interface EditHabitModalProps {
  habit: Habit | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateHabit: (updated: Habit) => void;
  onDeleteHabit: (habitId: string) => void;
  onClearHabitMonthLogs: (habitId: string) => void;
}

const EMOJI_OPTIONS = [
  "⏰", "🧘", "📖", "🏋️", "💧", "🥗", "💻", "🚀", "✨", "🌙",
  "🎯", "🏃", "🚴", "🍎", "✍️", "🎨", "🎵", "🚭", "🧠", "💊",
  "📚", "🚶", "🍵", "🧹", "💰", "💤", "🥑", "🏊", "⚽", "🌿"
];

const CATEGORIES = [
  "ពេលព្រឹក",
  "កាយសម្បទា",
  "សុខភាព",
  "ផលិតភាព",
  "ការអភិវឌ្ឍ",
  "ស្មារតី",
  "ពេលយប់",
  "ទូទៅ",
];

export const EditHabitModal: React.FC<EditHabitModalProps> = ({
  habit,
  isOpen,
  onClose,
  onUpdateHabit,
  onDeleteHabit,
  onClearHabitMonthLogs,
}) => {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🎯");
  const [category, setCategory] = useState("ទូទៅ");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setIcon(habit.icon || "🎯");
      setCategory(habit.category || "ទូទៅ");
      setIsConfirmingDelete(false);
    }
  }, [habit]);

  if (!isOpen || !habit) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onUpdateHabit({
      ...habit,
      name: name.trim(),
      icon,
      category,
    });
    onClose();
  };

  const handleDelete = () => {
    if (isConfirmingDelete) {
      onDeleteHabit(habit.id);
      onClose();
    } else {
      setIsConfirmingDelete(true);
    }
  };

  const handleClearChecks = () => {
    if (confirm(`តើអ្នកចង់លុបការធីកទាំងអស់នៃទម្លាប់ "${habit.name}" ក្នុងខែនេះមែនទេ?`)) {
      onClearHabitMonthLogs(habit.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#151722] border border-gray-200 dark:border-gray-800 w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">កែប្រែទម្លាប់</h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">ផ្លាស់ប្តូរឈ្មោះ រូបតំណាង ឬលុបទម្លាប់</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Habit Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              ឈ្មោះទម្លាប់
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xl p-2 bg-gray-100 dark:bg-[#1b1e2c] border border-gray-300 dark:border-gray-700 rounded-lg shrink-0">
                {icon}
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ឧ. អានសៀវភៅ 20 ទំព័រ..."
                required
                className="w-full bg-gray-50 dark:bg-[#1b1e2c] border border-gray-300 dark:border-gray-700 rounded-lg px-3.5 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              ប្រភេទ
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                    category === cat
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/40 font-semibold"
                      : "bg-gray-100 dark:bg-[#1b1e2c] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Emoji / Icon Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              ជ្រើសរើសរូបតំណាងថ្មី
            </label>
            <div className="grid grid-cols-10 gap-1 bg-gray-50 dark:bg-[#1b1e2c] p-2 rounded-lg border border-gray-200 dark:border-gray-800 max-h-28 overflow-y-auto">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  type="button"
                  key={e}
                  onClick={() => setIcon(e)}
                  className={`w-7 h-7 text-sm rounded flex items-center justify-center transition-transform hover:scale-110 ${
                    icon === e
                      ? "bg-emerald-500/20 border border-emerald-500"
                      : "hover:bg-gray-200 dark:hover:bg-gray-700/50"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Danger / Clear Actions */}
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              ជម្រើសបន្ថែម
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleClearChecks}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>លុបការធីកក្នុងខែនេះ</span>
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all ${
                  isConfirmingDelete
                    ? "bg-red-600 text-white animate-pulse"
                    : "text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30"
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isConfirmingDelete ? "ចុចម្តងទៀតដើម្បីលុប!" : "លុបទម្លាប់នេះ"}</span>
              </button>
            </div>
          </div>

          {/* Save / Cancel Footer */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              បោះបង់
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-500 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>រក្សាទុកការកែប្រែ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

