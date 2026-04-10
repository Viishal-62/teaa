"use client";

import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CATEGORY_INFO, REACTION_INFO, getVisitorId } from "@/app/lib/utils";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
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
    contentType?: string;
    cityId?: string;
    professionId?: string;
    contextId?: string;
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const lastTapRef = useRef<number>(0);

  const reactionCountsArray = useQuery(api.reactions.getCounts, {
    confessionId: confession._id,
  });
  const reactionCounts = reactionCountsArray
    ? Object.fromEntries(reactionCountsArray.map((r) => [r.type, r.count]))
    : undefined;
  const totalReactions = useQuery(api.reactions.getTotalCount, {
    confessionId: confession._id,
  });
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

  const handleRevealedTap = useCallback(
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
    }
  };

  const handleReveal = () => {
    if (!isRevealed && !hasViewed) {
      incrementView({ confessionId: confession._id }).catch(console.error);
      setHasViewed(true);
    }
    if (typeof navigator !== "undefined" && navigator.vibrate)
      navigator.vibrate(50);
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

  const captionText = confession.caption || confession.text;

  return (
    <div className="relative" style={{ minHeight: "420px" }}>
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
            className="absolute inset-0 rounded-2xl"
            style={{
              boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
            }}
          >
            {/* Background layer */}
            <div className="absolute inset-0 bg-[#faf7f2] rounded-2xl overflow-hidden" />

            {/* Decorative border */}
            <div className="absolute inset-[6px] border border-dashed border-black/10 rounded-xl pointer-events-none" />

            <div
              className="relative h-full flex flex-col p-4"
              onClick={handleRevealedTap}
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
              {/* Top: icon + category */}
              <div className="flex flex-col items-center justify-center gap-1 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🎨</span>
                  <span
                    className="text-[8px] font-bold uppercase tracking-[0.15em] text-center"
                    style={{ color: catInfo?.color ?? "#666" }}
                  >
                    {confession.contentType === "question"
                      ? "❓ QUESTION • "
                      : ""}
                    {catInfo?.label ?? confession.category}
                  </span>
                </div>
                {(confession.cityId ||
                  confession.professionId ||
                  confession.contextId) && (
                  <div className="flex flex-wrap justify-center gap-1 mt-1">
                    {confession.cityId && (
                      <span className="text-[8px] px-2 py-0.5 rounded-[4px] font-bold uppercase tracking-wider bg-black/5 text-black/60">
                        📍 {confession.cityId}
                      </span>
                    )}
                    {confession.professionId && (
                      <span className="text-[8px] px-2 py-0.5 rounded-[4px] font-bold uppercase tracking-wider bg-black/5 text-black/60">
                        💼 {confession.professionId}
                      </span>
                    )}
                    {confession.contextId && (
                      <span className="text-[8px] px-2 py-0.5 rounded-[4px] font-bold uppercase tracking-wider bg-black/5 text-black/60 max-w-[150px] truncate">
                        🫂 {confession.contextId}
                      </span>
                    )}
                  </div>
                )}
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
