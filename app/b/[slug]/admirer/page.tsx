"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CATEGORY_INFO, getVisitorId, parseConvexError } from "@/app/lib/utils";
import Link from "next/link";
import { ArrowLeft, BookOpen, Heart, Send, Sparkles, Timer } from "lucide-react";
import RateLimitModal from "@/app/components/RateLimitModal";
import { motion } from "framer-motion";

const ADMIRER_CATEGORIES = [
  "crush",
  "compliment",
  "attraction",
  "gratitude",
  "admiration",
  "confession",
];

function getWordMood(count: number) {
  if (count === 0) return { emoji: "✨", label: "start writing..." };
  if (count < 20) return { emoji: "💧", label: "a whisper" };
  if (count < 100) return { emoji: "💌", label: "a sweet note" };
  if (count < 300) return { emoji: "💝", label: "a love letter" };
  return { emoji: "📜", label: "a full confession" };
}

export default function AdmirerConfessPage() {
  const params = useParams();
  const router = useRouter();
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

  const handleSubmit = async () => {
    if (!text.trim() || !category || !board || wordCount > 500) return;
    setIsSubmitting(true);
    setModerationError(null);

    const finalText = recipient.trim()
      ? `To: ${recipient.trim()} — ${text.trim()}`
      : text.trim();

    try {
      // 1. Perform synchronous AI moderation check
      const aiModResult = await checkModeration({ text: finalText });
      if (!aiModResult.isClean) {
        setModerationError({
          flaggedWords: [],
          message: aiModResult.reason || "Content flagged by moderation",
        });
        setIsSubmitting(false);
        return;
      }

      // 2. If clean, proceed to create
      await createConfession({
        boardId: board._id,
        text: finalText,
        category,
        isGlobal: true,
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

  if (board === undefined) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#1A0B12" }}
      >
        <div className="w-8 h-8 border-2 border-white/5 border-t-white/20 rounded-full animate-spin" />
      </div>
    );
  }

  if (board === null) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ background: "#1A0B12" }}
      >
        <span className="text-5xl mb-4">🫣</span>
        <h1 className="text-2xl font-bold mb-2 serif text-white">
          Board not found
        </h1>
        <Link
          href="/"
          className="px-6 py-3 bg-white text-black rounded-xl text-sm font-medium mt-4"
        >
          Go Home
        </Link>
      </div>
    );
  }

  // ── Success screen ──
  if (submitted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-5"
        style={{
          background: "linear-gradient(160deg, #1A0B12 0%, #26101C 50%, #120810 100%)",
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className="max-w-sm w-full text-center"
        >
          <div
            className="rounded-3xl p-10 relative overflow-hidden"
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(201, 169, 110, 0.12)",
              boxShadow: "0 30px 80px rgba(0, 0, 0, 0.4)",
            }}
          >
            {/* Wax seal stamp */}
            <motion.div
              initial={{ scale: 2.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.2,
                type: "spring",
                stiffness: 150,
                damping: 12,
              }}
              className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{
                background:
                  "radial-gradient(circle at 38% 35%, #B22E4A, #8B1A3A 55%, #6B1228)",
                boxShadow:
                  "0 8px 32px rgba(139, 26, 58, 0.5), inset 0 1px 3px rgba(255,255,255,0.1)",
              }}
            >
              <span className="text-2xl">💌</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-2xl font-black serif tracking-tight text-white mb-2"
            >
              Letter Sealed & Sent
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
              className="text-sm font-medium mb-8 leading-relaxed"
              style={{ color: "rgba(201, 169, 110, 0.4)" }}
            >
              Your message has been delivered anonymously to the board.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col gap-3"
            >
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setText("");
                  setRecipient("");
                }}
                className="w-full py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-white transition-all active:scale-[0.97]"
                style={{
                  background:
                    "linear-gradient(135deg, #9B3A5C 0%, #7B2040 100%)",
                  boxShadow: "0 8px 24px rgba(155, 58, 92, 0.3)",
                }}
              >
                Send Another Letter
              </button>
              <Link
                href={`/b/${slug}`}
                className="w-full py-4 text-[11px] font-bold uppercase tracking-widest hover:text-white/40 transition-colors block text-center"
                style={{ color: "rgba(255,255,255,0.15)" }}
              >
                Back to the Board
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main form ──
  return (
    <div
      className="min-h-screen page-enter font-sans relative"
      style={{
        background: "linear-gradient(160deg, #1A0B12 0%, #26101C 50%, #120810 100%)",
        color: "#fff",
      }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-50 flex items-center px-5 py-4 border-b"
        style={{
          background: "rgba(26, 11, 18, 0.7)",
          backdropFilter: "blur(16px)",
          borderColor: "rgba(201, 169, 110, 0.08)",
        }}
      >
        <Link
          href={`/b/${slug}`}
          className="p-2 -ml-2 transition-opacity hover:opacity-60"
          style={{ color: "rgba(201, 169, 110, 0.3)" }}
        >
          <ArrowLeft size={20} />
        </Link>
        <span
          className="flex-1 text-center text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2"
          style={{ color: "rgba(201, 169, 110, 0.2)" }}
        >
          <span style={{ fontSize: "6px" }}>✦</span>
          Secret Admirer
          <span style={{ fontSize: "6px" }}>✦</span>
        </span>
        <div className="w-8" />
      </header>

      <main className="max-w-lg mx-auto px-6 py-10 relative z-10">
        {/* Intro */}
        <div className="text-center mb-10">
          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="text-4xl mb-4 inline-block"
          >
            💝
          </motion.div>
          <h1
            className="text-[26px] font-black serif tracking-tight mb-2"
            style={{ color: "#fff" }}
          >
            Write a Love Letter
          </h1>
          <p
            className="text-[13px] font-medium tracking-wide"
            style={{ color: "rgba(201, 169, 110, 0.3)" }}
          >
            Pour your heart out. They&apos;ll never know it was you.
          </p>
        </div>

        {/* Form card */}
        <div
          className="rounded-[24px] overflow-hidden relative"
          style={{
            background: "rgba(255, 255, 255, 0.035)",
            border: "1px solid rgba(201, 169, 110, 0.1)",
            boxShadow:
              "0 20px 60px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.02)",
          }}
        >
          <div className="p-7 space-y-7 relative z-10">
            {/* Recipient */}
            <div>
              <label
                className="text-[10px] font-bold uppercase tracking-widest mb-3 block"
                style={{ color: "rgba(201, 169, 110, 0.3)" }}
              >
                To (Optional)
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Name or @handle"
                className="w-full bg-transparent border-b-2 px-0 py-3 outline-none text-lg font-bold serif italic placeholder:text-white/10 transition-colors"
                style={{
                  color: "rgba(255, 255, 255, 0.85)",
                  borderColor: recipient
                    ? "rgba(155, 58, 92, 0.4)"
                    : "rgba(201, 169, 110, 0.1)",
                }}
              />
            </div>

            {/* Message */}
            <div>
              <label
                className="text-[10px] font-bold uppercase tracking-widest mb-3 block"
                style={{ color: "rgba(201, 169, 110, 0.3)" }}
              >
                Your Letter
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write your secret compliment or crush confession here..."
                rows={6}
                className="w-full bg-transparent resize-none outline-none text-base leading-relaxed serif italic"
                style={{
                  color: "rgba(255, 255, 255, 0.75)",
                }}
              />

              {/* Word count mood */}
              <div className="flex items-center justify-between mt-2">
                <span
                  className="text-[10px] font-medium flex items-center gap-1.5"
                  style={{ color: "rgba(201, 169, 110, 0.2)" }}
                >
                  <span>{mood.emoji}</span>
                  <span className="italic">{mood.label}</span>
                </span>
                <span
                  className={`text-[10px] font-mono ${
                    wordCount > 500
                      ? "text-red-400 font-bold"
                      : ""
                  }`}
                  style={{
                    color: wordCount > 500 ? undefined : "rgba(201, 169, 110, 0.15)",
                  }}
                >
                  {500 - wordCount}
                </span>
              </div>
            </div>

            {/* Category */}
            <div>
              <label
                className="text-[10px] font-bold uppercase tracking-widest mb-4 block"
                style={{ color: "rgba(201, 169, 110, 0.3)" }}
              >
                Message Type
              </label>
              <div className="flex flex-wrap gap-2">
                {ADMIRER_CATEGORIES.map((cat) => {
                  const info = CATEGORY_INFO[cat];
                  const active = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className="px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95"
                      style={{
                        background: active
                          ? "linear-gradient(135deg, #9B3A5C, #7B2040)"
                          : "rgba(255, 255, 255, 0.03)",
                        color: active ? "#fff" : "rgba(255, 255, 255, 0.2)",
                        border: `1px solid ${
                          active
                            ? "rgba(155, 58, 92, 0.3)"
                            : "rgba(255, 255, 255, 0.05)"
                        }`,
                        boxShadow: active
                          ? "0 4px 16px rgba(155, 58, 92, 0.2)"
                          : "none",
                      }}
                    >
                      {info?.emoji} {info?.label || cat}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Rejection Feedback */}
        {moderationError && !showRateLimit && (
          <div className="mt-10 mb-2 p-8 rounded-[2.5rem] bg-[#1a0e0e]/60 border border-rose-500/20 shadow-2xl shadow-rose-950/40 backdrop-blur-xl flex flex-col items-center text-center animate-in fade-in slide-in-from-top-4 duration-500 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-500/30 to-transparent" />
            <div className="relative mb-5">
              <div className="absolute inset-0 scale-150 blur-2xl opacity-20 bg-rose-500 rounded-full" />
              <div className="relative w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 animate-pulse">
                <Sparkles size={24} className="text-rose-500" />
              </div>
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-200/50 mb-3 italic">Seal Broken</h3>
            <p className="text-[15px] text-rose-50 leading-relaxed max-w-[280px] serif italic">
              &ldquo;{moderationError.message}&rdquo;
            </p>
            <div className="mt-6 flex flex-col items-center gap-3">
              <p className="text-[9px] text-rose-500/40 font-bold uppercase tracking-widest">
                Re-write the letter
              </p>
              <button
                onClick={() => setModerationError(null)}
                className="px-8 py-3 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-[10px] font-bold uppercase tracking-widest text-rose-400 hover:bg-rose-500 hover:text-white transition-all active:scale-95"
              >
                I'll revise my words
              </button>
            </div>
          </div>
        )}
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || isSubmitting || wordCount > 500}
          className="w-full mt-8 py-5 rounded-2xl text-[12px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all disabled:opacity-15 active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #9B3A5C 0%, #7B2040 100%)",
            boxShadow: "0 12px 40px rgba(155, 58, 92, 0.25)",
            color: "#fff",
          }}
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Send size={15} />
              Seal & Send Letter
            </>
          )}
        </button>

        {/* Decorative divider */}
        <div className="mt-8 flex items-center gap-3 justify-center">
          <div className="h-px w-10" style={{ background: "rgba(201, 169, 110, 0.1)" }} />
          <Heart
            size={11}
            fill="currentColor"
            style={{ color: "rgba(155, 58, 92, 0.15)" }}
          />
          <div className="h-px w-10" style={{ background: "rgba(201, 169, 110, 0.1)" }} />
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
