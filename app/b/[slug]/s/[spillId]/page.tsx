"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { THEMES } from "@/convex/helpers";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export default function DeepSpillReader() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const spillId = params.spillId as string;

  const board = useQuery(api.boards.getBySlug, { slug });
  const spill = useQuery(api.spills.getById, { spillId: spillId as any });
  const chapters = useQuery(api.chapters.listBySpill, { spillId: spillId as any });

  const [currentPage, setCurrentPage] = useState(0); // 0 = Cover, 1 = Ch 1, etc.
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  // Increment views lazily
  useEffect(() => {
    if (spill) {
      // NOTE: useMutation could be called here via a raw fetch or useEffect wrapper, but
      // for reading simply, we can skip immediate view increments or fire a server action.
    }
  }, [spill]);

  if (spill === undefined || chapters === undefined) {
    return <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center animate-pulse" />;
  }
  if (spill === null) {
    return <div className="min-h-screen flex text-center justify-center pt-24">Spill not found.</div>;
  }

  const theme = THEMES.find((t) => t.key === spill.coverTheme) || THEMES[0];
  const totalPages = chapters.length + 1; // 1 cover + N chapters (plus maybe a back cover later)

  const paginate = (newDirection: number) => {
    const nextPage = currentPage + newDirection;
    if (nextPage >= 0 && nextPage < totalPages) {
      setDirection(newDirection);
      setCurrentPage(nextPage);
    }
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const variants = {
    enter: (direction: number) => {
      return {
        // Physical page turn feel: fold out from the spine (left)
        x: direction > 0 ? 50 : -50,
        opacity: 0,
        rotateY: direction > 0 ? 45 : -45,
        scale: 0.95,
      };
    },
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      rotateY: 0,
      scale: 1,
    },
    exit: (direction: number) => {
      return {
        zIndex: 0,
        x: direction < 0 ? 50 : -50,
        opacity: 0,
        rotateY: direction < 0 ? 45 : -45,
        scale: 0.95,
      };
    },
  };

  return (
    <div className="fixed inset-0 bg-[#f0eae1] flex items-center justify-center overflow-hidden">
      
      {/* Top Navbar */}
      <div className="absolute top-0 inset-x-0 h-20 flex items-center justify-between px-6 z-50">
        <button 
          onClick={() => router.push(`/b/${slug}`)}
          className="w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors"
        >
          <X size={20} className="text-black/60" />
        </button>
        <div className="text-[10px] font-bold uppercase tracking-widest text-black/30">
          Page {currentPage + 1} of {totalPages}
        </div>
      </div>

      {/* Book Container */}
      <div 
        className="relative w-full max-w-lg aspect-[3/4.5] sm:aspect-[3/4] mx-4 perspective-1200"
      >
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentPage}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
              rotateY: { type: "spring", stiffness: 200, damping: 30 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);

              if (swipe < -swipeConfidenceThreshold) {
                paginate(1);
              } else if (swipe > swipeConfidenceThreshold) {
                paginate(-1);
              }
            }}
            className="absolute inset-0 size-full shadow-2xl rounded-r-3xl rounded-l-md border-l-[12px] overflow-hidden transform-style-3d origin-left bg-[#faf8f5]"
            style={{ 
              borderColor: currentPage === 0 ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.05)",
            }}
          >
            {currentPage === 0 ? (
              // COVER PAGE
              <div 
                className="size-full flex flex-col justify-between p-12 text-center relative"
                style={{ background: spill.aiImageUrl ? `url(${spill.aiImageUrl}) center/cover` : theme.bg }}
              >
                {!spill.aiImageUrl && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),transparent_50%)]" />}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05]" />
                
                <div className={`absolute inset-0 flex flex-col items-center justify-between p-12 backdrop-blur-[2px] ${spill.aiImageUrl ? 'bg-black/40' : ''}`}>
                  <div className="relative z-10 flex flex-col items-center gap-3 mt-8">
                    <span className="text-[11px] font-bold uppercase tracking-[0.4em] opacity-80" style={{ color: spill.aiImageUrl ? "#fff" : theme.accent }}>Deep Spill</span>
                    <div className="w-12 h-px bg-current opacity-30" style={{ color: spill.aiImageUrl ? "#fff" : theme.accent }} />
                  </div>

                  <div className="relative z-10 space-y-8 flex flex-col items-center">
                    {!spill.aiImageUrl && <span className="text-6xl drop-shadow-lg">{spill.coverEmoji}</span>}
                    <h1 className="text-4xl sm:text-5xl font-black serif leading-[1.1] tracking-tight text-white mb-8" style={{ color: spill.aiImageUrl ? "#fff" : theme.text }}>
                      {spill.title}
                    </h1>
                  </div>

                  <div className="relative z-10">
                    <span className="text-xs uppercase tracking-[0.2em] font-medium opacity-80" style={{ color: spill.aiImageUrl ? "#fff" : theme.text }}>
                      By {spill.displayName}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              // CHAPTER PAGE
              <div className="size-full bg-[#faf8f5] p-8 sm:p-12 flex flex-col">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] pointer-events-none" />
                
                <div className="flex-1 overflow-y-auto pr-4 scrollbar-hide">
                   <div className="mb-10 text-center">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-black/30 mb-2">
                       Chapter {chapters[currentPage - 1].chapterNumber}
                    </h3>
                    <h2 className="text-2xl font-serif font-black text-black/80 leading-tight">
                      {chapters[currentPage - 1].title || `Chapter ${chapters[currentPage - 1].chapterNumber}`}
                    </h2>
                    <div className="w-8 h-px bg-black/10 mx-auto mt-6" />
                   </div>

                   <p className="font-serif text-[17px] leading-[2.2] text-black/75 whitespace-pre-wrap">
                    {chapters[currentPage - 1].text}
                   </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-8 inset-x-0 flex items-center justify-center gap-12 z-50">
        <button
          onClick={() => paginate(-1)}
          disabled={currentPage === 0}
          className="w-14 h-14 rounded-full bg-white/50 backdrop-blur-md shadow-lg border border-black/5 flex items-center justify-center hover:bg-white text-black/40 hover:text-black transition-all disabled:opacity-0 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={() => paginate(1)}
          disabled={currentPage === totalPages - 1}
          className="w-14 h-14 rounded-full bg-white backdrop-blur-md shadow-lg border border-black/5 flex items-center justify-center hover:scale-105 text-black transition-all disabled:opacity-0 disabled:cursor-not-allowed"
        >
          <ChevronRight size={24} />
        </button>
      </div>

    </div>
  );
}
