"use client";

import { useState, useMemo } from "react";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { THEMES } from "@/convex/helpers";
import { ArrowLeft, BookOpen, Plus } from "lucide-react";

export default function SpillLibraryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const isGlobal = slug === "global";
  
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const board = useQuery(api.boards.getBySlug, { slug });
  const spills = useQuery(
    isGlobal ? api.spills.listAllPublic : api.spills.listByBoard,
    isGlobal ? {} : (board ? { boardId: board._id } : "skip"),
  );

  const categories = useMemo(() => {
    if (!spills) return ["All"];
    const unique = new Set(spills.map((s: any) => s.category).filter(Boolean));
    return ["All", ...Array.from(unique)];
  }, [spills]);

  const filteredSpills = useMemo(() => {
    if (!spills) return [];
    if (selectedCategory === "All") return spills;
    return spills.filter((s: any) => s.category === selectedCategory);
  }, [spills, selectedCategory]);

  if (board === undefined || spills === undefined) {
    return (
      <div className="min-h-[100dvh] bg-[#f2ebe2] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black/10 border-t-black/40 rounded-full animate-spin" />
      </div>
    );
  }

  if (board === null) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center bg-[#f2ebe2]">
        <span className="text-5xl mb-4">😕</span>
        <h1 className="text-2xl font-bold mb-2 serif">Board not found</h1>
        <Link
          href="/"
          className="px-6 py-3 bg-black text-white rounded-xl text-sm font-medium mt-4"
        >
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[radial-gradient(circle_at_20%_10%,#f8f2e9_0%,#efe3d5_45%,#e7d8c8_100%)] text-[#1f1a16]">
      <header className="sticky top-0 z-30 border-b border-[#4c3b2b]/10 bg-[#f3e9dd]/85 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link
            href={`/b/${slug}`}
            className="inline-flex items-center gap-2 text-[#5b4736]/70 hover:text-[#2b221b] transition-colors"
          >
            <ArrowLeft size={17} />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em]">
              Back to Board
            </span>
          </Link>
          <span className="hidden sm:inline text-[10px] font-black uppercase tracking-[0.3em] text-[#5b4736]/60">
            Long Gossip Library
          </span>
          <Link
            href={`/b/${slug}/spill/create`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#2b221b] text-[#fff7ef] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-colors"
          >
            <Plus size={12} /> New Book
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="text-center mb-10">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#5f4a38]/60">
            {board.name}
          </p>
          <h1 className="serif text-4xl sm:text-5xl font-black tracking-tight mt-2 text-[#2e2218]">
            Long Gossip Shelf
          </h1>
          <p className="text-sm text-[#5f4a38]/80 max-w-xl mx-auto mt-3">
            Explore full-length anonymous stories with chapters and cover art.
            Tap any book to open it.
          </p>
        </div>

        {/* Categories Filter */}
        {spills && spills.length > 0 && categories.length > 1 && (
          <div className="flex overflow-x-auto pb-4 mb-6 gap-2 hide-scrollbar w-full" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style jsx>{`
              .hide-scrollbar::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <div className="flex gap-2 mx-auto sm:mx-0 px-2 sm:px-0">
              {categories.map((cat: any) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] whitespace-nowrap transition-colors ${
                    selectedCategory === cat 
                      ? 'bg-[#2b221b] text-[#fff7ef]' 
                      : 'bg-[#4c3b2b]/10 text-[#5f4a38] hover:bg-[#4c3b2b]/15'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {filteredSpills.length === 0 ? (
          <div className="max-w-md mx-auto text-center rounded-3xl border border-[#4c3b2b]/12 bg-[#fff9f1]/85 p-8 shadow-[0_16px_40px_rgba(57,37,17,0.08)]">
            <span className="text-4xl block mb-3">📚</span>
            <h2 className="serif text-2xl font-black text-[#2f241a]">
              No books yet
            </h2>
            <p className="text-sm text-[#6a5543]/80 mt-2 mb-6">
              Be the first to write a long gossip with chapters.
            </p>
            <Link
              href={`/b/${slug}/spill/create`}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#2b221b] text-[#fff7ef] text-[11px] font-black uppercase tracking-[0.18em]"
            >
              <BookOpen size={14} /> Create First Book
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSpills.map((spill: any) => {
              const theme =
                THEMES.find((entry) => entry.key === spill.coverTheme) ||
                THEMES[0];

              return (
                <Link
                  key={spill._id}
                  href={`/b/${slug}/s/${spill._id}`}
                  className="group block"
                >
                  <article className="rounded-3xl border border-[#4c3b2b]/12 bg-[#fff8ef]/80 p-4 shadow-[0_12px_30px_rgba(57,37,17,0.08)] hover:shadow-[0_20px_40px_rgba(57,37,17,0.16)] transition-all">
                    <div
                      className="relative mx-auto aspect-[3/4] max-w-[220px] rounded-r-2xl rounded-l-md border-l-[8px] border-black/15 overflow-hidden transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-[-1deg]"
                      style={{
                        background: spill.aiImageUrl
                          ? `url(${spill.aiImageUrl}) center/cover`
                          : theme.bg,
                      }}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-black/20 to-transparent" />
                      <div
                        className={`absolute inset-0 flex flex-col justify-between p-5 text-center ${spill.aiImageUrl ? "bg-black/35" : ""}`}
                      >
                        <span
                          className="text-[9px] font-black uppercase tracking-[0.28em]"
                          style={{
                            color: spill.aiImageUrl ? "#fff" : theme.accent,
                          }}
                        >
                          Long Gossip
                        </span>

                        <div>
                          {!spill.aiImageUrl && (
                            <div className="text-4xl mb-3">
                              {spill.coverEmoji}
                            </div>
                          )}
                          <h3
                            className="serif text-2xl font-black leading-[1.05]"
                            style={{
                              color: spill.aiImageUrl ? "#fff" : theme.text,
                            }}
                          >
                            {spill.title}
                          </h3>
                        </div>

                        <span
                          className="text-[10px] uppercase tracking-[0.2em] font-semibold"
                          style={{
                            color: spill.aiImageUrl ? "#e6dccc" : theme.text,
                          }}
                        >
                          Read Now
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 px-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#6a5543]/65 flex justify-between">
                        <span>Anonymous Author</span>
                        {spill.category && <span className="text-[#846b54] bg-[#ebdccf] px-1.5 py-0.5 rounded-sm">{spill.category}</span>}
                      </p>
                      <p className="text-xs text-[#5f4a38]/80 mt-1">
                        {(spill.views ?? 0).toLocaleString()} reads
                      </p>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
