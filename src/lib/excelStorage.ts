import * as XLSX from "xlsx";
import { Habit, HabitCompletionMap, WellnessMap, DayInfo, TrackerCycleConfig, HabitNotesMap } from "@/types/habit";

export interface ExcelStorageState {
  isConnected: boolean;
  fileName: string | null;
  lastSyncedAt: string | null;
  fileHandle: FileSystemFileHandle | null;
}

const DB_NAME = "HabitTrackerExcelDB";
const STORE_NAME = "fileHandles";
const HANDLE_KEY = "currentExcelHandle";

/**
 * Check if the browser supports the File System Access API
 */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== "undefined" && "showOpenFilePicker" in window && "showSaveFilePicker" in window;
}

/**
 * Open IndexedDB to persist FileSystemFileHandle across browser reloads
 */
function openDB(): Promise<IDBDatabase> {
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

/**
 * Save file handle to IndexedDB
 */
export async function saveStoredHandle(handle: FileSystemFileHandle): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(handle, HANDLE_KEY);
  } catch (err) {
    console.warn("Could not save file handle to IndexedDB", err);
  }
}

/**
 * Retrieve saved file handle from IndexedDB
 */
export async function getStoredHandle(): Promise<FileSystemFileHandle | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(HANDLE_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Remove saved file handle from IndexedDB
 */
export async function clearStoredHandle(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(HANDLE_KEY);
  } catch (err) {
    console.warn("Could not clear file handle", err);
  }
}

/**
 * Build XLSX Workbook from Habit Tracker data
 */
export function buildExcelWorkbook(
  habits: Habit[],
  completions: HabitCompletionMap,
  wellness: WellnessMap,
  days: DayInfo[],
  label: string,
  cycleConfig?: TrackerCycleConfig,
  notes?: HabitNotesMap
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // 1. Sheet: Habit Tracker
  const row1 = [`Habit Tracker - ${label}`, ...new Array(days.length + 3).fill("")];
  const headerRow = [
    "ID",
    "ទម្លាប់ (Habit)",
    "ប្រភេទ (Category)",
    ...days.map((d) => `${d.dayOfWeek} ${d.dayNumber}`),
    "សម្រេច (Done)",
    "អត្រា % (Rate)",
  ];

  const habitRows = habits.map((habit) => {
    let doneCount = 0;
    const dayCells = days.map((day) => {
      const key = `${habit.id}_${day.dateString}`;
      const isDone = !!completions[key];
      const note = notes?.[key];
      if (isDone) doneCount++;
      return isDone ? (note ? `✓ [${note}]` : "✓") : (note ? `[${note}]` : "");
    });

    const rate = days.length > 0 ? Math.round((doneCount / days.length) * 100) : 0;
    return [habit.id, `${habit.icon} ${habit.name}`, habit.category, ...dayCells, doneCount, `${rate}%`];
  });

  const habitDataValues = [row1, headerRow, ...habitRows];
  const habitSheet = XLSX.utils.aoa_to_sheet(habitDataValues);
  XLSX.utils.book_append_sheet(wb, habitSheet, "Habit Tracker");

  // 2. Sheet: Overall Wellness
  const wellnessHeader = ["រង្វាស់ (Metric)", ...days.map((d) => `ថ្ងៃទី ${d.dayNumber}`)];
  const moodRow = [
    "អារម្មណ៍ (Mood 1-5)",
    ...days.map((d) => wellness[d.dateString]?.mood ?? "-"),
  ];
  const sleepRow = [
    "ម៉ោងគេង (Sleep Hours)",
    ...days.map((d) => (wellness[d.dateString]?.sleepHours ? `${wellness[d.dateString]?.sleepHours}h` : "-")),
  ];

  const wellnessDataValues = [wellnessHeader, moodRow, sleepRow];
  const wellnessSheet = XLSX.utils.aoa_to_sheet(wellnessDataValues);
  XLSX.utils.book_append_sheet(wb, wellnessSheet, "Overall Wellness");

  // 3. Sheet: System Data Backup (Stores structured JSON in cell A1 for lossless re-import)
  const systemData = {
    version: "excel_v1",
    exportedAt: new Date().toISOString(),
    habits,
    completions,
    habitNotes: notes,
    wellness,
    cycleConfig,
  };
  const systemSheet = XLSX.utils.aoa_to_sheet([["__HABIT_TRACKER_JSON_DATA__"], [JSON.stringify(systemData)]]);
  XLSX.utils.book_append_sheet(wb, systemSheet, "System_Backup");

  return wb;
}

