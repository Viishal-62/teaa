"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  CATEGORY_INFO,
  REACTION_INFO,
  timeAgo,
  getVisitorId,
  getCreatorToken,
  parseConvexError,
} from "@/app/lib/utils";
import EmojiPicker from "@/app/components/EmojiPicker";
import GifPicker from "@/app/components/GifPicker";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import CreatorReplyCard from "@/app/components/CreatorReplyCard";
import Link from "next/link";
import {
  ArrowLeft,
  MessageCircle,
  Send,
  X,
  Timer,
  Sparkles,
  Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import RateLimitModal from "@/app/components/RateLimitModal";

function CommentItem({
  comment,
}: {
  comment: {
    _id: string;
    text: string;
    gifUrl?: string;
    displayName: string;
    createdAt: number;
  };
}) {
  return (
    <div className="p-4 rounded-xl border bg-black/[0.01] border-black/5">
      {comment.gifUrl && (
        <div className="mb-2 rounded-lg overflow-hidden">
          <img
            src={comment.gifUrl}
            alt="GIF reply"
            className="w-full max-h-48 object-contain bg-black/[0.02] rounded-lg"
            loading="lazy"
          />
        </div>
      )}
      {comment.text && (
        <p className="text-sm leading-relaxed mb-2 text-black/70">
          {comment.text}
        </p>
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs text-black/30">— {comment.displayName}</span>
        <span className="text-xs text-black/20">
          {timeAgo(comment.createdAt)}
        </span>
      </div>
    </div>
  );
}

export default function ConfessionDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const confessionId = params.confessionId as Id<"confessions">;
  const router = useRouter();

  const [commentText, setCommentText] = useState("");
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDisappearing, setIsDisappearing] = useState(false);
  const [displayedConfession, setDisplayedConfession] = useState<any>(null);
  const [showRateLimit, setShowRateLimit] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Creator Reply state
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [showReplyInput, setShowReplyInput] = useState(false);

  const board = useQuery(api.boards.getBySlug, { slug });
  const confession = useQuery(api.confessions.getById, { confessionId });
  const comments = useQuery(api.comments.listByConfession, { confessionId });
  const commentCount = useQuery(api.comments.countByConfession, {
    confessionId,
  });
  const creatorReply = useQuery(api.creatorReplies.getByConfession, {
    confessionId,
  });
  const addComment = useMutation(api.comments.create);
  const incrementView = useMutation(api.confessions.incrementView);
  const toggleReaction = useMutation(api.reactions.toggle);
  const submitCreatorReply = useMutation(api.creatorReplies.reply);
  const editCreatorReply = useMutation(api.creatorReplies.edit);
  const removeCreatorReply = useMutation(api.creatorReplies.remove);

  // Check if current user is the board creator
  const creatorToken = typeof window !== "undefined" ? getCreatorToken() : "";
  const isOwner = !!board && board.creatorToken === creatorToken;

  // Helper to handle Convex errors
  const handleConvexError = (error: any) => {
    const parsedErr = parseConvexError(error);
    if (parsedErr?.type === "rate_limit_error") {
      setRateLimitMessage(parsedErr.message);
      setShowRateLimit(true);
      return true;
    }
    return false;
  };

  // Fetch reactions state globally for the confession
  const visitorId = typeof window !== "undefined" ? getVisitorId() : null;
  const countsArray = useQuery(api.reactions.getCounts, { confessionId });
  const counts = countsArray
    ? Object.fromEntries(countsArray.map((r) => [r.type, r.count]))
    : undefined;
  const myReactions = useQuery(
    api.reactions.getVisitorReactions,
    visitorId ? { confessionId, visitorId } : "skip",
  );

  const activeReactions = Array.from(
    new Set([
      ...(board?.allowedReactions && board.allowedReactions.length > 0
        ? board.allowedReactions
        : ["❤️", "🔥", "😂"]),
      ...(counts ? Object.keys(counts) : []),
    ]),
  ).slice(0, 10);

  // Internal Reaction Button component
  const LocalReactionButton = ({ type }: { type: string }) => {
    const emoji = REACTION_INFO[type]?.emoji || type;
    const count = counts?.[type] ?? 0;
    const isActive = myReactions?.includes(type) ?? false;

    const handleClick = async () => {
      if (!visitorId) return;
      try {
        await toggleReaction({ confessionId, type, visitorId });
      } catch (error) {
        if (!handleConvexError(error)) {
          console.error("Reaction failed:", error);
        }
      }
    };

    return (
      <button
        type="button"
        onClick={handleClick}
        className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl transition-all active:scale-90 min-w-[72px] border ${
          isActive
            ? "bg-black/5 border-black/15"
            : "bg-black/[0.02] border-black/5 hover:bg-black/[0.04]"
        }`}
      >
        <span className="text-xl">{emoji}</span>
        <span
          className={`text-lg font-bold tabular-nums ${isActive ? "text-black" : "text-black/70"}`}
        >
          {count}
        </span>
      </button>
    );
  };

  // Store confession when loaded, auto-increment views
  useEffect(() => {
    if (confession && !displayedConfession) {
      setDisplayedConfession(confession);
      // Auto-increment view
      incrementView({ confessionId })
        .then((result) => {
          if (result.deleted) {
            // Max views reached - trigger disappear animation
            setIsDisappearing(true);
            const timer = setTimeout(() => {
              router.push(`/b/${slug}`);
            }, 1200);
            return () => clearTimeout(timer);
          }
        })
        .catch(console.error);
    }
  }, [
    confession,
    displayedConfession,
    confessionId,
    incrementView,
    slug,
    router,
  ]);

  const handleAddComment = async () => {
    if (!commentText.trim() && !selectedGif) return;
    setIsSubmitting(true);
    try {
      const visitorId = getVisitorId();
      await addComment({
        confessionId,
        text: commentText.trim(),
        gifUrl: selectedGif ?? undefined,
        visitorId,
      });
      setCommentText("");
      setSelectedGif(null);
    } catch (error: any) {
      if (!handleConvexError(error)) {
        console.error("Failed to add comment:", error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Creator Reply handlers
  const handleSubmitReply = async () => {
    if (!replyText.trim() || !creatorToken) return;
    setIsSubmittingReply(true);
    setReplyError("");
    try {
      await submitCreatorReply({
        confessionId,
        text: replyText.trim(),
        creatorToken,
      });
      setReplyText("");
      setShowReplyInput(false);
    } catch (error: any) {
      const parsed = parseConvexError(error);
      if (parsed?.type === "moderation_error") {
        setReplyError(parsed.message);
      } else {
        setReplyError(error?.message || "Failed to reply");
      }
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleEditReply = async (replyId: string, newText: string) => {
    try {
      await editCreatorReply({
        replyId: replyId as Id<"creatorReplies">,
        text: newText,
        creatorToken,
      });
    } catch (error) {
      console.error("Failed to edit reply:", error);
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    try {
      await removeCreatorReply({
        replyId: replyId as Id<"creatorReplies">,
        creatorToken,
      });
    } catch (error) {
      console.error("Failed to delete reply:", error);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    if (commentText.length + emoji.length <= 300) {
      setCommentText((prev) => prev + emoji);
    }
  };

  if (board === undefined || confession === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-black/10 border-t-black/40 rounded-full animate-spin" />
      </div>
    );
  }

  if (board === null || (displayedConfession === null && !isDisappearing)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-white">
        <span className="text-5xl mb-4">🫣</span>
        <h1 className="text-2xl font-bold mb-2 serif">Not found</h1>
        <p className="text-black/40 mb-6 text-sm">
          This confession doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="px-6 py-3 bg-black text-white rounded-xl text-sm font-medium"
        >
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-enter bg-white text-[#111]">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-5 py-3 bg-white/85 backdrop-blur-xl border-b border-black/5">
        <Link
          href={`/b/${slug}`}
          className="flex items-center gap-1.5 text-sm text-black/35 hover:text-black transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </Link>
      </header>

      <main className="max-w-xl mx-auto px-5 py-8">
        {/* Confession Card */}
        <motion.div
          initial={{ opacity: 1 }}
          animate={
            isDisappearing
              ? { opacity: 0, filter: "blur(12px)", scale: 0.95 }
              : { opacity: 1, filter: "blur(0px)", scale: 1 }
          }
          transition={{ duration: 1, ease: "easeInOut" }}
          className="p-8 rounded-2xl border border-black/5 bg-[#faf8f5] mb-8"
        >
          {(confession || displayedConfession) && (
            <>
              {/* Category */}
              {(() => {
                const confData = confession || displayedConfession;
                const catInfo = CATEGORY_INFO[confData?.category];
                return catInfo ? (
                  <div className="flex items-center gap-2 mb-5">
                    <span
                      className="text-[10px] px-3 py-1.5 rounded-full font-bold uppercase tracking-wider"
                      style={{
                        background: `${catInfo.color}10`,
                        color: catInfo.color,
                      }}
                    >
                      {catInfo.emoji} {catInfo.label}
                    </span>
                  </div>
                ) : null;
              })()}

              {/* Text */}
              <p className="text-lg leading-relaxed mb-6 serif text-black/80">
                {(confession || displayedConfession)?.text}
              </p>

              {/* Meta */}
              <div className="flex items-center justify-between mb-6 pt-5 border-t border-black/5">
                <span className="text-xs text-black/35 italic">
                  — {(confession || displayedConfession)?.displayName}
                </span>
                <span className="text-xs text-black/20">
                  {timeAgo((confession || displayedConfession)?.createdAt || 0)}
                </span>
              </div>

              {/* Only show reactions if confession still exists */}
              {confession && (
                <div className="flex gap-2.5 justify-center flex-wrap">
                  {activeReactions.map((type: string) => (
                    <LocalReactionButton key={type} type={type} />
                  ))}
                  {/* Add Reaction Button */}
                  {activeReactions.length < 10 && (
                    <div className="relative flex">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowEmojiPicker(!showEmojiPicker);
                        }}
                        className="flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-xl transition-all active:scale-90 min-w-[72px] border bg-black/[0.02] border-black/5 hover:bg-black/[0.04] text-black/40 hover:text-black"
                      >
                        <span className="text-xl">+</span>
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
                            className="absolute top-full left-0 mt-2 z-[100] shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Picker
                              data={data}
                              theme="light"
                              previewPosition="none"
                              onEmojiSelect={async (e: any) => {
                                const emoji = e.native;
                                if (visitorId) {
                                  try {
                                    await toggleReaction({
                                      confessionId,
                                      type: emoji,
                                      visitorId,
                                    });
                                  } catch (err) {
                                    handleConvexError(err);
                                  }
                                }
                                setShowEmojiPicker(false);
                              }}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </motion.div>

        {!isDisappearing && (
          <>
            {/* ═══════════════ CREATOR REPLY SECTION ═══════════════ */}

            {/* Show existing creator reply */}
            {creatorReply && (
              <div className="mb-6">
                <CreatorReplyCard
                  reply={creatorReply}
                  boardName={board?.name}
                  isOwner={isOwner}
                  onEdit={handleEditReply}
                  onDelete={handleDeleteReply}
                />
              </div>
            )}

            {/* Reply as Board Owner button + input (only for creator, only if no reply yet) */}
            {isOwner && !creatorReply && (
              <div className="mb-6">
                {!showReplyInput ? (
                  <motion.button
                    type="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setShowReplyInput(true)}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-amber-300/40 bg-amber-50/50 text-amber-700/70 text-[10px] font-black uppercase tracking-[0.2em] hover:border-amber-400/60 hover:bg-amber-50 transition-all"
                  >
                    <Sparkles size={14} /> Reply as Board Owner
                  </motion.button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-amber-200/60 bg-[#fef9f0] p-5 space-y-3"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-300/40">
                        <Shield size={10} className="text-amber-600" />
                        <span className="text-[9px] font-black uppercase tracking-[0.15em] text-amber-700">
                          Replying as Board Owner
                        </span>
                      </div>
                    </div>

                    <textarea
                      value={replyText}
                      onChange={(e) =>
                        setReplyText(e.target.value.slice(0, 500))
                      }
                      placeholder="Your verified reply to this confession..."
                      rows={3}
                      autoFocus
                      className="w-full bg-white rounded-xl border border-amber-200/50 px-4 py-3 text-sm outline-none focus:border-amber-400 resize-none placeholder:text-amber-300/50"
                    />

                    {replyError && (
                      <p className="text-[10px] text-red-500 font-medium">
                        {replyError}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-amber-400/60 font-mono">
                        {replyText.length}/500
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowReplyInput(false);
                            setReplyText("");
                            setReplyError("");
                          }}
                          className="px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider text-black/30 hover:text-black/60 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSubmitReply}
                          disabled={!replyText.trim() || isSubmittingReply}
                          className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black uppercase tracking-wider disabled:opacity-30 hover:opacity-90 transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                        >
                          {isSubmittingReply ? (
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Sparkles size={10} />
                          )}
                          Post Reply
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* ═══════════════ COMMENTS SECTION ═══════════════ */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-5">
                <MessageCircle size={16} className="text-black/30" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-black/30">
                  Responses {commentCount ? `(${commentCount})` : ""}
                </h2>
              </div>

              {/* Comment Input */}
              <div className="rounded-2xl border border-black/8 bg-black/[0.01] mb-5 transition-all focus-within:border-black/15">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value.slice(0, 300))}
                  placeholder="Say something..."
                  rows={2}
                  className="w-full px-5 py-4 bg-transparent resize-none outline-none text-sm leading-relaxed text-black placeholder-black/20"
                />
                {/* GIF preview */}
                {selectedGif && (
                  <div className="px-5 pb-2">
                    <div className="relative inline-block">
                      <img
                        src={selectedGif}
                        alt="Selected GIF"
                        className="h-24 rounded-lg object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setSelectedGif(null)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between px-5 pb-3">
                  <div className="flex items-center gap-1.5">
                    <div className="relative">
                      <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                    </div>
                    <GifPicker onGifSelect={(url) => setSelectedGif(url)} />
                    <span className="text-[10px] font-mono text-black/20 ml-1">
                      {commentText.length}/300
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddComment}
                    disabled={
                      (!commentText.trim() && !selectedGif) || isSubmitting
                    }
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-black text-white transition-all active:scale-95 disabled:opacity-30 hover:opacity-90"
                  >
                    {isSubmitting ? (
                      <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send size={12} />
                    )}
                    Reply
                  </button>
                </div>
              </div>

              {/* Comments List */}
              <div className="grid gap-2.5">
                {comments === undefined ? (
                  <div className="flex justify-center py-8">
                    <div className="w-5 h-5 border-2 border-black/10 border-t-black/40 rounded-full animate-spin" />
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-center py-8 text-black/25">
                    No responses yet. Be the first to say something.
                  </p>
                ) : (
                  comments.map((comment: any) => (
                    <CommentItem key={comment._id} comment={comment} />
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </main>

      <RateLimitModal
        isOpen={showRateLimit}
        onClose={() => setShowRateLimit(false)}
        message={rateLimitMessage}
      />
    </div>
  );
}
