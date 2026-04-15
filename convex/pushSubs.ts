import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const subscribe = mutation({
  args: {
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    visitorId: v.string(),
    creatorToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        visitorId: args.visitorId,
        creatorToken: args.creatorToken || existing.creatorToken,
      });
      return existing._id;
    }

    return await ctx.db.insert("pushSubscriptions", {
      endpoint: args.endpoint,
      keys: {
        p256dh: args.p256dh,
        auth: args.auth,
      },
      visitorId: args.visitorId,
      creatorToken: args.creatorToken,
      createdAt: Date.now(),
    });
  },
});

export const removeSubscription = mutation({
  args: { endpoint: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const getSubscriptionsCount = query({
  handler: async (ctx) => {
    return (await ctx.db.query("pushSubscriptions").collect()).length;
  },
});
