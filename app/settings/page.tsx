"use client";

import { useEffect, useState } from "react";
import { Settings } from "@/lib/types";
import { loadSettings, saveSettings, clearAllProgress } from "@/lib/storage";
import NavBar from "@/components/NavBar";

const SESSION_OPTIONS = [
  { value: 10, label: "10 cards" },
  { value: 20, label: "20 cards" },
  { value: 50, label: "50 cards" },
  { value: 0, label: "All due" },
];

const DIRECTION_OPTIONS = [
  { value: "front-back" as const, label: "Front \u2192 Back" },
  { value: "back-front" as const, label: "Back \u2192 Front" },
  { value: "random" as const, label: "Random" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    studyDirection: "front-back",
    sessionSize: 0,
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  function update(partial: Partial<Settings>) {
    const next = { ...settings, ...partial };
    setSettings(next);
    saveSettings(next);
  }

  function handleReset() {
    clearAllProgress();
    setShowConfirm(false);
    setResetDone(true);
    setTimeout(() => setResetDone(false), 2000);
  }

  return (
    <div className="flex flex-col flex-1 max-w-md mx-auto w-full px-4 pt-8 pb-24">
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">Settings</h1>

      {/* Study direction */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
          Study direction
        </h2>
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          {DIRECTION_OPTIONS.map((opt, i) => (
            <button
              key={opt.value}
              onClick={() => update({ studyDirection: opt.value })}
              className={`w-full flex items-center justify-between px-4 py-3.5 min-h-[44px] text-left transition-colors active:bg-zinc-50 ${
                i < DIRECTION_OPTIONS.length - 1
                  ? "border-b border-zinc-100"
                  : ""
              }`}
            >
              <span className="text-zinc-900">{opt.label}</span>
              {settings.studyDirection === opt.value && (
                <svg
                  className="w-5 h-5 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Session size */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
          Session size (SRS mode)
        </h2>
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          {SESSION_OPTIONS.map((opt, i) => (
            <button
              key={opt.value}
              onClick={() => update({ sessionSize: opt.value })}
              className={`w-full flex items-center justify-between px-4 py-3.5 min-h-[44px] text-left transition-colors active:bg-zinc-50 ${
                i < SESSION_OPTIONS.length - 1
                  ? "border-b border-zinc-100"
                  : ""
              }`}
            >
              <span className="text-zinc-900">{opt.label}</span>
              {settings.sessionSize === opt.value && (
                <svg
                  className="w-5 h-5 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Reset progress */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
          Data
        </h2>
        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full bg-white border border-red-200 text-red-500 rounded-xl px-4 py-3.5 font-medium min-h-[44px] active:bg-red-50 transition-colors"
          >
            Reset all progress
          </button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-700 text-sm mb-3">
              This will permanently delete all your card progress. Are you sure?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 bg-white border border-zinc-200 text-zinc-700 rounded-lg font-medium min-h-[44px] active:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-lg font-medium min-h-[44px] active:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        )}
        {resetDone && (
          <p className="mt-3 text-green-600 text-sm text-center">
            Progress reset successfully.
          </p>
        )}
      </div>

      <NavBar />
    </div>
  );
}
