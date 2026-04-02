"use client";

import { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";

export default function AmbientAudioPlayer({ src }: { src: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Attempt autoplay. Browsers may restrict this.
    if (audioRef.current) {
      audioRef.current.volume = 0.3; // keep ambient music soft
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Autoplay blocked, wait for user click
            setIsPlaying(false);
          });
      }
    }
  }, [src]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <>
      <audio ref={audioRef} src={src} loop preload="auto" />
      <motion.button
        onClick={togglePlay}
        className="fixed bottom-8 right-8 z-[100] w-12 h-12 rounded-full border border-white/10 bg-black/20 backdrop-blur-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-black/40 hover:border-white/30 transition-all shadow-[0_0_30px_rgb(0,0,0,0.5)] group"
        whileTap={{ scale: 0.9 }}
      >
        <motion.div
           animate={{ rotate: isPlaying ? 360 : 0 }}
           transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
        >
          {isPlaying ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </motion.div>
        
        {/* Subtle tooltip */}
        <div className="absolute right-14 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-md text-white text-[10px] font-bold tracking-widest uppercase border border-white/10 text-right">
          {isPlaying ? "Pause Ambient Piano" : "Play Ambient Piano"}
        </div>
      </motion.button>
    </>
  );
}
