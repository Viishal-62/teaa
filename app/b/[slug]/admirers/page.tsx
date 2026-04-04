"use client";

import { useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  LocateFixed,
  Shuffle,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AmbientAudioPlayer from "@/app/components/AmbientAudioPlayer";
import MemoryStickyCard from "@/app/components/MemoryStickyCard";
import { timeAgo } from "@/app/lib/utils";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";

const ADMIRER_CATEGORIES = [
  "crush",
  "compliment",
  "attraction",
  "gratitude",
  "admiration",
  "confession",
  "secret-admirer",
];

const READING_PALETTES = [
  ["#331427", "#6a2250", "#b44f85", "#e7a4cc"],
  ["#1d1d42", "#38307f", "#6653cf", "#b8adff"],
  ["#112426", "#1f5457", "#3f8782", "#a8e4dc"],
  ["#261912", "#5a3428", "#9f5f48", "#e9b289"],
];

const PLAYFUL_FLOATERS = ["💖", "✨", "💌", "🌙", "⭐", "🫶"];

type ViewMode = "desk" | "reading";

function randomSeeded(seed: number) {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
}

function formatCategory(category: string) {
  return category
    .replace(/-/g, " ")
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function AdmirersPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const queryIndex = Number(searchParams.get("index") ?? 0);

  const board = useQuery(api.boards.getBySlug, { slug });
  const allConfessions = useQuery(
    api.confessions.listByBoard,
    board ? { boardId: board._id } : "skip",
  );

  const admirers: Doc<"confessions">[] =
    allConfessions?.filter((item: Doc<"confessions">) =>
      ADMIRER_CATEGORIES.includes(item.category),
    ) ?? [];

  const initialIndex = Number.isFinite(queryIndex)
    ? Math.max(0, queryIndex)
    : 0;
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [viewMode, setViewMode] = useState<ViewMode>(
    searchParams.get("index") ? "reading" : "desk",
  );
  const [paletteIndex, setPaletteIndex] = useState(
    initialIndex % READING_PALETTES.length,
  );
  const [shuffleSeed, setShuffleSeed] = useState(1);
  const [viewportWidth, setViewportWidth] = useState(1280);

  const deskRef = useRef<HTMLDivElement>(null);
  const scrollAccumulator = useRef(0);
  const scrollingBlocked = useRef(false);

  useEffect(() => {
    const updateViewport = () => setViewportWidth(window.innerWidth);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    if (!admirers.length) return;
    if (currentIndex <= admirers.length - 1) return;
    setCurrentIndex(admirers.length - 1);
  }, [admirers.length, currentIndex]);

  const cardPositions = useMemo(() => {
    if (!admirers.length) return [];

    const isMobile = viewportWidth < 700;
    const center = (admirers.length - 1) / 2;
    const spreadX = isMobile ? 100 : 420;
    const spreadY = isMobile ? 90 : 260;
    const baseStep = isMobile ? 54 : 145;

    return admirers.map((_, index) => {
      const seed = shuffleSeed * 97 + index * 41;
      const randomX = (randomSeeded(seed + 1) - 0.5) * spreadX * 2;
      const randomY = (randomSeeded(seed + 2) - 0.5) * spreadY * 2;
      const randomRotate = (randomSeeded(seed + 3) - 0.5) * 18;

      const x = (index - center) * baseStep + randomX;
      const y = Math.abs(index - center) * 16 + randomY;
      return { x, y, rotate: randomRotate };
    });
  }, [admirers, shuffleSeed, viewportWidth]);

  const currentConfession = admirers[currentIndex];
  const currentPalette = READING_PALETTES[paletteIndex];

  const openReading = (index: number) => {
    setCurrentIndex(index);
    setPaletteIndex(index % READING_PALETTES.length);
    setViewMode("reading");
  };

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => {
      const next = prev < admirers.length - 1 ? prev + 1 : prev;
      if (next !== prev) setPaletteIndex((next + 1) % READING_PALETTES.length);
      return next;
    });
  }, [admirers.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => {
      const next = prev > 0 ? prev - 1 : prev;
      if (next !== prev) {
        setPaletteIndex(
          next % READING_PALETTES.length < 0
            ? READING_PALETTES.length - 1
            : next % READING_PALETTES.length,
        );
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (viewMode !== "reading") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === "ArrowDown") goNext();
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") goPrev();
      if (event.key === "Escape") setViewMode("desk");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev, viewMode]);

  useEffect(() => {
    if (viewMode !== "reading") return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      scrollAccumulator.current += event.deltaY;
      const threshold = 80;
      if (
        Math.abs(scrollAccumulator.current) < threshold ||
        scrollingBlocked.current
      ) {
        return;
      }
      if (scrollAccumulator.current > 0) goNext();
      else goPrev();
      scrollAccumulator.current = 0;
      scrollingBlocked.current = true;
      window.setTimeout(() => {
        scrollingBlocked.current = false;
      }, 280);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [goNext, goPrev, viewMode]);

  if (board === undefined || allConfessions === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#140f13]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-white/60" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden text-white bg-[#120d11]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,#3a1a2d_0%,#211520_45%,#120d11_100%)]" />
      <div className="absolute inset-0 opacity-[0.16] bg-[radial-gradient(circle_at_20%_15%,#ffdbe8_0%,transparent_40%),radial-gradient(circle_at_80%_85%,#e5b4c8_0%,transparent_35%)]" />
      <div className="absolute inset-0 opacity-[0.08] bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22%3E%3Cpath fill=%22%23fff%22 fill-opacity=%220.6%22 d=%22M0 0h1v1H0zM30 30h1v1h-1zM59 59h1v1h-1z%22/%3E%3C/svg%3E')]" />

      {PLAYFUL_FLOATERS.map((item, index) => (
        <motion.div
          key={item}
          className="absolute text-lg pointer-events-none"
          style={{
            left: `${8 + index * 14}%`,
            top: `${12 + ((index * 11) % 70)}%`,
          }}
          animate={{ y: [0, -10, 0], opacity: [0.25, 0.6, 0.25] }}
          transition={{
            duration: 3.2 + index * 0.2,
            repeat: Number.POSITIVE_INFINITY,
          }}
        >
          {item}
        </motion.div>
      ))}

      <div className="absolute top-0 left-0 right-0 z-40 p-4 sm:p-6 flex items-center justify-between">
        <Link
          href={`/b/${slug}`}
          className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/30 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/80 hover:text-white hover:border-white/45 transition-all backdrop-blur-xl"
        >
          <ArrowLeft size={14} />
          Back
        </Link>
        <div className="flex items-center gap-2">
          {viewMode === "desk" ? (
            <>
              <button
                type="button"
                onClick={() => setShuffleSeed((prev) => prev + 1)}
                className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-black/35 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-white/80 font-bold hover:bg-black/55 transition-all"
              >
                <Shuffle size={12} />
                Shuffle
              </button>
              <button
                type="button"
                onClick={() => setShuffleSeed(1)}
                className="rounded-full border border-white/25 bg-black/35 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-white/70 font-bold hover:bg-black/55 transition-all"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setShuffleSeed((prev) => prev + 101)}
                className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-black/35 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-white/80 font-bold hover:bg-black/55 transition-all"
              >
                <LocateFixed size={12} />
                Show all
              </button>
            </>
          ) : (
            <div className="rounded-full border border-white/25 bg-black/35 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-white/75 font-bold backdrop-blur-xl">
              Reading View
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {viewMode === "desk" ? (
          <motion.div
            key={`desk-${shuffleSeed}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20"
          >
            <div ref={deskRef} className="absolute inset-0 overflow-hidden">
              <div className="text-center pt-24 px-4 relative z-10 pointer-events-none">
                <p className="text-[10px] uppercase tracking-[0.34em] text-white/55">
                  Memory Wall
                </p>
                <h1 className="mt-2 text-2xl sm:text-3xl font-black serif text-white/95">
                  {board?.name ?? "Secret Admirers"}
                </h1>
                <p className="mt-1 text-[12px] text-white/65">
                  {admirers.length} pinned moments • drag, drop, and shuffle
                </p>
              </div>

              {!admirers.length ? (
                <div className="h-full flex items-center justify-center px-5">
                  <div className="rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl p-8 text-center max-w-md">
                    <h2 className="text-2xl serif font-black">
                      No memories yet
                    </h2>
                    <p className="mt-2 text-sm text-white/70">
                      Start this wall with the first admirer card.
                    </p>
                    <Link
                      href={`/b/${slug}/admirer`}
                      className="mt-6 inline-block rounded-2xl bg-gradient-to-r from-[#c95884] to-[#8f3156] px-5 py-3 text-xs font-bold uppercase tracking-[0.16em]"
                    >
                      Create first memory
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0">
                  <div className="absolute inset-0 opacity-[0.12] bg-[linear-gradient(to_right,transparent_0%,rgba(255,255,255,0.08)_50%,transparent_100%)]" />
                  <div className="absolute inset-0 opacity-[0.12] bg-[radial-gradient(circle_at_50%_58%,rgba(255,255,255,0.08)_0%,transparent_62%)]" />
                  {admirers.map((confession, index) => {
                    const position = cardPositions[index];
                    return (
                      <MemoryStickyCard
                        key={confession._id}
                        confession={confession}
                        rotateAmount={position.rotate}
                        offsetX={position.x}
                        offsetY={position.y}
                        dragBoundsRef={deskRef}
                        onClick={() => openReading(index)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {viewMode === "reading" && currentConfession ? (
          <motion.div
            key={`reading-${currentConfession._id}`}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 z-50"
          >
            <div className="absolute inset-0">
              <motion.div
                animate={{
                  background: `radial-gradient(circle at 18% 22%, ${currentPalette[0]} 0%, transparent 55%)`,
                }}
                transition={{ duration: 0.65 }}
                className="absolute inset-0"
              />
              <motion.div
                animate={{
                  background: `radial-gradient(circle at 82% 18%, ${currentPalette[1]} 0%, transparent 55%)`,
                }}
                transition={{ duration: 0.65 }}
                className="absolute inset-0"
              />
              <motion.div
                animate={{
                  background: `radial-gradient(circle at 18% 84%, ${currentPalette[2]} 0%, transparent 50%)`,
                }}
                transition={{ duration: 0.65 }}
                className="absolute inset-0"
              />
              <motion.div
                animate={{
                  background: `radial-gradient(circle at 82% 84%, ${currentPalette[3]} 0%, transparent 54%)`,
                }}
                transition={{ duration: 0.65 }}
                className="absolute inset-0"
              />
              <div className="absolute inset-0 bg-black/45 backdrop-blur-[90px]" />
            </div>

            <header className="absolute top-0 left-0 right-0 z-40 p-4 sm:p-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewMode("desk")}
                className="inline-flex items-center justify-center h-10 w-10 rounded-full border border-white/25 bg-black/30 backdrop-blur-xl hover:bg-black/45 transition-all"
                aria-label="Close reader"
              >
                <X size={16} />
              </button>

              <div className="rounded-full border border-white/25 bg-black/35 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-white/75 font-bold backdrop-blur-xl">
                {currentIndex + 1} / {admirers.length}
              </div>
            </header>

            <main className="absolute inset-0 z-20 flex items-center justify-center px-5 sm:px-12">
              <motion.article
                key={currentConfession._id}
                initial={{ y: 24, opacity: 0, filter: "blur(8px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                exit={{ y: -24, opacity: 0, filter: "blur(8px)" }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-4xl text-center"
              >
                <div className="mx-auto max-w-3xl rounded-[30px] border border-white/20 bg-white/8 backdrop-blur-2xl px-6 sm:px-10 py-10 shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/70 font-semibold flex items-center justify-center gap-2">
                    <Sparkles size={12} />
                    {formatCategory(currentConfession.category)}
                  </p>
                  <h1 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-black serif italic leading-[1.28] text-white drop-shadow-[0_6px_30px_rgba(0,0,0,0.55)]">
                    "{currentConfession.text}"
                  </h1>
                  <div className="mt-8 space-y-2">
                    <p className="text-sm font-semibold text-white/80">
                      - {currentConfession.displayName}
                    </p>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-white/55">
                      {timeAgo(currentConfession.createdAt)}
                    </p>
                  </div>
                  <Link
                    href={`/b/${slug}/c/${currentConfession._id}`}
                    className="mt-8 inline-block rounded-full border border-white/25 bg-white text-black px-6 py-3 text-[11px] uppercase tracking-[0.18em] font-black hover:scale-105 transition-all"
                  >
                    Open full letter
                  </Link>
                </div>
              </motion.article>
            </main>

            {admirers.length > 1 ? (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={currentIndex === 0}
                  className="h-10 w-10 inline-flex items-center justify-center rounded-full border border-white/25 bg-black/35 backdrop-blur-xl disabled:opacity-30 hover:bg-black/55 transition-all"
                  aria-label="Previous letter"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="rounded-full border border-white/20 bg-black/35 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-white/65 font-bold">
                  Scroll, swipe, or arrow keys
                </div>
                <button
                  type="button"
                  onClick={goNext}
                  disabled={currentIndex === admirers.length - 1}
                  className="h-10 w-10 inline-flex items-center justify-center rounded-full border border-white/25 bg-black/35 backdrop-blur-xl disabled:opacity-30 hover:bg-black/55 transition-all"
                  aria-label="Next letter"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AmbientAudioPlayer src="https://upload.wikimedia.org/wikipedia/commons/2/23/Gymnop%C3%A9die_No._1.ogg" />
    </div>
  );
}
