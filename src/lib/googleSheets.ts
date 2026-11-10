import { Habit, HabitCompletionMap, WellnessMap, DayInfo } from "@/types/habit";

const SPREADSHEET_TITLE = "Habit Tracker (Excel Data)";

export interface GoogleSheetInfo {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

/**
 * Searches user's Google Drive for existing Habit Tracker spreadsheet, or creates a new one
 */
export async function findOrCreateHabitSpreadsheet(
  accessToken: string
): Promise<GoogleSheetInfo> {
  const driveSearchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(
    SPREADSHEET_TITLE
  )}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false&fields=files(id,name,webViewLink)`;

  try {
    const searchRes = await fetch(driveSearchUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        return {
          spreadsheetId: data.files[0].id,
          spreadsheetUrl:
            data.files[0].webViewLink ||
            `https://docs.google.com/spreadsheets/d/${data.files[0].id}/edit`,
        };
      }
    }
  } catch (err) {
    console.warn("Drive search error, attempting to create new sheet:", err);
  }

  // Create new spreadsheet in user's Google Drive
  const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        title: SPREADSHEET_TITLE,
      },
      sheets: [
        {
          properties: {
            title: "Habit Tracker",
            gridProperties: {
              frozenRowCount: 2,
              frozenColumnCount: 2,
            },
          },
        },
        {
          properties: {
            title: "Overall Wellness",
            gridProperties: {
              frozenRowCount: 1,
              frozenColumnCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Failed to create Google Sheet: ${errorText}`);
  }

  const created = await createRes.json();
  return {
    spreadsheetId: created.spreadsheetId,
    spreadsheetUrl:
      created.spreadsheetUrl ||
      `https://docs.google.com/spreadsheets/d/${created.spreadsheetId}/edit`,
  };
}

/**
 * Syncs the current habits, completions, and wellness data into the user's Google Sheet
 */
export async function syncHabitDataToSheet(
  accessToken: string,
  spreadsheetId: string,
  habits: Habit[],
  completions: HabitCompletionMap,
  wellness: WellnessMap,
  days: DayInfo[],
  monthLabel: string
): Promise<void> {
  // 1. Build values for "Habit Tracker" sheet
  // Row 1: Month title
  const row1 = [`Habit Tracker - ${monthLabel}`, ...new Array(days.length + 2).fill("")];
  // Row 2: Headers (Habit, Category, 1..31, Done, Rate)
  const headerRow = [
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
      if (isDone) doneCount++;
      return isDone ? "✓" : "";
    });

    const rate = days.length > 0 ? Math.round((doneCount / days.length) * 100) : 0;
    return [`${habit.icon} ${habit.name}`, habit.category, ...dayCells, doneCount, `${rate}%`];
  });

  const habitDataValues = [row1, headerRow, ...habitRows];

  // 2. Build values for "Overall Wellness" sheet
  const wellnessHeader = ["រង្វាស់ (Metric)", ...days.map((d) => `ថ្ងៃទី ${d.dayNumber}`)];
  const moodRow = [
    "អារម្មណ៍ (Mood 1-5)",
    ...days.map((d) => wellness[d.dateString]?.mood || "-"),
  ];
  const sleepRow = [
    "ម៉ោងគេង (Sleep Hours)",
    ...days.map((d) => (wellness[d.dateString]?.sleepHours ? `${wellness[d.dateString]?.sleepHours}h` : "-")),
  ];

  const wellnessDataValues = [wellnessHeader, moodRow, sleepRow];

  // Update both sheets via batchUpdate
  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;

  const response = await fetch(updateUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      valueInputOption: "USER_ENTERED",
      data: [
        {
          range: "'Habit Tracker'!A1:AJ50",
          values: habitDataValues,
        },
        {
          range: "'Overall Wellness'!A1:AJ10",
          values: wellnessDataValues,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to sync data to Google Sheet", errorText);
    throw new Error(`Google Sheets sync failed: ${errorText}`);
  }
}
