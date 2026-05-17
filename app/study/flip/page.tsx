"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CardProgress } from "@/lib/types";
import { loadProgress, loadSettings } from "@/lib/storage";
import { isDueToday, isMastered, isUnseen } from "@/lib/srs";
import FlashCard from "@/components/FlashCard";
import ProgressBar from "@/components/ProgressBar";

type Pool = "all" | "unseen" | "due" | "mastered";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function filterCards(cards: CardProgress[], pool: Pool): CardProgress[] {
  switch (pool) {
    case "unseen":
      return cards.filter(isUnseen);
    case "due":
      return cards.filter(isDueToday);
    case "mastered":
      return cards.filter(isMastered);
    default:
      return cards;
  }
}

export default function FlipPage() {
  const router = useRouter();
  const [allCards, setAllCards] = useState<CardProgress[]>([]);
  const [queue, setQueue] = useState<CardProgress[]>([]);
  const [pool, setPool] = useState<Pool>("all");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [direction, setDirection] = useState("front-back");

  useEffect(() => {
    const progress = loadProgress();
    const list = Object.values(progress);
    if (list.length === 0) {
      router.replace("/");
      return;
    }
    setAllCards(list);
    setQueue(shuffle(list));
    const settings = loadSettings();
    setDirection(settings.studyDirection);
  }, [router]);

  const selectPool = useCallback(
    (p: Pool) => {
      setPool(p);
      const filtered = filterCards(allCards, p);
      setQueue(shuffle(filtered));
      setIndex(0);
      setFlipped(false);
      setCorrect(0);
      setIncorrect(0);
      setDone(false);
    },
    [allCards]
  );

  const advance = useCallback(
    (knew: boolean) => {
      if (knew) setCorrect((c) => c + 1);
      else setIncorrect((c) => c + 1);

      if (index + 1 >= queue.length) {
        setDone(true);
      } else {
        setIndex((i) => i + 1);
        setFlipped(false);
      }
    },
    [index, queue.length]
  );

  if (done) {
    const total = correct + incorrect;
    return (
      <div className="flex flex-col flex-1 items-center justify-center max-w-md mx-auto w-full px-4">
        <div className="text-center">
          <p className="text-5xl mb-4">&#128218;</p>
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">
            Session complete!
          </h2>
          <p className="text-zinc-500 mb-1">
            {total} card{total !== 1 ? "s" : ""} reviewed
          </p>
          <p className="text-green-600 font-medium">
            {correct} correct &middot;{" "}
            <span className="text-red-500">{incorrect} incorrect</span>
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

  if (queue.length === 0 && allCards.length > 0) {
    return (
      <div className="flex flex-col flex-1 max-w-md mx-auto w-full px-4 pt-4">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-blue-500 font-medium min-h-[44px] flex items-center self-start"
        >
          &larr; Deck
        </button>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-zinc-500">
              No cards in this pool. Try a different filter.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {(["all", "unseen", "due", "mastered"] as Pool[]).map((p) => (
                <button
                  key={p}
                  onClick={() => selectPool(p)}
                  className={`px-4 py-2 rounded-lg text-sm min-h-[44px] transition-colors ${
                    pool === p
                      ? "bg-blue-500 text-white"
                      : "bg-zinc-100 text-zinc-700 active:bg-zinc-200"
                  }`}
                >
                  {p === "all"
                    ? "All cards"
                    : p === "unseen"
                    ? "Unseen only"
                    : p === "due"
                    ? "Due today"
                    : "Mastered"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (queue.length === 0) return null;

  const card = queue[index];
  const isReversed =
    direction === "back-front" ||
    (direction === "random" && Math.random() < 0.5);
  const question = isReversed ? card.back : card.front;
  const answer = isReversed ? card.front : card.back;

  return (
    <div className="flex flex-col flex-1 max-w-md mx-auto w-full px-4 pt-4 pb-6">
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

      {/* Pool selector */}
      <div className="flex gap-2 mt-3 overflow-x-auto">
        {(["all", "unseen", "due", "mastered"] as Pool[]).map((p) => (
          <button
            key={p}
            onClick={() => selectPool(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap min-h-[36px] transition-colors ${
              pool === p
                ? "bg-blue-500 text-white"
                : "bg-zinc-100 text-zinc-600 active:bg-zinc-200"
            }`}
          >
            {p === "all"
              ? "All"
              : p === "unseen"
              ? "Unseen"
              : p === "due"
              ? "Due"
              : "Mastered"}
          </button>
        ))}
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center my-6">
        <FlashCard
          front={question}
          back={answer}
          flipped={flipped}
          onClick={() => setFlipped((f) => !f)}
        />
      </div>

      {/* Know / Don't know */}
      {flipped && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => advance(false)}
            className="py-3 bg-red-500 text-white rounded-xl font-semibold min-h-[44px] active:bg-red-600 transition-colors"
          >
            Don&apos;t know
          </button>
          <button
            onClick={() => advance(true)}
            className="py-3 bg-green-500 text-white rounded-xl font-semibold min-h-[44px] active:bg-green-600 transition-colors"
          >
            Know
          </button>
        </div>
      )}
    </div>
  );
}
