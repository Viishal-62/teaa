"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getCreatorToken, parseConvexError } from "@/app/lib/utils";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Check,
  ImagePlus,
  Plus,
  Share2,
  Trash2,
  X,
} from "lucide-react";

const DURATION_OPTIONS = [
  { label: "24 hours", value: 24 * 60 * 60 * 1000 },
  { label: "48 hours", value: 48 * 60 * 60 * 1000 },
  { label: "7 days", value: 7 * 24 * 60 * 60 * 1000 },
  { label: "No limit", value: 0 },
];

export default function CreatePollPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const board = useQuery(api.boards.getBySlug, { slug });
  const createPoll = useMutation(api.polls.create);
  const pollCount = useQuery(
    api.polls.getPollCount,
    board ? { boardId: board._id } : "skip",
  );

  const creatorToken =
    typeof window !== "undefined" ? getCreatorToken() : "";
  const isOwner = board?.creatorToken === creatorToken;

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [duration, setDuration] = useState(DURATION_OPTIONS[0].value);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validOptions = options.filter((o) => o.trim().length > 0);
  const canSubmit =
    question.trim().length > 0 &&
    validOptions.length >= 2 &&
    !isSubmitting &&
    !isUploading;

  const handleAddOption = () => {
    if (options.length < 5) {
      setOptions([...options, ""]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10MB");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Preview
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);

      // Convert to base64 for upload
      const base64 = await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.readAsDataURL(file);
      });

      // Upload to Cloudinary via existing API
      const res = await fetch("/api/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, folder: "poll-images" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setImageUrl(data.url);
    } catch (err: any) {
      setError(err.message || "Failed to upload image");
      setImagePreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!canSubmit || !board) return;
    setIsSubmitting(true);
    setError(null);

    try {
      await createPoll({
        boardId: board._id,
        question: question.trim(),
        options: validOptions.map((o) => o.trim()),
        imageUrl: imageUrl ?? undefined,
        creatorToken,
        expiresAt: duration > 0 ? Date.now() + duration : undefined,
      });
      setSubmitted(true);
    } catch (err: any) {
      const parsed = parseConvexError(err);
      if (parsed?.type === "moderation_error") {
        setError(parsed.message);
      } else {
        setError(
          err.message?.includes("already has an active poll")
            ? "This board already has an active poll. End it first!"
            : err.message || "Failed to create poll",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSharePoll = async () => {
    const url = `${window.location.origin}/b/${slug}`;
    const shareData = {
      title: `🗳️ Vote: ${question}`,
      text: `Vote anonymously: "${question}" ☕\n${url}`,
      url,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ── Loading ──
  if (board === undefined) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#faf8f5]">
        <div className="w-8 h-8 border-2 border-black/10 border-t-black/40 rounded-full animate-spin" />
      </div>
    );
  }

  // ── Not found ──
  if (board === null) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center bg-[#faf8f5]">
        <span className="text-5xl mb-4">🫣</span>
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

  // ── Unauthorized ──
  if (!isOwner) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center bg-[#faf8f5]">
        <span className="text-5xl mb-4">🔒</span>
        <h1 className="text-2xl font-black serif mb-2">Creator Only</h1>
        <p className="text-xs text-black/40 mb-6">
          Only the board creator can create polls.
        </p>
        <Link
          href={`/b/${slug}`}
          className="px-6 py-3 bg-black text-white rounded-xl text-sm font-bold"
        >
          Back to Board
        </Link>
      </div>
    );
  }

  // ── Max polls reached ──
  if (pollCount && !pollCount.canCreate) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center bg-[#faf8f5]">
        <span className="text-5xl mb-4">🗳️</span>
        <h1 className="text-2xl font-black serif mb-2">Poll Limit Reached</h1>
        <p className="text-xs text-black/40 mb-2">
          You already have {pollCount.maxPolls} active polls on this board.
        </p>
        <p className="text-xs text-black/30 mb-6">
          End or delete an active poll to create a new one.
        </p>
        <Link
          href={`/b/${slug}`}
          className="px-6 py-3 bg-black text-white rounded-xl text-sm font-bold"
        >
          Back to Board
        </Link>
      </div>
    );
  }

  // ── Success ──
  if (submitted) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-5 page-enter bg-[#faf8f5]">
        <div className="max-w-sm w-full text-center">
          <div className="bg-white rounded-2xl border border-black/5 p-8 shadow-xl shadow-black/[0.03]">
            <span className="text-5xl block mb-4">🗳️</span>
            <h1 className="text-xl font-black serif tracking-tight text-black mb-1">
              Poll is Live!
            </h1>
            <p className="text-xs text-black/35 font-medium mb-7">
              &quot;{question}&quot; is ready for anonymous votes ☕
            </p>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSharePoll}
                className="w-full py-3.5 bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-green-400" />
                    Link Copied!
                  </>
                ) : (
                  <>
                    <Share2 size={14} />
                    Share Poll
                  </>
                )}
              </button>
              <Link
                href={`/b/${slug}`}
                className="w-full py-3.5 border border-black/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-black/50 hover:bg-black/[0.02] transition-colors block text-center"
              >
                Back to Board
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Create Form ──
  return (
    <div className="min-h-[100dvh] page-enter bg-[#faf8f5] text-black">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center px-5 py-3 bg-[#faf8f5]/85 backdrop-blur-xl border-b border-black/5">
        <Link
          href={`/b/${slug}`}
          className="flex items-center gap-1.5 text-black/30 hover:text-black transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <span className="flex-1 text-center text-[10px] font-black uppercase tracking-[0.25em] text-black/20">
          {board.name}
        </span>
        <div className="w-4" />
      </header>

      <main className="max-w-lg mx-auto px-5 py-8">
        {/* Intro */}
        <div className="text-center mb-8">
          <span className="text-3xl block mb-3">🗳️</span>
          <h1 className="text-xl font-black serif tracking-tight text-black mb-1">
            Create a Poll
          </h1>
          <p className="text-[11px] text-black/30 font-medium tracking-wide">
            Ask your audience anything. Votes are anonymous.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-black/5 shadow-xl shadow-black/[0.03]">
          {/* Question */}
          <div className="p-5">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/25 mb-3">
              Your Question
            </p>
            <textarea
              value={question}
              onChange={(e) => {
                if (e.target.value.length <= 200) setQuestion(e.target.value);
              }}
              placeholder='e.g. "Which professor is the GOAT?"'
              rows={2}
              autoFocus
              className="w-full bg-transparent resize-none outline-none text-[15px] leading-relaxed placeholder:text-black/15 serif text-black/80"
            />
            <div className="flex justify-end">
              <span
                className={`text-[10px] font-mono ${question.length > 180 ? "text-red-500" : "text-black/20"}`}
              >
                {200 - question.length}
              </span>
            </div>
          </div>

          <div className="h-px bg-black/5" />

          {/* Image (Optional) */}
          <div className="p-5">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/25 mb-3">
              Context Image{" "}
              <span className="text-black/15 normal-case">(optional)</span>
            </p>

            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-black/[0.06] bg-black/[0.02]">
                <img
                  src={imagePreview}
                  alt="Poll image"
                  className="w-full h-40 object-cover"
                />
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                    <div className="w-6 h-6 border-2 border-black/10 border-t-black/50 rounded-full animate-spin" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-8 border-2 border-dashed border-black/10 rounded-xl flex flex-col items-center gap-2 text-black/30 hover:border-black/20 hover:text-black/50 transition-all active:scale-[0.98]"
              >
                <ImagePlus size={24} />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Add a photo or meme
                </span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImagePick}
              className="hidden"
            />
          </div>

          <div className="h-px bg-black/5" />

          {/* Options */}
          <div className="p-5">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/25 mb-3">
              Options{" "}
              <span className="text-black/15 normal-case">(2-5)</span>
            </p>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full border-2 border-black/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[8px] font-bold text-black/25">
                      {i + 1}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      if (e.target.value.length <= 50)
                        handleOptionChange(i, e.target.value);
                    }}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 bg-[#faf8f5] border border-black/[0.06] rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-black/15 transition-colors placeholder:text-black/15"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(i)}
                      className="w-8 h-8 flex items-center justify-center text-black/20 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              {options.length < 5 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-black/30 hover:text-black/60 transition-colors pl-7 py-2"
                >
                  <Plus size={12} />
                  Add option
                </button>
              )}
            </div>
          </div>

          <div className="h-px bg-black/5" />

          {/* Duration */}
          <div className="p-5">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/25 mb-3">
              Duration
            </p>
            <div className="flex flex-wrap gap-1.5">
              {DURATION_OPTIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDuration(d.value)}
                  className={`px-3.5 py-2 rounded-lg text-[11px] font-semibold transition-all active:scale-95 ${
                    duration === d.value
                      ? "bg-black text-white shadow-sm"
                      : "bg-black/[0.02] text-black/40 border border-black/5 hover:border-black/10"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-black/5" />

          {/* Error */}
          {error && (
            <div className="px-5 pt-5">
              <div className="flex items-start gap-2 text-red-500 bg-red-50 rounded-xl px-3 py-2">
                <X size={14} className="flex-shrink-0 mt-0.5" />
                <p className="text-[10px] font-medium leading-relaxed">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="p-5">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full py-4 bg-black text-white rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-15 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <BarChart3 size={14} />
                  Publish Poll
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
