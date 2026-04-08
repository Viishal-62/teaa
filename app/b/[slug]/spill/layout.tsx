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
        title: "Spill Not Found — Teaaa 🫖",
      };
    }

    const title = `Write a Spill on ${board.name} — Teaaa 🫖`;
    const description = `Drop your deepest secrets anonymously. Write a deep gossip spill on ${board.name}.`;

    const ogImageUrl = `/api/og?type=create-spill&slug=${encodeURIComponent(slug)}`;

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
            alt: `Write a Spill on ${board.name}`,
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
      title: "Write a Spill — Teaaa 🫖",
    };
  }
}

export default function CreateSpillLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
