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
  weekLabel: string; // "week 1", "week 2", etc.
  weekNumber: number;
  percentage: number;
  completed: number;
  total: number;
}

interface WeeklyProgressBarChartProps {
  data: WeeklyProgressData[];
}

export const WeeklyProgressBarChart: React.FC<WeeklyProgressBarChartProps> = ({ data }) => {
  return (
    <div className="bg-[#12141c] border border-gray-800 rounded-xl overflow-hidden shadow-lg h-full flex flex-col">
      {/* Header matching screenshot */}
      <div className="bg-[#181a24] border-b border-gray-800 px-4 py-2 flex items-center justify-between">
        <h2 className="text-sm font-bold tracking-wider uppercase text-gray-200">
          Weekly Progress
        </h2>
        <span className="text-xs text-gray-400">By week</span>
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
              stroke="#222634"
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fill: "#9ca3af", fontSize: 10 }}
              axisLine={{ stroke: "#2a2f3f" }}
              tickLine={false}
            />
            <XAxis
              dataKey="weekLabel"
              tickLine={false}
              axisLine={{ stroke: "#2a2f3f" }}
              tick={{ fill: "#cbd5e1", fontSize: 10 }}
              height={30}
            />
            <Tooltip
              cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload as WeeklyProgressData;
                  return (
                    <div className="bg-[#1a1d28] border border-gray-700 p-2.5 rounded-lg shadow-xl text-xs">
                      <div className="font-semibold text-white flex items-center justify-between gap-4">
                        <span>{d.weekLabel.toUpperCase()}</span>
                        <span className="text-emerald-400 font-bold">{d.percentage}%</span>
                      </div>
                      <div className="text-gray-400 mt-1">
                        Completed: <span className="text-white font-medium">{d.completed}</span> / {d.total} checkboxes
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
                  fill={entry.percentage > 0 ? "#ffffff" : "#2a2f3f"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
