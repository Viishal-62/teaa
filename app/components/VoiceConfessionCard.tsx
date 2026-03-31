"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSpring, animated } from "@react-spring/web";
import { Play, Pause, Share2, Check, Eye, MessageCircle } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CATEGORY_INFO, REACTION_INFO, getVisitorId } from "@/app/lib/utils";
import Link from "next/link";

interface VoiceConfessionCardProps {
  id: string;
  audioUrl: string;
  category: string;
  timestamp: string;
  voiceTitle?: string;
  displayName?: string;
  views?: number;
  boardSlug?: string;
  boardReactions?: string[];
}

const BAR_COUNT = 40;

const generateIdleBars = () =>
  Array(BAR_COUNT)
    .fill(0)
    .map((_, i) => 0.08 + Math.sin((i / BAR_COUNT) * Math.PI * 2) * 0.06);

export const VoiceConfessionCard = ({
  id,
  audioUrl,
  category,
  timestamp,
  voiceTitle,
  displayName,
  views,
  boardSlug: propBoardSlug,
  boardReactions,
}: VoiceConfessionCardProps) => {
  const confessionId = id as Id<"confessions">;
  const boardSlug = propBoardSlug || "global";
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bars, setBars] = useState<number[]>(generateIdleBars);
  const [copied, setCopied] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const animFrameRef = useRef<number>(0);

  const catInfo = CATEGORY_INFO[category];
  const catColor = catInfo?.color ?? "#d13d3d";
  const toggleReaction = useMutation(api.reactions.toggle);
  const incrementView = useMutation(api.confessions.incrementView);
  const reactionCounts = useQuery(api.reactions.getCounts, { confessionId });
  const totalReactions = useQuery(api.reactions.getTotalCount, { confessionId });
  const visitorId = getVisitorId();
  const visitorReactions = useQuery(
    api.reactions.getVisitorReactions,
    visitorId ? { confessionId, visitorId } : "skip",
  );
  const commentCount = useQuery(api.comments.countByConfession, { confessionId });

  const progressSpring = useSpring({
    width: duration ? (currentTime / duration) * 100 : 0,
    config: { tension: 280, friction: 60 },
  });

  // ── Animate waveform bars (no AudioContext — just animated simulation based on time) ──
  const animateVisualizer = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audio.paused) return;

    const progress = audio.currentTime / (audio.duration || 1);
    const time = Date.now() / 1000;

    const newBars = Array(BAR_COUNT)
      .fill(0)
      .map((_, i) => {
        const norm = i / BAR_COUNT;
        const playedPct = progress;
        // Bars near playhead are tallest
        const distFromHead = Math.abs(norm - playedPct);
        const headBoost = Math.max(0, 1 - distFromHead * 4);
        // Organic wave movement
        const wave = Math.sin(time * 3 + i * 0.6) * 0.15;
        const wave2 = Math.sin(time * 5 + i * 0.3) * 0.1;
        const base = norm < playedPct ? 0.25 : 0.08;
        return Math.min(1, Math.max(0.04, base + headBoost * 0.5 + wave + wave2));
      });

    setBars(newBars);
    animFrameRef.current = requestAnimationFrame(animateVisualizer);
  }, []);

  // ── Audio events ──
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMeta = () => setDuration(audio.duration);
    const onEnded = () => {
      setIsPlaying(false);
      cancelAnimationFrame(animFrameRef.current);
      setBars(generateIdleBars());
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMeta);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMeta);
      audio.removeEventListener("ended", onEnded);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      animateVisualizer();
    } else {
      cancelAnimationFrame(animFrameRef.current);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying, animateVisualizer]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(console.error);
      incrementView({ confessionId }).catch(() => { });
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = pct * duration;
  };

  const handleReactionClick = async (type: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!visitorId) return;
    await toggleReaction({ confessionId, type: type as any, visitorId });
  };

  const handleShare = useCallback(async () => {
    const url = typeof window !== "undefined"
      ? `${window.location.origin}/b/${boardSlug}/c/${confessionId}`
      : "";
    if (navigator.share) {
      try {
        await navigator.share({
          title: "A voice confession on Teaaa 🫖",
          text: voiceTitle
            ? `"${voiceTitle}" — listen to this anonymous voice confession`
            : "Listen to this anonymous voice confession",
          url,
        });
        return;
      } catch { }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [boardSlug, confessionId, voiceTitle]);

  const activeReactions =
    boardReactions && boardReactions.length > 0
      ? boardReactions
      : ["holding-you", "feels-heavy", "youll-be-ok", "no-it-burns"];

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  };

  const progressPct = duration ? (currentTime / duration) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="group w-full"
    >
      <div
        className="relative rounded-2xl overflow-hidden border border-black/[0.06] shadow-sm hover:shadow-xl transition-shadow duration-500"
        style={{
          background: "linear-gradient(168deg, #fefdfb 0%, #faf7f2 60%, #f5f0e8 100%)",
        }}
      >
        {/* Top accent line */}
        <div
          className="h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent 5%, ${catColor} 50%, transparent 95%)`,
          }}
        />

        <div className="p-5">
          {/* ── Header ── */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <motion.div
                // animate={isPlaying ? { rotate: [0, 360] } : {}}
                transition={isPlaying ? { repeat: Infinity, duration: 3, ease: "linear" } : {}}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${catColor}12` }}
              >
                <span className="text-base">{catInfo?.emoji || "🎙️"}</span>
              </motion.div>
              <div className="min-w-0">
                {voiceTitle ? (
                  <p className="text-sm font-bold text-black truncate leading-tight">
                    {voiceTitle}
                  </p>
                ) : (
                  <p className="text-xs font-bold text-black/50">Voice Confession</p>
                )}
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="text-[8px] font-black uppercase tracking-[0.1em] px-1.5 py-0.5 rounded"
                    style={{ color: catColor, background: `${catColor}12` }}
                  >
                    {catInfo?.label ?? category}
                  </span>
                  <span className="text-[9px] text-black/20 font-medium">
                    {timestamp}
                  </span>
                </div>
              </div>
            </div>

            {displayName && (
              <span className="text-[9px] text-black/25 font-bold flex-shrink-0">
                {displayName}
              </span>
            )}
          </div>

          {/* ── Waveform ── */}
          <div
            className="rounded-xl p-3 mb-3"
            style={{ background: `${catColor}06`, border: `1px solid ${catColor}0a` }}
          >
            <div className="flex items-end justify-center gap-[2px] h-12 mb-3">
              {bars.map((h, i) => {
                const played = progressPct > 0 && (i / BAR_COUNT) * 100 < progressPct;
                return (
                  <motion.div
                    key={i}
                    className="rounded-full flex-1"
                    animate={{ height: `${Math.max(6, h * 100)}%` }}
                    transition={{
                      type: "spring",
                      stiffness: 350,
                      damping: 18,
                      mass: 0.4,
                    }}
                    style={{
                      maxWidth: "4px",
                      background: played
                        ? `linear-gradient(to top, ${catColor}, ${catColor}bb)`
                        : `${catColor}20`,
                      boxShadow: played ? `0 0 4px ${catColor}30` : "none",
                    }}
                  />
                );
              })}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={handlePlayPause}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${catColor}, ${catColor}dd)`,
                  boxShadow: isPlaying ? `0 3px 14px ${catColor}40` : `0 2px 8px ${catColor}25`,
                }}
              >
                <AnimatePresence mode="wait">
                  {isPlaying ? (
                    <motion.div key="p" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Pause size={16} />
                    </motion.div>
                  ) : (
                    <motion.div key="l" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Play size={16} className="ml-0.5" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {isPlaying && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ border: `2px solid ${catColor}` }}
                    animate={{ scale: [1, 1.35], opacity: [0.4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                  />
                )}
              </motion.button>

              <div className="flex-1 space-y-1">
                <div
                  className="w-full h-1 rounded-full cursor-pointer overflow-hidden"
                  style={{ background: `${catColor}12` }}
                  onClick={handleSeek}
                >
                  <animated.div
                    className="h-full rounded-full"
                    style={{
                      width: progressSpring.width.to((w) => `${w}%`),
                      background: catColor,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[8px] font-mono text-black/20 px-0.5">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Reactions ── */}
          <div className="flex items-center justify-center gap-2 mb-2">
            {activeReactions.map((type) => {
              const info = REACTION_INFO[type];
              if (!info) return null;
              const count = reactionCounts?.[type] ?? 0;
              const isActive = visitorReactions?.includes(type);
              return (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.15, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => handleReactionClick(type, e)}
                  className="flex flex-col items-center gap-0.5"
                >
                  <span className={`text-base transition-transform ${isActive ? "scale-110 drop-shadow" : ""}`}>
                    {info.emoji}
                  </span>
                  {count > 0 && (
                    <span className="text-[7px] font-black text-black/35 tabular-nums">{count}</span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between pt-2 border-t border-black/[0.04]">
            <div className="flex items-center gap-2 text-[8px] text-black/20 font-medium">
              <Eye size={9} />
              <span>{views || 0}</span>
              {totalReactions !== undefined && totalReactions > 0 && (
                <>
                  <span className="text-black/10">·</span>
                  <span>Felt by {totalReactions}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Link
                href={`/b/${boardSlug}/c/${confessionId}`}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[8px] font-bold uppercase tracking-wider text-black/30 hover:text-black/50 hover:bg-black/[0.03] transition-all"
              >
                <MessageCircle size={9} />
                {commentCount !== undefined && commentCount > 0 ? (
                  <span>{commentCount} {commentCount === 1 ? "Reply" : "Replies"}</span>
                ) : (
                  <span>Reply</span>
                )}
              </Link>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShare}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[8px] font-bold uppercase tracking-wider text-black/30 hover:text-black/50 hover:bg-black/[0.03] transition-all"
              >
                {copied ? (
                  <>
                    <Check size={9} className="text-green-500" />
                    <span className="text-green-500">Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 size={9} />
                    Share
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Hidden audio — crossOrigin for Cloudinary compatibility */}
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          crossOrigin="anonymous"
          className="hidden"
        />
      </div>
    </motion.div>
  );
};
