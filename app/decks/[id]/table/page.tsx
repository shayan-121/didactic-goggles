"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DeckManifestEntry } from "@/lib/types";

export default function TablePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [deck, setDeck] = useState<DeckManifestEntry | null>(null);
  const [markdown, setMarkdown] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/decks/index.json");
        const manifest: DeckManifestEntry[] = await res.json();
        const entry = manifest.find((d) => d.id === params.id);
        if (!entry) {
          setLoading(false);
          return;
        }
        setDeck(entry);
        const mdRes = await fetch(`/decks/${entry.table}`);
        const mdText = await mdRes.text();
        setMarkdown(mdText);
      } catch {
        // ignore
      }
      setLoading(false);
    }
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <p className="text-zinc-500 mb-4">Deck not found.</p>
        <button
          onClick={() => router.push("/")}
          className="text-blue-500 font-medium"
        >
          &larr; Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 max-w-md mx-auto w-full px-4 pt-6 pb-10">
      <button
        onClick={() => router.push("/")}
        className="text-blue-500 font-medium min-h-[44px] flex items-center self-start mb-4"
      >
        &larr; Back
      </button>

      <h1 className="text-2xl font-bold text-zinc-900 mb-6">{deck.name}</h1>

      <div className="overflow-x-auto -mx-4 px-4">
        <div className="prose prose-zinc max-w-none table-wrapper">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              table: ({ children }) => (
                <table className="w-full border-collapse text-sm">
                  {children}
                </table>
              ),
              thead: ({ children }) => (
                <thead className="bg-zinc-100">{children}</thead>
              ),
              th: ({ children }) => (
                <th className="text-left px-4 py-3 font-semibold text-zinc-700 border-b border-zinc-200">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="px-4 py-3 text-zinc-800 border-b border-zinc-100">
                  {children}
                </td>
              ),
              tr: ({ children, ...props }) => {
                const isInBody =
                  props.node?.position &&
                  (props.node.position.start.line ?? 0) > 3;
                return (
                  <tr
                    className={
                      isInBody ? "even:bg-zinc-50 odd:bg-white" : ""
                    }
                  >
                    {children}
                  </tr>
                );
              },
            }}
          >
            {markdown}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
