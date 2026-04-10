"use client";

import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Share2, Flame } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { THEMES, SPILL_REACTION_TYPES } from "@/convex/helpers";

/* ─── Slide transition variants ─── */
const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? "100%" : "-100%",
    opacity: 0.6,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? "-100%" : "100%",
    opacity: 0.6,
  }),
};

const fadeVariants = {
  enter: { opacity: 0, scale: 0.98 },
  center: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
};

/* ─── Types ─── */
type StorySlide =
  | { kind: "cover" }
  | { kind: "chapter"; chapterNumber: number; title?: string; text: string }
  | { kind: "end" };

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function DeepSpillReader() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const spillId = params.spillId as string;

  const spill = useQuery(api.spills.getById, {
    spillId: spillId as Id<"spills">,
  });
  const chapters = useQuery(api.chapters.listBySpill, {
    spillId: spillId as Id<"spills">,
  });
  const incrementView = useMutation(api.spills.incrementView);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasTrackedView = useRef(false);

  /* Build slides from spill + chapters */
  const slides: StorySlide[] = useMemo(() => {
    if (!spill || !chapters) return [];

    const result: StorySlide[] = [{ kind: "cover" }];

    for (const chapter of chapters) {
      result.push({
        kind: "chapter",
        chapterNumber: chapter.chapterNumber,
        title: chapter.title || undefined,
        text: chapter.text,
      });
    }

    result.push({ kind: "end" });
    return result;
  }, [spill, chapters]);

  const totalSlides = slides.length;

  /* Track view once */
  useEffect(() => {
    if (spill && !hasTrackedView.current) {
      hasTrackedView.current = true;
      incrementView({ spillId: spillId as Id<"spills"> });
    }
  }, [spill, spillId, incrementView]);

  /* Navigation */
  const goToSlide = useCallback(
    (dir: 1 | -1) => {
      const next = currentSlide + dir;
      if (next < 0 || next >= totalSlides) return;
      setDirection(dir);
      setCurrentSlide(next);
    },
    [currentSlide, totalSlides],
  );

  /* Keyboard nav */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") goToSlide(1);
      if (e.key === "ArrowLeft") goToSlide(-1);
      if (e.key === "Escape")
        router.push(slug === "global" ? "/b/global/spill" : `/b/${slug}`);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goToSlide, router, slug]);

  /* Touch / click areas */
  const handleTapLeft = () => goToSlide(-1);
  const handleTapRight = () => goToSlide(1);

  /* Long press to pause */
  const handlePointerDown = () => {
    longPressRef.current = setTimeout(() => setIsPaused(true), 300);
  };
  const handlePointerUp = () => {
    if (longPressRef.current) clearTimeout(longPressRef.current);
    setIsPaused(false);
  };

  /* ─── Loading ─── */
  if (spill === undefined || chapters === undefined) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-6 h-6 border-2 border-black/10 border-t-black/40 rounded-full animate-spin" />
          <p className="text-[10px] text-black/20 uppercase tracking-widest font-bold">
            Loading spill...
          </p>
        </div>
      </div>
    );
  }

  if (spill === null) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col gap-4 items-center justify-center text-black/50">
        <span className="text-4xl">👀</span>
        <p className="text-sm font-medium">This spill doesn&apos;t exist.</p>
        <button
          type="button"
          onClick={() =>
            router.push(slug === "global" ? "/b/global/spill" : `/b/${slug}`)
          }
          className="px-5 py-2.5 rounded-full bg-black/5 text-xs font-bold uppercase tracking-wider hover:bg-black/10 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const theme = THEMES.find((t) => t.key === spill.coverTheme) || THEMES[0];
  const progress = totalSlides > 1 ? (currentSlide + 1) / totalSlides : 1;
  const currentSlideData = slides[currentSlide];

  /* ──────────────────────────── RENDER ──────────────────────────── */

  return (
    <div
      className="fixed inset-0 bg-white flex flex-col select-none overflow-hidden"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* ─── Segmented Progress Bar (Instagram-style) ─── */}
      <div className="absolute top-0 inset-x-0 z-50 px-2 pt-2 flex gap-[3px]">
        {slides.map((_, idx) => (
          <div
            key={`seg-${idx}`}
            className="h-[3px] flex-1 rounded-full overflow-hidden bg-black/[0.08]"
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                background:
                  idx < currentSlide
                    ? "rgba(0,0,0,0.5)"
                    : idx === currentSlide
                      ? "rgba(0,0,0,0.5)"
                      : "transparent",
                width:
                  idx < currentSlide
                    ? "100%"
                    : idx === currentSlide
                      ? "100%"
                      : "0%",
              }}
              initial={false}
              animate={{
                width:
                  idx < currentSlide
                    ? "100%"
                    : idx === currentSlide
                      ? "100%"
                      : "0%",
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
        ))}
      </div>

      {/* ─── Top bar ─── */}
      <div className="absolute top-3 inset-x-0 z-50 px-4 pt-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              router.push(slug === "global" ? "/b/global/spill" : `/b/${slug}`);
            }}
            className="w-8 h-8 rounded-full bg-black/5 backdrop-blur-md flex items-center justify-center hover:bg-black/10 transition-colors"
          >
            <X size={16} className="text-black/50" />
          </button>
          <div>
            <p className="text-[11px] font-bold text-black/50 truncate max-w-[200px]">
              {spill.title}
            </p>
            <p className="text-[9px] text-black/25 font-medium">
              {spill.displayName}
            </p>
          </div>
        </div>
      </div>

      {/* ─── STORY CONTENT ─── */}
      <div className="flex-1 relative">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "tween", duration: 0.3, ease: [0.32, 0.72, 0, 1] },
              opacity: { duration: 0.2 },
            }}
            className="absolute inset-0"
          >
            {currentSlideData.kind === "cover" && (
              <CoverSlide spill={spill} theme={theme} />
            )}
            {currentSlideData.kind === "chapter" && (
              <ChapterSlide
                slide={currentSlideData}
                theme={theme}
                spillTitle={spill.title}
              />
            )}
            {currentSlideData.kind === "end" && (
              <EndSlide spill={spill} theme={theme} slug={slug} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Tap zones — only cover top area so text can scroll */}
        <button
          type="button"
          onClick={handleTapLeft}
          className="absolute top-0 left-0 w-[30%] h-[60%] z-30"
          aria-label="Previous"
        />
        <button
          type="button"
          onClick={handleTapRight}
          className="absolute top-0 right-0 w-[55%] h-[60%] z-30"
          aria-label="Next"
        />

        {/* Pause overlay */}
        {isPaused && (
          <div className="absolute inset-0 z-40 bg-white/30 flex items-center justify-center">
            <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 font-bold">
              Paused
            </p>
          </div>
        )}
      </div>

      {/* ─── Bottom bar ─── */}
      <div className="absolute bottom-0 inset-x-0 z-50 px-4 pb-6 flex items-center justify-center">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goToSlide(-1);
            }}
            disabled={currentSlide === 0}
            className="w-10 h-10 rounded-full bg-black/5 backdrop-blur-md flex items-center justify-center transition-all hover:bg-black/10 disabled:opacity-0"
          >
            <ChevronLeft size={18} className="text-black/40" />
          </button>

          <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-black/20 tabular-nums min-w-[60px] text-center">
            {currentSlide + 1} / {totalSlides}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goToSlide(1);
            }}
            disabled={currentSlide === totalSlides - 1}
            className="w-10 h-10 rounded-full bg-black/5 backdrop-blur-md flex items-center justify-center transition-all hover:bg-black/10 disabled:opacity-0"
          >
            <ChevronRight size={18} className="text-black/40" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COVER SLIDE
   ═══════════════════════════════════════════════════════════════ */

