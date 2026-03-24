"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  CATEGORY_INFO,
  REACTION_INFO,
  timeAgo,
  getVisitorId,
} from "@/app/lib/utils";
import EmojiPicker from "@/app/components/EmojiPicker";
import GifPicker from "@/app/components/GifPicker";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Send, X } from "lucide-react";

function ReactionButton({
  type,
  confessionId,
}: {
  type: string;
  confessionId: Id<"confessions">;
}) {
  const info = REACTION_INFO[type];
  const visitorId = typeof window !== "undefined" ? getVisitorId() : "";
  const counts = useQuery(api.reactions.getCounts, { confessionId });
  const myReactions = useQuery(
    api.reactions.getVisitorReactions,
    visitorId ? { confessionId, visitorId } : "skip",
  );
  const toggleReaction = useMutation(api.reactions.toggle);

  const count = counts?.[type] ?? 0;
  const isActive = myReactions?.includes(type) ?? false;

  const handleClick = async () => {
    if (!visitorId) return;
    await toggleReaction({ confessionId, type, visitorId });
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
      <span className="text-xl">{info?.emoji ?? "❓"}</span>
      <span
        className={`text-lg font-bold tabular-nums ${isActive ? "text-black" : "text-black/70"}`}
      >
        {count}
      </span>
      <span className="text-[10px] text-black/40">{info?.label ?? type}</span>
    </button>
  );
}

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

  const [commentText, setCommentText] = useState("");
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const board = useQuery(api.boards.getBySlug, { slug });
  const confession = useQuery(api.confessions.getById, { confessionId });
  const comments = useQuery(api.comments.listByConfession, { confessionId });
  const commentCount = useQuery(api.comments.countByConfession, {
    confessionId,
  });
  const addComment = useMutation(api.comments.create);

  const handleAddComment = async () => {
    if (!commentText.trim() && !selectedGif) return;
    setIsSubmitting(true);
    try {
      await addComment({
        confessionId,
        text: commentText.trim(),
        gifUrl: selectedGif ?? undefined,
      });
      setCommentText("");
      setSelectedGif(null);
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setIsSubmitting(false);
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

  if (board === null || confession === null) {
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

  const catInfo = CATEGORY_INFO[confession.category];

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
        <div className="p-8 rounded-2xl border border-black/5 bg-[#faf8f5] mb-8">
          {/* Category */}
          {catInfo && (
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
          )}

          {/* Text */}
          <p className="text-lg leading-relaxed mb-6 serif text-black/80">
            {confession.text}
          </p>

          {/* Meta */}
          <div className="flex items-center justify-between mb-6 pt-5 border-t border-black/5">
            <span className="text-xs text-black/35 italic">
              — {confession.displayName}
            </span>
            <span className="text-xs text-black/20">
              {timeAgo(confession.createdAt)}
            </span>
          </div>

          {/* Reactions */}
          <div className="flex gap-2.5 justify-center flex-wrap">
            {Object.keys(REACTION_INFO).map((type) => (
              <ReactionButton
                key={type}
                type={type}
                confessionId={confession._id}
              />
            ))}
          </div>
        </div>

        {/* Comments Section */}
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
                disabled={(!commentText.trim() && !selectedGif) || isSubmitting}
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
              comments.map((comment) => (
                <CommentItem key={comment._id} comment={comment} />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
