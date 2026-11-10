"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { DayInfo } from "@/types/habit";

interface DailyProgressData {
  dayInfo: DayInfo;
  dayLabel: string;
  dayOfWeek: string;
  dayNumber: number;
  percentage: number;
  completed: number;
  total: number;
}

interface DailyProgressBarChartProps {
  data: DailyProgressData[];
  theme?: "dark" | "light";
}

export const DailyProgressBarChart: React.FC<DailyProgressBarChartProps> = ({
  data,
  theme = "dark",
}) => {
  const isDark = theme === "dark";

  return (
    <div className="bg-white dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm dark:shadow-lg transition-colors">
      {/* Header bar */}
      <div className="bg-gray-50 dark:bg-[#181a24] border-b border-gray-200 dark:border-gray-800 px-3 sm:px-4 py-2 flex items-center justify-between">
        <h2 className="text-xs sm:text-sm font-bold tracking-wide uppercase text-gray-800 dark:text-gray-200">
          ការរីកចម្រើនប្រចាំថ្ងៃ
        </h2>
        <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
          0% ដល់ 100%
        </span>
      </div>

      <div className="p-2 sm:p-3 pt-3 sm:pt-4 h-44 sm:h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 6, left: -22, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={isDark ? "#222634" : "#f1f5f9"}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fill: isDark ? "#9ca3af" : "#64748b", fontSize: 9 }}
              axisLine={{ stroke: isDark ? "#2a2f3f" : "#e2e8f0" }}
              tickLine={false}
            />
            <XAxis
              dataKey="dayNumber"
              interval={0}
              tickLine={false}
              axisLine={{ stroke: isDark ? "#2a2f3f" : "#e2e8f0" }}
              tick={({ x, y, payload }) => {
                const item = data.find((d) => d.dayNumber === payload.value);
                const isToday = item?.dayInfo.isToday;
                return (
                  <g transform={`translate(${x},${y})`}>
                    <text
                      x={0}
                      y={7}
                      dy={4}
                      textAnchor="middle"
                      fill={isToday ? "#10b981" : isDark ? "#9ca3af" : "#64748b"}
                      fontSize={8}
                      fontWeight={isToday ? "bold" : "normal"}
                    >
                      {item?.dayOfWeek}
                    </text>
                    <text
                      x={0}
                      y={17}
                      dy={4}
                      textAnchor="middle"
                      fill={isToday ? "#10b981" : isDark ? "#d1d5db" : "#334155"}
                      fontSize={8}
                      fontWeight={isToday ? "bold" : "500"}
                    >
                      {payload.value}
                    </text>
                  </g>
                );
              }}
              height={30}
            />
            <Tooltip
              cursor={{ fill: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)" }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload as DailyProgressData;
                  return (
                    <div className="bg-white dark:bg-[#1a1d28] border border-gray-200 dark:border-gray-700 p-2 sm:p-2.5 rounded-lg shadow-xl text-xs text-gray-900 dark:text-white">
                      <div className="font-semibold flex items-center justify-between gap-3">
                        <span>ថ្ងៃ {d.dayOfWeek} ទី {d.dayNumber}</span>
                        <span className="text-emerald-500 font-bold">{d.percentage}%</span>
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 mt-1">
                        បានបំពេញ: <span className="text-gray-900 dark:text-white font-medium">{d.completed}</span> / {d.total} ទម្លាប់
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="percentage"
              radius={[2, 2, 0, 0]}
              maxBarSize={18}
            >
              {data.map((entry, index) => {
                const isToday = entry.dayInfo.isToday;
                let fillColor = isDark ? "#ffffff" : "#0f172a";
                if (isToday) fillColor = "#10b981";
                else if (entry.percentage === 0) fillColor = isDark ? "#2a2f3f" : "#e2e8f0";

                return <Cell key={`cell-${index}`} fill={fillColor} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
