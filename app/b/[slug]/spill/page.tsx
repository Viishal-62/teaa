"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/convex/_generated/api";
import { THEMES } from "@/convex/helpers";
import {
  ArrowLeft,
  BookOpen,
  Plus,
  Search,
  SlidersHorizontal,
  X,
  Tag,
  Feather,
  Library,
} from "lucide-react";

import DeepSpillCard from "@/app/components/DeepSpillCard";

/* ─────────────────────────────────────────────────────────────
   Global styles injected once — keeps JSX clean
───────────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=DM+Sans:wght@300;400;500;600&display=swap');

  :root {
    --parchment: #f5efe6;
    --parchment-dark: #ede4d5;
    --ink: #1a1209;
    --ink-mid: #3d2f1e;
    --ink-faint: #8b7355;
    --ink-ghost: rgba(26,18,9,0.07);
    --gold: #c9962a;
    --gold-light: #e8c26a;
    --gold-pale: #f7edd5;
    --crimson: #8b2635;
    --crimson-soft: #b34252;
    --sage: #4a6741;
    --spine: #2a1f14;
    --shadow-book: 0 20px 60px rgba(26,18,9,0.18), 0 4px 16px rgba(26,18,9,0.12);
    --shadow-lift: 0 32px 80px rgba(26,18,9,0.22), 0 8px 24px rgba(26,18,9,0.14);
  }

  * { box-sizing: border-box; }

  .serif { font-family: 'Playfair Display', Georgia, serif; }
  .garamond { font-family: 'EB Garamond', Georgia, serif; }
  .sans { font-family: 'DM Sans', system-ui, sans-serif; }

  body { font-family: 'DM Sans', system-ui, sans-serif; }

  /* Parchment texture via pseudo-element on the bg */
  .parchment-bg {
    background-color: var(--parchment);
    background-image:
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    background-repeat: repeat;
  }

  /* Ornamental divider */
  .ornament::before,
  .ornament::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--gold), transparent);
  }

  /* Book card hover */
  .book-card:hover .book-cover {
    transform: translateY(-6px) rotate(-1.5deg);
    box-shadow: var(--shadow-lift);
  }
  .book-card:hover .book-glow {
    opacity: 1;
  }

  /* Shimmer */
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  .shimmer-text {
    background: linear-gradient(90deg, #c9962a, #e8c26a, #8b2635, #c9962a);
    background-size: 200% auto;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 4s linear infinite;
  }

  /* Tag gradient border spin */
  @keyframes spin-slow { to { transform: rotate(360deg); } }

  /* Gold badge pulse */
  @keyframes glow-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(201,150,42,0.4); }
    50% { box-shadow: 0 0 0 6px rgba(201,150,42,0); }
  }

  /* Reading rule line */
  .reading-rule {
    border: none;
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, var(--gold) 30%, var(--gold) 70%, transparent 100%);
    opacity: 0.35;
  }

  /* Filter panel parchment */
  .filter-panel {
    background: linear-gradient(135deg, #fdf9f2 0%, #f5ece0 100%);
    border: 1px solid rgba(201,150,42,0.2);
    border-radius: 16px;
  }

  /* Input styling */
  .ink-input {
    background: rgba(255,255,255,0.6);
    border: 1px solid rgba(201,150,42,0.25);
    border-radius: 8px;
    color: var(--ink);
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 12px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .ink-input::placeholder { color: var(--ink-faint); }
  .ink-input:focus {
    outline: none;
    border-color: rgba(201,150,42,0.6);
    box-shadow: 0 0 0 3px rgba(201,150,42,0.08);
  }

  /* Scroll bar styling */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--parchment-dark); }
  ::-webkit-scrollbar-thumb { background: var(--gold); border-radius: 3px; }
