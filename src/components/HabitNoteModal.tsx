"use client";

import React, { useState, useEffect } from "react";
import { Habit, DayInfo } from "@/types/habit";
import { Check, X, FileText, Trash2, Calendar, Sparkles, CheckCircle2, Circle } from "lucide-react";
import { toKhmerNum, KHMER_MONTH_NAMES } from "@/lib/dateUtils";

interface HabitNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  habit: Habit | null;
  day: DayInfo | null;
  initialCompleted: boolean;
  initialNote: string;
  onSave: (completed: boolean, note: string) => void;
}

const QUICK_TAGS = [
  "🌟 ធ្វើបានល្អឥតខ្ចោះ",
  "💪 សម្រេចតាមគោលដៅ",
  "⚡ ពិបាកបន្តិច តែបានជោគជ័យ",
  "🎯 តាមផែនការ ១០០%",
  "😴 អស់កម្លាំងបន្តិច",
  "🚀 មានអារម្មណ៍ថាផលិតភាពខ្ពស់",
];

export const HabitNoteModal: React.FC<HabitNoteModalProps> = ({
  isOpen,
  onClose,
  habit,
  day,
  initialCompleted,
  initialNote,
  onSave,
}) => {
  const [completed, setCompleted] = useState<boolean>(initialCompleted);
  const [note, setNote] = useState<string>(initialNote);

  useEffect(() => {
    if (isOpen) {
      // If was not completed, default to true because clicking usually means user wants to check it off!
      setCompleted(initialCompleted !== undefined ? initialCompleted : true);
      setNote(initialNote || "");
    }
  }, [isOpen, initialCompleted, initialNote]);

  if (!isOpen || !habit || !day) return null;

  const dateFormatted = `${day.dayOfWeek} ទី ${toKhmerNum(day.dayNumber)} ${KHMER_MONTH_NAMES[day.monthIndex]} ${toKhmerNum(day.date.getFullYear())}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(completed, note.trim());
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      onSave(completed, note.trim());
      onClose();
    }
  };

  const handleClearNote = () => {
    setNote("");
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
        className="bg-white dark:bg-[#151722] border border-gray-200 dark:border-gray-800 w-full max-w-md rounded-3xl p-5 sm:p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto text-left"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl sm:text-3xl shrink-0 p-2 bg-gray-50 dark:bg-[#1c1f2e] border border-gray-200 dark:border-gray-700/60 rounded-2xl">
              {habit.icon || "📌"}
            </span>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">
                {habit.name}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-semibold">
                  {habit.category}
                </span>
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{dateFormatted}</span>
                </span>
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Status Toggle (Completed vs Incomplete) */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              ស្ថានភាពទម្លាប់ (Habit Status)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCompleted(true)}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  completed
                    ? "bg-emerald-500 border-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-500/30"
                    : "bg-gray-50 dark:bg-[#1a1c28] border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-emerald-500/50"
                }`}
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>បានសម្រេច (Done)</span>
              </button>

              <button
                type="button"
                onClick={() => setCompleted(false)}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  !completed
                    ? "bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-white shadow-sm ring-2 ring-gray-400/20"
                    : "bg-gray-50 dark:bg-[#1a1c28] border-gray-200 dark:border-gray-800 text-gray-500 hover:border-gray-400"
                }`}
              >
                <Circle className="w-4 h-4" />
                <span>មិនទាន់សម្រេច</span>
              </button>
            </div>
          </div>

          {/* Note Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-500" />
                <span>កំណត់ចំណាំប្រចាំថ្ងៃ (Daily Note)</span>
              </label>

              {note && (
                <button
                  type="button"
                  onClick={handleClearNote}
                  className="text-[10px] text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>លុបចំណាំ</span>
                </button>
              )}
            </div>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="កត់ត្រាព័ត៌មានលម្អិត លទ្ធផល ឬបទពិសោធន៍... (ឧ. រត់បាន 3 គីឡូ, អានបាន 20 ទំព័រ, Trade NQ +$450...)"
              rows={3}
              autoFocus
              className="w-full bg-gray-50 dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-2xl p-3 text-xs text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none leading-relaxed shadow-sm"
            />
          </div>

          {/* Quick Note Tags */}
          <div>
            <span className="text-[10px] text-gray-400 flex items-center gap-1 mb-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>កំណត់ចំណាំរហ័ស (Quick Tags)៖</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TAGS.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => handleAddTag(tag)}
                  className="text-[10px] px-2.5 py-1 rounded-xl bg-gray-50 dark:bg-[#1a1c28] hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-gray-200 dark:border-gray-800/80 transition-all active:scale-95"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              type="submit"
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-slate-950 font-bold text-xs py-3 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>រក្សាទុក (Save)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl text-xs text-gray-600 dark:text-gray-400 transition-colors"
            >
              បោះបង់
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
