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
        title: "Admirers Not Found — Teaaa 🫖",
      };
    }

    const title = `Secret Admirers of ${board.name} — Teaaa 🫖`;
    const description = `Read and drop secret admirer messages for ${board.name}. A magical memory wall of hidden whispers.`;

    const ogImageUrl = `/api/og?type=admirers&slug=${encodeURIComponent(slug)}`;

    return {
      title,
      description,
      alternates: {
        canonical: `https://www.teaadrop.xyz/b/${slug}/admirers`,
      },
      openGraph: {
        title,
        description,
        type: "website",
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `Secret Admirers of ${board.name}`,
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
      title: "Secret Admirers — Teaaa 🫖",
    };
  }
}

export default function AdmirerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
