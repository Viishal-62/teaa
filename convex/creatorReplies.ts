import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { moderateText } from "./moderation";

// ─── Reply to a Confession (Board Creator Only) ───
export const reply = mutation({
  args: {
    confessionId: v.id("confessions"),
    text: v.string(),
    creatorToken: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.text.trim()) throw new Error("Reply cannot be empty");
    if (args.text.length > 500) throw new Error("Reply cannot exceed 500 characters");

    // Get confession → board → verify ownership
    const confession = await ctx.db.get(args.confessionId);
    if (!confession) throw new Error("Confession not found");

    const board = await ctx.db.get(confession.boardId);
    if (!board) throw new Error("Board not found");
    if (board.creatorToken !== args.creatorToken) {
      throw new Error("Only the board creator can reply");
    }

    // Check if creator already replied to this confession
    const existing = await ctx.db
      .query("creatorReplies")
      .withIndex("by_confessionId", (q) => q.eq("confessionId", args.confessionId))
      .first();

    if (existing) {
      throw new Error("You already replied to this confession. Use edit instead.");
    }

    // Content moderation
    const modResult = moderateText(args.text, board.bannedWords ?? []);
    if (!modResult.isClean) {
      throw new Error(JSON.stringify({
        type: "moderation_error",
        flaggedWords: modResult.flaggedWords,
        message: "Your reply contains restricted words.",
      }));
    }

    const replyId = await ctx.db.insert("creatorReplies", {
      confessionId: args.confessionId,
      boardId: confession.boardId,
      text: args.text.trim(),
      creatorToken: args.creatorToken,
      createdAt: Date.now(),
    });

    return { replyId };
  },
});

// ─── Edit Creator Reply ───
export const edit = mutation({
  args: {
    replyId: v.id("creatorReplies"),
    text: v.string(),
    creatorToken: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.text.trim()) throw new Error("Reply cannot be empty");
    if (args.text.length > 500) throw new Error("Reply cannot exceed 500 characters");

    const reply = await ctx.db.get(args.replyId);
    if (!reply) throw new Error("Reply not found");
    if (reply.creatorToken !== args.creatorToken) {
      throw new Error("Unauthorized");
    }

    const board = await ctx.db.get(reply.boardId);
    const modResult = moderateText(args.text, board?.bannedWords ?? []);
    if (!modResult.isClean) {
      throw new Error(JSON.stringify({
        type: "moderation_error",
        flaggedWords: modResult.flaggedWords,
        message: "Your reply contains restricted words.",
      }));
    }

    await ctx.db.patch(args.replyId, {
      text: args.text.trim(),
    });

    return { success: true };
  },
});

// ─── Delete Creator Reply ───
export const remove = mutation({
  args: {
    replyId: v.id("creatorReplies"),
    creatorToken: v.string(),
  },
  handler: async (ctx, args) => {
    const reply = await ctx.db.get(args.replyId);
    if (!reply) throw new Error("Reply not found");
    if (reply.creatorToken !== args.creatorToken) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.replyId);
    return { success: true };
  },
});

// ─── Get Creator Reply for a Confession ───
export const getByConfession = query({
  args: { confessionId: v.id("confessions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("creatorReplies")
      .withIndex("by_confessionId", (q) => q.eq("confessionId", args.confessionId))
      .first();
  },
});

// ─── Check if Creator Has Replied (for showing badge on card) ───
export const hasReply = query({
  args: { confessionId: v.id("confessions") },
  handler: async (ctx, args) => {
    const reply = await ctx.db
      .query("creatorReplies")
      .withIndex("by_confessionId", (q) => q.eq("confessionId", args.confessionId))
      .first();
    return !!reply;
  },
});

// ─── List All Replies on a Board (for creator dashboard) ───
export const listByBoard = query({
  args: { boardId: v.id("boards") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("creatorReplies")
      .withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
      .order("desc")
      .take(50);
  },
});
