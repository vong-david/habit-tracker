import { Trade, TradingStats, DayTradesSummary } from "@/types/trading";

const TRADES_STORAGE_KEY = "habit_tracker_trades_v1";

function getScopedKey(baseKey: string, userId?: string): string {
  return `${baseKey}_${userId || "guest"}`;
}

export const SAMPLE_TRADES: Trade[] = [
  {
    id: "trade_sample_0",
    account: "Funded",
    symbol: "XAUUSD",
    dateString: "2026-11-18",
    closeDateString: "2026-11-18",
    time: "21:15",
    direction: "SELL",
    session: "New York AM",
    entryConfluences: [
      "Liquidity Sweep",
      "HTF-Bias",
      "Sell-Side Imbalance (SIBI)",
      "Silver Bullet (NY)",
    ],
    riskReward: "1:4R",
    profit: 1490.0,
    loss: 0.0,
    pnl: 1490.0,
    outcome: "WIN",
    discipline: "Done",
    quantity: 1,
    entryPrice: 2615.5,
    exitPrice: 2600.6,
    setup: "Silver Bullet / SIBI",
    mistake: "Followed Rules 100%",
    notes: "Trade យ៉ាងល្អឥតខ្ចោះតាម Setup! London liquidity sweep រួច sell ចំ NY Silver Bullet window",
    createdAt: new Date().toISOString(),
  },
  {
    id: "trade_sample_1",
    account: "Live",
    dateString: "2026-11-17",
    closeDateString: "2026-11-17",
    time: "09:45",
    symbol: "NQ",
    direction: "BUY",
    session: "New York AM",
    entryConfluences: ["Liquidity Sweep", "Fair Value Gap (FVG)", "HTF-Bias"],
    riskReward: "1:3R",
    profit: 250.58,
    loss: 0.0,
    pnl: 250.58,
    outcome: "WIN",
    discipline: "Done",
    quantity: 1,
    entryPrice: 20450.25,
    exitPrice: 20462.75,
    setup: "Fair Value Gap (FVG)",
    mistake: "Followed Rules",
    notes: "ល្អឥតខ្ចោះ! ចូលនៅពេល New York Open ចំ FVG 15M ហើយយក TP ចំ Previous High",
    createdAt: new Date().toISOString(),
  },
  {
    id: "trade_sample_2",
    account: "Funded",
    dateString: "2026-11-17",
    closeDateString: "2026-11-17",
    time: "14:15",
    symbol: "NQ",
    direction: "SELL",
    session: "New York PM",
    entryConfluences: ["Breakout"],
    riskReward: "1:1R",
    profit: 0.0,
    loss: 80.0,
    pnl: -80.0,
    outcome: "LOSS",
    discipline: "Violated",
    quantity: 1,
    entryPrice: 20480.0,
    exitPrice: 20484.0,
    setup: "Breakout",
    mistake: "Early Exit",
    notes: "ចូលប្រញាប់បន្តិចនៅជិត News release កាត់ខាតតាម Stop Loss 4 pts",
    createdAt: new Date().toISOString(),
  },
  {
    id: "trade_sample_3",
    account: "Live",
    dateString: "2026-11-16",
    closeDateString: "2026-11-16",
    time: "10:30",
    symbol: "ES",
    direction: "BUY",
    session: "London",
    entryConfluences: ["Liquidity Sweep", "HTF-Bias"],
    riskReward: "1:2.5R",
    profit: 180.25,
    loss: 0.0,
    pnl: 180.25,
    outcome: "WIN",
    discipline: "Done",
    quantity: 2,
    setup: "Liquidity Sweep",
    mistake: "Followed Rules",
    notes: "Sweep London low មុនពេល New York run",
    createdAt: new Date().toISOString(),
  },
  {
    id: "trade_sample_4",
    dateString: "2026-11-14",
    time: "15:00",
    symbol: "XAUUSD",
    direction: "LONG",
    pnl: 310.0,
    outcome: "WIN",
    quantity: 0.5,
    setup: "Trend Continuation",
    mistake: "Followed Rules",
    notes: "Gold bounce ពី Key Support Level $2,580",
    createdAt: new Date().toISOString(),
  },
  {
    id: "trade_sample_5",
    dateString: "2026-11-13",
    time: "11:00",
    symbol: "NQ",
    direction: "SHORT",
    pnl: -193.12,
    outcome: "LOSS",
    quantity: 1,
    setup: "Counter Trend",
    mistake: "FOMO",
    notes: "ទីផ្សារ Bullish ខ្លាំង តែព្យាយាមចាប់កំពូល (Reversal)",
    createdAt: new Date().toISOString(),
  },
  {
    id: "trade_sample_6",
    dateString: "2026-11-11",
    time: "09:30",
    symbol: "NQ",
    direction: "LONG",
    pnl: 289.0,
    outcome: "WIN",
    quantity: 1,
    setup: "Opening Range Breakout",
    mistake: "Followed Rules",
    notes: "Trade តាម Rules 100% សម្រេច TP តាមផែនការ",
    createdAt: new Date().toISOString(),
  },
];

