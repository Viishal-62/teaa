"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Eye, MessageCircle, Heart, ArrowRight, Bell } from "lucide-react";
import { getVisitorId, getCreatorToken, timeAgo } from "@/app/lib/utils";
import Link from "next/link";

const NOTIF_LAST_SEEN_KEY = "teaa-notif-last-seen";

function getLastSeenAt(): number {
  if (typeof window === "undefined") return Date.now();
  const stored = localStorage.getItem(NOTIF_LAST_SEEN_KEY);
  // Default to 24 hours ago so first-time users see recent activity
  return stored ? Number(stored) : Date.now() - 24 * 60 * 60 * 1000;
}

function updateLastSeen() {
  if (typeof window === "undefined") return;
  localStorage.setItem(NOTIF_LAST_SEEN_KEY, String(Date.now()));
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [lastSeenAt, setLastSeenAt] = useState(Date.now());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLastSeenAt(getLastSeenAt());
    setMounted(true);
  }, []);

  const visitorId = mounted ? getVisitorId() : "";
  const creatorToken = mounted ? getCreatorToken() : "";

  // Query notifications
  const confessorNotifs = useQuery(
    api.notifications.getConfessorNotifications,
    mounted && visitorId
      ? { visitorId, lastSeenAt }
      : "skip"
  );

  const creatorNotifs = useQuery(
    api.notifications.getCreatorNotifications,
    mounted && creatorToken
      ? { creatorToken }
      : "skip"
  );

  const hasCreatorReplies = (confessorNotifs?.creatorReplies?.length ?? 0) > 0;
  const hasStats = (confessorNotifs?.stats?.length ?? 0) > 0;
  const hasCreatorNotifs = (creatorNotifs?.length ?? 0) > 0;
  const totalNotifs =
    (confessorNotifs?.creatorReplies?.length ?? 0) +
    (confessorNotifs?.stats?.length ?? 0) +
    (creatorNotifs?.length ?? 0);

  const handleDismissAll = useCallback(() => {
    updateLastSeen();
    setDismissed(true);
    setIsOpen(false);
  }, []);

  // Don't show if no notifications or already dismissed
  if (!mounted || dismissed || totalNotifs === 0) {
    return null;
  }

  // Auto-show the bell badge (not the panel)
  return (
    <>
      {/* Floating notification bell */}
      <motion.button
        initial={{ opacity: 0, scale: 0.5, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[90] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
        style={{
          background: hasCreatorReplies
            ? "linear-gradient(135deg, #f59e0b, #ea580c)"
            : "linear-gradient(135deg, #111, #333)",
        }}
      >
        {hasCreatorReplies ? (
          <Sparkles size={22} className="text-white" />
        ) : (
          <Bell size={20} className="text-white" />
        )}
        {/* Badge count */}
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shadow-lg">
          {totalNotifs}
        </span>
        {/* Pulse ring for creator replies */}
        {hasCreatorReplies && (
          <span className="absolute inset-0 rounded-full animate-ping bg-amber-400/30" />
        )}
      </motion.button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[95] bg-black/40 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[100] max-h-[80vh] overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl shadow-black/20"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-black/10" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-black/5">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-black/40" />
                  <h2 className="text-sm font-black uppercase tracking-[0.1em] text-black/60">
                    What&apos;s happening
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDismissAll}
                    className="text-[9px] font-bold uppercase tracking-wider text-black/25 hover:text-black/50 transition-colors px-2 py-1"
                  >
                    Mark all read
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-black/30 hover:text-black/60 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Notification list */}
              <div className="px-4 py-4 space-y-3 pb-8">
                {/* 🌟 Priority 1: Creator Replies (Golden) */}
                {confessorNotifs?.creatorReplies?.map((notif) => (
                  <motion.div
                    key={`reply-${notif.confessionId}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative overflow-hidden rounded-2xl"
                  >
                    <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-amber-400/40 via-orange-400/30 to-rose-400/40" />
                    <div className="relative rounded-2xl bg-gradient-to-br from-[#fef9f0] to-[#fff5e6] p-5">
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

                      <div className="flex items-center gap-1.5 mb-3">
                        <Sparkles size={14} className="text-amber-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-700">
                          Board Owner Replied!
                        </span>
                      </div>

                      <p className="text-sm text-amber-950/80 serif italic leading-relaxed mb-2">
                        &ldquo;{notif.replyText}{notif.replyText.length >= 100 ? "..." : ""}&rdquo;
                      </p>

                      <p className="text-[10px] text-amber-600/50 mb-3">
                        On your confession: &ldquo;{notif.confessionText}...&rdquo;
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-amber-500/40 font-medium">
                          🫖 {notif.boardName} · {timeAgo(notif.replyCreatedAt)}
                        </span>
                        <Link
                          href={`/b/${notif.boardSlug}/c/${notif.confessionId}`}
                          onClick={handleDismissAll}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-500 text-white text-[9px] font-bold uppercase tracking-wider hover:bg-amber-600 transition-colors"
                        >
                          Read <ArrowRight size={10} />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* 🔥 Priority 2: Confession Stats */}
                {confessorNotifs?.stats?.map((notif) => (
                  <motion.div
                    key={`stats-${notif.confessionId}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-2xl border border-black/5 bg-black/[0.015] p-4"
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-sm">🔥</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-black/50">
                        Your confession is getting attention
                      </span>
                    </div>

                    <p className="text-[11px] text-black/40 mb-3 italic">
                      &ldquo;{notif.confessionText}...&rdquo;
                    </p>

                    <div className="flex items-center gap-4 mb-3">
                      {notif.views > 0 && (
                        <div className="flex items-center gap-1">
                          <Eye size={12} className="text-black/30" />
                          <span className="text-xs font-bold text-black/60">
                            {notif.views}
                          </span>
                          <span className="text-[9px] text-black/25">views</span>
                        </div>
                      )}
                      {notif.reactionCount > 0 && (
                        <div className="flex items-center gap-1">
                          <Heart size={12} className="text-rose-400" />
                          <span className="text-xs font-bold text-black/60">
                            {notif.reactionCount}
                          </span>
                          <span className="text-[9px] text-black/25">reactions</span>
                        </div>
                      )}
                      {notif.commentCount > 0 && (
                        <div className="flex items-center gap-1">
                          <MessageCircle size={12} className="text-blue-400" />
                          <span className="text-xs font-bold text-black/60">
                            {notif.commentCount}
                          </span>
                          <span className="text-[9px] text-black/25">comments</span>
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/b/${notif.boardSlug}/c/${notif.confessionId}`}
                      onClick={handleDismissAll}
                      className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-black/30 hover:text-black/60 transition-colors"
                    >
                      View Thread <ArrowRight size={10} />
                    </Link>
                  </motion.div>
                ))}

                {/* 🫖 Priority 3: Creator — New Confessions */}
                {creatorNotifs?.map((notif) => (
                  <motion.div
                    key={`creator-${notif.boardId}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-2xl border border-black/5 bg-black/[0.015] p-4"
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-sm">🫖</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-black/50">
                        {notif.newConfessionCount} new confession{notif.newConfessionCount !== 1 ? "s" : ""} on your board
                      </span>
                    </div>

                    <p className="text-[10px] text-black/30 mb-1 font-medium">
                      {notif.boardName}
                    </p>
                    <p className="text-[11px] text-black/40 mb-3 italic">
                      Latest: &ldquo;{notif.latestPreview}...&rdquo;
                    </p>

                    <Link
                      href={`/b/${notif.boardSlug}/inbox`}
                      onClick={handleDismissAll}
                      className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-black/30 hover:text-black/60 transition-colors"
                    >
                      Open Inbox <ArrowRight size={10} />
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
