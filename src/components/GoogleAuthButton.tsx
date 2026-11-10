"use client";

import React, { useState, useEffect, useRef } from "react";
import { UserProfile } from "@/types/auth";
import {
  parseGoogleJwt,
  getGoogleClientId,
  setCustomGoogleClientId,
} from "@/lib/auth";
import { LogOut, User, Key, Check, ShieldCheck, X } from "lucide-react";

interface GoogleAuthButtonProps {
  user: UserProfile | null;
  onLogin: (user: UserProfile) => void;
  onLogout: () => void;
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
      };
    };
  }
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  user,
  onLogin,
  onLogout,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [clientIdInput, setClientIdInput] = useState("");
  const [demoEmailInput, setDemoEmailInput] = useState("david.vong@gmail.com");
  const [demoNameInput, setDemoNameInput] = useState("David Vong");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  const clientId = typeof window !== "undefined" ? getGoogleClientId() : "";

  // Close dropdown when clicking outside
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
    if (!clientId || user) return;

    // Load Google script dynamically if not already loaded
    if (!document.getElementById("google-gsi-client")) {
      const script = document.createElement("script");
      script.id = "google-gsi-client";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogleButton;
      document.body.appendChild(script);
    } else {
      initGoogleButton();
    }

    function initGoogleButton() {
      if (window.google && clientId && googleBtnContainerRef.current) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: { credential: string }) => {
            try {
              const profile = parseGoogleJwt(response.credential);
              onLogin(profile);
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

  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientIdInput.trim()) return;
    setCustomGoogleClientId(clientIdInput.trim());
    setIsSetupModalOpen(false);
    window.location.reload();
  };

  const handleDemoLogin = (email: string, name: string) => {
    const demoProfile: UserProfile = {
      id: "demo_" + email.toLowerCase().replace(/[^a-z0-9]/g, "_"),
      email: email.trim(),
      name: name.trim(),
      picture: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
    };
    onLogin(demoProfile);
    setIsSetupModalOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 1. When Logged In: Show Avatar & Name */}
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
          <span className="max-w-[100px] truncate">{user.name}</span>
        </button>
      ) : (
        /* 2. When Not Logged In: Show Google Sign In Button */
        <div className="flex items-center gap-1.5">
          {clientId ? (
            <div ref={googleBtnContainerRef} className="h-8" />
          ) : (
            <button
              onClick={() => setIsSetupModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#181a24] hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 transition-all shadow-sm active:scale-95"
            >
              {/* Google colored G icon */}
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
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#151722] border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl p-3 z-50 text-xs text-gray-800 dark:text-gray-200 animate-in fade-in duration-100">
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

          <div className="py-2.5 px-2 bg-emerald-500/10 rounded-lg my-2 border border-emerald-500/20 text-[11px] text-emerald-700 dark:text-emerald-400 flex items-start gap-1.5">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>ទិន្នន័យទម្លាប់ទាំងអស់ត្រូវបានរក្សាទុកដាច់ដោយឡែកក្នុង LocalStorage សម្រាប់គណនីនេះ។</span>
          </div>

          <button
            onClick={() => {
              setIsDropdownOpen(false);
              onLogout();
            }}
            className="w-full flex items-center gap-2 p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>ចាកចេញ (Sign Out)</span>
          </button>
        </div>
      )}

      {/* Setup / Fast Demo Modal */}
      {isSetupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#151722] border border-gray-200 dark:border-gray-800 w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
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
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  ចូលគណនី Google Account
                </h3>
              </div>
              <button
                onClick={() => setIsSetupModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Option A: Quick Test / Demo Login */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5">
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  សាកល្បងចូលគណនីភ្លាមៗ (Quick Account Test)
                </p>
                <p className="text-[11px] text-gray-600 dark:text-gray-300 mb-3">
                  ចូលដោយប្រើឈ្មោះ និង Email របស់អ្នក ដើម្បីសាកល្បងមើលការរក្សាទុកទិន្នន័យដាច់ដោយឡែកក្នុង LocalStorage ភ្លាមៗ៖
                </p>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={demoNameInput}
                    onChange={(e) => setDemoNameInput(e.target.value)}
                    placeholder="ឈ្មោះរបស់អ្នក (ឧ. David Vong)"
                    className="w-full bg-white dark:bg-[#1a1d28] border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-emerald-500"
                  />
                  <input
                    type="email"
                    value={demoEmailInput}
                    onChange={(e) => setDemoEmailInput(e.target.value)}
                    placeholder="អ៊ីមែល Google (ឧ. david@gmail.com)"
                    className="w-full bg-white dark:bg-[#1a1d28] border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={() => handleDemoLogin(demoEmailInput, demoNameInput)}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs py-2 rounded-lg transition-all shadow-sm"
                  >
                    ចូលគណនី {demoEmailInput || "Google"} ឥឡូវនេះ
                  </button>
                </div>
              </div>

              {/* Option B: Enter Real Google OAuth Client ID */}
              <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-cyan-500" />
                  ភ្ជាប់ជាមួយ Real Google Client ID (Optional)
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">
                  ប្រសិនបើបងមាន Google Client ID ពី Google Cloud Console សូមបិទភ្ជាប់ (Paste) នៅត្រង់នេះ៖
                </p>

                <form onSubmit={handleSaveClientId} className="space-y-2">
                  <input
                    type="text"
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    placeholder="xxxx-xxxx.apps.googleusercontent.com"
                    className="w-full bg-gray-50 dark:bg-[#1b1e2c] border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    className="w-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-semibold py-1.5 rounded-lg transition-colors"
                  >
                    រក្សាទុក Google Client ID
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
