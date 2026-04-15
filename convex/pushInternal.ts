import { v } from "convex/values";
import { internalQuery, internalMutation } from "./_generated/server";

export const getSubscriptionsForCreator = internalQuery({
  args: { creatorToken: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_creatorToken", (q) => q.eq("creatorToken", args.creatorToken))
      .collect();
  },
});

export const getAllSubscriptions = internalQuery({
  handler: async (ctx) => {
    return await ctx.db.query("pushSubscriptions").collect();
  },
});

export const removeSubscriptionInternal = internalMutation({
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
