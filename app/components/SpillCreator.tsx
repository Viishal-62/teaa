"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { THEMES, type ThemeKey } from "@/convex/helpers";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Image as ImageIcon,
  Minus,
  Plus,
  Sparkles,
  X,
  Eye,
  Flame,
  AlertTriangle,
  Type,
  FileText,
  PenTool,
  Upload,
} from "lucide-react";
import ImageCropper from "./ImageCropper";

/* ─── Constants ─── */

const MAX_PAGES = 10;
const MAX_WORDS_PER_PAGE = 300;
const MIN_TOTAL_WORDS = 100;
const MAX_AI_GENERATIONS = 5;

const EMOJI_OPTIONS = [
  "\u{1F4D6}",
  "\u{1F48C}",
  "\u{1F525}",
  "\u{1F375}",
  "\u{1F3AD}",
  "\u{1F5A4}",
  "\u{1F319}",
  "\u{2728}",
  "\u{1F56F}\u{FE0F}",
  "\u{1F440}",
];

type DraftPage = {
  title: string;
  text: string;
};

type AiPromptMode = "title" | "context" | "custom";

type SpillCreatorProps = {
  mode: "global" | "board";
  slug?: string;
};

/* ─── Step Transition Variants ─── */

const stepVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 60 : -60,
    opacity: 0,
    filter: "blur(4px)",
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: "blur(0px)",
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -60 : 60,
    opacity: 0,
    filter: "blur(4px)",
  }),
};

/* ─── Component ─── */

