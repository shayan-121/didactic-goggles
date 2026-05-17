"use client";

interface FlashCardProps {
  front: string;
  back: string;
  flipped: boolean;
  onClick: () => void;
}

export default function FlashCard({
  front,
  back,
  flipped,
  onClick,
}: FlashCardProps) {
  return (
    <div
      className="card-container w-full cursor-pointer select-none"
      style={{ perspective: "1000px" }}
      onClick={onClick}
    >
      <div
        className={`card-inner relative w-full min-h-[300px] transition-transform duration-400 ${
          flipped ? "flipped" : ""
        }`}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-white shadow-lg border border-zinc-200 p-6"
          style={{ backfaceVisibility: "hidden" }}
        >
          <span className="absolute top-3 left-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">
            front
          </span>
          <p className="text-2xl font-semibold text-zinc-900 text-center break-words">
            {front}
          </p>
          <span className="absolute bottom-4 text-xs text-zinc-400">
            Tap to flip
          </span>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-zinc-50 shadow-lg border border-zinc-200 p-6"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <span className="absolute top-3 left-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">
            back
          </span>
          <p className="text-2xl font-semibold text-zinc-900 text-center break-words">
            {back}
          </p>
        </div>
      </div>
    </div>
  );
}
