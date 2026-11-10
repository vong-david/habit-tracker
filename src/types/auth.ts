export interface UserProfile {
  id: string;
  email: string;
  name: string;
  picture: string;
  accessToken?: string;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
}

export type SyncStatus = "idle" | "syncing" | "synced" | "error";
