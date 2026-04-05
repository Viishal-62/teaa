"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CATEGORY_INFO, timeAgo } from "@/app/lib/utils";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Mic, ArrowLeft, Shuffle } from "lucide-react";
import { VoiceConfessionCard } from "@/app/components/VoiceConfessionCard";
import { VoiceConfessModal } from "@/app/components/VoiceConfessModal";
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

export default function VoiceConfessionsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeIndex, setActiveIndex] = useState(0);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [globalBoardId, setGlobalBoardId] = useState<Id<"boards"> | null>(null);

  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollAccum = useRef(0);
  const scrollCooldown = useRef(false);

  const getOrCreateGlobal = useMutation(api.boards.getOrCreateGlobal);

  const voiceFeed = useQuery(api.confessions.voiceFeed, {
    category: selectedCategory === "all" ? undefined : selectedCategory,
  });

  // Get global board on mount
  useEffect(() => {
    (async () => {
      const id = await getOrCreateGlobal();
      setGlobalBoardId(id);
    })();
  }, [getOrCreateGlobal]);

  // Center carousel when feed changes
  useEffect(() => {
    if (voiceFeed) {
      setActiveIndex(Math.floor(voiceFeed.length / 2));
    }
  }, [selectedCategory, voiceFeed?.length]);

  const scrollToCard = useCallback(
    (index: number) => {
      if (!voiceFeed || index < 0 || index >= voiceFeed.length) return;
      setActiveIndex(index);
    },
    [voiceFeed],
  );

  const shuffleConfession = useCallback(() => {
    if (!voiceFeed || voiceFeed.length < 2) return;
    let next = activeIndex;
    while (next === activeIndex) {
      next = Math.floor(Math.random() * voiceFeed.length);
    }
    setActiveIndex(next);
  }, [activeIndex, voiceFeed]);

  // Keyboard nav
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

  // Trackpad / scroll navigation
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      scrollAccum.current += e.deltaY;
      const THRESHOLD = 80;

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
    <div className="min-h-screen bg-white text-[#111]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/explore"
              className="flex items-center gap-1.5 text-black/35 hover:text-black transition-colors"
            >
              <ArrowLeft size={16} />
            </Link>
            <h1 className="text-[10px] font-black uppercase tracking-[0.25em] text-black/25">
              Voice Confessions
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowVoiceModal(true)}
              className="text-[9px] font-bold uppercase tracking-widest text-black/40 hover:text-black transition-colors flex items-center gap-1.5"
            >
              <Mic size={12} />
              Record
            </button>
            <Link
              href="/"
              className="text-black/30 hover:text-black transition-colors"
            >
              <Home size={16} />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="pt-10 pb-4 px-6 text-center"
        >
          <h1 className="text-3xl font-black tracking-tight serif text-black mb-1">
            Hear the Unheard
          </h1>
          <p className="text-sm text-black/35 max-w-sm mx-auto leading-relaxed">
            Real voices. Real confessions. 100% anonymous.
          </p>

          {/* Decorative animated waveform */}
          <div className="flex items-end justify-center gap-[3px] h-5 mt-5 opacity-15">
            {Array(24)
              .fill(0)
              .map((_, i) => (
                <motion.div
                  key={i}
                  className="w-[3px] rounded-full bg-black"
                  animate={{
                    height: [
                      `${6 + Math.sin(i * 0.5) * 4}px`,
                      `${12 + Math.cos(i * 0.7) * 8}px`,
                      `${6 + Math.sin(i * 0.5) * 4}px`,
                    ],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5 + i * 0.04,
                    ease: "easeInOut",
                  }}
                />
              ))}
          </div>
        </motion.div>

        {/* Category Filters */}
        <div className="mb-4 overflow-x-auto pb-2 px-4 no-scrollbar">
          <div className="flex gap-1.5 min-w-max justify-center">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.key;
              const catInfo = CATEGORY_INFO[cat.key];
              return (
                <motion.button
                  key={cat.key}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(cat.key)}
                  className="px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all whitespace-nowrap"
                  style={{
                    background: isActive
                      ? (catInfo?.color ?? "#000")
                      : "transparent",
                    color: isActive ? "#fff" : "rgba(0,0,0,0.3)",
                    border: `1px solid ${isActive ? "transparent" : "rgba(0,0,0,0.06)"}`,
                    boxShadow: isActive
                      ? `0 2px 10px ${catInfo?.color ?? "#000"}30`
                      : "none",
                  }}
                >
                  {cat.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 pb-20">
          {voiceFeed === undefined ? (
            /* Loading state */
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="relative w-12 h-12">
                <motion.div className="absolute inset-0 rounded-full border-2 border-black/5" />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-transparent border-t-black/30"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-black/20">
                Loading confessions...
              </p>
            </div>
          ) : voiceFeed.length === 0 ? (
            /* Empty state — with record button, not "create board" */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-24"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-20 h-20 rounded-2xl bg-black/[0.02] mx-auto mb-5 flex items-center justify-center"
              >
                <Mic size={32} className="text-black/15" />
              </motion.div>
              <p className="text-lg font-bold serif text-black mb-1">
                No voice confessions yet
              </p>
              <p className="text-xs text-black/30 mb-6 max-w-xs mx-auto">
                Be the first to drop a voice confession. Record your thoughts
                anonymously.
              </p>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowVoiceModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-black/10 transition-all"
              >
                <Mic size={14} />
                Record a Confession
              </motion.button>
            </motion.div>
          ) : (
            <>
              {/* Shuffle + count */}
              <div className="flex items-center justify-center gap-4 mb-2">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-black/15">
                  {voiceFeed.length} voice{" "}
                  {voiceFeed.length === 1 ? "confession" : "confessions"}
                </span>
                {voiceFeed.length > 1 && (
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 180 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={shuffleConfession}
                    className="w-7 h-7 rounded-full bg-black/[0.03] flex items-center justify-center text-black/25 hover:text-black/60 transition-colors"
                  >
                    <Shuffle size={12} />
                  </motion.button>
                )}
              </div>

              {/* ── Coverflow Carousel ── */}
              <div
                ref={carouselRef}
                className="relative flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
                style={{ height: "440px", perspective: "1200px" }}
              >
                {voiceFeed.map((confession: any, i: any) => {
                  const offset = i - activeIndex;
                  const absOffset = Math.abs(offset);

                  if (absOffset > 3) return null;

                  // Voice cards are wider so use different spacing
                  const translateX = offset * 200;
                  const translateZ =
                    absOffset === 0 ? 50 : -120 - absOffset * 50;
                  const scale =
                    absOffset === 0
                      ? 1.02
                      : Math.max(0.75 - absOffset * 0.06, 0.55);
                  const opacity =
                    absOffset === 0
                      ? 1
                      : Math.max(0.55 - absOffset * 0.15, 0.1);
                  const rotateY = offset > 0 ? -25 : offset < 0 ? 25 : 0;
                  const zIndex = 20 - absOffset;

                  return (
                    <div
                      key={confession._id}
                      className="absolute transition-all duration-500 ease-out"
                      style={{
                        width: "340px",
                        maxWidth: "90vw",
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
                        <VoiceConfessionCard
                          id={confession._id as string}
                          audioUrl={confession.audioUrl!}
                          category={confession.category}
                          voiceTitle={confession.voiceTitle}
                          displayName={confession.displayName}
                          views={confession.views}
                          timestamp={timeAgo(confession.createdAt)}
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

              {/* Navigation hint */}
              <p className="text-center text-[10px] text-black/15 font-medium mt-1 mb-4">
                Scroll or use ← → arrows to browse
              </p>

              {/* Dot indicators */}
              {voiceFeed.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 mb-6">
                  {voiceFeed.map((_: any, i: any) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => scrollToCard(i)}
                      className={`rounded-full transition-all duration-300 ${
                        i === activeIndex
                          ? "w-5 h-1.5 bg-black/40"
                          : "w-1.5 h-1.5 bg-black/10 hover:bg-black/20"
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Record CTA */}
              <div className="text-center pt-2 pb-8">
                <motion.button
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowVoiceModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-black/10 transition-all"
                >
                  <Mic size={14} />
                  Drop yours
                </motion.button>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Voice Confess Modal */}
      {globalBoardId && (
        <VoiceConfessModal
          isOpen={showVoiceModal}
          boardId={globalBoardId}
          onClose={() => setShowVoiceModal(false)}
          onSuccess={() => setShowVoiceModal(false)}
        />
      )}
    </div>
  );
}
