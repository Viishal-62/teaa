import { v } from "convex/values";
import { action } from "./_generated/server";
import { moderateTextWithAI } from "../services/ai.service";

/**
 * Perform a thorough AI-based moderation check.
 * Called from the frontend during the submission process.
 */
export const checkContent = action({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Basic sanitization
    const promptText = args.text.trim();
    if (promptText.length < 3) {
      return { isClean: true, reason: "" };
    }

    try {
      // 2. Call our AI service
      const result = await moderateTextWithAI(promptText);
      return result;
    } catch (error) {
      console.error("AI Moderation failed:", error);
      // Fail open (don't block the user if the AI is down)
      return { isClean: true, reason: "" };
    }
  },
});
