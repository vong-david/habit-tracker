"use client";

import React, { useState, useRef } from "react";
import {
  FileSpreadsheet,
  Upload,
  PlusCircle,
  Download,
  CheckCircle2,
  Sparkles,
  HardDrive,
  Info,
  X,
} from "lucide-react";
import {
  isFileSystemAccessSupported,
  writeToExcelFileHandle,
  saveStoredHandle,
  parseExcelFileData,
  downloadExcelFile,
} from "@/lib/excelStorage";
import { Habit, HabitCompletionMap, WellnessMap, DayInfo, TrackerCycleConfig } from "@/types/habit";

interface ExcelConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (fileName: string, fileHandle: FileSystemFileHandle | null) => void;
  habits: Habit[];
  completions: HabitCompletionMap;
  wellness: WellnessMap;
  days: DayInfo[];
  dateRangeLabel: string;
  cycleConfig: TrackerCycleConfig;
  onImportData: (data: {
    habits?: Habit[];
    completions?: HabitCompletionMap;
    wellness?: WellnessMap;
    cycleConfig?: TrackerCycleConfig;
  }) => void;
  canDismiss?: boolean;
}

export const ExcelConnectionModal: React.FC<ExcelConnectionModalProps> = ({
  isOpen,
  onClose,
  onConnected,
  habits,
  completions,
  wellness,
  days,
  dateRangeLabel,
  cycleConfig,
  onImportData,
  canDismiss = true,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const supportsFileSystem = isFileSystemAccessSupported();

  // 1. Create a brand new Excel file on user's computer and link to it
  const handleCreateNewExcelFile = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      if (supportsFileSystem) {
        // @ts-ignore
        const handle = await window.showSaveFilePicker({
          suggestedName: "habit-tracker-data.xlsx",
          types: [
            {
              description: "Excel Spreadsheet (.xlsx)",
              accept: {
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
              },
            },
          ],
        });

        // Write current habits/data to the new file
        await writeToExcelFileHandle(handle, habits, completions, wellness, days, dateRangeLabel, cycleConfig);
        await saveStoredHandle(handle);

        onConnected(handle.name, handle);
        onClose();
      } else {
        // Fallback for browsers without File System API: download the file
        downloadExcelFile(habits, completions, wellness, days, dateRangeLabel, "habit-tracker-data.xlsx", cycleConfig);
        onConnected("habit-tracker-data.xlsx", null);
        onClose();
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Error creating Excel file", err);
        setErrorMessage("មិនអាចបង្កើតឯកសារ Excel បានឡើយ។ សូមសាកល្បងម្តងទៀត។");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Select an existing Excel file from disk
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

        // Read and parse data from file
        const file = await handle.getFile();
        const buffer = await file.arrayBuffer();
        const parsed = await parseExcelFileData(buffer);

        if (parsed.habits && parsed.habits.length > 0) {
          onImportData(parsed);
        }

        await saveStoredHandle(handle);
        onConnected(handle.name, handle);
        onClose();
      } else {
        fileInputRef.current?.click();
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Error opening Excel file", err);
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
      const parsed = await parseExcelFileData(buffer);
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

  // Download blank Excel template
  const handleDownloadTemplate = () => {
    downloadExcelFile(habits, completions, wellness, days, dateRangeLabel, "habit-tracker-template.xlsx", cycleConfig);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-[#151722] border border-gray-200 dark:border-gray-800 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[92vh] overflow-y-auto text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button (if dismissible) */}
        {canDismiss && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header with Excel icon */}
        <div className="text-center pt-1 pb-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(16,185,129,0.15)] text-emerald-500">
            <FileSpreadsheet className="w-7 h-7" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            ភ្ជាប់ឯកសារ Excel (.xlsx)
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
            ទិន្នន័យទម្លាប់ និងសុខភាពរបស់អ្នក នឹងត្រូវកត់ត្រាដោយផ្ទាល់ក្នុងឯកសារ <strong>Excel (.xlsx)</strong> លើម៉ាស៊ីនរបស់អ្នក!
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs text-center font-medium">
            {errorMessage}
          </div>
        )}

        {/* 2 Primary Actions */}
        <div className="space-y-3 mt-2">
          {/* Action 1: Create New Excel File (Recommended) */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleCreateNewExcelFile}
            className="w-full p-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-slate-950 font-bold text-left transition-all shadow-md flex items-start gap-3.5 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-950/10 flex items-center justify-center text-slate-950 shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold flex items-center gap-1.5">
                  <span>បង្កើតឯកសារ Excel ថ្មីលើម៉ាស៊ីន</span>
                  <span className="text-[10px] bg-slate-950/20 px-2 py-0.5 rounded-full font-extrabold uppercase">
                    ណែនាំ
                  </span>
                </p>
              </div>
              <p className="text-xs font-normal opacity-85 mt-0.5">
                បង្កើតឯកសារ <code>habit-tracker-data.xlsx</code> ថ្មីមួយ និងភ្ជាប់ការកត់ត្រាភ្លាមៗ
              </p>
            </div>
          </button>

          {/* Action 2: Open / Select Existing Excel File */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleOpenExistingExcelFile}
            className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-[#1a1c28] hover:bg-gray-100 dark:hover:bg-gray-800/80 border border-gray-200 dark:border-gray-800 text-left transition-all shadow-sm flex items-start gap-3.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5">
              <Upload className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                ជ្រើសរើសឯកសារ Excel ដែលមានស្រាប់
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                ជ្រើសរើស File <code>.xlsx</code> ចាស់របស់អ្នក ដើម្បីបន្តកត់ត្រាទិន្នន័យ
              </p>
            </div>
          </button>
        </div>

        {/* Hidden standard file input for fallback */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
        />

        {/* Additional Tools: Download Blank Template */}
        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="hover:text-emerald-500 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ទាញយកគំរូ Excel ទទេ (.xlsx)</span>
          </button>

          {canDismiss && (
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline transition-colors"
            >
              បន្តជាបណ្តោះអាសន្ន
            </button>
          )}
        </div>

        {/* Security / Privacy reassurance notice */}
        <div className="mt-4 p-3 bg-gray-50 dark:bg-[#12141c] rounded-2xl border border-gray-100 dark:border-gray-800 text-[11px] text-gray-500 dark:text-gray-400 flex items-start gap-2">
          <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            ទិន្នន័យត្រូវបានកត់ត្រាដោយផ្ទាល់ក្នុង File លើកុំព្យូទ័ររបស់អ្នក។ គ្មាន Server ឬ Database ណាមួយលួចទាញយកទិន្នន័យរបស់អ្នកឡើយ (សុវត្ថិភាព ១០០%)។
          </p>
        </div>
      </div>
    </div>
  );
};
