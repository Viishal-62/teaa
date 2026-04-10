import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { generateAnonName } from "./helpers";
import { moderateText } from "./moderation";

function isExpired(expiresAt?: number, now = Date.now()) {
  return typeof expiresAt === "number" && expiresAt <= now;
}

function isBoardPublic(visibility?: string) {
  return String(visibility ?? "").toLowerCase() !== "private";
}

// Moderation is handled via shared moderation.ts utility

async function deleteConfessionCascade(ctx: any, confessionId: any) {
  const reactions = await ctx.db
    .query("reactions")
    .withIndex("by_confessionId", (q: any) =>
      q.eq("confessionId", confessionId),
    )
    .collect();
  for (const r of reactions) {
    await ctx.db.delete(r._id);
  }

  const comments = await ctx.db
    .query("comments")
    .withIndex("by_confessionId", (q: any) =>
      q.eq("confessionId", confessionId),
    )
    .collect();
  for (const c of comments) {
    await ctx.db.delete(c._id);
  }

  await ctx.db.delete(confessionId);
}

// ——— Create a confession (text or voice) ———
export const create = mutation({
  args: {
    boardId: v.id("boards"), // Required: actual board document ID
    type: v.optional(v.string()), // "text" | "voice" | "canvas" (optional, defaults to "text")
    text: v.optional(v.string()), // For text confessions
    audioUrl: v.optional(v.string()), // For voice confessions (Cloudinary URL)
    voiceTitle: v.optional(v.string()), // Optional title for voice confessions
    cloudinaryPublicId: v.optional(v.string()), // For reference
    isAnonymousVoice: v.optional(v.boolean()), // deprecated
    duration: v.optional(v.number()), // Audio duration in seconds
    canvasImageUrl: v.optional(v.string()), // For doodle confessions (Cloudinary URL)
    caption: v.optional(v.string()), // Short caption for doodle confessions
    category: v.string(),
    isGlobal: v.optional(v.boolean()),
    expiresAt: v.optional(v.number()),
    maxViews: v.optional(v.number()),
    visitorId: v.string(), // Required for rate limiting
    contentType: v.optional(v.string()), // "confession" | "question"
    cityId: v.optional(v.string()),
    professionId: v.optional(v.string()),
    contextId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Default type to "text" for backwards compatibility
    const confessionType = args.type || "text";

    // Validate type
    if (!["text", "voice", "canvas"].includes(confessionType)) {
      throw new Error("Invalid confession type");
    }

    // Text confession validation
    if (confessionType === "text") {
      if (!args.text || args.text.trim().length === 0) {
        throw new Error("Confession text cannot be empty");
      }
      const wordCount = args.text.trim().split(/\s+/).length;
      if (wordCount > 500) {
        throw new Error("Confession text cannot exceed 500 words");
      }
    }

    // Voice confession validation
    if (confessionType === "voice") {
      if (!args.audioUrl) {
        throw new Error("Audio URL is required for voice confessions");
      }
      if (!args.duration || args.duration > 30) {
        throw new Error("Audio duration must be between 0 and 30 seconds");
      }
    }

    // Canvas/doodle confession validation
    if (confessionType === "canvas") {
      if (!args.canvasImageUrl) {
        throw new Error("Image URL is required for doodle confessions");
      }
      if (args.caption && args.caption.length > 120) {
        throw new Error("Caption cannot exceed 120 characters");
      }
    }

    if (args.expiresAt !== undefined && args.expiresAt <= Date.now()) {
      throw new Error("Expiry time must be in the future");
    }

    if (
      args.maxViews !== undefined &&
      (args.maxViews < 1 || args.maxViews > 10000)
    ) {
      throw new Error("maxViews must be between 1 and 10000");
    }

    // ─── Rate Limiting ───
    const TEN_MINS = 10 * 60 * 1000;
    const recentConfessions = await ctx.db
      .query("confessions")
      .withIndex("by_visitorId_createdAt", (q) =>
        q
          .eq("visitorId", args.visitorId)
          .gt("createdAt", Date.now() - TEN_MINS),
      )
      .collect();

    if (recentConfessions.length >= 5) {
      throw new Error(
        JSON.stringify({
          type: "rate_limit_error",
          message:
            "Whoa! You're spilling too much tea. Take a 10-minute break.",
        }),
      );
    }

    // ─── Content Moderation ───
    const board = await ctx.db.get(args.boardId);

    if (args.text) {
      const moderation = moderateText(args.text, board?.bannedWords ?? []);
      if (!moderation.isClean) {
        // Hard reject — do NOT create the confession
        throw new Error(
          JSON.stringify({
            type: "moderation_error",
            flaggedWords: moderation.flaggedWords,
            message: moderation.message,
          }),
        );
      }
    }

    // Voice title check
    if (args.voiceTitle) {
      const titleMod = moderateText(args.voiceTitle, board?.bannedWords ?? []);
      if (!titleMod.isClean) {
        throw new Error(
          JSON.stringify({
            type: "moderation_error",
            flaggedWords: titleMod.flaggedWords,
            message:
              "Your voice title contains restricted words. Please change it.",
          }),
        );
      }
    }

    const displayName = generateAnonName();

    const confessionId = await ctx.db.insert("confessions", {
      boardId: args.boardId,
      type: confessionType,
      text:
        confessionType === "text"
          ? args.text?.trim()
          : confessionType === "canvas" && args.caption
            ? args.caption.trim()
            : undefined,
      audioUrl: confessionType === "voice" ? args.audioUrl : undefined,
      voiceTitle:
        confessionType === "voice" ? args.voiceTitle?.trim() : undefined,
      isAnonymousVoice:
        confessionType === "voice"
          ? (args.isAnonymousVoice ?? false)
          : undefined,
      canvasImageUrl:
        confessionType === "canvas" ? args.canvasImageUrl : undefined,
      caption: confessionType === "canvas" ? args.caption?.trim() : undefined,
      category: args.category,
      displayName,
      isGlobal: args.isGlobal !== false,
      expiresAt: args.expiresAt,
      maxViews: args.maxViews ? args.maxViews + 1 : undefined,
      isFlagged: false,
      flagReason: "",
      visitorId: args.visitorId,
      contentType: args.contentType,
      cityId: args.cityId,
      professionId: args.professionId,
      contextId: args.contextId,
      createdAt: Date.now(),
    });

    return { confessionId, displayName };
  },
});

