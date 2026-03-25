import { mutation } from "./_generated/server";
import sampleData from "../sampleData.json";

// ─── Helpers for realistic seed data ───
const REACTION_TYPES = [
  "holding-you",
  "feels-heavy",
  "youll-be-ok",
  "no-it-burns",
] as const;

const SAMPLE_COMMENTS = [
  "bro this hit way too close to home 💀",
  "i'm in this post and i don't like it",
  "literally me at 3am every night",
  "the accuracy of this is concerning",
  "sending virtual hugs 🤗",
  "we've all been there ngl",
  "this is the most relatable thing i've ever read",
  "why does this feel like a personal attack 😭",
  "somebody check on this person please",
  "the way i felt this in my SOUL",
  "you're not alone in this fr fr",
  "ok but the courage to even type this out >>",
  "reading this at 2am and feeling every word",
  "this should be illegal to be this relatable",
  "tea was absolutely spilled ☕🫖",
];

const COMMENT_NAMES = [
  "anxious panda 🐼",
  "chaotic kitten 🐱",
  "sleepy koala 🐨",
  "dramatic llama 🦙",
  "cryptic jellyfish 🪼",
  "restless penguin 🐧",
  "moody octopus 🐙",
  "fierce hamster 🐹",
  "gentle shark 🦈",
  "lonely cactus 🌵",
];

/** Simple seeded PRNG so results are varied but deterministic-ish per run */
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pickRandom<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

export const seedConfessions = mutation({
  args: {},
  handler: async (ctx) => {
    // Find the global board or any public board
    let board = await ctx.db
      .query("boards")
      .withIndex("by_slug", (q) => q.eq("slug", "global"))
      .first();

    if (!board) {
      const publicBoard = await ctx.db
        .query("boards")
        .filter((q) => q.eq(q.field("visibility"), "public"))
        .first();

      if (publicBoard) {
        board = publicBoard;
      } else {
        const boardId = await ctx.db.insert("boards", {
          slug: "the-tea-room",
          name: "The Tea Room ☕",
          tagline: "Where secrets come to breathe",
          theme: "chai-spill",
          visibility: "public",
          creatorToken: "seed-script",
          createdAt: Date.now(),
        });
        board = await ctx.db.get(boardId);
      }
    }

    if (!board) throw new Error("Could not find or create board");

    const now = Date.now();
    let confessionCount = 0;
    let reactionCount = 0;
    let commentCount = 0;

    for (let i = 0; i < sampleData.length; i++) {
      const c = sampleData[i];
      const rng = seededRandom(i * 1337 + 42);

      // Stagger creation times across the last 7 days
      const confessionAge = Math.floor(rng() * 7 * 24 * 60 * 60 * 1000);
      const confessionTime = now - confessionAge;

      const confessionId = await ctx.db.insert("confessions", {
        boardId: board._id,
        text: c.text,
        category: c.category,
        displayName: c.displayName,
        isGlobal: c.isGlobal,
        views: c.views,
        createdAt: confessionTime,
      });
      confessionCount++;

      // ── Seed reactions ──
      // Scale reaction count relative to views so it feels proportional
      const baseViews = c.views || 10;
      const minReactions = Math.max(3, Math.floor(baseViews * 0.05));
      const maxReactions = Math.max(8, Math.floor(baseViews * 0.25));
      const numReactions =
        minReactions + Math.floor(rng() * (maxReactions - minReactions + 1));

      // Weight reaction types by category for realism
      const weights = getReactionWeights(c.category);

      for (let r = 0; r < numReactions; r++) {
        const reactionType = weightedPick(REACTION_TYPES, weights, rng);
        const visitorId = `seed-visitor-${i}-${r}-${Math.floor(rng() * 99999)}`;
        const reactionTime =
          confessionTime + Math.floor(rng() * Math.min(confessionAge, 2 * 24 * 60 * 60 * 1000));

        await ctx.db.insert("reactions", {
          confessionId,
          type: reactionType,
          visitorId,
          createdAt: reactionTime,
        });
        reactionCount++;
      }

      // ── Seed comments (0-3 per confession, more for popular ones) ──
      const commentChance = baseViews > 200 ? 0.8 : baseViews > 50 ? 0.5 : 0.25;
      if (rng() < commentChance) {
        const numComments = 1 + Math.floor(rng() * (baseViews > 500 ? 3 : 2));
        for (let j = 0; j < numComments; j++) {
          const commentTime =
            confessionTime + Math.floor(rng() * Math.min(confessionAge, 3 * 24 * 60 * 60 * 1000));
          await ctx.db.insert("comments", {
            confessionId,
            text: pickRandom(SAMPLE_COMMENTS, rng),
            displayName: pickRandom(COMMENT_NAMES, rng),
            createdAt: commentTime,
          });
          commentCount++;
        }
      }
    }

    return {
      seeded: confessionCount,
      reactions: reactionCount,
      comments: commentCount,
      boardSlug: board.slug,
    };
  },
});

// ─── Category-aware reaction weighting ───
// Makes certain reactions more likely based on confession category
function getReactionWeights(category: string): number[] {
  // Order: holding-you, feels-heavy, youll-be-ok, no-it-burns
  switch (category) {
    case "regret":
    case "guilt":
      return [3, 4, 2, 1]; // mostly empathy
    case "love":
    case "longing":
      return [4, 2, 3, 1]; // supportive
    case "fear":
      return [3, 3, 3, 1]; // balanced empathy
    case "relief":
      return [2, 1, 4, 1]; // celebratory
    case "mischief":
      return [1, 1, 2, 5]; // "no it burns" = 🔥 hilarious
    case "deep-dark":
      return [2, 4, 1, 3]; // heavy + burns
    case "obsession":
      return [1, 2, 2, 4]; // entertaining
    case "pride":
      return [2, 1, 3, 3]; // mixed
    case "envy":
      return [2, 3, 2, 2]; // empathetic
    default:
      return [1, 1, 1, 1]; // even
  }
}

function weightedPick<T>(
  items: readonly T[],
  weights: number[],
  rng: () => number,
): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = rng() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
}
