import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { moderateText } from "./moderation";

const MAX_POLLS_PER_BOARD = 2;

// ─── Create a Poll (board creator only, max 2 per board) ───
export const create = mutation({
  args: {
    boardId: v.id("boards"),
    question: v.string(),
    options: v.array(v.string()),
    imageUrl: v.optional(v.string()),
    creatorToken: v.string(),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Validate creator
    const board = await ctx.db.get(args.boardId);
    if (!board || board.creatorToken !== args.creatorToken) {
      throw new Error("Unauthorized: only the board creator can create polls");
    }

    // Validate question
    if (!args.question.trim() || args.question.trim().length > 200) {
      throw new Error("Question must be 1-200 characters");
    }

    // Validate options
    if (args.options.length < 2 || args.options.length > 5) {
      throw new Error("Polls require 2-5 options");
    }
    for (const opt of args.options) {
      if (!opt.trim() || opt.trim().length > 50) {
        throw new Error("Each option must be 1-50 characters");
      }
    }

    // Validate expiry
    if (args.expiresAt !== undefined && args.expiresAt <= Date.now()) {
      throw new Error("Expiry time must be in the future");
    }

    // Check how many active polls exist on this board
    const activePolls = await ctx.db
      .query("polls")
      .withIndex("by_boardId_isActive", (q) =>
        q.eq("boardId", args.boardId).eq("isActive", true),
      )
      .collect();

    // Filter out logically expired polls from the active count
    const actuallyActive = activePolls.filter(
      (p) => !p.expiresAt || p.expiresAt > Date.now(),
    );

    if (actuallyActive.length >= MAX_POLLS_PER_BOARD) {
      throw new Error(
        `You can have at most ${MAX_POLLS_PER_BOARD} active polls. End or delete an existing poll first.`,
      );
    }

    // Content moderation on question
    const modResult = moderateText(args.question, board.bannedWords ?? [], {
      disableCommonProfanityFilter: true,
    });
    if (!modResult.isClean) {
      throw new Error(
        JSON.stringify({
          type: "moderation_error",
          flaggedWords: modResult.flaggedWords,
          message: "Your poll question contains restricted words.",
        }),
      );
    }

    // Content moderation on options
    for (const opt of args.options) {
      const optMod = moderateText(opt, board.bannedWords ?? [], {
        disableCommonProfanityFilter: true,
      });
      if (!optMod.isClean) {
        throw new Error(
          JSON.stringify({
            type: "moderation_error",
            flaggedWords: optMod.flaggedWords,
            message: `Option "${opt}" contains restricted words.`,
          }),
        );
      }
    }

    const pollId = await ctx.db.insert("polls", {
      boardId: args.boardId,
      question: args.question.trim(),
      options: args.options.map((o) => o.trim()),
      imageUrl: args.imageUrl,
      creatorToken: args.creatorToken,
      expiresAt: args.expiresAt,
      isActive: true,
      totalVotes: 0,
      createdAt: Date.now(),
    });

    return { pollId };
  },
});

// ─── Vote on a Poll ───
export const vote = mutation({
  args: {
    pollId: v.id("polls"),
    optionIndex: v.number(),
    visitorId: v.string(),
  },
  handler: async (ctx, args) => {
    const poll = await ctx.db.get(args.pollId);
    if (!poll) throw new Error("Poll not found");

    // Check if poll is active
    if (!poll.isActive) {
      throw new Error("This poll has ended");
    }

    // Check if poll has expired
    if (poll.expiresAt && poll.expiresAt <= Date.now()) {
      // Auto-close expired poll
      await ctx.db.patch(args.pollId, { isActive: false });
      throw new Error("This poll has expired");
    }

    // Validate option index
    if (args.optionIndex < 0 || args.optionIndex >= poll.options.length) {
      throw new Error("Invalid option");
    }

    // Check if visitor already voted
    const existingVote = await ctx.db
      .query("pollVotes")
      .withIndex("by_pollId_visitorId", (q) =>
        q.eq("pollId", args.pollId).eq("visitorId", args.visitorId),
      )
      .first();

    if (existingVote) {
      throw new Error("You have already voted on this poll");
    }

    // Cast vote
    await ctx.db.insert("pollVotes", {
      pollId: args.pollId,
      optionIndex: args.optionIndex,
      visitorId: args.visitorId,
      createdAt: Date.now(),
    });

    // Increment total votes
    await ctx.db.patch(args.pollId, {
      totalVotes: poll.totalVotes + 1,
    });

    return { success: true };
  },
});

