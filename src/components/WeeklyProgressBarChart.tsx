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

interface WeeklyProgressData {
  weekLabel: string;
  weekNumber: number;
  percentage: number;
  completed: number;
  total: number;
}

interface WeeklyProgressBarChartProps {
  data: WeeklyProgressData[];
  theme?: "dark" | "light";
}

export const WeeklyProgressBarChart: React.FC<WeeklyProgressBarChartProps> = ({
  data,
  theme = "dark",
}) => {
  const isDark = theme === "dark";

  return (
    <div className="bg-white dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm dark:shadow-lg h-full flex flex-col transition-colors">
      {/* Header matching screenshot */}
      <div className="bg-gray-50 dark:bg-[#181a24] border-b border-gray-200 dark:border-gray-800 px-4 py-2 flex items-center justify-between">
        <h2 className="text-sm font-bold tracking-wider uppercase text-gray-800 dark:text-gray-200">
          Weekly Progress
        </h2>
        <span className="text-xs text-gray-500 dark:text-gray-400">By week</span>
      </div>

      <div className="p-3 pt-4 flex-1 min-h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
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
              tick={{ fill: isDark ? "#9ca3af" : "#64748b", fontSize: 10 }}
              axisLine={{ stroke: isDark ? "#2a2f3f" : "#e2e8f0" }}
              tickLine={false}
            />
            <XAxis
              dataKey="weekLabel"
              tickLine={false}
              axisLine={{ stroke: isDark ? "#2a2f3f" : "#e2e8f0" }}
              tick={{ fill: isDark ? "#cbd5e1" : "#475569", fontSize: 10 }}
              height={30}
            />
            <Tooltip
              cursor={{ fill: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)" }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload as WeeklyProgressData;
                  return (
                    <div className="bg-white dark:bg-[#1a1d28] border border-gray-200 dark:border-gray-700 p-2.5 rounded-lg shadow-xl text-xs text-gray-900 dark:text-white">
                      <div className="font-semibold flex items-center justify-between gap-4">
                        <span>{d.weekLabel.toUpperCase()}</span>
                        <span className="text-emerald-500 font-bold">{d.percentage}%</span>
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 mt-1">
                        Completed: <span className="text-gray-900 dark:text-white font-medium">{d.completed}</span> / {d.total} checkboxes
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="percentage"
              radius={[3, 3, 0, 0]}
              maxBarSize={36}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`week-cell-${index}`}
                  fill={
                    entry.percentage > 0
                      ? isDark
                        ? "#ffffff"
                        : "#0f172a"
                      : isDark
                      ? "#2a2f3f"
                      : "#e2e8f0"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