function CoverSlide({
  spill,
  theme,
}: {
  spill: {
    title: string;
    coverEmoji: string;
    aiImageUrl?: string;
    displayName: string;
    about?: string;
    category?: string;
    tags?: string[];
  };
  theme: (typeof THEMES)[number];
}) {
  return (
    <div className="size-full flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background */}
      {spill.aiImageUrl ? (
        <>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${spill.aiImageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
        </>
      ) : (
        <>
          <div className="absolute inset-0" style={{ background: theme.bg }} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.06),transparent_60%)]" />
        </>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-8 text-center max-w-md">
        {/* Label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="flex flex-col items-center gap-2"
        >
          <span
            className="text-[9px] font-black uppercase tracking-[0.5em]"
            style={{ color: spill.aiImageUrl ? "#fff" : theme.accent }}
          >
            Deep Spill
          </span>
          <div
            className="w-10 h-px opacity-30"
            style={{
              background: spill.aiImageUrl ? "#fff" : theme.accent,
            }}
          />
        </motion.div>

        {/* Emoji */}
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
          className="text-6xl drop-shadow-2xl"
        >
          {spill.coverEmoji}
        </motion.span>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-3xl sm:text-4xl font-black serif leading-[1.1] tracking-tight text-balance"
          style={{ color: spill.aiImageUrl ? "#fff" : theme.text }}
        >
          {spill.title}
        </motion.h1>

        {/* Author */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-[11px] uppercase tracking-[0.25em] font-medium opacity-50"
          style={{ color: spill.aiImageUrl ? "#fff" : theme.text }}
        >
          By {spill.displayName}
        </motion.p>

        {/* About (flashy shimmer) */}
        {spill.about && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-[11px] font-medium leading-relaxed text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-400 to-purple-400 max-w-xs"
            style={{
              backgroundSize: "200% auto",
              animation: "shimmerSweep 3s linear infinite",
            }}
          >
            {spill.about}
          </motion.p>
        )}

        {/* Tags with gradient borders */}
        {(() => {
          const coverTags: string[] = [];
          if (spill.tags && spill.tags.length > 0)
            coverTags.push(...spill.tags);
          else if (spill.category) coverTags.push(spill.category);
          if (coverTags.length === 0) return null;
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="flex flex-wrap gap-1.5 justify-center"
            >
              {coverTags.map((t, i) => (
                <span
                  key={i}
                  className="relative inline-flex items-center overflow-hidden rounded-full p-[1px]"
                >
                  <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#f59e0b_0%,#ef4444_50%,#f59e0b_100%)] opacity-60" />
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[8px] font-bold uppercase tracking-wider backdrop-blur-sm ${spill.aiImageUrl ? "bg-black/30 text-white/80" : "bg-white/80 text-black/50"}`}
                  >
                    {t}
                  </span>
                </span>
              ))}
            </motion.div>
          );
        })()}

        {/* Tap hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="text-[10px] font-medium tracking-wide mt-8"
          style={{
            color: spill.aiImageUrl
              ? "rgba(255,255,255,0.4)"
              : `${theme.text}50`,
          }}
        >
          Tap to start reading →
        </motion.p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CHAPTER SLIDE
   ═══════════════════════════════════════════════════════════════ */

function ChapterSlide({
  slide,
  theme,
  spillTitle,
}: {
  slide: {
    chapterNumber: number;
    title?: string;
    text: string;
  };
  theme: (typeof THEMES)[number];
  spillTitle: string;
}) {
  return (
    <div className="size-full flex flex-col relative overflow-hidden">
      {/* White background with subtle theme accent glow */}
      <div className="absolute inset-0 bg-white" />
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${theme.accent}, transparent 70%)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col pt-20 pb-24 px-6 sm:px-10 overflow-hidden">
        {/* Chapter header */}
        {slide.title && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mb-6 text-center flex-shrink-0"
          >
            <p className="text-[9px] font-black uppercase tracking-[0.4em] mb-2 text-black/25">
              Chapter {slide.chapterNumber}
            </p>
            <h2 className="text-xl sm:text-2xl font-black serif leading-tight text-black">
              {slide.title}
            </h2>
            <div
              className="w-8 h-px mx-auto mt-4 opacity-30"
              style={{ background: theme.accent }}
            />
          </motion.div>
        )}

        {!slide.title && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-[9px] font-bold uppercase tracking-[0.3em] mb-4 text-center flex-shrink-0 text-black/20"
          >
            Chapter {slide.chapterNumber}
          </motion.p>
        )}

        {/* Story text — scrollable */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="flex-1 overflow-y-auto scrollbar-hide min-h-0"
        >
          <p className="font-serif text-[16px] sm:text-[17px] leading-[2] whitespace-pre-wrap max-w-lg mx-auto pb-8 text-black/60">
            {slide.text}
          </p>
        </motion.div>

        {/* Bottom spill title watermark */}
        <div className="mt-2 text-center flex-shrink-0">
          <p className="text-[8px] uppercase tracking-[0.3em] font-bold text-black/8">
            {spillTitle}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   END SLIDE
   ═══════════════════════════════════════════════════════════════ */

function EndSlide({
  spill,
  theme,
  slug,
}: {
  spill: {
    _id: Id<"spills">;
    title: string;
    displayName: string;
    views?: number;
    about?: string;
    category?: string;
    tags?: string[];
  };
  theme: (typeof THEMES)[number];
  slug: string;
}) {
  const router = useRouter();

  // Reactions
  const [visitorId] = useState(() => {
    if (typeof window === "undefined") return "";
    let id = localStorage.getItem("teaaa-visitor-id");
    if (!id) {
      id = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem("teaaa-visitor-id", id);
    }
    return id;
  });

  const reactionCountsArray = useQuery(api.spillReactions.getCounts, {
    spillId: spill._id,
  });
  const reactionCounts = reactionCountsArray
    ? Object.fromEntries(reactionCountsArray.map((r) => [r.type, r.count]))
    : undefined;
  const myReactions = useQuery(
    api.spillReactions.getVisitorReactions,
    visitorId ? { spillId: spill._id, visitorId } : "skip",
  );
  const toggleReaction = useMutation(api.spillReactions.toggle);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: spill.title,
          text: `Read "${spill.title}" — an anonymous Deep Spill on Teaaa 🫖`,
          url,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copied!");
    }
  };

  return (
    <div className="size-full flex flex-col items-center justify-center relative overflow-hidden">
      {/* White background with accent glow */}
      <div className="absolute inset-0 bg-white" />
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${theme.accent}, transparent 60%)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-8 text-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: "spring", damping: 10 }}
          className="text-5xl"
        >
          ✨
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-2xl sm:text-3xl font-black serif tracking-tight text-black"
        >
          The End
        </motion.h2>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-1"
        >
          <p className="text-xs font-medium text-black/40">{spill.title}</p>
          <p className="text-[10px] text-black/25">By {spill.displayName}</p>
          {spill.views != null && spill.views > 0 && (
            <p className="text-[9px] text-black/15 mt-2">
              👁 {spill.views} views
            </p>
          )}
          {/* About (flashy shimmer) */}
          {spill.about && (
            <p
              className="text-[10px] font-medium leading-relaxed text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-rose-500 to-purple-500 mt-2"
              style={{
                backgroundSize: "200% auto",
                animation: "shimmerSweep 3s linear infinite",
              }}
            >
              {spill.about}
            </p>
          )}
          {/* Tags */}
          {(() => {
            const endTags: string[] = [];
            if (spill.tags && spill.tags.length > 0)
              endTags.push(...spill.tags);
            else if (spill.category) endTags.push(spill.category);
            if (endTags.length === 0) return null;
            return (
              <div className="flex flex-wrap gap-1 justify-center mt-2">
                {endTags.map((t, i) => (
                  <span
                    key={i}
                    className="relative inline-flex items-center overflow-hidden rounded-full p-[1px]"
                  >
                    <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#f59e0b_0%,#ef4444_50%,#f59e0b_100%)] opacity-40" />
                    <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[7px] font-bold uppercase tracking-wider text-black/50">
                      {t}
                    </span>
                  </span>
                ))}
              </div>
            );
          })()}
        </motion.div>

        {/* ─── Reaction Row ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="flex items-center gap-2 mt-4"
        >
          {SPILL_REACTION_TYPES.map((r) => {
            const count = reactionCounts?.[r.key] ?? 0;
            const isActive = myReactions?.includes(r.key) ?? false;
            return (
              <motion.button
                key={r.key}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (visitorId) {
                    toggleReaction({
                      spillId: spill._id,
                      type: r.key,
                      visitorId,
                    });
                  }
                }}
                whileTap={{ scale: 1.3 }}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all ${
                  isActive
                    ? "bg-black/8 scale-105"
                    : "bg-black/[0.03] hover:bg-black/5"
                }`}
              >
                <span className="text-xl">{r.emoji}</span>
                {count > 0 && (
                  <span
                    className={`text-[9px] font-bold tabular-nums ${
                      isActive ? "text-black/60" : "text-black/20"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex items-center gap-3 mt-6"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-black/5 text-black/40 text-[10px] font-black uppercase tracking-[0.15em] hover:bg-black/8 transition-all"
          >
            <Share2 size={13} /> Share
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              router.push(slug === "global" ? "/b/global/spill" : `/b/${slug}`);
            }}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-orange-500/80 to-rose-500/80 text-white text-[10px] font-black uppercase tracking-[0.15em] hover:scale-[1.03] transition-all shadow-lg shadow-orange-500/10"
          >
            <Flame size={13} /> More Spills
          </button>
        </motion.div>
      </div>
    </div>
  );
}
