"use client";

import React, { useState } from "react";
import { X, Sparkles } from "lucide-react";

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddHabit: (habit: { name: string; icon: string; category: string }) => void;
}

const EMOJI_OPTIONS = [
  "⏰", "🧘", "📖", "🏋️", "💧", "🥗", "💻", "🚀", "✨", "🌙",
  "🎯", "🏃", "🚴", "🍎", "✍️", "🎨", "🎵", "🚭", "🧠", "💊"
];

const CATEGORIES = [
  "Morning",
  "Fitness",
  "Health",
  "Productivity",
  "Growth",
  "Mindfulness",
  "Night",
  "General",
];

export const AddHabitModal: React.FC<AddHabitModalProps> = ({
  isOpen,
  onClose,
  onAddHabit,
}) => {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🎯");
  const [category, setCategory] = useState("General");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddHabit({
      name: name.trim(),
      icon,
      category,
    });
    setName("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#151722] border border-gray-200 dark:border-gray-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Add New Habit</h3>
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
              Habit Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Read 15 mins, Drink Water..."
              required
              autoFocus
              className="w-full bg-gray-50 dark:bg-[#1b1e2c] border border-gray-300 dark:border-gray-700 rounded-lg px-3.5 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Category
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
              Choose an Icon
            </label>
            <div className="grid grid-cols-10 gap-1.5 bg-gray-50 dark:bg-[#1b1e2c] p-2 rounded-lg border border-gray-200 dark:border-gray-800 max-h-32 overflow-y-auto">
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

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-500 rounded-lg transition-colors shadow-sm"
            >
              Save Habit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
