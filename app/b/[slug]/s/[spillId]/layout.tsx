import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type Props = {
  params: Promise<{ slug: string; spillId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, spillId } = await params;

  try {
    const spill = await fetchQuery(api.spills.getById, {
      spillId: spillId as Id<"spills">,
    });

    if (!spill) {
      return { title: "Spill Not Found — Teaaa 🫖" };
    }

    const title = `${spill.title} — Teaaa 🫖`;
    const description = `Read this deep spill by ${spill.displayName} on Teaaa 🫖.`;

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://www.teaadrop.xyz";
    const ogImageUrl =
      spill.aiImageUrl || `${siteUrl}/api/og?type=spill&id=${spillId}`;

    return {
      title,
      description,
      alternates: {
        canonical: `https://www.teaadrop.xyz/b/${slug}/s/${spillId}`,
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
            alt: spill.title,
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
    return { title: "Anonymous Spill — Teaaa 🫖" };
  }
}

export default function SpillLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
