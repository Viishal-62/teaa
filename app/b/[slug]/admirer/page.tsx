"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CATEGORY_INFO } from "@/app/lib/utils";
import EmojiPicker from "@/app/components/EmojiPicker";
import Link from "next/link";
import { ArrowLeft, Heart, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ADMIRER_CATEGORIES = [
  "crush",
  "compliment",
  "attraction",
  "gratitude",
  "admiration",
  "confession",
];

export default function AdmirerConfessPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const board = useQuery(api.boards.getBySlug, { slug });
  const createConfession = useMutation(api.confessions.create);

  const [recipient, setRecipient] = useState("");
  const [text, setText] = useState("");
  const [category, setCategory] = useState("crush");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const handleSubmit = async () => {
    if (!text.trim() || !category || !board || wordCount > 500) {
      return;
    }
    setIsSubmitting(true);
    try {
      // Store recipient in the text as a prefix
      const finalText = recipient.trim() 
        ? `To: ${recipient.trim()} — ${text.trim()}`
        : text.trim();

      await createConfession({
        boardId: board._id,
        text: finalText,
        category,
        isGlobal: true, // Admirer letters are always global by default for excitement
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Failed to submit admirer letter:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (board === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f5]">
        <div className="w-8 h-8 border-2 border-[#be185d]/10 border-t-[#be185d]/40 rounded-full animate-spin" />
      </div>
    );
  }

  if (board === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-[#faf8f5]">
        <span className="text-5xl mb-4">🫣</span>
        <h1 className="text-2xl font-bold mb-2 serif">Board not found</h1>
        <Link
          href="/"
          className="px-6 py-3 bg-black text-white rounded-xl text-sm font-medium mt-4"
        >
          Go Home
        </Link>
      </div>
    );
  }

  // ── Success screen ──
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 page-enter bg-[#fdf2f8]">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-sm w-full text-center"
        >
          <div className="bg-white rounded-3xl border border-pink-100 p-10 shadow-2xl shadow-pink-200/50 relative overflow-hidden">
            {/* Floating hearts background */}
            <motion.div 
              animate={{ y: [-20, -100], opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute top-1/2 left-1/4 text-pink-200"
            >
              <Heart fill="currentColor" size={20} />
            </motion.div>
            <motion.div 
              animate={{ y: [-10, -80], opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, delay: 0.5 }}
              className="absolute top-2/3 right-1/4 text-pink-200"
            >
              <Heart fill="currentColor" size={16} />
            </motion.div>

            <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner">
              💌
            </div>
            <h1 className="text-2xl font-black serif tracking-tight text-pink-900 mb-2">
              Letter Sent!
            </h1>
            <p className="text-sm text-pink-900/40 font-medium mb-8 leading-relaxed">
              Your secret admirer message has been sealed and delivered to the board.
            </p>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setText("");
                  setRecipient("");
                }}
                className="w-full py-4 bg-[#be185d] text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-pink-200 transition-all active:scale-95"
              >
                Send Another One
              </button>
              <Link
                href={`/b/${slug}`}
                className="w-full py-4 text-[11px] text-pink-900/30 font-bold uppercase tracking-widest hover:text-pink-900 transition-colors block"
              >
                Back to the Board
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-enter bg-[#fdf2f8] text-pink-950 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center px-5 py-4 bg-white/70 backdrop-blur-xl border-b border-pink-100">
        <Link
          href={`/b/${slug}`}
          className="p-2 -ml-2 text-pink-900/30 hover:text-pink-900 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <span className="flex-1 text-center text-[10px] font-black uppercase tracking-[0.3em] text-pink-900/20">
          Secret Admirer
        </span>
        <div className="w-8" />
      </header>

      <main className="max-w-lg mx-auto px-6 py-10">
        {/* Intro */}
        <div className="text-center mb-10">
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }} 
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-4xl mb-4 inline-block"
          >
            💝
          </motion.div>
          <h1 className="text-2xl font-black serif tracking-tight text-pink-900 mb-2">
            Send a Love Letter
          </h1>
          <p className="text-[12px] text-pink-900/40 font-medium tracking-wide">
            Pour your heart out. They&apos;ll never know it was you.
          </p>
        </div>

        {/* Paper-style form */}
        <div className="bg-white rounded-[2rem] border border-pink-100 shadow-2xl shadow-pink-200/40 overflow-hidden relative">
          {/* Paper texture */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
          
          <div className="p-8 space-y-8 relative z-10">
            {/* Recipient Input */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-pink-900/30 mb-3 block">
                To: (Optional)
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Name or @handle"
                className="w-full bg-pink-50/50 border-b-2 border-pink-100 px-0 py-3 outline-none text-lg font-bold serif italic text-pink-900 placeholder:text-pink-200 focus:border-[#be185d] transition-all"
              />
            </div>

            {/* Message Area */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-pink-900/30 mb-3 block">
                Your Letter
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write your secret compliment or crush confession here..."
                rows={6}
                className="w-full bg-transparent resize-none outline-none text-base leading-relaxed placeholder:text-pink-200 serif italic text-pink-900/80"
              />
              <div className="flex justify-end mt-2">
                <span className={`text-[10px] font-mono ${wordCount > 500 ? "text-red-500 font-bold" : "text-pink-200"}`}>
                  {500 - wordCount} words remaining
                </span>
              </div>
            </div>

            {/* Category Picker */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-pink-900/30 mb-4 block">
                Message Type
              </label>
              <div className="flex flex-wrap gap-2">
                {ADMIRER_CATEGORIES.map((cat) => {
                  const info = CATEGORY_INFO[cat];
                  const active = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-4 py-2 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all ${
                        active 
                          ? "bg-[#be185d] text-white shadow-md shadow-pink-100" 
                          : "bg-pink-50 text-pink-400 hover:bg-pink-100 hover:text-pink-600"
                      }`}
                    >
                      {info?.emoji} {info?.label || cat}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={!text.trim() || isSubmitting || wordCount > 500}
          className="w-full mt-8 py-5 bg-[#be185d] text-white rounded-2xl text-[12px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-pink-200 flex items-center justify-center gap-3 transition-all disabled:opacity-30"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Send size={16} />
              Seal & Send Letter
            </>
          )}
        </motion.button>

        <div className="mt-8 flex items-center gap-3 justify-center text-pink-900/20">
          <div className="h-px w-8 bg-current" />
          <Heart size={14} fill="currentColor" />
          <div className="h-px w-8 bg-current" />
        </div>
      </main>
    </div>
  );
}
