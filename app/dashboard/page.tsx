"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CardProgress } from "@/lib/types";
import { loadProgress } from "@/lib/storage";
import { isDueToday, isMastered, isUnseen } from "@/lib/srs";
import StatCard from "@/components/StatCard";
import NavBar from "@/components/NavBar";

export default function DashboardPage() {
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

  const modes = [
    {
      href: "/study/srs",
      name: "Spaced repetition",
      desc: `${dueCount} cards due \u00b7 SM-2 algorithm`,
      icon: (
        <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      href: "/study/flip",
      name: "Classic flip",
      desc: "Browse cards freely",
      icon: (
        <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      href: "/study/typing",
      name: "Typing mode",
      desc: "Type the answer",
      icon: (
        <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
  ];

  if (cards.length === 0) return null;

  return (
    <div className="flex flex-col flex-1 max-w-md mx-auto w-full px-4 pt-8 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Your deck</h1>
        <p className="text-zinc-500 text-sm">{cards.length} cards total</p>
      </div>

      {/* Stats row */}
      <div className="flex gap-3 mb-8">
        <StatCard
          value={dueCount}
          label="Due today"
          color={dueCount > 0 ? "text-orange-500" : "text-zinc-900"}
        />
        <StatCard value={masteredCount} label="Mastered" color="text-green-500" />
        <StatCard value={unseenCount} label="Unseen" />
      </div>

      {/* Study modes */}
      <div className="flex flex-col gap-2">
        {modes.map((mode) => (
          <button
            key={mode.href}
            onClick={() => router.push(mode.href)}
            className="flex items-center gap-4 bg-white rounded-xl border border-zinc-200 p-4 min-h-[44px] active:bg-zinc-50 transition-colors text-left w-full"
          >
            {mode.icon}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-zinc-900">{mode.name}</p>
              <p className="text-sm text-zinc-500 truncate">{mode.desc}</p>
            </div>
            <svg
              className="w-5 h-5 text-zinc-400 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>

      <NavBar />
    </div>
  );
}
