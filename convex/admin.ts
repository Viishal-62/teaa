import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const ONE_DAY = 24 * 60 * 60 * 1000;
const ONE_WEEK = 7 * ONE_DAY;

// ─── Aggregated Platform Stats ───
export const adminStats = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const boards = await ctx.db.query("boards").collect();
    const confessions = await ctx.db.query("confessions").collect();
    const spills = await ctx.db.query("spills").collect();
    const comments = await ctx.db.query("comments").collect();
    const reactions = await ctx.db.query("reactions").collect();
    const reports = await ctx.db.query("reports").collect();
    const featureRequests = await ctx.db.query("featureRequests").collect();

    const count = (items: { createdAt: number }[], since: number) =>
      items.filter((i) => i.createdAt > since).length;

    // Category distribution
    const categoryDist: Record<string, number> = {};
    for (const c of confessions) {
      categoryDist[c.category] = (categoryDist[c.category] || 0) + 1;
    }

    // Type distribution
    const typeDist: Record<string, number> = {};
    for (const c of confessions) {
      const t = c.type || "text";
      typeDist[t] = (typeDist[t] || 0) + 1;
    }

    // Flagged confessions
    const flaggedCount = confessions.filter((c) => c.isFlagged).length;

    // Total views
    const totalViews = confessions.reduce((sum, c) => sum + (c.views || 0), 0);

    return {
      boards: {
        total: boards.length,
        newToday: count(boards, now - ONE_DAY),
        newThisWeek: count(boards, now - ONE_WEEK),
      },
      confessions: {
        total: confessions.length,
        newToday: count(confessions, now - ONE_DAY),
        newThisWeek: count(confessions, now - ONE_WEEK),
        flagged: flaggedCount,
        totalViews,
      },
      spills: {
        total: spills.length,
        newToday: count(spills, now - ONE_DAY),
        newThisWeek: count(spills, now - ONE_WEEK),
      },
      comments: {
        total: comments.length,
        newToday: count(comments, now - ONE_DAY),
        newThisWeek: count(comments, now - ONE_WEEK),
      },
      reactions: {
        total: reactions.length,
        newToday: count(reactions, now - ONE_DAY),
        newThisWeek: count(reactions, now - ONE_WEEK),
      },
      reports: {
        total: reports.length,
        newToday: count(reports, now - ONE_DAY),
        newThisWeek: count(reports, now - ONE_WEEK),
      },
      featureRequests: {
        total: featureRequests.length,
        newToday: count(featureRequests, now - ONE_DAY),
        newThisWeek: count(featureRequests, now - ONE_WEEK),
      },
      categoryDistribution: categoryDist,
      typeDistribution: typeDist,
    };
  },
});

// ─── List ALL Boards (admin full access) ───
export const adminListBoards = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const boards = await ctx.db
      .query("boards")
      .withIndex("by_createdAt")
      .order("desc")
      .take(200);

    const enriched = await Promise.all(
      boards.map(async (board) => {
        const confessions = await ctx.db
          .query("confessions")
          .withIndex("by_boardId", (q) => q.eq("boardId", board._id))
          .collect();
        const spills = await ctx.db
          .query("spills")
          .withIndex("by_boardId", (q) => q.eq("boardId", board._id))
          .collect();

        return {
          _id: board._id,
          name: board.name,
          slug: board.slug,
          tagline: board.tagline,
          theme: board.theme,
          boardType: board.boardType || "default",
          visibility: board.visibility,
          confessionCount: confessions.length,
          spillCount: spills.length,
          totalViews: confessions.reduce((s, c) => s + (c.views || 0), 0),
          createdAt: board.createdAt,
          isNew: board.createdAt > now - ONE_DAY,
        };
      }),
    );

    return enriched;
  },
});

// ─── List ALL Confessions (admin full access, including flagged) ───
export const adminListConfessions = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const confessions = await ctx.db
      .query("confessions")
      .withIndex("by_createdAt")
      .order("desc")
      .take(300);

    const enriched = await Promise.all(
      confessions.map(async (c) => {
        const board = await ctx.db.get(c.boardId);
        const reactions = await ctx.db
          .query("reactions")
          .withIndex("by_confessionId", (q) => q.eq("confessionId", c._id))
          .collect();
        const comments = await ctx.db
          .query("comments")
          .withIndex("by_confessionId", (q) => q.eq("confessionId", c._id))
          .collect();

        return {
          _id: c._id,
          text: c.text?.slice(0, 120) || (c.type === "voice" ? "🎤 Voice Note" : c.type === "canvas" ? "🎨 Doodle" : "—"),
          fullText: c.text || "",
          type: c.type || "text",
          category: c.category,
          displayName: c.displayName,
          views: c.views || 0,
          reactionCount: reactions.length,
          commentCount: comments.length,
          isFlagged: c.isFlagged || false,
          flagReason: c.flagReason || "",
          boardName: board?.name || "Deleted Board",
          boardSlug: board?.slug || "",
          isGlobal: c.isGlobal,
          createdAt: c.createdAt,
          isNew: c.createdAt > now - ONE_DAY,
        };
      }),
    );

    return enriched;
  },
});

