"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getCreatorToken, REACTION_INFO, SHARE_PROMPTS } from "@/app/lib/utils";
import { ArrowRight, Check, Copy, Home, Lock } from "lucide-react";
import Link from "next/link";

const THEMES = [
  {
    key: "midnight-rose",
    name: "Midnight Rose",
    emoji: "🌹",
    bg: "linear-gradient(135deg, #1a0e10, #2d1515)",
    accent: "#c43a3a",
  },
  {
    key: "moonlit",
    name: "Moonlit",
    emoji: "🌙",
    bg: "linear-gradient(135deg, #0e1320, #1a2035)",
    accent: "#d4a857",
  },
  {
    key: "forest-whisper",
    name: "Forest Whisper",
    emoji: "🌿",
    bg: "linear-gradient(135deg, #0e1a12, #152d1c)",
    accent: "#5a9e6f",
  },
  {
    key: "violet-hour",
    name: "Violet Hour",
    emoji: "🔮",
    bg: "linear-gradient(135deg, #130e1f, #1f132d)",
    accent: "#9b59b6",
  },
  {
    key: "noir",
    name: "Noir",
    emoji: "🖤",
    bg: "linear-gradient(135deg, #0a0a0a, #1a1a1a)",
    accent: "#ffffff",
  },
  {
    key: "chai-spill",
    name: "Chai Spill",
    emoji: "☕",
    bg: "linear-gradient(135deg, #1a1509, #2d2315)",
    accent: "#c4883a",
  },
];

