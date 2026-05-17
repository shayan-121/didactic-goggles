"use client";

interface StatCardProps {
  value: number;
  label: string;
  color?: string;
}

export default function StatCard({
  value,
  label,
  color = "text-zinc-900",
}: StatCardProps) {
  return (
    <div className="flex-1 bg-white rounded-xl border border-zinc-200 p-4 flex flex-col items-center justify-center min-h-[80px]">
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
      <span className="text-xs text-zinc-500 mt-1">{label}</span>
    </div>
  );
}
