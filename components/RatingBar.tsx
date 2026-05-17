"use client";

import { CardProgress } from "@/lib/types";
import { projectedInterval } from "@/lib/srs";

interface RatingBarProps {
  card: CardProgress;
  onRate: (quality: number) => void;
}

const buttons = [
  { label: "Again", quality: 0, color: "bg-red-500 active:bg-red-600" },
  { label: "Hard", quality: 1, color: "bg-orange-500 active:bg-orange-600" },
  { label: "Good", quality: 3, color: "bg-blue-500 active:bg-blue-600" },
  { label: "Easy", quality: 5, color: "bg-green-500 active:bg-green-600" },
];

export default function RatingBar({ card, onRate }: RatingBarProps) {
  return (
    <div className="grid grid-cols-4 gap-2 w-full">
      {buttons.map((btn) => (
        <button
          key={btn.label}
          onClick={() => onRate(btn.quality)}
          className={`${btn.color} text-white rounded-xl py-3 min-h-[44px] flex flex-col items-center justify-center transition-colors`}
        >
          <span className="text-sm font-semibold">{btn.label}</span>
          <span className="text-xs opacity-80">
            {projectedInterval(card, btn.quality)}
          </span>
        </button>
      ))}
    </div>
  );
}
