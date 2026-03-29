"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CATEGORY_INFO, timeAgo } from "@/app/lib/utils";
import Link from "next/link";
import { Home, ArrowRight } from "lucide-react";
import ConfessionFlipCard from "@/app/components/ConfessionFlipCard";
import { THEMES } from "@/convex/helpers";

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
  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollAccum = useRef(0);
  const scrollCooldown = useRef(false);

  const globalFeed = useQuery(api.confessions.globalFeed, {
    category: selectedCategory === "all" ? undefined : selectedCategory,
  });
  const publicBoards = useQuery(api.boards.listPublicWithCounts);
  const allSpills = useQuery(api.spills.listAll);
  const teaaOfDay = useQuery(api.confessions.confessionOfTheDay);
  const spillOfDay = useQuery(api.spills.spillOfTheDay);

  useEffect(() => {
    if (globalFeed) {
      setActiveIndex(Math.floor(globalFeed.length / 2));
    }
  }, [selectedCategory, globalFeed?.length]);

  const scrollToCard = useCallback(
    (index: number) => {
      if (!globalFeed || index < 0 || index >= globalFeed.length) return;
      setActiveIndex(index);
    },
    [globalFeed],
  );

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
        <Link
          href="/confess"
          className="text-[10px] text-black/40 hover:text-black font-medium transition-colors"
        >
          Add confession
        </Link>
        <Link
          href="/spill/create"
          className="text-[10px] text-rose-600/60 hover:text-rose-600 font-medium transition-colors"
        >
          Write a spill
        </Link>
      </header>

      <main className="max-w-5xl mx-auto">
        {/* Compact hero */}
        <div className="pt-10 pb-2 text-center">
          <h1 className="text-3xl font-black tracking-tight serif text-black">
            Teaaa!
          </h1>
        </div>

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
                {globalFeed.map((confession, i) => {
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
                      className="absolute transition-all duration-500 ease-out"
                      style={{
                        width: "280px",
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
                        <ConfessionFlipCard
                          confession={confession}
                          boardSlug={confession.boardSlug}
                        />
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
          <section className="px-4 mb-16">
            <div className="max-w-4xl mx-auto space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Teaa of the Day */}
                {teaaOfDay && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-black/25">
                        ☕ Teaa of the Day
                      </h2>
                    </div>
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/10 to-rose-500/10 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
                      <div className="relative">
                        <ConfessionFlipCard confession={teaaOfDay} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Spill of the Day */}
                {spillOfDay && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-black/25">
                        🔥 Spill of the Day
                      </h2>
                    </div>
                    <Link
                      href={`/b/${spillOfDay.boardSlug}/s/${spillOfDay._id}`}
                      className="group block relative"
                    >
                      <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 to-rose-500/20 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
                      <article className="relative rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="flex gap-6">
                          <div
                            className="w-24 aspect-[3/4] rounded-xl overflow-hidden shadow-lg flex-shrink-0"
                            style={{
                              background: spillOfDay.aiImageUrl
                                ? `url(${spillOfDay.aiImageUrl}) center/cover`
                                : THEMES.find(
                                    (t) => t.key === spillOfDay.coverTheme,
                                  )?.bg || "#f5f5f5",
                            }}
                          >
                            <div
                              className={`size-full flex flex-col items-center justify-center p-2 text-center ${spillOfDay.aiImageUrl ? "bg-black/40" : ""}`}
                            >
                              {!spillOfDay.aiImageUrl && (
                                <div className="text-2xl mb-1">
                                  {spillOfDay.coverEmoji}
                                </div>
                              )}
                              <div className="w-4 h-px bg-white/30" />
                            </div>
                          </div>
                          <div className="flex-1 flex flex-col justify-center">
                            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-black/20 mb-2">
                              Deep Spill
                            </span>
                            <h3 className="serif text-xl font-black leading-tight text-black mb-3 group-hover:text-orange-600 transition-colors">
                              {spillOfDay.title}
                            </h3>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-bold text-black/40">
                                {spillOfDay.displayName}
                              </span>
                              <span className="text-black/10">·</span>
                              <span className="text-[10px] text-black/20 font-bold uppercase tracking-wider">
                                {spillOfDay.totalReactions} 🔥
                              </span>
                            </div>
                          </div>
                        </div>
                      </article>
                    </Link>
                  </div>
                )}
              </div>
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
                          absolute -top-3 -left-1 w-9 h-9 rounded-2xl flex items-center justify-center text-[12px] font-black text-white shadow-lg z-20 transition-transform group-hover:scale-110
                          ${isTop3 ? `bg-gradient-to-br ${rankColors[idx]}` : "bg-black text-white/50"}
                        `}
                        >
                          {idx === 0
                            ? "🥇"
                            : idx === 1
                              ? "🥈"
                              : idx === 2
                                ? "🥉"
                                : `#${idx + 1}`}
                        </div>

                        <article className="rounded-[2rem] border border-black/5 bg-white p-5 transition-all hover:shadow-2xl hover:shadow-black/5 group-hover:-translate-y-1">
                          <div
                            className="relative mx-auto aspect-[3/4] w-full rounded-2xl overflow-hidden shadow-inner"
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

        {/* ── Boards / Links Section ── */}
        {publicBoards && publicBoards.length > 0 && (
          <section className="px-4 pb-16">
            <div className="border-t border-black/5 pt-8">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-black/25">
                  Confession Boards
                </h2>
                <span className="text-[10px] text-black/15 font-medium">
                  {publicBoards.length}{" "}
                  {publicBoards.length === 1 ? "board" : "boards"} active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {publicBoards.map((board) => (
                  <Link
                    key={board._id}
                    href={`/b/${board.slug}`}
                    className="flex items-center gap-4 p-4 rounded-xl border border-black/5 bg-black/[0.01] hover:bg-black/[0.03] transition-all group"
                  >
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-lg flex-shrink-0">
                      🫖
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-black truncate">
                        {board.name}
                      </h3>
                      {board.tagline && (
                        <p className="text-[10px] text-black/30 italic truncate">
                          &quot;{board.tagline}&quot;
                        </p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <span className="text-lg font-black text-black/70 block leading-none">
                          {board.confessionCount + (board.spillCount ?? 0)}
                        </span>
                        <span className="text-[8px] font-bold uppercase tracking-wider text-black/20">
                          {board.spillCount > 0
                            ? `${board.confessionCount} confessions · ${board.spillCount} spills`
                            : "confessions"}
                        </span>
                      </div>
                      <ArrowRight
                        size={14}
                        className="text-black/15 group-hover:text-black/40 group-hover:translate-x-0.5 transition-all"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
