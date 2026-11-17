"use client";

import React, { useState, useRef } from "react";
import {
  FileSpreadsheet,
  Upload,
  PlusCircle,
  Download,
  CheckCircle2,
  HardDrive,
  Info,
  X,
} from "lucide-react";
import {
  isFileSystemAccessSupported,
  writeSpendingToExcelFileHandle,
  saveStoredSpendingHandle,
  parseSpendingExcelFileData,
  downloadSpendingExcelFile,
} from "@/lib/spendingExcelStorage";
import {
  SpendingCategory,
  SpendingTransaction,
  SpendingBudgetConfig,
} from "@/types/spending";
import { DayInfo, TrackerCycleConfig } from "@/types/habit";

interface SpendingExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (fileName: string, fileHandle: FileSystemFileHandle | null) => void;
  categories: SpendingCategory[];
  transactions: SpendingTransaction[];
  days: DayInfo[];
  dateRangeLabel: string;
  budgetConfig: SpendingBudgetConfig;
  cycleConfig?: TrackerCycleConfig;
  onImportData: (data: {
    categories?: SpendingCategory[];
    transactions?: SpendingTransaction[];
    budgetConfig?: SpendingBudgetConfig;
    cycleConfig?: TrackerCycleConfig;
  }) => void;
  canDismiss?: boolean;
}

export const SpendingExcelModal: React.FC<SpendingExcelModalProps> = ({
  isOpen,
  onClose,
  onConnected,
  categories,
  transactions,
  days,
  dateRangeLabel,
  budgetConfig,
  cycleConfig,
  onImportData,
  canDismiss = true,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const supportsFileSystem = isFileSystemAccessSupported();

  // 1. Create a brand new Excel file on user's computer
  const handleCreateNewExcelFile = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      if (supportsFileSystem) {
        // @ts-ignore
        const handle = await window.showSaveFilePicker({
          suggestedName: "daily-spending-data.xlsx",
          types: [
            {
              description: "Excel Spreadsheet (.xlsx)",
              accept: {
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
              },
            },
          ],
        });

        await writeSpendingToExcelFileHandle(
          handle,
          categories,
          transactions,
          days,
          dateRangeLabel,
          budgetConfig,
          cycleConfig
        );
        await saveStoredSpendingHandle(handle);

        onConnected(handle.name, handle);
        onClose();
      } else {
        downloadSpendingExcelFile(
          categories,
          transactions,
          days,
          dateRangeLabel,
          budgetConfig,
          "daily-spending-data.xlsx",
          cycleConfig
        );
        onConnected("daily-spending-data.xlsx", null);
        onClose();
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Error creating spending Excel file", err);
        setErrorMessage("មិនអាចបង្កើតឯកសារ Excel បានឡើយ។ សូមសាកល្បងម្តងទៀត។");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Open an existing Excel file from disk
  const handleOpenExistingExcelFile = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      if (supportsFileSystem) {
        // @ts-ignore
        const [handle] = await window.showOpenFilePicker({
          types: [
            {
              description: "Excel Spreadsheet (.xlsx)",
              accept: {
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
              },
            },
          ],
          multiple: false,
        });

        const file = await handle.getFile();
        const buffer = await file.arrayBuffer();
        const parsed = await parseSpendingExcelFileData(buffer);

        if (parsed.categories || parsed.transactions) {
          onImportData(parsed);
        }

        await saveStoredSpendingHandle(handle);
        onConnected(handle.name, handle);
        onClose();
      } else {
        fileInputRef.current?.click();
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Error opening spending Excel file", err);
        setErrorMessage("មិនអាចបើកឯកសារ Excel បានឡើយ។");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Fallback standard file input change handler
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const parsed = await parseSpendingExcelFileData(buffer);
      onImportData(parsed);
      onConnected(file.name, null);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMessage("ឯកសារ Excel មិនត្រឹមត្រូវ ឬខូច។");
    } finally {
      setIsProcessing(false);
      e.target.value = "";
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={() => canDismiss && onClose()}
    >
      <div
        className="bg-white dark:bg-[#151722] border border-gray-200 dark:border-gray-800 w-full max-w-lg rounded-3xl p-5 sm:p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {canDismiss && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
            <FileSpreadsheet className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              រក្សាទុកទិន្នន័យចំណាយក្នុង Excel (.xlsx)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              រក្សាទុកលើកុំព្យូទ័ររបស់អ្នកដោយផ្ទាល់
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Options */}
        <div className="mt-5 space-y-3">
          {/* Option 1: Create New Excel File */}
          <button
            type="button"
            onClick={handleCreateNewExcelFile}
            disabled={isProcessing}
            className="w-full text-left p-4 rounded-2xl border-2 border-emerald-500/30 hover:border-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all group flex items-start gap-3.5"
          >
            <div className="p-2 rounded-xl bg-emerald-500 text-slate-950 shrink-0 group-hover:scale-105 transition-transform">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>បង្កើតឯកសារ Excel ថ្មី</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold">
                  ណែនាំ
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                បង្កើតឯកសារ <code className="text-emerald-600 dark:text-emerald-400">daily-spending-data.xlsx</code> ថ្មីស្រឡាង
              </p>
            </div>
          </button>

          {/* Option 2: Open Existing File */}
          <button
            type="button"
            onClick={handleOpenExistingExcelFile}
            disabled={isProcessing}
            className="w-full text-left p-4 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-emerald-500/50 bg-gray-50/50 dark:bg-[#191b26]/50 hover:bg-gray-100/50 dark:hover:bg-[#191b26] transition-all group flex items-start gap-3.5"
          >
            <div className="p-2 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 shrink-0 group-hover:text-emerald-500 transition-colors">
              <Upload className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-gray-900 dark:text-white">
                បើកឯកសារ Excel ដែលមានស្រាប់
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                ជ្រើសរើសឯកសារ Excel ចាស់ពីម៉ាស៊ីនរបស់អ្នកដើម្បីបន្តប្រើប្រាស់
              </p>
            </div>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
          />
        </div>

        {canDismiss && (
          <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-800 text-center">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline transition-colors"
            >
              បន្តប្រើប្រាស់ LocalStorage ធម្មតា (មិនទាន់ភ្ជាប់ Excel)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