`;

function GlobalStyles() {
  return <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />;
}

/* ─────────────────────────────────────────────────────────────
   Decorative corner SVG
───────────────────────────────────────────────────────────── */
function CornerOrnament({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      className={`absolute text-gold ${className}`}
      style={style}
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 2 L2 14 M2 2 L14 2"
        stroke="#c9962a"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="2" cy="2" r="2" fill="#c9962a" />
      <path
        d="M8 8 Q16 8 16 16"
        stroke="#c9962a"
        strokeWidth="0.8"
        strokeDasharray="2 2"
        opacity="0.5"
      />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   Open-book icon header decoration
───────────────────────────────────────────────────────────── */
function BookDecoration() {
  return (
    <div className="flex items-center justify-center mb-6">
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #c9962a22, #8b263522)",
          border: "1px solid rgba(201,150,42,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "glow-pulse 3s ease-in-out infinite",
        }}
      >
        <Library size={28} color="#c9962a" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Animated tag chip
───────────────────────────────────────────────────────────── */
function TagChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative inline-flex min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 items-center justify-center overflow-hidden rounded-full p-[1.5px] focus:outline-none transition-all active:scale-95 ${
        active ? "shadow-md" : "opacity-70 hover:opacity-100"
      }`}
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      <span
        style={{
          position: "absolute",
          inset: "-1000%",
          animation: "spin-slow 4s linear infinite",
          background: active
            ? "conic-gradient(from 90deg at 50% 50%, #c9962a 0%, #8b2635 50%, #c9962a 100%)"
            : "conic-gradient(from 90deg at 50% 50%, #c9962a 0%, #e8c26a 50%, #c9962a 100%)",
          opacity: active ? 1 : 0.35,
        }}
      />
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          width: "100%",
          borderRadius: "9999px",
          padding: "4px 12px",
          gap: 6,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          backdropFilter: "blur(8px)",
          background: active ? "#c9962a" : "#f5efe6",
          color: active ? "#fff" : "var(--ink-mid)",
          transition: "background 0.2s, color 0.2s",
        }}
      >
        {label}
        <span
          style={{
            fontSize: 8,
            padding: "1px 5px",
            borderRadius: 999,
            background: active ? "rgba(255,255,255,0.2)" : "rgba(26,18,9,0.07)",
            color: active ? "#fff" : "var(--ink-faint)",
          }}
        >
          {count}
        </span>
      </span>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main page
