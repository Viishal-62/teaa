"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CATEGORY_INFO, REACTION_INFO, getVisitorId } from "@/app/lib/utils";
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
  const reactionCounts = useQuery(api.reactions.getCounts, {
    confessionId: confession._id,
  });
  const totalReactions = useQuery(api.reactions.getTotalCount, {
    confessionId: confession._id,
  });
  const visitorId = getVisitorId();
  const visitorReactions = useQuery(
    api.reactions.getVisitorReactions,
    visitorId ? { confessionId: confession._id, visitorId } : "skip",
  );

  const handleReactionClick = async (type: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
      console.error("Reaction failed:", error);
    }
  };

  const handleFlip = () => {
    if (!isFlipped && !hasViewed) {
      incrementView({ confessionId: confession._id }).catch(console.error);
      setHasViewed(true);
    }
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

  const activeReactions =
    boardReactions && boardReactions.length > 0
      ? boardReactions
      : ["holding-you", "feels-heavy", "youll-be-ok", "no-it-burns"];

  return (
    <div className="perspective-1000 flip-card-container">
      <div
        className={`relative w-full preserve-3d transition-transform duration-700 ease-out ${isFlipped ? "rotate-y-180" : ""}`}
        style={{ minHeight: "340px" }}
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

          {/* Category badge top-left */}
          <div className="absolute top-4 left-4 z-10">
            <span className="text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-white/15 text-white/80 backdrop-blur-sm">
              {catInfo?.label ?? confession.category}
            </span>
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
          className={`absolute inset-0 backface-hidden rotate-y-180 rounded-2xl overflow-hidden back-card-face antialiased transform-gpu ${!isFlipped ? "pointer-events-none" : ""}`}
          style={{ WebkitFontSmoothing: "antialiased" }}
        >
          {/* Decorative border frame */}
          <div className="absolute inset-0 bg-[#faf7f2] transform-gpu" />
          <div className="absolute inset-[6px] border border-dashed border-black/10 rounded-xl pointer-events-none" />

          <div className="relative h-full flex flex-col p-5">
            {/* Top: icon + category */}
            <div className="flex flex-col items-center mb-3">
              <span className="text-xl mb-1">🫖</span>
              <span
                className="text-[8px] font-bold uppercase tracking-[0.15em]"
                style={{ color: catInfo?.color ?? "#666" }}
              >
                {catInfo?.label ?? confession.category}
              </span>
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
            <div className="flex items-center justify-center gap-3 mb-3">
              {activeReactions.map((type) => {
                const info = REACTION_INFO[type];
                if (!info) return null;
                const count = reactionCounts?.[type] ?? 0;
                const isActive = visitorReactions?.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={(e) => handleReactionClick(type, e)}
                    className={`flex flex-col items-center gap-0.5 group/rxn transition-all ${isActive ? "scale-110" : ""}`}
                  >
                    <span className="text-[10px] font-bold text-black/50">
                      {count}
                    </span>
                    <span
                      className={`text-lg transition-transform group-hover/rxn:scale-125 ${isActive ? "drop-shadow-md" : ""}`}
                    >
                      {info.emoji}
                    </span>
                    <span className="text-[7px] font-semibold uppercase tracking-wider text-black/35 max-w-[50px] text-center leading-tight">
                      {info.label}
                    </span>
                  </button>
                );
              })}
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
