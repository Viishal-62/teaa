import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { generateSlug } from "./helpers";

// ─── Create a new board ───
export const create = mutation({
  args: {
    name: v.string(),
    tagline: v.string(),
    theme: v.string(),
    visibility: v.string(),
    pin: v.optional(v.string()),
    creatorToken: v.string(),
  },
  handler: async (ctx, args) => {
    if (
      args.visibility === "private" &&
      (!args.pin || args.pin.length < 4 || args.pin.length > 6)
    ) {
      throw new Error("Private boards require a 4-6 digit PIN");
    }

    const slug = generateSlug(args.name);

    const boardId = await ctx.db.insert("boards", {
      slug,
      name: args.name,
      tagline: args.tagline,
      theme: args.theme,
      visibility: args.visibility,
      pin: args.visibility === "private" ? args.pin : undefined,
      creatorToken: args.creatorToken,
      createdAt: Date.now(),
    });

    return { boardId, slug };
  },
});

// ─── Get board by slug (strips PIN from response) ───
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const board = await ctx.db
      .query("boards")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!board) return null;
    // Never send PIN to client
    const { pin, ...safeBoard } = board;
    return { ...safeBoard, isPrivate: board.visibility === "private" };
  },
});

// ─── Verify PIN for private board ───
export const verifyPin = query({
  args: { slug: v.string(), pin: v.string() },
  handler: async (ctx, args) => {
    const board = await ctx.db
      .query("boards")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!board) return false;
    return board.pin === args.pin;
  },
});

// ─── Get board by ID ───
export const getById = query({
  args: { boardId: v.id("boards") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.boardId);
  },
});

// ─── List all public boards (for explore page) ───
export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    const boards = await ctx.db
      .query("boards")
      .withIndex("by_createdAt")
      .order("desc")
      .filter((q) => q.eq(q.field("visibility"), "public"))
      .take(50);
    return boards;
  },
});

// ─── Get or create the global default board ───
export const getOrCreateGlobal = mutation({
  args: {},
  handler: async (ctx) => {
    // Look for existing global board
    const existing = await ctx.db
      .query("boards")
      .withIndex("by_slug", (q) => q.eq("slug", "global"))
      .first();

    if (existing) return existing._id;

    // Create a global board
    const boardId = await ctx.db.insert("boards", {
      slug: "global",
      name: "Teaaa Global",
      tagline: "The world's confession box",
      theme: "noir",
      visibility: "public",
      creatorToken: "system-global",
      createdAt: Date.now(),
    });

    return boardId;
  },
});

// ─── List public boards with confession counts ───
export const listPublicWithCounts = query({
  args: {},
  handler: async (ctx) => {
    const boards = await ctx.db
      .query("boards")
      .withIndex("by_createdAt")
      .order("desc")
      .filter((q) => q.eq(q.field("visibility"), "public"))
      .take(50);

    const enriched = await Promise.all(
      boards.map(async (board) => {
        const confessions = await ctx.db
          .query("confessions")
          .withIndex("by_boardId", (q) => q.eq("boardId", board._id))
          .collect();
        return {
          ...board,
          confessionCount: confessions.length,
        };
      }),
    );

    return enriched;
  },
});

// ─── List boards by creator token ───
export const listByCreator = query({
  args: { creatorToken: v.string() },
  handler: async (ctx, args) => {
    const boards = await ctx.db
      .query("boards")
      .withIndex("by_creatorToken", (q) =>
        q.eq("creatorToken", args.creatorToken),
      )
      .order("desc")
      .collect();
    return boards;
  },
});

// ─── Update board details ───
export const update = mutation({
  args: {
    boardId: v.id("boards"),
    creatorToken: v.string(),
    name: v.optional(v.string()),
    tagline: v.optional(v.string()),
    theme: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const board = await ctx.db.get(args.boardId);
    if (!board || board.creatorToken !== args.creatorToken) {
      throw new Error("Unauthorized: only the board creator can update it");
    }

    const updates: Record<string, string> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.tagline !== undefined) updates.tagline = args.tagline;
    if (args.theme !== undefined) updates.theme = args.theme;

    await ctx.db.patch(args.boardId, updates);
    return { success: true };
  },
});

// ─── Delete a board ───
export const remove = mutation({
  args: {
    boardId: v.id("boards"),
    creatorToken: v.string(),
  },
  handler: async (ctx, args) => {
    const board = await ctx.db.get(args.boardId);
    if (!board || board.creatorToken !== args.creatorToken) {
      throw new Error("Unauthorized: only the board creator can delete it");
    }

    // Delete all confessions, reactions, and comments for this board
    const confessions = await ctx.db
      .query("confessions")
      .withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
      .collect();

    for (const confession of confessions) {
      // Delete reactions
      const reactions = await ctx.db
        .query("reactions")
        .withIndex("by_confessionId", (q) =>
          q.eq("confessionId", confession._id),
        )
        .collect();
      for (const r of reactions) {
        await ctx.db.delete(r._id);
      }

      // Delete comments
      const comments = await ctx.db
        .query("comments")
        .withIndex("by_confessionId", (q) =>
          q.eq("confessionId", confession._id),
        )
        .collect();
      for (const c of comments) {
        await ctx.db.delete(c._id);
      }

      await ctx.db.delete(confession._id);
    }

    await ctx.db.delete(args.boardId);
    return { success: true };
  },
});
