import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const board = await fetchQuery(api.boards.getBySlug, { slug });

    if (!board) {
      return {
        title: "Board Not Found — Teaaa 🫖",
      };
    }

    const title = `${board.name} — Teaaa 🫖`;
    const description = board.tagline
      ? `"${board.tagline}" — Spill your secrets anonymously on this confession board.`
      : `Spill your secrets anonymously on ${board.name}. Create confessions, react, and comment.`;

    const ogImageUrl = `/api/og?type=board&slug=${encodeURIComponent(slug)}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `${board.name} — Anonymous Confessions`,
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

export default async function BoardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let boardData = null;
  try {
    boardData = await fetchQuery(api.boards.getBySlug, { slug });
  } catch (e) {}

  const jsonLd = boardData
    ? {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `${boardData.name} — Teaaa 🫖`,
        description:
          boardData.tagline || `Anonymous confessions on ${boardData.name}`,
        url: `https://www.teaadrop.xyz/b/${slug}`,
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
