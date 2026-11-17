import * as XLSX from "xlsx";
import {
  SpendingCategory,
  SpendingTransaction,
  SpendingBudgetConfig,
  Currency,
} from "@/types/spending";
import { DayInfo, TrackerCycleConfig } from "@/types/habit";
import { DEFAULT_EXCHANGE_RATE } from "./spendingStorage";

export { isFileSystemAccessSupported } from "./excelStorage";

const DB_NAME = "SpendingTrackerExcelDB";
const STORE_NAME = "fileHandles";
const SPENDING_HANDLE_KEY = "currentSpendingExcelHandle";

function openSpendingDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB not supported"));
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveStoredSpendingHandle(handle: FileSystemFileHandle): Promise<void> {
  try {
    const db = await openSpendingDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(handle, SPENDING_HANDLE_KEY);
  } catch (err) {
    console.warn("Could not save spending file handle to IndexedDB", err);
  }
}

export async function getStoredSpendingHandle(): Promise<FileSystemFileHandle | null> {
  try {
    const db = await openSpendingDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(SPENDING_HANDLE_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function clearStoredSpendingHandle(): Promise<void> {
  try {
    const db = await openSpendingDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(SPENDING_HANDLE_KEY);
  } catch (err) {
    console.warn("Could not clear spending file handle", err);
  }
}

/**
 * Build XLSX Workbook from Daily Spending data
 */
export function buildSpendingExcelWorkbook(
  categories: SpendingCategory[],
  transactions: SpendingTransaction[],
  days: DayInfo[],
  label: string,
  budgetConfig: SpendingBudgetConfig,
  cycleConfig?: TrackerCycleConfig
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // Create lookup for cell sums: [categoryId_dateString] -> sum in USD
  const cellSumMap: Record<string, number> = {};
  const cellNotesMap: Record<string, string[]> = {};

  transactions.forEach((tx) => {
    const key = `${tx.categoryId}_${tx.dateString}`;
    cellSumMap[key] = (cellSumMap[key] || 0) + tx.amount;
    if (tx.note) {
      if (!cellNotesMap[key]) cellNotesMap[key] = [];
      cellNotesMap[key].push(tx.note);
    }
  });

  // 1. Sheet: Daily Spending Grid
  const row1 = [`Daily Spending Tracker - ${label}`, ...new Array(days.length + 3).fill("")];
  const headerRow = [
    "ID",
    "ប្រភេទចំណាយ (Category)",
    "ថវិកា (Budget)",
    ...days.map((d) => `${d.dayOfWeek} ${d.dayNumber}`),
    "សរុប (Total USD)",
  ];

  let grandTotal = 0;
  const dayTotals: number[] = new Array(days.length).fill(0);

  const categoryRows = categories.map((cat) => {
    let catTotal = 0;
    const dayCells = days.map((day, dIdx) => {
      const key = `${cat.id}_${day.dateString}`;
      const amount = cellSumMap[key] || 0;
      catTotal += amount;
      dayTotals[dIdx] += amount;

      if (amount > 0) {
        const notes = cellNotesMap[key];
        return notes && notes.length > 0
          ? `$${amount.toFixed(2)} [${notes.join(", ")}]`
          : `$${amount.toFixed(2)}`;
      }
      return "";
    });

    grandTotal += catTotal;
    return [
      cat.id,
      `${cat.icon} ${cat.name}`,
      cat.budget ? `$${cat.budget}` : "-",
      ...dayCells,
      `$${catTotal.toFixed(2)}`,
    ];
  });

  // Daily Total Row
  const totalRow = [
    "TOTAL",
    "សរុបប្រចាំថ្ងៃ (Daily Total)",
    budgetConfig?.monthlyBudget ? `$${budgetConfig.monthlyBudget}` : "-",
    ...dayTotals.map((t) => (t > 0 ? `$${t.toFixed(2)}` : "$0.00")),
    `$${grandTotal.toFixed(2)}`,
  ];

  const gridData = [row1, headerRow, ...categoryRows, totalRow];
  const gridSheet = XLSX.utils.aoa_to_sheet(gridData);
  XLSX.utils.book_append_sheet(wb, gridSheet, "Daily Spending Grid");

  // 2. Sheet: Transactions Log
  const categoryMap = new Map<string, SpendingCategory>(categories.map((c) => [c.id, c]));
  const logHeader = [
    "ID",
    "កាលបរិច្ឆេទ (Date)",
    "ប្រភេទចំណាយ (Category)",
    "ទឹកប្រាក់ ($ USD)",
    "ទឹកប្រាក់ (៛ KHR)",
    "វិធីទូទាត់ (Payment)",
    "កំណត់ចំណាំ (Note)",
    "កាលបរិច្ឆេទកត់ត្រា (Timestamp)",
  ];

  const sortedTransactions = [...transactions].sort((a, b) => b.dateString.localeCompare(a.dateString));

  const logRows = sortedTransactions.map((tx) => {
    const cat = categoryMap.get(tx.categoryId);
    const amountKhr = Math.round(tx.amount * (budgetConfig.exchangeRate || DEFAULT_EXCHANGE_RATE));
    return [
      tx.id,
      tx.dateString,
      cat ? `${cat.icon} ${cat.name}` : tx.categoryId,
      `$${tx.amount.toFixed(2)}`,
      `${amountKhr.toLocaleString()} ៛`,
      tx.paymentMethod === "cash"
        ? "សាច់ប្រាក់ (Cash)"
        : tx.paymentMethod === "aba"
        ? "ABA / KHQR"
        : tx.paymentMethod === "card"
        ? "កាត (Card)"
        : "ផ្សេងៗ",
      tx.note || "",
      tx.createdAt || "",
    ];
  });

  const logData = [logHeader, ...logRows];
  const logSheet = XLSX.utils.aoa_to_sheet(logData);
  XLSX.utils.book_append_sheet(wb, logSheet, "Transactions Log");

  // 3. Sheet: System_Backup (Lossless JSON serialization)
  const systemData = {
    version: "spending_excel_v1",
    exportedAt: new Date().toISOString(),
    categories,
    transactions,
    budgetConfig,
    cycleConfig,
  };
  const systemSheet = XLSX.utils.aoa_to_sheet([["__SPENDING_TRACKER_JSON_DATA__"], [JSON.stringify(systemData)]]);
  XLSX.utils.book_append_sheet(wb, systemSheet, "System_Backup");

  return wb;
}

/**
 * Generate Excel buffer
 */
export function generateSpendingExcelBuffer(
  categories: SpendingCategory[],
  transactions: SpendingTransaction[],
  days: DayInfo[],
  label: string,
  budgetConfig: SpendingBudgetConfig,
  cycleConfig?: TrackerCycleConfig
): any {
  const wb = buildSpendingExcelWorkbook(categories, transactions, days, label, budgetConfig, cycleConfig);
  return XLSX.write(wb, { bookType: "xlsx", type: "array" });
}

/**
 * Write directly to linked FileSystemFileHandle
 */
export async function writeSpendingToExcelFileHandle(
  fileHandle: FileSystemFileHandle,
  categories: SpendingCategory[],
  transactions: SpendingTransaction[],
  days: DayInfo[],
  label: string,
  budgetConfig: SpendingBudgetConfig,
  cycleConfig?: TrackerCycleConfig
): Promise<void> {
  const buffer = generateSpendingExcelBuffer(categories, transactions, days, label, budgetConfig, cycleConfig);
  // @ts-ignore
  if (fileHandle.createWritable) {
    // @ts-ignore
    const writable = await fileHandle.createWritable();
    const blob = new Blob([buffer as any], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    await (writable as any).write(blob);
    await writable.close();
  } else {
    throw new Error("File writing not supported on this browser handle");
  }
}

/**
 * Download Excel file
 */
export function downloadSpendingExcelFile(
  categories: SpendingCategory[],
  transactions: SpendingTransaction[],
  days: DayInfo[],
  label: string,
  budgetConfig: SpendingBudgetConfig,
  fileName: string = "daily-spending-tracker.xlsx",
  cycleConfig?: TrackerCycleConfig
): void {
  const buffer = generateSpendingExcelBuffer(categories, transactions, days, label, budgetConfig, cycleConfig);
  const blob = new Blob([buffer as any], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Parse uploaded Excel file
 */
export async function parseSpendingExcelFileData(
  arrayBuffer: ArrayBuffer
): Promise<{
  categories?: SpendingCategory[];
  transactions?: SpendingTransaction[];
  budgetConfig?: SpendingBudgetConfig;
  cycleConfig?: TrackerCycleConfig;
}> {
  const wb = XLSX.read(arrayBuffer, { type: "array" });

  // 1. Lossless restore from System_Backup
  if (wb.SheetNames.includes("System_Backup")) {
    try {
      const sheet = wb.Sheets["System_Backup"];
      const rawData = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
      if (rawData.length > 1 && rawData[1][0]) {
        const parsed = JSON.parse(rawData[1][0]);
        if (parsed.categories && Array.isArray(parsed.categories)) {
          return {
            categories: parsed.categories,
            transactions: parsed.transactions || [],
            budgetConfig: parsed.budgetConfig,
            cycleConfig: parsed.cycleConfig,
          };
        }
      }
    } catch (e) {
      console.warn("Could not parse System_Backup sheet in spending workbook", e);
    }
  }

  // 2. Fallback: Parse Transactions Log sheet
  if (wb.SheetNames.includes("Transactions Log")) {
    try {
      const sheet = wb.Sheets["Transactions Log"];
      const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
      if (rows.length > 1) {
        const parsedTxs: SpendingTransaction[] = [];
        const detectedCategoriesMap = new Map<string, SpendingCategory>();

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || !row[1]) continue;

          const dateStr = String(row[1]).trim();
          const catNameFull = String(row[2] || "ទូទៅ").trim();
          const amountStr = String(row[3] || "0").replace(/[^0-9.]/g, "");
          const amount = parseFloat(amountStr) || 0;
          const note = row[6] ? String(row[6]).trim() : "";

          const chars = Array.from(catNameFull);
          const icon = chars[0] && chars[0].codePointAt(0)! > 127 ? chars[0] : "🏷️";
          const catName = icon === chars[0] ? chars.slice(1).join("").trim() : catNameFull;
          const catId = "cat_" + catName.toLowerCase().replace(/[^a-z0-9]/g, "_");

          if (!detectedCategoriesMap.has(catId)) {
            detectedCategoriesMap.set(catId, {
              id: catId,
              name: catName || "ទូទៅ",
              icon,
              createdAt: new Date().toISOString(),
            });
          }

          parsedTxs.push({
            id: row[0] ? String(row[0]) : "tx_" + Date.now() + "_" + i,
            categoryId: catId,
            dateString: dateStr,
            amount,
            rawAmount: amount,
            currency: "USD",
            note,
            paymentMethod: "cash",
            createdAt: row[7] ? String(row[7]) : new Date().toISOString(),
          });
        }

        return {
          categories: Array.from(detectedCategoriesMap.values()),
          transactions: parsedTxs,
        };
      }
    } catch (e) {
      console.warn("Fallback parsing of Transactions Log failed", e);
    }
  }

  return {};
}