export default function SpillCreator({ mode, slug }: SpillCreatorProps) {
  const router = useRouter();

  /* Convex */
  const publicBoards = useQuery(api.boards.listPublic);
  const board = useQuery(
    api.boards.getBySlug,
    mode === "board" && slug ? { slug } : "skip",
  );

  const createSpill = useMutation(api.spills.create);
  const addChapter = useMutation(api.chapters.add);
  const updateCoverImage = useMutation(api.spills.updateCoverImage);
  const getOrCreateGlobal = useMutation(api.boards.getOrCreateGlobal);

  /* State */
  const [step, setStep] = useState(1);
  const [stepDir, setStepDir] = useState(1);

  // Cover
  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState<ThemeKey>(THEMES[0].key);
  const [emoji, setEmoji] = useState("\u{1F525}");
  const [aiImageUrl, setAiImageUrl] = useState("");
  const [remainingGenerations, setRemainingGenerations] =
    useState(MAX_AI_GENERATIONS);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [aiPromptMode, setAiPromptMode] = useState<AiPromptMode>("title");
  const [customAiPrompt, setCustomAiPrompt] = useState("");
  const [aiError, setAiError] = useState("");

  // Upload/Crop
  const [showCropper, setShowCropper] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Pages
  const [pages, setPages] = useState<DraftPage[]>([{ title: "", text: "" }]);
  const [activePage, setActivePage] = useState(0);

  // Publish
  const [selectedBoardId, setSelectedBoardId] = useState<string>(
    mode === "board" ? "__current__" : "",
  );
  const [showBoardPicker, setShowBoardPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* Derived */
  const selectedTheme = THEMES.find((t) => t.key === theme) || THEMES[0];
  const activePageData = pages[activePage];

  const pageWordCounts = useMemo(
    () =>
      pages.map((p) => (p.text.trim() ? p.text.trim().split(/\s+/).length : 0)),
    [pages],
  );
  const totalWords = useMemo(
    () => pageWordCounts.reduce((s, c) => s + c, 0),
    [pageWordCounts],
  );
  const currentWordCount = pageWordCounts[activePage] || 0;
  const isOverLimit = currentWordCount > MAX_WORDS_PER_PAGE;
  const isBelowMinimum = totalWords < MIN_TOTAL_WORDS && totalWords > 0;

  // Get all story text for "context" mode
  const allStoryText = useMemo(
    () =>
      pages
        .map((p) => p.text.trim())
        .filter(Boolean)
        .join("\n\n"),
    [pages],
  );

  /* Navigation */
  /* ─── Upload & Crop Handlers ─── */

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCropImageSrc(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (blob: Blob) => {
    setShowCropper(false);
    setIsUploading(true);
    setAiError("");

    try {
      // Convert blob to base64 data URI
      const dataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Upload to Cloudinary via our API route
      const res = await fetch("/api/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUri, folder: "spill-covers" }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Upload failed");
      }

      const { url } = await res.json();
      setAiImageUrl(url);
    } catch (err) {
      console.error(err);
      setAiError(
        err instanceof Error
          ? err.message
          : "Failed to upload image. Please try again.",
      );
    } finally {
      setIsUploading(false);
      setCropImageSrc(null);
    }
  };

  const goNext = useCallback(() => {
    if (step < 3) {
      setStepDir(1);
      setStep((s) => s + 1);
    }
  }, [step]);

  const goBack = useCallback(() => {
    if (step > 1) {
      setStepDir(-1);
      setStep((s) => s - 1);
    }
  }, [step]);

  const canProceedStep1 = title.trim().length > 0;
  const canProceedStep2 =
    pages.length > 0 &&
    pages.every((p) => p.text.trim().length > 0) &&
    pageWordCounts.every((w) => w <= MAX_WORDS_PER_PAGE) &&
    totalWords >= MIN_TOTAL_WORDS;

  /* Page management */
  const updatePage = (index: number, field: keyof DraftPage, value: string) => {
    setPages((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addPage = () => {
    if (pages.length >= MAX_PAGES) return;
    setPages((prev) => [...prev, { title: "", text: "" }]);
    setActivePage(pages.length);
  };

  const removePage = (index: number) => {
    if (pages.length <= 1) return;
    setPages((prev) => prev.filter((_, i) => i !== index));
    setActivePage((prev) => {
      if (index < prev) return prev - 1;
      if (index === prev) return Math.max(0, prev - 1);
      return prev;
    });
  };

  /* AI Cover */
  const generateCover = async () => {
    if (remainingGenerations <= 0 || !title.trim() || isGeneratingCover) return;

    // Validate custom prompt mode
    if (aiPromptMode === "custom" && !customAiPrompt.trim()) {
      setAiError("Write a custom prompt first!");
      return;
    }

    // Validate context mode — need at least some text
    if (aiPromptMode === "context" && allStoryText.length < 20) {
      setAiError("Write some story pages first so AI can use the context!");
      return;
    }

    setIsGeneratingCover(true);
    setAiError("");

    try {
      const body: Record<string, string> = { title: title.trim() };

      if (aiPromptMode === "context" && allStoryText) {
        body.context = allStoryText;
      }
      if (aiPromptMode === "custom" && customAiPrompt.trim()) {
        body.custom = customAiPrompt.trim();
      }

      const res = await fetch("/api/generate-cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.imageUrl) {
          setAiImageUrl(data.imageUrl);
          setRemainingGenerations((prev) => prev - 1);
          setAiError("");
        } else {
          setAiError("No image was generated. Try again.");
        }
      } else {
        const errData = await res.json().catch(() => null);
        setAiError(errData?.error || "Failed to generate. Try again.");
      }
    } catch (err) {
      console.error("Cover generation failed:", err);
      setAiError("Network error. Check your connection and try again.");
    } finally {
      setIsGeneratingCover(false);
    }
  };

  /* Publish */
  const publishSpill = async () => {
    if (isSubmitting || !title.trim()) return;

    // Edge case: empty pages
    const emptyPages = pages.filter((p) => !p.text.trim());
    if (emptyPages.length > 0) {
      alert(
        `You have ${emptyPages.length} empty page${emptyPages.length > 1 ? "s" : ""}. Write something on every page.`,
      );
      return;
    }

    // Edge case: over word limit
    const overLimitPages = pageWordCounts
      .map((w, i) => ({ w, i }))
      .filter((p) => p.w > MAX_WORDS_PER_PAGE);
    if (overLimitPages.length > 0) {
      alert(
        `Page${overLimitPages.length > 1 ? "s" : ""} ${overLimitPages.map((p) => p.i + 1).join(", ")} exceed${overLimitPages.length === 1 ? "s" : ""} the ${MAX_WORDS_PER_PAGE}-word limit.`,
      );
      return;
    }

    // Edge case: below minimum total
    if (totalWords < MIN_TOTAL_WORDS) {
      alert(
        `Your spill only has ${totalWords} words. Write at least ${MIN_TOTAL_WORDS} words across all pages to publish.`,
      );
      return;
    }

    setIsSubmitting(true);
    try {
      let boardId: Id<"boards">;
      if (mode === "board" && board) {
        boardId = board._id;
      } else if (selectedBoardId && selectedBoardId !== "__current__") {
        boardId = selectedBoardId as Id<"boards">;
      } else {
        boardId = await getOrCreateGlobal();
      }

      const res = await createSpill({
        boardId,
        title: title.trim(),
        coverTheme: theme,
        coverEmoji: emoji,
      });

      if (aiImageUrl) {
        await updateCoverImage({
          spillId: res.spillId,
          imageUrl: aiImageUrl,
        });
      }

      for (let i = 0; i < pages.length; i++) {
        await addChapter({
          spillId: res.spillId,
          chapterNumber: i + 1,
          title: pages[i].title || undefined,
          text: pages[i].text,
        });
      }

      const targetSlug =
        mode === "board" && slug
          ? slug
          : publicBoards?.find((b: any) => b._id === selectedBoardId)?.slug ||
            "global";
      router.push(`/b/${targetSlug}/s/${res.spillId}`);
    } catch (err: any) {
      console.error(err);
      // Try to parse moderation error
      try {
        const errMsg = err?.message || err?.data?.message || "";
        const errData = JSON.parse(errMsg);
        if (errData.type === "moderation_error") {
          const words = errData.flaggedWords
            ?.map((f: any) => f.word)
            .join(", ");
          alert(`🛡️ ${errData.message}\n\nFlagged words: ${words}`);
          return;
        }
      } catch {
        // Not a moderation error
      }
      alert("Failed to publish. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* Back destination */
  const backHref = mode === "board" && slug ? `/b/${slug}` : "/confess";

  /* ─── Loading ─── */
  if (mode === "board" && board === undefined) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-black/10 border-t-black/40 rounded-full animate-spin" />
      </div>
    );
  }

  if (mode === "board" && board === null) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 text-black/50">
        <span className="text-4xl">😕</span>
        <p className="text-sm font-medium">Board not found</p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="px-5 py-2.5 rounded-full bg-black/5 text-xs font-bold uppercase tracking-wider hover:bg-black/10 transition-colors"
        >
          Go Home
        </button>
      </div>
    );
  }

  /* ──────────────────────────── RENDER ──────────────────────────── */

  return (
    <div className="min-h-screen bg-white text-[#111] selection:bg-black/10">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px] opacity-[0.06]"
          style={{ background: selectedTheme.accent }}
        />
      </div>

      {/* ─── Header ─── */}
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white/85 backdrop-blur-2xl">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => (step > 1 ? goBack() : router.push(backHref))}
            className="inline-flex items-center gap-2 text-black/35 hover:text-black/60 transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
              {step > 1 ? "Back" : "Cancel"}
            </span>
          </button>

          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 rounded-full transition-all duration-500 ${
                  s === step
                    ? "w-6 bg-black/50"
                    : s < step
                      ? "w-3 bg-black/20"
                      : "w-3 bg-black/8"
                }`}
              />
            ))}
          </div>

          <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-black/30">
            Step {step}/3
          </span>
        </div>
      </header>

      {/* ─── Content ─── */}
      <main className="relative max-w-2xl mx-auto px-4 sm:px-6 pt-8 pb-32">
        <AnimatePresence mode="wait" custom={stepDir}>
          {step === 1 && (
            <motion.div
              key="step-1"
              custom={stepDir}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <StepCover
                title={title}
                setTitle={setTitle}
                theme={theme}
                setTheme={setTheme}
                emoji={emoji}
                setEmoji={setEmoji}
                aiImageUrl={aiImageUrl}
                isGeneratingCover={isGeneratingCover}
                remainingGenerations={remainingGenerations}
                generateCover={generateCover}
                selectedTheme={selectedTheme}
                aiPromptMode={aiPromptMode}
                setAiPromptMode={setAiPromptMode}
                customAiPrompt={customAiPrompt}
                setCustomAiPrompt={setCustomAiPrompt}
                aiError={aiError}
                hasStoryContent={allStoryText.length > 20}
                onFileSelect={onFileSelect}
                isUploading={isUploading}
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              custom={stepDir}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <StepPages
                pages={pages}
                activePage={activePage}
                setActivePage={setActivePage}
                activePageData={activePageData}
                currentWordCount={currentWordCount}
                isOverLimit={isOverLimit}
                totalWords={totalWords}
                isBelowMinimum={isBelowMinimum}
                updatePage={updatePage}
                addPage={addPage}
                removePage={removePage}
              />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step-3"
              custom={stepDir}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <StepReview
                title={title}
                pages={pages}
                totalWords={totalWords}
                aiImageUrl={aiImageUrl}
                selectedTheme={selectedTheme}
                emoji={emoji}
                mode={mode}
                slug={slug}
                publicBoards={publicBoards}
                selectedBoardId={selectedBoardId}
                setSelectedBoardId={setSelectedBoardId}
                showBoardPicker={showBoardPicker}
                setShowBoardPicker={setShowBoardPicker}
                isSubmitting={isSubmitting}
                publishSpill={publishSpill}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ─── Bottom bar ─── */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-black/5 bg-white/90 backdrop-blur-2xl">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          {step === 1 && (
            <>
              <div />
              <button
                type="button"
                onClick={goNext}
                disabled={!canProceedStep1}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-black text-white text-[11px] font-black uppercase tracking-[0.18em] disabled:opacity-20 transition-all hover:bg-black/90 hover:scale-[1.02] active:scale-[0.98]"
              >
                Write Pages <ArrowRight size={14} />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-black/35 uppercase tracking-wider">
                  {pages.length}/{MAX_PAGES} pages · {totalWords} words
                </span>
                {isBelowMinimum && (
                  <span className="text-[9px] text-orange-500/70 font-medium mt-0.5">
                    Need {MIN_TOTAL_WORDS - totalWords} more words
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={goNext}
                disabled={!canProceedStep2}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-black text-white text-[11px] font-black uppercase tracking-[0.18em] disabled:opacity-20 transition-all hover:bg-black/90 hover:scale-[1.02] active:scale-[0.98]"
              >
                Review <Eye size={14} />
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <span className="text-[10px] font-bold text-black/35 uppercase tracking-wider">
                {pages.length} pages · {totalWords} words
              </span>
              <button
                type="button"
                onClick={publishSpill}
                disabled={isSubmitting || !canProceedStep2}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[11px] font-black uppercase tracking-[0.18em] disabled:opacity-30 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-orange-500/20"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Flame size={14} /> Publish Spill
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showCropper && cropImageSrc && (
          <ImageCropper
            imageSrc={cropImageSrc}
            onCropComplete={handleCropComplete}
            onCancel={() => {
              setShowCropper(false);
              setCropImageSrc(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STEP 1 — Cover Setup
   ═══════════════════════════════════════════════════════════════════ */

function StepCover({
  title,
  setTitle,
  theme,
  setTheme,
  emoji,
  setEmoji,
  aiImageUrl,
  isGeneratingCover,
  remainingGenerations,
  generateCover,
  selectedTheme,
  aiPromptMode,
  setAiPromptMode,
  customAiPrompt,
  setCustomAiPrompt,
  aiError,
  hasStoryContent,
  onFileSelect,
  isUploading,
}: {
  title: string;
  setTitle: (v: string) => void;
  theme: ThemeKey;
  setTheme: (v: ThemeKey) => void;
  emoji: string;
  setEmoji: (v: string) => void;
  aiImageUrl: string;
  isGeneratingCover: boolean;
  remainingGenerations: number;
  generateCover: () => void;
  selectedTheme: (typeof THEMES)[number];
  aiPromptMode: AiPromptMode;
  setAiPromptMode: (v: AiPromptMode) => void;
  customAiPrompt: string;
  setCustomAiPrompt: (v: string) => void;
  aiError: string;
  hasStoryContent: boolean;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
}) {
  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          Create Your Spill
        </h1>
        <p className="text-sm text-black/30">Set up the cover for your story</p>
      </div>

      {/* Cover Preview */}
      <div className="flex justify-center">
        <div
          className="relative w-[220px] sm:w-[260px] aspect-[3/4.2] rounded-2xl overflow-hidden shadow-2xl shadow-black/40 transition-all duration-500"
          style={{
            background: aiImageUrl
              ? `url(${aiImageUrl}) center/cover`
              : selectedTheme.bg,
          }}
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />
          <div
            className={`absolute inset-0 flex flex-col items-center justify-between p-8 text-center ${
              aiImageUrl ? "bg-black/40 backdrop-blur-[1px]" : ""
            }`}
          >
            <div className="flex flex-col items-center gap-2 mt-2">
              <span
                className="text-[8px] font-black uppercase tracking-[0.4em]"
                style={{ color: aiImageUrl ? "#fff" : selectedTheme.accent }}
              >
                Deep Spill
              </span>
              <div
                className="w-8 h-px opacity-40"
                style={{
                  background: aiImageUrl ? "#fff" : selectedTheme.accent,
                }}
              />
            </div>
            <div className="space-y-3 flex flex-col items-center">
              <span className="text-4xl drop-shadow-lg">{emoji}</span>
              <h3
                className="text-2xl font-black serif leading-[1.05] tracking-tight text-balance"
                style={{ color: aiImageUrl ? "#fff" : selectedTheme.text }}
              >
                {title.trim() || "Your Title"}
              </h3>
            </div>
            <span
              className="text-[9px] uppercase tracking-[0.2em] font-medium opacity-60"
              style={{ color: aiImageUrl ? "#fff" : selectedTheme.text }}
            >
              Anonymous Author
            </span>
          </div>
        </div>
      </div>

      {/* Title Input */}
      <div>
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-black/50 mb-2 block">
          Story Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. The Semester I Never Recovered From"
          className="w-full rounded-2xl border border-black/8 bg-black/[0.02] px-5 py-4 text-lg font-semibold outline-none focus:border-black/10 focus:bg-black/[0.03] placeholder:text-black/15 transition-all"
          maxLength={100}
        />
      </div>

      {/* Theme Picker */}
      <div>
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-black/50 mb-3 block">
          Cover Vibe
        </label>
        <div className="flex flex-wrap gap-3">
          {THEMES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTheme(t.key)}
              className={`group relative w-12 h-12 rounded-xl border-2 transition-all duration-300 ${
                theme === t.key
                  ? "border-black/30 scale-110 shadow-lg"
                  : "border-black/5 hover:border-black/15 hover:scale-105"
              }`}
              style={{ background: t.bg }}
            >
              <span className="absolute inset-0 flex items-center justify-center text-lg">
                {t.emoji}
              </span>
              {theme === t.key && (
                <motion.div
                  layoutId="theme-ring"
                  className="absolute -inset-1 rounded-[14px] border-2 border-black/15"
                  transition={{ duration: 0.3 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Emoji Picker */}
      <div>
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40 mb-3 block">
          Cover Icon
        </label>
        <div className="flex flex-wrap gap-2">
          {EMOJI_OPTIONS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg transition-all ${
                emoji === e
                  ? "bg-black/8 scale-110 shadow-lg ring-1 ring-black/10"
                  : "bg-black/[0.04] hover:bg-black/8 hover:scale-105"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* ─── AI Cover Section ─── */}

      {/* ─── Upload Your Own ─── */}
      <div className="rounded-2xl border border-black/[0.06] bg-black/[0.02] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Upload size={14} className="text-violet-400/80" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">
            Upload Your Own
          </span>
        </div>

        <p className="text-[10px] text-black/35 leading-relaxed">
          Upload any image and crop it to fit the cover perfectly. Supports JPG,
          PNG, WebP.
        </p>

        <label
          className={`w-full inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-black/10 bg-black/[0.02] py-4 text-[10px] font-black uppercase tracking-[0.2em] text-black/35 transition-all hover:bg-black/[0.04] hover:border-black/15 hover:text-black/50 cursor-pointer ${
            isUploading ? "opacity-30 pointer-events-none" : ""
          }`}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onFileSelect}
            className="hidden"
          />
          {isUploading ? (
            <>
              <span className="w-3 h-3 border-2 border-black/10 border-t-violet-500/60 rounded-full animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload size={13} />
              {aiImageUrl ? "Replace with Upload" : "Choose Image"}
            </>
          )}
        </label>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STEP 2 — Write Pages
   ═══════════════════════════════════════════════════════════════════ */

function StepPages({
  pages,
  activePage,
  setActivePage,
  activePageData,
  currentWordCount,
  isOverLimit,
  totalWords,
  isBelowMinimum,
  updatePage,
  addPage,
  removePage,
}: {
  pages: DraftPage[];
  activePage: number;
  setActivePage: (v: number) => void;
  activePageData: DraftPage;
  currentWordCount: number;
  isOverLimit: boolean;
  totalWords: number;
  isBelowMinimum: boolean;
  updatePage: (idx: number, field: keyof DraftPage, val: string) => void;
  addPage: () => void;
  removePage: (idx: number) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          Write Your Pages
        </h1>
        <p className="text-sm text-black/40">
          Up to {MAX_PAGES} pages · {MAX_WORDS_PER_PAGE} words each
        </p>
      </div>

      {/* Minimum words warning */}
      {isBelowMinimum && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-orange-500/8 border border-orange-500/15"
        >
          <AlertTriangle
            size={14}
            className="text-orange-400/70 flex-shrink-0"
          />
          <p className="text-[11px] text-orange-400/60 font-medium">
            Your spill has only{" "}
            <strong className="text-orange-400/80">{totalWords}</strong> words.
            Write at least{" "}
            <strong className="text-orange-400/80">{MIN_TOTAL_WORDS}</strong>{" "}
            words across all pages to publish.
            <span className="text-black/20 ml-1">
              ({MIN_TOTAL_WORDS - totalWords} more needed)
            </span>
          </p>
        </motion.div>
      )}

      {/* Page dots / nav */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {pages.map((p, idx) => {
          const wc = p.text.trim() ? p.text.trim().split(/\s+/).length : 0;
          const pageOver = wc > MAX_WORDS_PER_PAGE;
          const pageEmpty = wc === 0;
          return (
            <button
              key={`dot-${idx}`}
              type="button"
              onClick={() => setActivePage(idx)}
              className={`relative flex items-center justify-center w-9 h-9 rounded-xl text-[11px] font-black transition-all ${
                idx === activePage
                  ? pageOver
                    ? "bg-red-500/20 text-red-400 scale-110 ring-1 ring-red-500/30"
                    : "bg-black/10 text-black scale-110 shadow-sm"
                  : pageOver
                    ? "bg-red-500/8 text-red-400/50"
                    : pageEmpty
                      ? "bg-[#f5f3f0] text-black/20 border border-dashed border-black/10"
                      : "bg-[#f0eeeb] text-black/40 hover:bg-black/8 hover:text-black/60"
              }`}
            >
              {idx + 1}
              {idx === activePage && (
                <motion.div
                  layoutId="page-indicator"
                  className="absolute -bottom-1 w-1 h-1 rounded-full bg-black/40"
                  transition={{ duration: 0.25 }}
                />
              )}
            </button>
          );
        })}

        {pages.length < MAX_PAGES && (
          <button
            type="button"
            onClick={addPage}
            className="w-9 h-9 rounded-xl border border-dashed border-black/15 flex items-center justify-center text-black/25 hover:text-black/50 hover:border-black/25 hover:bg-black/[0.03] transition-all"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {/* Active page editor */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activePage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {/* Page header */}
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-black/45">
              Page {activePage + 1}
            </h2>
            {pages.length > 1 && (
              <button
                type="button"
                onClick={() => removePage(activePage)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider text-red-400/50 hover:text-red-400/80 hover:bg-red-400/5 transition-colors"
              >
                <Minus size={11} /> Remove
              </button>
            )}
          </div>

          {/* Page title */}
          <input
            type="text"
            value={activePageData.title}
            onChange={(e) => updatePage(activePage, "title", e.target.value)}
            placeholder="Page title (optional)"
            className="w-full rounded-xl border border-black/10 bg-[#faf8f5] px-4 py-3 text-base font-semibold serif outline-none focus:border-black/20 focus:bg-white placeholder:text-black/20 transition-all"
          />

          {/* Text area */}
          <div className="relative">
            <textarea
              value={activePageData.text}
              onChange={(e) => updatePage(activePage, "text", e.target.value)}
              placeholder="Write your story for this page..."
              className={`w-full min-h-[240px] sm:min-h-[300px] resize-y rounded-2xl border bg-[#faf8f5] px-5 py-4 text-[15px] leading-8 serif outline-none placeholder:text-black/15 transition-all ${
                isOverLimit
                  ? "border-red-500/30 focus:border-red-500/50"
                  : "border-black/10 focus:border-black/20 focus:bg-white"
              }`}
            />

            {/* Word counter */}
            <div
              className={`absolute bottom-3 right-4 text-[10px] font-bold tabular-nums transition-colors ${
                isOverLimit
                  ? "text-red-400"
                  : currentWordCount > MAX_WORDS_PER_PAGE * 0.85
                    ? "text-orange-400/60"
                    : "text-black/20"
              }`}
            >
              {currentWordCount} / {MAX_WORDS_PER_PAGE}
            </div>
          </div>

          {isOverLimit && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[11px] text-red-400/70 font-medium"
            >
              ⚠️ This page exceeds the {MAX_WORDS_PER_PAGE}-word limit. Trim it
              down or split into another page.
            </motion.p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Page nav */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => setActivePage(Math.max(0, activePage - 1))}
          disabled={activePage === 0}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-black/10 text-[10px] font-black uppercase tracking-[0.15em] text-black/40 hover:text-black/60 hover:bg-[#f5f3f0] disabled:opacity-20 transition-all"
        >
          <ArrowLeft size={12} /> Prev
        </button>
        <button
          type="button"
          onClick={() => {
            if (activePage < pages.length - 1) {
              setActivePage(activePage + 1);
            } else if (pages.length < MAX_PAGES) {
              addPage();
            }
          }}
          disabled={activePage >= pages.length - 1 && pages.length >= MAX_PAGES}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-black/8 text-[10px] font-black uppercase tracking-[0.15em] text-black/60 hover:bg-black/12 disabled:opacity-20 transition-all"
        >
          {activePage < pages.length - 1 ? "Next" : "+ Add Page"}{" "}
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STEP 3 — Review & Publish
   ═══════════════════════════════════════════════════════════════════ */

function StepReview({
  title,
  pages,
  totalWords,
  aiImageUrl,
  selectedTheme,
  emoji,
  mode,
  slug,
  publicBoards,
  selectedBoardId,
  setSelectedBoardId,
  showBoardPicker,
  setShowBoardPicker,
  isSubmitting,
  publishSpill,
}: {
  title: string;
  pages: DraftPage[];
  totalWords: number;
  aiImageUrl: string;
  selectedTheme: (typeof THEMES)[number];
  emoji: string;
  mode: "global" | "board";
  slug?: string;
  publicBoards: any[] | undefined;
  selectedBoardId: string;
  setSelectedBoardId: (v: string) => void;
  showBoardPicker: boolean;
  setShowBoardPicker: React.Dispatch<React.SetStateAction<boolean>>;
  isSubmitting: boolean;
  publishSpill: () => void;
}) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="text-3xl">✨</span>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          Your Spill is Ready
        </h1>
        <p className="text-sm text-black/30">Review and publish your story</p>
      </div>

      {/* Page thumbnails */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {/* Cover thumbnail */}
        <div
          className="flex-shrink-0 w-[100px] aspect-[3/4] rounded-xl overflow-hidden shadow-lg"
          style={{
            background: aiImageUrl
              ? `url(${aiImageUrl}) center/cover`
              : selectedTheme.bg,
          }}
        >
          <div
            className={`size-full flex flex-col items-center justify-center p-3 text-center gap-1 ${
              aiImageUrl ? "bg-black/40" : ""
            }`}
          >
            {!aiImageUrl && <span className="text-lg">{emoji}</span>}
            <span
              className="text-[8px] font-black leading-tight line-clamp-2"
              style={{ color: aiImageUrl ? "#fff" : selectedTheme.text }}
            >
              {title}
            </span>
            <span
              className="text-[6px] uppercase tracking-wider opacity-50"
              style={{ color: aiImageUrl ? "#fff" : selectedTheme.text }}
            >
              Cover
            </span>
          </div>
        </div>

        {/* Page thumbnails */}
        {pages.map((page, idx) => (
          <div
            key={`thumb-${idx}`}
            className="flex-shrink-0 w-[100px] aspect-[3/4] rounded-xl bg-[#1a1816] border border-white/5 overflow-hidden shadow-lg"
          >
            <div className="size-full flex flex-col p-3 gap-1">
              <span className="text-[7px] font-bold uppercase tracking-wider text-white/20">
                Page {idx + 1}
              </span>
              {page.title && (
                <span className="text-[8px] font-bold text-white/50 line-clamp-1">
                  {page.title}
                </span>
              )}
              <p className="text-[7px] leading-[1.6] text-white/25 line-clamp-6 serif">
                {page.text || "Empty page..."}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-black/[0.02] border border-black/5 p-4 text-center">
          <p className="text-[9px] font-bold uppercase tracking-wider text-black/25">
            Pages
          </p>
          <p className="text-xl font-black mt-1">{pages.length}</p>
        </div>
        <div className="rounded-xl bg-black/[0.02] border border-black/5 p-4 text-center">
          <p className="text-[9px] font-bold uppercase tracking-wider text-black/25">
            Words
          </p>
          <p className="text-xl font-black mt-1">{totalWords}</p>
        </div>
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-4 text-center">
          <p className="text-[9px] font-bold uppercase tracking-wider text-white/25">
            Cover
          </p>
          <p className="text-xl font-black mt-1">{aiImageUrl ? "✅" : emoji}</p>
        </div>
      </div>

      {/* Board picker (global mode only) */}
      {mode === "global" && (
        <div className="rounded-2xl border border-black/[0.06] bg-black/[0.02] p-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/20 mb-3">
            Post to board (optional)
          </p>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowBoardPicker((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-black/[0.02] border border-black/[0.06] text-left transition-all hover:border-black/10"
            >
              <span className="text-xs font-medium text-black/40">
                {selectedBoardId
                  ? publicBoards?.find(
                      (b) => (b._id as string) === selectedBoardId,
                    )?.name || "Selected board"
                  : "Global (default)"}
              </span>
              <ChevronDown
                size={12}
                className={`text-black/20 transition-transform ${showBoardPicker ? "rotate-180" : ""}`}
              />
            </button>

            {showBoardPicker && (
              <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-white border border-black/8 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBoardId("");
                    setShowBoardPicker(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-black/[0.03] transition-colors rounded-t-xl ${
                    !selectedBoardId ? "bg-black/[0.03]" : ""
                  }`}
                >
                  <span className="text-sm">{"\u{1F30D}"}</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-black/50">
                      Global Shelf
                    </p>
                    <p className="text-[9px] text-black/20 italic">
                      Not tied to any board
                    </p>
                  </div>
                </button>

                {publicBoards?.map((b, index) => (
                  <button
                    key={b._id}
                    type="button"
                    onClick={() => {
                      setSelectedBoardId(b._id as string);
                      setShowBoardPicker(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-black/[0.03] transition-colors ${
                      index === (publicBoards?.length ?? 0) - 1
                        ? "rounded-b-xl"
                        : ""
                    } ${selectedBoardId === (b._id as string) ? "bg-black/[0.03]" : ""}`}
                  >
                    <span className="text-sm">{"\u{1F4DA}"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-black/50 truncate">
                        {b.name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