/**
 * Generate Excel binary buffer
 */
export function generateExcelBuffer(
  habits: Habit[],
  completions: HabitCompletionMap,
  wellness: WellnessMap,
  days: DayInfo[],
  label: string,
  cycleConfig?: TrackerCycleConfig,
  notes?: HabitNotesMap
): any {
  const wb = buildExcelWorkbook(habits, completions, wellness, days, label, cycleConfig, notes);
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return out;
}

/**
 * Parse an Excel file (.xlsx) into Habit Tracker data
 */
export async function parseExcelFileData(
  arrayBuffer: ArrayBuffer
): Promise<{
  habits?: Habit[];
  completions?: HabitCompletionMap;
  habitNotes?: HabitNotesMap;
  wellness?: WellnessMap;
  cycleConfig?: TrackerCycleConfig;
}> {
  const wb = XLSX.read(arrayBuffer, { type: "array" });

  // 1. Check if System_Backup sheet exists (lossless restoration)
  if (wb.SheetNames.includes("System_Backup")) {
    try {
      const sheet = wb.Sheets["System_Backup"];
      const rawData = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
      if (rawData.length > 1 && rawData[1][0]) {
        const parsed = JSON.parse(rawData[1][0]);
        if (parsed.habits && Array.isArray(parsed.habits)) {
          return {
            habits: parsed.habits,
            completions: parsed.completions || {},
            habitNotes: parsed.habitNotes || {},
            wellness: parsed.wellness || {},
            cycleConfig: parsed.cycleConfig,
          };
        }
      }
    } catch (e) {
      console.warn("Could not read System_Backup sheet, parsing visual tables", e);
    }
  }

  // 2. Parse visual "Habit Tracker" sheet
  const firstSheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

  // Find header row (starts with ID or Habit/ទម្លាប់)
  const headerIndex = rows.findIndex(
    (row) => Array.isArray(row) && row.some((cell) => String(cell).includes("ទម្លាប់") || String(cell).includes("Habit"))
  );

  const importedHabits: Habit[] = [];
  if (headerIndex !== -1 && rows.length > headerIndex + 1) {
    for (let r = headerIndex + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !row[1]) continue;
      const rawName = String(row[1]).trim();
      const chars = Array.from(rawName);
      const firstChar = chars[0] || "📌";
      const isEmoji = firstChar.codePointAt(0)! > 127;
      const icon = isEmoji ? firstChar : "📌";
      const name = isEmoji ? chars.slice(1).join("").trim() : rawName;
      const category = row[2] ? String(row[2]).trim() : "ទូទៅ";

      importedHabits.push({
        id: row[0] ? String(row[0]).trim() : "habit_" + (r + 1),
        name,
        icon,
        category,
        createdAt: new Date().toISOString(),
      });
    }
  }

  return {
    habits: importedHabits.length > 0 ? importedHabits : undefined,
    completions: {},
    wellness: {},
  };
}

/**
 * Write directly to linked FileSystemFileHandle on user's computer
 */
export async function writeToExcelFileHandle(
  fileHandle: FileSystemFileHandle,
  habits: Habit[],
  completions: HabitCompletionMap,
  wellness: WellnessMap,
  days: DayInfo[],
  label: string,
  cycleConfig?: TrackerCycleConfig,
  notes?: HabitNotesMap
): Promise<void> {
  const buffer = generateExcelBuffer(habits, completions, wellness, days, label, cycleConfig, notes);
  // Request write permission if needed
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
 * Trigger file download as fallback or manual export
 */
export function downloadExcelFile(
  habits: Habit[],
  completions: HabitCompletionMap,
  wellness: WellnessMap,
  days: DayInfo[],
  label: string,
  fileName: string = "habit-tracker-data.xlsx",
  cycleConfig?: TrackerCycleConfig,
  notes?: HabitNotesMap
): void {
  const buffer = generateExcelBuffer(habits, completions, wellness, days, label, cycleConfig, notes);
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
