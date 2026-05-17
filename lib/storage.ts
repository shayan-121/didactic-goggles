import { CardProgress, DeckMeta, RawCard, Settings } from "./types";
import { cardKey } from "./cardKey";

const PROGRESS_KEY = "fc_progress";
const META_KEY = "fc_meta";
const SETTINGS_KEY = "fc_settings";

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private browsing or quota exceeded
  }
}

export function loadProgress(): Record<string, CardProgress> {
  const raw = safeGetItem(PROGRESS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveProgress(data: Record<string, CardProgress>): void {
  safeSetItem(PROGRESS_KEY, JSON.stringify(data));
}

export function mergeCards(
  raw: RawCard[],
  existing: Record<string, CardProgress>
): Record<string, CardProgress> {
  const today = new Date().toISOString().slice(0, 10);
  const result: Record<string, CardProgress> = {};

  for (const card of raw) {
    const key = cardKey(card.front, card.back);
    if (existing[key]) {
      result[key] = existing[key];
    } else {
      result[key] = {
        key,
        front: card.front,
        back: card.back,
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
        dueDate: today,
        lastReviewed: null,
      };
    }
  }

  return result;
}

export function loadMeta(): DeckMeta | null {
  const raw = safeGetItem(META_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveMeta(meta: DeckMeta): void {
  safeSetItem(META_KEY, JSON.stringify(meta));
}

export function loadSettings(): Settings {
  const raw = safeGetItem(SETTINGS_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fall through
    }
  }
  return { studyDirection: "front-back", sessionSize: 0 };
}

export function saveSettings(settings: Settings): void {
  safeSetItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function clearAllProgress(): void {
  try {
    localStorage.removeItem(PROGRESS_KEY);
    localStorage.removeItem(META_KEY);
  } catch {
    // ignore
  }
}
