import dotenv from "dotenv";
import { Queue } from "bullmq";

import { RoleJob } from "./types";
import { REDIS_CONNECTION } from "./constant";

dotenv.config();

export const queueRoles = new Queue<RoleJob>("roles", {
  connection: REDIS_CONNECTION,
  defaultJobOptions: {
    attempts: Number.MAX_SAFE_INTEGER,
    backoff: {
      type: "fixed",
      delay: 5 * 60 * 1000,
    },
    removeOnFail: {
      age: 172800,
      count: 50000,
    },
    removeOnComplete: {
      age: 172800,
      count: 10000,
    },
  },
});

queueRoles.add(
  "cron",
  { type: "cron" },
  {
    jobId: "CRON",
    repeat: { pattern: "0 0 * * *" },
  }
);
