"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RawCard } from "@/lib/types";
import { loadProgress, mergeCards, saveProgress, saveMeta, loadMeta } from "@/lib/storage";

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);
  const [existingCount, setExistingCount] = useState(0);
  const [lastLoaded, setLastLoaded] = useState<string>("");

  useEffect(() => {
    const meta = loadMeta();
    const progress = loadProgress();
    const count = Object.keys(progress).length;
    if (meta && count > 0) {
      setHasExisting(true);
      setExistingCount(count);
      const ago = timeAgo(new Date(meta.loadedAt));
      setLastLoaded(ago);
    }
  }, []);

  function timeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  function validateCards(data: unknown): data is RawCard[] {
    if (!Array.isArray(data)) return false;
    if (data.length === 0) return false;
    return data.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        typeof item.front === "string" &&
        typeof item.back === "string"
    );
  }

  const handleFile = useCallback((f: File) => {
    setError(null);
    if (!f.name.endsWith(".json")) {
      setError("Please select a .json file.");
      return;
    }
    setFile(f);
  }, []);

  const handleLoad = useCallback(() => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!validateCards(data)) {
          setError(
            "Invalid format. Expected a JSON array with objects containing 'front' and 'back' string fields."
          );
          return;
        }
        const existing = loadProgress();
        const merged = mergeCards(data, existing);
        saveProgress(merged);
        saveMeta({
          loadedAt: new Date().toISOString(),
          totalCards: data.length,
        });
        router.push("/dashboard");
      } catch {
        setError("Invalid JSON file. Please check the file format.");
      }
    };
    reader.readAsText(file);
  }, [file, router]);

  const handleContinue = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 max-w-md mx-auto w-full">
      <div className="w-full text-center mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Flashcards</h1>
        <p className="text-zinc-500">Upload a JSON file to get started</p>
      </div>

      {/* Drop zone */}
      <div
        className={`w-full border-2 border-dashed rounded-2xl p-10 text-center transition-colors cursor-pointer ${
          dragging
            ? "border-blue-500 bg-blue-50"
            : file
            ? "border-green-400 bg-green-50"
            : "border-zinc-300 bg-white"
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <div className="flex flex-col items-center gap-3">
          <svg
            className="w-10 h-10 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          {file ? (
            <p className="text-green-700 font-medium">{file.name}</p>
          ) : (
            <>
              <p className="text-zinc-600 font-medium">
                Drop your .json file here
              </p>
              <p className="text-zinc-400 text-sm">or tap to browse</p>
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-4 text-red-500 text-sm text-center">{error}</p>
      )}

      <button
        onClick={handleLoad}
        disabled={!file}
        className={`w-full mt-6 py-3.5 rounded-xl font-semibold text-white min-h-[44px] transition-colors ${
          file
            ? "bg-blue-500 active:bg-blue-600"
            : "bg-zinc-300 cursor-not-allowed"
        }`}
      >
        Load cards
      </button>

      {hasExisting && (
        <button
          onClick={handleContinue}
          className="w-full mt-3 py-3.5 rounded-xl font-semibold text-blue-500 bg-blue-50 active:bg-blue-100 min-h-[44px] transition-colors"
        >
          Continue last session ({existingCount} cards &middot; {lastLoaded})
        </button>
      )}
    </div>
  );
}
