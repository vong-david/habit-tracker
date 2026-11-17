"use client";

import React, { useState, useEffect } from "react";
import { TrackerCycleConfig } from "@/types/habit";
import { Calendar, Sparkles, Clock, Check, X, RotateCcw, CalendarDays } from "lucide-react";
import { toKhmerNum, KHMER_MONTH_NAMES } from "@/lib/dateUtils";

interface StartingDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  cycleConfig: TrackerCycleConfig;
  onSaveCycleConfig: (config: TrackerCycleConfig) => void;
}

const DURATION_OPTIONS = [
  { days: 30, label: "៣០ ថ្ងៃ (ស្តង់ដារ)", desc: "វដ្តតាមដានពេញលេញ" },
  { days: 21, label: "២១ ថ្ងៃ (កសាងទម្លាប់)", desc: "ក្បួនវិទ្យាសាស្ត្រ 21-Day Habit" },
  { days: 31, label: "៣១ ថ្ងៃ (១ ខែពេញ)", desc: "សមស្របសម្រាប់ខែ 31 ថ្ងៃ" },
  { days: 14, label: "១៤ ថ្ងៃ (២ សប្តាហ៍)", desc: "វដ្តរយៈពេលខ្លី" },
  { days: 7, label: "៧ ថ្ងៃ (១ សប្តាហ៍)", desc: "សាកល្បងទម្លាប់ប្រចាំសប្តាហ៍" },
];

