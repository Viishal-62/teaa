"use client";

import { useEffect, useRef, useState } from "react";
import { useSpring, animated } from "@react-spring/web";

interface AnimatedWaveformProps {
  audioElement?: HTMLAudioElement;
  isPlaying?: boolean;
  barCount?: number;
  height?: number;
  accentColor?: string;
  className?: string;
}

export const AnimatedWaveform = ({
  audioElement,
  isPlaying = false,
  barCount = 40,
  height = 60,
  accentColor = "from-accent to-accent-hover",
  className = "",
}: AnimatedWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const [springValues, setSpringValues] = useState<number[]>(
    Array(barCount).fill(0)
  );

  // Pre-generate random bounce heights for cartoonish effect (smooth, not jumpy)
  const baseHeightsRef = useRef<number[]>(
    Array(barCount)
      .fill(0)
      .map(() => Math.random() * 0.6 + 0.2)
  );

  // Spring animations for each bar
  const springs = springValues.map((value) =>
    useSpring({
      height: value,
      config: {
        tension: 280,
        friction: 60,
      },
    })
  );

  useEffect(() => {
    if (!audioElement || !isPlaying) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;

      if (
        audioElement.paused ||
        audioElement.ended ||
        !analyserRef.current
      ) {
        const source = audioContext.createMediaElementAudioSource(audioElement);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        analyserRef.current = analyser;
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      }

      const analyser = analyserRef.current;
      const dataArray = dataArrayRef.current!;

      const draw = () => {
        analyser.getByteFrequencyData(dataArray);

        // Calculate average frequency for each bar
        const barWidth = Math.floor(dataArray.length / barCount);
        const newHeights = Array(barCount)
          .fill(0)
          .map((_, i) => {
            const start = i * barWidth;
            const end = start + barWidth;
            const slice = dataArray.slice(start, end);
            const average = slice.reduce((a, b) => a + b) / slice.length / 255;

            // Mix with base height for cartoonish effect
            const baseHeight = baseHeightsRef.current[i];
            return Math.max(baseHeight, average * 0.8 + baseHeight * 0.2);
          });

        setSpringValues(newHeights);
        animationIdRef.current = requestAnimationFrame(draw);
      };

      draw();

      return () => {
        if (animationIdRef.current) {
          cancelAnimationFrame(animationIdRef.current);
        }
      };
    } catch (error) {
      console.error("Waveform visualization error:", error);
    }
  }, [audioElement, isPlaying, barCount]);

  return (
    <div
      className={`flex items-center justify-center gap-1 ${className}`}
      style={{ height: `${height}px` }}
    >
      {springs.map((spring, i) => (
        <animated.div
          key={i}
          className={`flex-1 rounded-full bg-gradient-to-t ${accentColor} opacity-90 shadow-lg`}
          style={{
            height: spring.height.to((h) => `${h * height}px`),
            minWidth: "2px",
          }}
        />
      ))}
    </div>
  );
};
