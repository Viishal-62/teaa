"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CATEGORY_INFO, timeAgo } from "@/app/lib/utils";
import { ArrowRight, Plus, BookOpen, Flame } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { THEMES } from "@/convex/helpers";

export default function Home() {
  const publicBoards = useQuery(api.boards.listPublic);
  const globalFeed = useQuery(api.confessions.globalFeed, {});
  const recentSpills = useQuery(api.spills.listAll);

  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  // Scroll reveal — re-run when data loads so late-mounting sections get observed
  const sectionsRef = useRef<HTMLDivElement[]>([]);
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting)
            (e.target as HTMLElement).classList.add("revealed-scroll");
        });
      },
      { threshold: 0.12 },
    );
    sectionsRef.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [globalFeed, publicBoards, recentSpills]);

  const addRef = (el: HTMLDivElement | null) => {
    if (el && !sectionsRef.current.includes(el)) sectionsRef.current.push(el);
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-black font-sans selection:bg-accent/10">
      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-4 bg-[#faf8f5]/80 backdrop-blur-xl">
        <span className="text-sm font-black serif tracking-tight">
          🫖 teaaa
        </span>
        <div className="flex items-center gap-5">
          <Link
            href="/explore"
            className="text-[10px] font-bold uppercase tracking-widest text-black/30 hover:text-black transition-colors"
          >
            Explore
          </Link>
          <Link
            href="/confess"
            className="text-[10px] font-bold uppercase tracking-widest text-black/30 hover:text-black transition-colors"
          >
            Confess
          </Link>
          <Link
            href="/spill/create"
            className="text-[10px] font-bold uppercase tracking-widest text-black/30 hover:text-black transition-colors"
          >
            Write Spill
          </Link>
          <Link
            href="/create"
            className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 bg-black text-white rounded-lg hover:scale-105 transition-all"
          >
            Create Board
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 pt-16 relative">
        {/* Soft ambient blurs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[15%] left-[10%] w-72 h-72 bg-rose-200/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[20%] right-[8%] w-64 h-64 bg-amber-200/15 rounded-full blur-[100px]" />
          <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-100/10 rounded-full blur-[150px]" />
        </div>

        <div
          className={`relative z-10 text-center max-w-2xl transition-all duration-1000 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          {/* Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-black/5 text-[9px] font-bold uppercase tracking-[0.25em] mb-8 text-black/30 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Anonymous · No sign up
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight serif leading-[0.9] text-black">
            Say the thing
            <br />
            <span className="text-accent">you haven&apos;t said.</span>
          </h1>

          <p className="text-sm md:text-base text-black/35 max-w-md mx-auto mb-10 font-medium leading-relaxed">
            Create a board, share the link, and let anonymous confessions pour
            in. Or write a Deep Spill — full-length anonymous stories with
            chapters and cover art.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/create"
              className="group flex items-center justify-center gap-2 px-8 py-4 bg-black text-white text-[11px] font-bold uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/10"
            >
              <Plus size={15} />
              Create Your Board
              <ArrowRight
                size={14}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
            <Link
              href="/confess"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-white border border-black/8 text-[11px] text-black/50 font-bold uppercase tracking-widest rounded-xl hover:bg-black/[0.02] hover:text-black transition-all"
            >
              🫖 Just Confess
            </Link>
            <Link
              href="/spill/create"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-white border border-black/8 text-[11px] text-black/50 font-bold uppercase tracking-widest rounded-xl hover:bg-black/[0.02] hover:text-black transition-all"
            >
              <Flame size={14} /> Write a Spill
            </Link>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-15">
          <div className="w-px h-10 bg-black" />
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <div
        ref={addRef}
        className="opacity-0 translate-y-6 transition-all duration-700 [&.revealed-scroll]:opacity-100 [&.revealed-scroll]:translate-y-0"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-3 gap-0 bg-white border border-black/5 rounded-2xl overflow-hidden shadow-sm shadow-black/[0.02]">
            <div className="p-6 text-center border-r border-black/5">
              <p className="text-3xl font-black serif text-black">
                {publicBoards?.length ?? "—"}
              </p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-black/20 mt-1">
                Boards
              </p>
            </div>
            <div className="p-6 text-center border-r border-black/5">
              <p className="text-3xl font-black serif text-black">
                {globalFeed?.length ?? "—"}
              </p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-black/20 mt-1">
                Confessions
              </p>
            </div>
            <div className="p-6 text-center">
              <p className="text-3xl font-black serif text-black">
                {recentSpills?.length ?? "—"}
              </p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-black/20 mt-1">
                Deep Spills
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div
            ref={addRef}
            className="opacity-0 translate-y-6 transition-all duration-700 [&.revealed-scroll]:opacity-100 [&.revealed-scroll]:translate-y-0 text-center mb-12"
          >
            <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-accent mb-2">
              How it works
            </p>
            <h2 className="text-3xl font-black serif tracking-tight">
              Three steps. That&apos;s it.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                n: "01",
                icon: "✨",
                title: "Create",
                desc: "Set up your board in seconds. Pick a name, choose a vibe.",
              },
              {
                n: "02",
                icon: "🔗",
                title: "Share",
                desc: "Copy the link. Drop it in any group chat, story, or bio.",
              },
              {
                n: "03",
                icon: "🫖",
                title: "Receive",
                desc: "Watch anonymous confessions roll in. React and comment.",
              },
            ].map((s, i) => (
              <div
                key={s.n}
                ref={addRef}
                className="opacity-0 translate-y-6 transition-all duration-700 [&.revealed-scroll]:opacity-100 [&.revealed-scroll]:translate-y-0 bg-white border border-black/5 rounded-2xl p-6 text-center hover:shadow-md hover:shadow-black/[0.02] transition-shadow"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <span className="text-2xl block mb-3">{s.icon}</span>
                <p className="text-[9px] font-bold text-black/15 uppercase tracking-widest mb-1">
                  {s.n}
                </p>
                <h3 className="text-base font-black serif mb-2">{s.title}</h3>
                <p className="text-[11px] text-black/35 leading-relaxed font-medium">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RECENT CONFESSIONS ── */}
      {globalFeed && globalFeed.length > 0 && (
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-2xl mx-auto">
            <div
              ref={addRef}
              className="opacity-0 translate-y-6 transition-all duration-700 [&.revealed-scroll]:opacity-100 [&.revealed-scroll]:translate-y-0 flex items-center justify-between mb-8"
            >
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-accent mb-1">
                  Live
                </p>
                <h2 className="text-2xl font-black serif">
                  People are confessing
                </h2>
              </div>
            </div>

            <div className="space-y-2.5">
              {globalFeed.slice(0, 2).map((confession: any, i: number) => {
                const catInfo = CATEGORY_INFO[confession.category];
                return (
                  <div
                    key={confession._id}
                    ref={addRef}
                    className="opacity-0 translate-y-6 transition-all duration-700 [&.revealed-scroll]:opacity-100 [&.revealed-scroll]:translate-y-0"
                    style={{ transitionDelay: `${i * 60}ms` }}
                  >
                    <Link
                      href="/explore"
                      className="flex items-center gap-4 px-5 py-7 bg-white border border-black/5 rounded-xl hover:shadow-md hover:shadow-black/[0.02] transition-all group"
                    >
                      {/* Category dot */}
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: catInfo?.color ?? "#ccc" }}
                      />
                      <div className="flex-1 min-w-0">
                        {/* Blurred text - hidden on purpose */}
                        <p className="text-sm serif text-black/60 leading-relaxed blur-[5px] select-none mb-1">
                          {confession.text.slice(0, 60)}...
                        </p>
                        <div className="flex items-center gap-2">
                          {catInfo && (
                            <span
                              className="text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                              style={{
                                background: `${catInfo.color}10`,
                                color: catInfo.color,
                              }}
                            >
                              {catInfo.label}
                            </span>
                          )}
                          <span className="text-[9px] text-black/15 font-medium">
                            {timeAgo(confession.createdAt)}
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-black/15 group-hover:text-accent uppercase tracking-widest flex-shrink-0 transition-colors">
                        Reveal →
                      </span>
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* +X more link */}
            {globalFeed.length > 2 && (
              <Link
                href="/explore"
                className="flex items-center justify-center gap-2 mt-4 py-4 bg-white border border-black/5 rounded-xl text-[11px] font-bold text-black/25 hover:text-black hover:border-black/15 transition-all group"
              >
                <span>+{globalFeed.length - 2} more secrets</span>
                <ArrowRight
                  size={12}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
            )}
          </div>
        </section>
      )}

      {/* ── RECENT DEEP SPILLS ── */}
      {recentSpills && recentSpills.length > 0 && (
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <div
              ref={addRef}
              className="opacity-0 translate-y-6 transition-all duration-700 [&.revealed-scroll]:opacity-100 [&.revealed-scroll]:translate-y-0 flex items-center justify-between mb-8"
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {recentSpills.slice(0, 3).map((spill, i) => {
                const spillTheme =
                  THEMES.find((t) => t.key === spill.coverTheme) || THEMES[0];
                return (
                  <motion.div
                    key={spill._id}
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{
                      delay: i * 0.12,
                      duration: 0.5,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <Link
                      href={`/b/${spill.boardSlug}/s/${spill._id}`}
                      className="group block"
                    >
                      <div className="bg-white border border-black/5 rounded-2xl p-4 hover:shadow-lg hover:shadow-black/5 transition-all">
                        <div
                          className="relative mx-auto aspect-[3/4] rounded-xl overflow-hidden transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-[-1deg]"
                          style={{
                            background: spill.aiImageUrl
                              ? `url(${spill.aiImageUrl}) center/cover`
                              : spillTheme.bg,
                          }}
                        >
                          <div
                            className={`absolute inset-0 flex flex-col justify-between p-5 text-center ${
                              spill.aiImageUrl ? "bg-black/35" : ""
                            }`}
                          >
                            <span
                              className="text-[8px] font-black uppercase tracking-[0.3em]"
                              style={{
                                color: spill.aiImageUrl
                                  ? "#fff"
                                  : spillTheme.accent,
                              }}
                            >
                              Deep Spill
                            </span>
                            <div>
                              {!spill.aiImageUrl && (
                                <div className="text-3xl mb-2">
                                  {spill.coverEmoji}
                                </div>
                              )}
                              <h3
                                className="serif text-lg font-black leading-tight"
                                style={{
                                  color: spill.aiImageUrl
                                    ? "#fff"
                                    : spillTheme.text,
                                }}
                              >
                                {spill.title}
                              </h3>
                            </div>
                            <span
                              className="text-[8px] uppercase tracking-[0.15em] font-medium opacity-50"
                              style={{
                                color: spill.aiImageUrl
                                  ? "#fff"
                                  : spillTheme.text,
                              }}
                            >
                              {spill.displayName}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between px-1">
                          <div className="flex flex-col">
                            <p className="text-[9px] font-bold text-black/20 uppercase tracking-wider">
                              {(spill.views ?? 0).toLocaleString()} reads
                            </p>
                            {spill.totalReactions > 0 && (
                              <p className="text-[9px] font-bold text-orange-500/40 uppercase tracking-wider mt-0.5">
                                {spill.totalReactions} reactions 🔥
                              </p>
                            )}
                          </div>
                          <span className="text-[9px] font-bold text-black/15 group-hover:text-accent uppercase tracking-widest transition-colors">
                            Read →
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {recentSpills.length > 3 && (
              <Link
                href="/explore"
                className="flex items-center justify-center gap-2 mt-4 py-4 bg-white border border-black/5 rounded-xl text-[11px] font-bold text-black/25 hover:text-black hover:border-black/15 transition-all group"
              >
                <span>+{recentSpills.length - 3} more stories</span>
                <ArrowRight
                  size={12}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
            )}
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="py-24 px-4 sm:px-6">
        <div
          ref={addRef}
          className="opacity-0 translate-y-6 transition-all duration-700 [&.revealed-scroll]:opacity-100 [&.revealed-scroll]:translate-y-0 max-w-lg mx-auto text-center"
        >
          <div className="bg-white border border-black/5 rounded-2xl p-10 shadow-sm shadow-black/[0.02]">
            <span className="text-4xl block mb-4">🫖</span>
            <h2 className="text-2xl font-black serif tracking-tight mb-2">
              Ready to spill?
            </h2>
            <p className="text-xs text-black/30 font-medium mb-6">
              Create a board, write a Deep Spill, or just confess anonymously.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
              <Link
                href="/create"
                className="px-8 py-3.5 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all"
              >
                Start My Board
              </Link>
              <Link
                href="/spill/create"
                className="px-8 py-3.5 border border-black/8 text-[10px] text-black/40 font-bold uppercase tracking-widest rounded-xl hover:text-black hover:border-black/15 transition-all"
              >
                Write a Spill
              </Link>
              <Link
                href="/confess"
                className="px-8 py-3.5 border border-black/8 text-[10px] text-black/40 font-bold uppercase tracking-widest rounded-xl hover:text-black hover:border-black/15 transition-all"
              >
                Just Confess
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 border-t border-black/5 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="text-sm font-black serif">🫖 teaaa</span>
          <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-black/10">
            Anonymous. Unfiltered. Always.
          </p>
          <div className="flex gap-6">
            <Link
              href="/explore"
              className="text-[9px] font-bold uppercase tracking-widest text-black/15 hover:text-black transition-colors"
            >
              Explore
            </Link>
            <Link
              href="/confess"
              className="text-[9px] font-bold uppercase tracking-widest text-black/15 hover:text-black transition-colors"
            >
              Confess
            </Link>
            <Link
              href="/spill/create"
              className="text-[9px] font-bold uppercase tracking-widest text-black/15 hover:text-black transition-colors"
            >
              Write Spill
            </Link>
            <Link
              href="/create"
              className="text-[9px] font-bold uppercase tracking-widest text-black/15 hover:text-black transition-colors"
            >
              Create
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