export default function CreateBoard() {
  const router = useRouter();
  const createBoard = useMutation(api.boards.create);

  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [theme, setTheme] = useState("noir");
  const [isPublic, setIsPublic] = useState(true);
  const [pin, setPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [allowedReactions, setAllowedReactions] = useState<string[]>([
    "holding-you",
    "feels-heavy",
    "youll-be-ok",
    "no-it-burns",
  ]);
  const [sharePrompt, setSharePrompt] = useState(SHARE_PROMPTS[0].id);
  const [result, setResult] = useState<{ slug: string; pin?: string } | null>(
    null,
  );
  const [copied, setCopied] = useState(false);

  const suggestedSlugs =
    useQuery(api.boards.suggestSlugs, { name: name.trim() }) || [];
  const isNameAvailable = useQuery(api.boards.checkName, { name: name.trim() });

  const selectedTheme = THEMES.find((t) => t.key === theme)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const creatorToken = getCreatorToken();
      const res = await createBoard({
        name: name.trim(),
        tagline: tagline.trim(),
        theme,
        visibility: isPublic ? "public" : "private",
        pin: !isPublic ? pin : undefined,
        creatorToken,
        slug: selectedSlug || undefined,
        allowedReactions,
        sharePrompt,
      });
      setResult({ slug: res.slug, pin: !isPublic ? pin : undefined });
    } catch (error) {
      console.error("Failed to create board:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyLink = () => {
    if (!result) return;
    const url = `${window.location.origin}/b/${result.slug}`;
    const selectedPrompt =
      SHARE_PROMPTS.find((p) => p.id === sharePrompt)?.text || "";
    const textToCopy = selectedPrompt ? `${selectedPrompt} ${url}` : url;
    navigator.clipboard.writeText(textToCopy);

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Success screen ──
  if (result) {
    const boardUrl = `${window.location.origin}/b/${result.slug}`;
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-5 page-enter bg-[#faf8f5]">
        <div className="max-w-sm w-full">
          <div className="bg-white rounded-2xl border border-black/5 p-8 shadow-xl shadow-black/[0.03]">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-green-50 mx-auto mb-4 flex items-center justify-center text-2xl">
                ✅
              </div>
              <h2 className="text-xl font-black serif tracking-tight text-black mb-1">
                Your board is live!
              </h2>
              <p className="text-[11px] text-black/35 font-medium">
                Share this link and let people confess anonymously
              </p>
            </div>

            {/* Link copy */}
            <div className="flex items-center gap-2 p-2.5 bg-[#faf8f5] border border-black/5 rounded-xl mb-5">
              <div className="flex-1 truncate text-[11px] font-mono font-medium text-black/40 px-1">
                {boardUrl}
              </div>
              <button
                type="button"
                onClick={copyLink}
                className={`flex-shrink-0 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all active:scale-90 ${
                  copied
                    ? "bg-green-500 text-white"
                    : "bg-black text-white hover:scale-105"
                }`}
              >
                {copied ? (
                  <span className="flex items-center gap-1">
                    <Check size={11} /> Copied
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Copy size={11} /> Copy Share
                  </span>
                )}
              </button>
            </div>

            {/* PIN reminder for private boards */}
            {result.pin && (
              <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200/60 rounded-xl mb-5">
                <Lock size={14} className="text-amber-500 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-amber-700">
                    Private Board — PIN:{" "}
                    <span className="font-mono text-sm">{result.pin}</span>
                  </p>
                  <p className="text-[9px] text-amber-600/60">
                    Share this PIN with people who should see confessions
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Link
                href={`/b/${result.slug}`}
                className="group flex items-center justify-center gap-2 py-3 bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95"
              >
                Go to Board
                <ArrowRight
                  size={12}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setName("");
                  setTagline("");
                  setSelectedSlug("");
                }}
                className="py-3 text-[10px] text-black/30 font-bold uppercase tracking-widest hover:text-black transition-colors"
              >
                Create Another Board
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Create form ──
  return (
    <div className="min-h-screen page-enter bg-[#faf8f5] text-black">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-5 py-3 bg-[#faf8f5]/85 backdrop-blur-xl border-b border-black/5">
        <Link
          href="/"
          className="text-black/30 hover:text-black transition-colors"
        >
          <Home size={16} />
        </Link>
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-black/20">
          Create Board
        </span>
        <div className="w-4" />
      </header>

      <main className="max-w-lg mx-auto px-4 sm:px-5 py-6 sm:py-8">
        {/* Form card */}
        <div className="bg-white rounded-2xl border border-black/5 shadow-xl shadow-black/[0.03] overflow-hidden">
          {/* Theme preview header */}
          <div
            className="relative h-28 flex items-end justify-between p-5 transition-all duration-500"
            style={{ background: selectedTheme.bg }}
          >
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
            <div className="relative z-10">
              <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest mb-0.5">
                Preview
              </p>
              <h2 className="text-white text-lg font-bold serif tracking-tight leading-tight">
                {name || "Your Board"}
              </h2>
            </div>
            <span className="relative z-10 text-2xl">
              {selectedTheme.emoji}
            </span>
          </div>

          {/* Form body */}
          <div className="p-6 space-y-6">
            {/* Board Name */}
            <div>
              <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-black/30 mb-2 block">
                Board Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (selectedSlug) setSelectedSlug("");
                }}
                placeholder="e.g. Midnight Whispers"
                className={`w-full text-sm font-semibold bg-[#faf8f5] border rounded-xl px-4 py-3 outline-none transition-all placeholder:text-black/15 ${
                  name.trim().length > 0 && isNameAvailable === false
                    ? "border-red-300 focus:ring-2 focus:ring-red-100"
                    : "border-black/5 focus:border-black/15 focus:ring-2 focus:ring-black/5"
                }`}
              />
              {name.trim().length > 0 && isNameAvailable === false && (
                <p className="text-[10px] text-red-500 font-bold mt-2 ml-1">
                  This board name is already taken. Try adding some flair!
                </p>
              )}
            </div>
            {/* Slug Suggestions */}
            {name.trim().length > 2 && suggestedSlugs.length > 0 && (
              <div className="mt-[-12px]">
                <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-black/30 mb-2 block">
                  Pick a catchy link (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {suggestedSlugs.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSlug(s)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                        selectedSlug === s
                          ? "bg-black text-white"
                          : "bg-black/5 text-black/50 hover:bg-black/10 hover:text-black"
                      }`}
                    >
                      teaaa.app/b/{s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tagline */}
            <div>
              <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-black/30 mb-2 block">
                Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Tell me anything, stay anonymous..."
                className="w-full text-sm font-medium bg-[#faf8f5] border border-black/5 rounded-xl px-4 py-3 outline-none focus:border-black/15 focus:ring-2 focus:ring-black/5 transition-all placeholder:text-black/15 italic"
              />
            </div>

            {/* Custom Reactions */}
            <div>
              <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-black/30 mb-2 block">
                Choose 4 Reactions for your board
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(REACTION_INFO)
                  .filter(([k]) => k !== "me-too")
                  .map(([k, v]) => {
                    const isSelected = allowedReactions.includes(k);
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setAllowedReactions(
                              allowedReactions.filter((r) => r !== k),
                            );
                          } else if (allowedReactions.length < 4) {
                            setAllowedReactions([...allowedReactions, k]);
                          }
                        }}
                        className={`px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all ${
                          isSelected
                            ? "bg-green-100 text-green-900 border border-green-200"
                            : "bg-white border border-black/10 text-black/50 hover:border-black/20"
                        } ${!isSelected && allowedReactions.length >= 4 ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <span>{v.emoji}</span>
                        <span className="font-semibold text-[10px]">
                          {v.label}
                        </span>
                      </button>
                    );
                  })}
              </div>
              <p className="text-[9px] text-black/30 font-medium mt-1.5">
                {allowedReactions.length === 4
                  ? "✅ 4/4 selected"
                  : `${allowedReactions.length}/4 selected (Must select exactly 4)`}
              </p>
            </div>

            {/* Share Prompt */}
            <div>
              <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-black/30 mb-2 block">
                Social Media sharing text
              </label>
              <div className="space-y-2">
                {SHARE_PROMPTS.map((p) => (
                  <label
                    key={p.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      sharePrompt === p.id
                        ? "bg-black/5 border-black/20"
                        : "bg-white border-black/5 hover:border-black/15"
                    }`}
                  >
                    <input
                      type="radio"
                      name="sharePrompt"
                      value={p.id}
                      checked={sharePrompt === p.id}
                      onChange={() => setSharePrompt(p.id)}
                      className="mt-1"
                    />
                    <span className="text-[11px] font-medium text-black/70 leading-relaxed">
                      {p.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Theme selector */}
            <div>
              <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-black/30 mb-3 block">
                Choose a vibe
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTheme(t.key)}
                    className={`relative flex items-center gap-2.5 p-3 rounded-xl transition-all ${
                      theme === t.key
                        ? "bg-black text-white shadow-md shadow-black/10"
                        : "bg-[#faf8f5] border border-black/5 text-black/50 hover:text-black hover:border-black/10"
                    }`}
                  >
                    <span className="text-base">{t.emoji}</span>
                    <span className="text-[10px] font-bold truncate">
                      {t.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Public/Private toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#faf8f5]">
              <div>
                <div className="text-xs font-bold text-black/60">
                  Public Board
                </div>
                <div className="text-[9px] text-black/25 font-medium mt-0.5">
                  {isPublic
                    ? "Visible in explore feed"
                    : "Hidden — PIN required to view"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                  isPublic ? "bg-black" : "bg-black/10"
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${
                    isPublic ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>

            {/* PIN input (private boards) */}
            {!isPublic && (
              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/30">
                <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-amber-700/50 mb-2 flex items-center gap-1.5">
                  <Lock size={10} />
                  Set a PIN (4-6 digits) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={pin}
                  onChange={(e) =>
                    setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="e.g. 1234"
                  className="w-full text-2xl font-mono font-bold text-center tracking-[0.5em] bg-white border border-amber-200/50 rounded-xl px-4 py-3 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200/50 transition-all placeholder:text-black/10 placeholder:tracking-normal placeholder:text-sm"
                />
                <p className="text-[9px] text-amber-600/40 font-medium mt-1.5">
                  Visitors need this PIN to view confessions on your board
                </p>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="px-6 pb-6">
            <button
              type="submit"
              disabled={
                !name.trim() ||
                isSubmitting ||
                isNameAvailable === false ||
                (!isPublic && pin.length < 4)
              }
              onClick={handleSubmit}
              className="w-full py-4 bg-black text-white rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-15 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Board
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
