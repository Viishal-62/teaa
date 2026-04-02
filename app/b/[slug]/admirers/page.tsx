"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, X } from "lucide-react";
import Link from "next/link";
import AmbientAudioPlayer from "@/app/components/AmbientAudioPlayer";
import MemoryStickyCard from "@/app/components/MemoryStickyCard";
import { timeAgo } from "@/app/lib/utils";

const ADMIRER_CATEGORIES = [
  "crush",
  "compliment",
  "attraction",
  "gratitude",
  "admiration",
  "confession",
  "secret-admirer",
];

const AURORA_PALETTES = [
  ["#9b2226", "#ea3546", "#3c096c", "#10002b"],
  ["#03045e", "#0077b6", "#48cae4", "#caf0f8"],
  ["#386641", "#6a994e", "#a3b18a", "#dad7cd"],
  ["#3c096c", "#5a189a", "#9d4edd", "#e0aaff"],
  ["#5f0f40", "#9a031e", "#fb8b24", "#e36414"],
];

type ViewMode = "desk" | "reading";

export default function AuroraExhibitionPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const startIdxParam = searchParams.get("index");

  const board = useQuery(api.boards.getBySlug, { slug });
  const allConfessions = useQuery(api.confessions.listByBoard, board ? { boardId: board._id } : "skip");

  const admirers = allConfessions?.filter((c: any) => ADMIRER_CATEGORIES.includes(c.category)) || [];

  const [viewMode, setViewMode] = useState<ViewMode>(startIdxParam ? "reading" : "desk");
  const [currentIndex, setCurrentIndex] = useState(startIdxParam ? parseInt(startIdxParam) : 0);
  const [paletteIndex, setPaletteIndex] = useState(currentIndex % AURORA_PALETTES.length);
  
  const scrollAccum = useRef(0);
  const scrollCooldown = useRef(false);

  // Layout calculations for the infinite desk
  const cardPositions = useMemo(() => {
    const total = admirers.length;
    // Calculate a dynamic grid based on the number of cards so they cluster nicely around center
    const cols = Math.max(1, Math.ceil(Math.sqrt(total)));
    
    return admirers.map((_, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      
      // Base grid spacing is massive (450px) to prevent overlapping
      // We offset by (cols/2) to perfectly center the entire cluster in the viewport
      const baseX = (col - cols / 2) * 450 + 225;
      const baseY = (row - cols / 2) * 450 + 225;
      
      // Add heavy organic scatter and subtle rotations
      const x = baseX + (Math.sin(i * 88.3) * 150);
      const y = baseY + (Math.cos(i * 44.1) * 150);
      const rotate = (Math.sin(i * 12) * 15);
      
      return { x, y, rotate };
    });
  }, [admirers.length]);

  const handleNext = () => {
    if (admirers.length === 0) return;
    setCurrentIndex((prev) => (prev < admirers.length - 1 ? prev + 1 : prev));
    setPaletteIndex((prev) => (prev + 1) % AURORA_PALETTES.length);
  };

  const handlePrev = () => {
    if (admirers.length === 0) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
    setPaletteIndex((prev) => (prev > 0 ? prev - 1 : AURORA_PALETTES.length - 1));
  };

  // Safe robust scrolling explicitly for Mac trackpads
  useEffect(() => {
    if (viewMode !== "reading") return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      scrollAccum.current += e.deltaY;
      const THRESHOLD = 80;

      if (Math.abs(scrollAccum.current) >= THRESHOLD && !scrollCooldown.current) {
        const direction = scrollAccum.current > 0 ? 1 : -1;
        if (direction === 1) handleNext();
        if (direction === -1) handlePrev();
        
        scrollAccum.current = 0;
        scrollCooldown.current = true;
        setTimeout(() => {
          scrollCooldown.current = false;
        }, 500);
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [viewMode, currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (viewMode !== "reading") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") setViewMode("desk");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, currentIndex]);

  if (board === undefined || allConfessions === undefined) {
    return (
      <div className="min-h-screen bg-[#110A0D] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-900/20 border-t-rose-400 rounded-full animate-spin" />
      </div>
    );
  }

  const currentConfession = admirers[currentIndex];
  const currentPalette = AURORA_PALETTES[paletteIndex];

  return (
    <div className="fixed inset-0 overflow-hidden font-sans selection:bg-white/20 bg-[#110A0D]">
      
      {/* ─── DESK MODE (Background Canvas) ─── */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          drag 
          dragConstraints={{ left: -1500, right: 1500, top: -1500, bottom: 1500 }}
          dragElastic={0.1}
          dragTransition={{ bounceStiffness: 400, bounceDamping: 40 }}
          className="absolute cursor-grab active:cursor-grabbing"
          style={{ width: "300vw", height: "300vh", left: "-100vw", top: "-100vh" }}
        >
          {/* A gorgeous candlelit wooden grain/texture radial blur behind the cards */}
          <div className="absolute inset-0" style={{ background: "radial-gradient(circle at center, #26171B 0%, #0F090B 100%)" }} />
          
          <div className="absolute inset-0 flex items-center justify-center">
            {admirers.map((confession, i) => {
              const pos = cardPositions[i];
              return (
                <MemoryStickyCard
                  key={confession._id}
                  confession={confession}
                  offsetX={pos.x}
                  offsetY={pos.y}
                  rotateAmount={pos.rotate}
                  onClick={() => {
                    setCurrentIndex(i);
                    setPaletteIndex(i % AURORA_PALETTES.length);
                    setViewMode("reading");
                  }}
                />
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Desk Overlay Header & Instructions */}
      <AnimatePresence>
        {viewMode === "desk" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 left-0 right-0 p-6 z-[60] flex items-center justify-between pointer-events-none"
          >
            <Link
              href={`/b/${slug}`}
              className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-rose-100/60 hover:text-rose-100 transition-colors pointer-events-auto bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-rose-900/40 hover:border-rose-500/50"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Board
            </Link>

            <p className="text-center text-[10px] sm:text-[11px] font-black uppercase tracking-[0.4em] text-rose-100/20 drop-shadow-sm absolute left-1/2 -translate-x-1/2">
              Pan the canvas. Tap to immerse.
            </p>
            <div />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── READING MODE (Full Screen Overlay) ─── */}
      <AnimatePresence>
        {viewMode === "reading" && currentConfession && (
          <motion.div 
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 z-50 overflow-hidden bg-black text-white"
          >
            {/* Aurora Background */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.85]">
              <motion.div
                animate={{ background: `radial-gradient(circle at 20% 30%, ${currentPalette[0]}, transparent 60%)` }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-0"
              />
              <motion.div
                animate={{ background: `radial-gradient(circle at 80% 80%, ${currentPalette[1]}, transparent 60%)` }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-0"
              />
              <motion.div
                animate={{ background: `radial-gradient(circle at 80% 20%, ${currentPalette[2]}, transparent 60%)` }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-0"
              />
              <motion.div
                animate={{ background: `radial-gradient(circle at 20% 80%, ${currentPalette[3]}, transparent 60%)` }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-0"
              />
              <motion.div
                animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
                className="absolute inset-[-50%] bg-[url('/noise.png')] opacity-[0.04] mix-blend-screen"
              />
              <div className="absolute inset-0 backdrop-blur-[100px]" />
            </div>

            {/* Reading Header */}
            <header className="absolute top-0 w-full z-50 p-6 flex justify-between items-center opacity-60 hover:opacity-100 transition-opacity">
              <div />
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] bg-white/10 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
                  {currentIndex + 1} / {admirers.length}
                </span>
                <button 
                  onClick={() => setViewMode("desk")}
                  className="w-10 h-10 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/20 hover:scale-105 transition-all text-white active:scale-95 shadow-xl"
                  title="Close Exhibition"
                >
                  <X size={16} />
                </button>
              </div>
            </header>

            {/* Typography */}
            <main className="absolute inset-0 flex items-center justify-center px-6 md:px-20 relative z-10 w-full h-full cursor-ns-resize">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentConfession._id}
                  initial={{ opacity: 0, y: 50, filter: "blur(10px)", scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
                  exit={{ opacity: 0, y: -50, filter: "blur(10px)", scale: 1.05 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="max-w-4xl text-center w-full"
                >
                  <h1 className="text-3xl md:text-5xl lg:text-6xl font-black serif italic leading-[1.2] text-white drop-shadow-2xl mb-12">
                    "{currentConfession.text}"
                  </h1>
                  <div className="flex flex-col items-center gap-4">
                    <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/50 border border-white/20 px-5 py-2 rounded-full backdrop-blur-lg">
                      — {currentConfession.displayName}
                    </span>
                    <span className="text-[10px] font-mono text-white/30">
                      {timeAgo(currentConfession.createdAt)}
                    </span>
                    <Link
                      href={`/b/${slug}/c/${currentConfession._id}`}
                      className="mt-10 inline-flex items-center gap-2 px-8 py-3 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:shadow-[0_0_50px_rgba(255,255,255,0.6)] hover:scale-105 active:scale-95 transition-all"
                    >
                      View full letter
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>
            </main>

            {/* Hint */}
            {admirers.length > 1 && (
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/30 text-[10px] uppercase font-bold tracking-[0.4em] flex flex-col items-center gap-3 pointer-events-none drop-shadow-md"
              >
                <div className="w-[1px] h-10 bg-gradient-to-b from-white/0 via-white/80 to-white/0" />
                Scroll
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AmbientAudioPlayer src="https://upload.wikimedia.org/wikipedia/commons/2/23/Gymnop%C3%A9die_No._1.ogg" />
    </div>
  );
}
