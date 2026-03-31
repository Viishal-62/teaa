"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSpring, animated } from "@react-spring/web";
import { Mic, Square, Play, Pause, Trash2, Send } from "lucide-react";

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  onCancel: () => void;
}

const BAR_COUNT = 24;

export const VoiceRecorder = ({
  onRecordingComplete,
  onCancel,
}: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>(
    Array(BAR_COUNT).fill(0.1),
  );
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const MAX_DURATION = 30;

  // Spring animation for the record button glow
  const recordGlow = useSpring({
    boxShadow: isRecording
      ? "0 0 40px rgba(239, 68, 68, 0.5), 0 0 80px rgba(239, 68, 68, 0.2)"
      : "0 0 0px rgba(239, 68, 68, 0), 0 0 0px rgba(239, 68, 68, 0)",
    config: { tension: 120, friction: 14 },
  });

  const timerSpring = useSpring({
    progress: recordingTime / MAX_DURATION,
    config: { tension: 280, friction: 60 },
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Setup audio analyzer
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 128;
      analyserRef.current.smoothingTimeConstant = 0.8;
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= MAX_DURATION - 1) {
            mediaRecorder.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
            cancelAnimationFrame(animFrameRef.current);
            return MAX_DURATION;
          }
          return prev + 1;
        });
      }, 1000);

      // Start waveform animation
      const animateWaveform = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        const step = Math.floor(dataArray.length / BAR_COUNT);
        const normalized = Array(BAR_COUNT)
          .fill(0)
          .map((_, i) => Math.max(0.05, dataArray[i * step] / 255));
        setWaveformData(normalized);
        animFrameRef.current = requestAnimationFrame(animateWaveform);
      };
      animateWaveform();
    } catch (error) {
      console.error("Mic access error:", error);
      alert("Please allow microphone access to record voice confessions");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    }
  };

  const handlePreviewToggle = () => {
    if (!audioBlob) return;

    if (isPreviewPlaying && previewAudioRef.current) {
      previewAudioRef.current.pause();
      setIsPreviewPlaying(false);
      return;
    }

    const audio = new Audio(URL.createObjectURL(audioBlob));
    previewAudioRef.current = audio;

    audio.ontimeupdate = () => {
      if (audio.duration) {
        setPreviewProgress(audio.currentTime / audio.duration);
      }
    };
    audio.onended = () => {
      setIsPreviewPlaying(false);
      setPreviewProgress(0);
    };

    audio.play();
    setIsPreviewPlaying(true);
  };

  const handleSubmit = () => {
    if (!audioBlob) return;
    onRecordingComplete(audioBlob);
  };

  const handleDelete = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    setAudioBlob(null);
    setRecordingTime(0);
    setPreviewProgress(0);
    setIsPreviewPlaying(false);
    setWaveformData(Array(BAR_COUNT).fill(0.1));
  };

  const timeDisplay = `${String(Math.floor(recordingTime / 60)).padStart(1, "0")}:${String(recordingTime % 60).padStart(2, "0")}`;
  const maxDisplay = `${String(Math.floor(MAX_DURATION / 60)).padStart(1, "0")}:${String(MAX_DURATION % 60).padStart(2, "0")}`;

  return (
    <div className="space-y-5">
      {!audioBlob ? (
        /* ── Recording State ── */
        <div className="text-center space-y-5">
          {/* Circular timer ring */}
          <div className="relative w-32 h-32 mx-auto">
            {/* Background ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="rgba(0,0,0,0.05)"
                strokeWidth="3"
              />
              {isRecording && (
                <animated.circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 44}`}
                  style={{
                    strokeDashoffset: timerSpring.progress.to(
                      (p) => `${2 * Math.PI * 44 * (1 - p)}`,
                    ),
                  }}
                />
              )}
            </svg>

            {/* Record/Stop button */}
            <animated.div
              style={recordGlow}
              className="absolute inset-3 rounded-full"
            >
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-full h-full rounded-full flex items-center justify-center transition-all ${
                  isRecording
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-black hover:bg-black/90"
                }`}
              >
                <AnimatePresence mode="wait">
                  {isRecording ? (
                    <motion.div
                      key="stop"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ duration: 0.25 }}
                    >
                      <Square size={28} className="text-white" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="mic"
                      initial={{ scale: 0, rotate: 180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: -180 }}
                      transition={{ duration: 0.25 }}
                    >
                      <Mic size={28} className="text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </animated.div>
          </div>

          {/* Timer text */}
          <div className="space-y-1">
            <motion.p
              animate={isRecording ? { scale: [1, 1.02, 1] } : {}}
              transition={isRecording ? { repeat: Infinity, duration: 1 } : {}}
              className="text-2xl font-black tracking-tight text-black tabular-nums"
            >
              {timeDisplay}
              <span className="text-black/20 text-base ml-1">/{maxDisplay}</span>
            </motion.p>
            <p className="text-[10px] text-black/30 font-medium">
              {isRecording ? "Recording... tap to stop" : "Tap to start recording"}
            </p>
          </div>

          {/* Live waveform */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-end justify-center gap-[3px] h-14 px-4"
              >
                {waveformData.map((val, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: `${Math.max(12, val * 100)}%` }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 15,
                    }}
                    className="w-[3px] rounded-full bg-gradient-to-t from-red-500 to-red-400"
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* ── Playback / Review State ── */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold text-black/70">Recording ready</span>
            </div>
            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
              ✓ {Math.round(audioBlob.size / 1024)}KB
            </span>
          </div>

          {/* Mini waveform player */}
          <div className="bg-black/[0.02] border border-black/[0.06] rounded-2xl p-4 space-y-3">
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-black/[0.05] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-black rounded-full"
                animate={{ width: `${previewProgress * 100}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>

            <div className="flex items-center gap-3">
              {/* Play preview */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handlePreviewToggle}
                className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center flex-shrink-0 shadow-lg"
              >
                {isPreviewPlaying ? (
                  <Pause size={16} />
                ) : (
                  <Play size={16} className="ml-0.5" />
                )}
              </motion.button>

              <div className="flex-1">
                <p className="text-[10px] font-bold text-black/60">
                  Your voice confession
                </p>
                <p className="text-[9px] text-black/30 font-medium">
                  {recordingTime}s · Tap play to preview
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Action Buttons ── */}
      <div className="flex gap-2.5 pt-1">
        {audioBlob && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleDelete}
            className="flex-1 py-3 px-3 rounded-xl bg-red-500/8 text-red-600 hover:bg-red-500/15 font-bold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 size={14} />
            Re-record
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onCancel}
          disabled={isRecording}
          className="flex-1 py-3 px-3 rounded-xl bg-black/[0.03] border border-black/[0.06] hover:bg-black/[0.06] text-black/50 font-bold text-xs transition-colors disabled:opacity-40"
        >
          Cancel
        </motion.button>

        {audioBlob && (
          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            className="flex-1 py-3 px-3 rounded-xl bg-black hover:bg-black/90 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/10"
          >
            <Send size={14} />
            Confess
          </motion.button>
        )}
      </div>
    </div>
  );
};