// ─── Get Active Poll for a Board (first active one) ───
export const getActivePoll = query({
  args: {
    boardId: v.id("boards"),
  },
  handler: async (ctx, args) => {
    const poll = await ctx.db
      .query("polls")
      .withIndex("by_boardId_isActive", (q) =>
        q.eq("boardId", args.boardId).eq("isActive", true),
      )
      .first();

    if (!poll) return null;

    // Check if expired (auto-close for display)
    if (poll.expiresAt && poll.expiresAt <= Date.now()) {
      return { ...poll, isActive: false };
    }

    return poll;
  },
});

// ─── List All Polls for a Board (active first, then inactive, newest first) ───
export const listByBoard = query({
  args: {
    boardId: v.id("boards"),
  },
  handler: async (ctx, args) => {
    const allPolls = await ctx.db
      .query("polls")
      .withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
      .collect();

    // Mark expired polls as inactive for display
    const processed = allPolls.map((poll) => {
      if (poll.isActive && poll.expiresAt && poll.expiresAt <= Date.now()) {
        return { ...poll, isActive: false };
      }
      return poll;
    });

    // Sort: active first, then by createdAt descending
    processed.sort((a, b) => {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return b.createdAt - a.createdAt;
    });

    return processed;
  },
});

// ─── Get Poll Count Info for a Board (used by create page) ───
export const getPollCount = query({
  args: {
    boardId: v.id("boards"),
  },
  handler: async (ctx, args) => {
    // Only fetch active polls to evaluate count
    const activePolls = await ctx.db
      .query("polls")
      .withIndex("by_boardId_isActive", (q) =>
        q.eq("boardId", args.boardId).eq("isActive", true),
      )
      .collect();

    const activeCount = activePolls.filter((p) => {
      if (p.expiresAt && p.expiresAt <= Date.now()) return false;
      return true;
    }).length;

    return {
      active: activeCount,
      maxPolls: MAX_POLLS_PER_BOARD,
      canCreate: activeCount < MAX_POLLS_PER_BOARD,
    };
  },
});

// ─── Get Poll Results (vote counts per option) ───
export const getResults = query({
  args: {
    pollId: v.id("polls"),
  },
  handler: async (ctx, args) => {
    const poll = await ctx.db.get(args.pollId);
    if (!poll) return null;

    const votes = await ctx.db
      .query("pollVotes")
      .withIndex("by_pollId", (q) => q.eq("pollId", args.pollId))
      .collect();

    // Count votes per option
    const optionCounts = new Array(poll.options.length).fill(0);
    for (const vote of votes) {
      if (vote.optionIndex >= 0 && vote.optionIndex < poll.options.length) {
        optionCounts[vote.optionIndex]++;
      }
    }

    return {
      poll,
      optionCounts,
      totalVotes: votes.length,
    };
  },
});

// ─── Check if Visitor Has Voted ───
export const hasVoted = query({
  args: {
    pollId: v.id("polls"),
    visitorId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.visitorId) return { voted: false, optionIndex: -1 };

    const vote = await ctx.db
      .query("pollVotes")
      .withIndex("by_pollId_visitorId", (q) =>
        q.eq("pollId", args.pollId).eq("visitorId", args.visitorId),
      )
      .first();

    return {
      voted: !!vote,
      optionIndex: vote?.optionIndex ?? -1,
    };
  },
});

// ─── End Poll Early (creator only) — keeps data, just sets inactive ───
export const endPoll = mutation({
  args: {
    pollId: v.id("polls"),
    creatorToken: v.string(),
  },
  handler: async (ctx, args) => {
    const poll = await ctx.db.get(args.pollId);
    if (!poll) throw new Error("Poll not found");

    const board = await ctx.db.get(poll.boardId);
    if (!board || board.creatorToken !== args.creatorToken) {
      throw new Error("Unauthorized: only the board creator can end polls");
    }

    await ctx.db.patch(args.pollId, { isActive: false });
    return { success: true };
  },
});

// ─── Delete Poll (creator only) — permanently removes poll + votes ───
export const remove = mutation({
  args: {
    pollId: v.id("polls"),
    creatorToken: v.string(),
  },
  handler: async (ctx, args) => {
    const poll = await ctx.db.get(args.pollId);
    if (!poll) throw new Error("Poll not found");

    const board = await ctx.db.get(poll.boardId);
    if (!board || board.creatorToken !== args.creatorToken) {
      throw new Error("Unauthorized: only the board creator can delete polls");
    }

    // Delete all votes first
    const votes = await ctx.db
      .query("pollVotes")
      .withIndex("by_pollId", (q) => q.eq("pollId", args.pollId))
      .collect();
    for (const v of votes) {
      await ctx.db.delete(v._id);
    }

    // Delete the poll
    await ctx.db.delete(args.pollId);
    return { success: true };
  },
});
