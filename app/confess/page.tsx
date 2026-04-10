"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CATEGORY_INFO, getVisitorId, parseConvexError } from "@/app/lib/utils";
import EmojiPicker from "@/app/components/EmojiPicker";
import { VoiceConfessModal } from "@/app/components/VoiceConfessModal";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  Mic,
  Type,
  Sparkles,
  Timer,
} from "lucide-react";
import RateLimitModal from "@/app/components/RateLimitModal";
import type { Id } from "@/convex/_generated/dataModel";

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

const QUICK_STARTERS = [
  "I never told anyone but...",
  "Honestly, I think you...",
  "Nobody knows that I...",
  "My biggest secret is...",
];

export default function GlobalConfessPage() {
  const router = useRouter();
  const publicBoards = useQuery(api.boards.listPublic);
  const createConfession = useMutation(api.confessions.create);
  const getOrCreateGlobal = useMutation(api.boards.getOrCreateGlobal);
  const checkModeration = useAction(api.moderationAction.checkContent);

  const [text, setText] = useState("");
  const [category, setCategory] = useState("");
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showBoardPicker, setShowBoardPicker] = useState(false);
  const [confessType, setConfessType] = useState<"text" | "voice">("text");
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [isGlobal, setIsGlobal] = useState(true);
  const [disappearMode, setDisappearMode] = useState<
    "never" | "5m" | "24h" | "7d" | "views25" | "custom-time" | "custom-views"
  >("never");
  const [customExpireAt, setCustomExpireAt] = useState("");
  const [customViews, setCustomViews] = useState("");
  const [globalBoardId, setGlobalBoardId] = useState<Id<"boards"> | null>(null);
  const [moderationError, setModerationError] = useState<{
    flaggedWords: { word: string; start: number; end: number }[];
    message: string;
  } | null>(null);
  const [showRateLimit, setShowRateLimit] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState("");
  const [debouncedText, setDebouncedText] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  // Debounce text for real-time moderation check
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedText(text);
    }, 400);
    return () => clearTimeout(timer);
  }, [text]);

  const moderationCheck = useQuery(
    api.confessions.checkModeration,
    debouncedText.trim().length > 2 && globalBoardId
      ? { text: debouncedText, boardId: globalBoardId }
      : "skip",
  );

  // Get global board ID on mount
  useEffect(() => {
    (async () => {
      const id = await getOrCreateGlobal();
      setGlobalBoardId(id);
    })();
  }, [getOrCreateGlobal]);

  // Pre-fill text from URL params (from quick confess widget on landing page)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prefilled = params.get("text");
    if (prefilled) setText(prefilled);
  }, []);

  const selectedBoard = publicBoards?.find(
    (b: any) => b._id === selectedBoardId,
  );

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
      wordCount > 500 ||
      isCustomTimeInvalid ||
      isCustomViewsInvalid
    ) {
      return;
    }
    setIsSubmitting(true);
    setModerationError(null);

    try {
      // 1. Perform synchronous AI moderation check
      const aiModResult = await checkModeration({ text: text.trim() });
      if (!aiModResult.isClean) {
        setModerationError({
          flaggedWords: [], // AI doesn't give specific word positions
          message: aiModResult.reason,
        });
        setIsSubmitting(false);
        return;
      }

      // 2. If clean, proceed to create
      // If no board picked, use the global board
      let boardId = selectedBoardId as Id<"boards">;
      if (!selectedBoardId) {
        boardId = await getOrCreateGlobal();
      }

      await createConfession({
        boardId,
        text: text.trim(),
        category,
        isGlobal: selectedBoardId ? isGlobal : true,
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
        visitorId: getVisitorId(),
      });
      setSubmitted(true);
    } catch (error: any) {
      const parsedErr = parseConvexError(error);

      if (parsedErr?.type === "moderation_error") {
        setModerationError({
          flaggedWords: parsedErr.flaggedWords || [],
          message: parsedErr.message,
        });
        return;
      }

      if (parsedErr?.type === "rate_limit_error") {
        setRateLimitMessage(parsedErr.message);
        setShowRateLimit(true);
        return;
      }

      console.error("Failed to submit confession:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const currentWords = text.trim() ? text.trim().split(/\s+/).length : 0;
    if (currentWords <= 500) {
      setText((prev) => prev + emoji);
    }
  };

  const successMessages: Record<string, { emoji: string; line: string }> = {
    love: { emoji: "💗", line: "Brave of you." },
    regret: { emoji: "🌊", line: "Let it wash away." },
    guilt: { emoji: "⚖️", line: "Weight lifted." },
    mischief: { emoji: "😈", line: "Noted. Quietly." },
    "deep-dark": { emoji: "🕳️", line: "Swallowed whole." },
    default: { emoji: "✨", line: "It's out there now." },
  };

  const success = successMessages[category] || successMessages.default;

  // ── Success ──
  if (submitted) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-4 sm:px-5 page-enter bg-[#faf8f5]">
        <div className="max-w-sm w-full text-center">
          <div className="bg-white rounded-2xl border border-black/5 p-8 shadow-xl shadow-black/[0.03]">
            <span className="text-5xl block mb-4">{success.emoji}</span>
            <h1 className="text-xl font-black serif tracking-tight text-black mb-1">
              {success.line}
            </h1>
            <p className="text-xs text-black/35 font-medium mb-7">
              Your truth lives in the library of secrets.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setText("");
                  setCategory("");
                  setSelectedBoardId("");
                  setSubmitted(false);
                }}
                className="w-full py-3.5 bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95"
              >
                Drop Another One
              </button>
              <Link
                href="/spill/create"
                className="w-full py-3.5 bg-rose-50 text-rose-900 border border-rose-200/60 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
              >
                <BookOpen size={12} />
                Write Long Gossip
              </Link>
              <Link
                href="/explore"
                className="w-full py-3.5 text-[10px] text-black/30 font-bold uppercase tracking-widest hover:text-black transition-colors block"
              >
                Explore Feed
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ──
  return (
    <div className="min-h-[100dvh] page-enter bg-[#faf8f5] text-black">
      <header className="sticky top-0 z-50 flex items-center px-4 sm:px-5 py-3 bg-[#faf8f5]/85 backdrop-blur-xl border-b border-black/5">
        <Link
          href="/explore"
          className="flex items-center gap-1.5 text-black/30 hover:text-black transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <span className="flex-1 text-center text-[10px] font-black uppercase tracking-[0.25em] text-black/20">
          Confess
        </span>
        <div className="w-4" />
      </header>

      <main className="max-w-lg mx-auto px-4 sm:px-5 py-6 sm:py-8">
        {/* Intro */}
        <div className="text-center mb-8">
          <span className="text-3xl block mb-3">🫖</span>
          <h1 className="text-xl font-black serif tracking-tight text-black mb-1">
            Got something to say?
          </h1>
          <p className="text-[11px] text-black/30 font-medium tracking-wide">
            No names. No judgment. Just the raw truth.
          </p>

          {/* Voice/Text Toggle */}
          <div className="flex gap-2 mt-5 mb-6">
            <button
              type="button"
              onClick={() => setConfessType("text")}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                confessType === "text"
                  ? "bg-black text-white shadow-md shadow-black/10"
                  : "bg-[#faf8f5] text-black/40 border border-black/5 hover:border-black/15"
              }`}
            >
              <Type size={14} />
              Write
            </button>
            <button
              type="button"
              onClick={() => {
                setConfessType("voice");
                setShowVoiceModal(true);
              }}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                confessType === "voice"
                  ? "bg-black text-white shadow-md shadow-black/10"
                  : "bg-[#faf8f5] text-black/40 border border-black/5 hover:border-black/15"
              }`}
            >
              <Mic size={14} />
              Record
            </button>
          </div>

          <Link
            href="/spill/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-900 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-rose-200/50 hover:bg-rose-100 transition-colors"
          >
            <BookOpen size={12} />
            Or write a Long Gossip book
          </Link>
        </div>

        {/* Form card */}
        {confessType === "text" && (
          <div className="bg-white rounded-2xl border border-black/5 shadow-xl shadow-black/[0.03]">
            {/* Quick Starters / Confession Templates */}
            <div className="px-5 pt-5 pb-2">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/25 mb-3">
                Quick starters:
              </p>
              <div
                className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide"
                style={{
                  WebkitOverflowScrolling: "touch",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                <style>{`
                  ::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                {QUICK_STARTERS.map((starter, i) => (
                  <button
                    key={i}
                    onClick={() => setText(starter)}
                    className="whitespace-nowrap px-3.5 py-2 rounded-lg bg-black/[0.02] border border-black/5 text-[11px] font-medium text-black/60 hover:text-black/80 hover:bg-black/[0.04] transition-colors active:scale-95"
                  >
                    "{starter}"
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea with moderation overlay */}
            <div className="px-5 pb-0">
              <div className="relative">
                {/* Highlight overlay */}
                {moderationCheck &&
                  !moderationCheck.isClean &&
                  text.length > 0 && (
                    <div
                      className="absolute inset-0 pointer-events-none text-sm leading-relaxed serif whitespace-pre-wrap break-words overflow-hidden"
                      style={{ color: "transparent", padding: "0" }}
                      aria-hidden
                    >
                      {/* Reuse render function or inline it */}
                      {text.split("").map((char, i) => {
                        const isFlagged = moderationCheck.flaggedWords.some(
                          (fw: { word: string; start: number; end: number }) =>
                            i >= fw.start && i < fw.end,
                        );
                        return (
                          <span
                            key={i}
                            className={
                              isFlagged
                                ? "bg-red-100 text-red-600 underline decoration-red-500 decoration-wavy decoration-2 underline-offset-2"
                                : ""
                            }
                          >
                            {char}
                          </span>
                        );
                      })}
                    </div>
                  )}
                <textarea
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    setModerationError(null);
                  }}
                  placeholder="write what's been sitting inside you..."
                  rows={5}
                  autoFocus
                  className="w-full bg-transparent border-none resize-none outline-none text-sm leading-relaxed placeholder:text-black/15 serif text-black/80"
                />
              </div>
              {/* Real-time warning */}
              {moderationCheck && !moderationCheck.isClean && (
                <div className="flex items-start gap-2 text-red-500 bg-red-50 rounded-xl px-3 py-2 mt-2">
                  <Sparkles size={14} className="flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] font-medium leading-relaxed">
                    {moderationCheck.message} — Please remove the highlighted
                    words.
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between px-5 pb-4">
              <div className="relative">
                <EmojiPicker onEmojiSelect={handleEmojiSelect} />
              </div>
              <span
                className={`text-[10px] font-mono ${wordCount > 500 ? "text-red-500 font-bold" : "text-black/15"}`}
              >
                {wordCount > 500
                  ? `-${wordCount - 500} words`
                  : `${500 - wordCount} words left`}
              </span>
            </div>

            <div className="h-px bg-black/5" />

            {/* Category picker */}
            <div className="p-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/25 mb-3">
                What does it feel like?
              </p>
              {isAddingCustom ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    autoFocus
                    maxLength={15}
                    placeholder="Type feeling..."
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex-1 bg-[#faf8f5] border border-black/10 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-black/30"
                  />
                  <button
                    type="button"
                    onClick={() => setIsAddingCustom(false)}
                    className="text-[10px] font-bold uppercase tracking-widest bg-black text-white px-4 py-2.5 rounded-xl transition-all"
                  >
                    Use
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat: string) => {
                    const catInfo = CATEGORY_INFO[cat];
                    const isSelected = category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(category === cat ? "" : cat)}
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
                  {category && !CATEGORIES.includes(category) && (
                    <button
                      type="button"
                      onClick={() => setCategory("")}
                      className="px-3.5 py-2 rounded-lg text-[11px] font-semibold transition-all active:scale-95 bg-black text-white shadow-sm flex items-center gap-1.5"
                    >
                      {category}{" "}
                      <span className="opacity-60 text-[8px]">✕</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCustom(true);
                      setCategory("");
                    }}
                    className={`px-3.5 py-2 rounded-lg text-[11px] font-semibold transition-all active:scale-95 bg-black/[0.02] text-black/40 border-dashed border border-black/15 hover:border-black/30 hover:text-black/60`}
                  >
                    + Other
                  </button>
                </div>
              )}
            </div>

            <div className="h-px bg-black/5" />

            {/* Advanced Settings Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full p-5 flex items-center justify-between text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">
                  Advanced Options
                </span>
              </div>
              <div className="flex items-center gap-2">
                {disappearMode !== "never" && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-black bg-black/5 px-2 py-0.5 rounded-full">
                    Auto-delete set
                  </span>
                )}
                <ChevronDown
                  size={12}
                  className={`text-black/30 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
                />
              </div>
            </button>

            {/* Disappearing Tea (Moved inside Advanced Settings) */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${showAdvanced ? "max-h-[800px] opacity-100 border-t border-black/5" : "max-h-0 opacity-0"}`}
            >
              <div className="p-5 bg-[#faf8f5]">
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
                            : "bg-white border-black/5 hover:border-black/15"
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
                        : "bg-white border-black/5 hover:border-black/15"
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
                        : "bg-white border-black/5 hover:border-black/15"
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
            </div>

            <div className="h-px bg-black/5" />

            {/* Board picker — OPTIONAL */}
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/25">
                  Post to a specific board
                </p>
                <span className="text-[8px] font-medium text-black/15 uppercase tracking-wider">
                  Optional
                </span>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowBoardPicker(!showBoardPicker)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#faf8f5] border border-black/5 text-left transition-all hover:border-black/10"
                >
                  <span
                    className={`text-xs font-medium ${selectedBoard ? "text-black" : "text-black/20"}`}
                  >
                    {selectedBoard
                      ? `🫖 ${selectedBoard.name}`
                      : "Global feed (default)"}
                  </span>
                  <ChevronDown
                    size={12}
                    className={`text-black/15 transition-transform ${showBoardPicker ? "rotate-180" : ""}`}
                  />
                </button>

                {showBoardPicker && publicBoards && (
                  <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-white border border-black/8 rounded-xl shadow-lg shadow-black/5 z-50 max-h-48 overflow-y-auto">
                    {/* Global option */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBoardId("");
                        setShowBoardPicker(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-black/[0.02] transition-colors rounded-t-xl ${
                        !selectedBoardId ? "bg-black/[0.03]" : ""
                      }`}
                    >
                      <span className="text-sm">🌍</span>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-black">
                          Global Feed
                        </p>
                        <p className="text-[9px] text-black/25 italic">
                          No specific board
                        </p>
                      </div>
                      {!selectedBoardId && (
                        <span className="text-[9px] font-bold text-black/30">
                          ✓
                        </span>
                      )}
                    </button>

                    {publicBoards.map((board: any, i: number) => (
                      <button
                        key={board._id}
                        type="button"
                        onClick={() => {
                          setSelectedBoardId(board._id);
                          setShowBoardPicker(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-black/[0.02] transition-colors ${
                          i === publicBoards.length - 1 ? "rounded-b-xl" : ""
                        } ${selectedBoardId === board._id ? "bg-black/[0.03]" : ""}`}
                      >
                        <span className="text-sm">🫖</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-black truncate">
                            {board.name}
                          </p>
                          {board.tagline && (
                            <p className="text-[9px] text-black/25 truncate italic">
                              {board.tagline}
                            </p>
                          )}
                        </div>
                        {selectedBoardId === board._id && (
                          <span className="text-[9px] font-bold text-black/30">
                            ✓
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Public Feed Toggle (only when specific board chosen) */}
            {selectedBoardId && (
              <>
                <div className="h-px bg-black/5" />
                <div className="p-5 flex items-center justify-between bg-black/[0.01]">
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
              </>
            )}
          </div>
        )}

        {/* Voice Modal */}
        {globalBoardId && (
          <VoiceConfessModal
            isOpen={showVoiceModal}
            boardId={globalBoardId}
            onClose={() => {
              setShowVoiceModal(false);
              setConfessType("text");
            }}
            onSuccess={() => {
              setShowVoiceModal(false);
              setConfessType("text");
              setSubmitted(true);
            }}
          />
        )}

        {/* Submit Rejection Feedback */}
        {moderationError && !showRateLimit && (
          <div className="mt-8 mb-4 p-8 rounded-[2.5rem] bg-[#1a0e0e] border border-rose-500/20 shadow-2xl shadow-rose-950/40 backdrop-blur-xl flex flex-col items-center text-center animate-in fade-in slide-in-from-top-4 duration-500 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-500/30 to-transparent" />
            <div className="relative mb-5">
              <div className="absolute inset-0 scale-150 blur-2xl opacity-20 bg-rose-500 rounded-full" />
              <div className="relative w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 animate-pulse">
                <Sparkles size={24} className="text-rose-500" />
              </div>
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-200/50 mb-3">
              Brewing Interrupted
            </h3>
            <p className="text-[15px] text-rose-50 leading-relaxed max-w-[280px] serif italic">
              &ldquo;{moderationError.message}&rdquo;
            </p>
            <div className="mt-6 flex flex-col items-center gap-3">
              <p className="text-[9px] text-rose-500/40 font-bold uppercase tracking-widest">
                Adjustment Required
              </p>
              <button
                onClick={() => setModerationError(null)}
                className="px-8 py-3 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-[10px] font-bold uppercase tracking-widest text-rose-400 hover:bg-rose-500 hover:text-white transition-all active:scale-95"
              >
                I'll fix the blend
              </button>
            </div>
          </div>
        )}
        {confessType === "text" && (
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
        )}

        <p className="text-center text-[9px] text-black/15 mt-3 font-medium">
          Completely anonymous · No accounts · No trace
        </p>
      </main>

      <RateLimitModal
        isOpen={showRateLimit}
        onClose={() => setShowRateLimit(false)}
        message={rateLimitMessage}
      />
    </div>
  );
}
