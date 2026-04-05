import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { generateAnonName } from "./helpers";

// ─── Add a comment ───
export const create = mutation({
  args: {
    confessionId: v.id("confessions"),
    text: v.string(),
    gifUrl: v.optional(v.string()),
    visitorId: v.string(), // Required for rate limiting
  },
  handler: async (ctx, args) => {
    const hasText = args.text.trim().length > 0;
    const hasGif = !!args.gifUrl;

    if (!hasText && !hasGif) {
      throw new Error("Comment must have text or a GIF");
    }
    if (args.text.length > 300) {
      throw new Error("Comment text cannot exceed 300 characters");
    }

    // ─── Rate Limiting ───
    const FIVE_MINS = 5 * 60 * 1000;
    const recentComments = await ctx.db
      .query("comments")
      .withIndex("by_visitorId_createdAt", (q) =>
        q
          .eq("visitorId", args.visitorId)
          .gt("createdAt", Date.now() - FIVE_MINS),
      )
      .collect();

    if (recentComments.length >= 10) {
      throw new Error(
        JSON.stringify({
          type: "rate_limit_error",
          message: "You're commenting too fast! Take a breath.",
        }),
      );
    }

    const displayName = generateAnonName();

    const commentId = await ctx.db.insert("comments", {
      confessionId: args.confessionId,
      text: args.text.trim(),
      gifUrl: args.gifUrl,
      displayName,
      visitorId: args.visitorId,
      createdAt: Date.now(),
    });

    return { commentId, displayName };
  },
});

// ─── List comments for a confession ───
export const listByConfession = query({
  args: { confessionId: v.id("confessions") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_confessionId", (q) =>
        q.eq("confessionId", args.confessionId),
      )
      .order("asc") // oldest first for chronological thread
      .take(200);
    return comments;
  },
});

// ─── Get comment count for a confession ───
export const countByConfession = query({
  args: { confessionId: v.id("confessions") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_confessionId", (q) =>
        q.eq("confessionId", args.confessionId),
      )
      .collect();
    return comments.length;
  },
});

// ─── Delete a comment (by board creator) ───
export const remove = mutation({
  args: {
    commentId: v.id("comments"),
    creatorToken: v.string(),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");

    const confession = await ctx.db.get(comment.confessionId);
    if (!confession) throw new Error("Confession not found");

    const board = await ctx.db.get(confession.boardId);
    if (!board || board.creatorToken !== args.creatorToken) {
      throw new Error(
        "Unauthorized: only the board creator can delete comments",
      );
    }

    await ctx.db.delete(args.commentId);
    return { success: true };
  },
});
