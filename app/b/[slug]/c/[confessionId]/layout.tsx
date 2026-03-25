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

    const truncatedText =
      confession.text.length > 120
        ? `${confession.text.slice(0, 120)}...`
        : confession.text;

    const title = `A confession on ${board.name} — Teaaa 🫖`;
    const description = `"${truncatedText}" — ${confession.displayName}. React, comment, and spill your own secrets anonymously.`;
    const ogImageUrl = `/api/og?type=confession&id=${encodeURIComponent(confessionId)}`;

    return {
      title,
      description,
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