// ─── List ALL Reports ───
export const adminListReports = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const reports = await ctx.db.query("reports").collect();

    const enriched = await Promise.all(
      reports.map(async (r) => {
        const confession = await ctx.db.get(r.confessionId);
        let boardName = "Unknown";
        if (confession) {
          const board = await ctx.db.get(confession.boardId);
          boardName = board?.name || "Deleted Board";
        }

        return {
          _id: r._id,
          confessionId: r.confessionId,
          confessionText: confession?.text?.slice(0, 100) || "Deleted/Voice",
          reason: r.reason,
          visitorId: r.visitorId,
          boardName,
          createdAt: r.createdAt,
          isNew: r.createdAt > now - ONE_DAY,
        };
      }),
    );

    // Sort newest first
    enriched.sort((a, b) => b.createdAt - a.createdAt);
    return enriched;
  },
});

// ─── List ALL Spills ───
export const adminListSpills = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const spills = await ctx.db
      .query("spills")
      .withIndex("by_createdAt")
      .order("desc")
      .take(200);

    const enriched = await Promise.all(
      spills.map(async (s) => {
        const board = await ctx.db.get(s.boardId);
        const chapters = await ctx.db
          .query("chapters")
          .withIndex("by_spillId", (q) => q.eq("spillId", s._id))
          .collect();
        const reactions = await ctx.db
          .query("spillReactions")
          .withIndex("by_spillId", (q) => q.eq("spillId", s._id))
          .collect();

        return {
          _id: s._id,
          title: s.title,
          coverEmoji: s.coverEmoji,
          displayName: s.displayName,
          views: s.views || 0,
          chapterCount: chapters.length,
          reactionCount: reactions.length,
          boardName: board?.name || "Deleted Board",
          boardSlug: board?.slug || "",
          createdAt: s.createdAt,
          isNew: s.createdAt > now - ONE_DAY,
        };
      }),
    );

    return enriched;
  },
});

// ─── List ALL Feature Requests ───
export const adminListFeatureRequests = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const requests = await ctx.db.query("featureRequests").collect();

    const enriched = requests.map((r) => ({
      _id: r._id,
      title: r.title,
      description: r.description,
      status: r.status,
      upvotes: r.upvotes,
      createdAt: r.createdAt,
      isNew: r.createdAt > now - ONE_DAY,
    }));

    enriched.sort((a, b) => b.createdAt - a.createdAt);
    return enriched;
  },
});

// ─── List ALL Comments ───
export const adminListComments = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_createdAt")
      .order("desc")
      .take(200);

    const enriched = await Promise.all(
      comments.map(async (c) => {
        const confession = await ctx.db.get(c.confessionId);
        let boardName = "Unknown";
        let boardSlug = "";
        if (confession) {
          const board = await ctx.db.get(confession.boardId);
          boardName = board?.name || "Deleted Board";
          boardSlug = board?.slug || "";
        }

        return {
          _id: c._id,
          text: c.text,
          gifUrl: c.gifUrl,
          displayName: c.displayName,
          confessionPreview: confession?.text?.slice(0, 60) || "Deleted",
          boardName,
          boardSlug,
          createdAt: c.createdAt,
          isNew: c.createdAt > now - ONE_DAY,
        };
      }),
    );

    return enriched;
  },
});

// ─── Activity Timeline ───
export const adminActivityTimeline = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Gather recent items from each table
    const recentBoards = await ctx.db
      .query("boards")
      .withIndex("by_createdAt")
      .order("desc")
      .take(15);

    const recentConfessions = await ctx.db
      .query("confessions")
      .withIndex("by_createdAt")
      .order("desc")
      .take(15);

    const recentSpills = await ctx.db
      .query("spills")
      .withIndex("by_createdAt")
      .order("desc")
      .take(10);

    const recentReports = await ctx.db.query("reports").collect();
    const recentReportsSorted = recentReports
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10);

    const timeline: {
      type: string;
      label: string;
      detail: string;
      createdAt: number;
      isNew: boolean;
    }[] = [];

    for (const b of recentBoards) {
      timeline.push({
        type: "board",
        label: "New Board",
        detail: `"${b.name}" (${b.visibility})`,
        createdAt: b.createdAt,
        isNew: b.createdAt > now - ONE_DAY,
      });
    }

    for (const c of recentConfessions) {
      const t = c.type || "text";
      const preview =
        t === "voice"
          ? "🎤 Voice confession"
          : t === "canvas"
            ? "🎨 Doodle confession"
            : `"${(c.text || "").slice(0, 50)}..."`;
      timeline.push({
        type: "confession",
        label: "New Confession",
        detail: preview,
        createdAt: c.createdAt,
        isNew: c.createdAt > now - ONE_DAY,
      });
    }

    for (const s of recentSpills) {
      timeline.push({
        type: "spill",
        label: "New Spill",
        detail: `"${s.title}"`,
        createdAt: s.createdAt,
        isNew: s.createdAt > now - ONE_DAY,
      });
    }

    for (const r of recentReportsSorted) {
      timeline.push({
        type: "report",
        label: "New Report",
        detail: r.reason,
        createdAt: r.createdAt,
        isNew: r.createdAt > now - ONE_DAY,
      });
    }

    // Sort all by time descending and take top 50
    timeline.sort((a, b) => b.createdAt - a.createdAt);
    return timeline.slice(0, 50);
  },
});

