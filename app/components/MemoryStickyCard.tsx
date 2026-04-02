"use client";

import { motion } from "framer-motion";
import { timeAgo } from "@/app/lib/utils";
import { Heart, ArrowDownToLine } from "lucide-react";

/**
 * Ultra-premium Physical Stationery Card
 */
export default function MemoryStickyCard({ 
  confession, 
  onClick, 
  rotateAmount,
  offsetX = 0,
  offsetY = 0
}: { 
  confession: any; 
  onClick: () => void;
  rotateAmount: number;
  offsetX?: number;
  offsetY?: number;
}) {
  return (
    <motion.div
      drag
      dragMomentum={false}
      // Removed dragConstraints so it can be freely dragged endlessly around the massive desk
      whileHover={{ scale: 1.04, zIndex: 60, rotate: rotateAmount * 0.5 }}
      whileTap={{ scale: 0.96, cursor: "grabbing" }}
      initial={{ rotate: rotateAmount, y: 50 + offsetY, x: offsetX, opacity: 0 }}
      animate={{ 
        rotate: rotateAmount, 
        y: [offsetY, offsetY - 6, offsetY], // Smooth breathing
        x: offsetX,
        opacity: 1 
      }}
      transition={{ 
        type: "spring", stiffness: 150, damping: 20,
        y: { duration: 6, repeat: Infinity, ease: "easeInOut" }
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="absolute cursor-grab p-8 md:p-10 rounded-[2rem] flex flex-col justify-between overflow-hidden group"
      style={{
        width: "320px",
        height: "400px",
        background: "linear-gradient(135deg, #FFFDFB 0%, #FAEDE9 100%)", // Rich ivory / warm parchment
        border: "1px solid rgba(255,255,255,0.7)", // crisp physical edge
        boxShadow: "0 40px 80px -20px rgba(15, 5, 8, 0.8), inset 0 2px 5px rgba(255,255,255,1), inset 0 -2px 10px rgba(0,0,0,0.03)",
        transformOrigin: "center center",
      }}
    >
      {/* Intense high-quality paper texture */}
      <div 
        className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Decorative top dot */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#5C1A2A]/20" />

      {/* Internal Content Wrapper */}
      <div className="flex-1 overflow-hidden relative z-10 flex items-center justify-center mt-2 px-2">
        <p 
          className="font-serif italic text-[18px] md:text-[20px] leading-relaxed text-center tracking-wide"
          style={{ 
            color: "#3F111E", // Deep elegant plum/wine
            textShadow: "0 1px 0 rgba(255,255,255,0.8)" // High-end letterpress deboss effect
          }}
        >
          "{confession.text}"
        </p>
      </div>

      {/* Signature block with Download CTA */}
      <div className="mt-4 flex flex-col items-center justify-center relative z-10 w-full">
        <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-[#5C1A2A]/20 to-transparent mb-5" />
        
        <div className="flex flex-col items-center gap-1.5 w-full relative">
          <Heart size={14} className="text-[#9B3A5C]/40" fill="currentColor" />
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#9B3A5C]/80 mt-1">
            {confession.category}
          </span>
          <span className="block text-[11px] font-bold text-[#3F111E]/50 mt-1">
            {confession.displayName}
          </span>
          <span className="text-[8px] uppercase tracking-[0.2em] text-[#3F111E]/30 mt-0.5">
            {timeAgo(confession.createdAt)}
          </span>

          {/* Download Button Premium Overlay */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Standard alert for now until html2canvas is set up, serves as requested UI component layer
              alert("Downloading confession card...");
            }}
            className="absolute -bottom-2 right-0 opacity-0 group-hover:opacity-100 group-hover:bottom-0 transition-all p-3 rounded-full hover:bg-white/50 active:scale-90 text-[#5C1A2A]"
            title="Download this memory"
          >
            <ArrowDownToLine size={16} />
          </button>
        </div>
      </div>
      
    </motion.div>
  );
}
