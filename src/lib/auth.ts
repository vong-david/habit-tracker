import { UserProfile } from "@/types/auth";

const USER_SESSION_KEY = "habit_tracker_auth_user";
const SAVED_ACCOUNTS_KEY = "habit_tracker_saved_accounts_list";
const GOOGLE_CLIENT_ID_KEY = "habit_tracker_custom_google_client_id";

export function getStoredUser(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error("Failed to load user session", e);
    return null;
  }
}

export function saveUserSession(user: UserProfile | null): void {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
      addSavedAccount(user);
    } else {
      localStorage.removeItem(USER_SESSION_KEY);
    }
  } catch (e) {
    console.error("Failed to save user session", e);
  }
}

export function getSavedAccounts(): UserProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addSavedAccount(account: UserProfile): void {
  if (typeof window === "undefined") return;
  try {
    const accounts = getSavedAccounts();
    const existingIndex = accounts.findIndex((a) => a.email.toLowerCase() === account.email.toLowerCase());
    if (existingIndex >= 0) {
      accounts[existingIndex] = { ...accounts[existingIndex], ...account };
    } else {
      accounts.push(account);
    }
    localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(accounts.slice(-5)));
  } catch (e) {
    console.error("Failed to save account list", e);
  }
}

export function removeSavedAccount(accountIdOrEmail: string): void {
  if (typeof window === "undefined") return;
  try {
    const accounts = getSavedAccounts().filter(
      (a) => a.id !== accountIdOrEmail && a.email.toLowerCase() !== accountIdOrEmail.toLowerCase()
    );
    localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error("Failed to remove saved account", e);
  }
}

export function parseGoogleJwt(credential: string): UserProfile {
  const base64Url = credential.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    window
      .atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
  const data = JSON.parse(jsonPayload);

  return {
    id: data.sub || data.email,
    email: data.email,
    name: data.name || data.email.split("@")[0],
    picture: data.picture || "",
  };
}

export async function fetchGoogleUserProfile(accessToken: string): Promise<UserProfile> {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch Google profile");
  }

  const data = await res.json();
  return {
    id: data.sub || data.email,
    email: data.email,
    name: data.name || data.given_name || data.email.split("@")[0],
    picture: data.picture || "",
    accessToken,
  };
}

export function getGoogleClientId(): string {
  if (typeof window === "undefined") return "";
  const envId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (envId && envId.trim() !== "") return envId.trim();

  // Or read from localStorage if user custom set it in the UI
  return localStorage.getItem(GOOGLE_CLIENT_ID_KEY) || "";
}

export function setCustomGoogleClientId(clientId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GOOGLE_CLIENT_ID_KEY, clientId.trim());
}

