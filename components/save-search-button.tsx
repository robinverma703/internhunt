"use client";

import { useState } from "react";
import { Bell, Check, Loader2 } from "lucide-react";
import { saveSearch } from "@/lib/actions/save-search";

export default function SaveSearchButton({
  keywords,
  category,
  city,
}: {
  keywords: string;
  category: string;
  city: string;
}) {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handleClick() {
    setState("saving");
    const result = await saveSearch({ keywords, category, city });
    if (result?.error) {
      setState("error");
      setTimeout(() => setState("idle"), 2000);
      return;
    }
    setState("saved");
    setTimeout(() => setState("idle"), 2000);
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === "saving"}
      data-cursor-hover
      className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-signal/60 hover:text-signal disabled:opacity-60"
    >
      {state === "saving" ? (
        <Loader2 size={12} className="animate-spin" />
      ) : state === "saved" ? (
        <Check size={12} className="text-mint" />
      ) : (
        <Bell size={12} />
      )}
      {state === "saved" ? "Alert saved" : "Save this search"}
    </button>
  );
}