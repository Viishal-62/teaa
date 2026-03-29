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
    visibility: v.string(), // "public" | "private"
    pin: v.optional(v.string()), // 4-6 digit PIN for private boards
    creatorToken: v.string(), // random token stored in creator's localStorage
    allowedReactions: v.optional(v.array(v.string())), // Chosen 4 custom reactions
    sharePrompt: v.optional(v.string()), // Custom viral share text
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_createdAt", ["createdAt"])
    .index("by_creatorToken", ["creatorToken"]),

  // ─── Confessions ───
  confessions: defineTable({
    boardId: v.id("boards"),
    text: v.string(),
    category: v.string(), // "regret" | "love" | "guilt" | "relief" | "longing" | "mischief" | "obsession" | "pride" | "fear" | "envy" | "deep-dark"
    displayName: v.string(), // auto-generated anonymous name
    isGlobal: v.boolean(), // true = posted to global feed (no specific board)
    views: v.optional(v.number()), // tracked when a user flips the card
    createdAt: v.number(),
  })
    .index("by_boardId", ["boardId"])
    .index("by_boardId_category", ["boardId", "category"])
    .index("by_createdAt", ["createdAt"])
    .index("by_isGlobal", ["isGlobal"]),

  // ─── Reactions ───
  reactions: defineTable({
    confessionId: v.id("confessions"),
    type: v.string(), // "holding-you" | "feels-heavy" | "youll-be-ok" | "no-it-burns"
    visitorId: v.string(), // localStorage fingerprint
    createdAt: v.number(),
  })
    .index("by_confessionId", ["confessionId"])
    .index("by_confessionId_type", ["confessionId", "type"])
    .index("by_confessionId_visitorId", ["confessionId", "visitorId"]),

  // ─── Comments ───
  comments: defineTable({
    confessionId: v.id("confessions"),
    text: v.string(),
    gifUrl: v.optional(v.string()), // optional GIF URL from Tenor
    displayName: v.string(), // auto-generated anonymous name
    createdAt: v.number(),
  })
    .index("by_confessionId", ["confessionId"])
    .index("by_createdAt", ["createdAt"]),

  // ─── Spills (Deep Gossip Books) ───
  spills: defineTable({
    boardId: v.id("boards"),
    title: v.string(),
    coverTheme: v.string(), // key from THEMES
    coverEmoji: v.string(),
    aiImageUrl: v.optional(v.string()), // OpenRouter generated cover
    generationsUsed: v.number(), // Limit strictly to 10
    displayName: v.string(), // Authored pseudo name
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
});