export const StartingDayModal: React.FC<StartingDayModalProps> = ({
  isOpen,
  onClose,
  cycleConfig,
  onSaveCycleConfig,
}) => {
  const [mode, setMode] = useState<"calendar_month" | "custom_start_date">(cycleConfig.mode || "calendar_month");
  
  // Format today as YYYY-MM-DD
  const getTodayStr = () => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  };

  const [startDateInput, setStartDateInput] = useState<string>(
    cycleConfig.startDate || getTodayStr()
  );
  const [durationInput, setDurationInput] = useState<number>(
    cycleConfig.durationDays || 30
  );

  useEffect(() => {
    if (isOpen) {
      setMode(cycleConfig.mode || "calendar_month");
      setStartDateInput(cycleConfig.startDate || getTodayStr());
      setDurationInput(cycleConfig.durationDays || 30);
    }
  }, [isOpen, cycleConfig]);

  if (!isOpen) return null;

  // Calculate preview text
  const getPreviewText = () => {
    if (mode === "calendar_month") {
      const now = new Date();
      return `តាមដានតាមខែប្រតិទិនធម្មតា (ថ្ងៃទី ១ ដល់ថ្ងៃចុងខែ ${KHMER_MONTH_NAMES[now.getMonth()]})`;
    }

    try {
      const [y, m, d] = startDateInput.split("-").map(Number);
      const start = new Date(y, m - 1, d);
      const end = new Date(y, m - 1, d + durationInput - 1);

      const startFormatted = `${toKhmerNum(start.getDate())} ${KHMER_MONTH_NAMES[start.getMonth()]}`;
      const endFormatted = `${toKhmerNum(end.getDate())} ${KHMER_MONTH_NAMES[end.getMonth()]} ${toKhmerNum(end.getFullYear())}`;

      return `ពីថ្ងៃ ${startFormatted} ដល់ ${endFormatted} (សរុប ${toKhmerNum(durationInput)} ថ្ងៃ)`;
    } catch {
      return "កាលបរិច្ឆេទមិនត្រឹមត្រូវ";
    }
  };

  // Quick preset: Start from today
  const handleQuickStartToday = () => {
    setMode("custom_start_date");
    setStartDateInput(getTodayStr());
    setDurationInput(30);
  };

  // Reset to calendar month
  const handleResetToMonth = () => {
    setMode("calendar_month");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "calendar_month") {
      onSaveCycleConfig({
        mode: "calendar_month",
      });
    } else {
      onSaveCycleConfig({
        mode: "custom_start_date",
        startDate: startDateInput || getTodayStr(),
        durationDays: durationInput,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-white dark:bg-[#151722] border border-gray-200 dark:border-gray-800 w-full max-w-lg rounded-3xl p-5 sm:p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                កំណត់ថ្ងៃចាប់ផ្តើម & វដ្តតាមដាន
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ជ្រើសរើសថ្ងៃចាប់ផ្តើមតាមចិត្ត ដោយមិនចាំបាច់រង់ចាំខែថ្មី
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-5 space-y-5">
          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              របៀបកំណត់ថ្ងៃតាមដាន (Tracking Mode)
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Preset 1: Start From Today */}
              <div
                onClick={handleQuickStartToday}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  mode === "custom_start_date" && startDateInput === getTodayStr()
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm"
                    : "bg-gray-50 dark:bg-[#1a1c28] border-gray-200 dark:border-gray-800 hover:border-emerald-500/50"
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1">
                    <span>ចាប់ផ្តើមពីថ្ងៃនេះ</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-semibold">
                      ណែនាំ
                    </span>
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    ចាប់ផ្តើមភ្លាមៗ ៣០ ថ្ងៃពេញ មិនបាច់រង់ចាំខែថ្មី
                  </p>
                </div>
              </div>

              {/* Preset 2: Calendar Month */}
              <div
                onClick={handleResetToMonth}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  mode === "calendar_month"
                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm"
                    : "bg-gray-50 dark:bg-[#1a1c28] border-gray-200 dark:border-gray-800 hover:border-emerald-500/50"
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">
                    តាមខែប្រតិទិនធម្មតា
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    ចាប់ពីថ្ងៃទី ១ ដល់ចុងខែនីមួយៗ (១-៣១)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Date Configuration (Visible when not in calendar month) */}
          <div className="bg-gray-50 dark:bg-[#181a24] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-500" />
                <span>កាលបរិច្ឆេទចាប់ផ្តើមជាក់លាក់</span>
              </label>

              {mode !== "custom_start_date" && (
                <button
                  type="button"
                  onClick={() => setMode("custom_start_date")}
                  className="text-[11px] text-emerald-500 hover:underline font-semibold"
                >
                  បើកប្រើកាលបរិច្ឆេទផ្ទាល់ខ្លួន
                </button>
              )}
            </div>

            {/* Date Input */}
            <div>
              <label className="block text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                ជ្រើសរើសថ្ងៃចាប់ផ្តើម (Starting Date):
              </label>
              <input
                type="date"
                value={startDateInput}
                onChange={(e) => {
                  setStartDateInput(e.target.value);
                  setMode("custom_start_date");
                }}
                className="w-full bg-white dark:bg-[#12141c] border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-colors shadow-sm"
              />
            </div>

            {/* Duration Selector */}
            <div>
              <label className="block text-[11px] text-gray-500 dark:text-gray-400 mb-1.5">
                ចំនួនថ្ងៃតាមដាន (Duration):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt.days}
                    onClick={() => {
                      setDurationInput(opt.days);
                      setMode("custom_start_date");
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      durationInput === opt.days && mode === "custom_start_date"
                        ? "bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold"
                        : "bg-white dark:bg-[#12141c] border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <p className="text-xs font-semibold">{opt.label}</p>
                    <p className="text-[10px] text-gray-400 truncate mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
            <div>
              <p className="font-semibold text-[11px] text-emerald-600 dark:text-emerald-400">
                ការមើលជាមុន (Preview)៖
              </p>
              <p className="text-xs font-bold mt-0.5">{getPreviewText()}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-slate-950 font-bold text-xs py-3 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>អនុវត្តថ្ងៃចាប់ផ្តើម (Apply)</span>
            </button>

            {mode === "custom_start_date" && (
              <button
                type="button"
                onClick={handleResetToMonth}
                className="px-3 py-3 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl text-xs text-gray-600 dark:text-gray-400 transition-colors flex items-center gap-1.5"
                title="កំណត់ឡើងវិញទៅខែធម្មតា"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ខែធម្មតា</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
