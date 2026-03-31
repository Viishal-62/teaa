"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CATEGORY_INFO } from "@/app/lib/utils";
import EmojiPicker from "@/app/components/EmojiPicker";
import { VoiceConfessModal } from "@/app/components/VoiceConfessModal";
import Link from "next/link";
import { ArrowLeft, BookOpen, ChevronDown, Mic, Type } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

const CATEGORIES = [
  "regret",
  "love",
  "guilt",
  "relief",
  "longing",
  "mischief",
  "obsession",
  "pride",
  "fear",
  "envy",
  "deep-dark",
];

export default function GlobalConfessPage() {
  const router = useRouter();
  const publicBoards = useQuery(api.boards.listPublic);
  const createConfession = useMutation(api.confessions.create);
  const getOrCreateGlobal = useMutation(api.boards.getOrCreateGlobal);

  const [text, setText] = useState("");
  const [category, setCategory] = useState("");
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showBoardPicker, setShowBoardPicker] = useState(false);
  const [confessType, setConfessType] = useState<"text" | "voice">("text");
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [isGlobal, setIsGlobal] = useState(true);
  const [disappearMode, setDisappearMode] = useState<
    | "never"
    | "5m"
    | "24h"
    | "7d"
    | "views25"
    | "custom-time"
    | "custom-views"
  >("never");
  const [customExpireAt, setCustomExpireAt] = useState("");
  const [customViews, setCustomViews] = useState("");
  const [globalBoardId, setGlobalBoardId] = useState<Id<"boards"> | null>(null);

  // Get global board ID on mount
  useEffect(() => {
    (async () => {
      const id = await getOrCreateGlobal();
      setGlobalBoardId(id);
    })();
  }, [getOrCreateGlobal]);

  const selectedBoard = publicBoards?.find((b) => b._id === selectedBoardId);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const parsedCustomExpireAt = customExpireAt
    ? new Date(customExpireAt).getTime()
    : NaN;
  const parsedCustomViews = Number.parseInt(customViews, 10);
  const isCustomTimeInvalid =
    disappearMode === "custom-time" &&
    (!Number.isFinite(parsedCustomExpireAt) ||
      parsedCustomExpireAt <= Date.now() + 1000);
  const isCustomViewsInvalid =
    disappearMode === "custom-views" &&
    (!Number.isInteger(parsedCustomViews) ||
      parsedCustomViews < 1 ||
      parsedCustomViews > 10000);

  const handleSubmit = async () => {
    if (
      !text.trim() ||
      !category ||
      wordCount > 500 ||
      isCustomTimeInvalid ||
      isCustomViewsInvalid
    ) {
      return;
    }
    setIsSubmitting(true);
    try {
      // If no board picked, use the global board
      let boardId = selectedBoardId as Id<"boards">;
      if (!selectedBoardId) {
        boardId = await getOrCreateGlobal();
      }

      await createConfession({
        boardId,
        text: text.trim(),
        category,
        isGlobal: selectedBoardId ? isGlobal : true,
        expiresAt:
          disappearMode === "5m"
            ? Date.now() + 5 * 60 * 1000
            : disappearMode === "24h"
              ? Date.now() + 24 * 60 * 60 * 1000
              : disappearMode === "7d"
                ? Date.now() + 7 * 24 * 60 * 60 * 1000
                : disappearMode === "custom-time"
                  ? parsedCustomExpireAt
                  : undefined,
        maxViews:
          disappearMode === "views25"
            ? 25
            : disappearMode === "custom-views"
              ? parsedCustomViews
              : undefined,
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Failed to submit confession:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const currentWords = text.trim() ? text.trim().split(/\s+/).length : 0;
    if (currentWords <= 500) {
      setText((prev) => prev + emoji);
    }
  };

  const successMessages: Record<string, { emoji: string; line: string }> = {
    love: { emoji: "💗", line: "Brave of you." },
    regret: { emoji: "🌊", line: "Let it wash away." },
    guilt: { emoji: "⚖️", line: "Weight lifted." },
    mischief: { emoji: "😈", line: "Noted. Quietly." },
    "deep-dark": { emoji: "🕳️", line: "Swallowed whole." },
    default: { emoji: "✨", line: "It's out there now." },
  };

  const success = successMessages[category] || successMessages.default;

  // ── Success ──
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-5 page-enter bg-[#faf8f5]">
        <div className="max-w-sm w-full text-center">
          <div className="bg-white rounded-2xl border border-black/5 p-8 shadow-xl shadow-black/[0.03]">
            <span className="text-5xl block mb-4">{success.emoji}</span>
            <h1 className="text-xl font-black serif tracking-tight text-black mb-1">
              {success.line}
            </h1>
            <p className="text-xs text-black/35 font-medium mb-7">
              Your truth lives in the library of secrets.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setText("");
                  setCategory("");
                  setSelectedBoardId("");
                  setSubmitted(false);
                }}
                className="w-full py-3.5 bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95"
              >
                Drop Another One
              </button>
              <Link
                href="/spill/create"
                className="w-full py-3.5 bg-rose-50 text-rose-900 border border-rose-200/60 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
              >
                <BookOpen size={12} />
                Write Long Gossip
              </Link>
              <Link
                href="/explore"
                className="w-full py-3.5 text-[10px] text-black/30 font-bold uppercase tracking-widest hover:text-black transition-colors block"
              >
                Explore Feed
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ──
  return (
    <div className="min-h-screen page-enter bg-[#faf8f5] text-black">
      <header className="sticky top-0 z-50 flex items-center px-4 sm:px-5 py-3 bg-[#faf8f5]/85 backdrop-blur-xl border-b border-black/5">
        <Link
          href="/explore"
          className="flex items-center gap-1.5 text-black/30 hover:text-black transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <span className="flex-1 text-center text-[10px] font-black uppercase tracking-[0.25em] text-black/20">
          Confess
        </span>
        <div className="w-4" />
      </header>

      <main className="max-w-lg mx-auto px-4 sm:px-5 py-6 sm:py-8">
        {/* Intro */}
        <div className="text-center mb-8">
          <span className="text-3xl block mb-3">🫖</span>
          <h1 className="text-xl font-black serif tracking-tight text-black mb-1">
            Got something to say?
          </h1>
          <p className="text-[11px] text-black/30 font-medium tracking-wide">
            No names. No judgment. Just the raw truth.
          </p>

          {/* Voice/Text Toggle */}
          <div className="flex gap-2 mt-5 mb-6">
            <button
              type="button"
              onClick={() => setConfessType("text")}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                confessType === "text"
                  ? "bg-black text-white shadow-md shadow-black/10"
                  : "bg-[#faf8f5] text-black/40 border border-black/5 hover:border-black/15"
              }`}
            >
              <Type size={14} />
              Write
            </button>
            <button
              type="button"
              onClick={() => {
                setConfessType("voice");
                setShowVoiceModal(true);
              }}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                confessType === "voice"
                  ? "bg-black text-white shadow-md shadow-black/10"
                  : "bg-[#faf8f5] text-black/40 border border-black/5 hover:border-black/15"
              }`}
            >
              <Mic size={14} />
              Record
            </button>
          </div>

          <Link
            href="/spill/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-900 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-rose-200/50 hover:bg-rose-100 transition-colors"
          >
            <BookOpen size={12} />
            Or write a Long Gossip book
          </Link>
        </div>

        {/* Form card */}
        {confessType === "text" && (
        <div className="bg-white rounded-2xl border border-black/5 shadow-xl shadow-black/[0.03]">
          {/* Textarea */}
          <div className="p-5 pb-0">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="write what's been sitting inside you..."
              rows={5}
              autoFocus
              className="w-full bg-transparent resize-none outline-none text-sm leading-relaxed placeholder:text-black/15 serif text-black/80"
            />
          </div>
          <div className="flex items-center justify-between px-5 pb-4">
            <div className="relative">
              <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            </div>
            <span
              className={`text-[10px] font-mono ${wordCount > 500 ? "text-red-500 font-bold" : "text-black/15"}`}
            >
              {wordCount > 500
                ? `-${wordCount - 500} words`
                : `${500 - wordCount} words left`}
            </span>
          </div>

          <div className="h-px bg-black/5" />

          {/* Disappearing Tea */}
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/25">
                Disappearing Tea
              </p>
              <span className="text-[8px] font-medium text-black/15 uppercase tracking-wider">
                Optional
              </span>
            </div>

            {/* Main options */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {[
                { key: "never", label: "Keep Forever", sub: "Default" },
                { key: "5m", label: "5 Minutes", sub: "Auto-delete" },
                { key: "24h", label: "24 Hours", sub: "Auto-delete" },
                { key: "7d", label: "7 Days", sub: "Auto-delete" },
                { key: "views25", label: "25 Views", sub: "Then vanish" },
              ].map((opt) => {
                const active = disappearMode === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() =>
                      setDisappearMode(opt.key as typeof disappearMode)
                    }
                    className={`rounded-xl border p-3 text-left transition-all ${
                      active
                        ? "bg-black text-white border-black shadow-md shadow-black/10"
                        : "bg-[#faf8f5] border-black/5 hover:border-black/15"
                    }`}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider">
                      {opt.label}
                    </p>
                    <p
                      className={`text-[9px] mt-0.5 ${active ? "text-white/65" : "text-black/25"}`}
                    >
                      {opt.sub}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Custom options */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setDisappearMode("custom-time")}
                className={`w-full rounded-xl border p-3 text-left transition-all ${
                  disappearMode === "custom-time"
                    ? "bg-black text-white border-black shadow-md shadow-black/10"
                    : "bg-[#faf8f5] border-black/5 hover:border-black/15"
                }`}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider">
                  Custom Time
                </p>
                <p
                  className={`text-[9px] mt-0.5 ${disappearMode === "custom-time" ? "text-white/65" : "text-black/25"}`}
                >
                  Pick exact date
                </p>
              </button>

              <button
                type="button"
                onClick={() => setDisappearMode("custom-views")}
                className={`w-full rounded-xl border p-3 text-left transition-all ${
                  disappearMode === "custom-views"
                    ? "bg-black text-white border-black shadow-md shadow-black/10"
                    : "bg-[#faf8f5] border-black/5 hover:border-black/15"
                }`}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider">
                  Custom Views
                </p>
                <p
                  className={`text-[9px] mt-0.5 ${disappearMode === "custom-views" ? "text-white/65" : "text-black/25"}`}
                >
                  Set own limit
                </p>
              </button>
            </div>

            {disappearMode === "custom-time" && (
              <div className="mt-3">
                <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-black/30 mb-1.5 block">
                  Vanish At (Local Time)
                </label>
                <input
                  type="datetime-local"
                  value={customExpireAt}
                  onChange={(e) => setCustomExpireAt(e.target.value)}
                  className={`w-full text-sm font-medium bg-[#faf8f5] border rounded-xl px-4 py-3 outline-none transition-all ${
                    isCustomTimeInvalid
                      ? "border-red-300 focus:ring-2 focus:ring-red-100"
                      : "border-black/5 focus:border-black/15 focus:ring-2 focus:ring-black/5"
                  }`}
                />
                {isCustomTimeInvalid && (
                  <p className="text-[10px] text-red-500 font-bold mt-1.5 ml-1">
                    Pick a future time. Past times are not allowed.
                  </p>
                )}
              </div>
            )}

            {disappearMode === "custom-views" && (
              <div className="mt-3">
                <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-black/30 mb-1.5 block">
                  Vanish After Views
                </label>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={customViews}
                  onChange={(e) => setCustomViews(e.target.value)}
                  placeholder="e.g. 73"
                  className={`w-full text-sm font-medium bg-[#faf8f5] border rounded-xl px-4 py-3 outline-none transition-all ${
                    isCustomViewsInvalid
                      ? "border-red-300 focus:ring-2 focus:ring-red-100"
                      : "border-black/5 focus:border-black/15 focus:ring-2 focus:ring-black/5"
                  }`}
                />
                {isCustomViewsInvalid && (
                  <p className="text-[10px] text-red-500 font-bold mt-1.5 ml-1">
                    Use a number between 1 and 10000 views.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Category picker */}
          <div className="p-5">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/25 mb-3">
              What does it feel like?
            </p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => {
                const catInfo = CATEGORY_INFO[cat];
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3.5 py-2 rounded-lg text-[11px] font-semibold transition-all active:scale-95 ${
                      isSelected
                        ? "text-white shadow-sm"
                        : "bg-black/[0.02] text-black/40 border border-black/5 hover:border-black/10 hover:text-black/60"
                    }`}
                    style={
                      isSelected
                        ? { background: catInfo?.color ?? "#333" }
                        : undefined
                    }
                  >
                    {catInfo?.label ?? cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-black/5" />

          {/* Board picker — OPTIONAL */}
          <div className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/25">
                Post to a specific board
              </p>
              <span className="text-[8px] font-medium text-black/15 uppercase tracking-wider">
                Optional
              </span>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowBoardPicker(!showBoardPicker)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#faf8f5] border border-black/5 text-left transition-all hover:border-black/10"
              >
                <span
                  className={`text-xs font-medium ${selectedBoard ? "text-black" : "text-black/20"}`}
                >
                  {selectedBoard
                    ? `🫖 ${selectedBoard.name}`
                    : "Global feed (default)"}
                </span>
                <ChevronDown
                  size={12}
                  className={`text-black/15 transition-transform ${showBoardPicker ? "rotate-180" : ""}`}
                />
              </button>

              {showBoardPicker && publicBoards && (
                <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-white border border-black/8 rounded-xl shadow-lg shadow-black/5 z-50 max-h-48 overflow-y-auto">
                  {/* Global option */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBoardId("");
                      setShowBoardPicker(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-black/[0.02] transition-colors rounded-t-xl ${
                      !selectedBoardId ? "bg-black/[0.03]" : ""
                    }`}
                  >
                    <span className="text-sm">🌍</span>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-black">
                        Global Feed
                      </p>
                      <p className="text-[9px] text-black/25 italic">
                        No specific board
                      </p>
                    </div>
                    {!selectedBoardId && (
                      <span className="text-[9px] font-bold text-black/30">
                        ✓
                      </span>
                    )}
                  </button>

                  {publicBoards.map((board, i) => (
                    <button
                      key={board._id}
                      type="button"
                      onClick={() => {
                        setSelectedBoardId(board._id);
                        setShowBoardPicker(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-black/[0.02] transition-colors ${
                        i === publicBoards.length - 1 ? "rounded-b-xl" : ""
                      } ${selectedBoardId === board._id ? "bg-black/[0.03]" : ""}`}
                    >
                      <span className="text-sm">🫖</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-black truncate">
                          {board.name}
                        </p>
                        {board.tagline && (
                          <p className="text-[9px] text-black/25 truncate italic">
                            {board.tagline}
                          </p>
                        )}
                      </div>
                      {selectedBoardId === board._id && (
                        <span className="text-[9px] font-bold text-black/30">
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Public Feed Toggle (only when specific board chosen) */}
          {selectedBoardId && (
            <>
              <div className="h-px bg-black/5" />
              <div className="p-5 flex items-center justify-between bg-black/[0.01]">
                <div>
                  <div className="text-xs font-bold text-black/60">
                    Show in public feed?
                  </div>
                  <div className="text-[9px] text-black/25 font-medium mt-0.5">
                    {isGlobal
                      ? "Visible in global explore"
                      : "Visible only on this board"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGlobal(!isGlobal)}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                    isGlobal ? "bg-black" : "bg-black/10"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${
                      isGlobal ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>
            </>
          )}
        </div>
        )}

        {/* Voice Modal */}
        {globalBoardId && (
          <VoiceConfessModal
            isOpen={showVoiceModal}
            boardId={globalBoardId}
            onClose={() => {
              setShowVoiceModal(false);
              setConfessType("text");
            }}
            onSuccess={() => {
              setShowVoiceModal(false);
              setConfessType("text");
              setSubmitted(true);
            }}
          />
        )}

        {/* Submit */}
        {confessType === "text" && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            !text.trim() ||
            !category ||
            isSubmitting ||
            wordCount > 500 ||
            isCustomTimeInvalid ||
            isCustomViewsInvalid
          }
          className="w-full mt-5 py-4 bg-black text-white rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-15 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            "Leave it here"
          )}
        </button>
        )}

        <p className="text-center text-[9px] text-black/15 mt-3 font-medium">
          Completely anonymous · No accounts · No trace
        </p>
      </main>
    </div>
  );
}
