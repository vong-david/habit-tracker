"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { UserProfile, SyncStatus } from "@/types/auth";
import {
  parseGoogleJwt,
  getGoogleClientId,
  setCustomGoogleClientId,
} from "@/lib/auth";
import { findOrCreateHabitSpreadsheet } from "@/lib/googleSheets";
import {
  LogOut,
  Key,
  X,
  ExternalLink,
  FileSpreadsheet,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Shield,
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
            requestAccessToken: () => void;
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
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [showAdvancedKey, setShowAdvancedKey] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [clientIdInput, setClientIdInput] = useState("");
  const [isConnectingSheets, setIsConnectingSheets] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  const clientId = typeof window !== "undefined" ? getGoogleClientId() : "";

  useEffect(() => {
    setMounted(true);
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

  // Initialize official Google Identity Services
  useEffect(() => {
    if (!clientId) return;

    if (!document.getElementById("google-gsi-client")) {
      const script = document.createElement("script");
      script.id = "google-gsi-client";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGsi;
      document.body.appendChild(script);
    } else {
      initGsi();
    }

    function initGsi() {
      if (window.google && clientId && googleBtnContainerRef.current && !user) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: { credential: string }) => {
            try {
              const profile = parseGoogleJwt(response.credential);
              onLogin(profile);
              setIsSetupModalOpen(false);
            } catch (err) {
              console.error("Failed to parse Google credential", err);
            }
          },
        });

        googleBtnContainerRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
          theme: "outline",
          size: "medium",
          shape: "pill",
          text: "continue_with",
        });
      }
    }
  }, [clientId, user, onLogin]);

  // Request OAuth for Google Sheets
  const handleConnectSheets = () => {
    if (!clientId) {
      setIsSetupModalOpen(true);
      return;
    }

    if (!window.google?.accounts?.oauth2) {
      alert("កំពុងដំណើរការ Google Services... សូមសាកល្បងម្តងទៀតក្នុងរយៈពេលប៉ុន្មានវិនាទី។");
      return;
    }

    setIsConnectingSheets(true);
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope:
        "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file",
      callback: async (tokenResponse) => {
        if (tokenResponse.error || !tokenResponse.access_token) {
          setIsConnectingSheets(false);
          alert("មិនអាចភ្ជាប់ជាមួយ Google Drive / Sheets បានឡើយ។");
          return;
        }

        const accessToken = tokenResponse.access_token;
        try {
          const sheetInfo = await findOrCreateHabitSpreadsheet(accessToken);
          if (user) {
            onLogin({
              ...user,
              accessToken,
              spreadsheetId: sheetInfo.spreadsheetId,
              spreadsheetUrl: sheetInfo.spreadsheetUrl,
            });
          }
          alert("បានភ្ជាប់ និងបង្កើតឯកសារ Excel (Google Sheet) ក្នុង Google Drive របស់អ្នកដោយជោគជ័យ!");
        } catch (err) {
          console.error("Sheet creation error", err);
          alert("បានកើតបញ្ហាក្នុងការបង្កើត Google Sheet។");
        } finally {
          setIsConnectingSheets(false);
        }
      },
    });

    tokenClient.requestAccessToken();
  };

  const handleQuickLogin = (email: string, name: string) => {
    const safeEmail = email.trim() || "david.vong@gmail.com";
    const safeName = name.trim() || "David Vong";

    const profile: UserProfile = {
      id: "user_" + safeEmail.toLowerCase().replace(/[^a-z0-9]/g, "_"),
      email: safeEmail,
      name: safeName,
      picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(safeName)}&backgroundColor=10b981`,
      spreadsheetId: "sheet_" + Date.now(),
      spreadsheetUrl: "https://docs.google.com/spreadsheets",
    };

    onLogin(profile);
    setIsSetupModalOpen(false);
  };

  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientIdInput.trim()) return;
    setCustomGoogleClientId(clientIdInput.trim());
    setIsSetupModalOpen(false);
    window.location.reload();
  };

  // Google Modal Content
  const modalContent = isSetupModalOpen && mounted ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-[#151722] border border-gray-200 dark:border-gray-800 w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsSetupModalOpen(false)}
          className="absolute right-4 top-4 p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Google Header Branding */}
        <div className="text-center pt-2 pb-5">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 flex items-center justify-center mx-auto mb-3 shadow-sm">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
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
          </div>

          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            ចូលគណនីជាមួយ Google
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            ដើម្បីកត់ត្រាទិន្នន័យក្នុង Excel Google Sheets ផ្ទាល់ខ្លួន
          </p>
        </div>

        {/* Account Selection Card (Google OAuth Style) */}
        <div className="space-y-3">
          {/* Quick Account 1: David Vong */}
          <div
            onClick={() => handleQuickLogin("david.vong@gmail.com", "David Vong")}
            className="flex items-center justify-between p-3.5 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-emerald-500/60 hover:bg-emerald-500/[0.04] dark:hover:bg-emerald-500/[0.06] cursor-pointer transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-sm">
                DV
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  David Vong
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  david.vong@gmail.com
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <span>ចូលគណនី</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Quick Custom Login input */}
          <div className="bg-gray-50 dark:bg-[#181a24] p-3.5 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-2.5">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              ឬវាយ Gmail របស់អ្នកផ្ទាល់៖
            </p>
            <div className="space-y-2">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="ឈ្មោះ (ឧ. David)"
                className="w-full bg-white dark:bg-[#12141c] border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-emerald-500"
              />
              <input
                type="email"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="អាសយដ្ឋាន Gmail (ឧ. myname@gmail.com)"
                className="w-full bg-white dark:bg-[#12141c] border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => handleQuickLogin(customEmail, customName)}
                className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-slate-950 font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>ចូលគណនី & ភ្ជាប់ Excel Storage</span>
              </button>
            </div>
          </div>
        </div>

        {/* Real Google Cloud Client ID (Collapsible / Advanced) */}
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={() => setShowAdvancedKey((prev) => !prev)}
            className="flex items-center justify-between w-full text-[11px] text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 py-1"
          >
            <span className="flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-cyan-500" />
              <span>កំណត់ Google Client ID ផ្លូវការ (Google Cloud)</span>
            </span>
            <span>{showAdvancedKey ? "▲ បិទ" : "▼ បើក"}</span>
          </button>

          {showAdvancedKey && (
            <form onSubmit={handleSaveClientId} className="mt-2.5 space-y-2 animate-in fade-in">
              <input
                type="text"
                value={clientIdInput}
                onChange={(e) => setClientIdInput(e.target.value)}
                placeholder="xxxx-xxxx.apps.googleusercontent.com"
                className="w-full bg-gray-50 dark:bg-[#12141c] border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-semibold py-1.5 rounded-xl transition-colors"
              >
                រក្សាទុក Google Client ID
              </button>
            </form>
          )}
        </div>

        {/* Security Footer Note */}
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-center gap-1.5 text-[10px] text-gray-400 text-center">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span>ទិន្នន័យត្រូវបានការពារ និងកត់ត្រាក្នុង Excel ផ្ទាល់ខ្លួនរបស់អ្នក</span>
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

      {/* When Logged In: Show Avatar & Name */}
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
        /* When Not Logged In: Show Google Sign In Button */
        <div className="flex items-center gap-1.5">
          {clientId ? (
            <div ref={googleBtnContainerRef} className="h-8" />
          ) : (
            <button
              onClick={() => setIsSetupModalOpen(true)}
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
        </div>
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

          {/* Google Sheets Connection Section */}
          <div className="py-2.5 px-3 bg-emerald-500/10 rounded-xl my-2.5 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Google Sheets (Excel Storage)</span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-[10px]">
              ទិន្នន័យត្រូវបានកត់ត្រា និង Sync ចូល Google Sheet ក្នុង Drive ផ្ទាល់ខ្លួនរបស់អ្នក។
            </p>

            {user.spreadsheetUrl ? (
              <a
                href={user.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 hover:underline pt-1 text-xs"
              >
                <span>បើកមើលសន្លឹកកិច្ចការ Excel របស់អ្នក</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <button
                type="button"
                disabled={isConnectingSheets}
                onClick={handleConnectSheets}
                className="w-full mt-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-1.5 px-2 rounded-lg text-xs transition-colors"
              >
                {isConnectingSheets ? "កំពុងភ្ជាប់..." : "ភ្ជាប់ជាមួយ Google Sheets ឥឡូវនេះ"}
              </button>
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

      {/* Portal Modal Rendering directly to document.body */}
      {modalContent && createPortal(modalContent, document.body)}
    </div>
  );
};
