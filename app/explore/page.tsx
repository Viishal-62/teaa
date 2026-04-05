"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CATEGORY_INFO, timeAgo } from "@/app/lib/utils";
import Link from "next/link";
import {
  Home,
  ArrowRight,
  Shuffle,
  Mic,
  Zap,
  X,
  Plus,
  BookOpen,
} from "lucide-react";
import ConfessionFlipCard from "@/app/components/ConfessionFlipCard";
import DoodleConfessionCard from "@/app/components/DoodleConfessionCard";
import SummaryCard from "@/app/components/SummaryCard";
import MoodRing from "@/app/components/MoodRing";
import { THEMES } from "@/convex/helpers";
import { motion, AnimatePresence } from "framer-motion";
import type { Id } from "@/convex/_generated/dataModel";

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

export default function ExplorePage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeIndex, setActiveIndex] = useState(0);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollAccum = useRef(0);
  const scrollCooldown = useRef(false);

  const [showConfessBackCTA, setShowConfessBackCTA] = useState(false);
  const viewedIndexes = useRef<Set<number>>(new Set());

  const rawGlobalFeed = useQuery(api.confessions.globalFeed, {
    category: selectedCategory === "all" ? undefined : selectedCategory,
  });

  const summarize = useAction(api.ai.summarizeGlobal);

  // Filter out voice confessions — they live at /explore/voice
  const globalFeed = useMemo(
    () => rawGlobalFeed?.filter((c: any) => c.type !== "voice"),
    [rawGlobalFeed],
  );

  const publicBoards = useQuery(api.boards.listPublicWithCounts);
  const allSpills = useQuery(api.spills.listAll);
  const teaaOfDay = useQuery(api.confessions.confessionOfTheDay);
  const spillOfDay = useQuery(api.spills.spillOfTheDay);
  const globalMood = useQuery(api.confessions.getGlobalMoodDistribution);

  useEffect(() => {
    if (globalFeed) {
      setActiveIndex(Math.floor(globalFeed.length / 2));
    }
  }, [selectedCategory, globalFeed?.length]);

  // Track viewed confessions for CTA
  useEffect(() => {
    if (globalFeed && globalFeed.length > 0) {
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
          osc.frequency.setValueAtTime(500, ctx.currentTime);
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
  }, [activeIndex, globalFeed, showConfessBackCTA]);

  const scrollToCard = useCallback(
    (index: number) => {
      if (!globalFeed || index < 0 || index >= globalFeed.length) return;
      setActiveIndex(index);
    },
    [globalFeed],
  );

  const shuffleTea = useCallback(() => {
    if (!globalFeed || globalFeed.length < 2) return;
    let next = activeIndex;
    while (next === activeIndex) {
      next = Math.floor(Math.random() * globalFeed.length);
    }
    setActiveIndex(next);
  }, [activeIndex, globalFeed]);

  const handleSummarize = async () => {
    setIsGenerating(true);
    try {
      const summary = await summarize({});
      setAiSummary(summary);
    } catch (err: any) {
      console.error("Summarization failed", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const hasEnoughForSummary = (globalFeed?.length ?? 0) >= 10;

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        scrollToCard(activeIndex + 1);
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        scrollToCard(activeIndex - 1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeIndex, scrollToCard]);

  // Trackpad / mousewheel scroll → navigate cards
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      // Accumulate scroll delta (handles smooth trackpad)
      scrollAccum.current += e.deltaY;

      const THRESHOLD = 80; // pixels of scroll to trigger a card change

      if (
        Math.abs(scrollAccum.current) >= THRESHOLD &&
        !scrollCooldown.current
      ) {
        const direction = scrollAccum.current > 0 ? 1 : -1;
        scrollToCard(activeIndex + direction);
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

  return (
    <div className="min-h-screen page-enter bg-white text-[#111]">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-5 py-3 bg-white/85 backdrop-blur-xl border-b border-black/5">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-black/35 hover:text-black transition-colors"
        >
          <Home size={16} />
        </Link>
        <h1 className="text-[10px] font-black uppercase tracking-[0.25em] text-black/25">
          Confessions
        </h1>
        <div className="flex items-center gap-3">
          <Link
            href="/confess"
            className="flex items-center gap-1.5 text-[10px] text-black/40 hover:text-black font-medium transition-colors"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Add confession</span>
          </Link>
          <Link
            href="/explore/voice"
            className="flex items-center gap-1.5 text-[10px] text-black/40 hover:text-black font-medium transition-colors"
          >
            <Mic size={14} />
            <span className="hidden sm:inline">Voice</span>
          </Link>
          <Link
            href="/spill/create"
            className="flex items-center gap-1.5 text-[10px] text-rose-600/60 hover:text-rose-600 font-medium transition-colors"
          >
            <BookOpen size={14} />
            <span className="hidden sm:inline">Write a spill</span>
          </Link>
          {/* Premium Summarize Button (Gradient Border) */}
          {hasEnoughForSummary && (
            <button
              onClick={handleSummarize}
              disabled={isGenerating}
              className="group relative inline-flex h-9 px-3 sm:min-w-[140px] sm:px-6 items-center justify-center overflow-hidden rounded-full p-[1.5px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 active:scale-95 disabled:opacity-60 transition-all font-bold ml-1"
            >
              {/* Rotating Gradient Border */}
              <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#8b5cf6_0%,#ec4899_50%,#8b5cf6_100%)]" />

              {/* Inner button surface */}
              <span className="inline-flex h-full w-full items-center justify-center gap-1.5 rounded-full bg-white px-2 sm:px-4 text-[9px] uppercase tracking-[0.2em] text-[#111] backdrop-blur-3xl transition-colors group-hover:bg-white/95">
                {isGenerating ? (
                  <>
                    <div className="w-2.5 h-2.5 border-[1.5px] border-pink-400/30 border-t-pink-500 rounded-full animate-spin" />
                    <span className="hidden sm:inline">Brewing...</span>
                  </>
                ) : (
                  <>
                    <Zap size={11} className="text-pink-500" />
                    <span className="hidden md:inline">Summarization</span>
                  </>
                )}
              </span>
            </button>
          )}
        </div>
      </header>

      {/* Shimmer animation */}
      <style jsx>{`
        @keyframes shimmerSweep {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <main className="max-w-5xl mx-auto">
        {/* Hero Section */}
        <div className="pt-8 pb-6 px-4 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center sm:items-start gap-5 w-full sm:w-auto">
            <h1 className="text-4xl font-black tracking-tight serif text-black text-center sm:text-left">
              Teaaa!
            </h1>
            <Link
              href="/boards"
              className="group relative inline-flex h-11 items-center justify-center overflow-hidden rounded-full p-[2px] font-bold focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 hover:scale-[1.02] active:scale-95 transition-all w-full sm:w-auto"
            >
              <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#f43f5e_0%,#f97316_50%,#f43f5e_100%)]" />
              <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-white px-7 py-1 text-[11px] uppercase tracking-widest text-[#111] backdrop-blur-3xl transition-colors group-hover:bg-white/95 shadow-sm">
                Explore All Boards ✨
              </span>
            </Link>
          </div>

          {/* Global Mood Ring */}
          {globalMood && globalMood.total >= 3 && (
            <div className="sm:scale-90 origin-right transition-transform flex-shrink-0">
              <MoodRing moodData={globalMood} />
            </div>
          )}
        </div>

        {/* AI Vibe Summary Result */}
        <AnimatePresence mode="wait">
          {aiSummary && (
            <div className="px-4 mb-6">
              <SummaryCard
                key="summary"
                summary={aiSummary}
                type="global"
                onClose={() => setAiSummary(null)}
              />
            </div>
          )}
        </AnimatePresence>

        {/* Carousel */}
        <div className="relative px-4 pb-4">
          {globalFeed === undefined ? (
            <div className="flex justify-center py-24">
              <div className="w-8 h-8 border-3 border-black/5 border-t-black/40 rounded-full animate-spin" />
            </div>
          ) : globalFeed.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-4xl block mb-4">🤐</span>
              <p className="text-lg font-bold serif mb-1">No confessions yet</p>
              <p className="text-xs text-black/35 mb-6">
                Be the first to spill the tea.
              </p>
              <Link
                href="/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all"
              >
                Create a Board
              </Link>
            </div>
          ) : (
            <>
              {/* Coverflow carousel */}
              <div
                ref={carouselRef}
                className="relative flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
                style={{ height: "420px", perspective: "1200px" }}
              >
                {globalFeed.map((confession: any, i: any) => {
                  const offset = i - activeIndex;
                  const absOffset = Math.abs(offset);

                  if (absOffset > 4) return null;

                  const translateX = offset * 160;
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
                  const rotateY = offset > 0 ? -30 : offset < 0 ? 30 : 0;
                  const zIndex = 20 - absOffset;

                  return (
                    <div
                      key={confession._id}
                      className="absolute transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
                      style={{
                        width: "280px",
                        transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                        opacity,
                        zIndex,
                      }}
                    >
                      <div
                        style={{
                          pointerEvents: absOffset === 0 ? "auto" : "none",
                        }}
                      >
                        {confession.type === "canvas" ||
                        confession.canvasImageUrl ? (
                          <DoodleConfessionCard
                            confession={confession as any}
                            boardSlug={confession.boardSlug}
                          />
                        ) : (
                          <ConfessionFlipCard
                            confession={confession as any}
                            boardSlug={confession.boardSlug}
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

              {/* Hint */}
              <p className="text-center text-[10px] text-black/20 font-medium mt-1 mb-2">
                Scroll · ← → keys · tap to flip
              </p>

              {globalFeed.length > 1 && (
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
              {globalFeed.length > 1 && (
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
                    {activeIndex + 1} / {globalFeed.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => scrollToCard(activeIndex + 1)}
                    disabled={activeIndex === globalFeed.length - 1}
                    className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center text-black/30 hover:text-black hover:border-black/30 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Category Filters */}
        <div className="mb-6 overflow-x-auto pb-3 px-4 no-scrollbar">
          <div className="flex gap-1.5 min-w-max justify-center">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.key;
              const catInfo = CATEGORY_INFO[cat.key];
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.key);
                    setActiveIndex(0);
                  }}
                  className="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap active:scale-95"
                  style={{
                    background: isActive
                      ? (catInfo?.color ?? "#000")
                      : "transparent",
                    color: isActive ? "#fff" : "rgba(0,0,0,0.35)",
                    border: `1px solid ${isActive ? "transparent" : "rgba(0,0,0,0.08)"}`,
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Daily Highlights ── */}
        {(teaaOfDay || spillOfDay) && (
          <section className="px-4 mb-20">
            <div className="max-w-3xl mx-auto flex flex-col gap-16">
              {/* Teaa of the Day */}
              {teaaOfDay && (
                <div className="flex flex-col items-center w-full">
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-sm shadow-sm">
                      ☕
                    </div>
                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-black/40">
                      Teaa of the Day
                    </h2>
                  </div>
                  <div className="relative group w-full max-w-sm mx-auto">
                    <div className="relative flex justify-center transform group-hover:-translate-y-1 transition-transform duration-500 w-full">
                      <div className="w-full">
                        <ConfessionFlipCard confession={teaaOfDay as any} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Spill of the Day */}
              {spillOfDay && (
                <div className="flex flex-col items-center w-full">
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-sm shadow-sm">
                      🔥
                    </div>
                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-black/40">
                      Spill of the Day
                    </h2>
                  </div>
                  <Link
                    href={`/b/${spillOfDay.boardSlug}/s/${spillOfDay._id}`}
                    className="group block relative w-full"
                  >
                    <article className="relative overflow-hidden rounded-[2.5rem] border border-white/40 bg-white/60 p-6 md:p-8 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-500 flex flex-col sm:flex-row gap-6 md:gap-8 items-center sm:items-stretch group-hover:-translate-y-1">
                      {/* Image side */}
                      <div
                        className="w-full sm:w-40 aspect-[3/4] sm:aspect-auto rounded-2xl overflow-hidden shadow-lg flex-shrink-0 group-hover:scale-[1.02] transition-transform duration-500"
                        style={{
                          background: spillOfDay.aiImageUrl
                            ? `url(${spillOfDay.aiImageUrl}) center/cover`
                            : THEMES.find(
                                (t) => t.key === spillOfDay.coverTheme,
                              )?.bg || "#f5f5f5",
                        }}
                      >
                        <div
                          className={`size-full flex flex-col items-center justify-center p-2 text-center transition-colors duration-500 ${spillOfDay.aiImageUrl ? "bg-black/40 group-hover:bg-black/20" : ""}`}
                        >
                          {!spillOfDay.aiImageUrl && (
                            <div className="text-4xl mb-2 drop-shadow-md">
                              {spillOfDay.coverEmoji}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Content side */}
                      <div className="flex-1 flex flex-col justify-center text-center sm:text-left">
                        <span className="inline-block px-3 py-1 rounded-full bg-black/5 text-[9px] font-black uppercase tracking-[0.3em] text-black/40 w-fit mx-auto sm:mx-0 mb-4">
                          Long-Form Spill
                        </span>
                        <h3 className="serif text-2xl md:text-3xl font-black leading-tight text-black mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-rose-500 group-hover:to-orange-500 transition-all duration-300">
                          {spillOfDay.title}
                        </h3>
                        <p className="text-sm text-black/50 line-clamp-2 md:line-clamp-3 mb-6 leading-relaxed">
                          {(spillOfDay as any).content || "Read this juicy spill..."}
                        </p>
                        <div className="flex items-center justify-center sm:justify-start gap-3 mt-auto">
                          <span className="text-[11px] font-bold text-black/60 px-3 py-1 rounded-full border border-black/10">
                            {spillOfDay.displayName}
                          </span>
                          <span className="text-[11px] text-black/40 font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-orange-50 text-orange-600">
                            {spillOfDay.totalReactions} 🔥
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── All Deep Spills Section (Ranked) ── */}
        {allSpills && allSpills.length > 0 && (
          <section className="px-4 pb-8">
            <div className="border-t border-black/5 pt-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-lg">
                    🔥
                  </div>
                  <div>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-black/25">
                      Global Ranking
                    </h2>
                    <h3 className="serif text-2xl font-black text-black">
                      Top Stories
                    </h3>
                  </div>
                </div>
                <span className="text-[10px] text-black/15 font-medium">
                  {allSpills.length}{" "}
                  {allSpills.length === 1 ? "story" : "stories"} active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...allSpills]
                  .sort((a, b) => {
                    const scoreA = (a.totalReactions || 0) * 2 + (a.views || 0);
                    const scoreB = (b.totalReactions || 0) * 2 + (b.views || 0);
                    return scoreB - scoreA;
                  })
                  .map((spill, idx) => {
                    const spillTheme =
                      THEMES.find((t) => t.key === spill.coverTheme) ||
                      THEMES[0];
                    const isTop3 = idx < 3;
                    const rankColors = [
                      "from-amber-400 to-amber-600 shadow-amber-500/20", // 1st: Gold
                      "from-slate-300 to-slate-500 shadow-slate-400/20", // 2nd: Silver
                      "from-orange-400 to-orange-700 shadow-orange-600/20", // 3rd: Bronze
                    ];

                    return (
                      <Link
                        key={spill._id}
                        href={`/b/${spill.boardSlug}/s/${spill._id}`}
                        className="group block relative"
                      >
                        {/* Rank Badge */}
                        <div
                          className={`
                          absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-lg border-[3px] border-white z-20 transition-transform group-hover:scale-110 group-hover:rotate-6
                          ${isTop3 ? `bg-gradient-to-br ${rankColors[idx]}` : "bg-slate-800"}
                        `}
                        >
                          {idx === 0
                            ? "🥇"
                            : idx === 1
                              ? "🥈"
                              : idx === 2
                                ? "🥉"
                                : `${idx + 1}`}
                        </div>

                        <article className="rounded-3xl border border-white/50 bg-white/60 p-4 transition-all hover:shadow-xl hover:bg-white/80 backdrop-blur-md group-hover:-translate-y-1">
                          <div
                            className="relative mx-auto aspect-[4/5] w-full rounded-2xl overflow-hidden shadow-sm"
                            style={{
                              background: spill.aiImageUrl
                                ? `url(${spill.aiImageUrl}) center/cover`
                                : spillTheme.bg,
                            }}
                          >
                            <div
                              className={`absolute inset-0 flex flex-col justify-between p-4 text-center ${
                                spill.aiImageUrl ? "bg-black/35" : ""
                              }`}
                            >
                              <span
                                className="text-[8px] font-black uppercase tracking-[0.3em]"
                                style={{
                                  color: spill.aiImageUrl
                                    ? "#fff"
                                    : spillTheme.accent,
                                }}
                              >
                                Deep Spill
                              </span>
                              <div>
                                {!spill.aiImageUrl && (
                                  <div className="text-3xl mb-2">
                                    {spill.coverEmoji}
                                  </div>
                                )}
                                <h3
                                  className="serif text-lg font-black leading-tight"
                                  style={{
                                    color: spill.aiImageUrl
                                      ? "#fff"
                                      : spillTheme.text,
                                  }}
                                >
                                  {spill.title}
                                </h3>
                              </div>
                              <span
                                className="text-[8px] uppercase tracking-[0.15em] font-medium opacity-50"
                                style={{
                                  color: spill.aiImageUrl
                                    ? "#fff"
                                    : spillTheme.text,
                                }}
                              >
                                Read Now
                              </span>
                            </div>
                          </div>
                          <div className="mt-3 px-1 flex items-center justify-between">
                            <div>
                              <p className="text-[10px] font-bold text-black/25 uppercase tracking-wider">
                                {spill.displayName}
                              </p>
                              <p className="text-[10px] text-black/15 mt-0.5">
                                {(spill.views ?? 0).toLocaleString()} reads
                              </p>
                            </div>
                            {spill.totalReactions > 0 && (
                              <div className="flex items-center gap-1 bg-orange-500/5 px-2 py-1 rounded-lg">
                                <span className="text-[10px] font-black text-orange-600/60 tabular-nums">
                                  {spill.totalReactions}
                                </span>
                                <span className="text-[10px]">🔥</span>
                              </div>
                            )}
                          </div>
                        </article>
                      </Link>
                    );
                  })}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Confess Back CTA */}
      <AnimatePresence>
        {showConfessBackCTA && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-6 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-[400px] z-[60] text-white rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
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
                  🫖
                </div>
                <div>
                  <h4 className="font-[900] text-base mb-1.5 tracking-wide serif text-white flex items-center gap-2">
                    Your turn now ✨
                  </h4>
                  <p className="text-[11px] text-white/70 leading-relaxed font-medium mb-3 pr-2">
                    Get anonymous messages from friends. You choose the vibe,
                    they spill the tea, and everyone can react!
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-1 bg-white/10 border border-white/10 rounded-md text-[9px] font-bold text-white/90 uppercase tracking-widest flex items-center gap-1">
                      🤫 Confessions
                    </span>
                    <span className="px-2 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-200 rounded-md text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                      🔥 Spills
                    </span>
                    <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-200 rounded-md text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                      🎙️ Voice
                    </span>
                    <span className="px-2 py-1 bg-[#be185d]/20 border border-[#be185d]/30 text-pink-200 rounded-md text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                      💝 Admirer
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex gap-3">
                <Link
                  href="/create"
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
