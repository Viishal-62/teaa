"use client";

import Link from "next/link";
import { THEMES } from "@/convex/helpers";
import { BookOpen } from "lucide-react";

interface DeepSpillCardProps {
  slug: string; // The board slug
  spill: {
    _id: string;
    title: string;
    coverTheme: string;
    coverEmoji: string;
    aiImageUrl?: string;
    displayName: string;
    views?: number;
  };
}

export default function DeepSpillCard({ slug, spill }: DeepSpillCardProps) {
  const theme = THEMES.find((t) => t.key === spill.coverTheme) || THEMES[0];

  return (
    <Link href={`/b/${slug}/s/${spill._id}`} className="block perspective-1000">
      <div
        className="relative w-[300px] h-[400px] rounded-r-2xl rounded-l-md shadow-xl overflow-hidden cursor-pointer transition-transform hover:-translate-y-2 hover:shadow-2xl hover:rotate-y-[-5deg] duration-300 transform-style-3d border-l-[8px] border-black/20"
        style={{
          background: spill.aiImageUrl
            ? `url(${spill.aiImageUrl}) center/cover`
            : theme.bg,
        }}
      >
        {/* Book Texture Overlay */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05]" />

        {/* Spine Shadow */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/20 to-transparent" />

        {/* Content Wrapper (Darkens AI images slightly for text readability if present) */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-between p-8 text-center ${spill.aiImageUrl ? "bg-black/40 backdrop-blur-[2px]" : ""}`}
        >
          {/* Top Label */}
          <div className="flex flex-col items-center gap-2">
            <span
              className="text-[10px] font-bold uppercase tracking-[0.3em]"
              style={{ color: spill.aiImageUrl ? "#fff" : theme.accent }}
            >
              Deep Spill
            </span>
            <div
              className="w-8 h-[1px]"
              style={{
                background: spill.aiImageUrl ? "#fff" : theme.accent,
                opacity: 0.5,
              }}
            />
          </div>

          {/* Title Area */}
          <div className="flex flex-col items-center gap-4 w-full">
            {!spill.aiImageUrl && (
              <span className="text-4xl drop-shadow-md mb-2">
                {spill.coverEmoji}
              </span>
            )}
            <h3
              className="text-3xl font-black serif leading-[1.1] tracking-tight text-balance"
              style={{ color: spill.aiImageUrl ? "#ffffff" : theme.text }}
            >
              {spill.title}
            </h3>
          </div>

          {/* Author & Meta */}
          <div className="flex flex-col items-center gap-3">
            <span
              className="text-xs uppercase tracking-widest font-medium opacity-80"
              style={{ color: spill.aiImageUrl ? "#e2e8f0" : theme.text }}
            >
              By {spill.displayName}
            </span>

            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-md border border-white/10"
              style={{ color: spill.aiImageUrl ? "#fff" : theme.text }}
            >
              <BookOpen size={10} />
              <span className="text-[9px] font-bold tracking-widest uppercase">
                Read Spills
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
