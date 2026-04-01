import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const create = mutation({
  args: {
    confessionId: v.id("confessions"),
    visitorId: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const reportId = await ctx.db.insert("reports", {
      confessionId: args.confessionId,
      visitorId: args.visitorId,
      reason: args.reason,
      createdAt: Date.now(),
    });

    return reportId;
  },
});