───────────────────────────────────────────────────────────── */
export default function SpillLibraryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const isGlobal = slug === "global";

  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showContextFilters, setShowContextFilters] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const board = useQuery(api.boards.getBySlug, isGlobal ? "skip" : { slug });
  const spills = useQuery(
    isGlobal ? api.spills.listAllPublic : api.spills.listByBoard,
    isGlobal ? {} : board ? { boardId: board._id } : "skip",
  );

  /* ── Unique tags ── */
  const allTags = useMemo(() => {
    if (!spills) return [];
    const tagMap: Record<string, number> = {};
    spills.forEach((s: any) => {
      if (s.category) tagMap[s.category] = (tagMap[s.category] || 0) + 1;
      if (s.tags && Array.isArray(s.tags)) {
        s.tags.forEach((t: string) => {
          tagMap[t] = (tagMap[t] || 0) + 1;
        });
      }
    });
    return Object.entries(tagMap)
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count);
  }, [spills]);

  const hasFilterData = allTags.length > 0;
  const activeFilterCount =
    (selectedTag ? 1 : 0) + (searchQuery.trim() ? 1 : 0);

  const filteredSpills = useMemo(() => {
    if (!spills) return [];
    return spills.filter((s: any) => {
      const matchesTag =
        !selectedTag ||
        s.category === selectedTag ||
        (s.tags && s.tags.includes(selectedTag));
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.title?.toLowerCase().includes(q) ||
        s.about?.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q) ||
        (s.tags && s.tags.some((t: string) => t.toLowerCase().includes(q)));
      return matchesTag && matchesSearch;
    });
  }, [spills, selectedTag, searchQuery]);

  /* ─── Filter UI (shared) ─── */
  const ContextFilterUI = (
    <div className="flex flex-col gap-5">
      {/* Search */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Search size={11} className="text-[#8b7355]" />
          <span className="text-[9px] font-extrabold tracking-[0.18em] uppercase text-[#8b7355] font-sans">
            Search the Collection
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, tags, or about…"
            className="ink-input flex-1 px-3.5 py-2.5"
          />
          {(selectedTag || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedTag(null);
                setSearchQuery("");
              }}
              className="flex items-center gap-1 px-3.5 py-2 rounded-lg text-[9px] font-bold tracking-widest uppercase text-[#8b2635] bg-[#8b2635]/10 border border-[#8b2635]/15 cursor-pointer transition-all duration-200 font-sans whitespace-nowrap"
            >
              <X size={11} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Tags */}
      {(() => {
        const q = searchQuery.toLowerCase().trim();
        const filteredTags = q
          ? allTags.filter((t) => t.key.toLowerCase().includes(q))
          : allTags;
        if (filteredTags.length === 0) return null;
        return (
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <Tag size={11} className="text-[#8b7355]" />
              <span className="text-[9px] font-extrabold tracking-[0.18em] uppercase text-[#8b7355] font-sans">
                Browse by Genre
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {filteredTags.map((item) => (
                <TagChip
                  key={item.key}
                  label={item.key}
                  count={item.count}
                  active={selectedTag === item.key}
                  onClick={() =>
                    setSelectedTag(selectedTag === item.key ? null : item.key)
                  }
                />
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );

  /* ─── Loading ─── */
  if ((!isGlobal && board === undefined) || spills === undefined) {
    return (
      <>
        <GlobalStyles />
        <div className="parchment-bg min-h-[100dvh] flex flex-col items-center justify-center gap-5">
          <Library size={36} className="text-[#c9962a] opacity-50" />
          <div className="w-9 h-9 border-2 border-[#c9962a]/20 border-t-[#c9962a] rounded-full animate-[spin-slow_1s_linear_infinite]" />
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#8b7355] font-sans">
            Opening the Library…
          </p>
        </div>
      </>
    );
  }

  /* ─── Not found ─── */
  if (!isGlobal && board === null) {
    return (
      <>
        <GlobalStyles />
        <div className="parchment-bg min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center">
          <span className="text-[52px] mb-4">📚</span>
          <h1 className="serif text-[28px] font-black mb-2 text-[var(--ink)]">
            Board Not Found
          </h1>
          <p className="garamond text-base text-[var(--ink-faint)] mb-6">
            This shelf does not exist in our library.
          </p>
          <Link
            href="/"
            className="px-7 py-3 bg-[var(--ink)] text-[#f5efe6] rounded-lg text-[11px] font-bold tracking-[0.15em] uppercase no-underline font-sans"
          >
            Return Home
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <GlobalStyles />

      <div className="parchment-bg min-h-[100dvh] text-[var(--ink)]">
        {/* ═══════════════════════════════════════════
            HEADER
        ═══════════════════════════════════════════ */}
        <header className="sticky top-0 z-50 flex items-center justify-between px-5 h-[60px] bg-[#f5efe6]/90 backdrop-blur-[20px] border-b border-[#c9962a]/15 shadow-[0_1px_0_rgba(201,150,42,0.08),0_4px_20px_rgba(26,18,9,0.04)]">
          {/* Back */}
          <Link
            href={isGlobal ? "/" : `/b/${slug}`}
            className="flex items-center gap-1.5 text-[var(--ink-faint)] hover:text-[var(--ink)] no-underline min-h-[44px] min-w-[44px] justify-center transition-colors font-sans"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline text-[10px] font-bold tracking-[0.2em] uppercase">
              {isGlobal ? "Home" : "Back"}
            </span>
          </Link>

          {/* Title */}
          <div className="flex items-center gap-2">
            <div className="w-[1px] h-4 bg-[#c9962a]/30" />
            <span className="text-[9px] font-extrabold tracking-[0.3em] uppercase text-[var(--ink-faint)] font-sans">
              {isGlobal ? "Global Library" : "Spill Library"}
            </span>
            <div className="w-[1px] h-4 bg-[#c9962a]/30" />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {hasFilterData && (
              <button
                type="button"
                onClick={() => setShowContextFilters(!showContextFilters)}
                className={`flex items-center justify-center gap-1 min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-full border border-[#c9962a]/25 text-[var(--ink-faint)] cursor-pointer transition-all duration-200 font-sans ${showContextFilters ? "bg-[#c9962a]/10" : "bg-transparent"}`}
              >
                <SlidersHorizontal size={11} />
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#c9962a] text-white text-[8px] font-extrabold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            )}

            {/* New Spill — gold gradient border */}
            <Link
              href={isGlobal ? "/spill/create" : `/b/${slug}/spill/create`}
              className="relative inline-flex items-center justify-center overflow-hidden rounded-full p-[1.5px] min-h-[44px] min-w-[44px] no-underline"
            >
              {/* <span className="absolute inset-[-1000%] animate-[spin-slow_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#c9962a_0%,#8b2635_50%,#c9962a_100%)]" /> */}
              <span className="relative inline-flex items-center gap-1.5 rounded-full bg-[#f5efe6] px-3.5 py-1.5 text-[9px] font-bold tracking-[0.15em] uppercase text-[var(--ink)] font-sans whitespace-nowrap">
                <Feather size={9} />
                Write a Story
              </span>
            </Link>
          </div>
        </header>

        {/* ═══════════════════════════════════════════
            DESKTOP FILTER PANEL
        ═══════════════════════════════════════════ */}
        <div className="hidden md:block px-5">
          <div className="max-w-[960px] mx-auto">
            <AnimatePresence>
              {showContextFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden mt-4"
                >
                  <div className="filter-panel px-6 py-5">
                    {ContextFilterUI}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            MOBILE BOTTOM SHEET
        ═══════════════════════════════════════════ */}
        {mounted &&
          typeof document !== "undefined" &&
          createPortal(
            <div className="md:hidden block">
              <AnimatePresence>
                {showContextFilters && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(26,18,9,0.5)",
                        zIndex: 9998,
                        touchAction: "none",
                      }}
                      onClick={() => setShowContextFilters(false)}
                    />
                    <motion.div
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      exit={{ y: "100%" }}
                      transition={{
                        type: "spring",
                        damping: 28,
                        stiffness: 280,
                      }}
                      style={{
                        position: "fixed",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        zIndex: 9999,
                        borderRadius: "28px 28px 0 0",
                        background: "#fdf9f2",
                        boxShadow: "0 -8px 40px rgba(26,18,9,0.18)",
                        maxHeight: "75dvh",
                        display: "flex",
                        flexDirection: "column",
                        width: "100%",
                        overscrollBehavior: "contain",
                        paddingBottom: "env(safe-area-inset-bottom, 24px)",
                        borderTop: "1px solid rgba(201,150,42,0.2)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          paddingTop: 12,
                          paddingBottom: 8,
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                        onClick={() => setShowContextFilters(false)}
                      >
                        <div
                          style={{
                            width: 40,
                            height: 5,
                            background: "rgba(139,115,85,0.2)",
                            borderRadius: 999,
                          }}
                        />
                      </div>
                      <div
                        style={{
                          padding: "0 20px 24px",
                          overflowY: "auto",
                          overflowX: "hidden",
                          flex: 1,
                          minHeight: 0,
                        }}
                      >
                        {ContextFilterUI}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>,
            document.body,
          )}

        {/* ═══════════════════════════════════════════
            MAIN CONTENT
        ═══════════════════════════════════════════ */}
        <main
          style={{
            maxWidth: 960,
            margin: "0 auto",
            padding: "0 20px 120px",
          }}
        >
          {/* ── Hero heading ── */}
          <div
            style={{
              textAlign: "center",
              padding: "60px 0 40px",
              position: "relative",
            }}
          >
            {/* Decorative corners */}
            <CornerOrnament className="" style={{ top: 32, left: 0 } as any} />
            <CornerOrnament
              className=""
              style={
                {
                  top: 32,
                  right: 0,
                  transform: "scaleX(-1)",
                } as any
              }
            />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <BookDecoration />
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              style={{
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                color: "#c9962a",
                marginBottom: 12,
                fontFamily: "'DM Sans', system-ui, sans-serif",
              }}
            >
              ✦ The Collection ✦
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="serif"
              style={{
                fontSize: "clamp(36px, 6vw, 60px)",
                fontWeight: 900,
                lineHeight: 1.05,
                marginBottom: 16,
                color: "var(--ink)",
                letterSpacing: "-0.01em",
              }}
            >
              Spill{" "}
              <em style={{ fontStyle: "italic", color: "#c9962a" }}>Stories</em>
            </motion.h2>

            <hr
              className="reading-rule"
              style={{ maxWidth: 320, margin: "0 auto 16px" }}
            />

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="garamond"
              style={{
                fontSize: 17,
                color: "var(--ink-faint)",
                maxWidth: 400,
                margin: "0 auto",
                lineHeight: 1.65,
                fontStyle: "italic",
              }}
            >
              Full-length anonymous stories with chapters. Tap any cover to
              begin reading, or pick up your quill and write your own.
            </motion.p>
          </div>

          {/* ── Active filter badges ── */}
          {(selectedTag || searchQuery.trim()) && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 8,
                marginBottom: 24,
                padding: "12px 16px",
                background: "rgba(201,150,42,0.06)",
                borderRadius: 12,
                border: "1px solid rgba(201,150,42,0.15)",
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--ink-faint)",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}
              >
                Showing:
              </span>
              {selectedTag && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "4px 10px",
                    borderRadius: 999,
                    fontSize: 9,
                    fontWeight: 700,
                    background: "rgba(201,150,42,0.12)",
                    color: "#8b6820",
                    border: "1px solid rgba(201,150,42,0.25)",
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                  }}
                >
                  🏷️ {selectedTag}
                  <button
                    type="button"
                    onClick={() => setSelectedTag(null)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "inherit",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <X size={10} />
                  </button>
                </span>
              )}
              {searchQuery.trim() && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "4px 10px",
                    borderRadius: 999,
                    fontSize: 9,
                    fontWeight: 700,
                    background: "rgba(139,38,53,0.07)",
                    color: "#6b2030",
                    border: "1px solid rgba(139,38,53,0.15)",
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                  }}
                >
                  &ldquo;{searchQuery}&rdquo;
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "inherit",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <X size={10} />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* ── Book grid / empty state ── */}
          {filteredSpills.length === 0 ? (
            <EmptyShelf
              hasFilters={!!(spills && spills.length > 0)}
              href={isGlobal ? "/spill/create" : `/b/${slug}/spill/create`}
            />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                gap: "clamp(20px, 3vw, 40px)",
              }}
            >
              {filteredSpills.map((spill: any, i: number) => (
                <DeepSpillCard
                  key={spill._id}
                  spill={spill}
                  slug={slug}
                  index={i}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   Empty shelf
───────────────────────────────────────────────────────────── */
function EmptyShelf({
  hasFilters,
  href,
}: {
  hasFilters: boolean;
  href: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        textAlign: "center",
        padding: "64px 32px",
        background: "rgba(255,255,255,0.5)",
        borderRadius: 20,
        border: "1px solid rgba(201,150,42,0.15)",
        backdropFilter: "blur(8px)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle bookshelf line */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: "10%",
          right: "10%",
          height: 2,
          background:
            "linear-gradient(90deg, transparent, rgba(201,150,42,0.2), transparent)",
        }}
      />

      <span style={{ fontSize: 52, display: "block", marginBottom: 16 }}>
        📖
      </span>
      <p
        className="serif"
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "var(--ink)",
          marginBottom: 8,
        }}
      >
        {hasFilters ? "No Stories Match" : "The Shelf Awaits"}
      </p>
      <p
        className="garamond"
        style={{
          fontSize: 15,
          color: "var(--ink-faint)",
          fontStyle: "italic",
          marginBottom: 28,
          maxWidth: 300,
          margin: "0 auto 28px",
          lineHeight: 1.6,
        }}
      >
        {hasFilters
          ? "Try a different genre or search term."
          : "Be the first to place a story upon these shelves."}
      </p>
      <Link
        href={href}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 24px",
          background: "var(--ink)",
          color: "#f5efe6",
          borderRadius: 8,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          textDecoration: "none",
          fontFamily: "'DM Sans', system-ui, sans-serif",
          transition: "transform 0.2s",
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLAnchorElement).style.transform =
            "scale(1.04)")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)")
        }
      >
        <Feather size={10} /> Write the First Story
      </Link>
    </motion.div>
  );
}
