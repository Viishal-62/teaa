/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as boards from "../boards.js";
import type * as chapters from "../chapters.js";
import type * as comments from "../comments.js";
import type * as confessions from "../confessions.js";
import type * as creatorReplies from "../creatorReplies.js";
import type * as crons from "../crons.js";
import type * as files from "../files.js";
import type * as forum from "../forum.js";
import type * as helpers from "../helpers.js";
import type * as moderation from "../moderation.js";
import type * as moderationAction from "../moderationAction.js";
import type * as notifications from "../notifications.js";
import type * as reactions from "../reactions.js";
import type * as reports from "../reports.js";
import type * as spillReactions from "../spillReactions.js";
import type * as spills from "../spills.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  boards: typeof boards;
  chapters: typeof chapters;
  comments: typeof comments;
  confessions: typeof confessions;
  creatorReplies: typeof creatorReplies;
  crons: typeof crons;
  files: typeof files;
  forum: typeof forum;
  helpers: typeof helpers;
  moderation: typeof moderation;
  moderationAction: typeof moderationAction;
  notifications: typeof notifications;
  reactions: typeof reactions;
  reports: typeof reports;
  spillReactions: typeof spillReactions;
  spills: typeof spills;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
