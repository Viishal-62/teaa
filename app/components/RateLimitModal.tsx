"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Timer, X, Coffee, Sparkles } from "lucide-react";

interface RateLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export default function RateLimitModal({
  isOpen,
  onClose,
  message,
}: RateLimitModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] bg-[#1a0e0e] p-8 text-center shadow-2xl shadow-rose-950/20"
            style={{
              border: "1px solid rgba(196, 58, 58, 0.2)",
              backgroundImage:
                "radial-gradient(circle at top right, rgba(196, 58, 58, 0.1), transparent)",
            }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-6 top-6 text-rose-200/30 hover:text-rose-200 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Icon Decoration */}
            <div className="relative mb-8 flex justify-center">
              <div className="absolute inset-0 scale-150 blur-3xl opacity-20 bg-rose-500 rounded-full" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-500/20 to-transparent border border-rose-500/30">
                <Timer size={40} className="text-rose-500" />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <h3 className="text-2xl font-black italic serif text-rose-50 tracking-tight">
                Slow down, <br />
                teapot!
              </h3>

              <div className="relative py-2">
                <Sparkles
                  size={16}
                  className="absolute -left-2 -top-1 text-rose-400 opacity-50"
                />
                <p className="text-[14px] leading-relaxed text-rose-100/60 font-medium">
                  {message ||
                    "You're spilling tea faster than we can brew it. Take a little break and let the water boil."}
                </p>
                <Sparkles
                  size={14}
                  className="absolute -right-2 -bottom-1 text-rose-400 opacity-50"
                />
              </div>
            </div>

            {/* Button */}
            <button
              onClick={onClose}
              className="mt-10 w-full group relative h-14 overflow-hidden rounded-2xl bg-rose-600 font-bold text-[11px] uppercase tracking-[0.2em] text-white transition-all active:scale-95 shadow-lg shadow-rose-900/20"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Coffee size={14} />
                Got it, brewing...
              </span>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
            </button>

            {/* Bottom Decoration */}
            <p className="mt-6 text-[9px] font-bold uppercase tracking-widest text-rose-500/40">
              Cooldown active • teaaa.me
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