// ——— Real-time content moderation check ———
export const checkModeration = query({
  args: {
    text: v.string(),
    boardId: v.optional(v.id("boards")),
  },
  handler: async (ctx, args) => {
    if (!args.text || args.text.trim().length === 0) {
      return { isClean: true, flaggedWords: [], message: "" };
    }

    let customWords: string[] = [];
    if (args.boardId) {
      const board = await ctx.db.get(args.boardId);
      customWords = board?.bannedWords ?? [];
    }

    return moderateText(args.text, customWords);
  },
});

// ——— Get a single confession by ID ———
export const getById = query({
  args: { confessionId: v.id("confessions") },
  handler: async (ctx, args) => {
    const confession = await ctx.db.get(args.confessionId);
    if (!confession || confession.isFlagged) return null;
    if (isExpired(confession.expiresAt)) return null;
    return confession;
  },
});

// ——— List confessions for a board ———
export const listByBoard = query({
  args: {
    boardId: v.id("boards"),
    category: v.optional(v.string()),
    pin: v.optional(v.string()),
    creatorToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const board = await ctx.db.get(args.boardId);
    if (!board) return [];

    if (
      board.visibility === "private" &&
      board.creatorToken !== args.creatorToken &&
      board.pin !== args.pin
    ) {
      return [];
    }

    const now = Date.now();
    let confessions;

    if (args.category && args.category !== "all") {
      confessions = await ctx.db
        .query("confessions")
        .withIndex("by_boardId_category", (q) =>
          q.eq("boardId", args.boardId).eq("category", args.category!),
        )
        .order("desc")
        .take(100);
    } else {
      confessions = await ctx.db
        .query("confessions")
        .withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
        .order("desc")
        .take(100);
    }

    return confessions.filter(
      (c) => !isExpired(c.expiresAt, now) && !c.isFlagged,
    );
  },
});

