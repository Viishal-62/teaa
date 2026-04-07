"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CATEGORY_INFO, getVisitorId, parseConvexError } from "@/app/lib/utils";
import EmojiPicker from "@/app/components/EmojiPicker";
import DoodleCanvas from "@/app/components/DoodleCanvas";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  AlertTriangle,
  X,
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

const PREDEFINED_CITIES = ["New York", "London", "Los Angeles"];
const PREDEFINED_PROFESSIONS = ["Student", "Software Engineer", "Healthcare"];
const PREDEFINED_MATCHES = ["Office Boss", "Ex", "Coworker"];

function ContextSelector({ title, options, value, onChange }: { title: string, options: string[], value: string, onChange: (v: string) => void }) {
  const [isOther, setIsOther] = useState(false);

  const handleUse = () => {
    setIsOther(false);
  };

  return (
    <div className="mb-4 last:mb-0">
      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/25 mb-2">{title}</p>
      {isOther ? (
        <div className="flex items-center gap-2">
          <input 
            type="text" 
            autoFocus
            maxLength={30}
            placeholder="Type here..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 bg-[#faf8f5] border border-black/10 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-black/30"
          />
          <button 
            type="button"
            onClick={handleUse}
            className="text-[10px] font-bold uppercase tracking-widest bg-black text-white px-4 py-2.5 rounded-xl transition-all"
          >
            Use
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(value === opt ? "" : opt)}
              className={`px-3 py-2 rounded-lg text-[10px] font-semibold transition-all active:scale-95 ${
                value === opt
                  ? "bg-black text-white shadow-sm"
                  : "bg-black/[0.02] text-black/40 border border-black/5 hover:border-black/10 hover:text-black/60"
              }`}
            >
              {opt}
            </button>
          ))}
          {value && !options.includes(value) && (
             <button
              type="button"
              onClick={() => onChange("")}
              className="px-3 py-2 rounded-lg text-[10px] font-semibold transition-all active:scale-95 bg-black text-white shadow-sm flex items-center gap-1.5"
             >
               {value} <span className="opacity-60 text-[8px]">✕</span>
             </button>
          )}

          <button
            type="button"
            onClick={() => { setIsOther(true); onChange(""); }}
            className={`px-3 py-2 rounded-lg text-[10px] font-semibold transition-all active:scale-95 bg-black/[0.02] text-black/40 border-dashed border border-black/15 hover:border-black/30 hover:text-black/60`}
          >
            + Other
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Render text with flagged words underlined in red ───
function renderHighlightedText(
  text: string,
  flaggedWords: { word: string; start: number; end: number }[],
) {
  if (!flaggedWords || flaggedWords.length === 0) return text;

  const parts: React.ReactNode[] = [];
  let lastEnd = 0;

  // Sort by start position
  const sorted = [...flaggedWords].sort((a, b) => a.start - b.start);

  for (const fw of sorted) {
    // Clamp to text bounds
    const start = Math.max(0, Math.min(fw.start, text.length));
    const end = Math.max(start, Math.min(fw.end, text.length));

    if (start > lastEnd) {
      parts.push(text.substring(lastEnd, start));
    }

    parts.push(
      <span
        key={`flag-${start}`}
        className="bg-red-100 text-red-600 underline decoration-red-500 decoration-wavy decoration-2 underline-offset-2 font-semibold px-0.5 rounded-sm"
      >
        {text.substring(start, end)}
      </span>,
    );

    lastEnd = end;
  }

  if (lastEnd < text.length) {
    parts.push(text.substring(lastEnd));
  }

  return <>{parts}</>;
}