// ─── Admin Delete Confession (no creatorToken needed) ───
export const adminDeleteConfession = mutation({
  args: { confessionId: v.id("confessions") },
  handler: async (ctx, args) => {
    const confession = await ctx.db.get(args.confessionId);
    if (!confession) throw new Error("Confession not found");

    // Delete reactions
    const reactions = await ctx.db
      .query("reactions")
      .withIndex("by_confessionId", (q) =>
        q.eq("confessionId", args.confessionId),
      )
      .collect();
    for (const r of reactions) {
      await ctx.db.delete(r._id);
    }

    // Delete comments
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_confessionId", (q) =>
        q.eq("confessionId", args.confessionId),
      )
      .collect();
    for (const c of comments) {
      await ctx.db.delete(c._id);
    }

    // Delete creator replies
    const replies = await ctx.db
      .query("creatorReplies")
      .withIndex("by_confessionId", (q) =>
        q.eq("confessionId", args.confessionId),
      )
      .collect();
    for (const r of replies) {
      await ctx.db.delete(r._id);
    }

    // Delete reports
    const reports = await ctx.db
      .query("reports")
      .withIndex("by_confessionId", (q) =>
        q.eq("confessionId", args.confessionId),
      )
      .collect();
    for (const rp of reports) {
      await ctx.db.delete(rp._id);
    }

    await ctx.db.delete(args.confessionId);
    return { success: true };
  },
});

// ─── Admin Delete Board (cascading) ───
export const adminDeleteBoard = mutation({
  args: { boardId: v.id("boards") },
  handler: async (ctx, args) => {
    const board = await ctx.db.get(args.boardId);
    if (!board) throw new Error("Board not found");

    // Delete all confessions for this board
    const confessions = await ctx.db
      .query("confessions")
      .withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
      .collect();

    for (const confession of confessions) {
      const reactions = await ctx.db
        .query("reactions")
        .withIndex("by_confessionId", (q) =>
          q.eq("confessionId", confession._id),
        )
        .collect();
      for (const r of reactions) await ctx.db.delete(r._id);

      const comments = await ctx.db
        .query("comments")
        .withIndex("by_confessionId", (q) =>
          q.eq("confessionId", confession._id),
        )
        .collect();
      for (const c of comments) await ctx.db.delete(c._id);

      const replies = await ctx.db
        .query("creatorReplies")
        .withIndex("by_confessionId", (q) =>
          q.eq("confessionId", confession._id),
        )
        .collect();
      for (const r of replies) await ctx.db.delete(r._id);

      await ctx.db.delete(confession._id);
    }

    // Delete all spills
    const spills = await ctx.db
      .query("spills")
      .withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
      .collect();
    for (const spill of spills) {
      const chapters = await ctx.db
        .query("chapters")
        .withIndex("by_spillId", (q) => q.eq("spillId", spill._id))
        .collect();
      for (const ch of chapters) await ctx.db.delete(ch._id);

      const spillReactions = await ctx.db
        .query("spillReactions")
        .withIndex("by_spillId", (q) => q.eq("spillId", spill._id))
        .collect();
      for (const sr of spillReactions) await ctx.db.delete(sr._id);

      await ctx.db.delete(spill._id);
    }

    await ctx.db.delete(args.boardId);
    return { success: true };
  },
});

// ─── Admin Update Feature Request Status ───
export const adminUpdateFeatureStatus = mutation({
  args: {
    requestId: v.id("featureRequests"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const validStatuses = ["under-review", "planned", "shipped"];
    if (!validStatuses.includes(args.status)) {
      throw new Error("Invalid status");
    }

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Feature request not found");

    await ctx.db.patch(args.requestId, { status: args.status });
    return { success: true };
  },
});
