"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CATEGORY_INFO, timeAgo } from "@/app/lib/utils";
import {
  ArrowRight,
  Plus,
  Mic,
  Headphones,
  MessageCircle,
  Shield,
  Zap,
  Eye,
  Flame,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform, useMotionValue, useSpring as useFMSpring } from "framer-motion";
import { useSpring, animated } from "@react-spring/web";
import { THEMES } from "@/convex/helpers";

/* ── Animated number ── */
function AnimNum({ value }: { value: number }) {
  const sp = useSpring({ val: value, from: { val: 0 }, config: { tension: 40, friction: 20 } });
  return <animated.span>{sp.val.to((v) => Math.floor(v))}</animated.span>;
}

/* ── Variants ── */
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
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

export default function Home() {
  const publicBoards = useQuery(api.boards.listPublic);
  const globalFeed = useQuery(api.confessions.globalFeed, {});
  const recentSpills = useQuery(api.spills.listAll);
  const voiceFeed = useQuery(api.confessions.voiceFeed, {});

  const [heroReady, setHeroReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setHeroReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const totalConfessions = (globalFeed?.length ?? 0) + (voiceFeed?.length ?? 0);
  const textConfessions = globalFeed?.filter((c: any) => c.type !== "voice") ?? [];

  /* Cursor glow on hero */
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useFMSpring(mouseX, { stiffness: 150, damping: 20 });
  const smoothY = useFMSpring(mouseY, { stiffness: 150, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-black font-sans selection:bg-accent/10 overflow-x-hidden">
      {/* ── NAV ── */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-4 bg-[#faf8f5]/80 backdrop-blur-xl"
      >
        <Link href="/" className="text-sm font-black serif tracking-tight hover:scale-105 transition-transform">
          🫖 teaaa
        </Link>
        <div className="flex items-center gap-5">
          <Link href="/explore" className="text-[10px] font-bold uppercase tracking-widest text-black/30 hover:text-black transition-colors">
            Explore
          </Link>
          <Link href="/forum" className="text-[10px] font-bold uppercase tracking-widest text-black/30 hover:text-black transition-colors">
            Community
          </Link>
          <Link href="/explore/voice" className="text-[10px] font-bold uppercase tracking-widest text-black/30 hover:text-black transition-colors flex items-center gap-1">
            <Mic size={10} /> Voice
          </Link>
          <Link href="/confess" className="text-[10px] font-bold uppercase tracking-widest text-black/30 hover:text-black transition-colors">
            Confess
          </Link>
          <Link href="/create" className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 bg-black text-white rounded-lg hover:scale-105 transition-all">
            Create Board
          </Link>
        </div>
      </motion.nav>

      {/* ══════════════════════════════════════════
          HERO — parallax + cursor glow + stagger
         ══════════════════════════════════════════ */}
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 pt-16 overflow-hidden"
      >
        {/* Cursor glow */}
        <motion.div
          className="absolute pointer-events-none w-[500px] h-[500px] rounded-full opacity-[0.06]"
          style={{
            background: "radial-gradient(circle, #ec4899, transparent 70%)",
            x: smoothX,
            y: smoothY,
            translateX: "-50%",
            translateY: "-50%",
          }}
        />

        {/* Ambient bg */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
            className="absolute top-[10%] left-[8%] w-80 h-80 bg-rose-200/15 rounded-full blur-[130px]"
          />
          <motion.div
            animate={{ x: [0, -25, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 14, ease: "easeInOut" }}
            className="absolute bottom-[15%] right-[5%] w-72 h-72 bg-violet-200/12 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
            className="absolute top-[45%] left-[45%] w-96 h-96 bg-amber-100/10 rounded-full blur-[160px]"
          />
        </div>

        <motion.div
          style={{ y: heroY, scale: heroScale, opacity: heroOpacity }}
          className="relative z-10 text-center max-w-2xl"
        >
          {/* Pill */}
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.9 }}
            animate={heroReady ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/70 backdrop-blur-md border border-black/5 text-[9px] font-bold uppercase tracking-[0.2em] mb-8 text-black/35 shadow-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Anonymous · No sign up · Voice & Text
          </motion.div>

          {/* Heading — word by word */}
          <div className="mb-6">
            {[
              { text: "Say the thing", delay: 0.3 },
              { text: "you haven't said.", delay: 0.5, accent: true },
            ].map((line, li) => (
              <motion.div
                key={li}
                initial={{ opacity: 0, y: 25 }}
                animate={heroReady ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: line.delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                <h1
                  className={`text-5xl md:text-7xl font-black tracking-tight serif leading-[0.95] ${
                    line.accent
                      ? "bg-gradient-to-r from-rose-500 via-orange-400 to-amber-500 bg-clip-text text-transparent"
                      : "text-black"
                  }`}
                >
                  {line.text}
                </h1>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={heroReady ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="text-sm md:text-base text-black/35 max-w-md mx-auto mb-10 font-medium leading-relaxed"
          >
            Confess anonymously — type it, say it, or spill the whole story.
            Voice recordings, text drops, and full gossip books.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate={heroReady ? "show" : "hidden"}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <motion.div variants={fadeUp}>
              <Link
                href="/create"
                className="group relative flex items-center justify-center gap-2.5 px-8 py-4 bg-black text-white text-[11px] font-bold uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/15 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                <Plus size={15} />
                Create Your Board
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
            <motion.div variants={fadeUp}>
              <Link
                href="/confess"
                className="flex items-center justify-center gap-2 px-8 py-4 bg-white/80 backdrop-blur-sm border border-black/8 text-[11px] text-black/50 font-bold uppercase tracking-widest rounded-xl hover:bg-white hover:text-black hover:shadow-lg hover:shadow-black/5 transition-all"
              >
                🫖 Just Confess
              </Link>
            </motion.div>
            <motion.div variants={fadeUp}>
              <Link
                href="/explore/voice"
                className="flex items-center justify-center gap-2 px-8 py-4 bg-white/80 backdrop-blur-sm border border-black/8 text-[11px] text-black/50 font-bold uppercase tracking-widest rounded-xl hover:bg-white hover:text-black hover:shadow-lg hover:shadow-black/5 transition-all"
              >
                <Mic size={14} /> Voice Confess
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="w-5 h-8 rounded-full border-2 border-black/10 flex justify-center pt-1.5"
          >
            <motion.div
              animate={{ height: [4, 10, 4], opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="w-0.5 bg-black/30 rounded-full"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ── MOOD MARQUEE ── */}
      <div className="py-6 overflow-hidden border-y border-black/[0.04] bg-white/50">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
          className="flex gap-6 whitespace-nowrap"
        >
          {[...MOODS, ...MOODS].map((m, i) => (
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
          ))}
        </motion.div>
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
            { label: "Deep Spills", value: recentSpills?.length ?? 0, icon: "📖" },
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
                <h3 className="text-xl font-black serif mb-2">Record a Confession</h3>
                <p className="text-xs text-black/35 leading-relaxed max-w-sm mb-6">
                  Hit record, speak your truth for up to 30 seconds.
                  Choose a mood, give it a title, and drop it into the void.
                </p>

                {/* Mini waveform */}
                <div className="flex items-end gap-[3px] h-10">
                  {Array(28).fill(0).map((_, i) => (
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
                  <h3 className="text-base font-black serif mb-1">Listen & Feel</h3>
                  <p className="text-[11px] text-black/30 leading-relaxed">
                    Animated waveform player. Hear real voices. React with emotions.
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
                  <h3 className="text-base font-black serif mb-1">Reply Anonymously</h3>
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
              { icon: <Shield size={16} />, label: "100% Anonymous", color: "#22c55e" },
              { icon: <Zap size={16} />, label: "No Sign Up", color: "#f59e0b" },
              { icon: <Eye size={16} />, label: "View Tracking", color: "#6366f1" },
              { icon: <Flame size={16} />, label: "Reactions", color: "#ef4444" },
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
              <ArrowRight size={14} className="relative z-10 group-hover:translate-x-1 transition-transform" />
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
              Five ways to spill
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
                desc: "Send anonymous love letters with physical envelope reveal animations.",
                gradient: "from-pink-50 to-white",
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
                  typeof confession.text === "string" && confession.text.trim().length > 0
                    ? confession.text
                    : "Anonymous confession";
                return (
                  <motion.div key={confession._id} variants={fadeUp}>
                    <Link
                      href="/explore"
                      className="flex items-center gap-4 px-5 py-6 bg-white border border-black/5 rounded-2xl hover:shadow-lg hover:shadow-black/[0.03] transition-all group"
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
                        style={{
                          background: catInfo?.color ?? "#ccc",
                          boxShadow: `0 0 8px ${catInfo?.color ?? "#ccc"}40`,
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm serif text-black/60 leading-relaxed blur-[5px] select-none mb-1.5">
                          {previewText.slice(0, 60)}
                          {previewText.length > 60 ? "..." : ""}
                        </p>
                        <div className="flex items-center gap-2">
                          {catInfo && (
                            <span
                              className="text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                              style={{ background: `${catInfo.color}10`, color: catInfo.color }}
                            >
                              {catInfo.label}
                            </span>
                          )}
                          <span className="text-[9px] text-black/15 font-medium">
                            {timeAgo(confession.createdAt)}
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-black/10 group-hover:text-accent uppercase tracking-widest flex-shrink-0 transition-colors">
                        Reveal →
                      </span>
                    </Link>
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
                  <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
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
              {recentSpills.slice(0, 3).map((spill) => {
                const spillTheme = THEMES.find((t) => t.key === spill.coverTheme) || THEMES[0];
                return (
                  <motion.div
                    key={spill._id}
                    variants={fadeUp}
                    whileHover={{ y: -6, transition: { duration: 0.25 } }}
                  >
                    <Link href={`/b/${spill.boardSlug}/s/${spill._id}`} className="group block">
                      <div className="bg-white border border-black/5 rounded-2xl p-4 hover:shadow-lg hover:shadow-black/5 transition-all">
                        <div
                          className="relative mx-auto aspect-[3/4] rounded-xl overflow-hidden transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-[-1deg]"
                          style={{
                            background: spill.aiImageUrl
                              ? `url(${spill.aiImageUrl}) center/cover`
                              : spillTheme.bg,
                          }}
                        >
                          <div className={`absolute inset-0 flex flex-col justify-between p-5 text-center ${spill.aiImageUrl ? "bg-black/35" : ""}`}>
                            <span
                              className="text-[8px] font-black uppercase tracking-[0.3em]"
                              style={{ color: spill.aiImageUrl ? "#fff" : spillTheme.accent }}
                            >
                              Deep Spill
                            </span>
                            <div>
                              {!spill.aiImageUrl && <div className="text-3xl mb-2">{spill.coverEmoji}</div>}
                              <h3
                                className="serif text-lg font-black leading-tight"
                                style={{ color: spill.aiImageUrl ? "#fff" : spillTheme.text }}
                              >
                                {spill.title}
                              </h3>
                            </div>
                            <span
                              className="text-[8px] uppercase tracking-[0.15em] font-medium opacity-50"
                              style={{ color: spill.aiImageUrl ? "#fff" : spillTheme.text }}
                            >
                              {spill.displayName}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between px-1">
                          <p className="text-[9px] font-bold text-black/20 uppercase tracking-wider">
                            {(spill.views ?? 0).toLocaleString()} reads
                          </p>
                          <span className="text-[9px] font-bold text-black/15 group-hover:text-accent uppercase tracking-widest transition-colors">
                            Read →
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>
      )}

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
              <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Our Philosophy
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
                transition={{ delay: i * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
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
                       <span className="text-[9px] font-black uppercase tracking-[0.2em] text-red-400 group-hover:text-red-500 transition-colors duration-500">The Norm</span>
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
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#faf8f5]/80 backdrop-blur-sm border border-black/[0.05] flex items-center justify-center text-[8px] font-black uppercase tracking-widest text-black/30 group-hover:bg-accent group-hover:text-white group-hover:border-accent group-hover:rotate-180 transition-all duration-700 shadow-sm z-20">
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
              <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform duration-500" />
            </Link>
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

      {/* ── FOOTER ── */}
      <footer className="py-10 border-t border-black/5 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="text-sm font-black serif">🫖 teaaa</span>
          <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-black/10">
            Anonymous. Unfiltered. Always.
          </p>
          <div className="flex gap-6">
            {[
              { href: "/explore", label: "Explore" },
              { href: "/forum", label: "Community" },
              { href: "/explore/voice", label: "Voice" },
              { href: "/confess", label: "Confess" },
              { href: "/spill/create", label: "Write Spill" },
              { href: "/create", label: "Create" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-[9px] font-bold uppercase tracking-widest text-black/15 hover:text-black transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
