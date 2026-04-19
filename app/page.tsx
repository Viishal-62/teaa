"use client";

import Link from "next/link";
import { toast } from "sonner";
import PwaInstallButton from "@/app/components/PwaInstallButton";
import { FaApple, FaAndroid } from "react-icons/fa";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CATEGORY_INFO, timeAgo } from "@/app/lib/utils";
import {
  ArrowRight,
  Compass,
  Plus,
  Mic,
  Headphones,
  MessageCircle,
  Shield,
  Zap,
  Eye,
  Flame,
  Inbox,
  Wand2,
  ImageDown,
  Volume2,
  Menu,
  X,
  MapPin,
  Briefcase,
  Heart,
  TrendingUp,
  Send,
  BarChart3,
  Download,
  Users,
  Timer,
  Share2,
} from "lucide-react";
import { Plus as PlusIcon, Check, Play, BookOpen } from "lucide-react";
import DeepSpillCard from "@/app/components/DeepSpillCard";
import { useEffect, useState, useRef } from "react";
import {
  motion,
  AnimatePresence,
} from "framer-motion";
import { THEMES } from "@/convex/helpers";
import { useRouter } from "next/navigation";

/* ── Lightweight animated number (no react-spring) ── */
function AnimNum({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (value === 0) return;
    let start = 0;
    const duration = 1200;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <span ref={ref}>{display}</span>;
}

/* ── Variants ── */
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as any },
  },
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as any },
  },
};

/* ── Mood categories for marquee ── */
const MOODS = [
  { label: "Regret", emoji: "🌊", color: "#3b82f6" },
  { label: "Love", emoji: "💗", color: "#ec4899" },
  { label: "Guilt", emoji: "⚖️", color: "#eab308" },
  { label: "Relief", emoji: "🌬️", color: "#22c55e" },
  { label: "Longing", emoji: "🎵", color: "#a855f7" },
  { label: "Mischief", emoji: "😈", color: "#f97316" },
  { label: "Obsession", emoji: "🔥", color: "#ef4444" },
  { label: "Pride", emoji: "✨", color: "#f59e0b" },
  { label: "Fear", emoji: "👻", color: "#6366f1" },
  { label: "Envy", emoji: "💚", color: "#14b8a6" },
  { label: "Deep Dark", emoji: "🕳️", color: "#475569" },
  { label: "Crush", emoji: "💝", color: "#ec4899" },
];

const FOOTER_QUOTES = [
  { text: "Until you make the unconscious conscious, it will direct your life and you will call it fate.", author: "Carl Jung" },
  { text: "When we are no longer able to change a situation, we are challenged to change ourselves.", author: "Viktor Frankl" },
  { text: "Unexpressed emotions will never die. They are buried alive and will come forth later in uglier ways.", author: "Sigmund Freud" },
  { text: "The range of what we think and do is limited by what we fail to notice.", author: "R. D. Laing" },
  { text: "The more unlived your life, the greater your death anxiety.", author: "Irvin D. Yalom" },
  { text: "You are not your thoughts.", author: "Aaron T. Beck" }
];

function QuoteCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % FOOTER_QUOTES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative mb-6 h-[100px] w-full flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
           key={index}
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -10 }}
           transition={{ duration: 0.6, ease: "easeOut" }}
           className="absolute w-full px-2"
        >
          <p className="text-[15px] font-medium text-black/70 italic serif leading-relaxed mb-3 line-clamp-3">
             &ldquo;{FOOTER_QUOTES[index].text}&rdquo;
          </p>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/30">
             — {FOOTER_QUOTES[index].author}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const publicBoards = useQuery(api.boards.listPublicWithCounts);
  const globalFeed = useQuery(api.confessions.globalFeed, {});
  const recentSpills = useQuery(api.spills.listAll);
  const voiceFeed = useQuery(api.confessions.voiceFeed, {});
  const contextDistribution = useQuery(
    api.confessions.getGlobalContextDistribution,
  );

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  /* ── Engagement: Popup, Toasts ── */
  const [showEngagementPopup, setShowEngagementPopup] = useState(false);
  const [popupDismissed, setPopupDismissed] = useState(false);

  const isDesktopViewport = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 768px)").matches;

  // Timed engagement popup — show after 6s on first visit
  useEffect(() => {
    if (!isDesktopViewport()) return;
    if (popupDismissed) return;
    const seen = sessionStorage.getItem("teaaa_popup_seen");
    if (seen) { setPopupDismissed(true); return; }
    const t = setTimeout(() => {
      // Only show popup if user hasn't scrolled much (engaged users are scrolling)
      const scrollPct = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      if (scrollPct < 0.3) setShowEngagementPopup(true);
    }, 45000);
    return () => clearTimeout(t);
  }, [popupDismissed]);

  // Exit-intent detection (desktop only)
  useEffect(() => {
    if (!isDesktopViewport()) return;
    if (popupDismissed) return;
    const handler = (e: MouseEvent) => {
      if (e.clientY <= 5 && !popupDismissed) {
        setShowEngagementPopup(true);
      }
    };
    document.addEventListener("mouseleave", handler);
    return () => document.removeEventListener("mouseleave", handler);
  }, [popupDismissed]);

  const dismissPopup = () => {
    setShowEngagementPopup(false);
    setPopupDismissed(true);
    sessionStorage.setItem("teaaa_popup_seen", "1");
  };

  // Prevent background scroll while mobile drawers/popups are open
  useEffect(() => {
    const isDesktopPopupActive = showEngagementPopup && isDesktopViewport();
    if (!isMobileMenuOpen && !isDesktopPopupActive) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isMobileMenuOpen, showEngagementPopup]);

  // Live activity toasts — continuously cycle through varied social proof
  useEffect(() => {
    const feed = globalFeed?.filter((c: any) => c.type !== "voice" && c.text) ?? [];
    const cities = contextDistribution?.cities ?? [];
    const voiceCount = voiceFeed?.length ?? 0;
    const total = (globalFeed?.length ?? 0) + voiceCount;

    // Build a pool of varied toast configs
    const toastPool: Array<{ msg: string; desc: string; icon: string; href: string }> = [];

    // Confession previews
    feed.slice(0, 6).forEach((c: any) => {
      const preview = c.text?.slice(0, 50) + (c.text?.length > 50 ? "…" : "");
      toastPool.push({
        msg: `"${preview}"`,
        desc: "Tap to read more →",
        icon: "🔥",
        href: "/explore",
      });
    });

    // Voice drop notifications
    if (voiceCount > 0) {
      toastPool.push({
        msg: "Someone just dropped a voice confession",
        desc: `${voiceCount} anonymous voice drops waiting`,
        icon: "🎙️",
        href: "/explore/voice",
      });
    }

    // City-based toasts
    cities.slice(0, 3).forEach((city: any) => {
      toastPool.push({
        msg: `New confession from ${city.key}`,
        desc: `${city.count} teas from this city`,
        icon: "📍",
        href: `/explore?city=${encodeURIComponent(city.key)}`,
      });
    });

    // Engagement counter
    if (total > 0) {
      toastPool.push({
        msg: `${total}+ anonymous confessions and counting`,
        desc: "What's your secret?",
        icon: "👀",
        href: "/confess",
      });
    }

    if (toastPool.length === 0) return;

    // Shuffle pool for variety
    for (let i = toastPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [toastPool[i], toastPool[j]] = [toastPool[j], toastPool[i]];
    }

    let idx = 0;
    const showNext = () => {
      const t = toastPool[idx % toastPool.length];
      toast(t.msg, {
        description: t.desc,
        icon: t.icon,
        duration: 5000,
        action: {
          label: "Read it →",
          onClick: () => router.push(t.href),
        },
      });
      idx++;
    };

    const initialDelay = setTimeout(showNext, 15000);
    const interval = setInterval(showNext, 25000);
    return () => { clearTimeout(initialDelay); clearInterval(interval); };
  }, [globalFeed, voiceFeed, contextDistribution, router]);



  const totalConfessions = (globalFeed?.length ?? 0) + (voiceFeed?.length ?? 0);
  const textConfessions =
    globalFeed?.filter((c: any) => c.type !== "voice") ?? [];
  const mobileConfessions = textConfessions.slice(0, 5);
  const mobileBoards = (publicBoards ?? []).slice(0, 8);
  const mobileSpills = (recentSpills ?? []).slice(0, 3);

  return (
    <>
      <div className="md:hidden min-h-screen pb-28 text-black relative bg-[#f5f5f7] overflow-hidden">
        {/* Ambient gradient wash — softer, more refined */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-50/50 via-rose-50/20 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-[300px] bg-gradient-to-t from-amber-50/20 to-transparent pointer-events-none" />

        {/* ── Header — App-native style ── */}
        <header className="sticky top-0 z-40 bg-[#f5f5f7]/80 backdrop-blur-2xl border-b border-black/[0.04]">
          <div className="px-5 pt-[max(env(safe-area-inset-top),14px)] pb-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-[12px] bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-md shadow-amber-500/25">
                  <span className="text-[16px] leading-none">🫖</span>
                </div>
                <div>
                  <h1 className="text-[19px] font-black tracking-tight leading-tight serif">teaaa</h1>
                  <p className="text-[10px] font-medium text-black/30 -mt-0.5 tracking-wide">
                    {new Date().getHours() < 12 ? "Good morning ☀️" : new Date().getHours() < 17 ? "Good afternoon 🌤️" : "Good evening 🌙"}
                  </p>
                </div>
              </div>
              <PwaInstallButton compact />
            </div>
          </div>
          <div className="px-5 pb-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <Link
              href="/explore"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-white border border-black/[0.06] shadow-sm px-3.5 py-[7px] text-[11px] font-semibold text-black/60 active:scale-95 transition-all"
            >
              <Compass size={13} className="text-blue-500" />
              Explore
            </Link>
            <Link
              href="/explore/voice"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-white border border-black/[0.06] shadow-sm px-3.5 py-[7px] text-[11px] font-semibold text-black/60 active:scale-95 transition-all"
            >
              <Mic size={13} className="text-rose-500" />
              Voice
            </Link>
            <Link
              href="/boards"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-white border border-black/[0.06] shadow-sm px-3.5 py-[7px] text-[11px] font-semibold text-black/60 active:scale-95 transition-all"
            >
              <Users size={13} className="text-amber-500" />
              Boards
            </Link>
            <Link
              href="/forum"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-white border border-black/[0.06] shadow-sm px-3.5 py-[7px] text-[11px] font-semibold text-black/60 active:scale-95 transition-all"
            >
              <MessageCircle size={13} className="text-violet-500" />
              Forum
            </Link>
          </div>
        </header>

        <main className="px-5 pt-5 pb-10 space-y-5 relative z-10">
          {/* ── Community Pulse Banner — Light Mesh Card ── */}
          <section className="relative overflow-hidden rounded-[28px] bg-white border border-black/[0.04] shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6">
            {/* Soft background mesh */}
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-rose-400/20 rounded-full blur-[40px] pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-amber-400/20 rounded-full blur-[40px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-blue-400/15 rounded-full blur-[40px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            
            {/* Shimmer effect gently sweeping */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent admirer-shimmer pointer-events-none" />

            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-black/[0.04] flex items-center justify-center">
                  <Compass size={14} className="text-black/60" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/50">Unfiltered & Anonymous</p>
              </div>
              
              <div className="mb-6">
                  <h2 className="text-[48px] leading-none font-black tracking-tighter tabular-nums text-black">
                    {totalConfessions > 0 ? totalConfessions : "0"}
                  </h2>
                  <p className="text-[13px] text-black/50 font-medium mt-1">drops shared by the community</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 flex flex-col items-center justify-center rounded-[18px] bg-white/60 backdrop-blur-md border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.02)] py-3 px-2 transition-transform active:scale-95">
                   <MessageCircle size={14} className="text-rose-500 mb-2" />
                   <p className="text-[17px] font-black leading-none">{textConfessions.length}</p>
                   <p className="text-[9px] font-bold text-black/40 uppercase tracking-widest mt-1">Posts</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center rounded-[18px] bg-white/60 backdrop-blur-md border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.02)] py-3 px-2 transition-transform active:scale-95">
                   <Mic size={14} className="text-blue-500 mb-2" />
                   <p className="text-[17px] font-black leading-none">{voiceFeed?.length ?? 0}</p>
                   <p className="text-[9px] font-bold text-black/40 uppercase tracking-widest mt-1">Voices</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center rounded-[18px] bg-white/60 backdrop-blur-md border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.02)] py-3 px-2 transition-transform active:scale-95">
                   <Users size={14} className="text-amber-500 mb-2" />
                   <p className="text-[17px] font-black leading-none">{publicBoards?.length ?? 0}</p>
                   <p className="text-[9px] font-bold text-black/40 uppercase tracking-widest mt-1">Boards</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Quick Confess — Clean white card ── */}
          <section className="rounded-[20px] bg-white border border-black/[0.05] shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-[10px] bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm shadow-amber-500/20">
                  <Zap size={13} className="text-white" />
                </div>
                <p className="text-[13px] font-bold text-black/75">Drop a Secret</p>
              </div>
              <Link href="/confess" className="text-[11px] text-black/35 font-semibold active:opacity-50 transition-opacity">
                Full Editor →
              </Link>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const text = (formData.get("quickText") as string) || "";
                if (text.trim()) {
                  router.push(`/confess?text=${encodeURIComponent(text.trim())}`);
                } else {
                  router.push("/confess");
                }
              }}
              className="flex items-center gap-2.5"
            >
              <input
                name="quickText"
                placeholder="What's on your mind?..."
                className="flex-1 h-11 rounded-[14px] border border-black/[0.06] bg-[#f5f5f7] px-4 text-[14px] font-medium placeholder:text-black/25 outline-none focus:border-black/15 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,0,0,0.03)] transition-all"
              />
              <button
                type="submit"
                className="h-11 w-11 rounded-[14px] bg-[#111] text-white flex items-center justify-center active:scale-90 transition-transform shadow-lg shadow-black/15"
                aria-label="Send confession draft"
              >
                <Send size={15} />
              </button>
            </form>
          </section>

          {/* ── Feature Grid — Bold gradient cards ── */}
          <section className="grid grid-cols-2 gap-3">
            <Link href="/confess" className="group rounded-[20px] bg-gradient-to-br from-rose-500 to-pink-600 p-4 text-white active:scale-[0.96] transition-all shadow-lg shadow-rose-500/25 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
              <div className="relative">
                <div className="w-10 h-10 rounded-[12px] bg-white/20 backdrop-blur-md flex items-center justify-center mb-3">
                  <MessageCircle size={18} />
                </div>
                <p className="text-[15px] font-bold leading-tight">Write</p>
                <p className="text-[11px] text-white/60 mt-0.5 font-medium">Drop text instantly</p>
              </div>
            </Link>

            <Link href="/explore/voice" className="group rounded-[20px] bg-gradient-to-br from-sky-500 to-blue-600 p-4 text-white active:scale-[0.96] transition-all shadow-lg shadow-sky-500/25 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
              <div className="relative">
                <div className="w-10 h-10 rounded-[12px] bg-white/20 backdrop-blur-md flex items-center justify-center mb-3">
                  <Mic size={18} />
                </div>
                <p className="text-[15px] font-bold leading-tight">Voice</p>
                <p className="text-[11px] text-white/60 mt-0.5 font-medium">Listen & speak</p>
              </div>
            </Link>

            <Link href="/create" className="group rounded-[20px] bg-gradient-to-br from-violet-500 to-purple-600 p-4 text-white active:scale-[0.96] transition-all shadow-lg shadow-violet-500/25 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
              <div className="relative">
                <div className="w-10 h-10 rounded-[12px] bg-white/20 backdrop-blur-md flex items-center justify-center mb-3">
                  <Plus size={18} />
                </div>
                <p className="text-[15px] font-bold leading-tight">Create</p>
                <p className="text-[11px] text-white/60 mt-0.5 font-medium">Start your board</p>
              </div>
            </Link>

            <Link href="/b/global/spill" className="group rounded-[20px] bg-gradient-to-br from-amber-500 to-orange-600 p-4 text-white active:scale-[0.96] transition-all shadow-lg shadow-amber-500/25 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
              <div className="relative">
                <div className="w-10 h-10 rounded-[12px] bg-white/20 backdrop-blur-md flex items-center justify-center mb-3">
                  <BookOpen size={18} />
                </div>
                <p className="text-[15px] font-bold leading-tight">Spills</p>
                <p className="text-[11px] text-white/60 mt-0.5 font-medium">Read long stories</p>
              </div>
            </Link>
          </section>

          {/* ── Fresh Drops — Cards with left accent bar ── */}
          <section>
            <div className="flex items-center justify-between mb-3.5 px-0.5">
              <h3 className="text-[17px] font-black tracking-tight serif flex items-center gap-2">
                Fresh Drops <span className="text-base">💧</span>
              </h3>
              <Link href="/explore" className="text-[11px] text-black/35 font-semibold inline-flex items-center gap-1 active:opacity-50 transition-opacity">
                View all
                <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-2.5">
              {mobileConfessions.length === 0 ? (
                <div className="p-6 text-center rounded-[20px] bg-white border border-black/[0.04]">
                  <p className="text-[13px] font-medium text-black/35">Loading confessions...</p>
                </div>
              ) : (
                mobileConfessions.map((item: any, i: number) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={item?.boardSlug ? `/b/${item.boardSlug}/c/${item._id}` : "/explore"}
                      className="group block rounded-[20px] bg-white border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-4 active:scale-[0.98] transition-all"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span
                          className="inline-flex items-center rounded-lg px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white shadow-sm"
                          style={{
                            background: CATEGORY_INFO[item?.category as keyof typeof CATEGORY_INFO]?.color ?? "#6b7280",
                          }}
                        >
                          {CATEGORY_INFO[item?.category as keyof typeof CATEGORY_INFO]?.label ?? item?.category ?? "Confession"}
                        </span>
                        <span className="text-[10px] font-medium text-black/35 bg-black/[0.03] px-2 py-0.5 rounded-md">{timeAgo(item._creationTime)}</span>
                      </div>
                      <p className="text-[15px] leading-[1.45] text-black/85 font-medium line-clamp-3 serif">
                        {item.text || "Untitled confession"}
                      </p>
                      <div className="mt-4 pt-3 border-t border-black/[0.03] flex items-center justify-between text-[11px] font-semibold text-black/40">
                        <span className="truncate max-w-[65%] flex items-center gap-1.5 text-blue-600/80">
                          <Compass size={12} />
                          {item?.boardSlug ? `b/${item.boardSlug}` : "Global Feed"}
                        </span>
                        <span className="inline-flex items-center gap-1 text-black/50 group-active:text-black transition-colors bg-black/[0.03] px-2.5 py-1 rounded-lg">
                          <Eye size={12} />
                          Read
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))
              )}
            </div>
          </section>

          {/* ── Popular Boards — Split-card carousel ── */}
          <section className="relative -mx-5 px-5">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-[17px] font-black tracking-tight serif flex items-center gap-2">
                Popular Boards <span className="text-base">🔥</span>
              </h3>
              <Link href="/boards" className="text-[11px] text-black/35 font-semibold inline-flex items-center gap-1 active:opacity-50 transition-opacity">
                Browse
              </Link>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-[#f5f5f7] to-transparent z-10 pointer-events-none" />
            <div className="absolute left-0 top-0 bottom-0 w-5 bg-gradient-to-r from-[#f5f5f7] to-transparent z-10 pointer-events-none" />

            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-3 -mb-3 snap-x snap-mandatory pr-8 pl-5 -ml-5">
              {mobileBoards.map((board: any, i: number) => {
                const gradients = [
                  "from-amber-400 to-orange-500",
                  "from-sky-400 to-blue-500",
                  "from-rose-400 to-pink-500",
                  "from-emerald-400 to-teal-500",
                  "from-violet-400 to-purple-500",
                ];
                const gradient = gradients[i % gradients.length];

                return (
                  <Link
                    key={board._id}
                    href={board?.slug ? `/b/${board.slug}` : "/boards"}
                    className="shrink-0 snap-start w-[220px] rounded-[24px] overflow-hidden active:scale-[0.97] transition-transform shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
                  >
                    {/* Gradient header */}
                    <div className={`bg-gradient-to-br ${gradient} p-4 pb-5`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-8 h-8 rounded-xl bg-white/25 backdrop-blur-md flex items-center justify-center">
                          <span className="text-[14px]">🫖</span>
                        </div>
                        <span className="text-[9px] font-bold text-white/80 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full">
                          {(board?.confessionCount ?? 0) + (board?.spillCount ?? 0)} drops
                        </span>
                      </div>
                      <p className="text-[15px] font-bold text-white truncate">{board.name}</p>
                    </div>
                    {/* White footer */}
                    <div className="bg-white p-3.5 border-t border-black/[0.03]">
                      <p className="text-[11px] font-medium text-black/45 line-clamp-2 leading-snug mb-2.5">
                        {board.tagline || "Discover this anonymous space"}
                      </p>
                      <div className="text-[10px] font-semibold text-black/30 truncate">
                        b/{board?.slug || "open"}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* ── Top Spills — Cleaner editorial cards ── */}
          {mobileSpills.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3.5 px-0.5">
                <h3 className="text-[17px] font-black tracking-tight serif flex items-center gap-2">
                  Top Spills <span className="text-base">📖</span>
                </h3>
                <Link href="/b/global/spill" className="text-[11px] text-black/35 font-semibold inline-flex items-center gap-1 active:opacity-50 transition-opacity">
                  Read More
                </Link>
              </div>
              <div className="space-y-3">
                {mobileSpills.map((spill: any, index: number) => {
                  const coverColors = [
                    "from-[#E5E0D8] to-[#D4CEC4]",
                    "from-[#DCE3E8] to-[#C9D4DC]",
                    "from-[#E1DFE8] to-[#D0CCD9]",
                  ];
                  const bgGradient = coverColors[index % coverColors.length];
                  
                  return (
                    <Link
                      key={spill._id}
                      href={`/b/${spill.boardSlug || "global"}/s/${spill._id}`}
                      className="group block rounded-[28px] bg-white border border-black/[0.04] shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden active:scale-[0.98] transition-transform relative"
                    >
                      {/* Decorative native story top bar */}
                      <div className={`h-2.5 w-full bg-gradient-to-r ${bgGradient}`} />
                      
                      <div className="p-6">
                        <div className="mb-4 flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-black/[0.04] flex items-center justify-center text-[11px]">
                                👤
                              </div>
                              <span className="text-[11px] font-bold text-black/60 uppercase tracking-wide">
                                {spill?.displayName || "Anonymous"}
                              </span>
                           </div>
                           <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.15em] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100/50">
                             ✦ Spotlight
                           </span>
                        </div>
                        
                        <h4 className="text-[22px] font-black serif leading-[1.15] mb-3 text-black/90 tracking-tight group-active:text-blue-600 transition-colors">
                          {spill.title || "Untitled Spill"}
                        </h4>
                        
                        <div className="relative">
                          <p className="text-[14px] text-black/60 leading-[1.65] serif line-clamp-4">
                            {spill.content || "Read the full narrative and dive deep into this completely anonymous spill inside."}
                          </p>
                          {/* Fade out for "long story" feel */}
                          <div className="absolute bottom-0 left-0 right-0 h-[48px] bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
                        </div>
                        
                        <div className="mt-5 pt-4 border-t border-black/[0.04] flex items-center justify-between">
                          <span className="text-[11px] font-bold text-black/40 flex items-center gap-1.5">
                            <BookOpen size={12} className="text-black/30" />
                            Read full story
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] font-bold text-black/40 flex items-center gap-1.5">
                              <Eye size={12} />
                              {spill?.views ?? 0}
                            </span>
                            <span className="text-[11px] font-bold text-orange-600 flex items-center gap-1.5 bg-orange-50 px-2 py-0.5 rounded-md">
                              <Flame size={12} className="text-orange-500" />
                              {spill?.totalReactions ?? 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Editorial Footer ── */}
          <footer className="mt-8 mb-8 px-6 text-center">
            <div className="w-8 h-8 mx-auto mb-5 bg-gradient-to-tr from-orange-400 to-amber-500 rounded-[10px] flex items-center justify-center shadow-md shadow-amber-500/20">
               <span className="text-[14px] leading-none">🫖</span>
            </div>
            
            <QuoteCarousel />

            <div className="w-8 h-[2px] bg-black/10 mx-auto mb-8 rounded-full" />

            <div className="flex items-center justify-center gap-6 mb-8">
               <a href="https://github.com/Vishal-62" target="_blank" rel="noopener noreferrer" className="p-2 text-black/40 hover:text-black transition-colors" aria-label="GitHub">
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                   <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                 </svg>
               </a>
               <span className="w-1.5 h-1.5 rounded-full bg-black/10" />
               <a href="https://linkedin.com/in/" target="_blank" rel="noopener noreferrer" className="p-2 text-black/40 hover:text-[#0A66C2] transition-colors" aria-label="LinkedIn">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
               </a>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-4 text-[11px] font-bold text-black/30">
               <Link href="/terms" className="hover:text-black transition-colors">Terms</Link>
               <Link href="/privacy" className="hover:text-black transition-colors">Privacy</Link>
               <Link href="/disclaimer" className="hover:text-black transition-colors">Disclaimer</Link>
            </div>
          </footer>
        </main>
      </div>

      <div className="hidden md:block min-h-screen bg-[#faf8f5] text-black font-sans selection:bg-accent/10 overflow-x-hidden">
        {/* ── NAV ── */}
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-4 bg-[#faf8f5]/80 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-sm font-black serif tracking-tight hover:scale-105 transition-transform"
            >
              🫖 teaaa
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-5">
              <Link
                href="/explore"
                className="text-[10px] font-bold uppercase tracking-widest text-black/30 hover:text-black transition-colors"
              >
                Explore
              </Link>
              <Link
                href="/forum"
                className="text-[10px] font-bold uppercase tracking-widest text-black/30 hover:text-black transition-colors"
              >
                Community
              </Link>
              <Link
                href="/explore/voice"
                className="text-[10px] font-bold uppercase tracking-widest text-black/30 hover:text-black transition-colors flex items-center gap-1"
              >
                <Mic size={10} /> Voice
              </Link>
              <Link
                href="#how-to-use"
                className="text-[10px] font-bold uppercase tracking-widest text-black/30 hover:text-black transition-colors flex items-center gap-1.5"
              >
                How to use
                <span className="px-1.5 py-[2px] bg-accent/10 border border-accent/20 text-accent text-[8px] font-black rounded-md tracking-wider">NEW</span>
              </Link>
              <Link
                href="/confess"
                className="text-[10px] font-bold uppercase tracking-widest text-black/30 hover:text-black transition-colors"
              >
                Confess
              </Link>
              <Link
                href="/create"
                className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 bg-black text-white rounded-lg hover:scale-105 transition-all"
              >
                Create Board
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 -mr-2 text-black/60 hover:text-black transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </motion.nav>

        {/* ── MOBILE MENU DRAWER ── */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[55] md:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 bottom-0 w-[280px] bg-[#faf8f5] z-[60] md:hidden shadow-2xl shadow-black/20 flex flex-col"
              >
                <div className="flex items-center justify-between p-5 border-b border-black/5">
                  <span className="text-sm font-black serif">🫖 teaaa</span>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1 text-black/40 hover:text-black transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <nav className="flex-1 p-5 space-y-1 overflow-y-auto">
                  {[
                    { href: "/explore", label: "Explore", icon: "🧭" },
                    { href: "#how-to-use", label: "How to use", icon: "🗺️", badge: "NEW" },
                    { href: "/forum", label: "Community", icon: "💬" },
                    { href: "/explore/voice", label: "Voice Confess", icon: "🎙️" },
                    { href: "/confess", label: "Confess Now", icon: "✍️" },
                    { href: "/spill/create", label: "Write a Spill", icon: "📖" },
                    {
                      href: "/b/global/spill",
                      label: "Global Spills",
                      icon: "🔥",
                    },
                    { href: "/about", label: "About Teaaa", icon: "🫖" },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-black/[0.03] transition-colors group"
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-sm font-bold text-black/60 group-hover:text-black transition-colors flex-1">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className="px-2 py-1 bg-accent/10 border border-accent/20 text-accent text-[9px] font-black uppercase tracking-widest rounded-md">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </nav>
                <div className="p-5 border-t border-black/5">
                  <Link
                    href="/create"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:scale-[1.02] transition-all"
                  >
                    <Plus size={14} />
                    Create Board
                  </Link>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ══════════════════════════════════════════
          HERO — Ultra Premium section
         ══════════════════════════════════════════ */}
        <section
          className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 pt-24 pb-16 overflow-hidden bg-[#faf8f5]"
        >
          {/* Subtle noise/grid overlay */}
          <div
            className="absolute inset-0 z-0 opacity-[0.35] mix-blend-overlay pointer-events-none hidden sm:block"
            style={{
              backgroundImage:
                "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')",
            }}
          ></div>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_40%,#000_20%,transparent_100%)] pointer-events-none hidden sm:block" />

          {/* ── Mesh gradient background — CSS animated (GPU composited) ── */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 hidden sm:block">
            <div
              className="mesh-blob-1 absolute -top-[10%] -left-[10%] w-[800px] h-[800px] rounded-full blur-[140px] opacity-40 mix-blend-multiply"
              style={{
                background: "radial-gradient(circle, #fca5a5, transparent 60%)",
              }}
            />
            <div
              className="mesh-blob-2 absolute top-[20%] left-[30%] w-[700px] h-[700px] rounded-full blur-[180px] opacity-30 mix-blend-multiply"
              style={{
                background: "radial-gradient(circle, #fde047, transparent 70%)",
              }}
            />
            <div
              className="mesh-blob-3 absolute -bottom-[20%] -right-[10%] w-[900px] h-[900px] rounded-full blur-[160px] opacity-40 mix-blend-multiply"
              style={{
                background: "radial-gradient(circle, #c4b5fd, transparent 70%)",
              }}
            />
          </div>

          {/* ── Floating confession previews (Desktop) — Exact flip card back face ── */}
          <div className="absolute inset-0 pointer-events-none z-[1] hidden lg:block">
            {[
              {
                item: textConfessions[0] || {
                  text: "I accidentally sent the screenshot to the group chat instead of my best friend.",
                  category: "Regret",
                  _creationTime: Date.now(),
                  views: 42,
                },
                posClass: "absolute top-[15%] left-[5%] 2xl:left-[12%] w-[220px]",
                enterClass: "card-enter-1",
                floatClass: "float-card-1",
                fakeReactions: ["\u2764\ufe0f", "\ud83d\udd25", "\ud83d\ude02"],
                fakeFelt: 18,
              },
              {
                item: textConfessions[1] || {
                  text: "I know you're dating someone else, but I still wait for your text every night.",
                  category: "Longing",
                  _creationTime: Date.now() - 300000,
                  views: 67,
                },
                posClass: "absolute top-[30%] right-[4%] 2xl:right-[9%] w-[220px]",
                enterClass: "card-enter-2",
                floatClass: "float-card-2",
                fakeReactions: ["\ud83d\udc9b", "\ud83e\udee3", "\ud83d\udd25"],
                fakeFelt: 34,
              },
              {
                item: textConfessions[2] || {
                  text: "Everyone thinks I have it together, but I'm just guessing my way through life.",
                  category: "Fear",
                  _creationTime: Date.now() - 3600000,
                  views: 31,
                },
                posClass: "absolute bottom-[8%] left-[8%] 2xl:left-[16%] w-[210px]",
                enterClass: "card-enter-3",
                floatClass: "float-card-3",
                fakeReactions: ["\u2764\ufe0f", "\ud83d\ude22", "\ud83e\udec2"],
                fakeFelt: 12,
              },
            ].map((card, i) => {
              const catInfo = CATEGORY_INFO[
                card.item.category as keyof typeof CATEGORY_INFO
              ] || {
                emoji: "\ud83d\udcad",
                label: card.item.category || "Confession",
                color: "#cbd5e1",
              };
              const cardText = card.item.text || (card.item as any).body || "";
              const views = (card.item as any).views || 30;

              return (
                <div
                  key={i}
                  className={`${card.posClass} ${card.enterClass}`}
                >
                  <div
                    className={`${card.floatClass} relative rounded-2xl overflow-hidden`}
                    style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.08)" }}
                  >
                    {/* Cream paper background */}
                    <div className="absolute inset-0 bg-[#faf7f2] rounded-2xl" />
                    {/* Dashed border inset frame */}
                    <div className="absolute inset-[5px] border border-dashed border-black/10 rounded-xl pointer-events-none" />

                    <div className="relative flex flex-col items-center p-4 pt-5" style={{ aspectRatio: "3/4" }}>
                      {/* Category pill badge */}
                      <div className="flex flex-wrap items-center justify-center gap-1.5 mb-auto">
                        <span
                          className="text-[8px] font-extrabold uppercase tracking-[0.15em] px-2.5 py-1 rounded-md"
                          style={{
                            color: catInfo.color,
                            background: `${catInfo.color}15`,
                          }}
                        >
                          {catInfo.label}
                        </span>
                      </div>

                      {/* Confession text — large centered serif */}
                      <div className="flex-1 flex items-center justify-center w-full px-1 my-2">
                        <p className="serif text-[13px] leading-[1.55] text-[#2a2a2a] text-center">
                          {cardText.length > 65
                            ? cardText.slice(0, 65) + "..."
                            : cardText}
                        </p>
                      </div>

                      {/* Stats: views + felt by */}
                      <div className="flex items-center justify-center gap-2 text-[8px] text-black/25 font-medium uppercase tracking-wider mb-2">
                        <span className="flex items-center gap-1">
                          <Eye size={8} className="opacity-60" /> {views}
                        </span>
                        <span className="w-0.5 h-0.5 rounded-full bg-black/15" />
                        <span>Felt by {card.fakeFelt}</span>
                      </div>

                      {/* Reaction emoji row */}
                      <div className="flex items-center justify-center gap-1.5 mb-2">
                        {card.fakeReactions.map((emoji, ri) => (
                          <span
                            key={ri}
                            className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-[#faf8f5]"
                          >
                            <span>{emoji}</span>
                            <span className="text-[8px] text-black/40 font-bold">{ri + 2}</span>
                          </span>
                        ))}
                      </div>

                      {/* View thread link */}

                    </div>

                    {/* Close X — top right */}
                    <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-black/5 flex items-center justify-center text-[8px] text-black/25">
                      &#x2715;
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Main content — CSS entrance animations (no JS gating) ── */}
          <div
            className="relative z-10 text-center max-w-4xl mx-auto"
          >
            {/* ── Top Trending Badge ── */}
            {contextDistribution &&
              (contextDistribution.cities.length > 0 ||
                contextDistribution.professions.length > 0 ||
                contextDistribution.contexts.length > 0) && (
                <div
                  className="flex justify-center mb-8 hero-badge"
                >
                  <div className="p-[1px] rounded-full bg-gradient-to-r from-rose-400 via-fuchsia-500 to-indigo-500 shadow-sm inline-block select-none max-w-[calc(100vw-2rem)]">
                    <div className="bg-[#faf8f5] rounded-full px-3 sm:px-4 py-1.5 flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-indigo-500 flex-shrink-0">
                        Trending
                      </span>
                      <div className="w-px h-3 bg-black/10 flex-shrink-0" />
                      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        {contextDistribution.cities.slice(0, 1).map((city) => (
                          <Link
                            key={city.key}
                            href={`/explore?city=${encodeURIComponent(city.key)}`}
                            className="text-[10px] font-bold text-black/70 hover:text-black transition-colors flex items-center gap-1 whitespace-nowrap"
                          >
                            <MapPin size={10} className="text-blue-500" />{" "}
                            {city.key}
                          </Link>
                        ))}
                        {contextDistribution.professions
                          .slice(0, 1)
                          .map((prof) => (
                            <Link
                              key={prof.key}
                              href={`/explore?profession=${encodeURIComponent(prof.key)}`}
                              className="text-[10px] font-bold text-black/70 hover:text-black transition-colors flex items-center gap-1 whitespace-nowrap"
                            >
                              <Briefcase size={10} className="text-amber-500" />{" "}
                              {prof.key}
                            </Link>
                          ))}
                        {contextDistribution.contexts.slice(0, 1).map((ctx) => (
                          <Link
                            key={ctx.key}
                            href={`/explore?context=${encodeURIComponent(ctx.key)}`}
                            className="text-[10px] font-bold text-black/70 hover:text-black transition-colors flex items-center gap-1 whitespace-nowrap"
                          >
                            <Heart size={10} className="text-purple-500" />{" "}
                            {ctx.key}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            {/* Epic Typography Setup */}
            <div className="flex flex-col items-center justify-center mb-6 leading-[0.9]">
              <h1
                className="hero-title-1 text-[2.5rem] sm:text-[5rem] md:text-[6.5rem] lg:text-[7.5rem] font-black text-black tracking-tighter"
              >
                Unfiltered.
              </h1>

              <h1
                className="hero-title-2 text-[1.75rem] sm:text-[4rem] md:text-[5.5rem] lg:text-[6.5rem] font-serif italic tracking-tight relative -mt-1 sm:-mt-5 lg:-mt-6 z-10"
              >
                <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-orange-400 bg-clip-text text-transparent drop-shadow-sm px-1 sm:px-4">
                  Raw. Anonymous.
                </span>
              </h1>
            </div>

            {/* SEO Tagline */}
            <p
              className="hero-seo text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.25em] text-black/15 mb-5 text-center"
            >
              Anonymous Message Link Generator – Send Secret Messages Online
            </p>

            {/* Refined Subtitle */}
            <p
              className="hero-subtitle text-[14px] sm:text-base md:text-lg text-black/50 max-w-xl mx-auto mb-10 font-medium leading-[1.6] text-balance px-4"
            >
              The anonymous platform where you write, speak, doodle, or spill your
              deepest truth — no sign-up needed. Trusted by thousands.
            </p>

            {/* Advanced CTAs */}
            <div
              className="hero-ctas flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
            >
              <div>
                <Link
                  href="/create"
                  className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#0f0f0f] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:scale-[1.02] active:scale-95 transition-all shadow-[0_16px_40px_-12px_rgba(0,0,0,0.4)] overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                  <Plus size={14} className="text-white/70" />
                  <span>Create Board</span>
                </Link>
              </div>

              <div>
                <Link
                  href="/explore"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/50 backdrop-blur-xl border border-black/5 hover:border-black/10 text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-white active:scale-95 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.05)]"
                >
                  <span className="text-[14px] leading-none">🫖</span>
                  <span>Explore Feed</span>
                </Link>
              </div>

              <div>
                <Link
                  href="/explore/voice"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/50 backdrop-blur-xl border border-black/5 hover:border-black/10 text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-white active:scale-95 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.05)]"
                >
                  <Mic size={14} className="text-black/70" />
                  <span>Voice Confess</span>
                </Link>
              </div>
            </div>

            {/* ── Quick Confess ── */}
            {/* Desktop: inline input widget */}
            <div
              className="hero-quick-confess mt-10 w-full max-w-lg mx-auto hidden sm:block"
            >
              <div className="bg-white/70 backdrop-blur-2xl border border-white/60 rounded-2xl p-3 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] transition-shadow duration-500">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const text = (formData.get("quickText") as string) || "";
                    if (text.trim()) {
                      router.push(`/confess?text=${encodeURIComponent(text.trim())}`);
                    } else {
                      router.push("/confess");
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <div className="w-9 h-9 rounded-xl bg-black/[0.03] flex items-center justify-center flex-shrink-0">
                    <span className="text-base">💭</span>
                  </div>
                  <input
                    type="text"
                    name="quickText"
                    placeholder="What's your secret? Drop it anonymously..."
                    className="flex-1 bg-transparent py-2.5 px-2 text-sm font-medium text-black/70 placeholder:text-black/25 outline-none serif"
                  />
                  <button
                    type="submit"
                    className="flex-shrink-0 flex items-center gap-1.5 px-5 py-2.5 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-md shadow-black/10"
                  >
                    <Send
                      size={12}
                      className="group-hover:translate-x-0.5 transition-transform"
                    />
                    Spill
                  </button>
                </form>
              </div>
            </div>

            {/* Mobile: clean CTA link (no cramped input — BottomNav handles quick confess) */}
            <div className="hero-quick-confess mt-8 sm:hidden">
              <Link
                href="/confess"
                className="group inline-flex items-center gap-2 text-[11px] font-bold text-black/30 hover:text-black/60 transition-colors"
              >
                <span>💭</span>
                <span>or just confess anonymously →</span>
              </Link>
            </div>

          </div>
        </section>

        {/* ── MOOD MARQUEE — CSS animated (no framer-motion) ── */}
        <div className="py-6 overflow-hidden border-y border-black/[0.04] bg-white/50">
          <div
            className="animate-css-marquee flex gap-6 whitespace-nowrap"
          >
            {(() => {
              const dynamicItems: Array<{
                label: string;
                emoji: string;
                color: string;
              }> = [];
              if (contextDistribution) {
                contextDistribution.cities
                  .slice(0, 4)
                  .forEach((c) =>
                    dynamicItems.push({
                      label: c.key,
                      emoji: "📍",
                      color: "#3b82f6",
                    }),
                  );
                contextDistribution.professions
                  .slice(0, 3)
                  .forEach((p) =>
                    dynamicItems.push({
                      label: p.key,
                      emoji: "💼",
                      color: "#f59e0b",
                    }),
                  );
                contextDistribution.contexts
                  .slice(0, 2)
                  .forEach((c) =>
                    dynamicItems.push({
                      label: c.key,
                      emoji: "🫂",
                      color: "#a855f7",
                    }),
                  );
              }
              const allItems = [...MOODS, ...dynamicItems];
              return [...allItems, ...allItems].map((m, i) => (
                <div
                  key={`${m.label}-${i}`}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.04]"
                >
                  <span>{m.emoji}</span>
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: m.color }}
                  >
                    {m.label}
                  </span>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* ── STATS ── */}
        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
          className="max-w-3xl mx-auto px-4 sm:px-6 py-14"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Boards", value: publicBoards?.length ?? 0, icon: "🫖" },
              { label: "Confessions", value: totalConfessions, icon: "✍️" },
              { label: "Voice Drops", value: voiceFeed?.length ?? 0, icon: "🎙️" },
              {
                label: "Deep Spills",
                value: recentSpills?.length ?? 0,
                icon: "📖",
              },
            ].map((s) => (
              <motion.div
                key={s.label}
                variants={fadeUp}
                className="bg-white border border-black/5 rounded-2xl p-5 text-center hover:shadow-md hover:shadow-black/[0.02] transition-all"
              >
                <span className="text-xl mb-1 block">{s.icon}</span>
                <p className="text-3xl font-black serif text-black">
                  <AnimNum value={s.value} />
                </p>
                <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-black/20 mt-1">
                  {s.label}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>


        {/* ── RECENT CONFESSIONS ── */}
        {textConfessions.length > 0 && (
          <section className="py-20 px-4 sm:px-6">
            <div className="max-w-2xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex items-center justify-between mb-8"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-accent">
                      Live
                    </p>
                  </div>
                  <h2 className="text-2xl font-black serif">
                    People are confessing
                  </h2>
                </div>
                <Link
                  href="/explore"
                  className="text-[9px] font-bold text-black/20 uppercase tracking-widest hover:text-black transition-colors"
                >
                  View all →
                </Link>
              </motion.div>

              <motion.div
                variants={stagger}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="space-y-3"
              >
                {textConfessions.slice(0, 3).map((confession: any) => {
                  const catInfo = CATEGORY_INFO[confession.category];
                  const previewText =
                    typeof confession.text === "string" &&
                      confession.text.trim().length > 0
                      ? confession.text
                      : "Anonymous confession";
                  return (
                    <motion.div key={confession._id} variants={fadeUp}>
                      <div
                        onClick={() => router.push("/explore")}
                        className="cursor-pointer flex items-center gap-4 px-5 py-6 bg-white border border-black/5 rounded-2xl hover:shadow-lg hover:shadow-black/[0.03] transition-all group"
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
                          style={{
                            background: catInfo?.color ?? "#ccc",
                            boxShadow: `0 0 8px ${catInfo?.color ?? "#ccc"}40`,
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm serif text-black/60 leading-relaxed select-none mb-1.5">
                            {previewText.slice(0, 60)}
                            {previewText.length > 60 ? "..." : ""}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {catInfo && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/explore?category=${encodeURIComponent(confession.category)}`,
                                  );
                                }}
                                className="text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full hover:scale-105 active:scale-95 transition-transform"
                                style={{
                                  background: `${catInfo.color}10`,
                                  color: catInfo.color,
                                }}
                              >
                                {catInfo.label}
                              </button>
                            )}
                            {confession.cityId && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/explore?city=${encodeURIComponent(confession.cityId)}`,
                                  );
                                }}
                                className="text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-400 hover:bg-blue-100 transition-colors"
                              >
                                📍 {confession.cityId}
                              </button>
                            )}
                            {confession.professionId && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/explore?profession=${encodeURIComponent(confession.professionId)}`,
                                  );
                                }}
                                className="text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-500 hover:bg-amber-100 transition-colors"
                              >
                                💼 {confession.professionId}
                              </button>
                            )}
                            <span className="text-[9px] text-black/15 font-medium">
                              {timeAgo(confession.createdAt)}
                            </span>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold text-black/10 group-hover:text-accent uppercase tracking-widest flex-shrink-0 transition-colors">
                          Reveal →
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

              {textConfessions.length > 3 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                >
                  <Link
                    href="/explore"
                    className="flex items-center justify-center gap-2 mt-4 py-4 bg-white border border-black/5 rounded-xl text-[11px] font-bold text-black/25 hover:text-black hover:border-black/15 transition-all group"
                  >
                    <span>+{textConfessions.length - 3} more secrets</span>
                    <ArrowRight
                      size={12}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </Link>
                </motion.div>
              )}
            </div>
          </section>
        )}

        {/* ── DEEP SPILLS ── */}
        {recentSpills && recentSpills.length > 0 && (
          <section className="py-20 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex items-center justify-between mb-8"
              >
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-accent mb-1">
                    Stories
                  </p>
                  <h2 className="text-2xl font-black serif">Deep Spills</h2>
                </div>
                <Link
                  href="/explore"
                  className="text-[9px] font-bold text-black/20 uppercase tracking-widest hover:text-black transition-colors"
                >
                  View all →
                </Link>
              </motion.div>

              <motion.div
                variants={stagger}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              >
                {recentSpills.slice(0, 3).map((spill, i) => (
                  <DeepSpillCard
                    key={spill._id}
                    spill={spill}
                    slug={(spill as any).boardSlug || "global"}
                    index={i}
                  />
                ))}
              </motion.div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════
          HOW TO USE TEAAA — Roadmap
         ══════════════════════════════════════════ */}
        <section className="py-24 px-4 sm:px-6" id="how-to-use">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-14"
            >
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-accent mb-3">
                ✦ How it works
              </p>
              <h2 className="text-3xl font-black serif tracking-tight">
                Three steps to start
              </h2>
            </motion.div>

            {/* Horizontal stepper — desktop */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="hidden md:block mb-12"
            >
              <div className="flex items-center justify-between max-w-md mx-auto mb-10">
                {[1, 2, 3].map((n, i) => (
                  <span key={n} className="contents">
                    {/* Circle */}
                    <div className="w-11 h-11 rounded-full bg-white border-2 border-black/10 flex items-center justify-center text-sm font-black serif text-black/60 shadow-sm">
                      {n}
                    </div>
                    {/* Connector line */}
                    {i < 2 && (
                      <div className="flex-1 mx-3 flex items-center">
                        <div className="flex-1 h-px bg-black/10" />
                        <ArrowRight size={12} className="text-black/15 mx-1 flex-shrink-0" />
                        <div className="flex-1 h-px bg-black/10" />
                      </div>
                    )}
                  </span>
                ))}
              </div>

              {/* Step details — 3 columns */}
              <div className="grid grid-cols-3 gap-6 text-center">
                {[
                  {
                    emoji: "🫖",
                    title: "Create a Board",
                    desc: "Pick a name and theme. Your anonymous confession page is live in seconds.",
                  },
                  {
                    emoji: "🔗",
                    title: "Share the Link",
                    desc: "Post it on Instagram Stories, WhatsApp, or Snapchat. One tap.",
                  },
                  {
                    emoji: "🔥",
                    title: "Watch It Blow Up",
                    desc: "Confessions pour in — text, voice, doodles, polls. All anonymous.",
                  },
                ].map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 + 0.2, duration: 0.5 }}
                  >
                    <span className="text-2xl block mb-3">{s.emoji}</span>
                    <h3 className="text-base font-black serif mb-1.5">{s.title}</h3>
                    <p className="text-[11px] text-black/30 leading-relaxed font-medium">
                      {s.desc}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Mobile stepper — vertical */}
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="md:hidden space-y-5 mb-10"
            >
              {[
                {
                  n: "1",
                  emoji: "🫖",
                  title: "Create a Board",
                  desc: "Pick a name and theme. Your anonymous confession page is live in seconds.",
                },
                {
                  n: "2",
                  emoji: "🔗",
                  title: "Share the Link",
                  desc: "Post it on Instagram Stories, WhatsApp, or Snapchat. One tap.",
                },
                {
                  n: "3",
                  emoji: "🔥",
                  title: "Watch It Blow Up",
                  desc: "Confessions pour in — text, voice, doodles, polls. All anonymous.",
                },
              ].map((s) => (
                <motion.div
                  key={s.n}
                  variants={fadeUp}
                  className="flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-full bg-white border-2 border-black/10 flex items-center justify-center text-sm font-black serif text-black/60 shadow-sm flex-shrink-0 mt-0.5">
                    {s.n}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{s.emoji}</span>
                      <h3 className="text-[15px] font-black serif">{s.title}</h3>
                    </div>
                    <p className="text-[11px] text-black/30 leading-relaxed font-medium">
                      {s.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <Link
                href="/create"
                className="group inline-flex items-center gap-2 px-8 py-4 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/10"
              >
                <Plus size={14} />
                <span>Create Your Board</span>
                <ArrowRight
                  size={12}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/15 mt-3">
                Free · No sign-up · Takes 30 seconds
              </p>
            </motion.div>
          </div>
        </section>

        {/* ── WHAT'S BUZZING — Dynamic context showcase ── */}
        {contextDistribution &&
          (contextDistribution.cities.length > 0 ||
            contextDistribution.professions.length > 0) && (
            <section className="py-20 px-4 sm:px-6 relative">
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-rose-50/30 to-transparent" />
              <div className="max-w-4xl mx-auto relative">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-12"
                >
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-black/5 text-[9px] font-bold uppercase tracking-[0.2em] mb-5 text-black/40 shadow-sm">
                    <TrendingUp size={10} className="text-accent" />
                    Live from the community
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black serif tracking-tight mb-3">
                    What&apos;s{" "}
                    <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-violet-500 bg-clip-text text-transparent">
                      buzzing
                    </span>
                  </h2>
                  <p className="text-xs text-black/30 max-w-md mx-auto leading-relaxed">
                    Discover confessions from real cities, professions, and vibes.
                    Filter the global feed by what matters to you.
                  </p>
                </motion.div>

                {/* City cards */}
                {contextDistribution.cities.length > 0 && (
                  <motion.div
                    variants={stagger}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    className="mb-8"
                  >
                    <div className="flex items-center gap-2 mb-4 px-1">
                      <MapPin size={14} className="text-blue-400" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30">
                        Trending Cities
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {contextDistribution.cities.slice(0, 8).map((city, i) => (
                        <motion.div key={city.key} variants={fadeUp}>
                          <Link
                            href={`/explore?city=${encodeURIComponent(city.key)}`}
                            className="group block bg-white/70 backdrop-blur-sm border border-black/5 rounded-2xl p-5 hover:shadow-xl hover:shadow-blue-500/[0.06] hover:border-blue-200/40 hover:-translate-y-1 transition-all duration-500 relative overflow-hidden"
                          >
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-50/60 to-transparent rounded-bl-[60px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <span className="text-xl block mb-2">📍</span>
                            <h3 className="text-sm font-black serif tracking-tight text-black/80 group-hover:text-black transition-colors mb-1">
                              {city.key}
                            </h3>
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-bold text-blue-400/70 uppercase tracking-wider">
                                {city.count} {city.count === 1 ? "tea" : "teas"}
                              </span>
                              <ArrowRight
                                size={12}
                                className="text-black/10 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all"
                              />
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Profession + Context chips */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {contextDistribution.professions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="bg-white border border-black/5 rounded-2xl p-6"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                          <Briefcase size={18} className="text-amber-500" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black serif">
                            By Profession
                          </h3>
                          <p className="text-[9px] text-black/25 font-medium">
                            Who&apos;s spilling the most tea?
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {contextDistribution.professions.slice(0, 6).map((p) => (
                          <Link
                            key={p.key}
                            href={`/explore?profession=${encodeURIComponent(p.key)}`}
                            className="group inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50/50 border border-amber-100/50 hover:border-amber-200 hover:bg-amber-50 transition-all text-[10px] font-bold uppercase tracking-wider text-amber-700/60 hover:text-amber-700"
                          >
                            💼 {p.key}
                            <span className="text-[8px] text-amber-400 font-black">
                              {p.count}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {contextDistribution.contexts.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 }}
                      className="bg-white border border-black/5 rounded-2xl p-6"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                          <Heart size={18} className="text-purple-500" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black serif">The Vibe</h3>
                          <p className="text-[9px] text-black/25 font-medium">
                            What people are feeling right now
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {contextDistribution.contexts.slice(0, 6).map((c) => (
                          <Link
                            key={c.key}
                            href={`/explore?context=${encodeURIComponent(c.key)}`}
                            className="group inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50/50 border border-purple-100/50 hover:border-purple-200 hover:bg-purple-50 transition-all text-[10px] font-bold uppercase tracking-wider text-purple-700/60 hover:text-purple-700"
                          >
                            🫂 {c.key}
                            <span className="text-[8px] text-purple-400 font-black">
                              {c.count}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mt-10"
                >
                  <Link
                    href="/explore"
                    className="group inline-flex items-center gap-2 px-6 py-3 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/10 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-amber-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <TrendingUp size={14} className="relative z-10" />
                    <span className="relative z-10">Explore All Filters</span>
                    <ArrowRight
                      size={12}
                      className="relative z-10 group-hover:translate-x-1 transition-transform"
                    />
                  </Link>
                </motion.div>
              </div>
            </section>
          )}

        {/* ══════════════════════════════════════════
          VOICE CONFESSIONS — immersive showcase
         ══════════════════════════════════════════ */}
        <section className="py-24 px-4 sm:px-6 relative">
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-black/[0.008] to-transparent" />

          <div className="max-w-4xl mx-auto relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-14"
            >
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: 60 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="h-px bg-accent mx-auto mb-4"
              />
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-accent mb-3">
                ✦ New Feature
              </p>
              <h2 className="text-4xl md:text-5xl font-black serif tracking-tight mb-4">
                Your voice.{" "}
                <span className="bg-gradient-to-r from-rose-500 to-violet-500 bg-clip-text text-transparent">
                  Anonymous.
                </span>
              </h2>
              <p className="text-sm text-black/35 max-w-lg mx-auto leading-relaxed">
                30 seconds. No names. Just the raw truth in your own voice.
                Record, listen, react, reply.
              </p>
            </motion.div>

            {/* Bento grid */}
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-10"
            >
              {/* Big card — Record */}
              <motion.div
                variants={scaleIn}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="md:col-span-7 bg-white border border-black/5 rounded-[1.5rem] p-8 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-rose-100/40 to-transparent rounded-bl-[100px] pointer-events-none" />
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-5">
                    <Mic size={24} className="text-rose-500" />
                  </div>
                  <h3 className="text-xl font-black serif mb-2">
                    Record a Confession
                  </h3>
                  <p className="text-xs text-black/35 leading-relaxed max-w-sm mb-6">
                    Hit record, speak your truth for up to 30 seconds. Choose a
                    mood, give it a title, and drop it into the void.
                  </p>

                  {/* Mini waveform */}
                  <div className="flex items-end gap-[3px] h-10">
                    {Array(28)
                      .fill(0)
                      .map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-[3px] rounded-full bg-rose-400/60"
                          animate={{
                            height: [
                              `${8 + Math.sin(i * 0.5) * 5}px`,
                              `${20 + Math.cos(i * 0.7) * 14}px`,
                              `${8 + Math.sin(i * 0.5) * 5}px`,
                            ],
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 1.3 + i * 0.03,
                            ease: "easeInOut",
                            delay: i * 0.015,
                          }}
                        />
                      ))}
                  </div>
                </div>
              </motion.div>

              {/* Right column */}
              <div className="md:col-span-5 flex flex-col gap-3">
                {/* Listen */}
                <motion.div
                  variants={scaleIn}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className="bg-white border border-black/5 rounded-[1.5rem] p-6 flex-1 relative overflow-hidden"
                >
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-violet-50/50 to-transparent rounded-tr-[80px] pointer-events-none" />
                  <div className="relative z-10">
                    <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center mb-3">
                      <Headphones size={20} className="text-violet-500" />
                    </div>
                    <h3 className="text-base font-black serif mb-1">
                      Listen & Feel
                    </h3>
                    <p className="text-[11px] text-black/30 leading-relaxed">
                      Animated waveform player. Hear real voices. React with
                      emotions.
                    </p>
                  </div>
                </motion.div>

                {/* Reply */}
                <motion.div
                  variants={scaleIn}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className="bg-white border border-black/5 rounded-[1.5rem] p-6 flex-1 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-amber-50/50 to-transparent rounded-bl-[80px] pointer-events-none" />
                  <div className="relative z-10">
                    <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
                      <MessageCircle size={20} className="text-amber-500" />
                    </div>
                    <h3 className="text-base font-black serif mb-1">
                      Reply Anonymously
                    </h3>
                    <p className="text-[11px] text-black/30 leading-relaxed">
                      Text or GIF replies. Build anonymous conversation threads.
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Bottom row — smaller feature pills */}
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10"
            >
              {[
                {
                  icon: <Shield size={16} />,
                  label: "100% Anonymous",
                  color: "#22c55e",
                },
                {
                  icon: <Zap size={16} />,
                  label: "No Sign Up",
                  color: "#f59e0b",
                },
                {
                  icon: <Eye size={16} />,
                  label: "View Tracking",
                  color: "#6366f1",
                },
                {
                  icon: <Flame size={16} />,
                  label: "Reactions",
                  color: "#ef4444",
                },
              ].map((f) => (
                <motion.div
                  key={f.label}
                  variants={fadeUp}
                  className="bg-white/70 backdrop-blur-sm border border-black/5 rounded-xl px-4 py-3 flex items-center gap-3"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${f.color}10`, color: f.color }}
                  >
                    {f.icon}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-black/45">
                    {f.label}
                  </span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <Link
                href="/explore/voice"
                className="group inline-flex items-center gap-2.5 px-8 py-4 bg-black text-white text-[11px] font-bold uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/15 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 via-violet-500/20 to-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Headphones size={16} className="relative z-10" />
                <span className="relative z-10">
                  {voiceFeed && voiceFeed.length > 0
                    ? `Listen to ${voiceFeed.length} Confessions`
                    : "Explore Voice Confessions"}
                </span>
                <ArrowRight
                  size={14}
                  className="relative z-10 group-hover:translate-x-1 transition-transform"
                />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
          ANONYMOUS POLLS — New Feature Showcase
         ══════════════════════════════════════════ */}
        <section className="py-24 px-4 sm:px-6 relative">
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-purple-50/30 to-transparent" />

          <div className="max-w-4xl mx-auto relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-14"
            >
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: 60 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="h-px bg-purple-400 mx-auto mb-4"
              />
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-purple-500 mb-3">
                ✦ New Feature
              </p>
              <h2 className="text-4xl md:text-5xl font-black serif tracking-tight mb-4">
                Anonymous{" "}
                <span className="bg-gradient-to-r from-purple-600 to-violet-500 bg-clip-text text-transparent">
                  Polls.
                </span>
              </h2>
              <p className="text-sm text-black/35 max-w-lg mx-auto leading-relaxed">
                Create polls on your board. Your audience votes anonymously. Watch
                results flow in real-time. Download results with watermark.
              </p>
            </motion.div>

            {/* Bento grid */}
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-10"
            >
              {/* Big card — Create Poll */}
              <motion.div
                variants={scaleIn}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="md:col-span-7 bg-white border border-black/5 rounded-[1.5rem] p-8 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-purple-100/40 to-transparent rounded-bl-[100px] pointer-events-none" />
                <div className="relative z-10">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                    style={{
                      background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                    }}
                  >
                    <BarChart3 size={24} className="text-white" />
                  </div>
                  <h3 className="text-xl font-black serif mb-2">Create Polls</h3>
                  <p className="text-xs text-black/35 leading-relaxed max-w-sm mb-6">
                    Ask your audience anything — add 2-5 options, attach a context
                    image, set a timer. One active poll per board.
                  </p>

                  {/* Mini poll preview */}
                  <div className="bg-[#faf8f5] rounded-xl border border-black/5 p-4 max-w-xs">
                    <p className="text-xs font-bold text-black/60 mb-3 serif">
                      &quot;Who&apos;s the real GOAT?&quot;
                    </p>
                    <div className="space-y-2">
                      {[
                        { label: "Option A", pct: 45 },
                        { label: "Option B", pct: 32 },
                        { label: "Option C", pct: 23 },
                      ].map((opt, i) => (
                        <div
                          key={i}
                          className="relative h-8 bg-black/[0.02] rounded-lg overflow-hidden"
                        >
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${opt.pct}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.3 + i * 0.15 }}
                            className="absolute inset-y-0 left-0 rounded-lg"
                            style={{
                              background: `rgba(124, 58, 237, ${0.15 - i * 0.03})`,
                            }}
                          />
                          <div className="relative flex items-center justify-between px-3 h-full">
                            <span className="text-[10px] font-semibold text-black/50">
                              {opt.label}
                            </span>
                            <span className="text-[10px] font-black text-black/30">
                              {opt.pct}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[8px] font-bold text-black/20">
                        47 votes · anonymous
                      </span>
                      <span className="text-[8px] font-bold text-purple-400">
                        🟢 Live
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Right column */}
              <div className="md:col-span-5 flex flex-col gap-3">
                {/* Real-time */}
                <motion.div
                  variants={scaleIn}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className="bg-white border border-black/5 rounded-[1.5rem] p-6 flex-1 relative overflow-hidden"
                >
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-50/50 to-transparent rounded-tr-[80px] pointer-events-none" />
                  <div className="relative z-10">
                    <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center mb-3">
                      <Users size={20} className="text-purple-500" />
                    </div>
                    <h3 className="text-base font-black serif mb-1">
                      Anonymous Voting
                    </h3>
                    <p className="text-[11px] text-black/30 leading-relaxed">
                      One vote per visitor. No sign ups. Real-time results with
                      animated progress bars.
                    </p>
                  </div>
                </motion.div>

                {/* Download */}
                <motion.div
                  variants={scaleIn}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className="bg-white border border-black/5 rounded-[1.5rem] p-6 flex-1 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-indigo-50/50 to-transparent rounded-bl-[80px] pointer-events-none" />
                  <div className="relative z-10">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center mb-3">
                      <Download size={20} className="text-indigo-500" />
                    </div>
                    <h3 className="text-base font-black serif mb-1">
                      Download Results
                    </h3>
                    <p className="text-[11px] text-black/30 leading-relaxed">
                      Download poll results as PNG with teaadrop.xyz watermark.
                      Creator-only feature.
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Bottom row — poll feature pills */}
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10"
            >
              {[
                {
                  icon: <Timer size={16} />,
                  label: "Auto-Expiry Timer",
                  color: "#7c3aed",
                },
                {
                  icon: <Shield size={16} />,
                  label: "1 Vote Per Person",
                  color: "#22c55e",
                },
                {
                  icon: <ImageDown size={16} />,
                  label: "Context Images",
                  color: "#f59e0b",
                },
                {
                  icon: <Share2 size={16} />,
                  label: "Share to Vote",
                  color: "#ec4899",
                },
              ].map((f) => (
                <motion.div
                  key={f.label}
                  variants={fadeUp}
                  className="bg-white/70 backdrop-blur-sm border border-black/5 rounded-xl px-4 py-3 flex items-center gap-3"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${f.color}10`, color: f.color }}
                  >
                    {f.icon}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-black/45">
                    {f.label}
                  </span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <Link
                href="/create"
                className="group inline-flex items-center gap-2.5 px-8 py-4 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                  boxShadow: "0 12px 30px rgba(124, 58, 237, 0.25)",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                <BarChart3 size={16} className="relative z-10" />
                <span className="relative z-10">
                  Create a Board & Start Polling
                </span>
                <ArrowRight
                  size={14}
                  className="relative z-10 group-hover:translate-x-1 transition-transform"
                />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="py-24 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-14"
            >
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-accent mb-3">
                How it works
              </p>
              <h2 className="text-3xl font-black serif tracking-tight">
                Six ways to spill
              </h2>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {[
                {
                  n: "01",
                  icon: "✍️",
                  title: "Write",
                  desc: "Type your confession. Pick a mood. Drop it anonymously into the void.",
                  gradient: "from-blue-50 to-white",
                },
                {
                  n: "02",
                  icon: "🎙️",
                  title: "Speak",
                  desc: "Record a 30-second voice confession. Your voice, zero identity.",
                  gradient: "from-rose-50 to-white",
                },
                {
                  n: "03",
                  icon: "🎨",
                  title: "Doodle",
                  desc: "Draw a sketch, doodle your feelings, and share it as an artistic canvas card.",
                  gradient: "from-emerald-50 to-white",
                },
                {
                  n: "04",
                  icon: "📖",
                  title: "Spill",
                  desc: "Full-length anonymous stories with chapters and AI cover art.",
                  gradient: "from-amber-50 to-white",
                },
                {
                  n: "05",
                  icon: "💝",
                  title: "Admirer",
                  desc: "Read secret anonymous love letters while listening to immersive background music and deep ambient audios.",
                  gradient: "from-pink-50 to-white",
                },
                {
                  n: "06",
                  icon: "🗳️",
                  title: "Poll",
                  desc: "Create anonymous polls with optional images. Real-time results, auto-expiry timers, and downloadable result cards.",
                  gradient: "from-purple-50 to-white",
                },
              ].map((s) => (
                <motion.div
                  key={s.n}
                  variants={fadeUp}
                  whileHover={{ y: -6, transition: { duration: 0.25 } }}
                  className={`bg-gradient-to-b ${s.gradient} border border-black/5 rounded-2xl p-7 text-center hover:shadow-lg hover:shadow-black/[0.03] transition-shadow relative overflow-hidden`}
                >
                  {/* Step number watermark */}
                  <span className="absolute top-3 right-4 text-6xl font-black serif text-black/[0.03]">
                    {s.n}
                  </span>
                  <span className="text-3xl block mb-4">{s.icon}</span>
                  <h3 className="text-lg font-black serif mb-2">{s.title}</h3>
                  <p className="text-[11px] text-black/35 leading-relaxed font-medium">
                    {s.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── POWER FEATURES ── */}
        <section className="py-24 px-4 sm:px-6 relative bg-white border-y border-black/5">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22 viewBox=%220 0 80 80%22%3E%3Cpath fill=%22%23000%22 fill-opacity=%220.8%22 d=%22M0 0h1v1H0zM40 40h1v1h-1zM79 79h1v1h-1zM20 60h1v1h-1zM60 20h1v1h-1z%22/%3E%3C/svg%3E')]" />

          <div className="max-w-4xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-14"
            >
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-accent mb-3">
                ✦ Powerful Extras
              </p>
              <h2 className="text-3xl md:text-4xl font-black serif tracking-tight">
                More than just a wall
              </h2>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              {/* Inbox */}
              <motion.div
                variants={fadeUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-[#faf8f5] border border-black/5 rounded-[1.5rem] p-8 text-left hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:border-black/10 transition-all group flex flex-col items-start"
              >
                <div className="w-14 h-14 rounded-[16px] bg-blue-100 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Inbox size={26} className="text-blue-500" />
                </div>
                <h3 className="text-xl font-black serif mb-2">Live Inbox</h3>
                <p className="text-[11px] text-black/40 leading-relaxed font-medium">
                  Track real-time reactions, incoming replies, and pings for every
                  confession or voice drop you publish.
                </p>
              </motion.div>

              {/* Summarizer */}
              <motion.div
                variants={fadeUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-[#faf8f5] border border-black/5 rounded-[1.5rem] p-8 text-left hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:border-black/10 transition-all group flex flex-col items-start"
              >
                <div className="w-14 h-14 rounded-[16px] bg-purple-100 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Wand2 size={26} className="text-purple-500" />
                </div>
                <h3 className="text-xl font-black serif mb-2">AI Summarizer</h3>
                <p className="text-[11px] text-black/40 leading-relaxed font-medium">
                  Generate instant thematic vibes and automated TLDRs for massive
                  boards. Read the room instantly.
                </p>
              </motion.div>

              {/* Downloadable Cards */}
              <motion.div
                variants={fadeUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-[#faf8f5] border border-black/5 rounded-[1.5rem] p-8 text-left hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:border-black/10 transition-all group flex flex-col items-start"
              >
                <div className="w-14 h-14 rounded-[16px] bg-orange-100 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <ImageDown size={26} className="text-orange-500" />
                </div>
                <h3 className="text-xl font-black serif mb-2">
                  Download & Share Cards
                </h3>
                <p className="text-[11px] text-black/40 leading-relaxed font-medium">
                  Turn any confession into a stunning, branded polaroid card.
                  Download as an image or share directly to Instagram Stories,
                  WhatsApp, Snapchat & more — one tap.
                </p>
              </motion.div>

              {/* Ambient Sounds */}
              <motion.div
                variants={fadeUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-[#faf8f5] border border-black/5 rounded-[1.5rem] p-8 text-left hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:border-black/10 transition-all group flex flex-col items-start"
              >
                <div className="w-14 h-14 rounded-[16px] bg-emerald-100 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Volume2 size={26} className="text-emerald-500" />
                </div>
                <h3 className="text-xl font-black serif mb-2">Ambient Audios</h3>
                <p className="text-[11px] text-black/40 leading-relaxed font-medium">
                  Enhance your reading experience with 18 dynamic background
                  soundscapes. Perfect for listening to relaxing music while
                  reading secret admirer confessions.
                </p>
              </motion.div>

              {/* Anonymous Polls */}
              <motion.div
                variants={fadeUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="md:col-span-2 border border-black/5 rounded-[1.5rem] p-8 text-left hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:border-purple-200/40 transition-all group flex flex-col items-start relative overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, #faf8ff, #f5f0ff, #faf8f5)",
                }}
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-purple-100/50 to-transparent rounded-bl-[120px] pointer-events-none" />
                <div className="relative z-10 w-full">
                  <div className="flex items-start justify-between">
                    <div>
                      <div
                        className="w-14 h-14 rounded-[16px] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"
                        style={{
                          background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                        }}
                      >
                        <BarChart3 size={26} className="text-white" />
                      </div>
                      <h3 className="text-xl font-black serif mb-2">
                        Anonymous Polls
                      </h3>
                      <p className="text-[11px] text-black/40 leading-relaxed font-medium max-w-sm">
                        Create polls on any board — 2-5 options, optional image
                        context, auto-expiry timers. One vote per visitor,
                        real-time animated results, and downloadable result cards
                        with teaadrop.xyz watermark.
                      </p>
                    </div>
                    <div
                      className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest"
                      style={{
                        background: "rgba(124, 58, 237, 0.08)",
                        color: "#7c3aed",
                      }}
                    >
                      ✨ New
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>


        {/* ── FAQ ── */}
        <section className="py-20 px-4 sm:px-6 bg-[#faf8f5]">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-accent mb-3">
                Clear the air
              </p>
              <h2 className="text-3xl font-black serif tracking-tight">
                Frequently Asked Questions
              </h2>
            </motion.div>

            <div className="space-y-4">
              {[
                {
                  q: "Is it really 100% anonymous?",
                  a: "Yes. We don't ask for your name, email, or phone number. There are no accounts to create. Your fingerprint is just a local anonymous session string to track your own reactions and prevent spam.",
                },
                {
                  q: "What is 'Disappearing Tea'?",
                  a: "When you write a text or doodle confession, you can choose to make it self-destruct after 5 minutes, 24 hours, or even after exactly 25 views. Once it's gone, it's purged completely.",
                },
                {
                  q: "How does Voice Confession work?",
                  a: "You can record up to 30 seconds of audio right from your browser. The audio is uploaded without any metadata attached to you.",
                },
                {
                  q: "What if someone says something awful?",
                  a: "Teaaa uses AI to moderate toxic, hateful, and violently explicit text before it even publishes to the board. Board creators can also set custom banned words for their specific communities.",
                },
                {
                  q: "Can I create my own anonymous confession board?",
                  a: "Absolutely. Anyone can create their own custom board on Teaaa. Whether it's for your high school, a specific fandom, your university, or just your close friend group, you can instantly set up a safe, moderated space for anonymous gossip, secrets, and voice drops.",
                },
                {
                  q: "What makes Teaaa different from other anonymous apps?",
                  a: "Unlike older anonymous social networks, Teaaa focuses heavily on aesthetic, ambient design and mental well-being. We feature Deep Spills for long-form anonymous journaling, interactive Doodle canvases for artistic expression, and purely chronological feeds without highly-addictive engagement algorithms.",
                },
                {
                  q: "How to send an anonymous Secret Admirer message?",
                  a: "Simply use our Secret Admirer feature to send a beautifully animated digital envelope. It's completely untraceable, and viewers can interact with it on memory corkboards using our unique physics-based interactive canvas.",
                },
              ].map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm shadow-black/[0.01]"
                >
                  <h3 className="font-black serif text-lg mb-2">{faq.q}</h3>
                  <p className="text-[12px] text-black/60 leading-relaxed font-medium">
                    {faq.a}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── THE TEAAA STANDARD (ELEGANT COMPARISON) ── */}
        <section className="py-32 px-4 sm:px-6 bg-[#faf8f5] relative overflow-hidden border-y border-black/5">
          <div className="absolute top-0 right-[-10%] w-[500px] h-[500px] bg-rose-100/30 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-indigo-100/20 blur-[100px] rounded-full pointer-events-none" />

          <div className="max-w-4xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-black/5 text-[9px] font-bold uppercase tracking-[0.2em] mb-6 text-black/40 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Our
                Philosophy
              </span>
              <h2 className="text-3xl md:text-5xl font-black serif tracking-tight leading-tight text-[#2a2a2a]">
                A quieter, safer space. <br />
                <span className="text-black/30">Just human connection.</span>
              </h2>
            </motion.div>

            <div className="space-y-6">
              {[
                {
                  title: "Identity & Presence",
                  old: "Public profiles, follower counts, and constant pressure to perform.",
                  new: "Zero trace. No accounts. 100% anonymous freedom.",
                  icon: "🎭",
                },
                {
                  title: "Memory & Permanence",
                  old: "An unerasable digital footprint stored forever on servers.",
                  new: "Disappearing tea. You fully control when your truth vanishes.",
                  icon: "⏳",
                },
                {
                  title: "Discovery & Reach",
                  old: "Engagement algorithms pushing outrage and endless echo chambers.",
                  new: "Purely chronological feeds. Raw, unfiltered, and honest.",
                  icon: "🌊",
                },
                {
                  title: "Community & Safety",
                  old: "Toxic comment sections and endless, stressful arguing.",
                  new: "AI Moderation + Verified creator replies seamlessly guiding the space.",
                  icon: "🛡️",
                },
                {
                  title: "Expression & Medium",
                  old: "Rigid text boxes limited by character counts and pre-defined formats.",
                  new: "Voice drops, sprawling 'deep spills', and freehand doodle canvases.",
                  icon: "🎨",
                },
                {
                  title: "Intentionality",
                  old: "Infinite doomscrolling engineered to hijack your dopamine.",
                  new: "Thoughtful collections designed to be enjoyed and gracefully left.",
                  icon: "🍃",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{
                    delay: i * 0.1,
                    duration: 0.7,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="group relative bg-[#ffffff]/40 backdrop-blur-[40px] rounded-[2.5rem] p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-10 items-start md:items-center overflow-hidden border border-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.02),inset_0_1px_1px_rgba(255,255,255,0.9)] hover:bg-[#ffffff]/60 hover:shadow-[0_20px_40px_rgb(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,1)] hover:-translate-y-1 transition-all duration-700"
                >
                  {/* Floating huge watermark icon */}
                  <div className="absolute -right-6 -bottom-6 text-9xl opacity-[0.02] group-hover:opacity-[0.05] group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700 pointer-events-none blur-[2px]">
                    {item.icon}
                  </div>

                  {/* Subtle animated gradient background on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-rose-500/[0.015] via-transparent to-emerald-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                  <div className="w-16 h-16 rounded-[1.25rem] bg-white border border-black/[0.04] flex items-center justify-center text-3xl z-10 group-hover:scale-[1.15] group-hover:rotate-[-5deg] transition-all duration-700 flex-shrink-0 relative shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
                    {item.icon}
                  </div>

                  <div className="flex-1 w-full z-10 flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10 relative">
                    {/* The Old (Norm) */}
                    <div className="flex-1 w-full text-left md:pr-4 relative">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-red-400 group-hover:text-red-500 transition-colors duration-500">
                          The Norm
                        </span>
                      </div>
                      <p className="text-xs md:text-sm text-black/40 font-medium leading-relaxed group-hover:opacity-50 transition-opacity duration-500">
                        {item.old}
                      </p>
                    </div>

                    {/* Animated Divider */}
                    <div className="hidden md:flex flex-col items-center justify-center w-8 h-full relative z-10">
                      <div className="w-[1px] h-20 bg-black/[0.04] relative overflow-hidden rounded-full mix-blend-multiply">
                        <div className="absolute top-0 left-0 w-full h-[30%] bg-gradient-to-b from-transparent via-red-400 to-transparent group-hover:via-accent -translate-y-full group-hover:animate-[ping_2s_infinite] opacity-0 group-hover:opacity-100 transition-all duration-700" />
                      </div>
                      {/* Floating VS */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#faf8f5]/80 backdrop-blur-sm border border-black/[0.05] flex items-center justify-center text-[8px] font-black uppercase tracking-widest text-black/30 group-hover:bg-accent group-hover:text-white group-hover:border-accent transition-colors duration-700 shadow-sm z-20">
                        vs
                      </div>
                    </div>

                    {/* The New (Teaaa Way) */}
                    <div className="flex-1 w-full text-left md:pl-2 relative">
                      <div className="flex items-center gap-2 mb-2 relative">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500">
                          The Teaaa Way
                        </span>
                      </div>
                      <p className="text-sm md:text-[15px] font-bold text-[#2a2a2a] leading-relaxed group-hover:text-black transition-colors duration-500 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
                        {item.new}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex justify-end mt-10"
            >
              <Link
                href="/explore"
                className="group flex items-center gap-2 text-[10px] font-bold text-black/30 uppercase tracking-[0.2em] hover:text-accent transition-colors"
              >
                <span className="relative">
                  View all features
                  <span className="absolute left-0 bottom-[-4px] w-full h-[1.5px] bg-accent origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 rounded-full" />
                </span>
                <ArrowRight
                  size={14}
                  className="group-hover:translate-x-1.5 transition-transform duration-500"
                />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ── THE APP EXPERIENCE (PWA SECTION) ── */}
        <section className="py-24 px-4 sm:px-6 relative bg-[#faf8f5] border-t border-black/5 overflow-hidden">
          <div className="absolute top-0 left-[20%] w-96 h-96 bg-blue-100/40 rounded-full blur-[140px] pointer-events-none" />

          <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-12 md:gap-20">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1"
            >
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-blue-500 mb-3">
                ✦ App Experience
              </p>
              <h2 className="text-3xl md:text-5xl font-black serif tracking-tight mb-5 leading-tight text-[#2a2a2a]">
                Install Teaaa. <br />
                <span className="text-black/30">No App Store required.</span>
              </h2>
              <p className="text-sm md:text-base text-black/50 leading-relaxed font-medium mb-8">
                Get the full native app experience instantly. Install Teaaa
                directly to your home screen for full-screen mode, faster loading,
                and a seamless mobile experience. It takes zero storage and runs
                securely.
              </p>

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-200 shadow-sm">
                    <FaApple size={18} className="mb-[2px]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-[#2a2a2a]">
                      iOS (Safari)
                    </h4>
                    <p className="text-[10px] text-black/50 font-medium mt-0.5">
                      Tap 'Share'{" "}
                      <span className="font-serif italic mx-1">→</span> 'Add to
                      Home Screen'
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-50/80 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100 shadow-sm">
                    <FaAndroid size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-[#2a2a2a]">
                      Android (Chrome)
                    </h4>
                    <p className="text-[10px] text-black/50 font-medium mt-0.5">
                      Tap menu (⋮){" "}
                      <span className="font-serif italic mx-1">→</span> 'Install
                      app'
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10">
                <PwaInstallButton />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex-1 relative w-full flex justify-center perspective-[1000px]"
            >
              {/* Beautiful visual representation of a phone screen containing teaaa */}
              <div className="w-[280px] h-[580px] bg-[#111] rounded-[3rem] p-2 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] relative z-10 border-4 border-black/80 ring-1 ring-white/10 transform-gpu rotate-y-[-10deg] rotate-x-[5deg] hover:rotate-y-[0deg] hover:rotate-x-[0deg] transition-transform duration-700">
                {/* Phone notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#111] rounded-b-3xl z-20" />
                <div className="w-full h-full bg-[#faf8f5] rounded-[2.5rem] overflow-hidden relative border border-white/50">
                  {/* App icon on home screen */}
                  <div className="absolute inset-0 bg-[#f0ede8] px-4 py-6 flex flex-col pt-14">
                    <div className="text-center mb-6 opacity-60">
                      <div className="text-[10px] font-black tracking-[0.2em] font-sans uppercase">
                        9:41 AM
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-y-5 gap-x-2 w-full place-items-center">
                      <div className="flex flex-col items-center gap-[5px] w-full">
                        <div className="w-[46px] h-[46px] rounded-[14px] bg-gradient-to-tr from-rose-500 via-pink-400 to-amber-300 shadow-[0_6px_12px_rgba(244,63,94,0.3)] flex items-center justify-center text-[22px] border border-white/20 text-white">
                          🫖
                        </div>
                        <span className="text-[9px] font-bold text-black/80 font-sans tracking-tight">
                          teaaa
                        </span>
                      </div>
                      <div className="flex flex-col items-center gap-[5px] w-full">
                        <div className="w-[46px] h-[46px] rounded-[14px] bg-blue-400 shadow-sm flex items-center justify-center text-[22px] text-white">
                          🌤️
                        </div>
                        <span className="text-[9px] font-medium text-black/50 font-sans tracking-tight">
                          Weather
                        </span>
                      </div>
                      <div className="flex flex-col items-center gap-[5px] w-full">
                        <div className="w-[46px] h-[46px] rounded-[14px] bg-white shadow-sm flex items-center justify-center border border-black/5 text-[22px]">
                          🖼️
                        </div>
                        <span className="text-[9px] font-medium text-black/50 font-sans tracking-tight">
                          Photos
                        </span>
                      </div>
                      <div className="flex flex-col items-center gap-[5px] w-full">
                        <div className="w-[46px] h-[46px] rounded-[14px] bg-[#d1d5db] shadow-sm flex items-center justify-center border border-black/5 text-[22px]">
                          📷
                        </div>
                        <span className="text-[9px] font-medium text-black/50 font-sans tracking-tight">
                          Camera
                        </span>
                      </div>

                      <div className="flex flex-col items-center gap-[5px] w-full">
                        <div className="w-[46px] h-[46px] rounded-[14px] bg-[#fef08a] shadow-sm flex items-center justify-center border border-black/5 text-[22px]">
                          📝
                        </div>
                        <span className="text-[9px] font-medium text-black/50 font-sans tracking-tight">
                          Notes
                        </span>
                      </div>
                      <div className="flex flex-col items-center gap-[5px] w-full">
                        <div className="w-[46px] h-[46px] rounded-[14px] bg-[#bbf7d0] shadow-sm flex items-center justify-center border border-black/5 text-[22px]">
                          🗺️
                        </div>
                        <span className="text-[9px] font-medium text-black/50 font-sans tracking-tight">
                          Maps
                        </span>
                      </div>
                      <div className="flex flex-col items-center gap-[5px] w-full">
                        <div className="w-[46px] h-[46px] rounded-[14px] bg-purple-400 shadow-sm flex items-center justify-center text-[22px] text-white">
                          🎙️
                        </div>
                        <span className="text-[9px] font-medium text-black/50 font-sans tracking-tight">
                          Podcasts
                        </span>
                      </div>
                    </div>

                    {/* Bottom dock indicator */}
                    <div className="mt-auto mx-auto px-2 py-2 rounded-[22px] bg-white/40 border border-white/60 backdrop-blur-md flex items-center justify-center gap-[10px] mb-2 shadow-lg shadow-black/[0.03]">
                      <div className="w-[46px] h-[46px] rounded-[14px] bg-green-400 shadow-sm flex items-center justify-center text-[22px]">
                        📞
                      </div>
                      <div className="w-[46px] h-[46px] rounded-[14px] bg-blue-500 shadow-sm flex items-center justify-center text-[22px]">
                        💬
                      </div>
                      <div className="w-[46px] h-[46px] rounded-[14px] bg-gray-100 shadow-sm flex items-center justify-center text-[22px]">
                        🌐
                      </div>
                      <div className="w-[46px] h-[46px] rounded-[14px] bg-rose-500 shadow-sm flex items-center justify-center text-[22px]">
                        🎵
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="py-28 px-4 sm:px-6 relative">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute bottom-0 left-[20%] w-80 h-80 bg-rose-100/15 rounded-full blur-[140px]" />
            <div className="absolute top-0 right-[15%] w-64 h-64 bg-amber-100/10 rounded-full blur-[120px]" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-lg mx-auto text-center relative z-10"
          >
            <div className="bg-white/80 backdrop-blur-xl border border-black/5 rounded-[1.75rem] p-12 shadow-xl shadow-black/[0.03]">
              <motion.div
                animate={{ rotate: [0, 12, -8, 0], y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="text-5xl mb-5 inline-block"
              >
                🫖
              </motion.div>
              <h2 className="text-3xl font-black serif tracking-tight mb-3">
                Ready to spill?
              </h2>
              <p className="text-xs text-black/30 font-medium mb-8 max-w-xs mx-auto leading-relaxed">
                Create a board, record a voice confession, write a Deep Spill, or
                just confess anonymously right now.
              </p>
              <div className="flex flex-col gap-2.5">
                <Link
                  href="/create"
                  className="group relative w-full py-4 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-black/10 flex items-center justify-center gap-2 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                  <Plus size={14} className="relative z-10" />
                  <span className="relative z-10">Start My Board</span>
                </Link>
                <div className="grid grid-cols-2 gap-2.5">
                  <Link
                    href="/explore/voice"
                    className="py-3.5 border border-black/8 text-[10px] text-black/40 font-bold uppercase tracking-widest rounded-xl hover:text-black hover:border-black/15 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Mic size={12} /> Voice
                  </Link>
                  <Link
                    href="/spill/create"
                    className="py-3.5 border border-black/8 text-[10px] text-black/40 font-bold uppercase tracking-widest rounded-xl hover:text-black hover:border-black/15 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Flame size={12} /> Spill
                  </Link>
                </div>
                <Link
                  href="/confess"
                  className="w-full py-3.5 text-[10px] text-black/25 font-bold uppercase tracking-widest hover:text-black transition-colors"
                >
                  or just confess →
                </Link>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── SEO BOTTOM TEXT ── */}
        <section className="py-16 px-4 sm:px-6 bg-[#faf8f5]">
          <div className="max-w-4xl mx-auto border-t border-black/5 pt-12">
            {/* Main heading for SEO */}
            <h2 className="text-center text-lg font-black serif text-black/20 mb-8">
              The Best Anonymous Confession Platform — NGL Alternative
            </h2>

            <div className="space-y-5 text-[10px] text-black/30 leading-loose font-medium max-w-2xl mx-auto">
              {/* Paragraph 1: NGL/competitor positioning */}
              <p>
                Looking for the{" "}
                <strong className="font-bold text-black/40">
                  best NGL alternative
                </strong>
                ? Teaaa is a free, modern{" "}
                <strong className="font-bold text-black/40">
                  anonymous confession app
                </strong>{" "}
                that goes way beyond simple anonymous Q&A. Unlike NGL, Sarahah,
                LMK, or Yolo, Teaaa lets you create fully customizable{" "}
                <strong className="font-bold text-black/40">
                  anonymous confession boards
                </strong>{" "}
                with text confessions, voice drops, hand-drawn doodles, long-form
                stories, and secret admirer letters — all without any sign-up or
                login required.
              </p>

              {/* Paragraph 2: How it works / features */}
              <p>
                Want to{" "}
                <strong className="font-bold text-black/40">
                  send an anonymous message
                </strong>{" "}
                to someone? Just create your personal{" "}
                <strong className="font-bold text-black/40">
                  confession page
                </strong>
                , share the link on Instagram, Snapchat, WhatsApp, or any social
                media, and let people{" "}
                <strong className="font-bold text-black/40">
                  confess anonymously
                </strong>
                . Every message is 100% untraceable. Teaaa is the perfect{" "}
                <strong className="font-bold text-black/40">
                  anonymous message link for Instagram
                </strong>{" "}
                stories — just paste your board URL and watch the confessions pour
                in. No accounts. No data collection. No IP tracking.
              </p>

              {/* Paragraph 3: Voice & unique features */}
              <p>
                What makes Teaaa the best{" "}
                <strong className="font-bold text-black/40">
                  confession website like NGL
                </strong>
                ? We offer features no other anonymous app has:{" "}
                <strong className="font-bold text-black/40">
                  anonymous voice confessions
                </strong>{" "}
                (record up to 30 seconds of audio anonymously),{" "}
                <strong className="font-bold text-black/40">
                  doodle confessions
                </strong>{" "}
                (draw and sketch your feelings on a digital canvas),{" "}
                <strong className="font-bold text-black/40">Deep Spills</strong>{" "}
                (long-form anonymous stories with AI-generated cover art), and{" "}
                <strong className="font-bold text-black/40">
                  secret admirer messages
                </strong>{" "}
                with immersive ambient music. Plus, our disappearing tea feature
                lets confessions self-destruct after a set time or view count.
              </p>

              {/* Paragraph 4: Community / use cases */}
              <p>
                Build your own{" "}
                <strong className="font-bold text-black/40">
                  anonymous confession board for college
                </strong>
                , school, university, friend group, or any online community. Teaaa
                is trusted as the go-to{" "}
                <strong className="font-bold text-black/40">
                  online confession box
                </strong>{" "}
                and{" "}
                <strong className="font-bold text-black/40">
                  anonymous gossip app
                </strong>{" "}
                by thousands of users. With built-in AI moderation,
                creator-verified replies, downloadable confession cards, and live
                inbox notifications — Teaaa is the most feature-rich{" "}
                <strong className="font-bold text-black/40">
                  free anonymous messaging app
                </strong>{" "}
                available today. Whether you want to{" "}
                <strong className="font-bold text-black/40">
                  send secret messages online
                </strong>
                , create an{" "}
                <strong className="font-bold text-black/40">
                  ask me anything anonymous
                </strong>{" "}
                page, or just spill the tea — Teaaa is where unfiltered truth
                lives.
              </p>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="py-12 border-t border-black/10 px-4 sm:px-6 bg-white/50">
          <div className="max-w-3xl mx-auto flex flex-col items-center gap-8">
            {/* Brand + Tagline */}
            <div className="text-center">
              <span className="text-lg font-black serif block mb-1">
                🫖 teaaa
              </span>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/30">
                Anonymous. Unfiltered. Always.
              </p>
            </div>

            {/* Nav Links */}
            <div className="flex gap-5 flex-wrap justify-center">
              {[
                { href: "/explore", label: "Explore" },
                { href: "/forum", label: "Community" },
                { href: "/explore/voice", label: "Voice" },
                { href: "/confess", label: "Confess" },
                { href: "/spill/create", label: "Write Spill" },
                { href: "/create", label: "Create" },
                { href: "/about", label: "About" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-[10px] font-bold uppercase tracking-widest text-black/40 hover:text-black transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </div>

            {/* Bottom row */}
            <div className="w-full flex flex-col-reverse md:flex-row items-center justify-between gap-5">
              <div className="flex items-center gap-5 text-[10px] font-bold uppercase tracking-widest text-black/35">
                <Link
                  href="/terms"
                  className="hover:text-black transition-colors"
                >
                  Terms
                </Link>
                <Link
                  href="/privacy"
                  className="hover:text-black transition-colors"
                >
                  Privacy
                </Link>
                <Link
                  href="/disclaimer"
                  className="hover:text-black transition-colors"
                >
                  Disclaimer
                </Link>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-medium text-black/35">
                  Created by{" "}
                  <span className="font-bold text-black/50">Vishal</span>
                </span>
                <span className="w-[1px] h-3 bg-black/15" />
                <a
                  href="https://www.linkedin.com/in/vishal-pandey-3835a9330/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-black/30 hover:text-[#0077B5] transition-colors"
                  aria-label="Vishal's LinkedIn"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
                <a
                  href="https://github.com/viishal-62"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-black/30 hover:text-black transition-colors"
                  aria-label="Vishal's GitHub"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </footer>

        {/* ══════════════════════════════════════════
          ENGAGEMENT OVERLAYS
         ══════════════════════════════════════════ */}

        {/* ── TIMED / EXIT-INTENT ENGAGEMENT POPUP ── */}
        <AnimatePresence>
          {showEngagementPopup && !popupDismissed && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                onClick={dismissPopup}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[calc(100%-2rem)] max-w-sm"
              >
                <div className="bg-white rounded-[1.75rem] p-8 shadow-2xl shadow-black/20 text-center relative overflow-hidden">
                  {/* Decorative gradient */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400" />

                  <button
                    onClick={dismissPopup}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-black/30 hover:text-black hover:bg-black/10 transition-all"
                  >
                    <X size={14} />
                  </button>

                  <motion.div
                    animate={{ rotate: [0, 10, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="text-5xl mb-4 inline-block"
                  >
                    🫖
                  </motion.div>

                  <h3 className="text-xl font-black serif mb-2">
                    Don&apos;t leave yet!
                  </h3>
                  <p className="text-[12px] text-black/40 font-medium leading-relaxed mb-6 max-w-xs mx-auto">
                    {totalConfessions > 0
                      ? `${totalConfessions} anonymous confessions are waiting. See what people are saying...`
                      : "People are sharing anonymous confessions right now. Come see what they're saying..."}
                  </p>

                  <div className="flex flex-col gap-2.5">
                    <Link
                      href="/explore"
                      onClick={dismissPopup}
                      className="w-full py-3.5 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/10"
                    >
                      <Eye size={14} />
                      Read Confessions
                    </Link>
                    <Link
                      href="/create"
                      onClick={dismissPopup}
                      className="w-full py-3.5 border border-black/8 text-[10px] text-black/40 font-bold uppercase tracking-widest rounded-xl hover:text-black hover:border-black/15 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={14} />
                      Create My Board
                    </Link>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Live activity toasts now handled by Sonner (see layout.tsx) */}

        {/* Sticky bottom CTA bar removed — BottomNav handles mobile navigation.
         This eliminates the z-index conflict where both bars overlapped,
         causing the "confess" label confusion on mobile. */}
      </div>
    </>
  );
}
