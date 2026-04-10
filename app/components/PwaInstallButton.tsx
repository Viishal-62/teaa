"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { motion } from "framer-motion";

export default function PwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
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
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
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
      <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-widest border border-green-100">
        <span className="w-2.5 h-2.5 rounded-full bg-green-400 relative">
          <span className="absolute inset-0 rounded-full animate-ping bg-green-400 opacity-50" />
        </span>
        App Installed
      </div>
    );
  }

  if (isInstallable) {
    return (
      <motion.button
        onClick={handleInstallClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="group flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-[0_12px_30px_rgba(59,130,246,0.3)] hover:shadow-[0_16px_40px_rgba(59,130,246,0.4)] transition-all overflow-hidden relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-in-out" />
        <Download size={14} className="relative z-10" />
        <span className="relative z-10">One-Tap Install</span>
      </motion.button>
    );
  }

  // Not installable state (e.g., iOS Safari where manual share -> add to home is needed)
  return (
    <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-black/5 text-black/60 text-[10px] font-bold uppercase tracking-widest border border-black/[0.05]">
      Check guide above to install
    </div>
  );
}
