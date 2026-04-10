"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getVisitorId } from "@/app/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  BarChart3,
  Check,
  Clock,
  Download,
  ImageIcon,
  Plus,
  Share2,
  Square,
  Trash2,
  X,
} from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface PollCardProps {
  poll: {
    _id: Id<"polls">;
    boardId: Id<"boards">;
    question: string;
    options: string[];
    imageUrl?: string;
    creatorToken: string;
    expiresAt?: number;
    isActive: boolean;
    totalVotes: number;
    createdAt: number;
  };
  boardSlug: string;
  isOwner: boolean;
}

// Color palette for option bars
const OPTION_COLORS = [
  { bg: "#000000", bar: "#000000", text: "#ffffff" },
  { bg: "#374151", bar: "#374151", text: "#ffffff" },
  { bg: "#6B7280", bar: "#6B7280", text: "#ffffff" },
  { bg: "#9CA3AF", bar: "#9CA3AF", text: "#ffffff" },
  { bg: "#D1D5DB", bar: "#D1D5DB", text: "#000000" },
];

function timeRemaining(expiresAt: number): string {
  const diff = expiresAt - Date.now();
  if (diff <= 0) return "Ended";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h left`;
  }
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

export default function PollCard({ poll, boardSlug, isOwner }: PollCardProps) {
  const visitorId = typeof window !== "undefined" ? getVisitorId() : "";
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const vote = useMutation(api.polls.vote);
  const endPoll = useMutation(api.polls.endPoll);
  const removePoll = useMutation(api.polls.remove);

  const results = useQuery(api.polls.getResults, { pollId: poll._id });
  const voteStatus = useQuery(api.polls.hasVoted, {
    pollId: poll._id,
    visitorId,
  });

  const hasVoted = voteStatus?.voted ?? false;
  const votedIndex = voteStatus?.optionIndex ?? -1;
  const isExpired = poll.expiresAt ? poll.expiresAt <= Date.now() : false;
  const isEnded = !poll.isActive || isExpired;
  const showResults = hasVoted || isOwner || isEnded;
  const totalVotes = results?.totalVotes ?? poll.totalVotes;

  // Timer countdown
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!poll.expiresAt || isEnded) return;
    const timer = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(timer);
  }, [poll.expiresAt, isEnded]);

  const handleVote = useCallback(async () => {
    if (selectedOption === null || isVoting || hasVoted || isEnded) return;
    setIsVoting(true);
    try {
      await vote({
        pollId: poll._id,
        optionIndex: selectedOption,
        visitorId,
      });
    } catch (e: any) {
      console.error("Vote failed:", e);
    } finally {
      setIsVoting(false);
    }
  }, [selectedOption, isVoting, hasVoted, isEnded, poll._id, visitorId, vote]);

  const handleEnd = useCallback(async () => {
    try {
      await endPoll({
        pollId: poll._id,
        creatorToken: poll.creatorToken,
      });
      setShowConfirmEnd(false);
    } catch (e) {
      console.error("End poll failed:", e);
    }
  }, [poll._id, poll.creatorToken, endPoll]);

  const handleDelete = useCallback(async () => {
    try {
      await removePoll({
        pollId: poll._id,
        creatorToken: poll.creatorToken,
      });
      setShowConfirmDelete(false);
    } catch (e) {
      console.error("Delete poll failed:", e);
    }
  }, [poll._id, poll.creatorToken, removePoll]);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/b/${boardSlug}`;
    const shareData = {
      title: `🗳️ Vote: ${poll.question}`,
      text: `Vote anonymously on this poll: "${poll.question}" ☕`,
      url,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [boardSlug, poll.question]);

  // ─── Download Results as Image (Creator Only) ───
  const handleDownload = useCallback(async () => {
    if (!isOwner || isDownloading) return;
    setIsDownloading(true);

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      const W = 800;
      const PADDING = 48;
      const OPTION_H = 56;
      const OPTION_GAP = 12;
      const IMAGE_H = poll.imageUrl ? 300 : 0;
      const HEADER_H = 140 + (poll.imageUrl ? IMAGE_H + 24 : 0);
      const OPTIONS_H =
        poll.options.length * OPTION_H + (poll.options.length - 1) * OPTION_GAP;
      const FOOTER_H = 100;
      const H = HEADER_H + OPTIONS_H + FOOTER_H + PADDING * 2;

      canvas.width = W * 2; // 2x for retina
      canvas.height = H * 2;
      ctx.scale(2, 2);

      // Background
      ctx.fillStyle = "#FAFAF8";
      ctx.beginPath();
      ctx.roundRect(0, 0, W, H, 24);
      ctx.fill();

      // Border
      ctx.strokeStyle = "rgba(0,0,0,0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(0, 0, W, H, 24);
      ctx.stroke();

      // Poll badge
      ctx.fillStyle = "rgba(0,0,0,0.04)";
      ctx.beginPath();
      ctx.roundRect(PADDING, PADDING, 95, 28, 14);
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.font = "bold 11px -apple-system, system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("🗳️  POLL RESULTS", PADDING + 12, PADDING + 18);

      // Status badge
      const statusText = isEnded ? "ENDED" : "LIVE";
      const statusColor = isEnded
        ? "rgba(0,0,0,0.15)"
        : "rgba(16, 185, 129, 0.15)";
      const statusTextColor = isEnded
        ? "rgba(0,0,0,0.35)"
        : "rgba(16, 185, 129, 1)";
      const statusW = ctx.measureText(statusText).width + 24;
      ctx.fillStyle = statusColor;
      ctx.beginPath();
      ctx.roundRect(W - PADDING - statusW, PADDING, statusW, 28, 14);
      ctx.fill();
      ctx.fillStyle = statusTextColor;
      ctx.font = "bold 10px -apple-system, system-ui, sans-serif";
      ctx.fillText(statusText, W - PADDING - statusW + 12, PADDING + 18);

      // Question
      ctx.fillStyle = "#000000";
      ctx.font = 'bold 24px Georgia, "Times New Roman", serif';
      ctx.textAlign = "left";

      // Word wrap question
      const words = poll.question.split(" ");
      const maxWidth = W - PADDING * 2;
      let line = "";
      let lines: string[] = [];
      for (const word of words) {
        const testLine = line + (line ? " " : "") + word;
        if (ctx.measureText(testLine).width > maxWidth && line) {
          lines.push(line);
          line = word;
        } else {
          line = testLine;
        }
      }
      lines.push(line);

      let questionY = PADDING + 56;
      for (const l of lines) {
        ctx.fillText(l, PADDING, questionY);
        questionY += 32;
      }

      // Image (if present)
      let optionsStartY = questionY + 24;
      if (poll.imageUrl) {
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject();
            img.src = poll.imageUrl!;
          });

          const imgW = W - PADDING * 2;
          const imgH = IMAGE_H;
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(PADDING, optionsStartY, imgW, imgH, 16);
          ctx.clip();
          // Cover-fit the image
          const scale = Math.max(imgW / img.width, imgH / img.height);
          const drawW = img.width * scale;
          const drawH = img.height * scale;
          const dx = PADDING + (imgW - drawW) / 2;
          const dy = optionsStartY + (imgH - drawH) / 2;
          ctx.drawImage(img, dx, dy, drawW, drawH);
          ctx.restore();
          optionsStartY += imgH + 24;
        } catch {
          // Skip image if it fails to load
          optionsStartY += 0;
        }
      }

      // Options with bars
      const optionCounts = results?.optionCounts ?? [];
      const maxCount = Math.max(...optionCounts, 1);

      for (let i = 0; i < poll.options.length; i++) {
        const y = optionsStartY + i * (OPTION_H + OPTION_GAP);
        const count = optionCounts[i] ?? 0;
        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        const barWidth =
          totalVotes > 0 ? ((W - PADDING * 2 - 80) * count) / maxCount : 0;

        const color = OPTION_COLORS[i % OPTION_COLORS.length];

        // Background bar
        ctx.fillStyle = "rgba(0,0,0,0.03)";
        ctx.beginPath();
        ctx.roundRect(PADDING, y, W - PADDING * 2, OPTION_H, 12);
        ctx.fill();

        // Fill bar
        if (barWidth > 0) {
          ctx.fillStyle = `${color.bar}18`;
          ctx.beginPath();
          ctx.roundRect(PADDING, y, barWidth + 80, OPTION_H, 12);
          ctx.fill();
        }

        // Option text
        ctx.fillStyle = "#000000";
        ctx.font = "600 15px -apple-system, system-ui, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(poll.options[i], PADDING + 16, y + 34);

        // Percentage
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.font = "bold 14px -apple-system, system-ui, sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(`${pct}%`, W - PADDING - 16, y + 34);

        // Winner crown
        if (isEnded && totalVotes > 0 && count === Math.max(...optionCounts)) {
          ctx.font = "16px sans-serif";
          ctx.textAlign = "right";
          ctx.fillText("🏆", W - PADDING - 56, y + 36);
        }
      }

      // Footer
      const footerY = optionsStartY + OPTIONS_H + 32;

      // Total votes
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.font = "600 12px -apple-system, system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(
        `${totalVotes} anonymous vote${totalVotes !== 1 ? "s" : ""}`,
        PADDING,
        footerY,
      );

      // Watermark
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.font = "bold 13px -apple-system, system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("teaadrop.xyz", W - PADDING, footerY);

      // Teaa branding bar
      const brandY = footerY + 24;
      ctx.fillStyle = "rgba(0,0,0,0.03)";
      ctx.beginPath();
      ctx.roundRect(PADDING, brandY, W - PADDING * 2, 36, 10);
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.font = "600 11px -apple-system, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        "☕ Create anonymous polls & confessions at teaadrop.xyz",
        W / 2,
        brandY + 22,
      );

      // Download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `poll-results-${boardSlug}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsDownloading(false);
      }, "image/png");
    } catch (e) {
      console.error("Download failed:", e);
      setIsDownloading(false);
    }
  }, [isOwner, isDownloading, poll, results, totalVotes, isEnded, boardSlug]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full"
    >
      <div
        ref={resultRef}
        className="bg-white rounded-2xl border border-black/[0.06] shadow-xl shadow-black/[0.04] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-black/30 flex items-center gap-1.5">
              <BarChart3 size={12} />
              Poll
            </span>
          </div>
          <div className="flex items-center gap-2">
            {poll.expiresAt && !isEnded && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-black/30 bg-black/[0.03] px-2.5 py-1 rounded-full">
                <Clock size={10} />
                {timeRemaining(poll.expiresAt)}
              </span>
            )}
            {isEnded && (
              <span className="text-[10px] font-bold text-black/25 bg-black/[0.03] px-2.5 py-1 rounded-full">
                🏁 Ended
              </span>
            )}
            {!isEnded && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Live
              </span>
            )}
          </div>
        </div>

        {/* Image */}
        {poll.imageUrl && (
          <div className="px-5 pb-3">
            <div className="relative rounded-xl overflow-hidden bg-black/[0.02] border border-black/[0.04]">
              <img
                src={poll.imageUrl}
                alt="Poll context"
                className="w-full h-48 object-cover"
                loading="lazy"
              />
            </div>
          </div>
        )}

        {/* Question */}
        <div className="px-5 pb-4">
          <h3 className="text-lg font-black serif tracking-tight text-black leading-snug">
            &quot;{poll.question}&quot;
          </h3>
        </div>

        {/* Options */}
        <div className="px-5 pb-5 space-y-2">
          {poll.options.map((option, i) => {
            const count = results?.optionCounts?.[i] ?? 0;
            const pct =
              totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            const isWinner =
              isEnded &&
              totalVotes > 0 &&
              count === Math.max(...(results?.optionCounts ?? [0]));
            const isSelected = selectedOption === i;
            const isVotedOption = votedIndex === i;

            if (showResults) {
              // ── Results View ──
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`relative overflow-hidden rounded-xl border transition-all ${
                    isVotedOption
                      ? "border-black/15 bg-black/[0.02]"
                      : isWinner
                        ? "border-black/10 bg-black/[0.01]"
                        : "border-black/[0.06] bg-white"
                  }`}
                >
                  {/* Bar fill */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{
                      duration: 0.8,
                      delay: i * 0.1,
                      ease: "easeOut",
                    }}
                    className="absolute inset-y-0 left-0 rounded-xl"
                    style={{
                      background: isVotedOption
                        ? "rgba(0,0,0,0.06)"
                        : isWinner
                          ? "rgba(0,0,0,0.04)"
                          : "rgba(0,0,0,0.02)",
                    }}
                  />

                  <div className="relative flex items-center justify-between px-4 py-3.5 z-10">
                    <div className="flex items-center gap-2">
                      {isVotedOption && (
                        <span className="w-5 h-5 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                          <Check size={12} className="text-white" />
                        </span>
                      )}
                      {isWinner && !isVotedOption && (
                        <span className="text-sm">🏆</span>
                      )}
                      <span
                        className={`text-sm font-semibold ${
                          isVotedOption
                            ? "text-black"
                            : isWinner
                              ? "text-black/80"
                              : "text-black/60"
                        }`}
                      >
                        {option}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-black/30">
                        {count}
                      </span>
                      <span
                        className={`text-sm font-black ${
                          isVotedOption
                            ? "text-black"
                            : isWinner
                              ? "text-black/70"
                              : "text-black/40"
                        }`}
                      >
                        {pct}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            }

            // ── Voting View ──
            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedOption(i)}
                disabled={isEnded}
                className={`w-full text-left rounded-xl border px-4 py-3.5 transition-all active:scale-[0.98] ${
                  isSelected
                    ? "border-black bg-black/[0.02] shadow-sm"
                    : "border-black/[0.06] bg-white hover:border-black/15 hover:bg-black/[0.01]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      isSelected ? "border-black" : "border-black/15"
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2.5 h-2.5 bg-black rounded-full"
                      />
                    )}
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      isSelected ? "text-black" : "text-black/60"
                    }`}
                  >
                    {option}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Vote Button (only if not voted/ended/owner) */}
        {!showResults && (
          <div className="px-5 pb-5">
            <button
              type="button"
              onClick={handleVote}
              disabled={selectedOption === null || isVoting}
              className="w-full py-3.5 bg-black text-white rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-20"
            >
              {isVoting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Voting...
                </span>
              ) : (
                "Cast Your Vote"
              )}
            </button>
          </div>
        )}

        {/* Footer: Vote count + actions */}
        <div className="border-t border-black/[0.04] px-5 py-3.5 flex items-center justify-between">
          <span className="text-[11px] font-bold text-black/25">
            {totalVotes} vote{totalVotes !== 1 ? "s" : ""} · anonymous
          </span>
          <div className="flex items-center gap-1.5">
            {/* Share */}
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-black/35 hover:text-black hover:bg-black/[0.03] transition-all active:scale-95"
            >
              {copied ? (
                <>
                  <Check size={12} className="text-green-500" />
                  <span className="text-green-500">Copied</span>
                </>
              ) : (
                <>
                  <Share2 size={12} />
                  Share
                </>
              )}
            </button>

            {/* Download (Creator Only) */}
            {isOwner && showResults && (
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-black/35 hover:text-black hover:bg-black/[0.03] transition-all active:scale-95 disabled:opacity-40"
                title="Download results as image"
              >
                {isDownloading ? (
                  <>
                    <div className="w-3 h-3 border-[1.5px] border-black/20 border-t-black/60 rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Download size={12} />
                    Download
                  </>
                )}
              </button>
            )}

            {/* Creator controls */}
            {isOwner && !isEnded && (
              <button
                type="button"
                onClick={() => setShowConfirmEnd(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-amber-600 hover:bg-amber-50 transition-all active:scale-95"
              >
                <Square size={10} />
                End
              </button>
            )}
            {isOwner && (
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-red-400 hover:bg-red-50 transition-all active:scale-95"
              >
                <Trash2 size={10} />
              </button>
            )}
          </div>
        </div>

        {/* Create Your Own CTA (shown after voting, not for owner) */}
        {showResults && !isOwner && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className="border-t border-black/[0.04] px-5 py-4 bg-[#faf8f5]"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/25 mb-3 text-center">
              ☕ Enjoyed this?
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Link
                href="/create"
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black/90 transition-all active:scale-[0.98]"
              >
                <BarChart3 size={12} />
                Create Your Own Poll
              </Link>
              <Link
                href="/create"
                className="flex-1 flex items-center justify-center gap-2 py-3 border border-black/10 text-black/50 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black/[0.02] transition-all active:scale-[0.98]"
              >
                <Plus size={12} />
                Create a Board
              </Link>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── End Poll Confirmation Modal ── */}
      <AnimatePresence>
        {showConfirmEnd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => setShowConfirmEnd(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center"
            >
              <span className="text-3xl block mb-3">⏹️</span>
              <h3 className="text-lg font-black serif mb-1">End this poll?</h3>
              <p className="text-xs text-black/40 mb-5">
                Voting will stop and results will be final. This can&apos;t be
                undone.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmEnd(false)}
                  className="flex-1 py-3 border border-black/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-black/50 hover:bg-black/[0.02] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleEnd}
                  className="flex-1 py-3 bg-amber-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-amber-600 transition-all"
                >
                  End Poll
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete Poll Confirmation Modal ── */}
      <AnimatePresence>
        {showConfirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => setShowConfirmDelete(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center"
            >
              <span className="text-3xl block mb-3">🗑️</span>
              <h3 className="text-lg font-black serif mb-1">
                Delete this poll?
              </h3>
              <p className="text-xs text-black/40 mb-5">
                The poll and all votes will be permanently removed.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  className="flex-1 py-3 border border-black/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-black/50 hover:bg-black/[0.02] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
