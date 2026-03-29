import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Generate a short-lived URL for the client to POST a file directly
 * to Convex's storage system.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Get the permanent, public URL for a storageId (reactive query).
 */
export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

/**
 * Get the permanent, public URL for a storageId (imperative mutation).
 * Use this when you need to get the URL in an async flow (e.g. after upload).
 */
export const getStorageUrl = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
