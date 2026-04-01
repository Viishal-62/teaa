"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  CATEGORY_INFO,
  getVisitorId,
  timeAgo,
} from "@/app/lib/utils";
import Link from "next/link";
import { Eye, Heart, MessageCircle, Share2, Check, Flag, CheckCircle2 } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import CardActions from "./CardActions";

interface AdmirerConfessionCardProps {
  confession: {
    _id: Id<"confessions">;
    text: string;
    category: string;
    displayName: string;
    createdAt: number;
    views?: number;
    boardSlug?: string;
  };
  boardSlug?: string;
  boardReactions?: string[];
}

export default function AdmirerConfessionCard({
  confession,
  boardSlug: propBoardSlug,
  boardReactions,
}: AdmirerConfessionCardProps) {
  const boardSlug = propBoardSlug || confession.boardSlug || "global";
  const [isOpen, setIsOpen] = useState(false);
  const [hasViewed, setHasViewed] = useState(false);
  const [copied, setCopied] = useState(false);

  const catInfo = CATEGORY_INFO[confession.category] || CATEGORY_INFO.love;

  const incrementView = useMutation(api.confessions.incrementView);
  const reportConfession = useMutation(api.reports.create);

  const [reporting, setReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const totalReactions = useQuery(api.reactions.getTotalCount, {
    confessionId: confession._id,
  });
  const reactionCounts = useQuery(api.reactions.getCounts, {
    confessionId: confession._id,
  });
  const commentCount = useQuery(api.comments.countByConfession, {
    confessionId: confession._id,
  });
  const visitorId = getVisitorId();

  const handleToggle = () => {
    if (!isOpen && !hasViewed) {
      incrementView({ confessionId: confession._id }).catch(() => { });
      setHasViewed(true);
    }
    setIsOpen(!isOpen);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/b/${boardSlug}/c/${confession._id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  const textMatch = confession.text.match(
    /^To:\s*([^—\-\–.]+)\s*[—\-\–]\s*([\s\S]*)/,
  );
  const recipient = textMatch ? textMatch[1].trim() : null;
  const letterBody = textMatch ? textMatch[2].trim() : confession.text;

  return (
    <div className="w-full cursor-pointer select-none" onClick={handleToggle}>

      {/* ══════════════════════════════════════
          LETTER — slides out above envelope
         ══════════════════════════════════════ */}
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{
          height: { duration: 0.55, ease: [0.4, 0, 0.2, 1] },
          opacity: { duration: 0.2, delay: isOpen ? 0.15 : 0 },
        }}
        className="overflow-hidden relative z-10"
        style={{
          background: "#fff",
          borderRadius: "14px 14px 4px 4px",
          marginBottom: "-8px",
          boxShadow: isOpen
            ? "0 12px 40px rgba(180, 50, 80, 0.08), 0 4px 14px rgba(180, 50, 80, 0.04)"
            : "none",
        }}
      >
        <motion.div
          initial={false}
          animate={{ opacity: isOpen ? 1 : 0, y: isOpen ? 0 : 15 }}
          transition={{ delay: isOpen ? 0.3 : 0, duration: 0.4 }}
          className="relative p-6 pb-4"
        >
          {/* Dear line */}
          {recipient && (
            <p className="text-[16px] font-bold serif italic mb-1.5" style={{ color: "#C0365C" }}>
              Dear {recipient},
            </p>
          )}

          {/* Divider */}
          <div className="h-px w-16 mb-5" style={{ background: "linear-gradient(90deg, rgba(192, 54, 92, 0.2), transparent)" }} />

          {/* Body */}
          <p className="text-[15px] serif italic leading-[1.85] whitespace-pre-wrap mb-7" style={{ color: "#2D1810" }}>
            {letterBody}
          </p>

          {/* Signature */}
          <div className="mb-1">
            <div className="w-10 h-px mb-2" style={{ background: "linear-gradient(90deg, rgba(192, 54, 92, 0.15), transparent)" }} />
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-0.5" style={{ color: "rgba(192, 54, 92, 0.2)" }}>
              Forever yours,
            </p>
            <p className="text-[13px] font-black serif italic flex items-center gap-1.5" style={{ color: "#C0365C" }}>
              Your Secret Admirer <Heart size={11} fill="currentColor" />
            </p>
          </div>

          {/* Actions */}
          <div
            className="mt-5 pt-4"
            style={{ borderTop: "1px solid rgba(192, 54, 92, 0.06)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <CardActions
              confession={confession}
              boardSlug={boardSlug}
              totalReactions={totalReactions}
              reactionCounts={reactionCounts}
            />
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-widest" style={{ color: "rgba(0,0,0,0.15)" }}>
                <span className="flex items-center gap-1"><Eye size={10} /> {confession.views || 0}</span>
                <Link href={`/b/${boardSlug}/c/${confession._id}`} className="flex items-center gap-1 hover:opacity-60 transition-opacity">
                  <MessageCircle size={10} /> {commentCount || 0}
                </Link>
                <button
                  onClick={handleReport}
                  className="flex items-center gap-1 hover:text-red-400 transition-colors"
                >
                  <Flag size={10} /> Report
                </button>
              </div>
              <button onClick={handleShare} className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest transition-opacity hover:opacity-60" style={{ color: "rgba(192, 54, 92, 0.25)" }}>
                {copied ? <Check size={10} /> : <Share2 size={10} />}
                {copied ? "Copied" : "Share"}
              </button>
            </div>

            {/* In-card notification */}
            <AnimatePresence>
              {reportSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-[#C0365C] text-white px-3 py-1 rounded-full flex items-center gap-2 z-50 shadow-md pointer-events-none"
                >
                  <CheckCircle2 size={10} />
                  <span className="text-[8px] font-black uppercase tracking-widest whitespace-nowrap">Letter Flagged</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>

      {/* ══════════════════════════════════════
          ENVELOPE — Red/pink geometric design
          inspired by the reference image
         ══════════════════════════════════════ */}
      <div
        className="relative overflow-hidden"
        style={{
          height: isOpen ? "80px" : undefined,
          aspectRatio: !isOpen ? "5 / 3.2" : undefined,
          borderRadius: isOpen ? "4px 4px 16px 16px" : "16px",
          transition: "height 0.55s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.4s ease, aspect-ratio 0.55s ease",
          overflow: "hidden",
        }}
      >
        {/* ── Base body — deep rose ── */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(165deg, #D4365C 0%, #C0305A 40%, #B82A52 100%)",
          }}
        />

        {/* ── Left side fold triangle ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            clipPath: "polygon(0 0, 0 100%, 50% 50%)",
            background: "linear-gradient(135deg, #E8698A 0%, #D84A6C 100%)",
          }}
        />

        {/* ── Right side fold triangle ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            clipPath: "polygon(100% 0, 100% 100%, 50% 50%)",
            background: "linear-gradient(225deg, #E8698A 0%, #D84A6C 100%)",
          }}
        />

        {/* ── Bottom fold triangle — lighter pink ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            clipPath: "polygon(0 100%, 100% 100%, 50% 50%)",
            background: "linear-gradient(to top, #F09EB5 0%, #E87A98 100%)",
          }}
        />

        {/* ── Fold lines — subtle depth ── */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line x1="0" y1="0" x2="50" y2="50" stroke="rgba(0,0,0,0.06)" strokeWidth="0.3" />
          <line x1="100" y1="0" x2="50" y2="50" stroke="rgba(0,0,0,0.06)" strokeWidth="0.3" />
          <line x1="0" y1="100" x2="50" y2="50" stroke="rgba(0,0,0,0.04)" strokeWidth="0.3" />
          <line x1="100" y1="100" x2="50" y2="50" stroke="rgba(0,0,0,0.04)" strokeWidth="0.3" />
        </svg>

        {/* ── Top flap — folds open ── */}
        <motion.div
          className="absolute top-0 left-0 right-0 origin-top"
          initial={false}
          animate={{
            rotateX: isOpen ? -175 : 0,
            zIndex: isOpen ? -1 : 30,
          }}
          transition={{
            duration: 0.5,
            ease: [0.4, 0, 0.2, 1],
            delay: isOpen ? 0 : 0.3,
          }}
          style={{
            height: "55%",
            clipPath: "polygon(0 0, 100% 0, 50% 100%)",
            background: "linear-gradient(180deg, #C42E54 0%, #B82A52 60%, #D04060 100%)",
            transformStyle: "preserve-3d",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
          }}
        />

        {/* ── Sealed content — visible when closed ── */}
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
              className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-10"
            >
              {recipient ? (
                <>
                  <p className="text-[9px] font-bold uppercase tracking-[0.4em] mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                    sealed for
                  </p>
                  <h3 className="text-[24px] font-black serif italic leading-tight text-white drop-shadow-sm">
                    {recipient}
                  </h3>
                </>
              ) : (
                <h3 className="text-[20px] font-black serif italic leading-tight text-white drop-shadow-sm">
                  A Secret Message
                </h3>
              )}

              <p className="mt-6 text-[8px] font-semibold uppercase tracking-[0.5em]" style={{ color: "rgba(255,255,255,0.25)" }}>
                tap to unseal
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Wax seal — heart, breaks on open ── */}
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{
                scale: 1.4,
                opacity: 0,
                rotate: 15,
                transition: { duration: 0.25, ease: "easeOut" },
              }}
              transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}
              className="absolute z-40"
              style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
            >
              <div
                className="w-[50px] h-[50px] rounded-full flex items-center justify-center relative"
                style={{
                  background: "radial-gradient(circle at 38% 35%, #F5F0E8, #E8DDD0 55%, #D8CCBC 100%)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.5), inset 0 -1px 3px rgba(0,0,0,0.06)",
                }}
              >
                <Heart size={18} fill="#C0365C" stroke="none" className="relative z-10 drop-shadow-sm" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ══════════════════════════════════════
          Category + time below
         ══════════════════════════════════════ */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex items-center justify-between px-2"
          >
            <div className="flex items-center gap-2">
              <span className="w-[6px] h-[6px] rounded-full" style={{ background: catInfo.color }} />
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(192, 54, 92, 0.3)" }}>
                {catInfo.label}
              </span>
            </div>
            <span className="text-[9px] font-medium" style={{ color: "rgba(192, 54, 92, 0.18)" }}>
              {timeAgo(confession.createdAt)}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
