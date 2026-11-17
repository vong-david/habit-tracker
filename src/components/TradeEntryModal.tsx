"use client";

import React, { useState, useEffect, useRef } from "react";
import { Trade, TradeDirection, TradeOutcome } from "@/types/trading";
import { saveTradeImage, deleteTradeImage, getTradeImage } from "@/lib/tradeImageStorage";
import {
  X,
  Plus,
  Check,
  TrendingUp,
  TrendingDown,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Clipboard,
  Trash2,
  DollarSign,
} from "lucide-react";

interface TradeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDateString: string;
  tradeToEdit: Trade | null;
  onSaveTrade: (trade: Omit<Trade, "id" | "createdAt">, id?: string) => void;
}

const COMMON_SYMBOLS = ["NQ", "ES", "XAUUSD", "BTC", "EURUSD", "SOL"];

const COMMON_SETUPS = [
  "Fair Value Gap (FVG)",
  "Liquidity Sweep",
  "Breakout",
  "Order Block",
  "Trend Continuation",
  "Support & Resistance",
  "Opening Range Breakout",
  "Pullback / Retracement",
];

const COMMON_MISTAKES = [
  "Followed Rules 100%",
  "FOMO / Chasing",
  "Early Exit",
  "Revenge Trade",
  "Overleveraged",
  "Bad Risk/Reward",
  "Patient Execution",
];

