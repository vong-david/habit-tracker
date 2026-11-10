import { UserProfile } from "@/types/auth";

const USER_SESSION_KEY = "habit_tracker_auth_user";
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
    } else {
      localStorage.removeItem(USER_SESSION_KEY);
    }
  } catch (e) {
    console.error("Failed to save user session", e);
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
    name: data.name,
    picture: data.picture || "",
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
