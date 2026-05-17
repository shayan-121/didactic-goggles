export interface RawCard {
  front: string;
  back: string;
}

export interface CardProgress {
  key: string;
  front: string;
  back: string;
  interval: number;
  easeFactor: number;
  repetitions: number;
  dueDate: string;
  lastReviewed: string | null;
}

export interface DeckMeta {
  loadedAt: string;
  totalCards: number;
}

export interface Settings {
  studyDirection: "front-back" | "back-front" | "random";
  sessionSize: number; // 10, 20, 50, or 0 for all
}

export interface ActiveDeck {
  id: string;
  name: string;
}

export interface DeckManifestEntry {
  id: string;
  name: string;
  description: string;
  file: string;
  table: string;
}
