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
  ShieldCheck,
  Check,
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

  // Initialize official Google Identity Services script
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

  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientIdInput.trim()) return;
    setCustomGoogleClientId(clientIdInput.trim());
    setIsSetupModalOpen(false);
    window.location.reload();
  };

  // Google Setup Modal (Only shown if Google Client ID is not configured yet)
  const modalContent = isSetupModalOpen && mounted ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-[#151722] border border-gray-200 dark:border-gray-800 w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsSetupModalOpen(false)}
          className="absolute right-4 top-4 p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Google Header */}
        <div className="text-center pt-2 pb-4">
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
            បើកដំណើរការ Real Google Sign-In
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
            ដើម្បីឱ្យ <strong>User ណាក៏ដោយ</strong> អាចចុច Sign in ដោយប្រើ Google Account ពិតប្រាកដរបស់គេបាន អ្នកត្រូវដាក់ <strong>Google Client ID</strong> (ឥតគិតថ្លៃ ១០០%)
          </p>
        </div>

        {/* 3 Step Guide */}
        <div className="bg-gray-50 dark:bg-[#181a24] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-3 text-xs text-gray-700 dark:text-gray-300">
          <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5 text-sm">
            <Key className="w-4 h-4 text-emerald-500" />
            <span>របៀបយក Google Client ID (ត្រឹមតែ ២ នាទី)៖</span>
          </p>

          <ol className="list-decimal list-inside space-y-1.5 leading-relaxed text-[11px] sm:text-xs">
            <li>
              ចូលទៅកាន់{" "}
              <a
                href="https://console.cloud.google.com"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-500 font-bold hover:underline"
              >
                console.cloud.google.com
              </a>{" "}
              (Login ជាមួយ Gmail របស់អ្នក)
            </li>
            <li>ចូលទៅកាន់ <strong>APIs & Services</strong> ➡️ <strong>Credentials</strong></li>
            <li>ចុច <strong>Create Credentials</strong> ➡️ ជ្រើសរើស <strong>OAuth client ID</strong></li>
            <li>ជ្រើសរើស <strong>Web application</strong> ហើយត្រង់ <em>Authorized JavaScript origins</em> បន្ថែម Link Vercel និង <code>http://localhost:3000</code></li>
            <li>ចុច <strong>Create</strong> រួច Copy លេខកូដ <code>xxxx.apps.googleusercontent.com</code></li>
          </ol>
        </div>

        {/* Client ID Input Form */}
        <form onSubmit={handleSaveClientId} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              បិទភ្ជាប់ (Paste) Google Client ID នៅត្រង់នេះ៖
            </label>
            <input
              type="text"
              value={clientIdInput}
              onChange={(e) => setClientIdInput(e.target.value)}
              placeholder="123456789-xxxxxxxx.apps.googleusercontent.com"
              required
              className="w-full bg-gray-50 dark:bg-[#12141c] border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-slate-950 font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>រក្សាទុក & បើកដំណើរការ Real Google Login ភ្លាមៗ</span>
          </button>
        </form>

        <p className="text-[10px] text-gray-400 text-center mt-3">
          💡 អ្នកក៏អាចដាក់ក្នុង Environment Variable លើ Vercel ឈ្មោះ <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> ផងដែរ។
        </p>
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
        /* When Not Logged In: Official Google Button or Trigger Button */
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

      {/* Setup Modal */}
      {modalContent && createPortal(modalContent, document.body)}
    </div>
  );
};