// ——— List all recent confessions (for AI summarization) ———
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const confessions = await ctx.db
      .query("confessions")
      .withIndex("by_createdAt")
      .order("desc")
      .take(100);
    return confessions.filter(
      (c) => !isExpired(c.expiresAt, now) && !c.isFlagged,
    );
  },
});

// ——— Inbox list for board creator ———
export const listInboxByBoard = query({
  args: {
    boardId: v.id("boards"),
    creatorToken: v.string(),
  },
  handler: async (ctx, args) => {
    const board = await ctx.db.get(args.boardId);
    if (!board) {
      throw new Error("Not found");
    }
    const isOwner = board.creatorToken === args.creatorToken;
    if (!isOwner && board.visibility === "private") {
      throw new Error("Unauthorized");
    }

    const now = Date.now();
    const lastSeenAt = board.inboxLastSeenAt ?? 0;

    const confessions = await ctx.db
      .query("confessions")
      .withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
      .order("desc")
      .take(300);

    const active = confessions.filter((c) => !isExpired(c.expiresAt, now));
    const rows = active.map((c) => ({
      ...c,
      isUnread: c.createdAt > lastSeenAt,
    }));

    return {
      lastSeenAt,
      unreadCount: rows.filter((r) => r.isUnread).length,
      rows,
    };
  },
});

// ——— Get unread badge count for creator ———
export const inboxUnreadCount = query({
  args: {
    boardId: v.id("boards"),
    creatorToken: v.string(),
  },
  handler: async (ctx, args) => {
    const board = await ctx.db.get(args.boardId);
    if (!board || board.creatorToken !== args.creatorToken) return 0;

    const now = Date.now();
    const lastSeenAt = board.inboxLastSeenAt ?? 0;
    const confessions = await ctx.db
      .query("confessions")
      .withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
      .order("desc")
      .take(300);

    return confessions.filter(
      (c) => !isExpired(c.expiresAt, now) && c.createdAt > lastSeenAt,
    ).length;
  },
});

// ——— Global feed — all public confessions ———
export const globalFeed = query({
  args: {
    category: v.optional(v.string()),
    cityId: v.optional(v.string()),
    professionId: v.optional(v.string()),
    contextId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let confessions = await ctx.db
      .query("confessions")
      .withIndex("by_createdAt")
      .order("desc")
      .take(250);

    const enriched = [];
    for (const confession of confessions) {
      if (isExpired(confession.expiresAt, now)) continue;
      if (args.category && args.category !== "all") {
        if (confession.category !== args.category) continue;
      }
      if (args.cityId && confession.cityId !== args.cityId) continue;
      if (args.professionId && confession.professionId !== args.professionId)
        continue;
      if (args.contextId && confession.contextId !== args.contextId) continue;

      const ADMIRER_CATEGORIES = [
        "crush",
        "compliment",
        "attraction",
        "gratitude",
        "admiration",
        "confession",
        "secret-admirer",
      ];
      if (ADMIRER_CATEGORIES.includes(confession.category)) continue;

      const board = await ctx.db.get(confession.boardId);
      if (!board || confession.isFlagged) continue;
      const shouldShow = confession.isGlobal || isBoardPublic(board.visibility);
      if (!shouldShow) continue;

      if (isBoardPublic(board.visibility)) {
        enriched.push({
          ...confession,
          boardName: board.name,
          boardSlug: board.slug,
          boardTheme: board.theme,
          boardType: board.boardType || "default",
        });
      } else {
        enriched.push({
          ...confession,
          boardName: "",
          boardSlug: "",
          boardTheme: board.theme,
          boardType: board.boardType || "default",
        });
      }

      if (enriched.length >= 100) break;
    }

    return enriched;
  },
});

