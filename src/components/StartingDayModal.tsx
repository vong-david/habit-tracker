"use client";

import React, { useState, useEffect } from "react";
import { TrackerCycleConfig } from "@/types/habit";
import { Sparkles, Calendar, Check, X, RotateCcw, CalendarDays, ArrowRight } from "lucide-react";
import { toKhmerNum, KHMER_MONTH_NAMES } from "@/lib/dateUtils";

interface StartingDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  cycleConfig: TrackerCycleConfig;
  onSaveCycleConfig: (config: TrackerCycleConfig) => void;
  currentDate: Date;
}

export const StartingDayModal: React.FC<StartingDayModalProps> = ({
  isOpen,
  onClose,
  cycleConfig,
  onSaveCycleConfig,
  currentDate,
}) => {
  const [mode, setMode] = useState<"today_to_end" | "custom_start_day" | "full_month" | "consecutive_days">(
    cycleConfig.mode || "today_to_end"
  );

  const today = new Date();
  const currentMonthDays = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const currentMonthName = KHMER_MONTH_NAMES[currentDate.getMonth()];
  const currentYearKhmer = toKhmerNum(currentDate.getFullYear());

  const [startDayInput, setStartDayInput] = useState<number>(
    cycleConfig.startDay || today.getDate()
  );

  useEffect(() => {
    if (isOpen) {
      setMode(cycleConfig.mode || "today_to_end");
      setStartDayInput(cycleConfig.startDay || today.getDate());
    }
  }, [isOpen, cycleConfig, today]);

  if (!isOpen) return null;

  // Calculate live preview text
  const getPreviewText = () => {
    if (mode === "full_month") {
      return `បង្ហាញពេញមួយខែ៖ ពីថ្ងៃទី ១ ដល់ ថ្ងៃទី ${toKhmerNum(currentMonthDays)} ${currentMonthName} ${currentYearKhmer} (សរុប ${toKhmerNum(currentMonthDays)} ថ្ងៃ)`;
    }

    if (mode === "today_to_end") {
      const todayDate = today.getDate();
      const isViewingCurrentMonth =
        today.getFullYear() === currentDate.getFullYear() &&
        today.getMonth() === currentDate.getMonth();

      const effectiveStart = isViewingCurrentMonth ? todayDate : 1;
      const count = currentMonthDays - effectiveStart + 1;
      return `បង្ហាញពីថ្ងៃនេះដល់ចុងខែ៖ ពីថ្ងៃទី ${toKhmerNum(effectiveStart)} ដល់ ${toKhmerNum(currentMonthDays)} ${currentMonthName} ${currentYearKhmer} (សរុប ${toKhmerNum(count)} ថ្ងៃ)`;
    }

    if (mode === "custom_start_day") {
      const validStart = Math.max(1, Math.min(startDayInput, currentMonthDays));
      const count = currentMonthDays - validStart + 1;
      return `ចាប់ពីថ្ងៃទី ${toKhmerNum(validStart)} ដល់ ${toKhmerNum(currentMonthDays)} ${currentMonthName} ${currentYearKhmer} (សរុប ${toKhmerNum(count)} ថ្ងៃ)`;
    }

    if (mode === "consecutive_days") {
      return `វដ្ត ៣០ ថ្ងៃជាប់ៗគ្នារំលងទៅខែបន្ទាប់`;
    }

    return "";
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "today_to_end") {
      onSaveCycleConfig({
        mode: "today_to_end",
        startDay: today.getDate(),
      });
    } else if (mode === "custom_start_day") {
      onSaveCycleConfig({
        mode: "custom_start_day",
        startDay: Math.max(1, Math.min(startDayInput, currentMonthDays)),
      });
    } else if (mode === "full_month") {
      onSaveCycleConfig({
        mode: "full_month",
        startDay: 1,
      });
    } else if (mode === "consecutive_days") {
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      onSaveCycleConfig({
        mode: "consecutive_days",
        startDate: todayStr,
        durationDays: 30,
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
                កំណត់ថ្ងៃចាប់ផ្តើមក្នុងខែ
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                បង្ហាញចាប់ពីថ្ងៃចាប់ផ្តើម ដល់ថ្ងៃចុងខែ
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

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          {/* Option 1: Start From Today to End of Month */}
          <div
            onClick={() => setMode("today_to_end")}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
              mode === "today_to_end"
                ? "bg-emerald-500/10 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-sm"
                : "bg-gray-50 dark:bg-[#1a1c28] border-gray-200 dark:border-gray-800 hover:border-emerald-500/40"
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <span>ចាប់ផ្តើមពីថ្ងៃនេះ ដល់ចុងខែ</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                    ណែនាំ
                  </span>
                </p>
                {mode === "today_to_end" && <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                បង្ហាញចាប់ពី <strong>ថ្ងៃនេះ (ថ្ងៃទី {toKhmerNum(today.getDate())})</strong> ដល់ថ្ងៃចុងខែ <strong>({toKhmerNum(currentMonthDays)} {currentMonthName})</strong>
              </p>
            </div>
          </div>

          {/* Option 2: Custom Start Day to End of Month */}
          <div
            onClick={() => setMode("custom_start_day")}
            className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-3 ${
              mode === "custom_start_day"
                ? "bg-emerald-500/10 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-sm"
                : "bg-gray-50 dark:bg-[#1a1c28] border-gray-200 dark:border-gray-800 hover:border-emerald-500/40"
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-500 shrink-0 mt-0.5">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                    កំណត់ថ្ងៃទីចាប់ផ្តើម (ឧ. ថ្ងៃទី ១២ ដល់ចុងខែ)
                  </p>
                  {mode === "custom_start_day" && <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  ជ្រើសរើសថ្ងៃទីដែលអ្នកចង់ចាប់ផ្តើមរហូតដល់ថ្ងៃចុងខែ
                </p>
              </div>
            </div>

            {/* Day Selector */}
            <div className="pt-1 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 shrink-0">
                ថ្ងៃទីចាប់ផ្តើម៖
              </label>
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="number"
                  min={1}
                  max={currentMonthDays}
                  value={startDayInput}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) setStartDayInput(val);
                    setMode("custom_start_day");
                  }}
                  className="w-20 bg-white dark:bg-[#12141c] border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-1.5 text-xs text-center font-bold text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>ដល់ថ្ងៃទី {toKhmerNum(currentMonthDays)} {currentMonthName}</span>
                </span>
              </div>
            </div>

            {/* Quick Day Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
              {[1, 5, 10, 12, 15, 20, today.getDate()].filter((v, i, a) => a.indexOf(v) === i).sort((a,b) => a-b).map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => {
                    setStartDayInput(d);
                    setMode("custom_start_day");
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                    startDayInput === d && mode === "custom_start_day"
                      ? "bg-emerald-500 text-slate-950 font-bold border-emerald-500"
                      : "bg-white dark:bg-[#12141c] border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-emerald-500"
                  }`}
                >
                  ថ្ងៃទី {toKhmerNum(d)} {d === today.getDate() ? "(ថ្ងៃនេះ)" : ""}
                </button>
              ))}
            </div>
          </div>

          {/* Option 3: Full Month (1 to End) */}
          <div
            onClick={() => setMode("full_month")}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
              mode === "full_month"
                ? "bg-emerald-500/10 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-sm"
                : "bg-gray-50 dark:bg-[#1a1c28] border-gray-200 dark:border-gray-800 hover:border-emerald-500/40"
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-500 shrink-0 mt-0.5">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                  បង្ហាញពេញមួយខែ (ថ្ងៃទី ១ ដល់ចុងខែ)
                </p>
                {mode === "full_month" && <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                បង្ហាញចាប់ពីថ្ងៃទី ១ ដល់ថ្ងៃទី {toKhmerNum(currentMonthDays)} {currentMonthName} ទាំងមូល
              </p>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[11px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                ការមើលជាមុន (Live Preview)៖
              </p>
              <p className="text-xs font-semibold mt-1 leading-relaxed text-gray-800 dark:text-gray-200">
                {getPreviewText()}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-slate-950 font-bold text-xs py-3 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>អនុវត្តថ្ងៃចាប់ផ្តើម (Apply)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("full_month");
                setStartDayInput(1);
              }}
              className="px-3 py-3 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl text-xs text-gray-600 dark:text-gray-400 transition-colors flex items-center gap-1.5"
              title="កំណត់ឡើងវិញទៅពេញមួយខែ"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ពេញមួយខែ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
