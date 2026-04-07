import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── Toggle a reaction (add or remove) ───
export const toggle = mutation({
  args: {
    confessionId: v.id("confessions"),
    type: v.string(),
    visitorId: v.string(),
  },
  handler: async (ctx, args) => {
    // ─── Rate Limiting ───
    const FIVE_MINS = 5 * 60 * 1000;
    const recentReactions = await ctx.db
      .query("reactions")
      .withIndex("by_visitorId_createdAt", (q) =>
        q
          .eq("visitorId", args.visitorId)
          .gt("createdAt", Date.now() - FIVE_MINS),
      )
      .collect();

    if (recentReactions.length >= 30) {
      throw new Error(
        JSON.stringify({
          type: "rate_limit_error",
          message: "Slow down! You're reacting too fast.",
        }),
      );
    }

    // Check if this visitor already reacted with this type
    const existing = await ctx.db
      .query("reactions")
      .withIndex("by_confessionId_visitorId", (q) =>
        q.eq("confessionId", args.confessionId).eq("visitorId", args.visitorId),
      )
      .filter((q) => q.eq(q.field("type"), args.type))
      .first();

    if (existing) {
      // Remove the reaction (toggle off)
      await ctx.db.delete(existing._id);
      return { action: "removed" };
    }

    // Add the reaction
    await ctx.db.insert("reactions", {
      confessionId: args.confessionId,
      type: args.type,
      visitorId: args.visitorId,
      createdAt: Date.now(),
    });
    return { action: "added" };
  },
});

// ─── Get reaction counts for a confession ───
export const getCounts = query({
  args: { confessionId: v.id("confessions") },
  handler: async (ctx, args) => {
    const reactions = await ctx.db
      .query("reactions")
      .withIndex("by_confessionId", (q) =>
        q.eq("confessionId", args.confessionId),
      )
      .collect();

    // Group by type dynamically
    const counts: Record<string, number> = {};

    for (const r of reactions) {
      counts[r.type] = (counts[r.type] || 0) + 1;
    }

    return Object.entries(counts).map(([type, count]) => ({ type, count }));
  },
});

// ─── Get visitor's reactions for a confession ───
export const getVisitorReactions = query({
  args: {
    confessionId: v.id("confessions"),
    visitorId: v.string(),
  },
  handler: async (ctx, args) => {
    const reactions = await ctx.db
      .query("reactions")
      .withIndex("by_confessionId_visitorId", (q) =>
        q.eq("confessionId", args.confessionId).eq("visitorId", args.visitorId),
      )
      .collect();

    return reactions.map((r) => r.type);
  },
});

// ─── Get total unique people who reacted ───
export const getTotalCount = query({
  args: { confessionId: v.id("confessions") },
  handler: async (ctx, args) => {
    const reactions = await ctx.db
      .query("reactions")
      .withIndex("by_confessionId", (q) =>
        q.eq("confessionId", args.confessionId),
      )
      .collect();

    // Count unique visitors who reacted
    const uniqueVisitors = new Set(reactions.map((r) => r.visitorId));
    return uniqueVisitors.size;
  },
});
