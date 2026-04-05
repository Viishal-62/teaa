import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { moderateText } from "./moderation";

// ─── Add a Chapter to a Spill ───
export const add = mutation({
  args: {
    spillId: v.id("spills"),
    chapterNumber: v.number(),
    title: v.optional(v.string()),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.text.trim()) throw new Error("Chapter text cannot be empty");

    // ─── Content Moderation ───
    // Get the spill to find the board for custom banned words
    const spill = await ctx.db.get(args.spillId);
    const board = spill ? await ctx.db.get(spill.boardId) : null;
    const customWords = board?.bannedWords ?? [];

    // Check chapter text
    const textMod = moderateText(args.text, customWords);
    if (!textMod.isClean) {
      throw new Error(
        JSON.stringify({
          type: "moderation_error",
          flaggedWords: textMod.flaggedWords,
          message: `Chapter ${args.chapterNumber} contains restricted words. Please remove them.`,
        }),
      );
    }

    // Check chapter title if provided
    if (args.title) {
      const titleMod = moderateText(args.title, customWords);
      if (!titleMod.isClean) {
        throw new Error(
          JSON.stringify({
            type: "moderation_error",
            flaggedWords: titleMod.flaggedWords,
            message: `Chapter ${args.chapterNumber} title contains restricted words. Please change it.`,
          }),
        );
      }
    }

    await ctx.db.insert("chapters", {
      spillId: args.spillId,
      chapterNumber: args.chapterNumber,
      title: args.title?.trim(),
      text: args.text.trim(),
      createdAt: Date.now(),
    });
  },
});

// ─── List Chapters for a Spill ───
export const listBySpill = query({
  args: { spillId: v.id("spills") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chapters")
      .withIndex("by_spillId_chapterNumber", (q) =>
        q.eq("spillId", args.spillId),
      )
      .order("asc") // Read chapters chronologically!
      .collect();
  },
});
