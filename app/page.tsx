"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RawCard, DeckManifestEntry } from "@/lib/types";
import {
  loadProgress,
  mergeCards,
  saveProgress,
  saveMeta,
  loadMeta,
  saveActiveDeck,
} from "@/lib/storage";

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);
  const [existingCount, setExistingCount] = useState(0);
  const [lastLoaded, setLastLoaded] = useState<string>("");
  const [decks, setDecks] = useState<DeckManifestEntry[]>([]);
  const [loadingDeck, setLoadingDeck] = useState<string | null>(null);

  useEffect(() => {
    if (!localStorage.getItem("dutch-tip-shown")) {
      alert(
        'You can inform a dutch person that "Ik wil graag in het Nederlands oefenen" (I\'d like to practise in Dutch) when they switch to english with you.'
      );
      localStorage.setItem("dutch-tip-shown", "1");
    }
  }, []);

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

    fetch("/decks/index.json")
      .then((res) => res.json())
      .then((data: DeckManifestEntry[]) => setDecks(data))
      .catch(() => {});
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

  const handleStudyDeck = useCallback(
    async (deck: DeckManifestEntry) => {
      setLoadingDeck(deck.id);
      setError(null);
      try {
        const res = await fetch(`/decks/${deck.file}`);
        const data: RawCard[] = await res.json();
        if (!validateCards(data)) {
          setError("Invalid deck format.");
          setLoadingDeck(null);
          return;
        }
        const existing = loadProgress(deck.id);
        const merged = mergeCards(data, existing);
        saveProgress(merged, deck.id);
        saveActiveDeck({ id: deck.id, name: deck.name });
        saveMeta({ loadedAt: new Date().toISOString(), totalCards: data.length });
        router.push("/dashboard");
      } catch {
        setError("Failed to load deck.");
        setLoadingDeck(null);
      }
    },
    [router]
  );

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
        const existing = loadProgress("custom");
        const merged = mergeCards(data, existing);
        saveProgress(merged, "custom");
        saveActiveDeck({ id: "custom", name: "Custom deck" });
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
    <div className="flex flex-1 flex-col items-center px-6 max-w-md mx-auto w-full py-10">
      <div className="w-full text-center mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Flashcards</h1>
        <p className="text-zinc-500">Choose a deck or upload your own</p>
      </div>

      {/* Section A — Bundled decks */}
      {decks.length > 0 && (
        <div className="w-full mb-6">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Bundled decks
          </h2>
            {decks.map((deck) => (
                <span className="gap-2">
                  <button
                    onClick={() => handleStudyDeck(deck)}
                    disabled={loadingDeck === deck.id}
                    className="py-2.5 px-4 m-2 bg-blue-500 text-white rounded-lg font-semibold text-sm min-h-[44px] active:bg-blue-600 transition-colors disabled:opacity-60"
                  >
                    {loadingDeck === deck.id ? "Loading..." : deck.name}
                  </button>
                </span>
            ))}
        </div>
      )}

      {/* Divider */}
      <div className="w-full flex items-center gap-4 my-2 mb-6">
        <div className="flex-1 h-px bg-zinc-200" />
        <span className="text-xs text-zinc-400 uppercase tracking-wider whitespace-nowrap">
          or upload your own
        </span>
        <div className="flex-1 h-px bg-zinc-200" />
      </div>

      {/* Section B — Custom upload (existing flow) */}
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
