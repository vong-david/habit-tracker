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
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
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
        <div className="mt-5 space-y-3">
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

              return (
                <div
                  key={trade.id}
                  className="p-4 bg-gray-50/80 dark:bg-[#181a26] border border-gray-200 dark:border-gray-800/80 rounded-2xl shadow-xs hover:border-gray-300 dark:hover:border-gray-700 transition-all space-y-3"
                >
                  {/* Row 1: Account, Pair, Direction, Session, Discipline, Net P&L, Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Account: Funded or Live */}
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border flex items-center gap-1.5 ${
                          (trade.account || "Funded").toLowerCase().includes("live")
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                            : "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30"
                        }`}
                      >
                        <span>
                          {(trade.account || "Funded").toLowerCase().includes("live")
                            ? "🟢 Live"
                            : "💼 Funded"}
                        </span>
                      </span>

                      {/* Pair / Symbol */}
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        {trade.symbol}
                      </span>

                      {/* Direction: Sell (Red) vs Buy (Green) */}
                      <span
                        className={`text-[11px] font-extrabold px-2 py-0.5 rounded-lg flex items-center gap-0.5 ${
                          isSell
                            ? "bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30"
                            : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {isSell ? (
                          <ArrowDownRight className="w-3.5 h-3.5 stroke-[3]" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
                        )}
                        <span>{isSell ? "Sell" : "Buy"}</span>
                      </span>

                      {/* Session */}
                      {trade.session && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {trade.session}
                        </span>
                      )}

                      {/* Discipline */}
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          trade.discipline === "Violated"
                            ? "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30"
                            : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            trade.discipline === "Violated" ? "bg-red-500" : "bg-emerald-500"
                          }`}
                        />
                        <span>{trade.discipline || "Done"}</span>
                      </span>
                    </div>

                    {/* Actions and Net P&L */}
                    <div className="flex items-center gap-2.5">
                      <div className="text-right">
                        <span
                          className={`text-base sm:text-lg font-black block leading-tight ${
                            isWin
                              ? "text-emerald-500"
                              : isLoss
                              ? "text-red-500"
                              : "text-gray-400"
                          }`}
                        >
                          {formatPnl(trade.pnl)}
                        </span>
                        {(trade.profit !== undefined || trade.loss !== undefined) && (
                          <span className="text-[10px] text-gray-400">
                            {trade.profit ? `+$${trade.profit}` : "$0"} / {trade.loss ? `-$${trade.loss}` : "$0"}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 border-l pl-2 border-gray-200 dark:border-gray-700">
                        <button
                          type="button"
                          onClick={() => onEditTrade(trade)}
                          className="p-1.5 text-gray-400 hover:text-emerald-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title="កែប្រែ Trade"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTrade(trade.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title="លុប Trade"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Open Date, Close Date, Risk/Reward */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-800/60">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span>Open:</span>
                      <strong className="text-gray-800 dark:text-gray-200">
                        {trade.dateString} {trade.time ? `@${trade.time}` : ""}
                      </strong>
                    </span>

                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span>Close:</span>
                      <strong className="text-gray-800 dark:text-gray-200">
                        {trade.closeDateString || trade.dateString} {trade.closeTime ? `@${trade.closeTime}` : ""}
                      </strong>
                    </span>

                    {trade.riskReward && (
                      <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20 text-[11px]">
                        R:R {trade.riskReward}
                      </span>
                    )}
                  </div>

                  {/* Row 3: Entry Confluences (Setups & Models pills matching Notion) */}
                  {((trade.entryConfluences && trade.entryConfluences.length > 0) || trade.setup) && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {trade.entryConfluences && trade.entryConfluences.length > 0 ? (
                        trade.entryConfluences.map((conf, cIdx) => (
                          <span
                            key={cIdx}
                            className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25"
                          >
                            {conf}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {trade.setup}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {trade.notes && (
                    <p className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-[#12141c] p-2.5 rounded-xl border border-gray-200/80 dark:border-gray-800/80 leading-relaxed font-normal">
                      {trade.notes}
                    </p>
                  )}

                  {/* Attached Screenshots Preview */}
                  {trade.imageUrls && trade.imageUrls.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[10px] text-gray-400 flex items-center gap-1 mb-1.5 font-semibold">
                        <ImageIcon className="w-3 h-3 text-emerald-500" />
                        <span>រូបថតតារាងតម្លៃ (Chart Screenshots)៖</span>
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {trade.imageUrls.map((imgRef, i) => {
                          const src = resolvedImages[imgRef] || imgRef;
                          return (
                            <div
                              key={i}
                              onClick={() => onViewImage(src)}
                              className="relative group/img cursor-pointer rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 w-24 h-16 sm:w-28 sm:h-20 bg-gray-100 dark:bg-gray-800 hover:ring-2 hover:ring-emerald-500 transition-all shadow-sm"
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
