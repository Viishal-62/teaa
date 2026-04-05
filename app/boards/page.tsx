"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Home, ArrowRight, Compass } from "lucide-react";
import { THEMES } from "@/convex/helpers";

function isNew(createdAt: number): boolean {
  return Date.now() - createdAt < 3 * 24 * 60 * 60 * 1000;
}

export default function BoardsPage() {
  const publicBoards = useQuery(api.boards.listPublicWithCounts);

  return (
    <div className="min-h-screen page-enter bg-[#faf8f5] text-[#111]">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-5 py-3 bg-[#faf8f5]/85 backdrop-blur-xl border-b border-black/5">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-black/35 hover:text-black transition-colors"
        >
          <Home size={16} />
        </Link>
        <h1 className="text-[10px] font-black uppercase tracking-[0.25em] text-black/25">
          Explore Boards
        </h1>
        <div className="flex items-center gap-3">
          <Link
            href="/explore"
            className="text-[10px] text-black/40 hover:text-black font-medium transition-colors flex items-center gap-1"
          >
            <Compass size={12} />
            Global Feed
          </Link>
          <Link
            href="/create"
            className="text-[10px] text-rose-600/60 hover:text-rose-600 font-medium transition-colors"
          >
            Create Board
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 pb-20">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tight serif text-black mb-2">
            All Boards
          </h1>
          <p className="text-sm font-medium text-black/40">
            Find an emotional space that resonates with you.
          </p>
        </div>

        {publicBoards === undefined ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-3 border-black/5 border-t-black/40 rounded-full animate-spin" />
          </div>
        ) : publicBoards.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-4xl block mb-4">😶‍🌫️</span>
            <p className="text-lg font-bold serif mb-1">No boards found</p>
            <p className="text-xs text-black/35 mb-6">
              Looks like it's quiet out here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {publicBoards.map((board) => {
              const theme = THEMES.find((t) => t.key === board.theme) || THEMES[0];
              const newlyCreated = isNew(board.createdAt);

              return (
                <Link
                  key={board._id}
                  href={`/b/${board.slug}`}
                  className="group relative flex flex-col p-5 rounded-2xl border border-black/5 bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner relative"
                      style={{ background: theme.bg }}
                    >
                      🫖
                      {/* New Badge */}
                      {newlyCreated && (
                        <div className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-md animate-pulse">
                          NEW
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-black/80 block leading-none tabular-nums">
                        {board.confessionCount + (board.spillCount ?? 0)}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-black/30">
                        Total
                      </span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-black group-hover:text-rose-600 transition-colors truncate">
                      {board.name}
                    </h3>
                    <p className="text-xs text-black/40 mt-1 line-clamp-2 leading-relaxed h-8">
                      {board.tagline ? `"${board.tagline}"` : "A space for secrets."}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-black/5 flex items-center justify-between">
                    <span className="text-[10px] font-medium text-black/30 uppercase tracking-widest">
                      {board.boardType === "secret-admirer" ? "💝 Admirer" : "💬 Standard"}
                    </span>
                    <ArrowRight
                      size={16}
                      className="text-black/20 group-hover:text-black/60 group-hover:translate-x-1 transition-all"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
