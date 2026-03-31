"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, X, ChevronLeft, Sparkles } from "lucide-react";
import { VoiceRecorder } from "./VoiceRecorder";
import { useVoiceConfessionUpload } from "@/app/hooks/useVoiceConfessionUpload";
import type { Id } from "@/convex/_generated/dataModel";

interface VoiceConfessModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId?: Id<"boards">;
  category?: string;
  onSuccess?: () => void;
}

const CATEGORIES = [
  "regret", "love", "guilt", "relief", "longing",
  "mischief", "obsession", "pride", "fear", "envy", "deep-dark",
];

const CATEGORY_EMOJIS: Record<string, string> = {
  regret: "🌊", love: "💗", guilt: "⚖️", relief: "🌬️", longing: "🎵",
  mischief: "😈", obsession: "🔥", pride: "✨", fear: "👻", envy: "💚",
  "deep-dark": "🕳️",
};

const CATEGORY_COLORS: Record<string, string> = {
  regret: "#3b82f6", love: "#ec4899", guilt: "#eab308", relief: "#22c55e",
  longing: "#a855f7", mischief: "#f97316", obsession: "#ef4444", pride: "#f59e0b",
  fear: "#6366f1", envy: "#14b8a6", "deep-dark": "#475569",
};

const CATEGORY_LABELS: Record<string, string> = {
  regret: "Regret", love: "Love", guilt: "Guilt", relief: "Relief",
  longing: "Longing", mischief: "Mischief", obsession: "Obsession", pride: "Pride",
  fear: "Fear", envy: "Envy", "deep-dark": "Deep Dark",
};

type ModalStep = "category" | "details" | "record" | "success";

