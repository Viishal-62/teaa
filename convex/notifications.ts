import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * ─── Confessor Notifications ───
 * Given a visitorId and a "last seen" timestamp,
 * find all activity on confessions this visitor created.
 *
 * Returns notifications sorted by priority:
 *   1. Creator Replies (highest — special golden notification)
 *   2. Stats updates (views, reactions, comments)
 */
export const getConfessorNotifications = query({
  args: {
    visitorId: v.string(),
    lastSeenAt: v.number(), // timestamp from localStorage
  },
  handler: async (ctx, args) => {
    if (!args.visitorId) return { creatorReplies: [], stats: [] };

    // Find all confessions by this visitor
    const myConfessions = await ctx.db
      .query("confessions")
      .withIndex("by_visitorId_createdAt", (q) =>
        q.eq("visitorId", args.visitorId),
      )
      .order("desc")
      .take(20);

    if (myConfessions.length === 0) return { creatorReplies: [], stats: [] };

    const creatorReplyNotifs: {
      confessionId: string;
      confessionText: string;
      replyText: string;
      replyCreatedAt: number;
      boardSlug: string;
      boardName: string;
    }[] = [];

    const statsNotifs: {
      confessionId: string;
      confessionText: string;
      views: number;
      reactionCount: number;
      commentCount: number;
      boardSlug: string;
    }[] = [];

    for (const confession of myConfessions) {
      const board = await ctx.db.get(confession.boardId);
      const boardSlug = board?.slug ?? "global";
      const boardName = board?.name ?? "Unknown Board";
      const confessionPreview = (confession.text ?? "Your confession").slice(
        0,
        60,
      );

      // Check for creator reply
      const creatorReply = await ctx.db
        .query("creatorReplies")
        .withIndex("by_confessionId", (q) =>
          q.eq("confessionId", confession._id),
        )
        .first();

      if (creatorReply && creatorReply.createdAt > args.lastSeenAt) {
        creatorReplyNotifs.push({
          confessionId: confession._id,
          confessionText: confessionPreview,
          replyText: creatorReply.text.slice(0, 100),
          replyCreatedAt: creatorReply.createdAt,
          boardSlug,
          boardName,
        });
      }

      // Gather stats
      const reactions = await ctx.db
        .query("reactions")
        .withIndex("by_confessionId", (q) =>
          q.eq("confessionId", confession._id),
        )
        .collect();

      const comments = await ctx.db
        .query("comments")
        .withIndex("by_confessionId", (q) =>
          q.eq("confessionId", confession._id),
        )
        .collect();

      const newReactions = reactions.filter(
        (r) => r.createdAt > args.lastSeenAt,
      ).length;
      const newComments = comments.filter(
        (c) => c.createdAt > args.lastSeenAt,
      ).length;
      const views = confession.views ?? 0;

      // Only show stats if there's meaningful activity
      if (views > 0 || newReactions > 0 || newComments > 0) {
        statsNotifs.push({
          confessionId: confession._id,
          confessionText: confessionPreview,
          views,
          reactionCount: newReactions,
          commentCount: newComments,
          boardSlug,
        });
      }
    }

    // Sort creator replies by newest first
    creatorReplyNotifs.sort((a, b) => b.replyCreatedAt - a.replyCreatedAt);

    return {
      creatorReplies: creatorReplyNotifs,
      stats: statsNotifs.filter(
        (s) => s.reactionCount > 0 || s.commentCount > 0,
      ),
    };
  },
});

/**
 * ─── Creator Notifications ───
 * Given a creatorToken, find boards they own and count new confessions.
 */
export const getCreatorNotifications = query({
  args: {
    creatorToken: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.creatorToken) return [];

    // Find boards owned by this creator
    const boards = await ctx.db
      .query("boards")
      .withIndex("by_creatorToken", (q) =>
        q.eq("creatorToken", args.creatorToken),
      )
      .take(10);

    if (boards.length === 0) return [];

    const notifications: {
      boardId: string;
      boardName: string;
      boardSlug: string;
      newConfessionCount: number;
      latestPreview: string;
      latestCreatedAt: number;
    }[] = [];

    for (const board of boards) {
      const lastSeen = board.inboxLastSeenAt ?? 0;

      const confessions = await ctx.db
        .query("confessions")
        .withIndex("by_boardId", (q) => q.eq("boardId", board._id))
        .order("desc")
        .take(50);

      const newOnes = confessions.filter((c) => c.createdAt > lastSeen);

      if (newOnes.length > 0) {
        const latest = newOnes[0];
        notifications.push({
          boardId: board._id,
          boardName: board.name,
          boardSlug: board.slug,
          newConfessionCount: newOnes.length,
          latestPreview: (latest.text ?? "New confession").slice(0, 50),
          latestCreatedAt: latest.createdAt,
        });
      }
    }

    return notifications;
  },
});
