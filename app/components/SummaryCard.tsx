"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Download, Share2, Check, X, Quote, Crown } from "lucide-react";
import { toPng } from "html-to-image";

interface SummaryCardProps {
  summary: string;
  type: "board" | "global";
  onClose?: () => void;
}

export default function SummaryCard({ summary, type, onClose }: SummaryCardProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        style: {
          transform: "scale(1)",
          borderRadius: "0",
        },
      });
      const link = document.createElement("a");
      link.download = `teaaa-vibe-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Download failed", err);
    } finally {
      setDownloading(false);
    }
  };

  const isBoard = type === "board";

  // Premium color palettes
  const colors = {
    board: {
      primary: "#e85555",
      primarySoft: "rgba(232, 85, 85, 0.15)",
      primaryGlow: "rgba(232, 85, 85, 0.4)",
      background: "linear-gradient(165deg, #1a0e0e 0%, #2d1515 25%, #1f0a0a 50%, #150808 75%, #0d0505 100%)",
      text: "#faf0ed",
      textMuted: "rgba(250, 240, 237, 0.6)",
      accent: "#ff7b7b",
      cardBg: "rgba(45, 21, 21, 0.6)",
      border: "rgba(232, 85, 85, 0.2)",
      buttonBg: "rgba(255, 255, 255, 0.95)",
      buttonText: "#1a0e0e",
    },
    global: {
      primary: "#d4a857",
      primarySoft: "rgba(212, 168, 87, 0.15)",
      primaryGlow: "rgba(212, 168, 87, 0.4)",
      background: "linear-gradient(165deg, #1a1520 0%, #2a2035 25%, #1a1520 50%, #12101a 75%, #0d0b12 100%)",
      text: "#f5f0e8",
      textMuted: "rgba(245, 240, 232, 0.6)",
      accent: "#f0d78c",
      cardBg: "rgba(42, 32, 53, 0.6)",
      border: "rgba(212, 168, 87, 0.2)",
      buttonBg: "rgba(255, 255, 255, 0.95)",
      buttonText: "#1a1520",
    },
  };

  const c = colors[isBoard ? "board" : "global"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, y: 20 }}
      transition={{
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className="w-full max-w-[480px] mx-auto mb-10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── Visual Card ── */}
      <div
        ref={cardRef}
        className="relative overflow-hidden"
        style={{ padding: "0", borderRadius: "0" }}
      >
        {/* Card wrapper with glass effect */}
        <div
          className="relative overflow-hidden"
          style={{
            borderRadius: "28px",
            background: c.background,
            boxShadow: isHovered
              ? `0 25px 60px -12px ${c.primarySoft}, 0 0 0 1px ${c.border}, inset 0 1px 0 rgba(255,255,255,0.1)`
              : `0 20px 50px -15px ${c.primarySoft}, 0 0 0 1px ${c.border}, inset 0 1px 0 rgba(255,255,255,0.05)`,
            transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* Inner content wrapper */}
          <div className="relative p-10 overflow-hidden" style={{ padding: "48px 40px" }}>

            {/* Ambient glow effects - top right */}
            <div
              className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-[100px] transition-opacity duration-700"
              style={{
                background: `radial-gradient(circle, ${c.primarySoft} 0%, transparent 70%)`,
                opacity: isHovered ? 1 : 0.7,
              }}
            />

            {/* Ambient glow effects - bottom left */}
            <div
              className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full blur-[100px] transition-opacity duration-700"
              style={{
                background: `radial-gradient(circle, ${c.primarySoft.replace('0.15', '0.08')} 0%, transparent 70%)`,
                opacity: isHovered ? 1 : 0.6,
              }}
            />

            {/* Animated shine effect */}
            <div
              className="absolute inset-0 pointer-events-none overflow-hidden"
              style={{
                background: `linear-gradient(
                  105deg,
                  transparent 40%,
                  ${c.primarySoft} 45%,
                  ${c.primarySoft} 50%,
                  transparent 55%
                )`,
                transform: isHovered ? "translateX(100%)" : "translateX(-100%)",
                transition: "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />

            {/* Subtle noise texture */}
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              }}
            />

            {/* Premium border gradient */}
            <div
              className="absolute inset-0 rounded-[28px] pointer-events-none"
              style={{
                padding: "1px",
                background: `linear-gradient(
                  135deg,
                  ${c.border} 0%,
                  transparent 30%,
                  transparent 70%,
                  ${c.border} 100%
                )`,
                mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                maskComposite: "exclude",
                WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
              }}
            />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center text-center">

              {/* Premium badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mb-6"
              >
                <div
                  className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md"
                  style={{
                    background: `linear-gradient(135deg, ${c.primarySoft} 0%, transparent 100%)`,
                    border: `1px solid ${c.border}`,
                  }}
                >
                  <Crown size={12} style={{ color: c.primary }} />
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.25em]"
                    style={{ color: c.primary }}
                  >
                    Premium Insight
                  </span>
                </div>
              </motion.div>

              {/* Icon with glow */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5, type: "spring" }}
                className="relative mb-8"
              >
                {/* Glow ring */}
                <div
                  className="absolute inset-0 rounded-2xl blur-xl"
                  style={{
                    background: c.primaryGlow,
                    transform: "scale(1.3)",
                    opacity: isHovered ? 0.6 : 0.3,
                    transition: "opacity 0.5s ease",
                  }}
                />

                <div
                  className="relative w-18 h-18 rounded-2xl flex items-center justify-center backdrop-blur-sm"
                  style={{
                    width: "72px",
                    height: "72px",
                    background: `linear-gradient(145deg, ${c.primarySoft} 0%, rgba(0,0,0,0.2) 100%)`,
                    border: `1px solid ${c.border}`,
                    boxShadow: `inset 0 2px 4px rgba(255,255,255,0.05), 0 4px 16px ${c.primarySoft}`,
                  }}
                >
                  <Crown
                    size={32}
                    style={{
                      color: c.primary,
                      filter: `drop-shadow(0 0 8px ${c.primaryGlow})`,
                    }}
                  />
                </div>
              </motion.div>

              {/* Title with decorative lines */}
              <div className="relative mb-8">
                <div
                  className="absolute top-1/2 left-[-60px] w-12 h-px"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${c.border})`,
                  }}
                />
                <div
                  className="absolute top-1/2 right-[-60px] w-12 h-px"
                  style={{
                    background: `linear-gradient(90deg, ${c.border}, transparent)`,
                  }}
                />
                <h2
                  className="text-[11px] font-bold uppercase tracking-[0.35em] whitespace-nowrap"
                  style={{ color: c.textMuted }}
                >
                  {isBoard ? "✦ Board Vibe Revealed ✦" : "✦ Global Teapot Summary ✦"}
                </h2>
              </div>

              {/* Quote with elegant styling */}
              <motion.div
                className="relative w-full max-w-[380px] mb-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {/* Large decorative quote mark */}
                <Quote
                  className="absolute -top-6 -left-4 opacity-[0.06]"
                  size={80}
                  style={{ color: c.primary }}
                />

                <p
                  className="relative z-10 text-[22px] leading-[1.7] font-light"
                  style={{
                    color: c.text,
                    fontFamily: "'Georgia', 'Times New Roman', serif",
                    fontStyle: "italic",
                    textShadow: "0 2px 20px rgba(0,0,0,0.3)",
                  }}
                >
                  &ldquo;{summary}&rdquo;
                </p>
              </motion.div>

              {/* Premium divider */}
              <div className="relative w-full mb-8">
                <div
                  className="h-px w-full"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${c.border}, transparent)`,
                  }}
                />
                {/* Center diamond */}
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rotate-45"
                  style={{
                    background: c.primary,
                    boxShadow: `0 0 12px ${c.primaryGlow}`,
                  }}
                />
              </div>

              {/* Footer with type indicator */}
              <div className="flex items-center justify-center gap-4">
                {/* Tea cup icon */}
                <div
                  className="flex items-center gap-3 px-4 py-2 rounded-full backdrop-blur-sm"
                  style={{
                    background: `linear-gradient(135deg, ${c.cardBg} 0%, transparent 100%)`,
                    border: `1px solid ${c.border}`,
                  }}
                >
                  <span className="text-lg">{isBoard ? "☕" : "🫖"}</span>
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.2em]"
                    style={{ color: c.textMuted }}
                  >
                    {isBoard ? "Confession Board" : "Global Confessions"}
                  </span>
                </div>
              </div>

              {/* Watermark - bottom right */}
              <div className="absolute bottom-4 right-6">
                <span
                  className="text-[8px] font-black uppercase tracking-[0.2em] italic"
                  style={{ color: c.border }}
                >
                  teaaa.me
                </span>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── Premium Action Buttons ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="flex items-center justify-center gap-4 mt-8"
      >
        {/* Download Button */}
        <motion.button
          onClick={handleDownload}
          disabled={downloading}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="group relative h-14 px-8 rounded-full font-bold text-[11px] uppercase tracking-[0.2em] overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${c.primary} 0%, ${c.primarySoft.replace('0.15', '0.25').replace('rgba', 'rgb').replace(/,\s*\d+\.\d+\)/, ', 0.8)')} 100%)`,
            color: "#ffffff",
            boxShadow: `0 8px 32px -8px ${c.primarySoft}`,
          }}
        >
          {/* Shine effect */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: `linear-gradient(
                105deg,
                transparent 30%,
                rgba(255,255,255,0.3) 50%,
                transparent 70%
              )`,
            }}
          />

          <span className="relative z-10 flex items-center gap-3">
            {downloading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                />
                <span>Brewing...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Download</span>
              </>
            )}
          </span>
        </motion.button>

        {/* Copy Button */}
        <motion.button
          onClick={handleCopy}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="group relative h-14 px-8 rounded-full font-bold text-[11px] uppercase tracking-[0.2em] overflow-hidden backdrop-blur-md"
          style={{
            background: `rgba(255, 255, 255, 0.08)`,
            border: `1px solid ${c.border}`,
            color: c.text,
            boxShadow: `0 8px 32px -8px rgba(0,0,0,0.3)`,
          }}
        >
          {/* Border glow on hover */}
          <div
            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              boxShadow: `inset 0 0 20px ${c.primarySoft}`,
            }}
          />

          {/* Shine effect */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: `linear-gradient(
                105deg,
                transparent 30%,
                rgba(255,255,255,0.1) 50%,
                transparent 70%
              )`,
            }}
          />

          <AnimatePresence mode="wait">
            {copied ? (
              <motion.span
                key="copied"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative z-10 flex items-center gap-3"
              >
                <Check size={16} style={{ color: c.primary }} />
                <span>Copied!</span>
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative z-10 flex items-center gap-3"
              >
                <Share2 size={16} />
                <span>Share</span>
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Close Button */}
        {onClose && (
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300"
            style={{
              background: `rgba(255, 255, 255, 0.05)`,
              border: `1px solid rgba(255, 255, 255, 0.08)`,
              color: c.textMuted,
            }}
          >
            <X size={20} />
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}
