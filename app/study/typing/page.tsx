"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { CardProgress } from "@/lib/types";
import { loadProgress, saveProgress, loadSettings } from "@/lib/storage";
import { isDueToday, isMastered, isUnseen, updateSRS } from "@/lib/srs";
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

type CheckState = "input" | "correct" | "wrong";

export default function TypingPage() {
  const router = useRouter();
  const [allCards, setAllCards] = useState<CardProgress[]>([]);
  const [queue, setQueue] = useState<CardProgress[]>([]);
  const [pool, setPool] = useState<Pool>("all");
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [checkState, setCheckState] = useState<CheckState>("input");
  const [done, setDone] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [direction, setDirection] = useState("front-back");
  const progressRef = useRef<Record<string, CardProgress>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const progress = loadProgress();
    progressRef.current = progress;
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
      setInput("");
      setCheckState("input");
      setCorrect(0);
      setIncorrect(0);
      setSkipped(0);
      setDone(false);
    },
    [allCards]
  );

  const advance = useCallback(() => {
    if (index + 1 >= queue.length) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setInput("");
      setCheckState("input");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [index, queue.length]);

  const handleCheck = useCallback(() => {
    const card = queue[index];
    const isReversed =
      direction === "back-front" ||
      (direction === "random" && Math.random() < 0.5);
    const answer = isReversed ? card.front : card.back;

    if (input.trim().toLowerCase() === answer.trim().toLowerCase()) {
      setCheckState("correct");
      setCorrect((c) => c + 1);
      // Auto-update SRS as correct (q=3)
      const updated = updateSRS(card, 3);
      progressRef.current[card.key] = updated;
      saveProgress(progressRef.current);
    } else {
      setCheckState("wrong");
    }
  }, [queue, index, input, direction]);

  const handleSelfAssess = useCallback(
    (wasCorrect: boolean) => {
      const card = queue[index];
      const updated = updateSRS(card, wasCorrect ? 3 : 0);
      progressRef.current[card.key] = updated;
      saveProgress(progressRef.current);
      if (wasCorrect) setCorrect((c) => c + 1);
      else setIncorrect((c) => c + 1);
      advance();
    },
    [queue, index, advance]
  );

  const handleSkip = useCallback(() => {
    setSkipped((s) => s + 1);
    advance();
  }, [advance]);

  if (done) {
    const total = correct + incorrect;
    return (
      <div className="flex flex-col flex-1 items-center justify-center max-w-md mx-auto w-full px-4">
        <div className="text-center">
          <p className="text-5xl mb-4">&#9999;&#65039;</p>
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">
            Session complete!
          </h2>
          <p className="text-zinc-500 mb-1">
            {total} card{total !== 1 ? "s" : ""} answered
            {skipped > 0 ? `, ${skipped} skipped` : ""}
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
            <p className="text-zinc-500 mb-4">
              No cards in this pool. Try a different filter.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
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
                    ? "All"
                    : p === "unseen"
                    ? "Unseen"
                    : p === "due"
                    ? "Due"
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

      {/* Question card */}
      <div className="flex-1 flex flex-col items-center justify-center my-6">
        <div className="w-full bg-white rounded-2xl border border-zinc-200 shadow-lg p-6 min-h-[200px] flex flex-col items-center justify-center">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-4">
            {isReversed ? "back" : "front"}
          </span>
          <p className="text-2xl font-semibold text-zinc-900 text-center break-words">
            {question}
          </p>
        </div>

        {/* Input area */}
        <div className="w-full mt-6">
          {checkState === "input" && (
            <>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && input.trim()) handleCheck();
                }}
                placeholder="Type your answer..."
                className="w-full px-4 py-3 border border-zinc-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <div className="flex gap-3 mt-3">
                <button
                  onClick={handleSkip}
                  className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl font-medium min-h-[44px] active:bg-zinc-200 transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={handleCheck}
                  disabled={!input.trim()}
                  className={`flex-1 py-3 rounded-xl font-semibold min-h-[44px] transition-colors ${
                    input.trim()
                      ? "bg-blue-500 text-white active:bg-blue-600"
                      : "bg-zinc-300 text-zinc-500 cursor-not-allowed"
                  }`}
                >
                  Check
                </button>
              </div>
            </>
          )}

          {checkState === "correct" && (
            <div className="text-center">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-3">
                <p className="text-green-700 font-semibold text-lg">
                  Correct &#10003;
                </p>
              </div>
              <button
                onClick={advance}
                className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold min-h-[44px] active:bg-blue-600 transition-colors"
              >
                Next
              </button>
            </div>
          )}

          {checkState === "wrong" && (
            <div className="text-center">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-2">
                <p className="text-red-600 font-semibold mb-1">Your answer:</p>
                <p className="text-red-700">{input}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-3">
                <p className="text-green-600 font-semibold mb-1">
                  Correct answer:
                </p>
                <p className="text-green-700">{answer}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleSelfAssess(false)}
                  className="py-3 bg-red-500 text-white rounded-xl font-semibold min-h-[44px] active:bg-red-600 transition-colors"
                >
                  Wrong
                </button>
                <button
                  onClick={() => handleSelfAssess(true)}
                  className="py-3 bg-green-500 text-white rounded-xl font-semibold min-h-[44px] active:bg-green-600 transition-colors"
                >
                  Correct
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
