"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  type CSSProperties,
} from "react";
import Link from "next/link";
import {
  Home,
  Plus,
  Lock,
  Share2,
  Check,
  Bell,
  BookOpen,
  Shuffle,
  Inbox,
  Heart,
  Sparkles,
  X,
  BarChart3,
  MessageSquare,
} from "lucide-react";
import { CATEGORY_INFO, getCreatorToken, SHARE_PROMPTS } from "@/app/lib/utils";
import ConfessionFlipCard from "@/app/components/ConfessionFlipCard";
import MemoryStickyCard from "@/app/components/MemoryStickyCard";
import DoodleConfessionCard from "@/app/components/DoodleConfessionCard";
import SummaryCard from "@/app/components/SummaryCard";
import DeepSpillCard from "@/app/components/DeepSpillCard";
import MoodRing from "@/app/components/MoodRing";
import PollCard from "@/app/components/PollCard";
import PushSubscribeButton from "@/app/components/PushSubscribeButton";
import { motion, AnimatePresence } from "framer-motion";

const ADMIRER_CATEGORIES = [
  { key: "all", label: "All" },
  { key: "crush", label: "Crush" },
  { key: "compliment", label: "Compliment" },
  { key: "attraction", label: "Attraction" },
  { key: "gratitude", label: "Gratitude" },
  { key: "admiration", label: "Admiration" },
  { key: "confession", label: "Confession" },
];

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "regret", label: "Regret" },
  { key: "love", label: "Love" },
  { key: "guilt", label: "Guilt" },
  { key: "relief", label: "Relief" },
  { key: "longing", label: "Longing" },
  { key: "mischief", label: "Mischief" },
  { key: "obsession", label: "Obsession" },
  { key: "pride", label: "Pride" },
  { key: "fear", label: "Fear" },
  { key: "envy", label: "Envy" },
  { key: "deep-dark", label: "Deep Dark" },
];

