"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getCreatorToken } from "@/app/lib/utils";
import { ArrowLeft, Save } from "lucide-react";

export default function BoardSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const board = useQuery(api.boards.getBySlug, { slug });
  const updateBoard = useMutation(api.boards.update);
  const creatorToken = typeof window !== "undefined" ? getCreatorToken() : "";

  const isOwner = !!board && board.creatorToken === creatorToken;

  const [prompt, setPrompt] = useState("");
  const [tagline, setTagline] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Initialize form with board data once loaded
  useEffect(() => {
    if (board && isOwner) {
      setPrompt(board.prompt || "");
      setTagline(board.tagline || "");
    }
  }, [board, isOwner]);

  const handleSave = async () => {
    if (!board || !isOwner) return;
    setIsSubmitting(true);
    setIsSaved(false);
    try {
      await updateBoard({
        boardId: board._id,
        creatorToken,
        prompt: prompt.trim() || undefined,
        tagline: tagline.trim() || undefined,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (board === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f5]">
        <div className="w-8 h-8 border-2 border-black/10 border-t-black/40 rounded-full animate-spin" />
      </div>
    );
  }

  if (board === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf8f5] text-center px-6">
        <h1 className="text-2xl font-black serif">Board not found</h1>
        <Link
          href="/"
          className="mt-5 px-6 py-3 rounded-xl bg-black text-white text-sm font-bold"
        >
          Go Home
        </Link>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf8f5] text-center px-6">
        <p className="text-5xl mb-3">🔒</p>
        <h1 className="text-2xl font-black serif">Restricted Area</h1>
        <p className="text-sm text-black/40 mt-1">
          Only the creator of "{board.name}" can view this page.
        </p>
        <Link
          href={`/b/${slug}`}
          className="mt-5 px-6 py-3 rounded-xl bg-black text-white text-sm font-bold"
        >
          Back to Board
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] text-black">
      <header className="sticky top-0 z-50 flex items-center px-4 sm:px-5 py-3 bg-[#faf8f5]/85 backdrop-blur-xl border-b border-black/5">
        <Link
          href={`/b/${slug}`}
          className="flex items-center gap-1.5 text-black/35 hover:text-black transition-colors w-16"
        >
          <ArrowLeft size={16} />
        </Link>
        <h1 className="flex-1 text-center text-[10px] font-black uppercase tracking-[0.25em] text-black/25">
          Board Settings
        </h1>
        <div className="w-16" />
      </header>

      <main className="max-w-lg mx-auto px-4 sm:px-5 py-8">
        <div className="mb-6 text-center">
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-accent mb-2">
            {board.name}
          </p>
          <h2 className="text-3xl font-black serif tracking-tight">Settings</h2>
        </div>

        <div className="bg-white rounded-2xl border border-black/5 p-6 shadow-xl shadow-black/[0.03] space-y-6">
          {/* Confession Prompt */}
          <div>
            <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-black/30 mb-2 block">
              Viewer Prompt (Optional)
            </label>
            <p className="text-[10px] text-black/40 mb-3 leading-relaxed">
              Give your visitors a direction! This will appear at the top of the
              confession box. e.g. "Rate me out of 10", "Tell me your favorite
              memory of us".
            </p>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Rate me out of 10 and be brutally honest 😈"
              className="w-full text-sm font-medium bg-[#faf8f5] border border-black/5 rounded-xl px-4 py-3 outline-none focus:border-black/15 focus:ring-2 focus:ring-black/5 transition-all placeholder:text-black/15"
            />
          </div>

          {/* Tagline */}
          <div>
            <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-black/30 mb-2 block">
              Tagline
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Tell me anything, stay anonymous..."
              className="w-full text-sm font-medium bg-[#faf8f5] border border-black/5 rounded-xl px-4 py-3 outline-none focus:border-black/15 focus:ring-2 focus:ring-black/5 transition-all placeholder:text-black/15 italic"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSubmitting}
          className="w-full mt-6 py-4 bg-black text-white rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-15 flex items-center justify-center gap-2 shadow-lg shadow-black/10"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : isSaved ? (
            <>Saved Successfully</>
          ) : (
            <>
              <Save size={14} />
              Save Settings
            </>
          )}
        </button>
      </main>
    </div>
  );
}
