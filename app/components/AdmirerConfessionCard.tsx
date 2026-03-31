"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CATEGORY_INFO, REACTION_INFO, getVisitorId, timeAgo } from "@/app/lib/utils";
import Link from "next/link";
import { Eye, Heart, MessageCircle, Share2, Check } from "lucide-react";
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
  const visitorId = getVisitorId();
  
  const incrementView = useMutation(api.confessions.incrementView);
  const totalReactions = useQuery(api.reactions.getTotalCount, { 
    confessionId: confession._id 
  });
  const reactionCounts = useQuery(api.reactions.getCounts, {
    confessionId: confession._id,
  });
  const commentCount = useQuery(api.comments.countByConfession, { 
    confessionId: confession._id 
  });

  const handleOpen = () => {
    if (!isOpen) {
      setIsOpen(true);
      if (!hasViewed) {
        incrementView({ confessionId: confession._id }).catch(() => {});
        setHasViewed(true);
      }
    } else {
      setIsOpen(false);
    }
  };

  const activeReactions = boardReactions && boardReactions.length > 0 
    ? boardReactions 
    : ["blushing", "butterflies", "crying-admirer", "giggling"];

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/b/${boardSlug}/c/${confession._id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Extract "To:" prefix if it exists — using [\s\S] instead of /s flag for compat
  const textMatch = confession.text.match(/^To:\s*([^—\-\–.]+)\s*[—\-\–]\s*([\s\S]*)/);
  const recipient = textMatch ? textMatch[1].trim() : null;
  const letterBody = textMatch ? textMatch[2].trim() : confession.text;

  return (
    <div className="w-full max-w-[340px] mx-auto perspective-[1200px]">
      <motion.div
        layout
        className="relative cursor-pointer"
        onClick={handleOpen}
      >
        {/* ENVELOPE BACK / BASE */}
        <div className="relative w-full aspect-[4/3] bg-[#f8f1e9] rounded-xl shadow-lg border border-[#e8dfd5] overflow-hidden">
          {/* Paper texture overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
          
          {/* Recipient area on front of envelope */}
          <AnimatePresence>
            {!isOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
              >
                <motion.div 
                  className="mb-3 text-[#d97706]/40"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                >
                  <Heart size={32} fill="currentColor" strokeWidth={0} />
                </motion.div>
                
                {recipient ? (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#d97706]/50 mb-1">
                      For
                    </p>
                    <h3 className="text-xl font-black serif text-[#78350f] italic">
                      {recipient}
                    </h3>
                  </>
                ) : (
                  <h3 className="text-lg font-black serif text-[#78350f] italic">
                    A Secret Message
                  </h3>
                )}
                
                <p className="mt-4 text-[9px] font-bold uppercase tracking-widest text-[#d97706]/30">
                  Tap to unseal
                </p>
                
                {/* Wax Seal */}
                <motion.div 
                  className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-[#991b1b] shadow-md border-4 border-[#7f1d1d] flex items-center justify-center z-10"
                  whileHover={{ scale: 1.1 }}
                >
                  <div className="text-white text-xs font-bold serif">T</div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* THE LETTER (Hidden inside, slides up) */}
          <motion.div
            initial={false}
            animate={{ 
              y: isOpen ? "-50%" : "100%",
              opacity: isOpen ? 1 : 0
            }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="absolute top-1/2 left-4 right-4 bg-white rounded-lg shadow-2xl p-6 min-h-[280px] z-20 border border-black/[0.03]"
          >
            {/* Handwriting style letter content */}
            <div className="serif italic text-[#3f3f46] leading-relaxed mb-6">
              {recipient && (
                <p className="text-sm font-bold text-[#be185d] mb-4">
                  Dear {recipient},
                </p>
              )}
              <p className="text-base font-medium whitespace-pre-wrap">
                {letterBody}
              </p>
              <div className="mt-8">
                <p className="text-[10px] font-bold uppercase tracking-widest text-black/20 not-italic mb-1">
                  From
                </p>
                <p className="text-sm font-black text-[#be185d]">
                  Your Secret Admirer
                </p>
              </div>
            </div>

            {/* Reactions & Footer inside letter */}
            <div className="mt-auto pt-6 border-t border-black/[0.04]">
              <CardActions 
                confession={confession}
                boardSlug={boardSlug}
                totalReactions={totalReactions}
                reactionCounts={reactionCounts}
              />
              
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3 text-[9px] font-bold text-black/20 uppercase tracking-widest">
                  <span className="flex items-center gap-1">
                    <Eye size={10} /> {confession.views || 0}
                  </span>
                  <Link 
                    href={`/b/${boardSlug}/c/${confession._id}`}
                    className="flex items-center gap-1 hover:text-black transition-colors"
                  >
                    <MessageCircle size={10} /> {commentCount || 0}
                  </Link>
                </div>
                
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1 text-[9px] font-bold text-[#be185d]/60 hover:text-[#be185d] uppercase tracking-widest transition-all"
                >
                  {copied ? <Check size={10} /> : <Share2 size={10} />}
                  {copied ? "Copied" : "Share"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ENVELOPE FLAP (Top) */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-1/2 bg-[#fdfaf6] origin-top z-30"
          initial={false}
          animate={{ 
            rotateX: isOpen ? -160 : 0,
            zIndex: isOpen ? 10 : 30
          }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          style={{
            clipPath: "polygon(0 0, 100% 0, 50% 100%)",
            boxShadow: "inset 0 -2px 10px rgba(0,0,0,0.05)"
          }}
        />
        
        {/* ENVELOPE BOTTOM FLAPS (Shadow only) */}
        {!isOpen && (
          <div 
            className="absolute bottom-0 left-0 right-0 h-full z-20 pointer-events-none"
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.02) 0%, transparent 100%)",
              clipPath: "polygon(0 100%, 100% 100%, 50% 50%)"
            }}
          />
        )}
      </motion.div>

      {/* Timestamp & Category outside card */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex items-center justify-between px-2"
          >
            <div className="flex items-center gap-2">
              <span 
                className="w-2 h-2 rounded-full"
                style={{ background: catInfo.color }}
              />
              <span className="text-[10px] font-black uppercase tracking-widest text-black/30">
                {catInfo.label}
              </span>
            </div>
            <span className="text-[9px] font-medium text-black/15">
              {timeAgo(confession.createdAt)}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
