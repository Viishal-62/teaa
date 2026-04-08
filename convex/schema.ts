import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ─── Boards ───
  // A board is a confession collection — either public (everyone sees everything)
  // or private (only creator sees confessions, added later with auth).
  boards: defineTable({
    slug: v.string(),
    name: v.string(),
    tagline: v.string(),
    theme: v.string(), // theme key
    boardType: v.optional(v.string()), // "default" | "secret-admirer"
    visibility: v.string(), // "public" | "private"
    pin: v.optional(v.string()), // 4-6 digit PIN for private boards
    creatorToken: v.string(), // random token stored in creator's localStorage
    allowedReactions: v.optional(v.array(v.string())), // Chosen 4 custom reactions
    sharePrompt: v.optional(v.string()), // Custom viral share text
    prompt: v.optional(v.string()), // Custom text prompt shown above the confession textarea
    inboxLastSeenAt: v.optional(v.number()), // Creator inbox watermark for unread/read
    aiSummary: v.optional(v.string()), // AI Vibe summary
    aiSummaryUpdatedAt: v.optional(v.number()), // For caching
    bannedWords: v.optional(v.array(v.string())), // Creator-defined banned words
    contentType: v.optional(v.string()), // Added to fix validation crash
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_createdAt", ["createdAt"])
    .index("by_creatorToken", ["creatorToken"]),

  // ─── Confessions ───
  confessions: defineTable({
    boardId: v.id("boards"),
    type: v.optional(v.string()), // "text" | "voice" | "canvas" (optional for backwards compatibility)
    text: v.optional(v.string()), // For text confessions
    audioUrl: v.optional(v.string()), // For voice confessions (Cloudinary URL)
    voiceTitle: v.optional(v.string()), // User-given title for voice confessions
    isAnonymousVoice: v.optional(v.boolean()), // deprecated — kept for backward compat
    canvasImageUrl: v.optional(v.string()), // For drawing confessions
    caption: v.optional(v.string()), // Short optional caption for doodle confessions
    category: v.string(), // "regret" | "love" | "guilt" | "relief" | "longing" | "mischief" | "obsession" | "pride" | "fear" | "envy" | "deep-dark"
    displayName: v.string(), // auto-generated anonymous name
    isGlobal: v.boolean(), // true = posted to global feed (no specific board)
    views: v.optional(v.number()), // tracked when a user flips the card
    expiresAt: v.optional(v.number()), // timed confession auto-expiry timestamp
    maxViews: v.optional(v.number()), // optional auto-delete after X views
    isFlagged: v.optional(v.boolean()), // Auto-flagged for moderation
    flagReason: v.optional(v.string()), // Reason for flagging
    visitorId: v.optional(v.string()), // For rate limiting
    contentType: v.optional(v.string()), // "confession" | "question"
    cityId: v.optional(v.string()), // Added to fix validation crash
    contextId: v.optional(v.string()), // Added to fix validation crash
    professionId: v.optional(v.string()), // Added to fix validation crash
    createdAt: v.number(),
  })
    .index("by_boardId", ["boardId"])
    .index("by_boardId_category", ["boardId", "category"])
    .index("by_createdAt", ["createdAt"])
    .index("by_expiresAt", ["expiresAt"])
    .index("by_isGlobal", ["isGlobal"])
    .index("by_type", ["type"])
    .index("by_visitorId_createdAt", ["visitorId", "createdAt"]),

  // ─── Reactions ───
  reactions: defineTable({
    confessionId: v.id("confessions"),
    type: v.string(), // "holding-you" | "feels-heavy" | "youll-be-ok" | "no-it-burns"
    visitorId: v.string(), // localStorage fingerprint
    createdAt: v.number(),
  })
    .index("by_confessionId", ["confessionId"])
    .index("by_confessionId_type", ["confessionId", "type"])
    .index("by_confessionId_visitorId", ["confessionId", "visitorId"])
    .index("by_visitorId_createdAt", ["visitorId", "createdAt"]),

  // ─── Comments ───
  comments: defineTable({
    confessionId: v.id("confessions"),
    text: v.string(),
    gifUrl: v.optional(v.string()), // optional GIF URL from Tenor
    displayName: v.string(), // auto-generated anonymous name
    visitorId: v.string(), // For rate limiting
    createdAt: v.number(),
  })
    .index("by_confessionId", ["confessionId"])
    .index("by_createdAt", ["createdAt"])
    .index("by_visitorId_createdAt", ["visitorId", "createdAt"]),

  // ─── Spills (Deep Gossip Books) ───
  spills: defineTable({
    boardId: v.id("boards"),
    title: v.string(),
    coverTheme: v.string(), // key from THEMES
    coverEmoji: v.string(),
    aiImageUrl: v.optional(v.string()), // OpenRouter generated cover
    generationsUsed: v.number(), // Limit strictly to 10
    displayName: v.string(), // Authored pseudo name
    category: v.optional(v.string()), // Category or tags (max 15 chars)
    tags: v.optional(v.array(v.string())), // Up to 3 custom tags
    about: v.optional(v.string()), // Short description (max 15 chars)
    views: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_boardId", ["boardId"])
    .index("by_createdAt", ["createdAt"]),

  // ─── Spill Chapters ───
  chapters: defineTable({
    spillId: v.id("spills"),
    chapterNumber: v.number(), // 1, 2, 3...
    title: v.optional(v.string()),
    text: v.string(),
    createdAt: v.number(),
  })
    .index("by_spillId", ["spillId"])
    .index("by_spillId_chapterNumber", ["spillId", "chapterNumber"]),

  // ─── Spill Reactions ───
  spillReactions: defineTable({
    spillId: v.id("spills"),
    type: v.string(),
    visitorId: v.string(),
    createdAt: v.number(),
  })
    .index("by_spillId", ["spillId"])
    .index("by_spillId_type", ["spillId", "type"])
    .index("by_spillId_visitorId", ["spillId", "visitorId"]),

  // ─── Global AI Summaries ───
  globalSummaries: defineTable({
    summary: v.string(),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),

  // ─── Moderation Reports ───
  reports: defineTable({
    confessionId: v.id("confessions"),
    visitorId: v.string(),
    reason: v.string(),
    createdAt: v.number(),
  })
    .index("by_confessionId", ["confessionId"])
    .index("by_visitorId", ["visitorId"]),

  // ─── Creator Replies (Verified Board Owner Responses) ───
  creatorReplies: defineTable({
    confessionId: v.id("confessions"),
    boardId: v.id("boards"),
    text: v.string(),
    creatorToken: v.string(), // Must match board.creatorToken
    createdAt: v.number(),
  })
    .index("by_confessionId", ["confessionId"])
    .index("by_boardId", ["boardId"]),

  // ─── Feature Requests (Forum) ───
  featureRequests: defineTable({
    title: v.string(),
    description: v.string(),
    status: v.string(), // "under-review", "planned", "shipped"
    upvotes: v.number(),
    visitorId: v.string(),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"])
    .index("by_upvotes", ["upvotes"]),

  // ─── Feature Upvotes ───
  featureUpvotes: defineTable({
    requestId: v.id("featureRequests"),
    visitorId: v.string(),
    createdAt: v.number(),
  })
    .index("by_requestId", ["requestId"])
    .index("by_visitorId", ["visitorId"])
    .index("by_requestId_visitorId", ["requestId", "visitorId"]),
});
