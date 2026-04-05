"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { CATEGORY_INFO } from "@/app/lib/utils";

type MoodDistribution = {
  total: number;
  distribution: Record<string, number>;
  dominant: string;
  recentActivity: number;
};

type MoodRingProps = {
  moodData: MoodDistribution;
  isAdmirerMode?: boolean;
};

// Map category → color with fallback
function getCategoryColor(cat: string): string {
  return CATEGORY_INFO[cat]?.color ?? "#666";
}
function getCategoryEmoji(cat: string): string {
  return CATEGORY_INFO[cat]?.emoji ?? "✨";
}
function getCategoryLabel(cat: string): string {
  return (
    CATEGORY_INFO[cat]?.label ?? cat.charAt(0).toUpperCase() + cat.slice(1)
  );
}

// Build a conic-gradient string from distribution
function buildConicGradient(
  distribution: Record<string, number>,
  total: number,
): string {
  if (total === 0)
    return "conic-gradient(from 0deg, #333 0%, #555 50%, #333 100%)";

  const entries = Object.entries(distribution).sort((a, b) => b[1] - a[1]);
  const stops: string[] = [];
  let accumulated = 0;

  for (const [cat, count] of entries) {
    const percentage = (count / total) * 100;
    const color = getCategoryColor(cat);
    stops.push(`${color} ${accumulated}%`);
    accumulated += percentage;
    stops.push(`${color} ${accumulated}%`);
  }

  // Close the circle
  if (stops.length > 0) {
    const firstColor = getCategoryColor(entries[0][0]);
    stops.push(`${firstColor} 100%`);
  }

  return `conic-gradient(from 0deg, ${stops.join(", ")})`;
}

// Generate mood phrase
function getMoodPhrase(
  distribution: Record<string, number>,
  total: number,
  isAdmirer: boolean,
): string {
  if (total === 0) return "Waiting for the first confession...";
  if (isAdmirer) {
    if (total === 1) return "A spark of love energy";
    if (total < 5) return "Love energy is building...";
    if (total < 15) return "The love is radiating strongly";
    return "Overflowing with love energy 💓";
  }

  const entries = Object.entries(distribution).sort((a, b) => b[1] - a[1]);
  const top1 = entries[0];
  const top2 = entries[1];

  if (entries.length === 1) {
    return `Pure ${getCategoryEmoji(top1[0])} ${getCategoryLabel(top1[0])} energy`;
  }

  const top1Pct = Math.round((top1[1] / total) * 100);
  if (top1Pct > 70) {
    return `Drowning in ${getCategoryEmoji(top1[0])} ${getCategoryLabel(top1[0])}`;
  }

  return `${getCategoryEmoji(top1[0])} ${getCategoryLabel(top1[0])} meets ${getCategoryEmoji(top2[0])} ${getCategoryLabel(top2[0])}`;
}

// Pulse duration based on activity
function getPulseDuration(recentActivity: number): number {
  if (recentActivity >= 10) return 1.2; // Very hot
  if (recentActivity >= 5) return 1.8;
  if (recentActivity >= 2) return 2.5;
  if (recentActivity >= 1) return 3;
  return 4; // Calm
}

// Activity label
function getActivityLabel(recentActivity: number): string {
  if (recentActivity >= 10) return "🔥 On fire";
  if (recentActivity >= 5) return "⚡ Very active";
  if (recentActivity >= 2) return "✨ Active";
  if (recentActivity >= 1) return "🌊 Flowing";
  return "🌙 Calm";
}

// Orbiting particles based on distribution
function generateParticles(
  distribution: Record<string, number>,
  total: number,
) {
  const particles: {
    id: number;
    color: string;
    angle: number;
    distance: number;
    size: number;
    duration: number;
    delay: number;
  }[] = [];
  if (total === 0) return particles;

  const entries = Object.entries(distribution).sort((a, b) => b[1] - a[1]);
  let id = 0;

  for (const [cat, count] of entries.slice(0, 5)) {
    const numParticles = Math.min(Math.ceil((count / total) * 8), 4);
    const color = getCategoryColor(cat);
    for (let j = 0; j < numParticles; j++) {
      particles.push({
        id: id++,
        color,
        angle: (id * 137.5) % 360, // Golden angle distribution
        distance: 52 + Math.random() * 20,
        size: 2 + Math.random() * 3,
        duration: 3 + Math.random() * 4,
        delay: Math.random() * 3,
      });
    }
  }

  return particles.slice(0, 14);
}

