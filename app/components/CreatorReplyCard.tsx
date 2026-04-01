"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Sparkles, Edit3, Trash2, Check, X } from "lucide-react";
import { timeAgo } from "@/app/lib/utils";

interface CreatorReplyCardProps {
  reply: {
    _id: string;
    text: string;
    createdAt: number;
  };
  boardName?: string;
  isOwner?: boolean;
  onEdit?: (replyId: string, newText: string) => void;
  onDelete?: (replyId: string) => void;
}

export default function CreatorReplyCard({
  reply,
  boardName,
  isOwner,
  onEdit,
  onDelete,
}: CreatorReplyCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(reply.text);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveEdit = () => {
    if (!editText.trim() || !onEdit) return;
    onEdit(reply._id, editText.trim());
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!onDelete) return;
    onDelete(reply._id);
    setIsDeleting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl"
    >
      {/* Outer glow */}
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-amber-400/30 via-orange-400/20 to-rose-400/30" />

      {/* Inner card */}
      <div className="relative rounded-2xl bg-[#fef9f0] border border-amber-200/60 p-5">
        {/* Shimmer line at top */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-300/40">
              <Sparkles size={10} className="text-amber-600" />
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-amber-700">
                Board Owner
              </span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10">
              <Shield size={8} className="text-amber-600" />
              <span className="text-[8px] font-bold uppercase tracking-wider text-amber-600/80">
                Verified
              </span>
            </div>
          </div>

          {/* Owner actions */}
          {isOwner && !isEditing && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setEditText(reply.text);
                  setIsEditing(true);
                }}
                className="p-1.5 rounded-lg text-amber-400/60 hover:text-amber-600 hover:bg-amber-100/50 transition-all"
              >
                <Edit3 size={12} />
              </button>
              <button
                type="button"
                onClick={() => setIsDeleting(true)}
                className="p-1.5 rounded-lg text-amber-400/60 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Reply text or edit form */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value.slice(0, 500))}
              className="w-full min-h-[60px] rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400 resize-none"
              rows={3}
            />
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-amber-400/60 font-mono">
                {editText.length}/500
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider text-black/30 hover:text-black/60 transition-colors"
                >
                  <X size={12} />
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={!editText.trim()}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 text-white text-[9px] font-bold uppercase tracking-wider disabled:opacity-30 hover:bg-amber-600 transition-colors flex items-center gap-1"
                >
                  <Check size={10} /> Save
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-amber-950/80 serif italic">
            &ldquo;{reply.text}&rdquo;
          </p>
        )}

        {/* Delete confirmation */}
        {isDeleting && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3 pt-3 border-t border-amber-200/50 flex items-center justify-between"
          >
            <span className="text-[10px] text-red-500/70 font-medium">
              Delete this reply?
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsDeleting(false)}
                className="px-3 py-1 rounded-lg text-[9px] font-bold text-black/30 hover:text-black/60 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-1 rounded-lg bg-red-500 text-white text-[9px] font-bold hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        {!isEditing && !isDeleting && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-amber-200/40">
            <span className="text-[9px] text-amber-600/50 font-medium">
              {boardName ? `🫖 ${boardName}` : "🫖 Board Owner"}
            </span>
            <span className="text-[9px] text-amber-600/40">
              {timeAgo(reply.createdAt)}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