export default function BoardViewPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAllFilters, setShowAllFilters] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [boardCopied, setBoardCopied] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollAccum = useRef(0);
  const scrollCooldown = useRef(false);
  const [showToast, setShowToast] = useState(false);
  const [pippedConfession, setPippedConfession] = useState<any>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const prevConfessionsLength = useRef(0);
  const isInitialLoad = useRef(true);
  const [showConfessBackCTA, setShowConfessBackCTA] = useState(false);
  const viewedIndexes = useRef<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<"cards" | "polls">("cards");
  const [activePollIdx, setActivePollIdx] = useState(0);
  const pollSwipeStart = useRef<number | null>(null);
  const [viewportWidth, setViewportWidth] = useState(1024);

  const board = useQuery(api.boards.getBySlug, { slug });
  const summarize = useAction(api.ai.summarizeBoard);

  const creatorToken = typeof window !== "undefined" ? getCreatorToken() : "";
  const isOwner = board?.creatorToken === creatorToken;
  const isAdmirerMode = board?.boardType === "secret-admirer";

  const sessionKey = `board-pin-${slug}`;
  const savedPin =
    typeof window !== "undefined"
      ? sessionStorage.getItem(`board-pin-value-${slug}`)
      : null;

  const [pinToVerify, setPinToVerify] = useState(savedPin || "");
  const pinVerified = useQuery(
    api.boards.verifyPin,
    board?.isPrivate && !isOwner && pinToVerify.length >= 4
      ? { slug, pin: pinToVerify }
      : "skip",
  );

  const isLocked =
    board?.isPrivate && !isOwner && !unlocked && pinVerified !== true;

  const confessions = useQuery(
    api.confessions.listByBoard,
    board && !isLocked
      ? {
          boardId: board._id,
          category: selectedCategory,
          pin: pinToVerify,
          creatorToken,
        }
      : "skip",
  );

  const spills = useQuery(
    api.spills.listByBoard,
    board && !isLocked ? { boardId: board._id } : "skip",
  );
  const inboxUnread = useQuery(
    api.confessions.inboxUnreadCount,
    board && isOwner ? { boardId: board._id, creatorToken } : "skip",
  );

  const moodData = useQuery(
    api.confessions.getMoodDistribution,
    board && !isLocked ? { boardId: board._id } : "skip",
  );

  const boardPolls = useQuery(
    api.polls.listByBoard,
    board && !isLocked ? { boardId: board._id } : "skip",
  );

  const pollCount = useQuery(
    api.polls.getPollCount,
    board && !isLocked ? { boardId: board._id } : "skip",
  );

  const hasAnyPolls = boardPolls && boardPolls.length > 0;
  const activePolls = boardPolls?.filter((p) => p.isActive) ?? [];
  const endedPolls = boardPolls?.filter((p) => !p.isActive) ?? [];

  const categoriesToUse = useMemo(() => {
    const base = isAdmirerMode ? ADMIRER_CATEGORIES : CATEGORIES;
    const defaultCats = base.map((c) => ({ ...c, isCustom: false }));
    const dynamicCats = [...defaultCats];

    if (moodData?.distribution) {
      Object.keys(moodData.distribution).forEach((key) => {
        if (!defaultCats.find((c) => c.key === key)) {
          dynamicCats.push({
            key,
            label: key,
            isCustom: true,
          });
        }
      });
    }
    return dynamicCats;
  }, [isAdmirerMode, moodData]);

  const mixedItems = useMemo(() => {
    if (!confessions) return undefined;
    const items: any[] = [...confessions];

    // Mix in spills cleanly
    if (spills && spills.length > 0) {
      if (selectedCategory === "all") {
        items.splice(Math.min(2, items.length), 0, {
          ...spills[0],
          _type: "spill",
        });
        if (spills.length > 1) {
          items.splice(Math.min(6, items.length), 0, {
            ...spills[1],
            _type: "spill",
          });
        }
      }
    }
    return items;
  }, [confessions, spills, selectedCategory]);

  // Start in the middle so cards are balanced on both sides
  useEffect(() => {
    if (mixedItems) {
      if (isInitialLoad.current) {
        // First load — just record the length, don't show toast
        isInitialLoad.current = false;
        prevConfessionsLength.current = mixedItems.length;
        setActiveIndex(Math.floor(mixedItems.length / 2));
        return;
      }

      if (
        prevConfessionsLength.current !== 0 &&
        mixedItems.length > prevConfessionsLength.current
      ) {
        // Play pop sound
        try {
          const ctx = new (
            window.AudioContext || (window as any).webkitAudioContext
          )();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sine";
          osc.frequency.setValueAtTime(600, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(
            1000,
            ctx.currentTime + 0.1,
          );
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
          osc.start();
          osc.stop(ctx.currentTime + 0.1);
        } catch (e) {}

        setShowToast(true);
        setTimeout(() => setShowToast(false), 3500);
      }
      prevConfessionsLength.current = mixedItems.length;
      setActiveIndex(Math.floor(mixedItems.length / 2));
    }
  }, [selectedCategory, mixedItems?.length]);

  // Track viewed confessions for CTA
  useEffect(() => {
    if (
      mixedItems &&
      mixedItems.length > 0 &&
      board &&
      !isOwner &&
      board.visibility === "public"
    ) {
      viewedIndexes.current.add(activeIndex);

      const hasDismissed = localStorage.getItem("teaa_dismissed_cta");
      if (
        viewedIndexes.current.size >= 3 &&
        !hasDismissed &&
        !showConfessBackCTA
      ) {
        setShowConfessBackCTA(true);
        // Play pop sound
        try {
          const ctx = new (
            window.AudioContext || (window as any).webkitAudioContext
          )();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sine";
          osc.frequency.setValueAtTime(500, ctx.currentTime); // Slight lower pitch pop
          osc.frequency.exponentialRampToValueAtTime(
            900,
            ctx.currentTime + 0.15,
          );
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
          osc.start();
          osc.stop(ctx.currentTime + 0.15);
        } catch (e) {}
      }
    }
  }, [activeIndex, mixedItems, board, isOwner, showConfessBackCTA]);

  const scrollToCard = useCallback(
    (index: number) => {
      if (!mixedItems || index < 0 || index >= mixedItems.length) return;
      setActiveIndex(index);
    },
    [mixedItems],
  );

  const shuffleTea = useCallback(() => {
    if (!mixedItems || mixedItems.length < 2) return;
    let next = activeIndex;
    while (next === activeIndex) {
      next = Math.floor(Math.random() * mixedItems.length);
    }
    setActiveIndex(next);
  }, [activeIndex, mixedItems]);

  // Keyboard nav (works for both cards and polls)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        if (viewMode === "polls" && boardPolls) {
          setActivePollIdx((prev) => Math.min(boardPolls.length - 1, prev + 1));
        } else {
          scrollToCard(activeIndex + 1);
        }
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        if (viewMode === "polls") {
          setActivePollIdx((prev) => Math.max(0, prev - 1));
        } else {
          scrollToCard(activeIndex - 1);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeIndex, scrollToCard, viewMode, boardPolls]);

  // Trackpad scroll
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      scrollAccum.current += e.deltaY;
      if (Math.abs(scrollAccum.current) >= 80 && !scrollCooldown.current) {
        scrollToCard(activeIndex + (scrollAccum.current > 0 ? 1 : -1));
        scrollAccum.current = 0;
        scrollCooldown.current = true;
        setTimeout(() => {
          scrollCooldown.current = false;
        }, 500);
      }
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [activeIndex, scrollToCard]);

  // Mark as verified in session when query returns true
  useEffect(() => {
    if (pinVerified === true && !unlocked) {
      setUnlocked(true);
    }
  }, [pinVerified, unlocked]);

  // Check if PIN was wrong after verification
  useEffect(() => {
    if (unlocked && pinVerified === false) {
      setPinError(true);
      setUnlocked(false);
      sessionStorage.removeItem(`board-pin-value-${slug}`);
    }
  }, [unlocked, pinVerified, slug]);

  const handlePinSubmit = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate)
      navigator.vibrate(50);
    setPinToVerify(pinInput);
    if (pinInput.length < 4) return;
    sessionStorage.setItem(`board-pin-value-${slug}`, pinInput);
    setUnlocked(true);
  };

  const handleSummarize = async () => {
    if (!board) return;
    setIsGenerating(true);
    try {
      const summary = await summarize({ boardId: board._id });
      setAiSummary(summary);
    } catch (err: any) {
      console.error("Summarization failed", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const hasEnoughForSummary =
    !isAdmirerMode &&
    board?.visibility === "public" &&
    (confessions?.length ?? 0) >= 10;
  const isMobile = viewportWidth < 768;

  useEffect(() => {
    const updateViewport = () => setViewportWidth(window.innerWidth);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  if (board === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-black/10 border-t-black/40 rounded-full animate-spin" />
      </div>
    );
  }

  if (board === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-white">
        <span className="text-5xl mb-4">🫣</span>
        <h1 className="text-2xl font-bold mb-2 serif">Board not found</h1>
        <p className="text-black/40 mb-6 text-sm">
          This board doesn&apos;t exist or has been removed.
        </p>
        <Link
          href="/"
          className="px-6 py-3 bg-black text-white rounded-xl text-sm font-medium hover:scale-105 transition-all"
        >
          Go Home
        </Link>
      </div>
    );
  }

  // ── PIN Gate Screen ──
  if (isLocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-5 bg-white">
        <div className="max-w-sm w-full">
          <div className="bg-white rounded-2xl border border-black/5 p-8 shadow-xl shadow-black/[0.03] text-center">
            <div className="w-16 h-16 rounded-2xl bg-black/[0.02] mx-auto mb-5 flex items-center justify-center">
              <Lock size={28} className="text-black/20" />
            </div>
            <h2 className="text-xl font-black serif tracking-tight text-black mb-1">
              {board.name}
            </h2>
            <p className="text-[11px] text-black/30 font-medium mb-6">
              This board is private. Enter the PIN to view confessions.
            </p>

            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value.replace(/\D/g, "").slice(0, 6));
                setPinError(false);
              }}
              placeholder="Enter PIN"
              className={`w-full text-3xl font-mono font-bold text-center tracking-[0.5em] bg-[#faf8f5] border rounded-xl px-4 py-4 outline-none transition-all placeholder:text-black/10 placeholder:tracking-normal placeholder:text-base mb-4 ${
                pinError
                  ? "border-red-300 ring-2 ring-red-100 animate-[shake_0.3s_ease-in-out]"
                  : "border-black/5 focus:border-black/15 focus:ring-2 focus:ring-black/5"
              }`}
              onKeyDown={(e) => {
                if (e.key === "Enter") handlePinSubmit();
              }}
              autoFocus
            />

            {pinError && (
              <p className="text-[10px] text-red-500 font-bold mb-3">
                Wrong PIN. Try again.
              </p>
            )}

            <button
              type="button"
              onClick={handlePinSubmit}
              disabled={pinInput.length < 4}
              className="w-full py-3.5 bg-black text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-black/90 transition-all active:scale-[0.98] disabled:opacity-15 mb-4"
            >
              Unlock Board
            </button>

            <div className="relative flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-black/5" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-black/20">
                or
              </span>
              <div className="flex-1 h-px bg-black/5" />
            </div>

            <Link
              href={`/b/${slug}/confess`}
              className="mt-4 w-full flex items-center justify-center py-3.5 border border-black/10 text-black rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-black/5 transition-all active:scale-[0.98]"
            >
              Drop a Confession
            </Link>

            <Link
              href="/"
              className="block mt-4 text-[10px] text-black/20 font-bold uppercase tracking-widest hover:text-black transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen page-enter text-[#111]`}
      style={{
        background: isAdmirerMode
          ? "linear-gradient(180deg, #FFF5F5 0%, #FFF0EE 30%, #FFF5F2 60%, #FFFAF8 100%)"
          : "#fff",
      }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-5 py-3 backdrop-blur-xl border-b"
        style={{
          background: isAdmirerMode
            ? "rgba(255, 248, 243, 0.85)"
            : "rgba(255,255,255,0.85)",
          borderColor: isAdmirerMode
            ? "rgba(201, 169, 110, 0.12)"
            : "rgba(0,0,0,0.05)",
        }}
      >
        <Link
          href="/"
          className="flex items-center justify-center min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 gap-1.5 text-black/35 hover:text-black transition-colors"
        >
          <Home size={16} />
        </Link>
        <h1
          className={`text-[10px] font-black uppercase tracking-[0.25em] ${isAdmirerMode ? "flex items-center gap-1.5" : "text-black/25"}`}
          style={{
            color: isAdmirerMode ? "rgba(155, 58, 92, 0.35)" : undefined,
          }}
        >
          {isAdmirerMode && <Heart size={8} fill="currentColor" />}
          {board.name}
          {isAdmirerMode && <Heart size={8} fill="currentColor" />}
        </h1>
        <div className="flex items-center gap-3">
          {isOwner && (
            <Link
              href={`/b/${slug}/settings`}
              className="relative text-[10px] text-black/40 hover:text-black font-medium transition-colors inline-flex items-center justify-center min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 gap-1 mr-1"
              title="Board Settings"
            >
              <div style={{ transform: "scale(0.85)" }}>⚙️</div>
              <span className="hidden sm:inline">Settings</span>
            </Link>
          )}
          {(isOwner || board.visibility !== "private") && (
            <Link
              href={`/b/${slug}/inbox`}
              className="relative text-[10px] text-black/40 hover:text-black font-medium transition-colors inline-flex items-center justify-center min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 gap-1 mr-1"
              title={isOwner ? "Creator inbox" : "Public inbox"}
            >
              <Inbox size={12} />
              <span className="hidden sm:inline">Inbox</span>
              {isOwner && (inboxUnread ?? 0) > 0 && (
                <span className="absolute -top-2 -right-4 min-w-4 h-4 px-1 rounded-full bg-accent text-white text-[8px] font-black flex items-center justify-center">
                  {inboxUnread}
                </span>
              )}
            </Link>
          )}
          <button
            type="button"
            onClick={async () => {
              const url = `${window.location.origin}/b/${slug}`;
              const viralPrompt = board.sharePrompt
                ? SHARE_PROMPTS.find((p) => p.id === board.sharePrompt)?.text
                : null;
              const shareData = {
                title: `${board.name} — Teaaa 🫖`,
                text: viralPrompt
                  ? `${viralPrompt} ${url}`
                  : board.tagline
                    ? `"${board.tagline}" — Spill your confessions anonymously! ${url}`
                    : `Check out this confession board and spill your secrets! ${url}`,
                url,
              };
              if (navigator.share) {
                try {
                  await navigator.share(shareData);
                } catch {
                  await navigator.clipboard.writeText(url);
                  setBoardCopied(true);
                  setTimeout(() => setBoardCopied(false), 2000);
                }
              } else {
                await navigator.clipboard.writeText(url);
                setBoardCopied(true);
                setTimeout(() => setBoardCopied(false), 2000);
              }
            }}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 gap-1.5 text-[10px] text-black/40 hover:text-black font-medium transition-colors"
          >
            {boardCopied ? (
              <>
                <Check size={14} className="text-green-500" />
                <span className="hidden sm:inline text-green-500">Copied!</span>
              </>
            ) : (
              <>
                <Share2 size={14} />
                <span className="hidden sm:inline">Share</span>
              </>
            )}
          </button>
          <Link
            href={`/b/${slug}/${isAdmirerMode ? "admirer" : "confess"}`}
            className={`flex items-center justify-center min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 gap-1.5 text-[10px] ${isAdmirerMode ? "text-[#be185d]" : "text-black/40"} hover:opacity-70 font-medium transition-colors`}
          >
            <Plus size={14} />
            <span className="hidden sm:inline">
              {isAdmirerMode ? "Send Love Letter" : "Add confession"}
            </span>
          </Link>
          <Link
            href={`/b/${slug}/spill`}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 gap-1.5 text-[10px] text-rose-900/60 hover:text-rose-900 font-medium transition-colors"
          >
            <BookOpen size={14} />
            <span className="hidden sm:inline">Long gossip</span>
          </Link>
          {isOwner && !isAdmirerMode && (
            <Link
              href={`/b/${slug}/poll`}
              className="flex items-center justify-center min-h-[44px] sm:min-h-0 gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 hover:shadow-lg"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                color: "#fff",
                boxShadow: "0 2px 10px rgba(124, 58, 237, 0.25)",
              }}
              title="Create Poll"
            >
              <BarChart3 size={12} />
              <span className="hidden sm:inline">Poll</span>
            </Link>
          )}
          {/* Premium Shine Summarize Button */}
          {hasEnoughForSummary && (
            <button
              onClick={handleSummarize}
              disabled={isGenerating}
              className="group relative h-10 min-w-[44px] sm:h-8 px-3 sm:px-4 rounded-full overflow-hidden transition-all active:scale-95 disabled:opacity-60 ml-1 flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #1a0e0e, #2d1515)",
                boxShadow:
                  "0 2px 12px rgba(196, 58, 58, 0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              {/* Animated shimmer sweep */}
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  background:
                    "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmerSweep 3s ease-in-out infinite",
                }}
              />
              <span
                className="relative z-10 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.15em]"
                style={{ color: "#f5e6e0" }}
              >
                {isGenerating ? (
                  <>
                    <div className="w-2.5 h-2.5 border-[1.5px] border-pink-200/30 border-t-pink-300 rounded-full animate-spin" />
                    <span className="hidden sm:inline">Brewing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={10} style={{ color: "#c43a3a" }} />
                    <span className="hidden md:inline">Vibe</span>
                  </>
                )}
              </span>
            </button>
          )}
        </div>
      </header>

      {/* Push Notification Banner */}
      <PushSubscribeButton variant="floating" />

      {/* Shimmer animation */}
      <style>{`
        @keyframes shimmerSweep {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes borderSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <main className="max-w-5xl mx-auto">
        {/* Board info */}
        <div className="pt-10 pb-2 text-center">
          <h1
            className="text-3xl font-black tracking-tight serif mb-1"
            style={{ color: isAdmirerMode ? "#5C1A2A" : "#000" }}
          >
            {isAdmirerMode ? "Secret Admirer" : "Teaaa!"}
          </h1>
          {board.tagline && (
            <p
              className="text-xs italic font-medium"
              style={{
                color: isAdmirerMode
                  ? "rgba(155, 58, 92, 0.4)"
                  : "rgba(0,0,0,0.3)",
              }}
            >
              &quot;{board.tagline}&quot;
            </p>
          )}
          {isAdmirerMode && (
            <p
              className="text-[10px] font-medium mt-1.5 tracking-wide flex items-center justify-center gap-1.5"
              style={{ color: "rgba(155, 58, 92, 0.25)" }}
            >
              <span style={{ color: "rgba(201, 169, 110, 0.4)" }}>✦</span>
              anonymous love letters
              <span style={{ color: "rgba(201, 169, 110, 0.4)" }}>✦</span>
            </p>
          )}
        </div>

        {/* Cards / Polls Toggle */}
        {boardPolls !== undefined && (
          <div className="flex justify-center pb-4 pt-1">
            <div
              className="relative inline-flex items-center rounded-full p-1"
              style={{
                background: "rgba(0,0,0,0.04)",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              {/* Animated sliding indicator */}
              <motion.div
                className="absolute top-1 bottom-1 rounded-full"
                initial={false}
                animate={{
                  left: viewMode === "cards" ? "4px" : "50%",
                  right: viewMode === "polls" ? "4px" : "50%",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                style={{
                  background: "#fff",
                  boxShadow:
                    "0 1px 6px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
                }}
              />
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className="relative z-10 flex items-center gap-1.5 px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-colors min-h-[40px]"
                style={{
                  color: viewMode === "cards" ? "#000" : "rgba(0,0,0,0.3)",
                }}
              >
                <MessageSquare size={13} />
                Cards
                {confessions && confessions.length > 0 && (
                  <span
                    className="ml-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-black"
                    style={{
                      background:
                        viewMode === "cards"
                          ? "rgba(0,0,0,0.08)"
                          : "rgba(0,0,0,0.04)",
                      color: viewMode === "cards" ? "#000" : "rgba(0,0,0,0.3)",
                    }}
                  >
                    {confessions.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setViewMode("polls")}
                className="relative z-10 flex items-center gap-1.5 px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-colors min-h-[40px]"
                style={{
                  color: viewMode === "polls" ? "#000" : "rgba(0,0,0,0.3)",
                }}
              >
                <BarChart3 size={13} />
                Polls
                {activePolls.length > 0 && (
                  <span
                    className="ml-0.5 w-2 h-2 rounded-full animate-pulse"
                    style={{ background: "#10b981" }}
                  />
                )}
                {boardPolls && boardPolls.length > 0 && (
                  <span
                    className="ml-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-black"
                    style={{
                      background:
                        viewMode === "polls"
                          ? "rgba(0,0,0,0.08)"
                          : "rgba(0,0,0,0.04)",
                      color: viewMode === "polls" ? "#000" : "rgba(0,0,0,0.3)",
                    }}
                  >
                    {boardPolls.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Mood Ring */}
        {viewMode === "cards" && moodData && moodData.total >= 3 && (
          <div className="flex justify-center py-4 mb-2">
            <MoodRing moodData={moodData} />
          </div>
        )}

        {/* AI Vibe Summary Result */}
        <AnimatePresence mode="wait">
          {aiSummary && !isAdmirerMode && (
            <div className="px-4 mb-6">
              <SummaryCard
                key="summary"
                summary={aiSummary}
                type="board"
                onClose={() => setAiSummary(null)}
              />
            </div>
          )}
        </AnimatePresence>

        {/* ── POLLS VIEW ── */}
        <AnimatePresence mode="wait">
          {viewMode === "polls" && (
            <motion.div
              key="polls-view"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="px-4 mb-6"
            >
              <div className="max-w-lg mx-auto">
                {boardPolls && boardPolls.length > 0 ? (
                  <>
                    {/* Poll Carousel — one at a time */}
                    <div className="relative overflow-hidden rounded-2xl pb-2">
                      {/* Status badge above poll */}
                      <div className="flex items-center justify-between mb-3 px-1">
                        <div className="flex items-center gap-2">
                          {boardPolls[activePollIdx]?.isActive ? (
                            <>
                              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">
                                Live
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-[10px]">🏁</span>
                              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/25">
                                Ended
                              </span>
                            </>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-black/20">
                          {activePollIdx + 1} / {boardPolls.length}
                        </span>
                      </div>

                      {/* Animated poll card with gesture drag support */}
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={boardPolls[activePollIdx]?._id}
                          initial={{ opacity: 0, x: 80 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -80 }}
                          transition={{
                            type: "spring",
                            stiffness: 350,
                            damping: 30,
                          }}
                          drag={boardPolls.length > 1 ? "x" : false}
                          dragConstraints={{ left: 0, right: 0 }}
                          dragElastic={0.7}
                          onDragEnd={(e, { offset, velocity }) => {
                            const swipe = offset.x;
                            if (
                              swipe < -50 &&
                              activePollIdx < boardPolls.length - 1
                            ) {
                              setActivePollIdx(activePollIdx + 1);
                            } else if (swipe > 50 && activePollIdx > 0) {
                              setActivePollIdx(activePollIdx - 1);
                            }
                          }}
                          className="cursor-grab active:cursor-grabbing touch-pan-y"
                        >
                          <PollCard
                            poll={boardPolls[activePollIdx]}
                            boardSlug={slug}
                            isOwner={isOwner}
                          />
                        </motion.div>
                      </AnimatePresence>

                      {/* Navigation: arrows + dots */}
                      {boardPolls.length > 1 && (
                        <div className="flex items-center justify-center gap-4 mt-6">
                          <button
                            type="button"
                            onClick={() =>
                              setActivePollIdx(Math.max(0, activePollIdx - 1))
                            }
                            disabled={activePollIdx === 0}
                            className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center text-black/30 hover:text-black hover:border-black/30 transition-all disabled:opacity-15 disabled:cursor-not-allowed active:scale-90"
                          >
                            ←
                          </button>

                          {/* Dot indicators */}
                          <div className="flex items-center gap-2">
                            {boardPolls.map((poll, idx) => (
                              <button
                                key={poll._id}
                                type="button"
                                onClick={() => setActivePollIdx(idx)}
                                className="transition-all p-1 active:scale-90"
                                title={
                                  poll.isActive ? "Live poll" : "Ended poll"
                                }
                              >
                                <div
                                  className={`rounded-full transition-all duration-300 ${
                                    idx === activePollIdx
                                      ? "w-6 h-2"
                                      : "w-2 h-2"
                                  }`}
                                  style={{
                                    background:
                                      idx === activePollIdx
                                        ? poll.isActive
                                          ? "#10b981"
                                          : "#000"
                                        : poll.isActive
                                          ? "rgba(16,185,129,0.25)"
                                          : "rgba(0,0,0,0.1)",
                                  }}
                                />
                              </button>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setActivePollIdx(
                                Math.min(
                                  boardPolls.length - 1,
                                  activePollIdx + 1,
                                ),
                              )
                            }
                            disabled={activePollIdx === boardPolls.length - 1}
                            className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center text-black/30 hover:text-black hover:border-black/30 transition-all disabled:opacity-15 disabled:cursor-not-allowed active:scale-90"
                          >
                            →
                          </button>
                        </div>
                      )}

                      {/* Swipe hint (mobile) */}
                      <div className="text-center mt-3 flex flex-col gap-1 items-center justify-center">
                        {boardPolls.length > 1 && (
                          <div className="inline-flex rounded-full px-3 py-1 bg-black/[0.03] text-[9px] font-bold uppercase tracking-widest text-black/30">
                            👈 Swipe mentally 👇
                          </div>
                        )}
                        <p className="text-[10px] text-black/20 font-medium">
                          {boardPolls.length > 1
                            ? "Drag the card to swipe · or use arrows"
                            : ""}
                        </p>
                      </div>
                    </div>

                    {/* Create Poll CTA for owners */}
                    {isOwner && !isAdmirerMode && pollCount?.canCreate && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-5"
                      >
                        <Link
                          href={`/b/${slug}/poll`}
                          className="group relative block w-full overflow-hidden rounded-2xl border border-purple-200/40 transition-all hover:shadow-lg active:scale-[0.99]"
                          style={{
                            background:
                              "linear-gradient(135deg, #f5f0ff 0%, #ede5ff 50%, #f0e8ff 100%)",
                          }}
                        >
                          <div
                            className="absolute inset-0 opacity-40"
                            style={{
                              background:
                                "linear-gradient(105deg, transparent 40%, rgba(124,58,237,0.08) 50%, transparent 60%)",
                              backgroundSize: "200% 100%",
                              animation: "shimmerSweep 3s ease-in-out infinite",
                            }}
                          />
                          <div className="relative flex items-center justify-between px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{
                                  background:
                                    "linear-gradient(135deg, #7c3aed, #6d28d9)",
                                }}
                              >
                                <BarChart3 size={18} className="text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-black text-purple-900">
                                  Create Another Poll
                                </p>
                                <p className="text-[10px] font-medium text-purple-600/50">
                                  {pollCount?.active ?? 0}/
                                  {pollCount?.maxPolls ?? 2} active · anonymous
                                  votes
                                </p>
                              </div>
                            </div>
                            <div className="text-purple-400 group-hover:translate-x-1 transition-transform">
                              <Plus size={18} />
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    )}

                    {/* Max active polls reached */}
                    {isOwner &&
                      !isAdmirerMode &&
                      pollCount &&
                      !pollCount.canCreate && (
                        <div className="text-center py-3 mt-2">
                          <p className="text-[10px] font-bold text-black/20 uppercase tracking-widest">
                            {pollCount.maxPolls}/{pollCount.maxPolls} active
                            polls · end or delete one to create a new one
                          </p>
                        </div>
                      )}
                  </>
                ) : boardPolls && boardPolls.length === 0 ? (
                  /* No polls — empty state */
                  <div
                    className="text-center py-16 rounded-2xl border border-black/[0.05]"
                    style={{
                      background:
                        "linear-gradient(135deg, #faf8f5, #fff, #f8f5f0)",
                    }}
                  >
                    <span className="text-4xl block mb-4">🗳️</span>
                    <p className="text-lg font-bold serif mb-1">No polls yet</p>
                    <p className="text-xs text-black/35 mb-6">
                      {isOwner
                        ? "Create a poll to ask your audience anything!"
                        : "No polls here yet. Check back later!"}
                    </p>
                    {isOwner && !isAdmirerMode && (
                      <Link
                        href={`/b/${slug}/poll`}
                        className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all"
                        style={{
                          background:
                            "linear-gradient(135deg, #7c3aed, #6d28d9)",
                          boxShadow: "0 8px 24px rgba(124, 58, 237, 0.25)",
                        }}
                      >
                        <BarChart3 size={14} />
                        Create a Poll
                      </Link>
                    )}
                  </div>
                ) : (
                  /* Loading */
                  <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-2 border-black/10 border-t-black/40 rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Carousel — only visible in cards mode */}
        <div
          className="relative px-4 pb-4"
          style={{ display: viewMode === "cards" ? "block" : "none" }}
        >
          {/* Carousel View */}
          {!mixedItems ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-black/10 border-t-black/40 rounded-full animate-spin" />
            </div>
          ) : mixedItems.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-4xl block mb-4">
                {isAdmirerMode ? "💌" : "🤫"}
              </span>
              <p
                className="text-lg font-bold serif mb-1"
                style={{ color: isAdmirerMode ? "#5C1A2A" : undefined }}
              >
                {isAdmirerMode ? "No love letters yet" : "No confessions yet"}
              </p>
              <p
                className="text-xs mb-6"
                style={{
                  color: isAdmirerMode
                    ? "rgba(155, 58, 92, 0.4)"
                    : "rgba(0,0,0,0.35)",
                }}
              >
                {isAdmirerMode
                  ? "Be the first to pour your heart out anonymously..."
                  : "Be the first to spill the tea!"}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Link
                  href={`/b/${slug}/${isAdmirerMode ? "admirer" : "confess"}`}
                  className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all"
                  style={{
                    background: isAdmirerMode
                      ? "linear-gradient(135deg, #9B3A5C, #7B2040)"
                      : "#000",
                    boxShadow: isAdmirerMode
                      ? "0 8px 24px rgba(155, 58, 92, 0.25)"
                      : undefined,
                  }}
                >
                  {isAdmirerMode ? <Heart size={14} /> : <Plus size={14} />}
                  {isAdmirerMode ? "Send First Letter" : "Add Confession"}
                </Link>
                <Link
                  href={`/b/${slug}/spill`}
                  className="inline-flex items-center gap-2 px-6 py-3 border rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all"
                  style={{
                    borderColor: isAdmirerMode
                      ? "rgba(201, 169, 110, 0.2)"
                      : "rgba(0,0,0,0.1)",
                    color: isAdmirerMode ? "#5C1A2A" : "#000",
                  }}
                >
                  <BookOpen size={14} />
                  Open Long Gossip
                </Link>
                {isOwner && !isAdmirerMode && (
                  <Link
                    href={`/b/${slug}/poll`}
                    className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all"
                    style={{
                      background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                      boxShadow: "0 8px 24px rgba(124, 58, 237, 0.25)",
                    }}
                  >
                    <BarChart3 size={14} />
                    Create Poll
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <>
              {isAdmirerMode ? (
                <div
                  className="relative w-full overflow-hidden border border-[rgba(201,169,110,0.1)] rounded-[2rem] bg-black/[0.02]"
                  style={{
                    height: "600px",
                    background:
                      "radial-gradient(circle at center, rgba(255,255,255,0.8), rgba(255,245,240,0.4))",
                  }}
                >
                  <p className="absolute top-6 w-full text-center text-[10px] font-bold uppercase tracking-widest text-[#9B3A5C]/40 z-10 pointer-events-none">
                    Drag the memories. Tap to immerse.
                  </p>
                  <div
                    className="absolute inset-0"
                    style={{ perspective: "1200px" }}
                  >
                    {(() => {
                      const previewCards = mixedItems.slice(0, 5);
                      const count = previewCards.length;
                      // Spread cards from center with staggered positions
                      const offsets = [
                        { x: -180, y: -40 },
                        { x: -60, y: 30 },
                        { x: 60, y: -20 },
                        { x: 180, y: 40 },
                        { x: 0, y: -60 },
                      ];
                      return previewCards.map((item, i) => (
                        <MemoryStickyCard
                          key={item._id}
                          confession={item}
                          rotateAmount={(i % 2 === 0 ? 1 : -1) * (3 + i * 2.5)}
                          offsetX={offsets[i % offsets.length].x}
                          offsetY={offsets[i % offsets.length].y}
                          onClick={() =>
                            router.push(`/b/${slug}/admirers?index=${i}`)
                          }
                        />
                      ));
                    })()}
                  </div>

                  {mixedItems.length > 0 && (
                    <Link
                      href={`/b/${slug}/admirers`}
                      className="absolute bottom-6 right-6 z-50 group"
                    >
                      {/* Animated rotating border */}
                      <div className="relative rounded-full p-[2px] overflow-hidden">
                        <div
                          className="absolute inset-[-50%] animate-[borderSpin_3s_linear_infinite]"
                          style={{
                            background:
                              "conic-gradient(from 0deg, transparent, #e8467c, #c95884, #ffd4e8, transparent, #9B3A5C, transparent)",
                          }}
                        />
                        <div
                          className="relative flex items-center gap-2.5 px-6 py-3 rounded-full transition-all active:scale-95"
                          style={{
                            background:
                              "linear-gradient(135deg, #2a0e1a, #4a1a30, #3a1222)",
                            boxShadow:
                              "0 8px 30px rgba(155,58,92,0.3), 0 2px 8px rgba(155,58,92,0.2), inset 0 1px 0 rgba(255,255,255,0.08)",
                          }}
                        >
                          <Heart
                            size={13}
                            fill="currentColor"
                            className="text-[#e8467c] group-hover:scale-110 transition-transform"
                          />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ffd4e8]">
                            View All Letters
                          </span>
                          <span
                            className="min-w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-black text-white"
                            style={{
                              background:
                                "linear-gradient(135deg, #e8467c, #c95884)",
                              boxShadow: "0 2px 8px rgba(232,70,124,0.4)",
                            }}
                          >
                            {mixedItems.length}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  {/* Coverflow carousel */}
                  {isMobile ? (
                    <div className="relative w-full max-w-[360px] mx-auto py-2">
                      {mixedItems[activeIndex] &&
                        (mixedItems[activeIndex]._type === "spill" ? (
                          <DeepSpillCard
                            slug={slug}
                            spill={mixedItems[activeIndex]}
                          />
                        ) : mixedItems[activeIndex].type === "canvas" ||
                          mixedItems[activeIndex].canvasImageUrl ? (
                          <DoodleConfessionCard
                            confession={mixedItems[activeIndex]}
                            boardSlug={slug}
                            boardReactions={board.allowedReactions}
                          />
                        ) : (
                          <ConfessionFlipCard
                            confession={mixedItems[activeIndex]}
                            boardSlug={slug}
                            boardReactions={board.allowedReactions}
                          />
                        ))}
                    </div>
                  ) : (
                    <div
                      ref={carouselRef}
                      className="relative flex items-center justify-center sm:-mx-5 py-4"
                      style={{
                        minHeight: "650px",
                        perspective: "1200px",
                      }}
                    >
                      {mixedItems.map((item, i) => {
                        const offset = i - activeIndex;
                        const absOffset = Math.abs(offset);

                        if (absOffset > 4) return null;

                        const cardWidth = 280;
                        const spacing = 160;
                        const rotateAmount = 30;

                        const translateX = offset * spacing;
                        const translateZ =
                          absOffset === 0 ? 60 : -100 - absOffset * 40;
                        const scale =
                          absOffset === 0
                            ? 1.05
                            : Math.max(0.7 - absOffset * 0.05, 0.5);
                        const opacity =
                          absOffset === 0
                            ? 1
                            : Math.max(0.65 - absOffset * 0.12, 0.15);
                        const rotateY =
                          offset > 0
                            ? -rotateAmount
                            : offset < 0
                              ? rotateAmount
                              : 0;
                        const zIndex = 20 - absOffset;

                        return (
                          <div
                            key={item._id}
                            className="absolute transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
                            style={{
                              width: `${cardWidth}px`,
                              transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                              opacity,
                              zIndex,
                            }}
                            onClick={
                              absOffset !== 0 ? () => scrollToCard(i) : undefined
                            }
                          >
                            <div
                              style={{
                                pointerEvents: absOffset === 0 ? "auto" : "none",
                              }}
                            >
                              {item._type === "spill" ? (
                                <DeepSpillCard slug={slug} spill={item} />
                              ) : item.type === "canvas" ||
                                item.canvasImageUrl ? (
                                <DoodleConfessionCard
                                  confession={item}
                                  boardSlug={slug}
                                  boardReactions={board.allowedReactions}
                                />
                              ) : (
                                <ConfessionFlipCard
                                  confession={item}
                                  boardSlug={slug}
                                  boardReactions={board.allowedReactions}
                                />
                              )}
                            </div>
                            {absOffset !== 0 && (
                              <div
                                className="absolute inset-0 cursor-pointer z-10"
                                onClick={() => scrollToCard(i)}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Hint */}
                  <p className="text-center text-[10px] text-black/20 font-medium mt-1 mb-2">
                    Scroll · ← → keys · tap to flip
                  </p>

                  {mixedItems.length > 1 && (
                    <div className="flex justify-center mb-3">
                      <button
                        type="button"
                        onClick={shuffleTea}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-black/8 text-[10px] font-bold uppercase tracking-widest text-black/40 hover:text-black hover:border-black/20 transition-all"
                      >
                        <Shuffle size={12} />
                        Shuffle the Tea
                      </button>
                    </div>
                  )}

                  {/* Arrow navigation */}
                  {mixedItems.length > 1 && (
                    <div className="flex justify-center gap-4 mb-4">
                      <button
                        type="button"
                        onClick={() => scrollToCard(activeIndex - 1)}
                        disabled={activeIndex === 0}
                        className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center text-black/30 hover:text-black hover:border-black/30 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        ←
                      </button>
                      <span className="text-[10px] font-mono text-black/20 self-center">
                        {activeIndex + 1} / {mixedItems.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => scrollToCard(activeIndex + 1)}
                        disabled={activeIndex === mixedItems.length - 1}
                        className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center text-black/30 hover:text-black hover:border-black/30 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        →
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        <div
          className="mb-8 px-4 font-sans border-b border-black/5 pb-4"
          style={{ display: viewMode === "cards" ? "block" : "none" }}
        >
          <div className="flex flex-wrap gap-2 justify-center">
            {categoriesToUse
              .slice(0, showAllFilters ? categoriesToUse.length : 8)
              .map((cat: any) => {
                const isActive = selectedCategory === cat.key;
                const catInfo = CATEGORY_INFO[cat.key];

                if (cat.isCustom) {
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.key);
                        setActiveIndex(0);
                      }}
                      className={`group relative inline-flex min-h-[44px] min-w-[44px] sm:min-h-8 sm:min-w-0 items-center justify-center overflow-hidden rounded-full p-[1.5px] focus:outline-none transition-all active:scale-95 ${isActive ? "" : "opacity-70 hover:opacity-100"}`}
                    >
                      <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#8b5cf6_0%,#ec4899_50%,#8b5cf6_100%)] opacity-70 group-hover:opacity-100" />
                      <span
                        className={`inline-flex h-full w-full items-center justify-center rounded-full px-3.5 text-[10px] font-bold uppercase tracking-widest backdrop-blur-3xl transition-colors ${isActive ? "bg-transparent text-white" : "bg-[#faf8f5] text-[#111] group-hover:bg-[#faf8f5]/90"}`}
                      >
                        {cat.label}
                      </span>
                    </button>
                  );
                }

                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.key);
                      setActiveIndex(0);
                    }}
                    className="px-4 py-2 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap active:scale-95 border"
                    style={{
                      background: isActive
                        ? (catInfo?.color ?? "#000")
                        : "transparent",
                      color: isActive ? "#fff" : "rgba(0,0,0,0.35)",
                      borderColor: isActive
                        ? "transparent"
                        : "rgba(0,0,0,0.08)",
                    }}
                  >
                    {cat.label}
                  </button>
                );
              })}

            {!showAllFilters && categoriesToUse.length > 8 && (
              <button
                type="button"
                onClick={() => setShowAllFilters(true)}
                className="px-4 py-2 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap active:scale-95 bg-black/[0.03] text-black/40 hover:text-black hover:bg-black/5"
              >
                +{categoriesToUse.length - 8} More
              </button>
            )}
          </div>
        </div>

        {/* CTA Banners */}
        {confessions && confessions.length > 0 && (
          <div className="px-4 pb-10 flex flex-col sm:flex-row gap-4 max-w-3xl mx-auto">
            <Link
              href={`/b/${slug}/${isAdmirerMode ? "admirer" : "confess"}`}
              className="flex-1 block relative overflow-hidden rounded-2xl border transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{
                borderColor: isAdmirerMode
                  ? "rgba(201, 169, 110, 0.15)"
                  : "rgba(0,0,0,0.05)",
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: isAdmirerMode
                    ? "linear-gradient(135deg, #FFF8F3 0%, #FFF2EC 50%, #FFFAF5 100%)"
                    : "linear-gradient(135deg, #faf7f2, #fff, #f5f0e8)",
                }}
              />
              <div
                className="absolute top-3 right-3 w-16 h-16 rounded-full"
                style={{
                  background: isAdmirerMode
                    ? "rgba(201,169,110,0.04)"
                    : "rgba(0,0,0,0.02)",
                }}
              />
              <div
                className="absolute bottom-2 left-2 w-10 h-10 rounded-full"
                style={{
                  background: isAdmirerMode
                    ? "rgba(201,169,110,0.04)"
                    : "rgba(0,0,0,0.02)",
                }}
              />
              <div className="relative flex flex-col items-center text-center py-8 px-6">
                <span className="text-3xl mb-3">
                  {isAdmirerMode ? "💌" : "🫖"}
                </span>
                <h3
                  className="text-base font-black tracking-tight serif mb-1"
                  style={{ color: isAdmirerMode ? "#5C1A2A" : "#000" }}
                >
                  {isAdmirerMode
                    ? "Write a Love Letter"
                    : "Got something to confess?"}
                </h3>
                <p
                  className="text-[11px] mb-4 leading-relaxed"
                  style={{
                    color: isAdmirerMode
                      ? "rgba(155,58,92,0.45)"
                      : "rgba(0,0,0,0.35)",
                  }}
                >
                  {isAdmirerMode
                    ? "Pour your heart out anonymously. They'll never know."
                    : "Spill the tea anonymously. No sign up, no judgement."}
                </p>
                <span
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest"
                  style={{
                    background: isAdmirerMode
                      ? "linear-gradient(135deg, #9B3A5C, #7B2040)"
                      : "#000",
                    boxShadow: isAdmirerMode
                      ? "0 4px 16px rgba(155, 58, 92, 0.2)"
                      : undefined,
                  }}
                >
                  {isAdmirerMode ? <Heart size={12} /> : <Plus size={12} />}
                  {isAdmirerMode ? "Write Letter" : "Confess Now"}
                </span>
              </div>
            </Link>

            <Link
              href={`/b/${slug}/spill`}
              className="flex-1 block relative overflow-hidden rounded-2xl border border-rose-900/10 hover:border-rose-900/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-white to-rose-100/30" />
              <div className="absolute top-3 right-3 w-16 h-16 rounded-full bg-rose-900/[0.02]" />
              <div className="absolute bottom-2 left-2 w-10 h-10 rounded-full bg-rose-900/[0.02]" />
              <div className="relative flex flex-col items-center text-center py-8 px-6">
                <span className="text-3xl mb-3">📖</span>
                <h3 className="text-base font-black tracking-tight serif text-rose-950 mb-1">
                  Got a longer story?
                </h3>
                <p className="text-[11px] text-rose-950/40 mb-4 leading-relaxed">
                  Open the long gossip shelf and write a multi-chapter book.
                </p>
                <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest">
                  <BookOpen size={12} />
                  Long Gossip Shelf
                </span>
              </div>
            </Link>
          </div>
        )}
      </main>

      {/* Floating Add Buttons */}
      {confessions && (
        <div className="fixed right-4 bottom-6 mobile-fixed-clear-nav sm:right-6 sm:bottom-6 flex flex-col gap-3 z-50">
          <Link
            href={`/b/${slug}/spill`}
            className="w-12 h-12 rounded-full bg-rose-900 border border-white/10 text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all group"
            title="Open Long Gossip shelf"
          >
            <BookOpen
              size={20}
              className="group-hover:-rotate-6 transition-transform"
            />
          </Link>
          <Link
            href={`/b/${slug}/${isAdmirerMode ? "admirer" : "confess"}`}
            className="w-12 h-12 rounded-full text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all"
            title={isAdmirerMode ? "Send Love Letter" : "Drop a Confession"}
            style={{
              background: isAdmirerMode
                ? "linear-gradient(135deg, #9B3A5C, #7B2040)"
                : "#000",
              boxShadow: isAdmirerMode
                ? "0 8px 24px rgba(155, 58, 92, 0.35)"
                : "0 8px 24px rgba(0,0,0,0.2)",
            }}
          >
            {isAdmirerMode ? <Heart size={20} /> : <Plus size={22} />}
          </Link>
        </div>
      )}

      {/* Real-time Toast */}
      {showToast && (
        <div
          className="fixed bottom-24 mobile-fixed-clear-nav-lg sm:bottom-24 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full shadow-xl flex items-center gap-3 z-50 animate-[slideUp_0.3s_ease-out]"
          style={{
            background: isAdmirerMode
              ? "linear-gradient(135deg, #9B3A5C, #7B2040)"
              : "#000",
            color: "#fff",
            boxShadow: isAdmirerMode
              ? "0 8px 32px rgba(155, 58, 92, 0.3)"
              : "0 8px 24px rgba(0,0,0,0.2)",
          }}
        >
          {isAdmirerMode ? (
            <Heart
              size={14}
              fill="currentColor"
              style={{ color: "rgba(255,200,200,0.6)" }}
            />
          ) : (
            <Bell size={14} className="text-green-400 rotate-12" />
          )}
          <span className="text-[11px] font-bold uppercase tracking-widest">
            {isAdmirerMode
              ? "Someone sent a love letter! 💌"
              : "Someone spilled new tea!"}
          </span>
        </div>
      )}

      {/* Confess Back CTA */}
      <AnimatePresence>
        {showConfessBackCTA && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-6 mobile-fixed-clear-nav left-4 right-4 sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 sm:w-[400px] z-[60] text-white rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #111 0%, #1a1a1a 100%)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
            }}
          >
            <div className="p-5 flex flex-col gap-3 relative">
              <button
                onClick={() => {
                  setShowConfessBackCTA(false);
                  localStorage.setItem("teaa_dismissed_cta", "true");
                }}
                className="absolute top-3 right-3 text-white/40 hover:text-white transition-colors"
                title="Dismiss"
              >
                <X size={16} />
              </button>

              <div className="flex items-start gap-4 mb-2">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl">
                  {isAdmirerMode ? "💌" : "🫖"}
                </div>
                <div>
                  <h4 className="font-[900] text-base mb-1.5 tracking-wide serif text-white flex items-center gap-2">
                    Your turn now ✨
                  </h4>
                  <p className="text-[11px] text-white/70 leading-relaxed font-medium mb-3 pr-2">
                    {isAdmirerMode
                      ? "Create your own board. Find out who secretly admires you and let them react!"
                      : "Get anonymous messages from friends. You choose the vibe, they spill the tea!"}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {!isAdmirerMode && (
                      <span className="px-2 py-1 bg-white/10 border border-white/10 rounded-md text-[9px] font-bold text-white/90 uppercase tracking-widest flex items-center gap-1">
                        🤫 Confessions
                      </span>
                    )}
                    {!isAdmirerMode && (
                      <span className="px-2 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-200 rounded-md text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                        🔥 Spills
                      </span>
                    )}
                    {!isAdmirerMode && (
                      <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-200 rounded-md text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                        🎙️ Voice
                      </span>
                    )}
                    <span className="px-2 py-1 bg-[#be185d]/20 border border-[#be185d]/30 text-pink-200 rounded-md text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                      💝 Admirer
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex gap-3">
                <Link
                  href={
                    isAdmirerMode ? "/create?type=secret-admirer" : "/create"
                  }
                  className="flex-1 bg-white text-black py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-center hover:scale-[1.02] hover:bg-white/90 active:scale-95 transition-all shadow-lg"
                >
                  Create My Board →
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfessBackCTA(false);
                    localStorage.setItem("teaa_dismissed_cta", "true");
                  }}
                  className="flex-1 border border-white/10 bg-white/5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/70 hover:bg-white/10 hover:text-white active:scale-95 transition-all"
                >
                  Maybe Later ✕
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
