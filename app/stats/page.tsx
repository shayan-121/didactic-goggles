"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CardProgress } from "@/lib/types";
import { loadProgress } from "@/lib/storage";
import { isDueToday, isMastered, isUnseen, isLearning } from "@/lib/srs";
import NavBar from "@/components/NavBar";

function bucketLabel(interval: number): string {
  if (interval === 0) return "New";
  if (interval === 1) return "1d";
  if (interval <= 7) return "2-7d";
  if (interval <= 21) return "8-21d";
  return "21d+";
}

const BUCKET_ORDER = ["New", "1d", "2-7d", "8-21d", "21d+"];

export default function StatsPage() {
  const router = useRouter();
  const [cards, setCards] = useState<CardProgress[]>([]);

  useEffect(() => {
    const progress = loadProgress();
    const list = Object.values(progress);
    if (list.length === 0) {
      router.replace("/");
      return;
    }
    setCards(list);
  }, [router]);

  const dueCount = useMemo(() => cards.filter(isDueToday).length, [cards]);
  const masteredCount = useMemo(() => cards.filter(isMastered).length, [cards]);
  const unseenCount = useMemo(() => cards.filter(isUnseen).length, [cards]);
  const learningCount = useMemo(() => cards.filter(isLearning).length, [cards]);

  const buckets = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const b of BUCKET_ORDER) counts[b] = 0;
    for (const card of cards) {
      counts[bucketLabel(card.interval)]++;
    }
    return counts;
  }, [cards]);

  const maxBucket = useMemo(
    () => Math.max(1, ...Object.values(buckets)),
    [buckets]
  );

  if (cards.length === 0) return null;

  const stats = [
    { label: "Total", value: cards.length, color: "text-zinc-900" },
    {
      label: "Due today",
      value: dueCount,
      color: dueCount > 0 ? "text-orange-500" : "text-zinc-900",
    },
    { label: "Mastered", value: masteredCount, color: "text-green-500" },
    { label: "Learning", value: learningCount, color: "text-blue-500" },
    { label: "Unseen", value: unseenCount, color: "text-zinc-500" },
  ];

  const barColors: Record<string, string> = {
    New: "bg-zinc-400",
    "1d": "bg-red-400",
    "2-7d": "bg-orange-400",
    "8-21d": "bg-blue-400",
    "21d+": "bg-green-400",
  };

  return (
    <div className="flex flex-col flex-1 max-w-md mx-auto w-full px-4 pt-8 pb-24">
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">Statistics</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-zinc-200 p-4"
          >
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-zinc-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Interval distribution */}
      <h2 className="text-lg font-semibold text-zinc-900 mb-4">
        Interval distribution
      </h2>
      <div className="bg-white rounded-xl border border-zinc-200 p-4">
        <div className="flex items-end gap-3 h-40">
          {BUCKET_ORDER.map((bucket) => (
            <div
              key={bucket}
              className="flex-1 flex flex-col items-center justify-end h-full"
            >
              <span className="text-xs font-medium text-zinc-700 mb-1">
                {buckets[bucket]}
              </span>
              <div
                className={`w-full rounded-t-md ${barColors[bucket]}`}
                style={{
                  height: `${(buckets[bucket] / maxBucket) * 100}%`,
                  minHeight: buckets[bucket] > 0 ? "4px" : "0px",
                }}
              />
              <span className="text-xs text-zinc-500 mt-2">{bucket}</span>
            </div>
          ))}
        </div>
      </div>

      <NavBar />
    </div>
  );
}
