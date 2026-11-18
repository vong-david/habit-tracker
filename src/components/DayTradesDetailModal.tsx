"use client";

import React, { useState, useEffect } from "react";
import { Trade, DayTradesSummary } from "@/types/trading";
import { formatPnl } from "@/lib/tradingStorage";
import { getTradeImage } from "@/lib/tradeImageStorage";
import {
  X,
  Plus,
  Trash2,
  Pencil,
  Calendar,
  TrendingDown,
  ExternalLink,
  User,
  Layers,
  List,
  SlidersHorizontal,
  Hash,
  Sparkles,
  ChevronDownCircle,
  Image as ImageIcon,
} from "lucide-react";
import { toKhmerNum } from "@/lib/dateUtils";

interface DayTradesDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  daySummary: DayTradesSummary | null;
  onOpenAddTrade: (dateString: string) => void;
  onEditTrade: (trade: Trade) => void;
  onDeleteTrade: (tradeId: string) => void;
  onViewImage: (imageUrl: string) => void;
}

// Convert "YYYY-MM-DD" to "DD/MM/YYYY" matching Notion screenshot
function formatNotionDate(dateStr?: string): string {
  if (!dateStr) return "-";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

// Notion Tag Colors matching exact screenshot styling
function getNotionTagStyle(tag: string): string {
  const lower = tag.toLowerCase();
  if (lower.includes("liquidity") || lower.includes("sweep")) {
    return "bg-[#3f2f18] text-[#fcd34d] border border-[#78531b]/60 dark:bg-[#3f2f18] dark:text-[#fcd34d]";
  }
  if (lower.includes("htf") || lower.includes("bias")) {
    return "bg-[#18342b] text-[#6ee7b7] border border-[#1b5b42]/60 dark:bg-[#18342b] dark:text-[#6ee7b7]";
  }
  if (
    lower.includes("sibi") ||
    lower.includes("bisi") ||
    lower.includes("imbalance") ||
    lower.includes("inefficiency")
  ) {
    return "bg-[#3a2414] text-[#fdba74] border border-[#7c3a16]/60 dark:bg-[#3a2414] dark:text-[#fdba74]";
  }
  if (
    lower.includes("fvg") ||
    lower.includes("silver") ||
    lower.includes("bullet") ||
    lower.includes("gap")
  ) {
    return "bg-[#182b49] text-[#93c5fd] border border-[#1d4ed8]/60 dark:bg-[#182b49] dark:text-[#93c5fd]";
  }
  if (lower.includes("order") || lower.includes("ob")) {
    return "bg-[#2e1f45] text-[#d8b4fe] border border-[#581c87]/60 dark:bg-[#2e1f45] dark:text-[#d8b4fe]";
  }
  if (lower.includes("structure") || lower.includes("mss") || lower.includes("shift")) {
    return "bg-[#3b182e] text-[#f472b6] border border-[#831843]/60 dark:bg-[#3b182e] dark:text-[#f472b6]";
  }
  if (lower.includes("breaker")) {
    return "bg-[#1e284a] text-[#818cf8] border border-[#3730a3]/60 dark:bg-[#1e284a] dark:text-[#818cf8]";
  }
  return "bg-gray-100 dark:bg-[#222430] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700";
}

export const DayTradesDetailModal: React.FC<DayTradesDetailModalProps> = ({
  isOpen,
  onClose,
  daySummary,
  onOpenAddTrade,
  onEditTrade,
  onDeleteTrade,
  onViewImage,
}) => {
  const [resolvedImages, setResolvedImages] = useState<Record<string, string>>({});

  // Resolve IndexedDB image IDs to full Data URLs for viewing
  useEffect(() => {
    if (!daySummary || !isOpen) return;

    let isMounted = true;
    const fetchImages = async () => {
      const map: Record<string, string> = {};
      for (const trade of daySummary.trades) {
        if (trade.imageUrls) {
          for (const imgRef of trade.imageUrls) {
            if (!map[imgRef]) {
              const url = await getTradeImage(imgRef);
              if (url && isMounted) {
                map[imgRef] = url;
              }
            }
          }
        }
      }
      if (isMounted) setResolvedImages(map);
    };

    fetchImages();
    return () => {
      isMounted = false;
    };
  }, [daySummary, isOpen]);

  if (!isOpen || !daySummary) return null;

  const hasTrades = daySummary.trades.length > 0;
  const isNetPositive = daySummary.totalPnl > 0;
  const isNetNegative = daySummary.totalPnl < 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 w-full max-w-3xl lg:max-w-4xl rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[92vh] overflow-y-auto text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500 font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                ព័ត៌មានលម្អិត Trade ថ្ងៃទី {toKhmerNum(daySummary.dayNumber)} ({daySummary.dateString})
              </h3>
              <p className="text-xs text-gray-400">
                {daySummary.dayOfWeek} • {daySummary.tradesCount} ប្រតិបត្តិការ (Trades)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Daily Summary Banner */}
        <div
          className={`mt-4 p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
            isNetPositive
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
              : isNetNegative
              ? "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"
              : "bg-gray-50 dark:bg-[#181a24] border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300"
          }`}
        >
          <div>
            <span className="text-xs uppercase font-semibold opacity-80 block">
              លទ្ធផលសរុបប្រចាំថ្ងៃ (Daily Net P&L)
            </span>
            <span className="text-2xl font-black tracking-tight">
              {formatPnl(daySummary.totalPnl)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right text-xs">
              <span className="font-bold block">
                {daySummary.winningCount} ឈ្នះ / {daySummary.losingCount} ចាញ់
              </span>
              <span className="text-[11px] opacity-75">
                {daySummary.tradesCount > 0
                  ? `${Math.round((daySummary.winningCount / daySummary.tradesCount) * 100)}% Win Rate`
                  : "0%"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onOpenAddTrade(daySummary.dateString)}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all ml-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>បន្ថែម Trade</span>
            </button>
          </div>
        </div>

        {/* List of Trades for this Date */}
        <div className="mt-6 space-y-5">
          {!hasTrades ? (
            <div className="py-10 text-center text-gray-400 space-y-2">
              <p className="text-sm">គ្មានការជួញដូរដែលបានកត់ត្រានៅក្នុងថ្ងៃនេះទេ។</p>
              <button
                type="button"
                onClick={() => onOpenAddTrade(daySummary.dateString)}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-sm hover:bg-emerald-600"
              >
                <Plus className="w-4 h-4" />
                <span>កត់ត្រា Trade លើកដំបូងសម្រាប់ថ្ងៃនេះ</span>
              </button>
            </div>
          ) : (
            daySummary.trades.map((trade, idx) => {
              const isWin = trade.pnl > 0;
              const isLoss = trade.pnl < 0;
              const isSell = trade.direction === "SELL" || trade.direction === "SHORT";
              const profitNum =
                trade.profit !== undefined
                  ? trade.profit
                  : trade.pnl > 0
                  ? trade.pnl
                  : 0;
              const lossNum =
                trade.loss !== undefined
                  ? trade.loss
                  : trade.pnl < 0
                  ? Math.abs(trade.pnl)
                  : 0;
              const confluences =
                trade.entryConfluences && trade.entryConfluences.length > 0
                  ? trade.entryConfluences
                  : trade.setup
                  ? [trade.setup]
                  : [];

              return (
                <div
                  key={trade.id}
                  className="bg-white dark:bg-[#181a24] border border-gray-200 dark:border-gray-800 rounded-3xl p-5 sm:p-6 shadow-sm hover:border-gray-300 dark:hover:border-gray-700 transition-all space-y-4"
                >
                  {/* Card Header: Trade #, Net P&L, Actions */}
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800/80">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-[#20222e] text-gray-800 dark:text-gray-200">
                        #{idx + 1}
                      </span>
                      <span className="text-sm font-black text-gray-900 dark:text-white">
                        {trade.symbol} • {isSell ? "Sell (Short)" : "Buy (Long)"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span
                          className={`text-base font-black leading-none block ${
                            isWin
                              ? "text-emerald-500"
                              : isLoss
                              ? "text-red-500"
                              : "text-gray-400"
                          }`}
                        >
                          {formatPnl(trade.pnl)}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold block">
                          {(trade.pnl * 4000).toLocaleString()} ៛
                        </span>
                      </div>

                      <div className="flex items-center gap-1 border-l pl-2 border-gray-200 dark:border-gray-800">
                        <button
                          type="button"
                          onClick={() => onEditTrade(trade)}
                          className="p-1.5 text-gray-400 hover:text-emerald-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title="កែប្រែ Trade"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTrade(trade.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title="លុប Trade"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Notion-Style Properties Inspector Table (Matching User's Exact Screenshot) */}
                  <div className="space-y-0.5 text-left font-sans">
                    
                    {/* 1. ACCOUNT */}
                    <div className="flex items-center py-2 border-b border-gray-100 dark:border-[#242634]/70">
                      <div className="w-36 sm:w-44 shrink-0 flex items-center gap-2.5 text-xs font-semibold text-gray-500 dark:text-[#9b9b9b]">
                        <User className="w-4 h-4 text-gray-400 dark:text-[#7f7f7f]" />
                        <span>ACCOUNT</span>
                      </div>
                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-gray-200 dark:bg-[#2b2d38] text-gray-700 dark:text-gray-300 font-black text-[10px] flex items-center justify-center shrink-0">
                          {(trade.account || "F")[0].toUpperCase()}
                        </span>
                        <span className="text-xs font-semibold text-gray-800 dark:text-[#d4d4d4] truncate">
                          {trade.account || "Funded"}
                        </span>
                      </div>
                    </div>

                    {/* 2. Pair */}
                    <div className="flex items-center py-2 border-b border-gray-100 dark:border-[#242634]/70">
                      <div className="w-36 sm:w-44 shrink-0 flex items-center gap-2.5 text-xs font-semibold text-gray-500 dark:text-[#9b9b9b]">
                        <ChevronDownCircle className="w-4 h-4 text-gray-400 dark:text-[#7f7f7f]" />
                        <span>Pair</span>
                      </div>
                      <div className="flex-1">
                        <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:bg-[#18342b] dark:text-[#6ee7b7] border border-emerald-500/20 dark:border-[#1b5b42]/40">
                          {trade.symbol}
                        </span>
                      </div>
                    </div>

                    {/* 3. Open */}
                    <div className="flex items-center py-2 border-b border-gray-100 dark:border-[#242634]/70">
                      <div className="w-36 sm:w-44 shrink-0 flex items-center gap-2.5 text-xs font-semibold text-gray-500 dark:text-[#9b9b9b]">
                        <Calendar className="w-4 h-4 text-gray-400 dark:text-[#7f7f7f]" />
                        <span>Open</span>
                      </div>
                      <div className="flex-1 text-xs text-gray-800 dark:text-[#d4d4d4] font-medium">
                        {formatNotionDate(trade.dateString)} {trade.time ? `@ ${trade.time}` : ""}
                      </div>
                    </div>

                    {/* 4. Close */}
                    <div className="flex items-center py-2 border-b border-gray-100 dark:border-[#242634]/70">
                      <div className="w-36 sm:w-44 shrink-0 flex items-center gap-2.5 text-xs font-semibold text-gray-500 dark:text-[#9b9b9b]">
                        <Calendar className="w-4 h-4 text-gray-400 dark:text-[#7f7f7f]" />
                        <span>Close</span>
                      </div>
                      <div className="flex-1 text-xs text-gray-800 dark:text-[#d4d4d4] font-medium">
                        {formatNotionDate(trade.closeDateString || trade.dateString)}{" "}
                        {trade.closeTime ? `@ ${trade.closeTime}` : ""}
                      </div>
                    </div>

                    {/* 5. Direction */}
                    <div className="flex items-center py-2 border-b border-gray-100 dark:border-[#242634]/70">
                      <div className="w-36 sm:w-44 shrink-0 flex items-center gap-2.5 text-xs font-semibold text-gray-500 dark:text-[#9b9b9b]">
                        <ChevronDownCircle className="w-4 h-4 text-gray-400 dark:text-[#7f7f7f]" />
                        <span>Direction</span>
                      </div>
                      <div className="flex-1">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                            isSell
                              ? "bg-red-500/15 text-red-600 dark:bg-[#381a1f] dark:text-[#f87171] border border-red-500/20 dark:border-[#7f1d1d]/40"
                              : "bg-emerald-500/15 text-emerald-700 dark:bg-[#18342b] dark:text-[#6ee7b7] border border-emerald-500/20 dark:border-[#1b5b42]/40"
                          }`}
                        >
                          {isSell ? "Sell" : "Buy"}
                        </span>
                      </div>
                    </div>

                    {/* 6. Session */}
                    <div className="flex items-center py-2 border-b border-gray-100 dark:border-[#242634]/70">
                      <div className="w-36 sm:w-44 shrink-0 flex items-center gap-2.5 text-xs font-semibold text-gray-500 dark:text-[#9b9b9b]">
                        <Layers className="w-4 h-4 text-gray-400 dark:text-[#7f7f7f]" />
                        <span>Session</span>
                      </div>
                      <div className="flex-1">
                        <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:bg-[#18342b] dark:text-[#6ee7b7] border border-emerald-500/20 dark:border-[#1b5b42]/40">
                          {trade.session || "New York AM"}
                        </span>
                      </div>
                    </div>

                    {/* 7. Entry Confluences (Setups & Models multi-select tags) */}
                    <div className="flex items-start py-2 border-b border-gray-100 dark:border-[#242634]/70">
                      <div className="w-36 sm:w-44 shrink-0 flex items-center gap-2.5 text-xs font-semibold text-gray-500 dark:text-[#9b9b9b] pt-1">
                        <List className="w-4 h-4 text-gray-400 dark:text-[#7f7f7f]" />
                        <span>Entry Con...</span>
                      </div>
                      <div className="flex-1 flex flex-wrap gap-1.5">
                        {confluences.length > 0 ? (
                          confluences.map((conf, cIdx) => (
                            <span
                              key={cIdx}
                              className={`px-2.5 py-0.5 rounded-md text-xs font-medium ${getNotionTagStyle(
                                conf
                              )}`}
                            >
                              {conf}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </div>
                    </div>

                    {/* 8. Risk/Reward */}
                    <div className="flex items-center py-2 border-b border-gray-100 dark:border-[#242634]/70">
                      <div className="w-36 sm:w-44 shrink-0 flex items-center gap-2.5 text-xs font-semibold text-gray-500 dark:text-[#9b9b9b]">
                        <SlidersHorizontal className="w-4 h-4 text-gray-400 dark:text-[#7f7f7f]" />
                        <span>Risk/Reward</span>
                      </div>
                      <div className="flex-1 text-xs text-gray-800 dark:text-[#d4d4d4] font-semibold">
                        {trade.riskReward || "1:4R"}
                      </div>
                    </div>

                    {/* 9. Profit */}
                    <div className="flex items-center py-2 border-b border-gray-100 dark:border-[#242634]/70">
                      <div className="w-36 sm:w-44 shrink-0 flex items-center gap-2.5 text-xs font-semibold text-gray-500 dark:text-[#9b9b9b]">
                        <Hash className="w-4 h-4 text-gray-400 dark:text-[#7f7f7f]" />
                        <span>Profit</span>
                      </div>
                      <div className="flex-1 flex items-center gap-3">
                        <span className="text-xs text-gray-800 dark:text-[#d4d4d4] font-bold">
                          ${profitNum.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <div className="w-36 sm:w-48 h-1 bg-gray-200 dark:bg-[#2b2d38] rounded-full overflow-hidden">
                          {profitNum > 0 && (
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{
                                width: `${Math.min(100, Math.max(15, (profitNum / 2000) * 100))}%`,
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 10. Loss */}
                    <div className="flex items-center py-2 border-b border-gray-100 dark:border-[#242634]/70">
                      <div className="w-36 sm:w-44 shrink-0 flex items-center gap-2.5 text-xs font-semibold text-gray-500 dark:text-[#9b9b9b]">
                        <Hash className="w-4 h-4 text-gray-400 dark:text-[#7f7f7f]" />
                        <span>Loss</span>
                      </div>
                      <div className="flex-1 flex items-center gap-3">
                        <span className="text-xs text-gray-800 dark:text-[#d4d4d4] font-bold">
                          ${lossNum.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <div className="w-36 sm:w-48 h-1 bg-gray-200 dark:bg-[#2b2d38] rounded-full overflow-hidden">
                          {lossNum > 0 && (
                            <div
                              className="h-full bg-red-500 rounded-full"
                              style={{
                                width: `${Math.min(100, Math.max(15, (lossNum / 2000) * 100))}%`,
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 11. Discipline */}
                    <div className="flex items-center py-2">
                      <div className="w-36 sm:w-44 shrink-0 flex items-center gap-2.5 text-xs font-semibold text-gray-500 dark:text-[#9b9b9b]">
                        <Sparkles className="w-4 h-4 text-gray-400 dark:text-[#7f7f7f]" />
                        <span>Discipline</span>
                      </div>
                      <div className="flex-1">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            trade.discipline === "Violated"
                              ? "bg-red-500/15 text-red-600 dark:bg-[#381a1f] dark:text-[#f87171] border border-red-500/20 dark:border-[#7f1d1d]/40"
                              : "bg-emerald-500/15 text-emerald-700 dark:bg-[#18342b] dark:text-[#6ee7b7] border border-emerald-500/20 dark:border-[#1b5b42]/40"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              trade.discipline === "Violated" ? "bg-red-500" : "bg-emerald-500"
                            }`}
                          />
                          <span>{trade.discipline === "Violated" ? "Violated" : "Done"}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Notes & Execution Review */}
                  {trade.notes && (
                    <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#12141c] border border-gray-200/80 dark:border-gray-800/80 text-xs text-gray-700 dark:text-gray-300 leading-relaxed space-y-1">
                      <span className="font-bold text-gray-400 text-[10px] uppercase tracking-wider block">
                        កំណត់ចំណាំ (Notes & Execution Review)៖
                      </span>
                      <p className="font-normal">{trade.notes}</p>
                    </div>
                  )}

                  {/* Attached Screenshots Preview */}
                  {trade.imageUrls && trade.imageUrls.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[10px] text-gray-400 flex items-center gap-1.5 mb-2 font-bold uppercase tracking-wider">
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                        <span>រូបថតតារាងតម្លៃ (Chart Screenshots - {trade.imageUrls.length})៖</span>
                      </span>
                      <div className="flex flex-wrap gap-2.5">
                        {trade.imageUrls.map((imgRef, i) => {
                          const src = resolvedImages[imgRef] || imgRef;
                          return (
                            <div
                              key={i}
                              onClick={() => onViewImage(src)}
                              className="relative group/img cursor-pointer rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 w-28 h-20 bg-gray-100 dark:bg-gray-800 hover:ring-2 hover:ring-emerald-500 transition-all shadow-sm"
                            >
                              <img
                                src={src}
                                alt={`Chart ${i + 1}`}
                                className="w-full h-full object-cover group-hover/img:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>ពង្រីក</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
