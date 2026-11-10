"use client";

import React from "react";
import { DayInfo, WellnessMap } from "@/types/habit";
import { Moon, Smile } from "lucide-react";

interface WellnessTrackerProps {
  days: DayInfo[];
  wellness: WellnessMap;
  onUpdateWellness: (dateString: string, field: "mood" | "sleepHours", value: number) => void;
}

export const WellnessTracker: React.FC<WellnessTrackerProps> = ({
  days,
  wellness,
  onUpdateWellness,
}) => {
  // Calculate averages for the month
  let totalMood = 0;
  let moodCount = 0;
  let totalSleep = 0;
  let sleepCount = 0;

  days.forEach((day) => {
    const data = wellness[day.dateString];
    if (data?.mood) {
      totalMood += data.mood;
      moodCount++;
    }
    if (data?.sleepHours) {
      totalSleep += data.sleepHours;
      sleepCount++;
    }
  });

  const avgMood = moodCount > 0 ? (totalMood / moodCount).toFixed(1) : "--";
  const avgSleep = sleepCount > 0 ? (totalSleep / sleepCount).toFixed(1) : "--";

  return (
    <div className="bg-[#12141c] border border-gray-800 rounded-xl overflow-hidden shadow-xl mt-6">
      {/* Header bar matching the screenshot */}
      <div className="bg-[#181a24] border-b border-gray-800 px-4 py-2.5 flex items-center justify-between">
        <h2 className="text-sm font-bold tracking-wider uppercase text-gray-200">
          Overall wellness
        </h2>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Avg Mood: <strong>{avgMood} / 5</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-2.5 h-2.5 rounded bg-cyan-500 inline-block" />
            <span>Avg Sleep: <strong>{avgSleep}h</strong></span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs select-none">
          <thead>
            <tr className="bg-[#141620] text-gray-400 border-b border-gray-800 text-[11px]">
              <th className="sticky left-0 z-20 bg-[#141620] px-4 py-1.5 text-left font-medium border-r border-gray-800 min-w-[220px] shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                Metric
              </th>
              {days.map((day) => (
                <th
                  key={`wel-head-${day.dateString}`}
                  className={`px-1 py-1 text-center font-semibold border-r border-gray-800/80 min-w-[34px] ${
                    day.isToday ? "bg-emerald-500/10 text-emerald-400 font-bold" : "text-gray-400"
                  }`}
                >
                  {day.dayNumber}
                </th>
              ))}
              <th className="px-3 py-1 text-center font-medium min-w-[90px]">
                Average
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-800/70">
            {/* 1. Mood Row */}
            <tr className="hover:bg-white/[0.02] transition-colors">
              <td className="sticky left-0 z-10 bg-[#12141c] px-4 py-2 border-r border-gray-800 shadow-[2px_0_5px_rgba(0,0,0,0.3)] font-semibold text-gray-200 flex items-center gap-2">
                <Smile className="w-4 h-4 text-emerald-400" />
                <span>Mood (1 - 5)</span>
              </td>

              {days.map((day) => {
                const currentMood = wellness[day.dateString]?.mood ?? 0;
                return (
                  <td
                    key={`mood-${day.dateString}`}
                    className={`px-0.5 py-1.5 text-center border-r border-gray-800/80 ${
                      day.isToday ? "bg-emerald-500/5" : ""
                    }`}
                  >
                    <select
                      value={currentMood || ""}
                      onChange={(e) =>
                        onUpdateWellness(day.dateString, "mood", Number(e.target.value))
                      }
                      className="bg-[#181a24] text-center text-xs text-emerald-400 font-bold rounded px-1 py-0.5 border border-gray-700/80 focus:border-emerald-500 outline-none w-7 cursor-pointer"
                    >
                      <option value="">-</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                    </select>
                  </td>
                );
              })}

              <td className="px-2 py-1.5 text-center font-bold text-emerald-400">
                {avgMood}
              </td>
            </tr>

            {/* 2. Hours of Sleep Row */}
            <tr className="hover:bg-white/[0.02] transition-colors">
              <td className="sticky left-0 z-10 bg-[#12141c] px-4 py-2 border-r border-gray-800 shadow-[2px_0_5px_rgba(0,0,0,0.3)] font-semibold text-gray-200 flex items-center gap-2">
                <Moon className="w-4 h-4 text-cyan-400" />
                <span>Hours of Sleep</span>
              </td>

              {days.map((day) => {
                const currentSleep = wellness[day.dateString]?.sleepHours ?? 0;
                return (
                  <td
                    key={`sleep-${day.dateString}`}
                    className={`px-0.5 py-1.5 text-center border-r border-gray-800/80 ${
                      day.isToday ? "bg-emerald-500/5" : ""
                    }`}
                  >
                    <select
                      value={currentSleep || ""}
                      onChange={(e) =>
                        onUpdateWellness(day.dateString, "sleepHours", Number(e.target.value))
                      }
                      className="bg-[#181a24] text-center text-xs text-cyan-300 font-bold rounded px-0.5 py-0.5 border border-gray-700/80 focus:border-cyan-500 outline-none w-7 cursor-pointer"
                    >
                      <option value="">-</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                      <option value="6">6</option>
                      <option value="7">7</option>
                      <option value="8">8</option>
                      <option value="9">9</option>
                      <option value="10">10</option>
                    </select>
                  </td>
                );
              })}

              <td className="px-2 py-1.5 text-center font-bold text-cyan-400">
                {avgSleep}h
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
