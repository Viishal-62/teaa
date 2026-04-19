"use client";

import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { useEffect, useState } from "react";

interface PwaInstallButtonProps {
  compact?: boolean;
  className?: string;
}

export default function PwaInstallButton({
  compact = false,
  className = "",
}: PwaInstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/i.test(navigator.userAgent));

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setShowInstallHelp(true);
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstallable(false);
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full border border-green-100 bg-green-50 text-green-600 ${
          compact
            ? "px-3 py-1.5 text-[10px] font-semibold"
            : "px-6 py-3 text-[10px] font-bold uppercase tracking-widest"
        } ${className}`}
      >
        <span className="relative h-2.5 w-2.5 rounded-full bg-green-400">
          <span className="absolute inset-0 rounded-full bg-green-400 opacity-50 animate-ping" />
        </span>
        {compact ? "Installed" : "App Installed"}
      </div>
    );
  }

  if (isInstallable) {
    return (
      <motion.button
        type="button"
        onClick={handleInstallClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`group relative flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white transition-all ${
          compact
            ? "px-3.5 py-2 text-[10px] font-semibold"
            : "px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_12px_30px_rgba(59,130,246,0.3)] hover:shadow-[0_16px_40px_rgba(59,130,246,0.4)]"
        } ${className}`}
      >
        <div className="absolute inset-0 -translate-x-[200%] bg-gradient-to-r from-white/0 via-white/20 to-white/0 transition-transform duration-700 ease-in-out group-hover:translate-x-[200%]" />
        <Download size={14} className="relative z-10" />
        <span className="relative z-10">{compact ? "Install" : "One-Tap Install"}</span>
      </motion.button>
    );
  }

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={() => setShowInstallHelp((prev) => !prev)}
        className={`inline-flex items-center gap-2 rounded-full border border-black/10 bg-white text-black/55 ${
          compact
            ? "px-3.5 py-2 text-[10px] font-semibold"
            : "px-6 py-3 text-[10px] font-bold uppercase tracking-widest"
        } ${className}`}
      >
        <Download size={12} />
        {compact ? "Install app" : "Install app"}
      </button>

      {showInstallHelp && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 rounded-2xl border border-black/10 bg-white p-3 text-left shadow-xl">
          <p className="text-[11px] font-bold text-black/70 mb-1">Install steps</p>
          <p className="text-[11px] text-black/50 leading-relaxed">
            {isIOS
              ? "In Safari: tap Share, then Add to Home Screen."
              : "In your browser menu: choose Install App or Add to Home Screen."}
          </p>
          <button
            type="button"
            onClick={() => setShowInstallHelp(false)}
            className="mt-2 text-[10px] font-semibold text-black/45 hover:text-black/70"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
