"use client";

import Link from "next/link";
import { THEMES } from "@/convex/helpers";
import { BookOpen } from "lucide-react";
import { motion } from "framer-motion";

interface DeepSpillCardProps {
  slug: string; // The board slug
  spill: any; // Accept any spill type
  index?: number;
  rank?: number; // Optional global rank index
}

export default function DeepSpillCard({
  slug,
  spill,
  index = 0,
  rank,
}: DeepSpillCardProps) {
  const theme =
    THEMES.find((e: any) => e.key === spill.coverTheme) || THEMES[0];
  const spillTags: string[] = [];

  // Aggregate tags/categories
  if (spill.tags && spill.tags.length > 0) {
    spillTags.push(...spill.tags);
  } else if (spill.category) {
    spillTags.push(spill.category);
  }

  // Use board slug if available directly on spill (global feed)
  const targetSlug = spill.boardSlug || slug;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 * index, duration: 0.4 }}
      className="w-full max-w-[280px] mx-auto relative group"
    >
      {/* Optional Rank Badge */}
      {rank !== undefined && (
        <div
          className={`
          absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-lg border-[3px] border-white z-50 transition-transform hover:scale-110
          ${
            rank < 3
              ? [
                  "bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-500/20",
                  "bg-gradient-to-br from-slate-300 to-slate-500 shadow-slate-400/20",
                  "bg-gradient-to-br from-orange-400 to-orange-700 shadow-orange-600/20",
                ][rank]
              : "bg-slate-800"
          }
        `}
        >
          {rank === 0
            ? "🥇"
            : rank === 1
              ? "🥈"
              : rank === 2
                ? "🥉"
                : `${rank + 1}`}
        </div>
      )}

      <Link
        href={`/b/${targetSlug}/s/${spill._id}`}
        className="book-card"
        style={{ display: "block", textDecoration: "none", color: "inherit" }}
      >
        {/* Book cover */}
        <div style={{ position: "relative", marginBottom: 14 }}>
          {/* Ambient glow behind book */}
          <div
            className="book-glow"
            style={{
              position: "absolute",
              inset: "10% 5%",
              bottom: "-12%",
              borderRadius: "50%",
              background: spill.aiImageUrl
                ? "rgba(201,150,42,0.25)"
                : `${theme.accent || "#c9962a"}33`,
              filter: "blur(20px)",
              opacity: 0,
              transition: "opacity 0.4s",
              zIndex: 0,
            }}
          />

          {/* The cover itself */}
          <div
            className="book-cover"
            style={{
              position: "relative",
              zIndex: 1,
              aspectRatio: "3/4",
              borderRadius: "3px 12px 12px 3px",
              overflow: "hidden",
              boxShadow:
                "var(--shadow-book, 0 20px 60px rgba(26,18,9,0.18), 0 4px 16px rgba(26,18,9,0.12))",
              transition:
                "transform 0.35s cubic-bezier(0.34,1.4,0.64,1), box-shadow 0.35s ease",
              background: spill.aiImageUrl
                ? `url(${spill.aiImageUrl}) center/cover`
                : theme.bg,
              // Left spine border
              borderLeft: "7px solid rgba(26,18,9,0.22)",
            }}
          >
            {/* Spine sheen */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 18,
                background:
                  "linear-gradient(90deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.05) 60%, transparent 100%)",
                zIndex: 2,
              }}
            />

            {/* Overlay for AI image covers */}
            {spill.aiImageUrl && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, rgba(26,18,9,0.1) 0%, rgba(26,18,9,0.55) 100%)",
                  zIndex: 1,
                }}
              />
            )}

            {/* Inner content */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 2,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "14px 10px",
                textAlign: "center",
              }}
            >
              {/* Top label */}
              <span
                style={{
                  fontSize: 7,
                  fontWeight: 800,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  color: spill.aiImageUrl
                    ? "rgba(245,239,230,0.75)"
                    : theme.accent,
                }}
              >
                Spill Story
              </span>

              {/* Center */}
              <div>
                {!spill.aiImageUrl && (
                  <div style={{ fontSize: 28, marginBottom: 8 }}>
                    {spill.coverEmoji}
                  </div>
                )}

                {/* Gold rule */}
                <div
                  style={{
                    width: "40%",
                    height: 1,
                    background: spill.aiImageUrl
                      ? "rgba(245,239,230,0.4)"
                      : `${theme.accent || "#c9962a"}55`,
                    margin: "0 auto 8px",
                  }}
                />

                <h3
                  className="serif"
                  style={{
                    fontSize: "clamp(13px, 2.5vw, 16px)",
                    fontWeight: 900,
                    lineHeight: 1.15,
                    color: spill.aiImageUrl ? "#fff" : theme.text,
                    letterSpacing: "-0.01em",
                    fontFamily: "'Playfair Display', Georgia, serif",
                  }}
                >
                  {spill.title}
                </h3>

                <div
                  style={{
                    width: "40%",
                    height: 1,
                    background: spill.aiImageUrl
                      ? "rgba(245,239,230,0.4)"
                      : `${theme.accent || "#c9962a"}55`,
                    margin: "8px auto 0",
                  }}
                />
              </div>

              {/* Bottom read CTA */}
              <span
                className="garamond"
                style={{
                  fontSize: 9,
                  fontStyle: "italic",
                  letterSpacing: "0.12em",
                  color: spill.aiImageUrl
                    ? "rgba(232,194,106,0.9)"
                    : theme.accent,
                  fontFamily: "'EB Garamond', Georgia, serif",
                }}
              >
                Read Now →
              </span>
            </div>

            {/* Subtle page-edge on right */}
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 4,
                bottom: 4,
                width: 3,
                background:
                  "repeating-linear-gradient(180deg, rgba(245,239,230,0.6) 0px, rgba(245,239,230,0.6) 2px, rgba(200,185,160,0.4) 2px, rgba(200,185,160,0.4) 4px)",
                borderRadius: "0 2px 2px 0",
              }}
            />
          </div>
        </div>

        {/* Book meta */}
        <div style={{ paddingLeft: 4 }}>
          <p
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--ink-faint, #8b7355)",
              marginBottom: 5,
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
          >
            {spill.displayName}
          </p>

          {/* About with shimmer */}
          {spill.about && (
            <p
              className="shimmer-text"
              style={{
                fontSize: 10,
                fontWeight: 500,
                lineHeight: 1.5,
                margin: "0 0 8px 0",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                fontFamily: "'EB Garamond', Georgia, serif",
                fontStyle: "italic",
              }}
            >
              {spill.about}
            </p>
          )}

          {/* Tag chips */}
          {spillTags.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 4,
                marginBottom: 6,
              }}
            >
              {spillTags.slice(0, 3).map((t: string, i: number) => (
                <span
                  key={i}
                  style={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    borderRadius: 999,
                    padding: "1.5px",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      inset: "-1000%",
                      animation: "spin-slow 4s linear infinite",
                      background:
                        "conic-gradient(from 90deg at 50% 50%, #c9962a 0%, #8b2635 50%, #c9962a 100%)",
                      opacity: 0.3,
                    }}
                  />
                  <span
                    style={{
                      position: "relative",
                      display: "inline-flex",
                      alignItems: "center",
                      borderRadius: 999,
                      background: "#f5efe6",
                      padding: "2px 8px",
                      fontSize: 7,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--ink-mid, #3d2f1e)",
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                    }}
                  >
                    {t}
                  </span>
                </span>
              ))}
            </div>
          )}

          {/* Reads */}
          <p
            style={{
              fontSize: 9,
              color: "var(--ink-faint, #8b7355)",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
          >
            <BookOpen size={9} />
            {spill.views?.toLocaleString() || 0} reads
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
