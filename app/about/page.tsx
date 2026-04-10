"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Zap,
  Eye,
  Mic,
  MessageCircle,
  BookOpen,
  ImageDown,
  Volume2,
  Wand2,
  Inbox,
  Heart,
  Flame,
  PenTool,
  Timer,
  Users,
  Globe,
  Lock,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#faf8f5] text-black font-sans page-enter">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 flex items-center px-4 sm:px-6 py-4 bg-[#faf8f5]/85 backdrop-blur-xl border-b border-black/5">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-black/30 hover:text-black transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <span className="flex-1 text-center text-[10px] font-black uppercase tracking-[0.25em] text-black/20">
          About Teaaa
        </span>
        <div className="w-4" />
      </header>

      {/* ── HERO ── */}
      <section className="relative px-4 sm:px-6 py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-rose-100/30 rounded-full blur-[140px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-100/20 rounded-full blur-[120px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mx-auto text-center relative z-10"
        >
          <motion.div
            animate={{ rotate: [0, 8, -6, 0], y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="text-6xl sm:text-7xl mb-6 inline-block"
          >
            🫖
          </motion.div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black serif tracking-tight mb-5 leading-tight">
            Where unfiltered{" "}
            <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-violet-500 bg-clip-text text-transparent">
              truth
            </span>{" "}
            lives.
          </h1>
          <p className="text-base sm:text-lg text-black/40 max-w-xl mx-auto leading-relaxed font-medium">
            Teaaa is the most feature-rich anonymous confession platform on the
            internet. No signup. No tracking. No judgment. Just pure, honest
            expression.
          </p>
        </motion.div>
      </section>

      {/* ── WHAT IS TEAAA ── */}
      <section className="px-4 sm:px-6 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="mb-12">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-black/5 text-[9px] font-bold uppercase tracking-[0.2em] mb-5 text-black/40 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Our
                Story
              </span>
              <h2 className="text-3xl md:text-4xl font-black serif tracking-tight mb-6">
                Built for the things you can&apos;t say out loud
              </h2>
              <div className="space-y-4 text-[15px] text-black/50 leading-relaxed font-medium">
                <p>
                  In a world where every thought is tied to a profile, a
                  follower count, and a permanent digital record — we built
                  Teaaa to be different. A place where you can say what you
                  actually feel, without the anxiety of being yourself.
                </p>
                <p>
                  Whether it&apos;s a confession you&apos;ve been holding in for
                  years, a love letter you&apos;ll never send under your real
                  name, workplace frustration you can&apos;t voice to your boss,
                  or just random tea you need to spill — Teaaa gives you a safe,
                  beautiful, and moderated space to let it out.
                </p>
                <p>
                  We believe anonymity shouldn&apos;t mean chaos. That&apos;s
                  why Teaaa combines total anonymity with AI-powered moderation,
                  community guidelines, and creator controls to keep the space
                  safe while keeping it real.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── KEY NUMBERS ── */}
      <section className="px-4 sm:px-6 py-14 bg-white border-y border-black/5">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
          className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: "Sign-up Required", value: "Zero", icon: "🚫" },
            { label: "Data We Collect", value: "None", icon: "🔒" },
            { label: "Expression Modes", value: "6+", icon: "🎨" },
            { label: "Always", value: "Free", icon: "💚" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              className="bg-[#faf8f5] border border-black/5 rounded-2xl p-5 text-center"
            >
              <span className="text-2xl block mb-2">{stat.icon}</span>
              <p className="text-2xl font-black serif text-black">
                {stat.value}
              </p>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/25 mt-1">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── ALL FEATURES ── */}
      <section className="px-4 sm:px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-accent mb-3">
              ✦ Everything Teaaa Offers
            </p>
            <h2 className="text-3xl md:text-4xl font-black serif tracking-tight">
              Every feature, explained
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
            className="space-y-5"
          >
            {/* Expression Features */}
            <motion.div variants={fadeUp}>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black/25 mb-4 flex items-center gap-2">
                <Sparkles size={12} className="text-accent" /> Ways to Express
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    icon: <MessageCircle size={22} className="text-blue-500" />,
                    bg: "bg-blue-50",
                    title: "Text Confessions",
                    desc: "Write anonymous confessions up to 500 words. Pick a mood category (Love, Regret, Fear, Guilt, etc.) and drop it into the void. Supports emojis, quick-starter prompts, and real-time AI moderation that catches toxic content before it publishes.",
                  },
                  {
                    icon: <Mic size={22} className="text-rose-500" />,
                    bg: "bg-rose-50",
                    title: "Voice Confessions",
                    desc: "Record up to 30 seconds of anonymous audio directly from your browser. No voice metadata stored. Features an animated waveform player, mood tagging, listener reactions, and anonymous voice-to-voice replies.",
                  },
                  {
                    icon: <PenTool size={22} className="text-emerald-500" />,
                    bg: "bg-emerald-50",
                    title: "Doodle Confessions",
                    desc: "Draw your feelings on a freehand digital canvas. Choose colors, brush sizes, and create artistic sketch cards that get shared as beautiful images on the board. Perfect for when words aren't enough.",
                  },
                  {
                    icon: <BookOpen size={22} className="text-amber-500" />,
                    bg: "bg-amber-50",
                    title: "Deep Spills (Long Stories)",
                    desc: "Write full-length anonymous stories with multiple chapters. Add descriptions, categories, and Teaaa auto-generates AI cover art for each spill. Perfect for workplace drama, relationship sagas, or life stories.",
                  },
                  {
                    icon: <Heart size={22} className="text-pink-500" />,
                    bg: "bg-pink-50",
                    title: "Secret Admirer Letters",
                    desc: "Send beautifully animated anonymous love letters inside sealed digital envelopes. Viewers interact with them on a physics-based cork board with immersive ambient background music. Complete with wax seals, paper textures, and floating hearts.",
                  },
                  {
                    icon: <Flame size={22} className="text-orange-500" />,
                    bg: "bg-orange-50",
                    title: "Disappearing Tea",
                    desc: "Set confessions to self-destruct after 5 minutes, 24 hours, 7 days, a custom time, or after a specific number of views (like 25 views). Once gone, it's purged completely — no trace left.",
                  },
                ].map((f) => (
                  <div
                    key={f.title}
                    className="bg-white border border-black/5 rounded-2xl p-6 hover:shadow-lg hover:shadow-black/[0.03] transition-all group"
                  >
                    <div
                      className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                    >
                      {f.icon}
                    </div>
                    <h4 className="text-base font-black serif mb-2">
                      {f.title}
                    </h4>
                    <p className="text-[12px] text-black/40 leading-relaxed font-medium">
                      {f.desc}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Creator & Community Features */}
            <motion.div variants={fadeUp} className="pt-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black/25 mb-4 flex items-center gap-2">
                <Users size={12} className="text-accent" /> Creator & Community
                Tools
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    icon: <Globe size={22} className="text-indigo-500" />,
                    bg: "bg-indigo-50",
                    title: "Custom Boards",
                    desc: "Create your own anonymous confession board with a custom name, slug, tagline, theme, and rules. Share the unique link on Instagram, WhatsApp, or anywhere. Perfect for colleges, workplaces, friend groups, or fandoms.",
                  },
                  {
                    icon: <Inbox size={22} className="text-blue-500" />,
                    bg: "bg-blue-50",
                    title: "Live Inbox & Notifications",
                    desc: "Real-time notifications for every new confession, reaction, and reply on your board. Track engagement with a live inbox dashboard that shows exactly what's happening on your community.",
                  },
                  {
                    icon: <Wand2 size={22} className="text-purple-500" />,
                    bg: "bg-purple-50",
                    title: "AI Board Summarizer",
                    desc: "One-click AI summaries of your entire board. Get the dominant mood, key themes, and TLDR of hundreds of confessions instantly. Perfect for large communities with high volume.",
                  },
                  {
                    icon: <ImageDown size={22} className="text-orange-500" />,
                    bg: "bg-orange-50",
                    title: "Downloadable & Shareable Cards",
                    desc: "Turn any confession into a beautifully designed, branded polaroid card. Download as a high-quality image or share directly to Instagram Stories, WhatsApp Status, Snapchat, Twitter — one tap. Each card features the confession text, mood badge, and Teaaa branding.",
                  },
                  {
                    icon: <Volume2 size={22} className="text-emerald-500" />,
                    bg: "bg-emerald-50",
                    title: "18 Ambient Soundscapes",
                    desc: "Enhance the reading experience with curated background audio — rain, ocean waves, fireplace, lo-fi beats, café ambiance, and more. Especially immersive when reading Secret Admirer letters.",
                  },
                  {
                    icon: <CheckCircle2 size={22} className="text-teal-500" />,
                    bg: "bg-teal-50",
                    title: "Creator-Verified Replies",
                    desc: "Board creators can reply to confessions with a verified badge, creating authentic dialogue while maintaining the community's anonymous nature. Replies show a special creator seal.",
                  },
                ].map((f) => (
                  <div
                    key={f.title}
                    className="bg-white border border-black/5 rounded-2xl p-6 hover:shadow-lg hover:shadow-black/[0.03] transition-all group"
                  >
                    <div
                      className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                    >
                      {f.icon}
                    </div>
                    <h4 className="text-base font-black serif mb-2">
                      {f.title}
                    </h4>
                    <p className="text-[12px] text-black/40 leading-relaxed font-medium">
                      {f.desc}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── PRIVACY & SAFETY ── */}
      <section className="px-4 sm:px-6 py-20 bg-white border-y border-black/5 relative overflow-hidden">
        <div className="absolute top-0 left-[20%] w-96 h-96 bg-emerald-50/30 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-3xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-emerald-500 mb-3">
              ✦ Privacy & Safety
            </p>
            <h2 className="text-3xl md:text-4xl font-black serif tracking-tight mb-4">
              Truly anonymous. Actually safe.
            </h2>
            <p className="text-sm text-black/35 max-w-lg mx-auto leading-relaxed">
              We don&apos;t just say we&apos;re anonymous — we engineered it
              from the ground up.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
            className="space-y-4"
          >
            {[
              {
                icon: <Lock size={20} />,
                title: "Zero Accounts, Zero Login",
                desc: "There is no sign-up. No email. No phone number. No social login. You open Teaaa and you're in. We literally cannot know who you are.",
                color: "#22c55e",
              },
              {
                icon: <Shield size={20} />,
                title: "No IP Tracking or Fingerprinting",
                desc: "We don't store IP addresses, browser fingerprints, or device metadata. Your identity is protected at every layer. The only local identifier is a random session string used to prevent spam.",
                color: "#3b82f6",
              },
              {
                icon: <Eye size={20} />,
                title: "AI-Powered Content Moderation",
                desc: "Every confession passes through real-time AI moderation. Toxic, hateful, violent, or explicit content is blocked before it ever reaches the board. Board creators can also set custom banned words.",
                color: "#8b5cf6",
              },
              {
                icon: <Timer size={20} />,
                title: "Self-Destructing Content",
                desc: "Disappearing Tea lets users set confessions to auto-delete after a time period or view count. Once deleted, the data is completely purged from our servers.",
                color: "#f59e0b",
              },
              {
                icon: <Zap size={20} />,
                title: "No Algorithmic Feed",
                desc: "We don't use engagement algorithms, push notifications for rage-bait, or any dark patterns. Your feed is purely chronological — raw and honest, in order.",
                color: "#ef4444",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="flex items-start gap-5 bg-[#faf8f5] border border-black/5 rounded-2xl p-6 hover:shadow-md hover:shadow-black/[0.02] transition-all"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `${item.color}12`,
                    color: item.color,
                  }}
                >
                  {item.icon}
                </div>
                <div>
                  <h4 className="text-sm font-black serif mb-1">
                    {item.title}
                  </h4>
                  <p className="text-[12px] text-black/40 leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="px-4 sm:px-6 py-20">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-accent mb-3">
              ✦ How It Works
            </p>
            <h2 className="text-3xl md:text-4xl font-black serif tracking-tight">
              From thought to confession in seconds
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
            className="space-y-0"
          >
            {[
              {
                step: "01",
                title: "Open Teaaa",
                desc: "No download. No sign-up. Just visit teaadrop.xyz on any device. That's it.",
              },
              {
                step: "02",
                title: "Choose your mode",
                desc: "Write text, record voice, draw a doodle, write a deep spill story, or send a secret admirer letter.",
              },
              {
                step: "03",
                title: "Pick a mood",
                desc: "Tag your confession with a feeling — Love, Regret, Guilt, Fear, Mischief, Obsession, Pride, and more.",
              },
              {
                step: "04",
                title: "Drop it anonymously",
                desc: "Your confession is published instantly. No name, no trace, no way to find out who wrote it.",
              },
              {
                step: "05",
                title: "Watch the reactions",
                desc: "Others react, reply, and engage — all anonymously. Download the confession as a shareable card if you love it.",
              },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                variants={fadeUp}
                className="flex gap-6 items-start"
              >
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center text-[11px] font-black">
                    {s.step}
                  </div>
                  {i < 4 && <div className="w-px h-16 bg-black/10 mt-2" />}
                </div>
                <div className="pb-10">
                  <h4 className="text-lg font-black serif mb-1">{s.title}</h4>
                  <p className="text-[13px] text-black/40 leading-relaxed font-medium">
                    {s.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── USE CASES ── */}
      <section className="px-4 sm:px-6 py-20 bg-white border-y border-black/5">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-accent mb-3">
              ✦ Use Cases
            </p>
            <h2 className="text-3xl md:text-4xl font-black serif tracking-tight">
              Who uses Teaaa?
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {[
              {
                emoji: "🎓",
                title: "College Students",
                desc: "Anonymous confession pages for universities, campus drama, and late-night truth bombs.",
              },
              {
                emoji: "💼",
                title: "Workplace Teams",
                desc: "Honest anonymous feedback channels without HR involvement. Say what you can't at work.",
              },
              {
                emoji: "💗",
                title: "Secret Admirers",
                desc: "Send beautiful anonymous love letters to your crush with ambient music and sealed envelopes.",
              },
              {
                emoji: "👫",
                title: "Friend Groups",
                desc: "Create private boards for your squad to spill tea, share secrets, and confess anonymously.",
              },
              {
                emoji: "🎭",
                title: "Content Creators",
                desc: "Run AMAs with your audience. Get real, unfiltered feedback and confessions from followers.",
              },
              {
                emoji: "🧠",
                title: "Mental Health",
                desc: "A safe anonymous space to vent, process emotions, and share feelings without judgment.",
              },
            ].map((uc) => (
              <motion.div
                key={uc.title}
                variants={fadeUp}
                className="bg-[#faf8f5] border border-black/5 rounded-2xl p-6 hover:shadow-md hover:shadow-black/[0.02] transition-all"
              >
                <span className="text-3xl block mb-3">{uc.emoji}</span>
                <h4 className="text-base font-black serif mb-1.5">
                  {uc.title}
                </h4>
                <p className="text-[12px] text-black/40 leading-relaxed font-medium">
                  {uc.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CREATOR ── */}
      <section className="px-4 sm:px-6 py-20 bg-white border-y border-black/5">
        <div className="max-w-xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-400 via-pink-400 to-violet-400 mx-auto mb-6 flex items-center justify-center text-3xl text-white font-black shadow-lg shadow-rose-200/50">
              V
            </div>
            <h2 className="text-2xl font-black serif tracking-tight mb-2">
              Created by Vishal
            </h2>
            <p className="text-sm text-black/35 leading-relaxed font-medium mb-6 max-w-md mx-auto">
              Built as a passion project to create a kinder, more honest corner
              of the internet. Teaaa is independently developed and maintained
              with love, late-night coding sessions, and a lot of tea.
            </p>
            <div className="flex items-center justify-center gap-4">
              <a
                href="https://www.linkedin.com/in/vishal-pandey-3835a9330/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0077B5]/10 text-[#0077B5] rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#0077B5]/20 transition-colors"
              >
                LinkedIn
              </a>
              <a
                href="https://github.com/viishal-62"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-black/5 text-black/60 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black/10 transition-colors"
              >
                GitHub
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="px-4 sm:px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-lg mx-auto text-center"
        >
          <div className="bg-white/80 backdrop-blur-xl border border-black/5 rounded-[1.75rem] p-12 shadow-xl shadow-black/[0.03]">
            <span className="text-5xl block mb-5">🫖</span>
            <h2 className="text-3xl font-black serif tracking-tight mb-3">
              Ready to spill?
            </h2>
            <p className="text-xs text-black/30 font-medium mb-8 max-w-xs mx-auto leading-relaxed">
              No sign-up. No trace. Just open Teaaa and let it out.
            </p>
            <div className="flex flex-col gap-2.5">
              <Link
                href="/confess"
                className="w-full py-4 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-black/10 flex items-center justify-center gap-2"
              >
                ✍️ Confess Now
              </Link>
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  href="/create"
                  className="py-3.5 border border-black/8 text-[10px] text-black/40 font-bold uppercase tracking-widest rounded-xl hover:text-black hover:border-black/15 transition-all flex items-center justify-center gap-1.5"
                >
                  Create Board
                </Link>
                <Link
                  href="/explore"
                  className="py-3.5 border border-black/8 text-[10px] text-black/40 font-bold uppercase tracking-widest rounded-xl hover:text-black hover:border-black/15 transition-all flex items-center justify-center gap-1.5"
                >
                  Explore Feed
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER LINK BACK ── */}
      <div className="py-8 text-center border-t border-black/5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[10px] font-bold text-black/20 uppercase tracking-widest hover:text-black transition-colors"
        >
          <ArrowLeft size={12} />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