export default function MoodRing({
  moodData,
  isAdmirerMode = false,
}: MoodRingProps) {
  const [expanded, setExpanded] = useState(false);
  const { total, distribution, dominant, recentActivity } = moodData;

  const conicGradient = useMemo(
    () => buildConicGradient(distribution, total),
    [distribution, total],
  );

  const particles = useMemo(
    () => generateParticles(distribution, total),
    [distribution, total],
  );

  const pulseDuration = getPulseDuration(recentActivity);
  const moodPhrase = getMoodPhrase(distribution, total, isAdmirerMode);
  const activityLabel = getActivityLabel(recentActivity);
  const dominantColor = dominant ? getCategoryColor(dominant) : "#666";

  // Sort entries by count descending for the breakdown
  const sortedEntries = useMemo(
    () => Object.entries(distribution).sort((a, b) => b[1] - a[1]),
    [distribution],
  );

  if (total < 3) return null; // Need at least 3 confessions for meaningful data

  return (
    <div className="flex flex-col items-center relative">
      {/* The Mood Ring */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="relative group focus:outline-none"
      >
        {/* Outer ambient glow */}
        <motion.div
          className="absolute inset-[-24px] rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${dominantColor}22 0%, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: pulseDuration * 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Rotating conic gradient ring */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28">
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: conicGradient,
              filter: "blur(1px)",
            }}
            animate={{ rotate: [0, 360] }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          {/* Inner cutout — creates the "ring" shape */}
          <div
            className="absolute inset-[4px] rounded-full"
            style={{
              background: isAdmirerMode
                ? "radial-gradient(circle, #1a0e16 0%, #120d11 100%)"
                : "radial-gradient(circle, #fff 0%, #faf8f5 100%)",
            }}
          />

          {/* Center pulsing glow */}
          <motion.div
            className="absolute inset-[8px] rounded-full"
            style={{
              background: `radial-gradient(circle, ${dominantColor}30 0%, transparent 70%)`,
            }}
            animate={
              isAdmirerMode
                ? {
                    // Heartbeat: quick-quick-pause
                    scale: [1, 1.15, 1, 1.1, 1, 1, 1],
                    opacity: [0.3, 0.8, 0.3, 0.6, 0.3, 0.3, 0.3],
                  }
                : {
                    scale: [1, 1.12, 1],
                    opacity: [0.3, 0.7, 0.3],
                  }
            }
            transition={{
              duration: isAdmirerMode ? 1.6 : pulseDuration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Center dominant emoji */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              className="text-2xl sm:text-3xl"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{
                duration: pulseDuration,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {isAdmirerMode ? "💓" : getCategoryEmoji(dominant)}
            </motion.span>
          </div>

          {/* Orbiting particles */}
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: p.size,
                height: p.size,
                background: p.color,
                boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                top: "50%",
                left: "50%",
              }}
              animate={{
                x: [
                  Math.cos((p.angle * Math.PI) / 180) * p.distance,
                  Math.cos(((p.angle + 120) * Math.PI) / 180) * p.distance,
                  Math.cos(((p.angle + 240) * Math.PI) / 180) * p.distance,
                  Math.cos((p.angle * Math.PI) / 180) * p.distance,
                ],
                y: [
                  Math.sin((p.angle * Math.PI) / 180) * p.distance,
                  Math.sin(((p.angle + 120) * Math.PI) / 180) * p.distance,
                  Math.sin(((p.angle + 240) * Math.PI) / 180) * p.distance,
                  Math.sin((p.angle * Math.PI) / 180) * p.distance,
                ],
                opacity: [0, 0.9, 0.5, 0],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Hover hint */}
        <motion.div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 2, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {expanded ? (
            <ChevronUp
              size={14}
              className={isAdmirerMode ? "text-white/30" : "text-black/20"}
            />
          ) : (
            <ChevronDown
              size={14}
              className={isAdmirerMode ? "text-white/30" : "text-black/20"}
            />
          )}
        </motion.div>
      </button>

      {/* Mood text */}
      <motion.p
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mt-3 text-[11px] font-bold tracking-wide text-center ${
          isAdmirerMode ? "text-white/60" : "text-black/40"
        }`}
      >
        {moodPhrase}
      </motion.p>

      <div className="flex items-center gap-2 mt-1">
        <span
          className={`text-[9px] font-medium uppercase tracking-widest ${
            isAdmirerMode ? "text-white/30" : "text-black/20"
          }`}
        >
          {activityLabel}
        </span>
        <span
          className={`text-[9px] ${isAdmirerMode ? "text-white/20" : "text-black/15"}`}
        >
          •
        </span>
        <span
          className={`text-[9px] font-medium uppercase tracking-widest ${
            isAdmirerMode ? "text-white/30" : "text-black/20"
          }`}
        >
          {total} confessions
        </span>
      </div>

      {/* Expanded breakdown */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-xs mt-4 overflow-hidden"
          >
            <div
              className={`rounded-2xl border p-4 ${
                isAdmirerMode
                  ? "bg-white/5 border-white/10 backdrop-blur-xl"
                  : "bg-white border-black/5 shadow-lg shadow-black/[0.03]"
              }`}
            >
              <p
                className={`text-[9px] font-bold uppercase tracking-[0.2em] mb-3 ${
                  isAdmirerMode ? "text-white/40" : "text-black/25"
                }`}
              >
                Emotion Breakdown
              </p>

              {/* Stacked bar */}
              <div className="flex h-3 rounded-full overflow-hidden mb-4">
                {sortedEntries.map(([cat, count]) => (
                  <motion.div
                    key={cat}
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / total) * 100}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    style={{ background: getCategoryColor(cat) }}
                    className="h-full first:rounded-l-full last:rounded-r-full"
                  />
                ))}
              </div>

              {/* Category breakdown list */}
              <div className="space-y-2">
                {sortedEntries.map(([cat, count]) => {
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={cat} className="flex items-center gap-2.5">
                      <span className="text-sm flex-shrink-0">
                        {getCategoryEmoji(cat)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span
                            className={`text-[10px] font-bold ${
                              isAdmirerMode ? "text-white/70" : "text-black/60"
                            }`}
                          >
                            {getCategoryLabel(cat)}
                          </span>
                          <span
                            className={`text-[10px] font-mono ${
                              isAdmirerMode ? "text-white/40" : "text-black/30"
                            }`}
                          >
                            {pct}%
                          </span>
                        </div>
                        <div
                          className={`h-1 rounded-full overflow-hidden ${
                            isAdmirerMode ? "bg-white/10" : "bg-black/5"
                          }`}
                        >
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{
                              duration: 0.8,
                              delay: 0.1,
                              ease: "easeOut",
                            }}
                            className="h-full rounded-full"
                            style={{ background: getCategoryColor(cat) }}
                          />
                        </div>
                      </div>
                      <span
                        className={`text-[9px] font-mono flex-shrink-0 ${
                          isAdmirerMode ? "text-white/25" : "text-black/20"
                        }`}
                      >
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