export default function ConfessPage() {
  const params = useParams();
  const slug = params.slug as string;

  const board = useQuery(api.boards.getBySlug, { slug });
  const createConfession = useMutation(api.confessions.create);
  const checkAIModeration = useAction(api.moderationAction.checkContent);

  const [text, setText] = useState("");
  const [mode, setMode] = useState<"text" | "doodle">("text");
  const [hasDoodle, setHasDoodle] = useState(false);
  const [category, setCategory] = useState("");
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isGlobal, setIsGlobal] = useState(true);
  const [disappearMode, setDisappearMode] = useState<
    "never" | "5m" | "24h" | "7d" | "views25" | "custom-time" | "custom-views"
  >("never");
  const [customExpireAt, setCustomExpireAt] = useState("");
  const [customViews, setCustomViews] = useState("");
  const [moderationError, setModerationError] = useState<{
    flaggedWords: { word: string; start: number; end: number }[];
    message: string;
  } | null>(null);
  const [showRateLimit, setShowRateLimit] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState("");
  const [debouncedText, setDebouncedText] = useState("");
  
  const [contentType, setContentType] = useState<"confession" | "question">("confession");
  const [cityId, setCityId] = useState("");
  const [professionId, setProfessionId] = useState("");
  const [contextId, setContextId] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
     if (board && board.contentType === "ama") {
       setContentType("question");
     }
  }, [board]);

  // Debounce text for real-time moderation check
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedText(text);
    }, 400);
    return () => clearTimeout(timer);
  }, [text]);

  // Real-time moderation check
  const moderationCheck = useQuery(
    api.confessions.checkModeration,
    debouncedText.trim().length > 2 && board
      ? { text: debouncedText, boardId: board._id as Id<"boards"> }
      : "skip",
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
      (mode === "text" && !text.trim()) ||
      (mode === "doodle" && !hasDoodle) ||
      !category ||
      !board ||
      (mode === "text" && wordCount > 500) ||
      isCustomTimeInvalid ||
      isCustomViewsInvalid
    ) {
      return;
    }

    // Check moderation result first
    if (mode === "text" && moderationCheck && !moderationCheck.isClean) {
      setModerationError({
        flaggedWords: moderationCheck.flaggedWords,
        message: moderationCheck.message,
      });
      return;
    }

    setIsSubmitting(true);
    setModerationError(null);

    try {
      let canvasImageUrl: string | undefined;

      if (mode === "doodle") {
        if (!canvasRef.current) return;
        const dataUrl = canvasRef.current.toDataURL("image/png");
        const res = await fetch("/api/upload-doodle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: dataUrl }),
        });
        const uploadResult = await res.json();
        if (!res.ok || !uploadResult.url) {
          throw new Error(uploadResult.error || "Failed to upload doodle");
        }
        canvasImageUrl = uploadResult.url;
      } else {
        // 1. Perform synchronous AI moderation check
        const aiModResult = await checkAIModeration({ text: text.trim() });
        if (!aiModResult.isClean) {
          setModerationError({
            flaggedWords: [],
            message: aiModResult.reason,
          });
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Proceed to create
      await createConfession({
        boardId: board._id,
        type: mode === "doodle" ? "canvas" : "text",
        text: mode === "text" ? text.trim() : undefined,
        canvasImageUrl,
        caption: mode === "doodle" && text.trim() ? text.trim() : undefined,
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
        visitorId: getVisitorId(),
        contentType,
        cityId: cityId.trim() || undefined,
        professionId: professionId.trim() || undefined,
        contextId: contextId.trim() || undefined,
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

  const handleConfessAgain = () => {
    setText("");
    setCategory("");
    setHasDoodle(false);
    setSubmitted(false);
  };

  const handleEmojiSelect = (emoji: string) => {
    if (mode === "text") {
      const currentWords = text.trim() ? text.trim().split(/\s+/).length : 0;
      if (currentWords <= 500) {
        setText((prev) => prev + emoji);
      }
    } else {
      if (text.length + emoji.length <= 120) {
        setText((prev) => prev + emoji);
      }
    }
  };

  if (board === undefined) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-black/10 border-t-black/40 rounded-full animate-spin" />
      </div>
    );
  }

  if (board === null) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center bg-white">
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
      <div className="min-h-[100dvh] flex items-center justify-center px-5 page-enter bg-[#faf8f5]">
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
    <div className="min-h-[100dvh] page-enter bg-[#faf8f5] text-black">
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
            {contentType === "question" ? "Got a question to ask?" : "Got something to say?"}
          </h1>
          <p className="text-[11px] text-black/30 font-medium tracking-wide mb-4">
            {contentType === "question" ? "Ask anything anonymously. No names." : "No names. No judgment. Just the raw truth."}
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
          {/* Viewer Prompt */}
          {board.prompt && (
            <div className="bg-[#faf8f5] border-b border-black/5 px-5 py-5 rounded-t-2xl">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-accent mb-2">
                {board.name} wants to know:
              </p>
              <p className="text-[15px] font-black text-black/80 serif">
                "{board.prompt}"
              </p>
            </div>
          )}

          {/* Post Type Tabs */}
          <div className={`flex bg-[#faf8f5] border-b border-black/5 p-1 gap-1 ${!board.prompt ? "rounded-t-2xl" : ""}`}>
            <button
              type="button"
              onClick={() => setContentType("confession")}
              className={`flex-1 py-3 px-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${
                contentType === "confession"
                  ? "bg-white text-black shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                  : "bg-transparent text-black/30 hover:text-black/60 hover:bg-black/[0.02]"
              }`}
            >
              🫣 Confession
            </button>
            <button
              type="button"
              onClick={() => setContentType("question")}
              className={`flex-1 py-3 px-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${
                contentType === "question"
                  ? "bg-white text-black shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                  : "bg-transparent text-black/30 hover:text-black/60 hover:bg-black/[0.02]"
              }`}
            >
              ❓ Question
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="flex bg-[#faf8f5] border-b border-black/5 p-1 gap-1">
            <button
              type="button"
              onClick={() => setMode("text")}
              className={`flex-1 py-3 px-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${
                mode === "text"
                  ? "bg-white text-black shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                  : "bg-transparent text-black/30 hover:text-black/60 hover:bg-black/[0.02]"
              }`}
            >
              ✍️ Write
            </button>
            <button
              type="button"
              onClick={() => setMode("doodle")}
              className={`flex-1 py-3 px-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${
                mode === "doodle"
                  ? "bg-white text-black shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                  : "bg-transparent text-black/30 hover:text-black/60 hover:bg-black/[0.02]"
              }`}
            >
              🎨 Draw
            </button>
          </div>

          {mode === "doodle" && (
            <div className="p-4 bg-white border-b border-black/5">
              <DoodleCanvas
                onDrawingChange={setHasDoodle}
                canvasRef={canvasRef}
              />
            </div>
          )}

          {/* Quick Starters / Confession Templates */}
          {mode === "text" && (
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
          )}

          {/* Textarea with moderation overlay */}
          <div className="px-5 pb-0 pt-4">
            <div className="relative">
              {/* Underline overlay — renders behind the textarea */}
              {mode === "text" &&
                moderationCheck &&
                !moderationCheck.isClean &&
                text.length > 0 && (
                  <div
                    className="absolute inset-0 pointer-events-none text-sm leading-relaxed serif whitespace-pre-wrap break-words overflow-hidden"
                    style={{ color: "transparent", padding: "0" }}
                    aria-hidden
                  >
                    {renderHighlightedText(text, moderationCheck.flaggedWords)}
                  </div>
                )}
              <textarea
                value={text}
                onChange={(e) => {
                  if (mode === "doodle" && e.target.value.length > 120) return;
                  setText(e.target.value);
                  setModerationError(null);
                }}
                placeholder={
                  mode === "doodle"
                    ? "add a short optional caption..."
                    : "write what's been sitting inside you..."
                }
                rows={mode === "doodle" ? 2 : 5}
                autoFocus={mode === "text"}
                className={`w-full bg-transparent resize-none outline-none text-sm leading-relaxed placeholder:text-black/15 serif text-black/80 ${mode === "doodle" ? "text-center italic" : ""}`}
              />
            </div>
            {/* Real-time moderation warning */}
            {mode === "text" && moderationCheck && !moderationCheck.isClean && (
              <div className="flex items-start gap-2 text-red-500 bg-red-50 rounded-xl px-3 py-2 mt-2 mb-2">
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                <p className="text-[10px] font-medium leading-relaxed">
                  {moderationCheck.message} — The highlighted words need to be
                  removed.
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between px-5 pb-4">
            <div className="relative">
              <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            </div>
            <span
              className={`text-[10px] font-mono ${mode === "text" && wordCount > 500 ? "text-red-500 font-bold" : "text-black/25"}`}
            >
              {mode === "text" && wordCount > 500
                ? `-${wordCount - 500} words`
                : mode === "doodle"
                  ? `${120 - text.length} chars left`
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



          {/* Context Identifiers */}
          <div className="p-5">
             <ContextSelector title="Where are you from?" options={PREDEFINED_CITIES} value={cityId} onChange={setCityId} />
             <ContextSelector title="What do you do?" options={PREDEFINED_PROFESSIONS} value={professionId} onChange={setProfessionId} />
             <ContextSelector title="Who is this about? (Optional Connection)" options={PREDEFINED_MATCHES} value={contextId} onChange={setContextId} />
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
                  className="flex-1 bg-white border border-black/10 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-black/30"
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
                {CATEGORIES.map((cat) => {
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
                    {category} <span className="opacity-60 text-[8px]">✕</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setIsAddingCustom(true); setCategory(""); }}
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
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">Advanced Options</span>
            </div>
            <div className="flex items-center gap-2">
              {disappearMode !== "never" && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-black bg-black/5 px-2 py-0.5 rounded-full">
                  Auto-delete set
                </span>
              )}
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" className={`text-black/30 transition-transform ${showAdvanced ? "rotate-180" : ""}`}>
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>

          {/* Disappearing Tea (Moved inside Advanced Settings) */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showAdvanced ? "max-h-[800px] opacity-100 border-t border-black/5" : "max-h-0 opacity-0"}`}>
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
                    className={`w-full text-sm font-medium bg-white border rounded-xl px-4 py-3 outline-none transition-all ${
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
                    className={`w-full text-sm font-medium bg-white border rounded-xl px-4 py-3 outline-none transition-all ${
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
        </div>

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
        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            (mode === "text" && !text.trim()) ||
            (mode === "doodle" && !hasDoodle) ||
            !category ||
            isSubmitting ||
            (mode === "text" && wordCount > 500) ||
            isCustomTimeInvalid ||
            isCustomViewsInvalid ||
            (mode === "text" && moderationCheck
              ? !moderationCheck.isClean
              : false)
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

      <RateLimitModal
        isOpen={showRateLimit}
        onClose={() => setShowRateLimit(false)}
        message={rateLimitMessage}
      />
    </div>
  );
}
