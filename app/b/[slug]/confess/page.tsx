"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CATEGORY_INFO } from "@/app/lib/utils";
import EmojiPicker from "@/app/components/EmojiPicker";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

const CATEGORIES = [
  "regret",
  "love",
  "guilt",
  "relief",
  "longing",
  "mischief",
  "obsession",
  "pride",
  "fear",
  "envy",
  "deep-dark",
];

export default function ConfessPage() {
  const params = useParams();
  const slug = params.slug as string;

  const board = useQuery(api.boards.getBySlug, { slug });
  const createConfession = useMutation(api.confessions.create);

  const [text, setText] = useState("");
  const [category, setCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isGlobal, setIsGlobal] = useState(true);
  const [disappearMode, setDisappearMode] = useState<
    | "never"
    | "5m"
    | "24h"
    | "7d"
    | "views25"
    | "custom-time"
    | "custom-views"
  >("never");
  const [customExpireAt, setCustomExpireAt] = useState("");
  const [customViews, setCustomViews] = useState("");
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const parsedCustomExpireAt = customExpireAt
    ? new Date(customExpireAt).getTime()
    : NaN;
  const parsedCustomViews = Number.parseInt(customViews, 10);
  const isCustomTimeInvalid =
    disappearMode === "custom-time" &&
    (!Number.isFinite(parsedCustomExpireAt) ||
      parsedCustomExpireAt <= Date.now() + 1000);
  const isCustomViewsInvalid =
    disappearMode === "custom-views" &&
    (!Number.isInteger(parsedCustomViews) ||
      parsedCustomViews < 1 ||
      parsedCustomViews > 10000);

  const handleSubmit = async () => {
    if (
      !text.trim() ||
      !category ||
      !board ||
      wordCount > 500 ||
      isCustomTimeInvalid ||
      isCustomViewsInvalid
    ) {
      return;
    }
    setIsSubmitting(true);
    try {
      await createConfession({
        boardId: board._id,
        text: text.trim(),
        category,
        isGlobal,
        expiresAt:
          disappearMode === "5m"
            ? Date.now() + 5 * 60 * 1000
            : disappearMode === "24h"
              ? Date.now() + 24 * 60 * 60 * 1000
              : disappearMode === "7d"
                ? Date.now() + 7 * 24 * 60 * 60 * 1000
                : disappearMode === "custom-time"
                  ? parsedCustomExpireAt
                  : undefined,
        maxViews:
          disappearMode === "views25"
            ? 25
            : disappearMode === "custom-views"
              ? parsedCustomViews
              : undefined,
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Failed to submit confession:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfessAgain = () => {
    setText("");
    setCategory("");
    setSubmitted(false);
  };

  const handleEmojiSelect = (emoji: string) => {
    const currentWords = text.trim() ? text.trim().split(/\s+/).length : 0;
    if (currentWords <= 500) {
      setText((prev) => prev + emoji);
    }
  };

  if (board === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-black/10 border-t-black/40 rounded-full animate-spin" />
      </div>
    );
  }

  if (board === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-white">
        <span className="text-5xl mb-4">🫣</span>
        <h1 className="text-2xl font-bold mb-2 serif">Board not found</h1>
        <Link
          href="/"
          className="px-6 py-3 bg-black text-white rounded-xl text-sm font-medium mt-4"
        >
          Go Home
        </Link>
      </div>
    );
  }

  const successMessages: Record<
    string,
    { emoji: string; line: string; sub: string }
  > = {
    love: {
      emoji: "💗",
      line: "Brave of you.",
      sub: "Love is always worth saying, even anonymously.",
    },
    regret: {
      emoji: "🌊",
      line: "Let it wash away.",
      sub: "Naming it is the first step to leaving it behind.",
    },
    guilt: {
      emoji: "⚖️",
      line: "Weight lifted.",
      sub: "You don't have to carry that alone anymore.",
    },
    mischief: {
      emoji: "😈",
      line: "Noted. Quietly.",
      sub: "Your chaos is safe in our little vault.",
    },
    "deep-dark": {
      emoji: "🕳️",
      line: "Swallowed whole.",
      sub: "It's gone. No one will know it came from you.",
    },
    longing: {
      emoji: "🥺",
      line: "Felt that.",
      sub: "Some things you just have to say out loud.",
    },
    relief: {
      emoji: "😮‍💨",
      line: "Exhale.",
      sub: "Some truths are lighter once they're out.",
    },
    obsession: {
      emoji: "🫠",
      line: "We get it.",
      sub: "At least you're being honest about it.",
    },
    pride: {
      emoji: "💪",
      line: "As you should.",
      sub: "This one goes in the hall of fame.",
    },
    fear: {
      emoji: "😰",
      line: "You're not alone.",
      sub: "Fear shared is fear halved.",
    },
    envy: {
      emoji: "👀",
      line: "Seen.",
      sub: "We've all looked at someone and wished.",
    },
    default: {
      emoji: "✨",
      line: "It's out there now.",
      sub: "Your truth lives in the library of secrets.",
    },
  };

  const success = successMessages[category] || successMessages.default;

  // ── Success screen ──
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 page-enter bg-[#faf8f5]">
        <div className="max-w-sm w-full text-center">
          <div className="bg-white rounded-2xl border border-black/5 p-8 shadow-xl shadow-black/[0.03]">
            <span className="text-5xl block mb-4">{success.emoji}</span>
            <h1 className="text-xl font-black serif tracking-tight text-black mb-1">
              {success.line}
            </h1>
            <p className="text-xs text-black/35 font-medium mb-7">
              {success.sub}
            </p>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleConfessAgain}
                className="w-full py-3.5 bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95"
              >
                Drop Another One
              </button>
              <Link
                href={`/b/${slug}/spill`}
                className="w-full py-3.5 bg-rose-50 text-rose-900 border border-rose-200/60 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-rose-100 transition-colors block"
              >
                Write Long Gossip
              </Link>
              <Link
                href={`/b/${slug}`}
                className="w-full py-3.5 text-[10px] text-black/30 font-bold uppercase tracking-widest hover:text-black transition-colors block"
              >
                Back to Board
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Confess form ──
  return (
    <div className="min-h-screen page-enter bg-[#faf8f5] text-black">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center px-5 py-3 bg-[#faf8f5]/85 backdrop-blur-xl border-b border-black/5">
        <Link
          href={`/b/${slug}`}
          className="flex items-center gap-1.5 text-black/30 hover:text-black transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <span className="flex-1 text-center text-[10px] font-black uppercase tracking-[0.25em] text-black/20">
          {board.name}
        </span>
        <div className="w-4" />
      </header>

      <main className="max-w-lg mx-auto px-5 py-8">
        {/* Intro */}
        <div className="text-center mb-8">
          <span className="text-3xl block mb-3">🫖</span>
          <h1 className="text-xl font-black serif tracking-tight text-black mb-1">
            Got something to say?
          </h1>
          <p className="text-[11px] text-black/30 font-medium tracking-wide mb-4">
            No names. No judgment. Just the raw truth.
          </p>
          <Link
            href={`/b/${slug}/spill`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-900 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-rose-200/50 hover:bg-rose-100 transition-colors"
          >
            <BookOpen size={12} />
            Or open Long Gossip books
          </Link>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-black/5 shadow-xl shadow-black/[0.03]">
          {/* Textarea */}
          <div className="p-5 pb-0">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="write what's been sitting inside you..."
              rows={5}
              autoFocus
              className="w-full bg-transparent resize-none outline-none text-sm leading-relaxed placeholder:text-black/15 serif text-black/80"
            />
          </div>
          <div className="flex items-center justify-between px-5 pb-4">
            <div className="relative">
              <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            </div>
            <span
              className={`text-[10px] font-mono ${wordCount > 500 ? "text-red-500 font-bold" : "text-black/25"}`}
            >
              {wordCount > 500
                ? `-${wordCount - 500} words`
                : `${500 - wordCount} words left`}
            </span>
          </div>

          <div className="h-px bg-black/5" />

          {/* Public Feed Toggle */}
          <div className="p-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-black/60">
                Show in public feed?
              </div>
              <div className="text-[9px] text-black/25 font-medium mt-0.5">
                {isGlobal
                  ? "Visible in global explore"
                  : "Visible only on this board"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsGlobal(!isGlobal)}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                isGlobal ? "bg-black" : "bg-black/10"
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${
                  isGlobal ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>

          <div className="h-px bg-black/5" />

          {/* Disappearing Tea */}
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/25">
                Disappearing Tea
              </p>
              <span className="text-[8px] font-medium text-black/15 uppercase tracking-wider">
                Optional
              </span>
            </div>

            {/* Main options */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {[
                { key: "never", label: "Keep Forever", sub: "Default" },
                { key: "5m", label: "5 Minutes", sub: "Auto-delete" },
                { key: "24h", label: "24 Hours", sub: "Auto-delete" },
                { key: "7d", label: "7 Days", sub: "Auto-delete" },
                { key: "views25", label: "25 Views", sub: "Then vanish" },
              ].map((opt) => {
                const active = disappearMode === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() =>
                      setDisappearMode(opt.key as typeof disappearMode)
                    }
                    className={`rounded-xl border p-3 text-left transition-all ${
                      active
                        ? "bg-black text-white border-black shadow-md shadow-black/10"
                        : "bg-[#faf8f5] border-black/5 hover:border-black/15"
                    }`}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider">
                      {opt.label}
                    </p>
                    <p
                      className={`text-[9px] mt-0.5 ${active ? "text-white/65" : "text-black/25"}`}
                    >
                      {opt.sub}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Custom options */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setDisappearMode("custom-time")}
                className={`w-full rounded-xl border p-3 text-left transition-all ${
                  disappearMode === "custom-time"
                    ? "bg-black text-white border-black shadow-md shadow-black/10"
                    : "bg-[#faf8f5] border-black/5 hover:border-black/15"
                }`}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider">
                  Custom Time
                </p>
                <p
                  className={`text-[9px] mt-0.5 ${disappearMode === "custom-time" ? "text-white/65" : "text-black/25"}`}
                >
                  Pick exact date
                </p>
              </button>

              <button
                type="button"
                onClick={() => setDisappearMode("custom-views")}
                className={`w-full rounded-xl border p-3 text-left transition-all ${
                  disappearMode === "custom-views"
                    ? "bg-black text-white border-black shadow-md shadow-black/10"
                    : "bg-[#faf8f5] border-black/5 hover:border-black/15"
                }`}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider">
                  Custom Views
                </p>
                <p
                  className={`text-[9px] mt-0.5 ${disappearMode === "custom-views" ? "text-white/65" : "text-black/25"}`}
                >
                  Set own limit
                </p>
              </button>
            </div>

            {disappearMode === "custom-time" && (
              <div className="mt-3">
                <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-black/30 mb-1.5 block">
                  Vanish At (Local Time)
                </label>
                <input
                  type="datetime-local"
                  value={customExpireAt}
                  onChange={(e) => setCustomExpireAt(e.target.value)}
                  className={`w-full text-sm font-medium bg-[#faf8f5] border rounded-xl px-4 py-3 outline-none transition-all ${
                    isCustomTimeInvalid
                      ? "border-red-300 focus:ring-2 focus:ring-red-100"
                      : "border-black/5 focus:border-black/15 focus:ring-2 focus:ring-black/5"
                  }`}
                />
                {isCustomTimeInvalid && (
                  <p className="text-[10px] text-red-500 font-bold mt-1.5 ml-1">
                    Pick a future time. Past times are not allowed.
                  </p>
                )}
              </div>
            )}

            {disappearMode === "custom-views" && (
              <div className="mt-3">
                <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-black/30 mb-1.5 block">
                  Vanish After Views
                </label>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={customViews}
                  onChange={(e) => setCustomViews(e.target.value)}
                  placeholder="e.g. 73"
                  className={`w-full text-sm font-medium bg-[#faf8f5] border rounded-xl px-4 py-3 outline-none transition-all ${
                    isCustomViewsInvalid
                      ? "border-red-300 focus:ring-2 focus:ring-red-100"
                      : "border-black/5 focus:border-black/15 focus:ring-2 focus:ring-black/5"
                  }`}
                />
                {isCustomViewsInvalid && (
                  <p className="text-[10px] text-red-500 font-bold mt-1.5 ml-1">
                    Use a number between 1 and 10000 views.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="h-px bg-black/5" />

          {/* Category picker */}
          <div className="p-5">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/25 mb-3">
              What does it feel like?
            </p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => {
                const catInfo = CATEGORY_INFO[cat];
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3.5 py-2 rounded-lg text-[11px] font-semibold transition-all active:scale-95 ${
                      isSelected
                        ? "text-white shadow-sm"
                        : "bg-black/[0.02] text-black/40 border border-black/5 hover:border-black/10 hover:text-black/60"
                    }`}
                    style={
                      isSelected
                        ? { background: catInfo?.color ?? "#333" }
                        : undefined
                    }
                  >
                    {catInfo?.label ?? cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            !text.trim() ||
            !category ||
            isSubmitting ||
            wordCount > 500 ||
            isCustomTimeInvalid ||
            isCustomViewsInvalid
          }
          className="w-full mt-5 py-4 bg-black text-white rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-15 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            "Leave it here"
          )}
        </button>

        <p className="text-center text-[9px] text-black/15 mt-3 font-medium">
          Completely anonymous · No accounts · No trace
        </p>

        <div className="mt-8 text-center pt-8 border-t border-black/5">
          <span className="text-2xl block mb-2">📖</span>
          <h2 className="text-base font-bold tracking-tight text-black mb-1">
            Got a longer story?
          </h2>
          <p className="text-[10px] text-black/40 mb-4 max-w-[220px] mx-auto leading-relaxed">
            Create a multi-chapter Long Gossip book with a custom cover.
          </p>
          <Link
            href={`/b/${slug}/spill`}
            className="inline-flex items-center gap-2 px-6 py-3 border border-black/10 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black/5 transition-all text-black active:scale-[0.98]"
          >
            <BookOpen size={14} />
            Long Gossip Shelf
          </Link>
        </div>
      </main>
    </div>
  );
}