export function loadTrades(userId?: string): Trade[] {
  if (typeof window === "undefined") return SAMPLE_TRADES;
  try {
    const raw = localStorage.getItem(getScopedKey(TRADES_STORAGE_KEY, userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Error loading trades", e);
  }
  return SAMPLE_TRADES;
}

export function saveTrades(trades: Trade[], userId?: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getScopedKey(TRADES_STORAGE_KEY, userId), JSON.stringify(trades));
  } catch (e) {
    console.error("Error saving trades", e);
  }
}

/**
 * Calculate full trading performance metrics
 */
export function calculateTradingStats(trades: Trade[]): TradingStats {
  if (trades.length === 0) {
    return {
      netPnl: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakevenTrades: 0,
      winRate: 0,
      profitFactor: 0,
      averageWin: 0,
      averageLoss: 0,
      bestDayPnl: 0,
      worstDayPnl: 0,
      tradingDaysCount: 0,
      greenDaysCount: 0,
      redDaysCount: 0,
    };
  }

  let netPnl = 0;
  let winningTrades = 0;
  let losingTrades = 0;
  let breakevenTrades = 0;
  let grossProfit = 0;
  let grossLoss = 0;

  const dayPnlMap = new Map<string, number>();

  trades.forEach((trade) => {
    const pnl = trade.pnl || 0;
    netPnl += pnl;

    if (pnl > 0) {
      winningTrades++;
      grossProfit += pnl;
    } else if (pnl < 0) {
      losingTrades++;
      grossLoss += Math.abs(pnl);
    } else {
      breakevenTrades++;
    }

    dayPnlMap.set(trade.dateString, (dayPnlMap.get(trade.dateString) || 0) + pnl);
  });

  const totalTrades = trades.length;
  const winRate = totalTrades > 0 ? Math.round((winningTrades / totalTrades) * 100) : 0;
  const profitFactor = grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : grossProfit > 0 ? 99 : 0;
  const averageWin = winningTrades > 0 ? Number((grossProfit / winningTrades).toFixed(2)) : 0;
  const averageLoss = losingTrades > 0 ? Number((grossLoss / losingTrades).toFixed(2)) : 0;

  const dayPnls = Array.from(dayPnlMap.values());
  const bestDayPnl = dayPnls.length > 0 ? Math.max(...dayPnls) : 0;
  const worstDayPnl = dayPnls.length > 0 ? Math.min(...dayPnls) : 0;
  const greenDaysCount = dayPnls.filter((p) => p > 0).length;
  const redDaysCount = dayPnls.filter((p) => p < 0).length;

  return {
    netPnl: Number(netPnl.toFixed(2)),
    totalTrades,
    winningTrades,
    losingTrades,
    breakevenTrades,
    winRate,
    profitFactor,
    averageWin,
    averageLoss,
    bestDayPnl,
    worstDayPnl,
    tradingDaysCount: dayPnlMap.size,
    greenDaysCount,
    redDaysCount,
  };
}

/**
 * Format P&L with + or - and $ sign
 */
export function formatPnl(amount: number): string {
  const isPositive = amount > 0;
  const isNegative = amount < 0;
  const abs = Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (isPositive) return `+$${abs}`;
  if (isNegative) return `-$${abs}`;
  return `$0.00`;
}
