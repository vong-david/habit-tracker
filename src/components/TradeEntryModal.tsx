"use client";

import React, { useState, useEffect, useRef } from "react";
import { Trade, TradeDirection, TradeOutcome, TradeDiscipline } from "@/types/trading";
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
  Trash2,
  Calendar,
  Clock,
  User,
  Layers,
  Tag,
  Target,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface TradeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDateString: string;
  tradeToEdit: Trade | null;
  onSaveTrade: (trade: Omit<Trade, "id" | "createdAt">, id?: string) => void;
}

const COMMON_ACCOUNTS = ["Thun Tula", "Personal", "Funded 50K", "Apex", "Topstep"];
const COMMON_PAIRS = ["XAUUSD", "NQ", "ES", "EURUSD", "BTC", "GBPUSD", "SOL"];
const COMMON_SESSIONS = ["New York AM", "London", "New York PM", "Asian", "Pre-Market"];
const COMMON_RR = ["1:2R", "1:3R", "1:4R", "1:5R", "1:1.5R", "1:2.5R"];

const PRESET_CONFLUENCES = [
  { name: "Liquidity Sweep", color: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  { name: "HTF-Bias", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
  { name: "Sell-Side Imbalance Buy-Side Inefficiency (SIBI)", color: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30" },
  { name: "Buy-Side Imbalance Sell-Side Inefficiency (BISI)", color: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30" },
  { name: "FVG/ Silver Bullet 09:00 PM – 10:00 PM", color: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30" },
  { name: "Fair Value Gap (FVG)", color: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30" },
  { name: "Order Block (OB)", color: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30" },
  { name: "Breaker Block", color: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30" },
  { name: "Market Structure Shift (MSS)", color: "bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30" },
];

export const TradeEntryModal: React.FC<TradeEntryModalProps> = ({
  isOpen,
  onClose,
  defaultDateString,
  tradeToEdit,
  onSaveTrade,
}) => {
  // 1. Account
  const [account, setAccount] = useState<string>("Thun Tula");

  // 2. Pair / Symbol
  const [symbol, setSymbol] = useState<string>("XAUUSD");

  // 3. Open & Close Date/Time
  const [openDate, setOpenDate] = useState<string>(defaultDateString);
  const [openTime, setOpenTime] = useState<string>("09:30");
  const [closeDate, setCloseDate] = useState<string>(defaultDateString);
  const [closeTime, setCloseTime] = useState<string>("10:30");

  // 4. Direction: Buy (Long) vs Sell (Short)
  const [direction, setDirection] = useState<TradeDirection>("SELL");

  // 5. Session
  const [session, setSession] = useState<string>("New York AM");

  // 6. Entry Confluences (Multi-select tags)
  const [selectedConfluences, setSelectedConfluences] = useState<string[]>([
    "Liquidity Sweep",
    "HTF-Bias",
  ]);
  const [customTagInput, setCustomTagInput] = useState<string>("");

  // 7. Risk / Reward
  const [riskReward, setRiskReward] = useState<string>("1:4R");

  // 8. Profit & Loss amounts
  const [profitStr, setProfitStr] = useState<string>("1490.00");
  const [lossStr, setLossStr] = useState<string>("0.00");

  // 9. Discipline: Done vs Violated
  const [discipline, setDiscipline] = useState<TradeDiscipline>("Done");

  // 10. Additional fields: Quantity, Notes, Images
  const [quantityStr, setQuantityStr] = useState<string>("1");
  const [notes, setNotes] = useState<string>("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (tradeToEdit) {
        setAccount(tradeToEdit.account || "Thun Tula");
        setSymbol(tradeToEdit.symbol || "XAUUSD");
        setOpenDate(tradeToEdit.dateString || defaultDateString);
        setCloseDate(tradeToEdit.closeDateString || tradeToEdit.dateString || defaultDateString);
        setOpenTime(tradeToEdit.time || "09:30");
        setCloseTime(tradeToEdit.closeTime || "10:30");
        setDirection(tradeToEdit.direction || (tradeToEdit.pnl >= 0 ? "BUY" : "SELL"));
        setSession(tradeToEdit.session || "New York AM");

        if (tradeToEdit.entryConfluences && tradeToEdit.entryConfluences.length > 0) {
          setSelectedConfluences(tradeToEdit.entryConfluences);
        } else if (tradeToEdit.setup) {
          setSelectedConfluences([tradeToEdit.setup]);
        } else {
          setSelectedConfluences(["Liquidity Sweep", "HTF-Bias"]);
        }

        setRiskReward(tradeToEdit.riskReward || "1:4R");

        if (tradeToEdit.profit !== undefined || tradeToEdit.loss !== undefined) {
          setProfitStr(tradeToEdit.profit !== undefined ? tradeToEdit.profit.toString() : "0.00");
          setLossStr(tradeToEdit.loss !== undefined ? tradeToEdit.loss.toString() : "0.00");
        } else {
          if (tradeToEdit.pnl >= 0) {
            setProfitStr(tradeToEdit.pnl.toString());
            setLossStr("0.00");
          } else {
            setProfitStr("0.00");
            setLossStr(Math.abs(tradeToEdit.pnl).toString());
          }
        }

        setDiscipline(tradeToEdit.discipline || (tradeToEdit.mistake?.includes("Followed") ? "Done" : "Done"));
        setQuantityStr(tradeToEdit.quantity ? tradeToEdit.quantity.toString() : "1");
        setNotes(tradeToEdit.notes || "");
        setImageUrls(tradeToEdit.imageUrls || []);

        if (tradeToEdit.imageUrls) {
          tradeToEdit.imageUrls.forEach(async (id) => {
            const url = await getTradeImage(id);
            if (url) {
              setPreviewUrls((prev) => ({ ...prev, [id]: url }));
            }
          });
        }
      } else {
        setAccount("Thun Tula");
        setSymbol("XAUUSD");
        setOpenDate(defaultDateString);
        setCloseDate(defaultDateString);
        setOpenTime(new Date().toTimeString().slice(0, 5));
        setCloseTime(new Date(Date.now() + 45 * 60000).toTimeString().slice(0, 5));
        setDirection("SELL");
        setSession("New York AM");
        setSelectedConfluences([
          "Liquidity Sweep",
          "HTF-Bias",
          "Sell-Side Imbalance Buy-Side Inefficiency (SIBI)",
          "FVG/ Silver Bullet 09:00 PM – 10:00 PM",
        ]);
        setRiskReward("1:4R");
        setProfitStr("1490.00");
        setLossStr("0.00");
        setDiscipline("Done");
        setQuantityStr("1");
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

  // Toggle Confluence tag
  const handleToggleConfluence = (tag: string) => {
    setSelectedConfluences((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && customTagInput.trim()) {
      e.preventDefault();
      const newTag = customTagInput.trim();
      if (!selectedConfluences.includes(newTag)) {
        setSelectedConfluences((prev) => [...prev, newTag]);
      }
      setCustomTagInput("");
    }
  };

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

  // Calculate Net P&L
  const profitNum = parseFloat(profitStr) || 0;
  const lossNum = parseFloat(lossStr) || 0;
  const netPnl = Number((profitNum - lossNum).toFixed(2));
  const outcome: TradeOutcome = netPnl > 0 ? "WIN" : netPnl < 0 ? "LOSS" : "BE";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const tradeData: Omit<Trade, "id" | "createdAt"> = {
      account: account.trim() || "Thun Tula",
      symbol: symbol.trim().toUpperCase(),
      dateString: openDate,
      closeDateString: closeDate || openDate,
      time: openTime,
      closeTime,
      direction,
      session,
      entryConfluences: selectedConfluences,
      riskReward,
      profit: profitNum,
      loss: lossNum,
      pnl: netPnl,
      outcome,
      discipline,
      quantity: quantityStr ? parseFloat(quantityStr) : 1,
      setup: selectedConfluences.join(" | "),
      mistake: discipline === "Done" ? "Followed Rules 100%" : "Violated Rules",
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
        className="bg-white dark:bg-[#151722] border border-gray-200 dark:border-gray-800 w-full max-w-2xl rounded-3xl p-5 sm:p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-bold flex items-center justify-center text-lg">
              📈
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                {tradeToEdit ? "កែប្រែ Trade (Edit Trade)" : "កត់ត្រា Trade ថ្មី (Log Trade)"}
              </h3>
              <p className="text-xs text-gray-400">
                Notion Journal Fields: Account • Pair • Direction • Session • Confluences • R:R • P&L
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          {/* 1. ACCOUNT & PAIR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Account */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-500" />
                  <span>ACCOUNT (គណនី)</span>
                </label>
                <div className="flex gap-1">
                  {COMMON_ACCOUNTS.slice(0, 3).map((acc) => (
                    <button
                      key={acc}
                      type="button"
                      onClick={() => setAccount(acc)}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-emerald-500"
                    >
                      {acc}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="text"
                required
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="ឧ. Thun Tula, Personal, Apex..."
                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold text-gray-900 dark:text-white outline-none focus:border-emerald-500"
              />
            </div>

            {/* Pair (Symbol) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Pair (គូជួញដូរ)</span>
                </label>
                <div className="flex gap-1">
                  {COMMON_PAIRS.slice(0, 4).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSymbol(p)}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold hover:bg-emerald-500/20"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="text"
                required
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="ឧ. XAUUSD, NQ, ES, EURUSD..."
                className="w-full px-3 py-2 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-black text-emerald-700 dark:text-emerald-300 outline-none focus:border-emerald-500 uppercase"
              />
            </div>
          </div>

          {/* 2. DATES: OPEN & CLOSE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50/60 dark:bg-[#12141c]/60 border border-gray-200 dark:border-gray-800 rounded-2xl">
            {/* Open Date & Time */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>Open Date (ថ្ងៃបើក)</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  required
                  value={openDate}
                  onChange={(e) => setOpenDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-[#181a24] border border-gray-200 dark:border-gray-800 rounded-lg text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                />
                <input
                  type="time"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  className="w-24 px-2 py-1.5 bg-white dark:bg-[#181a24] border border-gray-200 dark:border-gray-800 rounded-lg text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Close Date & Time */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-purple-500" />
                <span>Close Date (ថ្ងៃបិទ)</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={closeDate}
                  onChange={(e) => setCloseDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-[#181a24] border border-gray-200 dark:border-gray-800 rounded-lg text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                />
                <input
                  type="time"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  className="w-24 px-2 py-1.5 bg-white dark:bg-[#181a24] border border-gray-200 dark:border-gray-800 rounded-lg text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* 3. DIRECTION & SESSION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Direction: Sell (Red) vs Buy (Green) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Direction (ទិសដៅ)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDirection("SELL")}
                  className={`py-2 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                    direction === "SELL" || direction === "SHORT"
                      ? "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500 shadow-sm"
                      : "bg-gray-50 dark:bg-[#181a24] border-gray-200 dark:border-gray-800 text-gray-500 hover:border-red-500/40"
                  }`}
                >
                  <TrendingDown className="w-4 h-4 stroke-[2.5]" />
                  <span>Sell (Short)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDirection("BUY")}
                  className={`py-2 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                    direction === "BUY" || direction === "LONG"
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500 shadow-sm"
                      : "bg-gray-50 dark:bg-[#181a24] border-gray-200 dark:border-gray-800 text-gray-500 hover:border-emerald-500/40"
                  }`}
                >
                  <TrendingUp className="w-4 h-4 stroke-[2.5]" />
                  <span>Buy (Long)</span>
                </button>
              </div>
            </div>

            {/* Session */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Session (ពេលវេលាទីផ្សារ)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_SESSIONS.map((sess) => (
                  <button
                    key={sess}
                    type="button"
                    onClick={() => setSession(sess)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      session === sess
                        ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500 shadow-xs"
                        : "bg-gray-50 dark:bg-[#181a24] border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-emerald-500/40"
                    }`}
                  >
                    {sess}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. ENTRY CONFLUENCES (Multi-select Tags from User Notion Screenshot) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-500" />
                <span>Entry Confluences (Setups & Models)</span>
              </label>
              <span className="text-[10px] text-gray-400">
                ជ្រើសរើសបានច្រើន (Multi-Select)
              </span>
            </div>

            {/* Clickable Preset Chips */}
            <div className="flex flex-wrap gap-1.5">
              {PRESET_CONFLUENCES.map((c) => {
                const isSelected = selectedConfluences.includes(c.name);
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => handleToggleConfluence(c.name)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? `${c.color} shadow-xs font-bold`
                        : "bg-gray-50 dark:bg-[#181a24] border-gray-200 dark:border-gray-800 text-gray-500 hover:text-gray-800 dark:hover:text-white"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Confluence Tag Input */}
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={handleAddCustomTag}
                placeholder="+ បញ្ចូល Setup ផ្សេងទៀត រួចចុច Enter..."
                className="w-full px-3 py-1.5 bg-gray-50 dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* 5. RISK/REWARD & DISCIPLINE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Risk / Reward */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-blue-500" />
                  <span>Risk/Reward (1:R)</span>
                </label>
                <div className="flex gap-1">
                  {COMMON_RR.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRiskReward(r)}
                      className="text-[10px] px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-blue-500 font-bold"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="text"
                value={riskReward}
                onChange={(e) => setRiskReward(e.target.value)}
                placeholder="1:4R"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-blue-500"
              />
            </div>

            {/* Discipline: Done vs Violated */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Discipline (វិន័យអនុវត្តតាមផែនការ)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDiscipline("Done")}
                  className={`py-2 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                    discipline === "Done"
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500 shadow-sm"
                      : "bg-gray-50 dark:bg-[#181a24] border-gray-200 dark:border-gray-800 text-gray-500"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Done (គោរពវិន័យ)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDiscipline("Violated")}
                  className={`py-2 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                    discipline === "Violated"
                      ? "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500 shadow-sm"
                      : "bg-gray-50 dark:bg-[#181a24] border-gray-200 dark:border-gray-800 text-gray-500"
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Violated (បំពានវិន័យ)</span>
                </button>
              </div>
            </div>
          </div>

          {/* 6. PROFIT ($) & LOSS ($) INPUTS (Exact User Notion UI) */}
          <div className="p-3.5 bg-gray-50/80 dark:bg-[#12141c]/80 border border-gray-200 dark:border-gray-800 rounded-2xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Profit */}
              <div>
                <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                  # Profit (ប្រាក់ចំណេញ $ USD)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-500 font-bold text-sm">
                    +$
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={profitStr}
                    onChange={(e) => {
                      setProfitStr(e.target.value);
                      if (parseFloat(e.target.value) > 0) setLossStr("0.00");
                    }}
                    placeholder="1490.00"
                    className="w-full pl-8 pr-3 py-2 bg-white dark:bg-[#181a24] border border-emerald-500/30 rounded-xl text-sm font-black text-emerald-600 dark:text-emerald-400 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Loss */}
              <div>
                <label className="block text-xs font-bold text-red-600 dark:text-red-400 mb-1">
                  # Loss (ប្រាក់ខាត $ USD)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-red-500 font-bold text-sm">
                    -$
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={lossStr}
                    onChange={(e) => {
                      setLossStr(e.target.value);
                      if (parseFloat(e.target.value) > 0) setProfitStr("0.00");
                    }}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2 bg-white dark:bg-[#181a24] border border-red-500/30 rounded-xl text-sm font-black text-red-600 dark:text-red-400 outline-none focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Calculated Net P&L Indicator Bar */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">
                លទ្ធផលសុទ្ធ (Net P&L):
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-base font-black ${
                    netPnl > 0
                      ? "text-emerald-500"
                      : netPnl < 0
                      ? "text-red-500"
                      : "text-gray-400"
                  }`}
                >
                  {netPnl >= 0 ? `+$${netPnl.toFixed(2)}` : `-$${Math.abs(netPnl).toFixed(2)}`}
                </span>
                <span className="text-xs text-gray-400">
                  ({(netPnl * 4000).toLocaleString()} ៛)
                </span>
              </div>
            </div>
          </div>

          {/* 7. NOTES & REVIEW */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              កំណត់ចំណាំ & ការវិភាគ (Notes / Execution Review)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Sweep London low មុនពេល New York run..."
              className="w-full px-3 py-2 bg-gray-50 dark:bg-[#12141c] border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-emerald-500 transition-all resize-none"
            />
          </div>

          {/* 8. SCREENSHOTS (Ctrl+V Paste) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-500" />
                <span>រូបថតតារាង Chart (Screenshots)</span>
              </label>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                💡 អាចចុច Ctrl + V ដើម្បីបិទភ្ជាប់ភ្លាមៗ
              </span>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-emerald-500/50 rounded-2xl p-3.5 text-center cursor-pointer transition-all bg-gray-50/50 dark:bg-[#12141c]/50 hover:bg-emerald-500/5 group"
            >
              <div className="flex flex-col items-center gap-1">
                <Upload className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                  ចុចដើម្បីជ្រើសរើសរូបភាព ឬ <strong>Ctrl + V</strong> លើផ្ទាំងនេះ
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

            {imageUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
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

          {/* Action Buttons */}
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
