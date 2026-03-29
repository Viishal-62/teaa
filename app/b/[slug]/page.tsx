"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Home,
  Plus,
  Lock,
  Share2,
  Check,
  Link as LinkIcon,
  Bell,
  BookOpen,
} from "lucide-react";
import { CATEGORY_INFO, getCreatorToken, SHARE_PROMPTS } from "@/app/lib/utils";
import ConfessionFlipCard from "@/app/components/ConfessionFlipCard";
import DeepSpillCard from "@/app/components/DeepSpillCard";

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
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeIndex, setActiveIndex] = useState(0);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [boardCopied, setBoardCopied] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollAccum = useRef(0);
  const scrollCooldown = useRef(false);
  const [showToast, setShowToast] = useState(false);
  const prevConfessionsLength = useRef(0);

  const board = useQuery(api.boards.getBySlug, { slug });

  const creatorToken = typeof window !== "undefined" ? getCreatorToken() : "";
  const isOwner = board?.creatorToken === creatorToken;

  const sessionKey = `board-pin-${slug}`;
  const savedPin =
    typeof window !== "undefined"
      ? sessionStorage.getItem(`board-pin-value-${slug}`)
      : null;

  const pinToVerify = unlocked ? pinInput : savedPin || "";
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

  const scrollToCard = useCallback(
    (index: number) => {
      if (!mixedItems || index < 0 || index >= mixedItems.length) return;
      setActiveIndex(index);
    },
    [mixedItems],
  );

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
    if (pinInput.length < 4) return;
    sessionStorage.setItem(`board-pin-value-${slug}`, pinInput);
    setUnlocked(true);
  };

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
          {board.name}
        </h1>
        <div className="flex items-center gap-3">
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
            className="flex items-center gap-1 text-[10px] text-black/40 hover:text-black font-medium transition-colors"
          >
            {boardCopied ? (
              <>
                <Check size={12} className="text-green-500" />
                <span className="text-green-500">Copied!</span>
              </>
            ) : (
              <>
                <Share2 size={12} />
                Share
              </>
            )}
          </button>
          <Link
            href={`/b/${slug}/confess`}
            className="text-[10px] text-black/40 hover:text-black font-medium transition-colors"
          >
            Add confession
          </Link>
          <Link
            href={`/b/${slug}/spill`}
            className="text-[10px] text-rose-900/60 hover:text-rose-900 font-medium transition-colors"
          >
            Long gossip
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto">
        {/* Board info */}
        <div className="pt-10 pb-2 text-center">
          <h1 className="text-3xl font-black tracking-tight serif text-black mb-1">
            Teaaa!
          </h1>
          {board.tagline && (
            <p className="text-xs text-black/30 italic font-medium">
              &quot;{board.tagline}&quot;
            </p>
          )}
        </div>

        {/* Carousel */}
        <div className="relative px-4 pb-4">
          {/* Carousel View */}
          {!mixedItems ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-black/10 border-t-black/40 rounded-full animate-spin" />
            </div>
          ) : mixedItems.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-4xl block mb-4">🤫</span>
              <p className="text-lg font-bold serif mb-1">No confessions yet</p>
              <p className="text-xs text-black/35 mb-6">
                Be the first to spill the tea!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Link
                  href={`/b/${slug}/confess`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all"
                >
                  <Plus size={14} />
                  Add Confession
                </Link>
                <Link
                  href={`/b/${slug}/spill`}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-black/10 text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black/5 hover:scale-105 transition-all"
                >
                  <BookOpen size={14} />
                  Open Long Gossip
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Coverflow carousel */}
              <div
                ref={carouselRef}
                className="relative h-[500px] flex items-center justify-center -mx-5 overflow-hidden"
              >
                {mixedItems.map((item, i) => {
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
                      key={item._id}
                      className="absolute transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
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
                        {item._type === "spill" ? (
                          <DeepSpillCard slug={slug} spill={item} />
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

              {/* Hint */}
              <p className="text-center text-[10px] text-black/20 font-medium mt-1 mb-2">
                Scroll · ← → keys · tap to flip
              </p>

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
        </div>

        {/* Category Filters */}
        <div className="mb-8 overflow-x-auto pb-3 px-4 no-scrollbar">
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

        {/* "Got something to confess?" CTA Banner */}
        {confessions && confessions.length > 0 && (
          <div className="px-4 pb-10 flex flex-col sm:flex-row gap-4 max-w-3xl mx-auto">
            <Link
              href={`/b/${slug}/confess`}
              className="flex-1 block relative overflow-hidden rounded-2xl border border-black/5 hover:border-black/10 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#faf7f2] via-white to-[#f5f0e8]" />
              <div className="absolute top-3 right-3 w-16 h-16 rounded-full bg-black/[0.02]" />
              <div className="absolute bottom-2 left-2 w-10 h-10 rounded-full bg-black/[0.02]" />
              <div className="relative flex flex-col items-center text-center py-8 px-6">
                <span className="text-3xl mb-3">🫖</span>
                <h3 className="text-base font-black tracking-tight serif text-black mb-1">
                  Got something to confess?
                </h3>
                <p className="text-[11px] text-black/35 mb-4 leading-relaxed">
                  Spill the tea anonymously. No sign up, no judgement.
                </p>
                <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-widest">
                  <Plus size={12} />
                  Confess Now
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
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
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
            href={`/b/${slug}/confess`}
            className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all"
            title="Drop a Confession"
          >
            <Plus size={22} />
          </Link>
        </div>
      )}

      {/* Real-time Toast */}
      {showToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-5 py-3 bg-black text-white rounded-full shadow-xl shadow-black/20 flex items-center gap-3 z-50 animate-[slideUp_0.3s_ease-out]">
          <Bell size={14} className="text-green-400 rotate-12" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-green-50">
            Someone spilled new tea!
          </span>
        </div>
      )}
    </div>
  );
}
