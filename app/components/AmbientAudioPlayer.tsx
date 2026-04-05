"use client";

import { useState, useRef, useCallback } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";

/**
 * Generates a dreamy ambient pad using the Web Audio API.
 * No external files needed — works everywhere.
 */
function createAmbientPad(ctx: AudioContext) {
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0;
  masterGain.connect(ctx.destination);

  // Soft chord: Cmaj7 spread across octaves
  const frequencies = [130.81, 164.81, 196.0, 246.94, 329.63, 392.0];
  const oscillators: OscillatorNode[] = [];

  for (const freq of frequencies) {
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    oscGain.gain.value = 0.06;

    // Add very subtle vibrato
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.value = 0.3 + Math.random() * 0.4;
    lfoGain.gain.value = 0.8;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();

    osc.connect(oscGain);
    oscGain.connect(masterGain);
    osc.start();
    oscillators.push(osc);
  }

  // Fade in
  masterGain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 2);

  return { masterGain, oscillators, ctx };
}

export default function AmbientAudioPlayer({ src }: { src?: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const padRef = useRef<{
    masterGain: GainNode;
    oscillators: OscillatorNode[];
    ctx: AudioContext;
  } | null>(null);

  const togglePlay = useCallback(() => {
    if (isPlaying && padRef.current) {
      // Fade out and stop
      const { masterGain, oscillators, ctx } = padRef.current;
      masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      setTimeout(() => {
        for (const osc of oscillators) {
          try { osc.stop(); } catch {}
        }
        try { ctx.close(); } catch {}
        padRef.current = null;
      }, 600);
      setIsPlaying(false);
    } else {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        padRef.current = createAmbientPad(ctx);
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    }
  }, [isPlaying]);

  return (
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

      {/* Pulse ring when playing */}
      {isPlaying && (
        <motion.div
          className="absolute inset-0 rounded-full border border-white/20"
          animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
        />
      )}

      {/* Tooltip */}
      <div className="absolute right-14 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-md text-white text-[10px] font-bold tracking-widest uppercase border border-white/10 text-right">
        {isPlaying ? "Pause Ambient" : "Play Ambient"}
      </div>
    </motion.button>
  );
}
