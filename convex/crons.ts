import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "cleanup expired confessions",
  { minutes: 15 },
  internal.confessions.cleanupExpired,
);

crons.interval(
  "global engagement hook",
  { hours: 1 },
  internal.push.sendGlobalHook,
);

export default crons;
