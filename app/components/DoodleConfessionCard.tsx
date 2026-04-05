"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CATEGORY_INFO, REACTION_INFO, getVisitorId } from "@/app/lib/utils";
import Link from "next/link";
import { Eye, Flag, CheckCircle2, MessageCircle } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import CardActions from "./CardActions";
import { AnimatePresence, motion } from "framer-motion";
import RateLimitModal from "./RateLimitModal";
import { createPortal } from "react-dom";

interface DoodleConfessionCardProps {
  confession: {
    _id: Id<"confessions">;
    text?: string;
    canvasImageUrl?: string;
    caption?: string;
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

export default function DoodleConfessionCard({
  confession,
  boardSlug: propBoardSlug,
  boardReactions,
}: DoodleConfessionCardProps) {
  const boardSlug = propBoardSlug || confession.boardSlug || "global";
  const [isRevealed, setIsRevealed] = useState(false);
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
    }
  };

  const handleReveal = () => {
    if (!isRevealed && !hasViewed) {
      incrementView({ confessionId: confession._id }).catch(console.error);
      setHasViewed(true);
    }
    setIsRevealed(!isRevealed);
  };

  const handleReport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (reporting || reportSuccess) return;
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

  const captionText = confession.caption || confession.text;

  return (
    <div className="relative" style={{ minHeight: "380px" }}>
      <AnimatePresence mode="wait">
        {!isRevealed ? (
          /* ── COVER ── The magic reveal card */
          <motion.div
            key="cover"
            initial={false}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeIn" }}
            className="absolute inset-0 rounded-2xl overflow-hidden cursor-pointer"
            onClick={handleReveal}
            style={{
              background: catInfo
                ? `linear-gradient(160deg, ${catInfo.color}ee, ${catInfo.color}99, ${catInfo.color}dd)`
                : "linear-gradient(160deg, #8b2252ee, #8b225299, #8b2252dd)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            {/* Animated paint splatter decorations */}
            <div className="absolute inset-0 overflow-hidden">
              {/* Floating brush stroke 1 */}
              <motion.div
                className="absolute top-[15%] left-[10%] w-24 h-4 rounded-full opacity-[0.12]"
                style={{
                  background: "white",
                  filter: "blur(4px)",
                  transform: "rotate(-15deg)",
                }}
                animate={{ x: [0, 10, 0], y: [0, -5, 0] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              {/* Floating brush stroke 2 */}
              <motion.div
                className="absolute bottom-[25%] right-[8%] w-20 h-3 rounded-full opacity-[0.1]"
                style={{
                  background: "white",
                  filter: "blur(3px)",
                  transform: "rotate(25deg)",
                }}
                animate={{ x: [0, -8, 0], y: [0, 6, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
              />
              {/* Floating brush stroke 3 */}
              <motion.div
                className="absolute top-[50%] left-[50%] w-16 h-2 rounded-full opacity-[0.08]"
                style={{
                  background: "white",
                  filter: "blur(2px)",
                  transform: "rotate(-45deg)",
                }}
                animate={{ x: [0, 5, -5, 0], y: [0, -3, 3, 0] }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2,
                }}
              />
              {/* Paint drip effect */}
              <motion.div
                className="absolute top-0 right-[30%] w-1 opacity-[0.08]"
                style={{ background: "white" }}
                animate={{ height: ["0%", "30%", "0%"] }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1.5,
                }}
              />
            </div>

            {/* Category badge */}
            <div className="absolute top-4 left-4 z-10">
              <span className="text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-white/15 text-white/80 backdrop-blur-sm">
                {catInfo?.label ?? confession.category}
              </span>
            </div>

            {/* Doodle badge */}
            <div className="absolute top-4 right-4 z-10">
              <span className="text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-white/15 text-white/80 backdrop-blur-sm flex items-center gap-1">
                🎨 Doodle
              </span>
            </div>

            {/* Center artwork */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              {/* Animated pencil icon */}
              <motion.div
                className="relative mb-4"
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <span className="text-5xl drop-shadow-lg">🎨</span>
              </motion.div>

              {/* Shimmer text */}
              <div className="relative overflow-hidden">
                <motion.span
                  className="text-[11px] font-black uppercase tracking-[0.3em] text-white/60 block"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  Tap to reveal
                </motion.span>
              </div>

              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 mt-2">
                someone drew a secret
              </span>
            </div>

            {/* Border accent */}
            <div
              className="absolute bottom-0 left-0 right-0 h-1.5"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
              }}
            />
          </motion.div>
        ) : (
          /* ── REVEALED ── The doodle content */
          <motion.div
            key="revealed"
            initial={{ rotateY: -90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="absolute inset-0 rounded-2xl overflow-hidden"
            style={{
              background: "#faf7f2",
              boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
            }}
          >
            {/* Decorative border */}
            <div className="absolute inset-[6px] border border-dashed border-black/10 rounded-xl pointer-events-none" />

            <div className="relative h-full flex flex-col p-4">
              {/* Top: icon + category */}
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-sm">🎨</span>
                <span
                  className="text-[8px] font-bold uppercase tracking-[0.15em]"
                  style={{ color: catInfo?.color ?? "#666" }}
                >
                  {catInfo?.label ?? confession.category}
                </span>
              </div>

              {/* The doodle image */}
              <div className="flex-1 flex items-center justify-center min-h-0 mb-2">
                <div
                  className="w-full h-full relative rounded-xl overflow-hidden"
                  style={{ border: "1px solid rgba(0,0,0,0.06)" }}
                >
                  {confession.canvasImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={confession.canvasImageUrl}
                      alt="Doodle confession"
                      className="w-full h-full object-contain"
                      style={{ background: "#f5f0e8" }}
                    />
                  )}
                </div>
              </div>

              {/* Caption */}
              {captionText && (
                <p className="text-center serif text-xs text-black/60 italic mb-2 line-clamp-2 px-2">
                  &ldquo;{captionText}&rdquo;
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center justify-center gap-3 mb-2 text-[9px] text-black/30 font-medium tracking-wide uppercase">
                <span className="flex items-center gap-1.5">
                  <Eye size={10} className="opacity-70" />{" "}
                  {confession.views || 0}
                </span>
                {totalReactions !== undefined && totalReactions > 0 && (
                  <>
                    <span className="w-0.5 h-0.5 rounded-full bg-black/20" />
                    <span>Felt by {totalReactions}</span>
                  </>
                )}
              </div>

              {/* Reactions */}
              <div className="flex items-center justify-center gap-3 mb-2">
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

              {/* Card actions */}
              <CardActions
                confession={{
                  ...confession,
                  text: captionText || "🎨 Doodle confession",
                }}
                boardSlug={boardSlug}
                totalReactions={totalReactions}
                reactionCounts={
                  reactionCounts as Record<string, number> | undefined
                }
              />

              {/* View thread */}
              <Link
                href={`/b/${boardSlug}/c/${confession._id}`}
                className="flex items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-black/30 hover:text-black/60 transition-colors py-1"
              >
                <MessageCircle size={10} />
                Guess in Comments →
              </Link>

              {/* Close button */}
              <button
                type="button"
                onClick={handleReveal}
                className="absolute top-3 right-3 w-6 h-6 rounded-full bg-black/5 flex items-center justify-center text-[10px] text-black/30 hover:bg-black/10 transition-colors"
              >
                ✕
              </button>

              {/* Report */}
              <button
                type="button"
                onClick={handleReport}
                title="Report this confession"
                className="absolute top-3 left-3 flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-black/10 hover:text-red-400 transition-all opacity-60"
              >
                <Flag size={10} />
                Report
              </button>

              {/* Report toast */}
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
          </motion.div>
        )}
      </AnimatePresence>
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
