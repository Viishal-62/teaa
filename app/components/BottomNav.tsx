"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Plus, Mic, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function BottomNav() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const lastScrollY = useRef(0);
  const isTicking = useRef(false);

  // Smooth hide/show behavior on mobile scroll
  useEffect(() => {
    const handleScroll = () => {
      if (isTicking.current) return;
      isTicking.current = true;

      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const delta = currentScrollY - lastScrollY.current;

        if (currentScrollY <= 20) {
          setIsVisible(true);
        } else if (delta > 6) {
          setIsVisible(false);
        } else if (delta < -6) {
          setIsVisible(true);
        }

        lastScrollY.current = currentScrollY;
        isTicking.current = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Mobile keyboard detection using visual viewport
  useEffect(() => {
    const handleResize = () => {
      if (!window.visualViewport) return;
      const keyboardHeight = window.innerHeight - window.visualViewport.height;
      setIsKeyboardOpen(keyboardHeight > 220);
    };

    handleResize();
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
      return () =>
        window.visualViewport?.removeEventListener("resize", handleResize);
    }
  }, []);

  // Ensure nav is visible when route changes
  useEffect(() => {
    setIsVisible(true);
    lastScrollY.current = window.scrollY;
  }, [pathname]);

  // Lock background scroll while the action sheet is open
  useEffect(() => {
    if (!isActionSheetOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isActionSheetOpen]);

  // Close sheet on route changes
  useEffect(() => {
    setIsActionSheetOpen(false);
  }, [pathname]);

  if (
    pathname?.includes("/dashboard") ||
    pathname?.includes("/login") ||
    pathname?.includes("/admin") ||
    pathname?.includes("/spill/create")
  ) {
    return null;
  }

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Explore", href: "/explore", icon: Compass },
    { name: "Create", href: "/", icon: Plus, isFab: true },
    { name: "Voice", href: "/explore/voice", icon: Mic },
    { name: "Spills", href: "/b/global/spill", icon: BookOpen },
  ];

  const shouldShowNav = isVisible && !isKeyboardOpen;

  return (
    <>
      {/* Spacer prevents mobile content from hiding behind nav */}
      <div
        className="md:hidden pointer-events-none"
        style={{ height: "calc(72px + env(safe-area-inset-bottom, 0px))" }}
      />

      <motion.nav
        initial={{ y: 120 }}
        animate={{ y: shouldShowNav ? 0 : 120 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
        className="fixed bottom-0 left-0 right-0 z-[120] md:hidden bg-white/85 backdrop-blur-xl border-t border-black/5 pt-2 px-4 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]"
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom, 0px), 12px)",
        }}
      >
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            if (item.isFab) {
              return (
                <div key={item.name} className="relative -top-5">
                  <button
                    type="button"
                    aria-label="Open quick actions"
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(50);
                      setIsActionSheetOpen(true);
                    }}
                    className="flex items-center justify-center w-14 h-14 rounded-full bg-black text-white shadow-lg active:scale-95 transition-transform"
                    style={{
                      background: "linear-gradient(135deg, #000, #222)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                    }}
                  >
                    <Icon
                      size={24}
                      className={`transition-transform duration-300 ${isActionSheetOpen ? "rotate-45" : ""}`}
                    />
                  </button>
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(30);
                }}
                className={`flex flex-col items-center justify-center w-16 h-full gap-1 active:scale-95 transition-transform ${
                  isActive ? "text-black" : "text-black/40 hover:text-black/70"
                }`}
              >
                <Icon
                  size={isActive ? 22 : 20}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={`text-[9px] font-bold tracking-wide ${isActive ? "opacity-100" : "opacity-0"} transition-opacity`}
                >
                  {item.name}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute -bottom-2 w-1 h-1 bg-black rounded-full"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </motion.nav>

      {/* Action Sheet Portal */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isActionSheetOpen && (
              <div className="md:hidden block">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/40 z-[9998] backdrop-blur-sm"
                  onClick={() => setIsActionSheetOpen(false)}
                  style={{ touchAction: "none" }}
                />
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="fixed bottom-0 left-0 right-0 z-[9999] rounded-t-[2.5rem] bg-white px-6 pb-8 pt-2 shadow-[0_-20px_60px_rgba(0,0,0,0.15)]"
                  style={{ paddingBottom: "env(safe-area-inset-bottom, 32px)" }}
                >
                  <div
                    className="flex justify-center mb-6 cursor-ns-resize"
                    onClick={() => setIsActionSheetOpen(false)}
                  >
                    <div className="w-12 h-1.5 bg-black/10 rounded-full" />
                  </div>

                  <h3 className="text-xl font-black serif text-center mb-6 text-black">
                    What would you like to do?
                  </h3>

                  <div className="space-y-3">
                    <Link
                      href="/confess"
                      onClick={() => {
                        if (navigator.vibrate) navigator.vibrate(30);
                        setIsActionSheetOpen(false);
                      }}
                      className="flex items-center gap-4 bg-[#faf8f5] hover:bg-black/5 p-4 rounded-2xl transition-colors active:scale-[0.98]"
                    >
                      <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-2xl border border-black/5">
                        🗣️
                      </div>
                      <div>
                        <p className="font-bold text-black text-sm">
                          Spill some Teaa
                        </p>
                        <p className="text-[11px] text-black/50 font-medium mt-0.5">
                          Drop a quick anonymous confession
                        </p>
                      </div>
                    </Link>

                    <Link
                      href="/create"
                      onClick={() => {
                        if (navigator.vibrate) navigator.vibrate(30);
                        setIsActionSheetOpen(false);
                      }}
                      className="flex items-center gap-4 bg-[#faf8f5] hover:bg-black/5 p-4 rounded-2xl transition-colors active:scale-[0.98]"
                    >
                      <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-2xl border border-black/5">
                        📋
                      </div>
                      <div>
                        <p className="font-bold text-black text-sm">
                          Create a Board
                        </p>
                        <p className="text-[11px] text-black/50 font-medium mt-0.5">
                          Start your own community or AMA
                        </p>
                      </div>
                    </Link>

                    <Link
                      href="/spill/create"
                      onClick={() => {
                        if (navigator.vibrate) navigator.vibrate(30);
                        setIsActionSheetOpen(false);
                      }}
                      className="flex items-center gap-4 bg-[#faf8f5] hover:bg-black/5 p-4 rounded-2xl transition-colors active:scale-[0.98]"
                    >
                      <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-2xl border border-black/5">
                        📚
                      </div>
                      <div>
                        <p className="font-bold text-black text-sm">
                          Write a Long Gossip
                        </p>
                        <p className="text-[11px] text-black/50 font-medium mt-0.5">
                          Write multi-chapter long stories
                        </p>
                      </div>
                    </Link>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
