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
  dayLabel: string; // e.g. "We 1" or "We\n1"
  dayOfWeek: string;
  dayNumber: number;
  percentage: number;
  completed: number;
  total: number;
}

interface DailyProgressBarChartProps {
  data: DailyProgressData[];
}

export const DailyProgressBarChart: React.FC<DailyProgressBarChartProps> = ({ data }) => {
  return (
    <div className="bg-[#12141c] border border-gray-800 rounded-xl overflow-hidden shadow-lg">
      {/* Header bar matching the screenshot */}
      <div className="bg-[#181a24] border-b border-gray-800 px-4 py-2 flex items-center justify-between">
        <h2 className="text-sm font-bold tracking-wider uppercase text-gray-200">
          Daily Progress
        </h2>
        <span className="text-xs text-gray-400">
          0% - 100% completion
        </span>
      </div>

      <div className="p-3 pt-4 h-48 sm:h-52 w-full">
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
              dataKey="dayNumber"
              interval={0}
              tickLine={false}
              axisLine={{ stroke: "#2a2f3f" }}
              tick={({ x, y, payload }) => {
                const item = data.find((d) => d.dayNumber === payload.value);
                const isToday = item?.dayInfo.isToday;
                return (
                  <g transform={`translate(${x},${y})`}>
                    <text
                      x={0}
                      y={8}
                      dy={4}
                      textAnchor="middle"
                      fill={isToday ? "#10b981" : "#9ca3af"}
                      fontSize={9}
                      fontWeight={isToday ? "bold" : "normal"}
                    >
                      {item?.dayOfWeek}
                    </text>
                    <text
                      x={0}
                      y={18}
                      dy={4}
                      textAnchor="middle"
                      fill={isToday ? "#10b981" : "#d1d5db"}
                      fontSize={9}
                      fontWeight={isToday ? "bold" : "500"}
                    >
                      {payload.value}
                    </text>
                  </g>
                );
              }}
              height={32}
            />
            <Tooltip
              cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload as DailyProgressData;
                  return (
                    <div className="bg-[#1a1d28] border border-gray-700 p-2.5 rounded-lg shadow-xl text-xs">
                      <div className="font-semibold text-white flex items-center justify-between gap-4">
                        <span>{d.dayOfWeek}, Day {d.dayNumber}</span>
                        <span className="text-emerald-400 font-bold">{d.percentage}%</span>
                      </div>
                      <div className="text-gray-400 mt-1">
                        Completed: <span className="text-white font-medium">{d.completed}</span> / {d.total} habits
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
              maxBarSize={20}
            >
              {data.map((entry, index) => {
                const isToday = entry.dayInfo.isToday;
                let fillColor = "#ffffff"; // default bright contrast like image
                if (isToday) fillColor = "#10b981"; // Emerald accent for today
                else if (entry.percentage === 100) fillColor = "#e2e8f0";
                else if (entry.percentage === 0) fillColor = "#2a2f3f";
                else fillColor = "#cbd5e1";

                return <Cell key={`cell-${index}`} fill={fillColor} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
