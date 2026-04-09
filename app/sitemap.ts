import { MetadataRoute } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const BASE = "https://www.teaadrop.xyz";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ── Static Pages ──
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE}/explore`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE}/confess`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE}/explore/voice`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE}/create`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/forum`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE}/spill/create`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE}/disclaimer`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // ── Dynamic Pages: Public Boards ──
  let boardPages: MetadataRoute.Sitemap = [];
  try {
    const boards = await fetchQuery(api.boards.listPublic, {});
    boardPages = boards.flatMap((board) => [
      // Main board page
      {
        url: `${BASE}/b/${board.slug}`,
        lastModified: new Date(board.createdAt),
        changeFrequency: "daily" as const,
        priority: 0.8,
      },
      // Board confess page
      {
        url: `${BASE}/b/${board.slug}/confess`,
        lastModified: new Date(board.createdAt),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      },
      // Board spill page
      {
        url: `${BASE}/b/${board.slug}/spill`,
        lastModified: new Date(board.createdAt),
        changeFrequency: "daily" as const,
        priority: 0.6,
      },
      // Board admirers wall (if applicable)
      ...(board.boardType === "secret-admirer"
        ? [
            {
              url: `${BASE}/b/${board.slug}/admirers`,
              lastModified: new Date(board.createdAt),
              changeFrequency: "daily" as const,
              priority: 0.6,
            },
          ]
        : []),
    ]);
  } catch (e) {
    console.error("Sitemap: Failed to fetch boards", e);
  }

  // ── Dynamic Pages: Public Spills ──
  let spillPages: MetadataRoute.Sitemap = [];
  try {
    const spills = await fetchQuery(api.spills.listAllPublic, {});
    spillPages = spills.map((spill) => ({
      url: `${BASE}/b/${spill.boardSlug}/s/${spill._id}`,
      lastModified: new Date(spill.createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch (e) {
    console.error("Sitemap: Failed to fetch spills", e);
  }

  return [...staticPages, ...boardPages, ...spillPages];
}
