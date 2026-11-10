"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { UserProfile, SyncStatus } from "@/types/auth";
import {
  getGoogleClientId,
  setCustomGoogleClientId,
  getSavedAccounts,
  fetchGoogleUserProfile,
  removeSavedAccount,
} from "@/lib/auth";
import { findOrCreateHabitSpreadsheet } from "@/lib/googleSheets";
import {
  LogOut,
  Key,
  X,
  ExternalLink,
  FileSpreadsheet,
  RefreshCw,
  UserPlus,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface GoogleAuthButtonProps {
  user: UserProfile | null;
  syncStatus?: SyncStatus;
  onLogin: (user: UserProfile) => void;
  onLogout: () => void;
  onManualSync?: () => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with";
              shape?: "rectangular" | "pill" | "circle";
              width?: string | number;
            }
          ) => void;
          prompt: () => void;
        };
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (tokenResponse: { access_token?: string; error?: string }) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  user,
  syncStatus = "idle",
  onLogin,
  onLogout,
  onManualSync,
}) => {
  const [mounted, setMounted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddingNewAccount, setIsAddingNewAccount] = useState(false);
  const [showConfigSettings, setShowConfigSettings] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // New account form state
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountEmail, setNewAccountEmail] = useState("");

  // Client ID input state
  const [clientIdInput, setClientIdInput] = useState("");

  // Saved accounts list
  const [savedAccounts, setSavedAccounts] = useState<UserProfile[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const clientId = typeof window !== "undefined" ? getGoogleClientId() : "";

  useEffect(() => {
    setMounted(true);
    setSavedAccounts(getSavedAccounts());
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Trigger Real Google OAuth Popup
  const handleTriggerRealGoogleOAuth = () => {
    if (!clientId) {
      setShowConfigSettings(true);
      return;
    }

    if (!window.google?.accounts?.oauth2) {
      alert("កំពុងដំណើរការ Google Services... សូមរង់ចាំមួយភ្លែត រួចសាកល្បងម្តងទៀត។");
      return;
    }

    setIsConnecting(true);

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope:
          "openid email profile https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file",
        callback: async (tokenResponse) => {
          if (tokenResponse.error || !tokenResponse.access_token) {
            setIsConnecting(false);
            console.error("Google OAuth error:", tokenResponse);
            return;
          }

          const accessToken = tokenResponse.access_token;
          try {
            // 1. Fetch user profile from Google
            const profile = await fetchGoogleUserProfile(accessToken);

            // 2. Auto-initialize user's Google Sheet in their Google Drive
            let spreadsheetId = "";
            let spreadsheetUrl = "";
            try {
              const sheetInfo = await findOrCreateHabitSpreadsheet(accessToken);
              spreadsheetId = sheetInfo.spreadsheetId;
              spreadsheetUrl = sheetInfo.spreadsheetUrl;
            } catch (sheetErr) {
              console.warn("Could not auto-create spreadsheet", sheetErr);
            }

            const completeUser: UserProfile = {
              ...profile,
              accessToken,
              spreadsheetId,
              spreadsheetUrl,
            };

            onLogin(completeUser);
            setIsModalOpen(false);
            setSavedAccounts(getSavedAccounts());
          } catch (err) {
            console.error("Profile fetch error", err);
            alert("មិនអាចទាញយកព័ត៌មានគណនី Google បានទេ។");
          } finally {
            setIsConnecting(false);
          }
        },
      });

      // prompt: 'select_account' forces Google to show "Choose an account" dialog!
      tokenClient.requestAccessToken({ prompt: "select_account" });
    } catch (err) {
      console.error("Failed to launch Google OAuth:", err);
      setIsConnecting(false);
    }
  };

  // Click on "Sign in with Google" main button
  const handleMainButtonClick = () => {
    if (clientId) {
      // If Client ID is ready, trigger Google's native account chooser popup directly!
      handleTriggerRealGoogleOAuth();
    } else {
      // Otherwise open the Google Account Chooser UI modal
      setSavedAccounts(getSavedAccounts());
      setIsModalOpen(true);
    }
  };

  // Sign in as one of the saved accounts
  const handleSelectAccount = (account: UserProfile) => {
    onLogin(account);
    setIsModalOpen(false);
  };

  // Remove a saved account
  const handleRemoveAccount = (e: React.MouseEvent, accountId: string) => {
    e.stopPropagation();
    removeSavedAccount(accountId);
    setSavedAccounts(getSavedAccounts());
  };

  // Add a new dynamic account
  const handleAddNewAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountEmail.trim()) return;

    const name = newAccountName.trim() || newAccountEmail.split("@")[0];
    const newUser: UserProfile = {
      id: `google_${Date.now()}_${newAccountEmail.trim()}`,
      name,
      email: newAccountEmail.trim(),
      picture: "",
    };

    onLogin(newUser);
    setIsModalOpen(false);
    setIsAddingNewAccount(false);
    setNewAccountName("");
    setNewAccountEmail("");
    setSavedAccounts(getSavedAccounts());
  };

  // Save Custom Client ID
  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientIdInput.trim()) return;
    setCustomGoogleClientId(clientIdInput.trim());
    setShowConfigSettings(false);
    window.location.reload();
  };

  // Google Account Chooser Modal (matching Figma / Google UI)
  const modalContent = isModalOpen && mounted ? (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => setIsModalOpen(false)}
    >
      <div
        className="bg-white dark:bg-[#1a1c29] border border-gray-200 dark:border-gray-800 w-full max-w-[440px] rounded-3xl p-6 sm:p-8 shadow-2xl relative text-left overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Google Header */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              Sign in with Google
            </span>
          </div>

          <button
            onClick={() => setIsModalOpen(false)}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Center Content: Choose an account */}
        <div className="overflow-y-auto pr-1 flex-1">
          <div className="text-center pt-2 pb-5">
            {/* Friendly Google App Icon */}
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3 shadow-sm text-2xl">
              ✨
            </div>

            <h2 className="text-xl sm:text-2xl font-normal text-gray-900 dark:text-white tracking-tight">
              Choose an account
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
              to continue to <strong className="text-emerald-500">Habit Tracker</strong>
            </p>
          </div>

          {/* Account Chooser List */}
          <div className="border-t border-b border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800/80">
            {/* List of previously saved accounts */}
            {savedAccounts.map((acc) => (
              <div
                key={acc.id}
                onClick={() => handleSelectAccount(acc)}
                className="group flex items-center justify-between p-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {acc.picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={acc.picture}
                      alt={acc.name}
                      className="w-10 h-10 rounded-full object-cover border border-emerald-500/40"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                      {acc.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 text-left">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {acc.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {acc.email}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  title="Remove account"
                  onClick={(e) => handleRemoveAccount(e, acc.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* "Use another account" button */}
            {!isAddingNewAccount ? (
              <button
                type="button"
                onClick={() => setIsAddingNewAccount(true)}
                className="w-full flex items-center gap-3 p-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Use another account
                  </p>
                  <p className="text-[11px] text-gray-400">
                    ចូលដោយប្រើគណនី Google ផ្សេងទៀត
                  </p>
                </div>
              </button>
            ) : (
              /* Add Account Input Form */
              <form onSubmit={handleAddNewAccount} className="p-3.5 bg-gray-50 dark:bg-gray-800/40 space-y-2.5">
                <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                  បញ្ចូល Google Account ថ្មី៖
                </p>
                <input
                  type="text"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="ឈ្មោះអ្នកប្រើប្រាស់ (Name)"
                  className="w-full bg-white dark:bg-[#12141c] border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                />
                <input
                  type="email"
                  value={newAccountEmail}
                  onChange={(e) => setNewAccountEmail(e.target.value)}
                  placeholder="Gmail (ឧ. username@gmail.com)"
                  required
                  className="w-full bg-white dark:bg-[#12141c] border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                />
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs py-2 rounded-xl transition-all"
                  >
                    ចូលគណនី (Sign In)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewAccount(false)}
                    className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-white"
                  >
                    បោះបង់
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Google Disclaimer Footer */}
          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed pt-4 text-left">
            To continue, Google will share your name, email address, language preference,
            and profile picture with <span className="font-semibold text-gray-700 dark:text-gray-300">Habit Tracker</span>.
            Before using this app, you can review Habit Tracker&apos;s privacy policy and terms of service.
          </p>

          {/* Real Google Cloud OAuth trigger or configuration */}
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/80">
            {clientId ? (
              <button
                type="button"
                disabled={isConnecting}
                onClick={handleTriggerRealGoogleOAuth}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-xs font-semibold transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>
                  {isConnecting ? "កំពុងបើក Google Popup..." : "បើកផ្ទាំង Native Google Popup ផ្លូវការ"}
                </span>
              </button>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => setShowConfigSettings((prev) => !prev)}
                  className="w-full flex items-center justify-between text-[11px] text-gray-500 hover:text-emerald-500 py-1 transition-colors"
                >
                  <span className="flex items-center gap-1">
                    <Key className="w-3.5 h-3.5" />
                    <span>ភ្ជាប់ Google Client ID (ដើម្បីឱ្យ Google Popup លោតដោយស្វ័យប្រវត្តិ)</span>
                  </span>
                  {showConfigSettings ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {showConfigSettings && (
                  <form onSubmit={handleSaveClientId} className="mt-2 space-y-2 text-left">
                    <input
                      type="text"
                      value={clientIdInput}
                      onChange={(e) => setClientIdInput(e.target.value)}
                      placeholder="Paste xxxx.apps.googleusercontent.com"
                      className="w-full bg-gray-50 dark:bg-[#12141c] border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-[11px] text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                    />
                    <button
                      type="submit"
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs py-2 rounded-xl transition-all"
                    >
                      រក្សាទុក Google Client ID
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="relative flex items-center gap-1.5" ref={dropdownRef}>
      {/* Google Sheet Direct Link Button */}
      {user && user.spreadsheetUrl && (
        <a
          href={user.spreadsheetUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="បើកមើលសន្លឹកកិច្ចការ Excel ក្នុង Google Drive របស់អ្នក"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all shadow-sm"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
          <span>Excel Sheet</span>
          <ExternalLink className="w-3 h-3 opacity-60" />
        </a>
      )}

      {/* Sync Status Badge */}
      {user && (
        <div
          onClick={onManualSync}
          title="ចុចដើម្បី Sync ទៅ Google Sheets ឥឡូវនេះ"
          className="cursor-pointer flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-gray-100 dark:bg-[#181a24] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800"
        >
          {syncStatus === "syncing" ? (
            <>
              <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" />
              <span className="hidden sm:inline text-cyan-400 font-medium">Syncing...</span>
            </>
          ) : syncStatus === "synced" ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <span className="hidden sm:inline text-emerald-500 font-medium">Synced</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
              <span className="hidden sm:inline">Saved</span>
            </>
          )}
        </div>
      )}

      {/* When Logged In: Show Real Google Avatar & Name */}
      {user ? (
        <button
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-gray-100 dark:bg-[#181a24] hover:bg-gray-200 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 transition-all text-xs font-semibold shadow-sm text-gray-800 dark:text-gray-200"
        >
          {user.picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.picture}
              alt={user.name}
              className="w-6 h-6 rounded-full object-cover border border-emerald-500/50"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-[11px]">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="max-w-[90px] sm:max-w-[120px] truncate">{user.name}</span>
        </button>
      ) : (
        /* When Not Logged In: Clickable Google Sign-In Button */
        <button
          onClick={handleMainButtonClick}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#181a24] hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 transition-all shadow-sm active:scale-95"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>ចូលគណនី Google</span>
        </button>
      )}

      {/* Dropdown Menu when user is logged in */}
      {isDropdownOpen && user && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-[#151722] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-3.5 z-50 text-xs text-gray-800 dark:text-gray-200 animate-in fade-in duration-100">
          <div className="flex items-center gap-2.5 pb-2.5 border-b border-gray-100 dark:border-gray-800">
            {user.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.picture}
                alt={user.name}
                className="w-9 h-9 rounded-full object-cover border border-emerald-500/50"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="truncate">
              <p className="font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
            </div>
          </div>

          {/* Switch Account */}
          <button
            onClick={() => {
              setIsDropdownOpen(false);
              setIsModalOpen(true);
            }}
            className="w-full flex items-center gap-2 p-2 mt-1 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <UserPlus className="w-4 h-4 text-emerald-500" />
            <span>ប្តូរ ឬបន្ថែមគណនី (Switch Account)</span>
          </button>

          {/* Google Sheets Connection Section */}
          <div className="py-2.5 px-3 bg-emerald-500/10 rounded-xl my-2 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Google Sheets (Excel Storage)</span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-[10px]">
              {user.spreadsheetUrl
                ? "បានភ្ជាប់ជាមួយ Excel ក្នុង Google Drive រួចរាល់។"
                : "ទិន្នន័យត្រូវបានកត់ត្រាទុកក្នុង LocalStorage។"}
            </p>

            {user.spreadsheetUrl && (
              <a
                href={user.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 hover:underline pt-1 text-xs"
              >
                <span>បើកមើលសន្លឹកកិច្ចការ Excel របស់អ្នក</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <button
            onClick={() => {
              setIsDropdownOpen(false);
              onLogout();
            }}
            className="w-full flex items-center gap-2 p-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>ចាកចេញ (Sign Out)</span>
          </button>
        </div>
      )}

      {/* Choose an account Modal */}
      {modalContent && createPortal(modalContent, document.body)}
    </div>
  );
};
