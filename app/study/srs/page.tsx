"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { CardProgress } from "@/lib/types";
import { loadProgress, saveProgress, loadSettings, loadActiveDeck } from "@/lib/storage";
import { isDueToday, updateSRS } from "@/lib/srs";
import FlashCard from "@/components/FlashCard";
import ProgressBar from "@/components/ProgressBar";
import RatingBar from "@/components/RatingBar";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function applyDirection(card: CardProgress, direction: string): { question: string; answer: string } {
  if (direction === "back-front") return { question: card.back, answer: card.front };
  if (direction === "random") {
    return Math.random() < 0.5
      ? { question: card.front, answer: card.back }
      : { question: card.back, answer: card.front };
  }
  return { question: card.front, answer: card.back };
}

export default function SRSPage() {
  const router = useRouter();
  const [queue, setQueue] = useState<CardProgress[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [nextDue, setNextDue] = useState<string | null>(null);
  const [direction, setDirection] = useState("front-back");
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const progressRef = useRef<Record<string, CardProgress>>({});
  const deckIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const deck = loadActiveDeck();
    deckIdRef.current = deck?.id;
    const progress = loadProgress(deck?.id);
    progressRef.current = progress;
    const settings = loadSettings();
    setDirection(settings.studyDirection);
    const due = shuffle(Object.values(progress).filter(isDueToday));

    let limited = due;
    if (settings.sessionSize > 0 && due.length > settings.sessionSize) {
      limited = due.slice(0, settings.sessionSize);
    }

    if (limited.length === 0) {
      const allCards = Object.values(progress);
      const futureDates = allCards
        .map((c) => c.dueDate)
        .filter((d) => d > new Date().toISOString().slice(0, 10))
        .sort();
      setNextDue(futureDates[0] || null);
      setDone(true);
    } else {
      setQueue(limited);
    }
  }, []);

  const handleRate = useCallback(
    (quality: number) => {
      const card = queue[index];
      const updated = updateSRS(card, quality);
      progressRef.current[card.key] = updated;
      saveProgress(progressRef.current, deckIdRef.current);

      if (index + 1 >= queue.length) {
        setDone(true);
      } else {
        setIndex((i) => i + 1);
        setFlipped(false);
      }
    },
    [queue, index]
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart.current || !flipped) return;
      const dx = e.changedTouches[0].clientX - touchStart.current.x;
      const dy = Math.abs(e.changedTouches[0].clientY - touchStart.current.y);
      if (Math.abs(dx) > 80 && dy < 100) {
        if (dx > 0) handleRate(3); // swipe right = Good
        else handleRate(0); // swipe left = Again
      }
      touchStart.current = null;
    },
    [flipped, handleRate]
  );

  if (done && queue.length === 0) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center max-w-md mx-auto w-full px-4">
        <div className="text-center">
          <p className="text-5xl mb-4">&#127881;</p>
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">
            Nothing due!
          </h2>
          <p className="text-zinc-500">
            Great work! All caught up.
            {nextDue && (
              <>
                <br />
                Next review: {nextDue}
              </>
            )}
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold min-h-[44px] active:bg-blue-600 transition-colors"
          >
            Back to deck
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center max-w-md mx-auto w-full px-4">
        <div className="text-center">
          <p className="text-5xl mb-4">&#9989;</p>
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">
            Session done!
          </h2>
          <p className="text-zinc-500">
            You reviewed {queue.length} card{queue.length !== 1 ? "s" : ""}.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold min-h-[44px] active:bg-blue-600 transition-colors"
          >
            Back to deck
          </button>
        </div>
      </div>
    );
  }

  const card = queue[index];
  if (!card) return null;

  const { question, answer } = applyDirection(card, direction);

  return (
    <div
      className="flex flex-col flex-1 max-w-md mx-auto w-full px-4 pt-4 pb-6"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-blue-500 font-medium min-h-[44px] flex items-center"
        >
          &larr; Deck
        </button>
        <span className="text-sm text-zinc-500 ml-auto">
          Card {index + 1} of {queue.length}
        </span>
      </div>
      <ProgressBar current={index + 1} total={queue.length} />

      {/* Card */}
      <div className="flex-1 flex items-center justify-center my-6">
        <FlashCard
          front={question}
          back={answer}
          flipped={flipped}
          onClick={() => setFlipped((f) => !f)}
        />
      </div>

      {/* Rating bar */}
      {flipped && <RatingBar card={card} onRate={handleRate} />}
    </div>
  );
}
