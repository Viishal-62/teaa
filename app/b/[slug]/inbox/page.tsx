"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CATEGORY_INFO, getCreatorToken, timeAgo } from "@/app/lib/utils";
import { ArrowLeft, MailOpen, Sparkles, SlidersHorizontal, X, MapPin, Briefcase, Heart, Search, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function BoardInboxPage() {
  const params = useParams();
  const slug = params.slug as string;

  const board = useQuery(api.boards.getBySlug, { slug });
  const creatorToken = typeof window !== "undefined" ? getCreatorToken() : "";
  const markInboxSeen = useMutation(api.boards.markInboxSeen);
  const hasMarked = useRef(false);

  const isOwner = !!board && board.creatorToken === creatorToken;
  const isPublic = board?.visibility !== "private";
  const canView = isOwner || isPublic;

  const inbox = useQuery(
    api.confessions.listInboxByBoard,
    board && canView ? { boardId: board._id, creatorToken } : "skip",
  );

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedProfession, setSelectedProfession] = useState<string | null>(null);
  const [selectedContext, setSelectedContext] = useState<string | null>(null);
  const [showContextFilters, setShowContextFilters] = useState(false);
  const [inboxContextSearch, setInboxContextSearch] = useState("");

  const existingCategories = useMemo(() => {
    if (!inbox?.rows) return [];
    const cats = new Set(inbox.rows.map((r: any) => r.category));
    return Array.from(cats);
  }, [inbox?.rows]);

  // Collect available cities, professions, contexts from inbox data
  const inboxContextData = useMemo(() => {
    if (!inbox?.rows) return { cities: [], professions: [], contexts: [] };
    const cityMap: Record<string, number> = {};
    const profMap: Record<string, number> = {};
    const ctxMap: Record<string, number> = {};
    for (const r of inbox.rows) {
      if (r.cityId) cityMap[r.cityId] = (cityMap[r.cityId] || 0) + 1;
      if (r.professionId) profMap[r.professionId] = (profMap[r.professionId] || 0) + 1;
      if (r.contextId) ctxMap[r.contextId] = (ctxMap[r.contextId] || 0) + 1;
    }
    const toSorted = (obj: Record<string, number>) =>
      Object.entries(obj).map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
    return { cities: toSorted(cityMap), professions: toSorted(profMap), contexts: toSorted(ctxMap) };
  }, [inbox?.rows]);

  const hasContextData = inboxContextData.cities.length > 0 || inboxContextData.professions.length > 0 || inboxContextData.contexts.length > 0;
  const activeContextFilterCount = [selectedCity, selectedProfession, selectedContext].filter(Boolean).length;

  const filteredInbox = useMemo(() => {
    if (!inbox?.rows) return [];
    let rows = inbox.rows;
    if (categoryFilter !== "all") rows = rows.filter((r: any) => r.category === categoryFilter);
    if (selectedCity) rows = rows.filter((r: any) => r.cityId === selectedCity);
    if (selectedProfession) rows = rows.filter((r: any) => r.professionId === selectedProfession);
    if (selectedContext) rows = rows.filter((r: any) => r.contextId === selectedContext);
    return rows;
  }, [inbox?.rows, categoryFilter, selectedCity, selectedProfession, selectedContext]);

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

  if (!canView) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf8f5] text-center px-6">
        <p className="text-5xl mb-3">🔒</p>
        <h1 className="text-2xl font-black serif">Private Inbox</h1>
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
          {isOwner ? "Creator Inbox" : "Public Inbox"}
        </h1>
        <div className="flex items-center gap-2">
          {hasContextData && (
            <button
              type="button"
              onClick={() => setShowContextFilters(!showContextFilters)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all active:scale-95 border border-black/8 hover:border-black/15 text-black/40 hover:text-black"
            >
              <SlidersHorizontal size={10} />
              {activeContextFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-black text-white text-[8px] flex items-center justify-center font-black">
                  {activeContextFilterCount}
                </span>
              )}
            </button>
          )}
          {inbox && inbox.rows.length > 0 && (
             <div className="relative p-[1.5px] rounded-full bg-gradient-to-r from-rose-400 via-fuchsia-500 to-indigo-500 shadow-sm max-w-[130px] sm:max-w-xs shrink-0">
               <select
                 value={categoryFilter}
                 onChange={(e) => setCategoryFilter(e.target.value)}
                 className="bg-[#faf8f5] text-[9px] font-bold uppercase tracking-widest pl-3 pr-6 py-1.5 rounded-full outline-none appearance-none cursor-pointer text-black/70 hover:text-black transition-colors w-full truncate"
                 style={{
                    backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2300000044%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 8px top 50%",
                    backgroundSize: "6px auto",
                 }}
               >
                 <option value="all">All Teas</option>
                 {existingCategories.map((cat: any) => {
                   const info = CATEGORY_INFO[cat];
                   return <option key={cat} value={cat}>{info ? info.label : cat}</option>;
                 })}
               </select>
             </div>
          )}
          <span className="text-[10px] font-bold text-black/20">
            {filteredInbox.length}
          </span>
        </div>
      </header>

      {/* Context Filters Panel */}
      <AnimatePresence>
        {showContextFilters && hasContextData && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-black/5 bg-white/60 backdrop-blur-xl"
          >
            <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
              {/* Search + Clear */}
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/20" />
                  <input
                    type="text"
                    value={inboxContextSearch}
                    onChange={(e) => setInboxContextSearch(e.target.value)}
                    placeholder="Search city, profession, context..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-black/8 bg-white text-[10px] text-black placeholder:text-black/25 outline-none focus:border-black/20 transition-colors"
                  />
                </div>
                {activeContextFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={() => { setSelectedCity(null); setSelectedProfession(null); setSelectedContext(null); setInboxContextSearch(""); }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 transition-all active:scale-95 whitespace-nowrap"
                  >
                    <X size={10} /> Clear
                  </button>
                )}
              </div>

              {(() => {
                const q = inboxContextSearch.toLowerCase().trim();
                const filterItems = (items: Array<{key: string, count: number}>) =>
                  q ? items.filter(i => i.key.toLowerCase().includes(q)) : items;

                const fc = filterItems(inboxContextData.cities);
                const fp = filterItems(inboxContextData.professions);
                const fx = filterItems(inboxContextData.contexts);

                if (q && fc.length + fp.length + fx.length === 0) {
                  return (
                    <div className="text-center py-4">
                      <span className="text-2xl block mb-1">🫖</span>
                      <p className="text-[11px] font-bold text-black/50 mb-1">No teas from “{inboxContextSearch}” yet</p>
                      <p className="text-[10px] text-black/25 mb-3">Be the first to spill!</p>
                      <Link
                        href={`/b/${slug}/confess`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-lg text-[9px] font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                      >
                        <Plus size={10} /> Drop a Tea
                      </Link>
                    </div>
                  );
                }

                const LIMIT = 4;
                const showAll = q.length > 0;

                const renderSection = (
                  items: Array<{key: string, count: number}>,
                  icon: React.ReactNode,
                  label: string,
                  emoji: string,
                  value: string | null,
                  setter: (v: string | null) => void,
                  activeColor: string,
                ) => {
                  if (items.length === 0) return null;
                  const visible = showAll ? items : items.slice(0, LIMIT);
                  const hidden = items.length - LIMIT;
                  return (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        {icon}
                        <span className="text-[8px] font-black uppercase tracking-[0.15em] text-black/25">{label}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {visible.map((item) => {
                          const isActive = value === item.key;
                          return (
                            <button key={item.key} type="button" onClick={() => setter(isActive ? null : item.key)}
                              className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all active:scale-95 border ${isActive ? `${activeColor} text-white border-transparent` : "bg-white border-black/8 text-black/50 hover:border-black/20"}`}
                            >
                              {emoji} {item.key} <span className={`text-[8px] ${isActive ? "text-white/70" : "text-black/20"}`}>{item.count}</span>
                            </button>
                          );
                        })}
                        {!showAll && hidden > 0 && (
                          <button type="button" onClick={() => setInboxContextSearch(" ")}
                            className="px-2.5 py-1 rounded-full text-[9px] font-bold text-black/30 bg-black/[0.03] hover:bg-black/[0.06] transition-all active:scale-95"
                          >
                            +{hidden} more
                          </button>
                        )}
                      </div>
                    </div>
                  );
                };

                return (
                  <>
                    {renderSection(fc, <MapPin size={10} className="text-black/25" />, "City", "📍", selectedCity, setSelectedCity, "bg-blue-500")}
                    {renderSection(fp, <Briefcase size={10} className="text-black/25" />, "Profession", "💼", selectedProfession, setSelectedProfession, "bg-amber-500")}
                    {renderSection(fx, <Heart size={10} className="text-black/25" />, "About", "🫂", selectedContext, setSelectedContext, "bg-purple-500")}
                  </>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-2xl mx-auto px-4 sm:px-5 py-8">
        <div className="mb-6 text-center">
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-accent mb-2">
            {board.name}
          </p>
          <h2 className="text-3xl font-black serif tracking-tight">Inbox</h2>
          <p className="text-xs text-black/35 mt-1">
            {isOwner ? "Fresh confessions, marked unread until you open this page." : "Public feed of dropping teas."}
          </p>
        </div>

        {inbox && inbox.rows.length > 0 ? (
          <div className="relative">
            <div className={`space-y-3 ${filteredInbox.length > 4 ? "max-h-[500px] overflow-y-auto pr-2 pb-10 scrollbar-hide" : ""}`}
                 style={filteredInbox.length > 4 ? {
                   WebkitOverflowScrolling: "touch",
                   scrollbarWidth: "none",
                   msOverflowStyle: "none",
                 } : {}}>
              <style>{`
                ::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              {filteredInbox.length === 0 ? (
                <div className="py-10 text-center text-sm font-medium text-black/40">
                  No teas found for this filter.
                </div>
              ) : (
                filteredInbox.map((confession: any) => {
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {catInfo && (
                        <span
                          className="text-[8px] font-bold uppercase tracking-wider px-2 py-1 rounded-full whitespace-nowrap"
                          style={{
                            background: `${catInfo.color}14`,
                            color: catInfo.color,
                          }}
                        >
                          {catInfo.label}
                        </span>
                      )}
                      {confession.cityId && (
                        <span className="text-[8px] px-2 py-1 rounded-full font-bold uppercase tracking-wider bg-black/5 text-black/50 whitespace-nowrap">
                          📍 {confession.cityId}
                        </span>
                      )}
                      {confession.professionId && (
                        <span className="text-[8px] px-2 py-1 rounded-full font-bold uppercase tracking-wider bg-black/5 text-black/50 whitespace-nowrap">
                          💼 {confession.professionId}
                        </span>
                      )}
                      {confession.contextId && (
                        <span className="text-[8px] px-2 py-1 rounded-full font-bold uppercase tracking-wider bg-black/5 text-black/50 whitespace-nowrap max-w-[120px] truncate">
                          🫂 {confession.contextId}
                        </span>
                      )}
                      {isOwner && confession.isUnread && (
                        <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-accent whitespace-nowrap bg-accent/10 px-2 py-1 rounded-full">
                          <Sparkles size={10} />
                          Unread
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-black/25 font-medium whitespace-nowrap shrink-0">
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
            })
            )}
            </div>
            {filteredInbox.length > 4 && (
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#faf8f5] to-transparent pointer-events-none flex items-end justify-center pb-2 text-black/20 text-[10px] font-bold uppercase tracking-widest">
                ⬇ Scroll for more
              </div>
            )}
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
