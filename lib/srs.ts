import { CardProgress } from "./types";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function updateSRS(card: CardProgress, quality: number): CardProgress {
  let { interval, easeFactor, repetitions } = card;
  const today = todayISO();

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  }

  easeFactor =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  easeFactor = Math.max(1.3, easeFactor);

  return {
    ...card,
    interval,
    easeFactor,
    repetitions,
    dueDate: addDays(today, interval),
    lastReviewed: today,
  };
}

export function projectedInterval(
  card: CardProgress,
  quality: number
): string {
  if (quality === 0) return "< 1 min";
  if (quality === 1) return "~6 min";

  let { interval, easeFactor, repetitions } = card;
  if (repetitions === 0) interval = 1;
  else if (repetitions === 1) interval = 6;
  else interval = Math.round(interval * easeFactor);

  if (quality === 5) {
    // Easy gets an extra bump
    if (repetitions === 0) interval = 1;
    if (repetitions <= 1) interval = 6;
    interval = Math.round(interval * easeFactor);
  }

  if (interval === 1) return "1 day";
  return `${interval} days`;
}

export function isDueToday(card: CardProgress): boolean {
  return card.dueDate <= todayISO();
}

export function isMastered(card: CardProgress): boolean {
  return card.repetitions >= 4 && card.interval >= 21;
}

export function isUnseen(card: CardProgress): boolean {
  return card.repetitions === 0;
}

export function isLearning(card: CardProgress): boolean {
  return card.repetitions >= 1 && card.repetitions <= 3;
}

export function nextDueDate(
  cards: CardProgress[]
): string | null {
  const future = cards
    .filter((c) => c.dueDate > todayISO())
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return future.length > 0 ? future[0].dueDate : null;
}
