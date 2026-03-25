import { mutation } from "./_generated/server";
import sampleData from "../sampleData.json";

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

    let count = 0;
    for (const c of sampleData) {
      await ctx.db.insert("confessions", {
        boardId: board._id,
        text: c.text,
        category: c.category,
        displayName: c.displayName,
        isGlobal: c.isGlobal,
        views: c.views,
        createdAt: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
      });
      count++;
    }

    return { seeded: count, boardSlug: board.slug };
  },
});
