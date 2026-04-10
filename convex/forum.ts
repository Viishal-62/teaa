import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const submitFeatureRequest = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    visitorId: v.string(),
  },
  handler: async (ctx, args) => {
    // Basic validation
    if (!args.title.trim() || !args.description.trim() || !args.visitorId) {
      throw new Error("Missing required fields");
    }

    const requestId = await ctx.db.insert("featureRequests", {
      title: args.title.trim().slice(0, 100),
      description: args.description.trim().slice(0, 1000),
      status: "under-review", // default status
      upvotes: 1, // Automatically give it 1 upvote by creator
      visitorId: args.visitorId,
      createdAt: Date.now(),
    });

    // Add creator upvote to prevent them voting again
    await ctx.db.insert("featureUpvotes", {
      requestId,
      visitorId: args.visitorId,
      createdAt: Date.now(),
    });

    return requestId;
  },
});

export const listFeatureRequests = query({
  args: {
    status: v.optional(v.string()), // "under-review", "planned", "shipped"
  },
  handler: async (ctx, args) => {
    let allRequests;
    if (args.status) {
      allRequests = await ctx.db
        .query("featureRequests")
        .withIndex("by_status", (q) => q.eq("status", args.status as string))
        .collect();
    } else {
      allRequests = await ctx.db.query("featureRequests").collect();
    }

    // Sort by upvotes (descending), then by date (newest first)
    return allRequests.sort(
      (a, b) => b.upvotes - a.upvotes || b.createdAt - a.createdAt,
    );
  },
});

export const toggleUpvote = mutation({
  args: {
    requestId: v.id("featureRequests"),
    visitorId: v.string(),
  },
  handler: async (ctx, args) => {
    const existingUpvote = await ctx.db
      .query("featureUpvotes")
      .withIndex("by_requestId_visitorId", (q) =>
        q.eq("requestId", args.requestId).eq("visitorId", args.visitorId),
      )
      .first();

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Feature Request not found.");
    }

    if (existingUpvote) {
      // Remove upvote
      await ctx.db.delete(existingUpvote._id);
      await ctx.db.patch(args.requestId, {
        upvotes: Math.max(0, request.upvotes - 1),
      });
      return { upvoted: false };
    } else {
      // Add upvote
      await ctx.db.insert("featureUpvotes", {
        requestId: args.requestId,
        visitorId: args.visitorId,
        createdAt: Date.now(),
      });
      await ctx.db.patch(args.requestId, {
        upvotes: request.upvotes + 1,
      });
      return { upvoted: true };
    }
  },
});

export const getUserUpvotes = query({
  args: {
    visitorId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.visitorId) return [];
    const upvotes = await ctx.db
      .query("featureUpvotes")
      .withIndex("by_visitorId", (q) =>
        q.eq("visitorId", args.visitorId as string),
      )
      .collect();

    // Return array of requestId strings for easier checking on client
    return upvotes.map((u) => u.requestId);
  },
});
