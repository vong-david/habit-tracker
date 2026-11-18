export type TradeDirection = "BUY" | "SELL" | "LONG" | "SHORT";
export type TradeOutcome = "WIN" | "LOSS" | "BE";
export type TradeDiscipline = "Done" | "Violated" | "Missed";

export interface Trade {
  id: string;
  account?: string; // e.g., "Thun Tula", "Apex 50K", "Personal"
  symbol: string; // Pair e.g., "XAUUSD", "NQ", "ES", "EURUSD", "BTC"
  dateString: string; // Open Date YYYY-MM-DD
  closeDateString?: string; // Close Date YYYY-MM-DD
  time?: string; // Open Time HH:MM
  closeTime?: string; // Close Time HH:MM
  direction: TradeDirection; // Buy / Sell
  session?: string; // e.g., "New York AM", "London", "New York PM", "Asian"
  entryConfluences?: string[]; // Multi-tags: ["Liquidity Sweep", "HTF-Bias", "SIBI", "Silver Bullet"]
  riskReward?: string; // e.g., "1:4R", "1:2R", "1:3R"
  profit?: number; // Profit amount in USD (e.g. 1490.00)
  loss?: number; // Loss amount in USD (e.g. 0.00)
  pnl: number; // Net P&L in USD (positive = win, negative = loss)
  outcome: TradeOutcome;
  discipline?: TradeDiscipline; // "Done" (Followed rules) or "Violated"
  quantity?: number; // Contracts / Lots
  entryPrice?: number;
  exitPrice?: number;
  setup?: string; // Legacy single setup compatibility
  mistake?: string; // Legacy compatibility
  notes?: string;
  imageUrls?: string[]; // Image IDs or DataURLs stored in IndexedDB
  createdAt: string;
}

export interface DayTradesSummary {
  dateString: string;
  dayNumber: number;
  dayOfWeek: string;
  isCurrentMonth: boolean;
  totalPnl: number;
  tradesCount: number;
  winningCount: number;
  losingCount: number;
  trades: Trade[];
}

export interface TradingStats {
  netPnl: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRate: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  bestDayPnl: number;
  worstDayPnl: number;
  tradingDaysCount: number;
  greenDaysCount: number;
  redDaysCount: number;
}
