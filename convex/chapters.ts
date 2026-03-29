import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── Add a Chapter to a Spill ───
export const add = mutation({
  args: {
    spillId: v.id("spills"),
    chapterNumber: v.number(),
    title: v.optional(v.string()), // e.g. "Chapter 1: The First Lie"
    text: v.string(), // Extracted text
  },
  handler: async (ctx, args) => {
    if (!args.text.trim()) throw new Error("Chapter text cannot be empty");
    
    // Optional: you could cap word counts here too
    // const words = args.text.trim().split(/\s+/).length;
    // if (words > 5000) throw new Error("Exceeded 5000 word limit");

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
