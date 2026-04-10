import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type Props = {
  params: Promise<{ slug: string; confessionId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, confessionId } = await params;

  try {
    const [board, confession] = await Promise.all([
      fetchQuery(api.boards.getBySlug, { slug }),
      fetchQuery(api.confessions.getById, {
        confessionId: confessionId as Id<"confessions">,
      }),
    ]);

    if (!board || !confession) {
      return {
        title: "Confession Not Found — Teaaa 🫖",
      };
    }

    const safeText =
      typeof confession.text === "string" && confession.text.trim().length > 0
        ? confession.text
        : confession.type === "voice"
          ? "Voice confession"
          : "Anonymous confession";
    const truncatedText =
      safeText.length > 120 ? `${safeText.slice(0, 120)}...` : safeText;

    const title = `A confession on ${board.name} — Teaaa 🫖`;
    const description = `"${truncatedText}" — ${confession.displayName}. React, comment, and spill your own secrets anonymously.`;
    const ogImageUrl = `/api/og?type=confession&id=${encodeURIComponent(confessionId)}`;

    return {
      title,
      description,
      alternates: {
        canonical: `https://www.teaadrop.xyz/b/${slug}/c/${confessionId}`,
      },
      openGraph: {
        title,
        description,
        type: "article",
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: "A confession on Teaaa",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImageUrl],
      },
    };
  } catch {
    return {
      title: "Teaaa 🫖 — Anonymous Confessions",
    };
  }
}

export default function ConfessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
