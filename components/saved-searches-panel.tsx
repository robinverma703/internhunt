"use client";

import { useState, useTransition } from "react";
import { Bell, Trash2, Sparkles } from "lucide-react";
import { deleteSavedSearch, markSearchSeen } from "@/lib/actions/save-search";

export type SavedSearchWithCount = {
  id: string;
  keywords: string | null;
  category: string | null;
  city: string | null;
  newCount: number;
};

function labelFor(s: SavedSearchWithCount) {
  const parts = [s.keywords, s.category, s.city].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "All new listings";
}

export default function SavedSearchesPanel({
  searches,
}: {
  searches: SavedSearchWithCount[];
}) {
  const [items, setItems] = useState(searches);
  const [isPending, startTransition] = useTransition();

  if (items.length === 0) return null;

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((s) => s.id !== id));
    startTransition(() => {
      deleteSavedSearch(id);
    });
  }

  function handleSeen(id: string) {
    setItems((prev) => prev.map((s) => (s.id === id ? { ...s, newCount: 0 } : s)));
    startTransition(() => {
      markSearchSeen(id);
    });
  }

  return (
    <div className="mb-8 rounded-2xl border border-line/70 bg-paper p-5">
      <div className="mb-3 flex items-center gap-2">
        <Bell size={15} className="text-signal" />
        <h3 className="text-sm font-semibold text-graphite">Your saved searches</h3>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3"
          >
            <div className="flex items-center gap-2 min-w-0">
              {s.newCount > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-mint-dim px-2 py-0.5 text-[11px] font-semibold text-mint">
                  <Sparkles size={10} />
                  {s.newCount} new
                </span>
              )}
              <p className="truncate text-sm text-graphite">{labelFor(s)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {s.newCount > 0 && (
                <button
                  data-cursor-hover
                  onClick={() => handleSeen(s.id)}
                  className="text-xs font-medium text-signal hover:underline"
                >
                  Mark seen
                </button>
              )}
              <button
                data-cursor-hover
                onClick={() => handleDelete(s.id)}
                aria-label="Delete saved search"
                className="text-muted hover:text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}