// ——— Voice confessions feed (for dedicated voice page) ———
export const voiceFeed = query({
  args: {
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const confessions = await ctx.db
      .query("confessions")
      .withIndex("by_type", (q) => q.eq("type", "voice"))
      .order("desc")
      .take(100);

    const enriched = [];
    for (const confession of confessions) {
      if (isExpired(confession.expiresAt, now)) continue;
      if (!confession.audioUrl) continue;
      if (args.category && args.category !== "all") {
        if (confession.category !== args.category) continue;
      }

      const board = await ctx.db.get(confession.boardId);
      if (!board) continue;
      const shouldShow = confession.isGlobal || isBoardPublic(board.visibility);
      if (!shouldShow) continue;

      enriched.push({
        ...confession,
        boardName: isBoardPublic(board.visibility) ? board.name : "",
        boardSlug: isBoardPublic(board.visibility) ? board.slug : "",
        boardTheme: board.theme,
      });

      if (enriched.length >= 50) break;
    }

    return enriched;
  },
});

// ——— Delete a confession (by board creator) ———
export const remove = mutation({
  args: {
    confessionId: v.id("confessions"),
    creatorToken: v.string(),
  },
  handler: async (ctx, args) => {
    const confession = await ctx.db.get(args.confessionId);
    if (!confession) throw new Error("Confession not found");

    const board = await ctx.db.get(confession.boardId);
    if (!board || board.creatorToken !== args.creatorToken) {
      throw new Error(
        "Unauthorized: only the board creator can delete confessions",
      );
    }

    await deleteConfessionCascade(ctx, args.confessionId);
    return { success: true };
  },
});

// ——— Increment views ———
// ——— Increment views ———
export const incrementView = mutation({
  args: { confessionId: v.id("confessions") },
  handler: async (ctx, args) => {
    const confession = await ctx.db.get(args.confessionId);
    if (!confession) return { deleted: false, views: 0 };

    const now = Date.now();
    if (isExpired(confession.expiresAt, now)) {
      await deleteConfessionCascade(ctx, args.confessionId);
      return { deleted: true, views: confession.views ?? 0 };
    }

    const newViews = (confession.views || 0) + 1;

    // Save the view count first
    await ctx.db.patch(args.confessionId, {
      views: newViews,
    });

    // THEN check if we should delete (after the view is saved)
    if (confession.maxViews && newViews >= confession.maxViews) {
      await deleteConfessionCascade(ctx, args.confessionId);
      return { deleted: true, views: newViews };
    }

    return { deleted: false, views: newViews };
  },
});

// ——— Get confession count for a board ———
export const countByBoard = query({
  args: { boardId: v.id("boards") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const confessions = await ctx.db
      .query("confessions")
      .withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
      .collect();
    return confessions.filter((c) => !isExpired(c.expiresAt, now)).length;
  },
});

// ——— Confession / Teaa of the Day ———
export const confessionOfTheDay = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const recent = await ctx.db
      .query("confessions")
      .withIndex("by_createdAt")
      .order("desc")
      .take(250);

    const confessions = [];
    for (const c of recent) {
      if (isExpired(c.expiresAt, now)) continue;
      const board = await ctx.db.get(c.boardId);
      if (!board) continue;
      if (c.isGlobal || isBoardPublic(board.visibility)) {
        confessions.push(c);
      }
      if (confessions.length >= 100) break;
    }

    if (confessions.length === 0) return null;

    const scored = await Promise.all(
      confessions.map(async (c) => {
        const reactions = await ctx.db
          .query("reactions")
          .withIndex("by_confessionId", (q) => q.eq("confessionId", c._id))
          .collect();
        const board = await ctx.db.get(c.boardId);
        return {
          ...c,
          score: reactions.length + (c.views ?? 0),
          reactionCount: reactions.length,
          boardName: board?.name ?? "",
          boardSlug: board?.slug ?? "",
        };
      }),
    );

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, Math.max(10, scored.length));
    const daySeed = Math.floor(Date.now() / 86400000);
    return top[daySeed % top.length];
  },
});

