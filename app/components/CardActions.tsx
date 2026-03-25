"use client";

import { useState, useRef, useCallback } from "react";
import { Download, Link as LinkIcon, Share2, Check } from "lucide-react";
import { toPng } from "html-to-image";
import CardDownloadRenderer from "./CardDownloadRenderer";
import type { Id } from "@/convex/_generated/dataModel";

interface CardActionsProps {
  confession: {
    _id: Id<"confessions">;
    text: string;
    category: string;
    displayName: string;
    views?: number;
  };
  boardSlug: string;
  totalReactions?: number;
  reactionCounts?: Record<string, number>;
}

export default function CardActions({
  confession,
  boardSlug,
  totalReactions,
  reactionCounts,
}: CardActionsProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const downloadRef = useRef<HTMLDivElement>(null);

  const confessionUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/b/${boardSlug}/c/${confession._id}`
      : "";

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(confessionUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = confessionUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [confessionUrl]);

  const handleShare = useCallback(async () => {
    const shareData = {
      title: "A confession on Teaaa 🫖",
      text: `"${confession.text.slice(0, 100)}${confession.text.length > 100 ? "..." : ""}" — spill your secrets anonymously`,
      url: confessionUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or error — fall back to copy
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  }, [confession.text, confessionUrl, handleCopyLink]);

  const handleDownload = useCallback(async () => {
    if (!downloadRef.current || downloading) return;
    setDownloading(true);
    try {
      // Wait a couple frames for render
      await new Promise((r) => setTimeout(r, 100));
      const dataUrl = await toPng(downloadRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#faf7f2",
        skipFonts: true,
      });
      const link = document.createElement("a");
      link.download = `teaaa-confession-${confession._id.slice(-6)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloading(false);
    }
  }, [confession._id, downloading]);

  return (
    <>
      {/* Hidden renderer for download */}
      <CardDownloadRenderer
        ref={downloadRef}
        confession={confession}
        totalReactions={totalReactions}
        reactionCounts={reactionCounts}
      />

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-2 mb-2">
        {/* Download */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleDownload();
          }}
          disabled={downloading}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-wider text-black/30 hover:text-black/60 hover:bg-black/5 transition-all active:scale-95 disabled:opacity-30"
          title="Download as image"
        >
          {downloading ? (
            <span className="w-3 h-3 border border-black/20 border-t-black/50 rounded-full animate-spin" />
          ) : (
            <Download size={10} />
          )}
          Save
        </button>

        {/* Copy Link */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleCopyLink();
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-wider text-black/30 hover:text-black/60 hover:bg-black/5 transition-all active:scale-95"
          title="Copy link"
        >
          {copied ? (
            <>
              <Check size={10} className="text-green-500" />
              <span className="text-green-500">Copied</span>
            </>
          ) : (
            <>
              <LinkIcon size={10} />
              Copy
            </>
          )}
        </button>

        {/* Share */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleShare();
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-wider text-black/30 hover:text-black/60 hover:bg-black/5 transition-all active:scale-95"
          title="Share"
        >
          <Share2 size={10} />
          Share
        </button>
      </div>
    </>
  );
}
