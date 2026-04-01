import { v } from "convex/values";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { summarizeConfessions } from "../services/ai.service";

// ─── ACTIONS ───

/**
 * Summarize a specific board's vibe.
 * Only works for non-admirer, public boards with 10+ confessions.
 * Includes both confessions and spill text.
 * Caches the result in the board document.
 */
export const summarizeBoard = action({
  args: { boardId: v.id("boards") },
  handler: async (ctx, args) => {
    // 1. Fetch board info
    const board = await ctx.runQuery(api.boards.getById, { boardId: args.boardId });
    if (!board) throw new Error("Board not found");

    // 2. Check restrictions
    if (board.boardType === "secret-admirer") {
      throw new Error("Summarization is not available for Secret Admirer boards.");
    }
    if (board.visibility === "private") {
      throw new Error("Summarization is not available for Private boards.");
    }

    // 3. Check cache (1 hour)
    const ONE_HOUR = 60 * 60 * 1000;
    if (
      board.aiSummary && 
      board.aiSummaryUpdatedAt && 
      Date.now() - board.aiSummaryUpdatedAt < ONE_HOUR
    ) {
      return board.aiSummary;
    }

    // 4. Fetch confessions
    const confessions = await ctx.runQuery(api.confessions.listByBoard, {
      boardId: args.boardId,
    });
    
    if (!confessions || confessions.length < 10) {
      throw new Error("Need at least 10 confessions to generate a summary.");
    }

    const confessionTexts = confessions
      .map((c) => c.text)
      .filter((t): t is string => !!t && t.length > 5);

    // 5. Fetch spills for this board
    const spills = await ctx.runQuery(api.spills.listByBoard, {
      boardId: args.boardId,
    });

    let spillTexts: string[] = [];
    if (spills && spills.length > 0) {
      for (const spill of spills.slice(0, 5)) {
        const chapters = await ctx.runQuery(api.chapters.listBySpill, {
          spillId: spill._id,
        });
        if (chapters && chapters.length > 0) {
          const spillText = `[SPILL: "${spill.title}"] ${chapters.map(ch => ch.text).join(" ")}`;
          spillTexts.push(spillText.slice(0, 500));
        }
      }
    }

    const allTexts = [...confessionTexts, ...spillTexts];

    // 6. Generate summary via OpenRouter
    const summary = await summarizeConfessions(allTexts);

    // 7. Cache it
    await ctx.runMutation(internal.ai.updateBoardSummary, {
      boardId: args.boardId,
      summary,
    });

    return summary;
  },
});

/**
 * Summarize the global vibe (Explore page).
 * Includes both confessions and spills.
 * Requires 10+ confessions.
 * Caches in the globalSummaries table for 30 minutes.
 */
export const summarizeGlobal = action({
  args: {},
  handler: async (ctx) => {
    // 1. Check cache (30 mins)
    const latestGlobal = await ctx.runQuery(internal.ai.getLatestGlobalSummary);
    const THIRTY_MINS = 30 * 60 * 1000;
    
    if (latestGlobal && Date.now() - latestGlobal.createdAt < THIRTY_MINS) {
      return latestGlobal.summary;
    }

    // 2. Fetch top recent confessions
    const confessions = await ctx.runQuery(api.confessions.listAll, {});
    
    if (!confessions || confessions.length < 10) {
      throw new Error("Need at least 10 confessions in the global feed to generate a summary.");
    }

    const confessionTexts = confessions
      .map((c) => c.text)
      .filter((t): t is string => !!t && t.length > 5)
      .slice(0, 50);

    // 3. Fetch spills
    const spills = await ctx.runQuery(api.spills.listAll, {});
    let spillTexts: string[] = [];
    if (spills && spills.length > 0) {
      for (const spill of spills.slice(0, 5)) {
        const chapters = await ctx.runQuery(api.chapters.listBySpill, {
          spillId: spill._id,
        });
        if (chapters && chapters.length > 0) {
          const spillText = `[SPILL: "${spill.title}"] ${chapters.map(ch => ch.text).join(" ")}`;
          spillTexts.push(spillText.slice(0, 500));
        }
      }
    }

    const allTexts = [...confessionTexts, ...spillTexts];

    if (allTexts.length < 5) throw new Error("Not enough content to summarize yet.");

    // 4. Generate
    const summary = await summarizeConfessions(allTexts);

    // 5. Cache it
    await ctx.runMutation(internal.ai.createGlobalSummary, { summary });

    return summary;
  },
});

// ─── INTERNAL MUTATIONS (Used by actions) ───

export const updateBoardSummary = internalMutation({
  args: { boardId: v.id("boards"), summary: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.boardId, {
      aiSummary: args.summary,
      aiSummaryUpdatedAt: Date.now(),
    });
  },
});

export const createGlobalSummary = internalMutation({
  args: { summary: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("globalSummaries", {
      summary: args.summary,
      createdAt: Date.now(),
    });
  },
});

// ─── INTERNAL QUERIES ───

export const getLatestGlobalSummary = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("globalSummaries")
      .withIndex("by_createdAt")
      .order("desc")
      .first();
  },
});
