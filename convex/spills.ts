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

    if (spill.generationsUsed >= 10) {
      throw new Error("Maximum of 10 AI generations reached per spill.");
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