export const TradeEntryModal: React.FC<TradeEntryModalProps> = ({
  isOpen,
  onClose,
  defaultDateString,
  tradeToEdit,
  onSaveTrade,
}) => {
  const [dateString, setDateString] = useState<string>(defaultDateString);
  const [time, setTime] = useState<string>("09:30");
  const [symbol, setSymbol] = useState<string>("NQ");
  const [direction, setDirection] = useState<TradeDirection>("LONG");
  const [outcome, setOutcome] = useState<TradeOutcome>("WIN");
  const [pnlStr, setPnlStr] = useState<string>("");
  const [quantityStr, setQuantityStr] = useState<string>("1");
  const [entryPriceStr, setEntryPriceStr] = useState<string>("");
  const [exitPriceStr, setExitPriceStr] = useState<string>("");
  const [setup, setSetup] = useState<string>("Fair Value Gap (FVG)");
  const [mistake, setMistake] = useState<string>("Followed Rules 100%");
  const [notes, setNotes] = useState<string>("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (tradeToEdit) {
        setDateString(tradeToEdit.dateString);
        setTime(tradeToEdit.time || "09:30");
        setSymbol(tradeToEdit.symbol);
        setDirection(tradeToEdit.direction);
        setOutcome(tradeToEdit.outcome);
        setPnlStr(Math.abs(tradeToEdit.pnl).toString());
        setQuantityStr(tradeToEdit.quantity ? tradeToEdit.quantity.toString() : "1");
        setEntryPriceStr(tradeToEdit.entryPrice ? tradeToEdit.entryPrice.toString() : "");
        setExitPriceStr(tradeToEdit.exitPrice ? tradeToEdit.exitPrice.toString() : "");
        setSetup(tradeToEdit.setup || "");
        setMistake(tradeToEdit.mistake || "Followed Rules 100%");
        setNotes(tradeToEdit.notes || "");
        setImageUrls(tradeToEdit.imageUrls || []);

        // Load preview urls
        if (tradeToEdit.imageUrls) {
          tradeToEdit.imageUrls.forEach(async (id) => {
            const url = await getTradeImage(id);
            if (url) {
              setPreviewUrls((prev) => ({ ...prev, [id]: url }));
            }
          });
        }
      } else {
        setDateString(defaultDateString);
        setTime(new Date().toTimeString().slice(0, 5));
        setSymbol("NQ");
        setDirection("LONG");
        setOutcome("WIN");
        setPnlStr("");
        setQuantityStr("1");
        setEntryPriceStr("");
        setExitPriceStr("");
        setSetup("Fair Value Gap (FVG)");
        setMistake("Followed Rules 100%");
        setNotes("");
        setImageUrls([]);
        setPreviewUrls({});
      }
    }
  }, [isOpen, tradeToEdit, defaultDateString]);

  // Support paste from clipboard (Ctrl + V)
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf("image") !== -1) {
          const file = item.getAsFile();
          if (file) {
            setIsProcessingImage(true);
            try {
              const imageId = await saveTradeImage(file);
              const preview = await getTradeImage(imageId);
              setImageUrls((prev) => [...prev, imageId]);
              if (preview) {
                setPreviewUrls((prev) => ({ ...prev, [imageId]: preview }));
              }
            } catch (err) {
              console.error("Paste image error", err);
            } finally {
              setIsProcessingImage(false);
            }
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingImage(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const imageId = await saveTradeImage(file);
        const preview = await getTradeImage(imageId);
        setImageUrls((prev) => [...prev, imageId]);
        if (preview) {
          setPreviewUrls((prev) => ({ ...prev, [imageId]: preview }));
        }
      }
    } catch (err) {
      console.error("Upload error", err);
    } finally {
      setIsProcessingImage(false);
      e.target.value = "";
    }
  };

  const handleRemoveImage = (imgId: string) => {
    setImageUrls((prev) => prev.filter((id) => id !== imgId));
    deleteTradeImage(imgId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawPnl = parseFloat(pnlStr);
    if (isNaN(rawPnl)) return;

    let finalPnl = Math.abs(rawPnl);
    if (outcome === "LOSS") finalPnl = -finalPnl;
    if (outcome === "BE") finalPnl = 0;

    const tradeData: Omit<Trade, "id" | "createdAt"> = {
      dateString,
      time,
      symbol: symbol.trim().toUpperCase(),
      direction,
      outcome,
      pnl: finalPnl,
      quantity: quantityStr ? parseFloat(quantityStr) : undefined,
      entryPrice: entryPriceStr ? parseFloat(entryPriceStr) : undefined,
      exitPrice: exitPriceStr ? parseFloat(exitPriceStr) : undefined,
      setup: setup.trim() || undefined,
      mistake: mistake.trim() || undefined,
      notes: notes.trim() || undefined,
      imageUrls,
    };

    onSaveTrade(tradeData, tradeToEdit?.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#151722] border border-gray-200 dark:border-gray-800 w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 font-bold text-lg">
              📈
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                {tradeToEdit ? "កែប្រែ Trade (Edit Trade)" : "កត់ត្រា Trade ថ្មី (Log Trade)"}
              </h3>
              <p className="text-[11px] text-gray-400">Trading Journal Entry</p>
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                កាលបរិច្ឆេទ (Date) *
              </label>
              <input
                type="date"
                required
                value={dateString}
                onChange={(e) => setDateString(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                ម៉ោង (Time)
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Asset / Symbol */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                ទ្រព្យជួញដូរ (Symbol / Asset) *
              </label>
              <div className="flex gap-1">
                {COMMON_SYMBOLS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSymbol(s)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-emerald-500"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="text"
              required
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="ឧ. NQ, ES, Gold, BTC..."
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-bold text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-emerald-500 transition-all uppercase"
            />
          </div>

          {/* Direction: LONG vs SHORT */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              ទិសដៅ Trade (Direction)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDirection("LONG")}
                className={`py-2 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                  direction === "LONG"
                    ? "bg-emerald-500 text-slate-950 border-emerald-500 shadow-sm"
                    : "bg-gray-50 dark:bg-[#181a24] border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400"
                }`}
              >
                <TrendingUp className="w-4 h-4 stroke-[2.5]" />
                <span>LONG (BUY)</span>
              </button>

              <button
                type="button"
                onClick={() => setDirection("SHORT")}
                className={`py-2 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                  direction === "SHORT"
                    ? "bg-red-500 text-white border-red-500 shadow-sm"
                    : "bg-gray-50 dark:bg-[#181a24] border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400"
                }`}
              >
                <TrendingDown className="w-4 h-4 stroke-[2.5]" />
                <span>SHORT (SELL)</span>
              </button>
            </div>
          </div>

          {/* Outcome & P&L Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                ទឹកប្រាក់ចំណេញ/ខាត (Net P&L in USD) *
              </label>

              {/* Outcome Toggle (WIN, LOSS, BE) */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#181a24] p-0.5 rounded-lg border border-gray-200 dark:border-gray-800 text-xs">
                <button
                  type="button"
                  onClick={() => setOutcome("WIN")}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                    outcome === "WIN"
                      ? "bg-emerald-500 text-slate-950"
                      : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  ឈ្នះ (WIN)
                </button>
                <button
                  type="button"
                  onClick={() => setOutcome("LOSS")}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                    outcome === "LOSS"
                      ? "bg-red-500 text-white"
                      : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  ខាត (LOSS)
                </button>
                <button
                  type="button"
                  onClick={() => setOutcome("BE")}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                    outcome === "BE"
                      ? "bg-gray-400 text-white"
                      : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  រួចខ្លួន (BE)
                </button>
              </div>
            </div>

            <div className="relative">
              <div
                className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none font-bold text-base ${
                  outcome === "WIN"
                    ? "text-emerald-500"
                    : outcome === "LOSS"
                    ? "text-red-500"
                    : "text-gray-400"
                }`}
              >
                {outcome === "WIN" ? "+$" : outcome === "LOSS" ? "-$" : "$"}
              </div>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={pnlStr}
                onChange={(e) => setPnlStr(e.target.value)}
                placeholder="0.00"
                className={`w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-[#12141c] border-2 rounded-xl text-lg font-black outline-none transition-all ${
                  outcome === "WIN"
                    ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 focus:border-emerald-500"
                    : outcome === "LOSS"
                    ? "border-red-500/30 text-red-600 dark:text-red-400 focus:border-red-500"
                    : "border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white"
                }`}
              />
            </div>
          </div>

          {/* Strategy / Setup & Psychology Mistakes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                យុទ្ធសាស្ត្រ (Strategy / Setup)
              </label>
              <select
                value={setup}
                onChange={(e) => setSetup(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500"
              >
                {COMMON_SETUPS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                ផ្លូវចិត្ត / វិន័យ (Psychology)
              </label>
              <select
                value={mistake}
                onChange={(e) => setMistake(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500"
              >
                {COMMON_MISTAKES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              កំណត់ចំណាំ & ការវិភាគ (Notes & Review)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="កត់ត្រាការវិភាគ ហេតុផលចូល Order ឬមេរៀនដែលទទួលបានពី Trade នេះ..."
              className="w-full px-3 py-2 bg-gray-50 dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-emerald-500 transition-all resize-none"
            />
          </div>

          {/* Screenshot Upload & Paste (Solving the image storage problem) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-500" />
                <span>រូបថតតារាង Chart (Screenshots)</span>
              </label>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                💡 អាចចុច Ctrl + V ដើម្បីបិទភ្ជាប់ (Paste) ភ្លាមៗ
              </span>
            </div>

            {/* Upload Area / Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-emerald-500/50 rounded-2xl p-4 text-center cursor-pointer transition-all bg-gray-50/50 dark:bg-[#12141c]/50 hover:bg-emerald-500/5 group"
            >
              <div className="flex flex-col items-center gap-1.5">
                <Upload className="w-6 h-6 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                  ចុចដើម្បីជ្រើសរើសរូបភាព ឬ <strong>Ctrl + V</strong> លើផ្ទាំងនេះ
                </p>
                <p className="text-[10px] text-gray-400">
                  រូបភាពត្រូវបាន Compress និងរក្សាទុកក្នុង IndexedDB ដោយស្វ័យប្រវត្តិ
                </p>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              multiple
              className="hidden"
            />

            {/* Previews of attached images */}
            {imageUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2.5">
                {imageUrls.map((imgId) => {
                  const src = previewUrls[imgId] || imgId;
                  return (
                    <div
                      key={imgId}
                      className="relative w-20 h-16 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 group/item shadow-xs"
                    >
                      <img src={src} alt="Trade Screenshot" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(imgId)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-red-600 text-white opacity-0 group-hover/item:opacity-100 transition-opacity"
                        title="លុបរូបភាព"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              type="submit"
              disabled={isProcessingImage}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-slate-950 font-bold text-xs py-3 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{tradeToEdit ? "កែប្រែ Trade" : "រក្សាទុក Trade (Save Trade)"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl text-xs text-gray-600 dark:text-gray-400 transition-colors"
            >
              បោះបង់
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
