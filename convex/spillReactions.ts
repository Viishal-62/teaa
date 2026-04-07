import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── Toggle a spill reaction (add or remove) ───
export const toggle = mutation({
  args: {
    spillId: v.id("spills"),
    type: v.string(),
    visitorId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("spillReactions")
      .withIndex("by_spillId_visitorId", (q) =>
        q.eq("spillId", args.spillId).eq("visitorId", args.visitorId),
      )
      .filter((q) => q.eq(q.field("type"), args.type))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { action: "removed" as const };
    }

    await ctx.db.insert("spillReactions", {
      spillId: args.spillId,
      type: args.type,
      visitorId: args.visitorId,
      createdAt: Date.now(),
    });
    return { action: "added" as const };
  },
});

// ─── Get reaction counts for a spill ───
export const getCounts = query({
  args: { spillId: v.id("spills") },
  handler: async (ctx, args) => {
    const reactions = await ctx.db
      .query("spillReactions")
      .withIndex("by_spillId", (q) => q.eq("spillId", args.spillId))
      .collect();

    const counts: Record<string, number> = {};
    for (const r of reactions) {
      counts[r.type] = (counts[r.type] || 0) + 1;
    }

    return Object.entries(counts).map(([type, count]) => ({ type, count }));
  },
});

// ─── Get which reactions this visitor has given ───
export const getVisitorReactions = query({
  args: {
    spillId: v.id("spills"),
    visitorId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.visitorId) return [];
    const reactions = await ctx.db
      .query("spillReactions")
      .withIndex("by_spillId_visitorId", (q) =>
        q.eq("spillId", args.spillId).eq("visitorId", args.visitorId),
      )
      .collect();

    return reactions.map((r) => r.type);
  },
});

// ─── Get total reaction count (for ranking) ───
export const getTotalCount = query({
  args: { spillId: v.id("spills") },
  handler: async (ctx, args) => {
    const reactions = await ctx.db
      .query("spillReactions")
      .withIndex("by_spillId", (q) => q.eq("spillId", args.spillId))
      .collect();

    return reactions.length;
  },
});
