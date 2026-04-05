"use client";

import { motion, useMotionValue } from "framer-motion";
import { Heart } from "lucide-react";
import type { RefObject } from "react";
import { useRef, useState } from "react";
import { CATEGORY_INFO, timeAgo } from "@/app/lib/utils";
import type { Doc } from "@/convex/_generated/dataModel";

type MemoryStickyCardProps = {
  confession: Doc<"confessions">;
  onClick: () => void;
  rotateAmount: number;
  offsetX?: number;
  offsetY?: number;
  dragBoundsRef?: RefObject<HTMLDivElement | null>;
};

function formatCategory(category: string) {
  return category
    .replace(/-/g, " ")
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function MemoryStickyCard({
  confession,
  onClick,
  rotateAmount,
  offsetX = 0,
  offsetY = 0,
  dragBoundsRef,
}: MemoryStickyCardProps) {
  const suppressClickUntil = useRef(0);
  const isDragging = useRef(false);
  const [hasEnteredView, setHasEnteredView] = useState(false);

  // Use motion values so drag position persists after drop
  const x = useMotionValue(offsetX);
  const y = useMotionValue(offsetY + 26); // start slightly below for entrance animation

  const categoryInfo = CATEGORY_INFO[confession.category] ?? {
    label: formatCategory(confession.category),
    emoji: "💌",
  };

  // Entrance animation — run once on mount
  if (!hasEnteredView) {
    // Animate from initial to target position
    requestAnimationFrame(() => {
      x.set(offsetX);
      y.set(offsetY);
      setHasEnteredView(true);
    });
  }

  return (
    <motion.button
      type="button"
      drag
      dragConstraints={dragBoundsRef}
      dragMomentum={false}
      onClick={(event) => {
        event.stopPropagation();
        if (Date.now() < suppressClickUntil.current) return;
        if (isDragging.current) return;
        onClick();
      }}
      onDragStart={() => {
        isDragging.current = true;
      }}
      onDragEnd={(_, info) => {
        const movement = Math.abs(info.offset.x) + Math.abs(info.offset.y);
        if (movement > 3) {
          suppressClickUntil.current = Date.now() + 300;
        }
        // Reset dragging state after a tick so click handler can check it
        requestAnimationFrame(() => {
          isDragging.current = false;
        });
      }}
      style={{
        x,
        y,
        rotate: rotateAmount,
        top: "50%",
        left: "50%",
        marginTop: "-160px",
        marginLeft: "-140px",
        transformOrigin: "center center",
      }}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{
        scale: 1.04,
        zIndex: 90,
      }}
      whileTap={{ scale: 0.98, cursor: "grabbing" }}
      transition={{
        opacity: { duration: 0.4 },
        scale: { type: "spring", stiffness: 200, damping: 20 },
      }}
      className="absolute w-[264px] sm:w-[286px] rounded-md bg-[#fffef9] p-3 pb-4 text-left cursor-grab active:cursor-grabbing border border-[#e6dfd2] shadow-[0_26px_52px_rgba(0,0,0,0.42)]"
    >
      <div className="pointer-events-none absolute -top-2 left-5 h-5 w-14 rotate-[-8deg] rounded-[2px] bg-[#f7e7b7]/75 shadow-sm border border-[#efe0b4]" />
      <div className="pointer-events-none absolute -top-2 right-5 h-5 w-14 rotate-[9deg] rounded-[2px] bg-[#f7e7b7]/75 shadow-sm border border-[#efe0b4]" />

      <div className="rounded-sm overflow-hidden border border-[#e8dcc6] bg-[#f5ecdd]">
        <div className="relative h-44 sm:h-48 bg-[radial-gradient(circle_at_30%_20%,#ffe7f2_0%,#e5b9cc_34%,#7d4a63_72%,#38232f_100%)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_78%,rgba(255,215,232,0.35)_0%,transparent_36%)]" />
          <div className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/25 px-2 py-1 text-[10px] font-semibold text-white/90">
            <span>{categoryInfo.emoji}</span>
            {categoryInfo.label}
          </div>
          <p className="absolute bottom-4 left-4 right-4 font-serif italic text-white text-[16px] leading-snug drop-shadow-[0_3px_14px_rgba(0,0,0,0.45)] line-clamp-3">
            "{confession.text}"
          </p>
        </div>
      </div>

      <div className="mt-3 px-1">
        <p className="text-[11px] font-black tracking-[0.16em] uppercase text-[#8c4c66]">
          {categoryInfo.emoji} {categoryInfo.label}
        </p>
        <p className="mt-1 text-[13px] font-semibold text-[#4a2a36]">
          {confession.displayName}
        </p>
        <div className="mt-1 flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#8b7280]">
            {timeAgo(confession.createdAt)}
          </p>
          <Heart size={12} className="text-[#c56d90]" fill="currentColor" />
        </div>
      </div>
    </motion.button>
  );
}
