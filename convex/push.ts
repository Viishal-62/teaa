"use node";

import { v } from "convex/values";
import { internalAction, mutation, query, action, internalQuery, internalMutation } from "./_generated/server";
import { internal, api } from "./_generated/api";
import webpush from "web-push";

// Initialize web-push.
// IMPORTANT: These environment variables MUST be set in the Convex dashboard
// VAPID_SUBJECT (e.g. mailto:your-email@example.com)
// VAPID_PUBLIC_KEY
// VAPID_PRIVATE_KEY
const subject = process.env.VAPID_SUBJECT || "mailto:test@example.com";
const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
} else {
  console.warn("VAPID keys are not configured in environment variables.");
}


export const sendPushToCreator = internalAction({
  args: {
    creatorToken: v.string(),
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!publicKey || !privateKey) return;

    const subs = await ctx.runQuery((internal as any).pushInternal.getSubscriptionsForCreator, {
      creatorToken: args.creatorToken,
    });

    const payload = JSON.stringify({
      title: args.title,
      body: args.body,
      url: args.url || "/",
    });

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          payload
        );
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          // Subscription has expired or is no longer valid
          await ctx.runMutation((internal as any).pushInternal.removeSubscriptionInternal, {
            endpoint: sub.endpoint,
          });
        } else {
          console.error("Error sending push notification:", error);
        }
      }
    }
  },
});

async function performBroadcast(ctx: any, args: { title: string; body: string; url?: string }) {
  if (!publicKey || !privateKey) return 0;
  const subs = await ctx.runQuery((internal as any).pushInternal.getAllSubscriptions);
  const payload = JSON.stringify({
    title: args.title,
    body: args.body,
    url: args.url || "/",
  });

  let sentCount = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        payload
      );
      sentCount++;
    } catch (error: any) {
      if (error.statusCode === 410 || error.statusCode === 404) {
        await ctx.runMutation((internal as any).pushInternal.removeSubscriptionInternal, {
          endpoint: sub.endpoint,
        });
      }
    }
  }
  return sentCount;
}

export const broadcastPush = internalAction({
  args: {
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => await performBroadcast(ctx, args),
});

export const broadcastPushPublic = action({
  args: {
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
    secret: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.secret !== process.env.ADMIN_PASSWORD) {
      throw new Error("Unauthorized");
    }
    return await performBroadcast(ctx, args);
  },
});

export const sendGlobalHook = internalAction({
  args: {},
  handler: async (ctx) => {
    const confessions = await ctx.runQuery(api.confessions.listAll, {});
    if (!confessions || confessions.length === 0) return;
    
    const randomConfession = confessions[Math.floor(Math.random() * confessions.length)];
    const text = randomConfession.text || "Someone dropped a new secret...";
    const body = text.length > 40 ? text.substring(0, 40) + "..." : text;
    
    await performBroadcast(ctx, {
      title: "New tea dropped ☕",
      body: body,
      url: "/"
    });
  }
});