// ——— Scheduled cleanup for expired confessions ———
export const cleanupExpired = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const allConfessions = await ctx.db
      .query("confessions")
      .withIndex("by_createdAt")
      .order("desc")
      .take(500);

    let deletedCount = 0;
    for (const confession of allConfessions) {
      if (isExpired(confession.expiresAt, now)) {
        await deleteConfessionCascade(ctx, confession._id);
        deletedCount++;
      }
    }

    return { deleted: deletedCount };
  },
});

// ——— Mood Ring: Board emotion distribution ———
export const getMoodDistribution = query({
  args: {
    boardId: v.id("boards"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;

    const confessions = await ctx.db
      .query("confessions")
      .withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
      .order("desc")
      .take(200);

    const active = confessions.filter(
      (c) => !isExpired(c.expiresAt, now) && !c.isFlagged,
    );

    // Count categories
    const distribution: Record<string, number> = {};
    let recentActivity = 0;

    for (const c of active) {
      distribution[c.category] = (distribution[c.category] || 0) + 1;
      if (c.createdAt > now - ONE_HOUR) {
        recentActivity++;
      }
    }

    // Find dominant emotion
    let dominant = "";
    let maxCount = 0;
    for (const [cat, count] of Object.entries(distribution)) {
      if (count > maxCount) {
        maxCount = count;
        dominant = cat;
      }
    }

    return {
      total: active.length,
      distribution,
      dominant,
      recentActivity,
    };
  },
});

// ——— Global Mood Ring: Platform-wide emotion distribution ———
export const getGlobalMoodDistribution = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;

    const ADMIRER_CATS = [
      "crush",
      "compliment",
      "attraction",
      "gratitude",
      "admiration",
      "confession",
      "secret-admirer",
    ];

    const confessions = await ctx.db
      .query("confessions")
      .withIndex("by_createdAt")
      .order("desc")
      .take(300);

    const distribution: Record<string, number> = {};
    let recentActivity = 0;
    let total = 0;

    for (const c of confessions) {
      if (isExpired(c.expiresAt, now) || c.isFlagged) continue;
      if (ADMIRER_CATS.includes(c.category)) continue;

      distribution[c.category] = (distribution[c.category] || 0) + 1;
      total++;
      if (c.createdAt > now - ONE_HOUR) {
        recentActivity++;
      }
    }

    let dominant = "";
    let maxCount = 0;
    for (const [cat, count] of Object.entries(distribution)) {
      if (count > maxCount) {
        maxCount = count;
        dominant = cat;
      }
    }

    return { total, distribution, dominant, recentActivity };
  },
});

// ——— Global context distribution (cities, professions, contexts) ———
export const getGlobalContextDistribution = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const ADMIRER_CATS = [
      "crush",
      "compliment",
      "attraction",
      "gratitude",
      "admiration",
      "confession",
      "secret-admirer",
    ];

    const confessions = await ctx.db
      .query("confessions")
      .withIndex("by_createdAt")
      .order("desc")
      .take(300);

    const cities: Record<string, number> = {};
    const professions: Record<string, number> = {};
    const contexts: Record<string, number> = {};

    for (const c of confessions) {
      if (isExpired(c.expiresAt, now) || c.isFlagged) continue;
      if (ADMIRER_CATS.includes(c.category)) continue;

      if (c.cityId) cities[c.cityId] = (cities[c.cityId] || 0) + 1;
      if (c.professionId)
        professions[c.professionId] = (professions[c.professionId] || 0) + 1;
      if (c.contextId) contexts[c.contextId] = (contexts[c.contextId] || 0) + 1;
    }

    const toSorted = (obj: Record<string, number>) =>
      Object.entries(obj)
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);

    return {
      cities: toSorted(cities),
      professions: toSorted(professions),
      contexts: toSorted(contexts),
    };
  },
});
