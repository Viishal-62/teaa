"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import RateLimitModal from "@/app/components/RateLimitModal";
import { CATEGORY_INFO, getVisitorId, parseConvexError } from "@/app/lib/utils";
import { api } from "@/convex/_generated/api";

const ADMIRER_CATEGORIES = [
  "crush",
  "compliment",
  "attraction",
  "gratitude",
  "admiration",
  "confession",
];

const QUICK_STARTERS = [
  "I have liked you since...",
  "You probably do not notice this, but...",
  "I wanted to thank you for...",
  "Whenever I see you, I feel...",
];

function getWordMood(count: number) {
  if (count === 0) return { emoji: "✨", label: "Start writing" };
  if (count < 20) return { emoji: "💧", label: "A soft whisper" };
  if (count < 100) return { emoji: "💌", label: "A sweet note" };
  if (count < 300) return { emoji: "💝", label: "A heartfelt letter" };
  return { emoji: "📜", label: "A full confession" };
}

function toDisplayLabel(category: string) {
  return CATEGORY_INFO[category]?.label ?? category;
}

export default function AdmirerConfessPage() {
  const params = useParams();
  const slug = params.slug as string;

  const board = useQuery(api.boards.getBySlug, { slug });
  const createConfession = useMutation(api.confessions.create);
  const checkModeration = useAction(api.moderationAction.checkContent);

  const [moderationError, setModerationError] = useState<{
    flaggedWords: { word: string; start: number; end: number }[];
    message: string;
  } | null>(null);
  const [showRateLimit, setShowRateLimit] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState("");
  const [recipient, setRecipient] = useState("");
  const [text, setText] = useState("");
  const [category, setCategory] = useState("crush");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const mood = useMemo(() => getWordMood(wordCount), [wordCount]);
  const remainingWords = 500 - wordCount;
  const canSubmit =
    Boolean(text.trim()) && !isSubmitting && remainingWords >= 0;

  const handleSubmit = async () => {
    if (!canSubmit || !board) return;

    setIsSubmitting(true);
    setModerationError(null);

    const finalText = recipient.trim()
      ? `To: ${recipient.trim()} - ${text.trim()}`
      : text.trim();

    try {
      const aiModResult = await checkModeration({ text: finalText });
      if (!aiModResult.isClean) {
        setModerationError({
          flaggedWords: [],
          message:
            aiModResult.reason || "Your message was flagged by moderation.",
        });
        setIsSubmitting(false);
        return;
      }

      await createConfession({
        boardId: board._id,
        text: finalText,
        category,
        isGlobal: true,
        visitorId: getVisitorId(),
      });
      setSubmitted(true);
    } catch (error: unknown) {
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

      console.error("Failed to submit admirer letter:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (board === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#110A0E]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-white/60" />
      </div>
    );
  }

  if (board === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-[#110A0E] text-white">
        <p className="text-5xl mb-4">💔</p>
        <h1 className="text-2xl font-bold serif">Board not found</h1>
        <p className="text-white/60 mt-2 text-sm">
          This admirer board does not exist anymore.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-xl px-5 py-3 bg-white text-black text-sm font-semibold"
        >
          Go Home
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 bg-[radial-gradient(circle_at_top,#3b1026_0%,#110A0E_55%)]">
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md rounded-3xl border border-white/15 bg-white/6 backdrop-blur-xl p-8 text-center text-white"
        >
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#d95d8c] to-[#7d264a] shadow-[0_12px_36px_rgba(170,66,109,0.45)]">
            <Heart className="h-7 w-7" fill="currentColor" />
          </div>
          <h1 className="text-2xl font-black serif">Letter Sent</h1>
          <p className="mt-2 text-sm text-white/70">
            Your anonymous admirer message is now on the board.
          </p>
          <div className="mt-7 space-y-3">
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setText("");
                setRecipient("");
                setModerationError(null);
              }}
              className="w-full rounded-2xl py-3 text-xs font-bold uppercase tracking-[0.18em] text-white bg-gradient-to-r from-[#b53d6a] to-[#812748] hover:brightness-110 active:scale-[0.98] transition-all"
            >
              Write Another Letter
            </button>
            <Link
              href={`/b/${slug}`}
              className="block rounded-2xl py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/70 border border-white/15 hover:bg-white/10 hover:text-white transition-all"
            >
              Back to Board
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white bg-[radial-gradient(circle_at_top,#2f1022_0%,#130b12_45%,#0d090f_100%)]">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#120b12]/80 backdrop-blur-2xl">
        <div className="mx-auto max-w-2xl px-5 py-4 flex items-center">
          <Link
            href={`/b/${slug}`}
            className="rounded-xl p-2 text-white/80 hover:text-white hover:bg-white/8 transition-all"
            aria-label="Back to board"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex-1 text-center">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/45 font-bold">
              Secret Admirer
            </p>
          </div>
          <div className="w-9" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-8 sm:py-10">
        <section className="text-center mb-8">
          <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80">
            Anonymous Mode
          </div>
          <h1 className="mt-4 text-3xl sm:text-4xl font-black serif leading-tight">
            Write a Letter They Will Never Forget
          </h1>
          <p className="mt-3 text-sm sm:text-base text-white/65 max-w-xl mx-auto leading-relaxed">
            Keep it kind, clear, and true to what you feel. Your identity stays
            hidden.
          </p>
        </section>

        <section className="rounded-[28px] border border-white/15 bg-white/8 backdrop-blur-xl shadow-[0_24px_80px_rgba(0,0,0,0.4)] overflow-hidden">
          {board.prompt ? (
            <div className="px-6 py-5 border-b border-white/10 bg-gradient-to-r from-[#7a2948]/35 to-[#4f1e39]/35">
              <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-white/60">
                Prompt from {board.name}
              </p>
              <p className="mt-2 text-white text-lg sm:text-xl serif italic leading-relaxed">
                "{board.prompt}"
              </p>
            </div>
          ) : null}

          <div className="p-6 sm:p-7 space-y-7">
            <div>
              <label
                htmlFor="recipient-input"
                className="block text-[11px] uppercase tracking-[0.18em] font-bold text-white/55 mb-2"
              >
                To (Optional)
              </label>
              <input
                id="recipient-input"
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Name or @handle"
                className="w-full rounded-2xl border border-white/15 bg-[#140d14]/70 px-4 py-3 text-sm sm:text-base font-medium placeholder:text-white/30 outline-none focus:border-[#d56c96] focus:ring-2 focus:ring-[#d56c96]/30 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <label
                  htmlFor="letter-input"
                  className="block text-[11px] uppercase tracking-[0.18em] font-bold text-white/55"
                >
                  Your Letter
                </label>
                <span
                  className={`text-[11px] font-semibold ${
                    remainingWords < 0 ? "text-red-300" : "text-white/60"
                  }`}
                >
                  {remainingWords} words left
                </span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar">
                {QUICK_STARTERS.map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => setText(starter)}
                    className="shrink-0 rounded-full border border-white/15 bg-white/7 px-3 py-1.5 text-[11px] text-white/70 hover:bg-white/12 hover:text-white transition-all"
                  >
                    {starter}
                  </button>
                ))}
              </div>

              <textarea
                id="letter-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                placeholder="Write your anonymous message..."
                className="mt-1 w-full rounded-2xl border border-white/15 bg-[#140d14]/70 px-4 py-3 text-sm sm:text-base leading-relaxed placeholder:text-white/30 outline-none focus:border-[#d56c96] focus:ring-2 focus:ring-[#d56c96]/30 transition-all resize-y min-h-[180px]"
              />
              <p className="mt-2 text-[11px] text-white/60 flex items-center gap-2">
                <span>{mood.emoji}</span>
                <span>{mood.label}</span>
              </p>
            </div>

            <fieldset>
              <legend className="block text-[11px] uppercase tracking-[0.18em] font-bold text-white/55 mb-3">
                Message Type
              </legend>
              <div className="flex flex-wrap gap-2">
                {ADMIRER_CATEGORIES.map((cat) => {
                  const active = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.12em] font-bold transition-all ${
                        active
                          ? "bg-gradient-to-r from-[#c14975] to-[#89284c] text-white border border-[#e085aa]/40 shadow-[0_8px_24px_rgba(164,56,101,0.35)]"
                          : "text-white/70 border border-white/15 bg-white/5 hover:bg-white/12"
                      }`}
                    >
                      {CATEGORY_INFO[cat]?.emoji} {toDisplayLabel(cat)}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>
        </section>

        {moderationError && !showRateLimit ? (
          <section className="mt-5 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-5 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 border border-rose-300/30">
              <Sparkles className="h-5 w-5 text-rose-200" />
            </div>
            <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-rose-100/85">
              Please revise
            </h2>
            <p className="mt-2 text-sm text-rose-50/95">
              "{moderationError.message}"
            </p>
            <button
              type="button"
              onClick={() => setModerationError(null)}
              className="mt-4 rounded-full border border-rose-200/40 bg-rose-200/10 px-4 py-2 text-[11px] uppercase tracking-[0.15em] font-bold text-rose-100 hover:bg-rose-200/20 transition-all"
            >
              I will edit it
            </button>
          </section>
        ) : null}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="mt-6 w-full rounded-2xl bg-gradient-to-r from-[#be4d77] to-[#8e2d52] py-4 text-[12px] font-black uppercase tracking-[0.2em] text-white shadow-[0_15px_42px_rgba(164,56,101,0.4)] hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:brightness-100 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <>
              <Send size={15} />
              Seal and Send
            </>
          )}
        </button>
      </main>

      <RateLimitModal
        isOpen={showRateLimit}
        onClose={() => setShowRateLimit(false)}
        message={rateLimitMessage}
      />
    </div>
  );
}
