"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CATEGORY_INFO, getCreatorToken, timeAgo } from "@/app/lib/utils";
import { ArrowLeft, MailOpen, Sparkles } from "lucide-react";

export default function BoardInboxPage() {
  const params = useParams();
  const slug = params.slug as string;

  const board = useQuery(api.boards.getBySlug, { slug });
  const creatorToken = typeof window !== "undefined" ? getCreatorToken() : "";
  const markInboxSeen = useMutation(api.boards.markInboxSeen);
  const hasMarked = useRef(false);

  const isOwner = !!board && board.creatorToken === creatorToken;

  const inbox = useQuery(
    api.confessions.listInboxByBoard,
    board && isOwner ? { boardId: board._id, creatorToken } : "skip",
  );

  useEffect(() => {
    if (!board || !isOwner || hasMarked.current) return;
    hasMarked.current = true;
    markInboxSeen({ boardId: board._id, creatorToken }).catch(() => {
      hasMarked.current = false;
    });
  }, [board, creatorToken, isOwner, markInboxSeen]);

  if (board === undefined || (isOwner && inbox === undefined)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f5]">
        <div className="w-8 h-8 border-2 border-black/10 border-t-black/40 rounded-full animate-spin" />
      </div>
    );
  }

  if (board === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf8f5] text-center px-6">
        <p className="text-5xl mb-3">🫣</p>
        <h1 className="text-2xl font-black serif">Board not found</h1>
        <Link
          href="/"
          className="mt-5 px-6 py-3 rounded-xl bg-black text-white text-sm font-bold"
        >
          Go Home
        </Link>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf8f5] text-center px-6">
        <p className="text-5xl mb-3">🔒</p>
        <h1 className="text-2xl font-black serif">Creator Inbox Only</h1>
        <p className="text-sm text-black/40 mt-1">
          This inbox is visible only to the board owner.
        </p>
        <Link
          href={`/b/${slug}`}
          className="mt-5 px-6 py-3 rounded-xl bg-black text-white text-sm font-bold"
        >
          Back to Board
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] text-black">
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-5 py-3 bg-[#faf8f5]/85 backdrop-blur-xl border-b border-black/5">
        <Link
          href={`/b/${slug}`}
          className="flex items-center gap-1.5 text-black/35 hover:text-black transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <h1 className="text-[10px] font-black uppercase tracking-[0.25em] text-black/25">
          Creator Inbox
        </h1>
        <span className="text-[10px] font-bold text-black/20">
          {inbox?.rows.length ?? 0}
        </span>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-5 py-8">
        <div className="mb-6 text-center">
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-accent mb-2">
            {board.name}
          </p>
          <h2 className="text-3xl font-black serif tracking-tight">Inbox</h2>
          <p className="text-xs text-black/35 mt-1">
            Fresh confessions, marked unread until you open this page.
          </p>
        </div>

        {inbox && inbox.rows.length > 0 ? (
          <div className="space-y-3">
            {inbox.rows.map((confession) => {
              const catInfo = CATEGORY_INFO[confession.category];
              return (
                <Link
                  key={confession._id}
                  href={`/b/${slug}/c/${confession._id}`}
                  className={`block rounded-2xl border p-4 transition-all ${
                    confession.isUnread
                      ? "bg-white border-black/15 shadow-lg shadow-black/[0.03]"
                      : "bg-white/80 border-black/6 hover:border-black/12"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {catInfo && (
                        <span
                          className="text-[8px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
                          style={{
                            background: `${catInfo.color}14`,
                            color: catInfo.color,
                          }}
                        >
                          {catInfo.label}
                        </span>
                      )}
                      {confession.isUnread && (
                        <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-accent">
                          <Sparkles size={10} />
                          Unread
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-black/25 font-medium">
                      {timeAgo(confession.createdAt)}
                    </span>
                  </div>

                  <p className="serif text-sm text-black/70 leading-relaxed line-clamp-3">
                    {confession.text}
                  </p>

                  <div className="mt-3 text-[10px] text-black/20 font-semibold uppercase tracking-wider">
                    by {confession.displayName}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-black/8 bg-white p-10 text-center">
            <MailOpen size={22} className="mx-auto text-black/25 mb-2" />
            <p className="text-sm font-bold text-black/45">Inbox is quiet</p>
            <p className="text-xs text-black/25 mt-1">
              New confessions will show up here in real time.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
