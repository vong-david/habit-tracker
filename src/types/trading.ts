export type TradeDirection = "LONG" | "SHORT";
export type TradeOutcome = "WIN" | "LOSS" | "BE";

export interface Trade {
  id: string;
  dateString: string; // YYYY-MM-DD
  time?: string; // HH:MM
  symbol: string; // e.g., "NQ", "ES", "XAUUSD", "BTC", "EURUSD"
  direction: TradeDirection;
  pnl: number; // Net P&L in USD (positive = win, negative = loss)
  outcome: TradeOutcome;
  quantity?: number; // Contracts / Lots
  entryPrice?: number;
  exitPrice?: number;
  setup?: string; // e.g. "Liquidity Sweep", "Fair Value Gap", "Breakout"
  mistake?: string; // e.g. "Followed Rules", "FOMO", "Early Exit"
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
