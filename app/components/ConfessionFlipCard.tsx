"use client";

import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CATEGORY_INFO, REACTION_INFO, getVisitorId } from "@/app/lib/utils";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import Link from "next/link";
import { Eye, Flag, AlertCircle, CheckCircle2 } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import CardActions from "./CardActions";
import { AnimatePresence, motion } from "framer-motion";
import RateLimitModal from "./RateLimitModal";
import { createPortal } from "react-dom";

interface ConfessionFlipCardProps {
  confession: {
    _id: Id<"confessions">;
    text: string;
    category: string;
    displayName: string;
    createdAt: number;
    views?: number;
    boardSlug?: string;
    boardName?: string;
    contentType?: string;
    cityId?: string;
    professionId?: string;
    contextId?: string;
  };
  boardSlug?: string;
  boardReactions?: string[];
}

export default function ConfessionFlipCard({
  confession,
  boardSlug: propBoardSlug,
  boardReactions,
}: ConfessionFlipCardProps) {
  const boardSlug = propBoardSlug || confession.boardSlug || "global";
  const [isFlipped, setIsFlipped] = useState(false);
  const [hasViewed, setHasViewed] = useState(false);
  const catInfo = CATEGORY_INFO[confession.category];
  const toggleReaction = useMutation(api.reactions.toggle);
  const incrementView = useMutation(api.confessions.incrementView);
  const reportConfession = useMutation(api.reports.create);

  const [reporting, setReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [showRateLimit, setShowRateLimit] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const lastTapRef = useRef<number>(0);

  const visitorId = getVisitorId();

  const handleDoubleTap = useCallback(() => {
    if (!visitorId) return;
    setShowDoubleTapHeart(true);
    if (navigator.vibrate) navigator.vibrate(40);
    toggleReaction({
      confessionId: confession._id,
      type: "❤️" as any,
      visitorId,
    }).catch(console.error);
    setTimeout(() => setShowDoubleTapHeart(false), 900);
  }, [visitorId, confession._id, toggleReaction]);

  const handleBackFaceTap = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const now = Date.now();
      if (now - lastTapRef.current < 350) {
        e.preventDefault();
        e.stopPropagation();
        handleDoubleTap();
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }
    },
    [handleDoubleTap],
  );

  const reactionCountsArray = useQuery(api.reactions.getCounts, {
    confessionId: confession._id,
  });
  const reactionCounts = reactionCountsArray
    ? Object.fromEntries(reactionCountsArray.map((r) => [r.type, r.count]))
    : undefined;
  const totalReactions = useQuery(api.reactions.getTotalCount, {
    confessionId: confession._id,
  });
  const visitorReactions = useQuery(
    api.reactions.getVisitorReactions,
    visitorId ? { confessionId: confession._id, visitorId } : "skip",
  );

  const handleReactionClick = async (
    type: string,
    e?: React.MouseEvent | any,
  ) => {
    if (e?.stopPropagation) e.stopPropagation();
    if (!visitorId) return;
    try {
      await toggleReaction({
        confessionId: confession._id,
        type: type as any,
        visitorId,
      });
    } catch (error: any) {
      try {
        const errData = JSON.parse(error.message || error.data?.message || "");
        if (errData.type === "rate_limit_error") {
          setRateLimitMessage(errData.message);
          setShowRateLimit(true);
        }
      } catch {
        if (error.message?.includes("reacting too fast")) {
          setRateLimitMessage(error.message);
          setShowRateLimit(true);
        }
      }
      if (typeof navigator !== "undefined" && navigator.vibrate)
        navigator.vibrate(50);
      console.error("Reaction failed:", error);
    }
  };

  const handleFlip = () => {
    if (!isFlipped && !hasViewed) {
      incrementView({ confessionId: confession._id }).catch(console.error);
      setHasViewed(true);
    }
    if (typeof navigator !== "undefined" && navigator.vibrate)
      navigator.vibrate(50);
    setIsFlipped(!isFlipped);
  };

  const handleReport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (reporting || reportSuccess) return;

    // For simplicity, we just trigger it. In a real app we'd have a reason selector.
    setReporting(true);
    try {
      await reportConfession({
        confessionId: confession._id,
        visitorId: visitorId || "anon",
        reason: "Inappropriate",
      });
      setReportSuccess(true);
      setTimeout(() => setReportSuccess(false), 3000);
    } catch (err) {
      console.error("Report failed", err);
    } finally {
      setReporting(false);
    }
  };

  const resolveEmoji = (type: string) => {
    return REACTION_INFO[type]?.emoji || type;
  };

  const activeReactions = Array.from(
    new Set([
      ...(boardReactions && boardReactions.length > 0
        ? boardReactions
        : ["❤️", "🔥", "😂"]),
      ...(reactionCounts ? Object.keys(reactionCounts) : []),
    ]),
  ).slice(0, 10);

  return (
    <div className="perspective-1000 flip-card-container">
      <div
        className={`relative w-full preserve-3d transition-transform duration-700 ease-out ${isFlipped ? "rotate-y-180" : ""}`}
        style={{ minHeight: "400px" }}
      >
        {/* ── FRONT FACE ── Hidden card */}
        <div
          className={`absolute inset-0 backface-hidden rounded-2xl overflow-hidden front-card-face cursor-pointer ${isFlipped ? "pointer-events-none" : ""}`}
          onClick={handleFlip}
          style={{
            background: catInfo
              ? `linear-gradient(145deg, ${catInfo.color}, ${catInfo.color}dd)`
              : "linear-gradient(145deg, #8b2252, #6b1a3a)",
          }}
        >
          {/* Decorative elements */}
          <div className="absolute inset-0 opacity-[0.07]">
            <div className="absolute top-4 left-4 w-20 h-20 border border-white/30 rounded-full" />
            <div className="absolute bottom-4 right-4 w-16 h-16 border border-white/30 rounded-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-white/20 rounded-full" />
          </div>

          {/* Context Badges top-left */}
          <div className="absolute top-4 left-4 right-4 z-10 flex flex-col items-start gap-1.5 pointer-events-none">
            <div className="flex flex-wrap flex-col items-start justify-start gap-1.5">
              <span className="text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-white/15 text-white/80 backdrop-blur-sm shadow-sm flex items-center gap-1">
                {confession.contentType === "question" ? "❓ Q & A • " : ""}
                {catInfo?.label ?? confession.category}
              </span>
            </div>

            {(confession.cityId ||
              confession.professionId ||
              confession.contextId) && (
              <div className="flex flex-wrap gap-1 mt-0.5">
                {confession.cityId && (
                  <span className="text-[8.5px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider bg-black/20 text-white/90 backdrop-blur-md shadow-sm border border-white/10">
                    📍 {confession.cityId}
                  </span>
                )}
                {confession.professionId && (
                  <span className="text-[8.5px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider bg-black/20 text-white/90 backdrop-blur-md shadow-sm border border-white/10">
                    💼 {confession.professionId}
                  </span>
                )}
                {confession.contextId && (
                  <span className="text-[8.5px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider bg-black/20 text-white/90 backdrop-blur-md shadow-sm border border-white/10 break-words max-w-[120px] truncate">
                    🫂 {confession.contextId}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Centered icon */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <span className="text-4xl mb-3 drop-shadow-lg">🫖</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
              Tap to reveal
            </span>
          </div>

          {/* Bottom subtle line */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10" />
        </div>

        {/* ── BACK FACE ── Revealed confession */}
        <div
          className={`absolute inset-0 backface-hidden rotate-y-180 rounded-2xl back-card-face antialiased transform-gpu ${!isFlipped ? "pointer-events-none" : ""}`}
          style={{ WebkitFontSmoothing: "antialiased" }}
        >
          {/* Decorative border frame */}
          <div className="absolute inset-0 bg-[#faf7f2] transform-gpu rounded-2xl overflow-hidden" />
          <div className="absolute inset-[6px] border border-dashed border-black/10 rounded-xl pointer-events-none" />

          <div
            className="relative h-full flex flex-col p-5"
            onClick={handleBackFaceTap}
          >
            {/* Double-tap heart animation */}
            <AnimatePresence>
              {showDoubleTapHeart && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
                >
                  <span className="text-7xl drop-shadow-[0_4px_20px_rgba(239,68,68,0.5)] select-none">
                    ❤️
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Top: category + context in one compact row */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3">
              <span
                className="text-[8px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded-md"
                style={{
                  color: catInfo?.color ?? "#666",
                  background: `${catInfo?.color ?? "#666"}12`,
                }}
              >
                {confession.contentType === "question" ? "❓ Q & A • " : ""}
                {catInfo?.label ?? confession.category}
              </span>
              {confession.cityId && (
                <span className="text-[7.5px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider bg-black/[0.04] text-black/50">
                  📍 {confession.cityId}
                </span>
              )}
              {confession.professionId && (
                <span className="text-[7.5px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider bg-black/[0.04] text-black/50">
                  💼 {confession.professionId}
                </span>
              )}
              {confession.contextId && (
                <span className="text-[7.5px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider bg-black/[0.04] text-black/50">
                  🫂 {confession.contextId}
                </span>
              )}
            </div>

            {/* Confession text */}
            <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0 relative mb-3">
              <div
                className="w-full h-full overflow-y-auto no-scrollbar px-3 py-2 text-center flex items-center"
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
              >
                <p className="w-full serif text-sm leading-relaxed text-[#2a2a2a] whitespace-pre-wrap my-auto">
                  {confession.text}
                </p>
              </div>
            </div>

            {/* Interaction count */}
            <div className="flex items-center justify-center gap-3 mb-4 text-[9px] text-black/30 font-medium tracking-wide uppercase">
              <span className="flex items-center gap-1.5">
                <Eye size={10} className="opacity-70" /> {confession.views || 0}
              </span>
              {totalReactions !== undefined && totalReactions > 0 && (
                <>
                  <span className="w-0.5 h-0.5 rounded-full bg-black/20" />
                  <span>Felt by {totalReactions}</span>
                </>
              )}
            </div>

            {/* Reactions row */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
              {activeReactions.map((type) => {
                const emoji = resolveEmoji(type);
                if (!emoji) return null;
                const count = reactionCounts?.[type] ?? 0;
                const isActive = visitorReactions?.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={(e) => handleReactionClick(type, e)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all border ${
                      isActive
                        ? "bg-black/10 border-black/20 text-black shadow-sm"
                        : "bg-[#faf8f5] border-transparent text-black/50 hover:bg-black/5 hover:text-black/80"
                    }`}
                  >
                    <span className="text-sm">{emoji}</span>
                    <span>{count}</span>
                  </button>
                );
              })}

              {/* Add Reaction Button */}
              {activeReactions.length < 10 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowEmojiPicker(!showEmojiPicker);
                    }}
                    className="w-7 h-7 rounded-full bg-[#faf8f5] flex items-center justify-center text-black/40 hover:bg-black/5 hover:text-black transition-colors"
                  >
                    <span className="text-xs">+</span>
                  </button>

                  {showEmojiPicker && (
                    <>
                      <div
                        className="fixed inset-0 z-[90]"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowEmojiPicker(false);
                        }}
                      />
                      <div
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:absolute md:left-full md:bottom-[-20px] md:translate-x-0 md:translate-y-0 md:ml-3 md:top-auto z-[100] shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                        onWheel={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                      >
                        <Picker
                          data={data}
                          theme="light"
                          previewPosition="none"
                          onEmojiSelect={(e: any) => {
                            handleReactionClick(e.native);
                            setShowEmojiPicker(false);
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Card actions: download, copy link, share */}
            <CardActions
              confession={confession}
              boardSlug={boardSlug}
              totalReactions={totalReactions}
              reactionCounts={
                reactionCounts as Record<string, number> | undefined
              }
            />

            {/* View thread link */}
            <Link
              href={`/b/${boardSlug}/c/${confession._id}`}
              className="block text-center text-[9px] font-bold uppercase tracking-[0.15em] text-black/30 hover:text-black/60 transition-colors py-1"
            >
              View Thread & Comments →
            </Link>

            {/* Tap to flip back hint */}
            <button
              type="button"
              onClick={handleFlip}
              className="absolute top-3 right-3 w-6 h-6 rounded-full bg-black/5 flex items-center justify-center text-[10px] text-black/30 hover:bg-black/10 transition-colors"
            >
              ✕
            </button>

            {/* Report Button (Subtle) */}
            <button
              type="button"
              onClick={handleReport}
              title="Report this confession"
              className="absolute top-3 left-3 flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-black/10 hover:text-red-400 hover:opacity-100 transition-all opacity-60"
            >
              <Flag size={10} />
              Report
            </button>

            {/* Simple Report Toast notification within card */}
            <AnimatePresence>
              {reportSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/90 text-white px-3 py-1.5 rounded-full flex items-center gap-2 z-50 shadow-lg pointer-events-none"
                >
                  <CheckCircle2 size={12} className="text-green-400" />
                  <span className="text-[9px] font-bold uppercase tracking-widest whitespace-nowrap">
                    Reported! Thank you.
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      {showRateLimit &&
        typeof document !== "undefined" &&
        createPortal(
          <RateLimitModal
            isOpen={showRateLimit}
            onClose={() => setShowRateLimit(false)}
            message={rateLimitMessage}
          />,
          document.body,
        )}
    </div>
  );
}