export const VoiceConfessModal = ({
  isOpen,
  onClose,
  boardId,
  category: defaultCategory,
  onSuccess,
}: VoiceConfessModalProps) => {
  const [step, setStep] = useState<ModalStep>("category");
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory || "");
  const [voiceTitle, setVoiceTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { uploadVoiceConfession, error } = useVoiceConfessionUpload({ boardId });

  const handleRecordingComplete = async (audioBlob: Blob) => {
    if (!selectedCategory) return;

    setIsSubmitting(true);
    try {
      const result = await uploadVoiceConfession(
        audioBlob,
        selectedCategory,
        boardId,
        voiceTitle || undefined,
      );

      if (result.success) {
        setStep("success");
        setTimeout(() => {
          onSuccess?.();
          handleClose();
        }, 3000);
      } else {
        alert(`Error: ${result.error}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep("category");
    setSelectedCategory(defaultCategory || "");
    setVoiceTitle("");
    setIsSubmitting(false);
    onClose();
  };

  const handleCategoryNext = () => {
    if (selectedCategory) setStep("details");
  };

  const handleDetailsNext = () => {
    setStep("record");
  };

  const stepTitle: Record<ModalStep, string> = {
    category: "Choose a vibe",
    details: "Name your confession",
    record: "🎙️ Record",
    success: "",
  };

  const stepSubtitle: Record<ModalStep, string> = {
    category: "Pick the mood of your voice confession",
    details: "Give it a title so listeners know what's coming",
    record: "Max 30 seconds · 100% anonymous",
    success: "",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div
              className="rounded-[1.75rem] shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden border border-black/[0.06]"
              style={{
                background: "linear-gradient(168deg, #fefdfb 0%, #faf7f2 50%, #f5f0e8 100%)",
              }}
            >
              {/* ── Success State ── */}
              <AnimatePresence mode="wait">
                {step === "success" ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="p-10 text-center"
                  >
                    {/* Animated checkmark circle */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
                      className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${CATEGORY_COLORS[selectedCategory]}, ${CATEGORY_COLORS[selectedCategory]}cc)`,
                        boxShadow: `0 8px 32px ${CATEGORY_COLORS[selectedCategory]}40`,
                      }}
                    >
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 250 }}
                      >
                        <Sparkles size={32} className="text-white" />
                      </motion.div>
                    </motion.div>

                    {/* Floating particles */}
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full"
                        style={{
                          background: CATEGORY_COLORS[selectedCategory],
                          left: `${20 + Math.random() * 60}%`,
                          top: `${20 + Math.random() * 60}%`,
                        }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                          opacity: [0, 0.6, 0],
                          scale: [0, 1.5, 0],
                          y: [0, -40 - Math.random() * 30],
                        }}
                        transition={{
                          duration: 1.5,
                          delay: 0.2 + i * 0.1,
                          ease: "easeOut",
                        }}
                      />
                    ))}

                    <motion.h2
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-xl font-black tracking-tight text-black mb-2"
                    >
                      Confession Dropped! 🫖
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="text-xs text-black/40 font-medium"
                    >
                      Your voice is out there now. No taking it back.
                    </motion.p>

                    {/* Animated wave line */}
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
                      className="mt-6 mx-auto h-1 w-24 rounded-full origin-left"
                      style={{ background: `linear-gradient(90deg, transparent, ${CATEGORY_COLORS[selectedCategory]}, transparent)` }}
                    />
                  </motion.div>
                ) : (
                  <motion.div key="form">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-black/[0.05] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {(step === "details" || step === "record") && (
                          <motion.button
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setStep(step === "record" ? "details" : "category")}
                            className="p-1 hover:bg-black/5 rounded-lg transition-colors"
                          >
                            <ChevronLeft size={18} className="text-black/40" />
                          </motion.button>
                        )}
                        <div>
                          <h2 className="text-base font-black tracking-tight text-black">
                            {stepTitle[step]}
                          </h2>
                          <p className="text-[10px] text-black/30 font-medium mt-0.5">
                            {stepSubtitle[step]}
                          </p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.15, rotate: 90 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleClose}
                        className="p-1.5 hover:bg-black/5 rounded-xl transition-colors"
                      >
                        <X size={18} className="text-black/30" />
                      </motion.button>
                    </div>

                    {/* Steps indicator */}
                    <div className="px-6 pt-4 pb-2 flex items-center gap-2">
                      {(["category", "details", "record"] as ModalStep[]).map((s, i) => (
                        <div key={s} className="flex items-center gap-2 flex-1">
                          <div
                            className="h-1 flex-1 rounded-full transition-all duration-500"
                            style={{
                              background:
                                (["category", "details", "record"] as ModalStep[]).indexOf(step) >= i
                                  ? (CATEGORY_COLORS[selectedCategory] || "#000")
                                  : "rgba(0,0,0,0.06)",
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Content */}
                    <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
                      <div className="p-6">
                        <AnimatePresence mode="wait">
                          {/* ── Step 1: Category ── */}
                          {step === "category" && (
                            <motion.div
                              key="cat"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              className="space-y-5"
                            >
                              <div className="grid grid-cols-3 gap-2.5">
                                {CATEGORIES.map((cat) => {
                                  const isSelected = selectedCategory === cat;
                                  const color = CATEGORY_COLORS[cat];
                                  return (
                                    <motion.button
                                      key={cat}
                                      whileHover={{ y: -3 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => setSelectedCategory(cat)}
                                      className="relative py-4 px-2 rounded-2xl font-medium transition-all flex flex-col items-center gap-1.5 overflow-hidden"
                                      style={{
                                        background: isSelected ? color : "rgba(0,0,0,0.02)",
                                        color: isSelected ? "white" : "rgba(0,0,0,0.5)",
                                        border: `1px solid ${isSelected ? "transparent" : "rgba(0,0,0,0.05)"}`,
                                        boxShadow: isSelected ? `0 4px 20px ${color}40` : "none",
                                      }}
                                    >
                                      <span className="text-2xl">{CATEGORY_EMOJIS[cat]}</span>
                                      <span className="text-[10px] font-bold leading-tight text-center capitalize">
                                        {CATEGORY_LABELS[cat]}
                                      </span>
                                      {isSelected && (
                                        <motion.div
                                          layoutId="voice-cat-dot"
                                          className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full"
                                        />
                                      )}
                                    </motion.button>
                                  );
                                })}
                              </div>

                              <motion.button
                                whileHover={selectedCategory ? { y: -2 } : {}}
                                whileTap={selectedCategory ? { scale: 0.98 } : {}}
                                onClick={handleCategoryNext}
                                disabled={!selectedCategory}
                                className="w-full py-4 px-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2.5 relative overflow-hidden group"
                                style={{
                                  background: selectedCategory ? CATEGORY_COLORS[selectedCategory] : "rgba(0,0,0,0.05)",
                                  color: selectedCategory ? "white" : "rgba(0,0,0,0.25)",
                                  boxShadow: selectedCategory ? `0 4px 20px ${CATEGORY_COLORS[selectedCategory]}40` : "none",
                                  cursor: selectedCategory ? "pointer" : "not-allowed",
                                }}
                              >
                                Next
                                {selectedCategory && (
                                  <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-all duration-500" />
                                )}
                              </motion.button>
                            </motion.div>
                          )}

                          {/* ── Step 2: Title ── */}
                          {step === "details" && (
                            <motion.div
                              key="details"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              className="space-y-5"
                            >
                              {/* Selected category badge */}
                              <div className="flex items-center justify-center">
                                <div
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white"
                                  style={{
                                    background: CATEGORY_COLORS[selectedCategory],
                                    boxShadow: `0 2px 12px ${CATEGORY_COLORS[selectedCategory]}30`,
                                  }}
                                >
                                  <span>{CATEGORY_EMOJIS[selectedCategory]}</span>
                                  {CATEGORY_LABELS[selectedCategory]}
                                </div>
                              </div>

                              {/* Title input */}
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-black/30 block px-1">
                                  Title (optional)
                                </label>
                                <input
                                  type="text"
                                  value={voiceTitle}
                                  onChange={(e) => setVoiceTitle(e.target.value.slice(0, 80))}
                                  placeholder="e.g. The night I couldn't sleep..."
                                  className="w-full px-4 py-3.5 rounded-xl bg-black/[0.03] border border-black/[0.06] text-sm font-medium text-black placeholder:text-black/20 outline-none focus:border-black/15 focus:ring-2 focus:ring-black/5 transition-all"
                                  autoFocus
                                />
                                <p className="text-[9px] text-black/20 font-medium px-1">
                                  {voiceTitle.length}/80 · Leave empty for untitled
                                </p>
                              </div>

                              {/* Continue button */}
                              <motion.button
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleDetailsNext}
                                className="w-full py-4 px-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2.5 relative overflow-hidden group"
                                style={{
                                  background: CATEGORY_COLORS[selectedCategory],
                                  color: "white",
                                  boxShadow: `0 4px 20px ${CATEGORY_COLORS[selectedCategory]}40`,
                                }}
                              >
                                <Mic size={18} className="group-hover:scale-110 transition-transform" />
                                Start Recording
                                <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-all duration-500" />
                              </motion.button>

                              <div className="text-center">
                                <p className="text-[10px] text-black/25 font-medium">
                                  🫖 100% anonymous · Max 30 seconds · No sign up
                                </p>
                              </div>
                            </motion.div>
                          )}

                          {/* ── Step 3: Record ── */}
                          {step === "record" && (
                            <motion.div
                              key="record"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                            >
                              {/* Title preview if set */}
                              {voiceTitle && (
                                <div className="mb-4 text-center">
                                  <p className="text-xs text-black/40 font-medium italic">
                                    &ldquo;{voiceTitle}&rdquo;
                                  </p>
                                </div>
                              )}

                              <VoiceRecorder
                                onRecordingComplete={handleRecordingComplete}
                                onCancel={() => setStep("details")}
                              />

                              {isSubmitting && (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-[1.75rem] flex flex-col items-center justify-center z-10"
                                >
                                  {/* Uploading animation */}
                                  <div className="relative w-16 h-16 mb-4">
                                    <motion.div
                                      className="absolute inset-0 rounded-full"
                                      style={{ border: `3px solid ${CATEGORY_COLORS[selectedCategory]}20` }}
                                    />
                                    <motion.div
                                      className="absolute inset-0 rounded-full"
                                      style={{
                                        border: `3px solid transparent`,
                                        borderTopColor: CATEGORY_COLORS[selectedCategory],
                                      }}
                                      animate={{ rotate: 360 }}
                                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                        className="text-xl"
                                      >
                                        🎙️
                                      </motion.div>
                                    </div>
                                  </div>
                                  <p className="text-sm font-black text-black/70">Uploading your confession...</p>
                                  <p className="text-[10px] text-black/30 font-medium mt-1">Almost there</p>
                                </motion.div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {error && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-[10px] font-bold"
                          >
                            {error}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
