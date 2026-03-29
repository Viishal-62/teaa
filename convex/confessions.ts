import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { generateAnonName } from "./helpers";

// ─── Create a confession ───
export const create = mutation({
  args: {
    boardId: v.id("boards"),
    text: v.string(),
    category: v.string(),
    isGlobal: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Validate text length
    if (args.text.trim().length === 0) {
      throw new Error("Confession text cannot be empty");
    }
    const wordCount = args.text.trim().split(/\s+/).length;
    if (wordCount > 500) {
      throw new Error("Confession text cannot exceed 500 words");
    }

    const displayName = generateAnonName();

    const confessionId = await ctx.db.insert("confessions", {
      boardId: args.boardId,
      text: args.text.trim(),
      category: args.category,
      displayName,
      isGlobal: args.isGlobal,
      createdAt: Date.now(),
    });

    return { confessionId, displayName };
  },
});

// ─── Get a single confession by ID ───
export const getById = query({
  args: { confessionId: v.id("confessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.confessionId);
  },
});

// ─── List confessions for a board ───
export const listByBoard = query({
  args: {
    boardId: v.id("boards"),
    category: v.optional(v.string()),
    pin: v.optional(v.string()),
    creatorToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify board access
    const board = await ctx.db.get(args.boardId);
    if (!board) return [];

    if (
      board.visibility === "private" &&
      board.creatorToken !== args.creatorToken &&
      board.pin !== args.pin
    ) {
      return []; // unauthorized
    }

    if (args.category && args.category !== "all") {
      // Filter by category
      const confessions = await ctx.db
        .query("confessions")
        .withIndex("by_boardId_category", (q) =>
          q.eq("boardId", args.boardId).eq("category", args.category!),
        )
        .order("desc")
        .take(100);
      return confessions;
    }

    // All confessions for the board
    const confessions = await ctx.db
      .query("confessions")
      .withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
      .order("desc")
      .take(100);
    return confessions;
  },
});

// ─── Global feed — all public confessions ───
export const globalFeed = query({
  args: {
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get all confessions marked as global, newest first
    let confessions = await ctx.db
      .query("confessions")
      .withIndex("by_createdAt")
      .order("desc")
      .filter((q) => q.eq(q.field("isGlobal"), true))
      .take(100);

    // Filter by category if specified
    if (args.category && args.category !== "all") {
      confessions = confessions.filter((c) => c.category === args.category);
    }

    // Enrich with board info. If board is private, hide the board info!
    const enriched = [];
    for (const confession of confessions) {
      const board = await ctx.db.get(confession.boardId);
      if (!board) continue;

      if (board.visibility === "public") {
        // Public board: show everything
        enriched.push({
          ...confession,
          boardName: board.name,
          boardSlug: board.slug,
          boardTheme: board.theme,
        });
      } else {
        // Private board: show confession but hide board identity
        enriched.push({
          ...confession,
          boardName: "",
          boardSlug: "",
          boardTheme: board.theme, // keep visual theme but no name/slug
        });
      }
    }

    return enriched;
  },
});

// ─── Delete a confession (by board creator) ───
export const remove = mutation({
  args: {
    confessionId: v.id("confessions"),
    creatorToken: v.string(),
  },
  handler: async (ctx, args) => {
    const confession = await ctx.db.get(args.confessionId);
    if (!confession) throw new Error("Confession not found");

    const board = await ctx.db.get(confession.boardId);
    if (!board || board.creatorToken !== args.creatorToken) {
      throw new Error(
        "Unauthorized: only the board creator can delete confessions",
      );
    }

    // Delete related reactions
    const reactions = await ctx.db
      .query("reactions")
      .withIndex("by_confessionId", (q) =>
        q.eq("confessionId", args.confessionId),
      )
      .collect();
    for (const r of reactions) {
      await ctx.db.delete(r._id);
    }

    // Delete related comments
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_confessionId", (q) =>
        q.eq("confessionId", args.confessionId),
      )
      .collect();
    for (const c of comments) {
      await ctx.db.delete(c._id);
    }

    await ctx.db.delete(args.confessionId);
    return { success: true };
  },
});

// ─── Increment views ───
export const incrementView = mutation({
  args: { confessionId: v.id("confessions") },
  handler: async (ctx, args) => {
    const confession = await ctx.db.get(args.confessionId);
    if (confession) {
      await ctx.db.patch(args.confessionId, {
        views: (confession.views || 0) + 1,
      });
    }
  },
});

// ─── Get confession count for a board ───
export const countByBoard = query({
  args: { boardId: v.id("boards") },
  handler: async (ctx, args) => {
    const confessions = await ctx.db
      .query("confessions")
      .withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
      .collect();
    return confessions.length;
  },
});

// ─── Confession / Teaa of the Day ───
export const confessionOfTheDay = query({
  args: {},
  handler: async (ctx) => {
    // Get recent public confessions (last 100)
    const confessions = await ctx.db
      .query("confessions")
      .withIndex("by_createdAt")
      .order("desc")
      .filter((q) => q.eq(q.field("isGlobal"), true))
      .take(100);

    if (confessions.length === 0) return null;

    // Score each confession by reactions + views
    const scored = await Promise.all(
      confessions.map(async (c) => {
        const reactions = await ctx.db
          .query("reactions")
          .withIndex("by_confessionId", (q) => q.eq("confessionId", c._id))
          .collect();
        const board = await ctx.db.get(c.boardId);
        return {
          ...c,
          score: reactions.length + (c.views ?? 0),
          reactionCount: reactions.length,
          boardName: board?.name ?? "",
          boardSlug: board?.slug ?? "",
        };
      }),
    );

    // Sort by score descending, take top 10
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, Math.max(10, scored.length));

    // Deterministic daily pick: day number mod top length
    const daySeed = Math.floor(Date.now() / 86400000);
    const pick = top[daySeed % top.length];

    return pick;
  },
});
