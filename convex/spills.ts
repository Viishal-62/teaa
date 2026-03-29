import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { generateAnonName } from "./helpers";

// ─── Create a new Spill ───
export const create = mutation({
  args: {
    boardId: v.id("boards"),
    title: v.string(),
    coverTheme: v.string(),
    coverEmoji: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.title.trim()) throw new Error("Title is required");

    const displayName = generateAnonName();

    const spillId = await ctx.db.insert("spills", {
      boardId: args.boardId,
      title: args.title.trim(),
      coverTheme: args.coverTheme,
      coverEmoji: args.coverEmoji,
      generationsUsed: 0,
      displayName,
      views: 0,
      createdAt: Date.now(),
    });

    return { spillId, displayName };
  },
});

// ─── Update Cover (For AI Generate) ───
export const incrementGeneration = mutation({
  args: { spillId: v.id("spills") },
  handler: async (ctx, args) => {
    const spill = await ctx.db.get(args.spillId);
    if (!spill) throw new Error("Spill not found");

    if (spill.generationsUsed >= 5) {
      throw new Error("Maximum of 5 AI generations reached per spill.");
    }

    await ctx.db.patch(args.spillId, {
      generationsUsed: spill.generationsUsed + 1,
    });

    return spill.generationsUsed + 1;
  },
});

export const updateCoverImage = mutation({
  args: { spillId: v.id("spills"), imageUrl: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.spillId, {
      aiImageUrl: args.imageUrl,
    });
  },
});

// ─── Get Spill By ID ───
export const getById = query({
  args: { spillId: v.id("spills") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.spillId);
  },
});

// ─── List Spills for a Board ───
export const listByBoard = query({
  args: { boardId: v.id("boards") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("spills")
      .withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
      .order("desc")
      .take(20); // only need newest few for feed mix-in
  },
});

// ─── List All Spills (for explore/global feed) ───
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const spills = await ctx.db.query("spills").order("desc").take(20);
    // Attach board slug + reaction count for each spill
    const enriched = await Promise.all(
      spills.map(async (spill) => {
        const board = await ctx.db.get(spill.boardId);
        const reactions = await ctx.db
          .query("spillReactions")
          .withIndex("by_spillId", (q) => q.eq("spillId", spill._id))
          .collect();
        return {
          ...spill,
          boardSlug: board?.slug ?? "global",
          totalReactions: reactions.length,
        };
      }),
    );
    return enriched;
  },
});

// ─── Increment Views ───
export const incrementView = mutation({
  args: { spillId: v.id("spills") },
  handler: async (ctx, args) => {
    const spill = await ctx.db.get(args.spillId);
    if (spill) {
      await ctx.db.patch(args.spillId, {
        views: (spill.views || 0) + 1,
      });
    }
  },
});

// ─── Spill of the Day ───
export const spillOfTheDay = query({
  args: {},
  handler: async (ctx) => {
    const spills = await ctx.db.query("spills").order("desc").take(50);

    if (spills.length === 0) return null;

    // Score each by reactions + views
    const scored = await Promise.all(
      spills.map(async (spill) => {
        const reactions = await ctx.db
          .query("spillReactions")
          .withIndex("by_spillId", (q) => q.eq("spillId", spill._id))
          .collect();
        const board = await ctx.db.get(spill.boardId);
        return {
          ...spill,
          totalReactions: reactions.length,
          score: reactions.length * 2 + (spill.views ?? 0),
          boardSlug: board?.slug ?? "global",
        };
      }),
    );

    // Sort by score, take top 5
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, Math.max(5, scored.length));

    // Deterministic daily pick
    const daySeed = Math.floor(Date.now() / 86400000);
    const pick = top[daySeed % top.length];

    return pick;
  },
});

// ─── List Trending (Ranked by Score) ───
export const listTrending = query({
  args: {},
  handler: async (ctx) => {
    const spills = await ctx.db.query("spills").order("desc").take(100);

    // Score: reactions have double weight over views
    const scored = await Promise.all(
      spills.map(async (spill) => {
        const reactions = await ctx.db
          .query("spillReactions")
          .withIndex("by_spillId", (q) => q.eq("spillId", spill._id))
          .collect();
        const board = await ctx.db.get(spill.boardId);
        return {
          ...spill,
          totalReactions: reactions.length,
          score: reactions.length * 2 + (spill.views ?? 0),
          boardSlug: board?.slug ?? "global",
        };
      }),
    );

    // Sort by score descending and take top 10
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 10);
  },
});
