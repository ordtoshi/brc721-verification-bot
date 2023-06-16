import dotenv from "dotenv";
import { Job, Queue, Worker } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { EmbedBuilder } from "@discordjs/builders";
import { MessageFlags, Routes } from "@discordjs/core";

import { cache } from "./cache";
import { discord } from "./discord";
import { APPID, REDIS_CONNECTION } from "./constant";
import { RoleJob } from "./types";
import {
  errorIsNotFoundException,
  getInscriptions,
  getNotFoundException,
  hasValid,
} from "./helpers";

dotenv.config();

const prisma = new PrismaClient();

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

const worker = new Worker(
  "roles",
  async (job: Job<RoleJob>) => {
    if (job.data.type === "cron") {
      const Jobs = await prisma.job.findMany();
      if (!Jobs.length) return "NO JOBS";
      await queueRoles.addBulk(
        Jobs.map((Job) => ({
          name: `old`,
          data: {
            id: Job.id,
            type: "old",
            address: Job.address,
          },
        }))
      );
    }
    if (job.data.type === "old") {
      try {
        const Job = await prisma.job.findUnique({
          where: { id: job.data.id },
        });

        if (!Job) {
          throw new Error("JOB NOT FOUND");
        }

        const { userId, guildId, address } = Job;

        const ids = await getInscriptions(address).catch((err) => {
          console.error("HIRO API ERROR", err);
          throw new Error("HIRO API ERROR");
        });

        if (!ids.length) {
          throw new Error("NO INSCRIPTIONS");
        }

        const roles = await prisma.role
          .findMany({ where: { guildId } })
          .catch((err) => {
            console.error("ROLE QUERY ERROR", err);
            throw new Error("ROLE QUERY ERROR");
          });

        if (!roles.length) {
          throw new Error("NO ROLES");
        }

        const obtainedRoles: string[] = [];
        await Promise.all(
          roles.map(async (r) => {
            if (await hasValid(ids, r.collectionId)) {
              obtainedRoles.push(r.roleId);
            }
          })
        ).catch((err) => {
          console.error("QUERY VALID INSCR", err);
          throw new Error("QUERY VALID INSCR");
        });

        if (obtainedRoles.length) {
          const rolesToRemove = roles.filter(
            (r) => !obtainedRoles.includes(r.roleId)
          );

          for await (const role of rolesToRemove) {
            await discord.guilds
              .removeRoleFromMember(guildId, userId, role.roleId)
              .catch((err: { code?: number }) => {
                console.error("ROLE REMOVE", err);
                if (err?.code === 10004) {
                  throw getNotFoundException({
                    guildId,
                    type: "GuildNotFound",
                  });
                }
                if (err?.code === 10007) {
                  throw getNotFoundException({
                    userId,
                    guildId,
                    type: "MemberNotFound",
                  });
                }
                if (err?.code === 10011) {
                  throw getNotFoundException({
                    guildId,
                    type: "RoleNotFound",
                    roleId: role.roleId,
                  });
                }
                throw new Error("ROLE REMOVE");
              });
          }

          for await (const role of obtainedRoles) {
            await discord.guilds
              .addRoleToMember(guildId, userId, role)
              .catch((err) => {
                console.error("ROLE ADD", err);
                throw new Error("ROLE ADD");
              });
          }
        }

        return true;
      } catch (error: any) {
        if (error instanceof Error) {
          const NO_RETRY_ERRORS = [
            "NO ROLES",
            "JOB NOT FOUND",
            "NO INSCRIPTIONS",
          ];

          if (NO_RETRY_ERRORS.includes(error.message)) {
            return error.message;
          }

          throw new Error(error.message);
        }
        if (errorIsNotFoundException(error)) {
          const data = error.data;
          if (data.type === "RoleNotFound") {
            await prisma.role
              .deleteMany({
                where: {
                  guildId: data.guildId,
                  roleId: data.roleId,
                },
              })
              .catch();
            throw new Error("ROLE NOT FOUND");
          }
          if (data.type === "MemberNotFound") {
            await prisma.job
              .deleteMany({
                where: {
                  userId: data.userId,
                  guildId: data.guildId,
                },
              })
              .catch();
            return "MEMBER NOT FOUND";
          }
          if (data.type === "GuildNotFound") {
            await prisma.guild
              .deleteMany({
                where: { guildId: data.guildId },
              })
              .catch();
            return "GUILD NOT FOUND";
          }
        }
        return "UNKNOWN ERROR";
      }
    }
    if (job.data.type === "new") {
      const { address, code } = job.data;
      const [userId, guildId, itoken] = code.split(":");
      try {
        await cache.del(code).catch((err) => {
          console.error("REMOVE CODE", err);
          throw new Error("REMOVE CODE");
        });

        const Job = await prisma.job.findUnique({
          where: { guildId_address: { guildId, address } },
        });

        if (Job) {
          if (Job.userId !== userId) {
            await prisma.job
              .delete({ where: { guildId_address: { guildId, address } } })
              .catch((err) => {
                console.error("DELETE SAME ADDY MEMBER", err);
                throw new Error("DELETE SAME ADDY MEMBER");
              });
          }
        }

        const ids = await getInscriptions(address).catch((err) => {
          console.error("HIRO API ERROR", err);
          throw new Error("HIRO API ERROR");
        });

        if (!ids.length) {
          console.error("NO INSCRIPTIONS");
          throw new Error("NO INSCRIPTIONS");
        }

        const roles = await prisma.role
          .findMany({ where: { guildId } })
          .catch((err) => {
            console.error("ROLE QUERY ERROR", err);
            throw new Error("ROLE QUERY ERROR");
          });

        if (!roles.length) {
          console.error("NO ROLES");
          throw new Error("NO ROLES");
        }

        const obtainedRoles: string[] = [];
        await Promise.all(
          roles.map(async (r) => {
            if (await hasValid(ids, r.collectionId)) {
              obtainedRoles.push(r.roleId);
            }
          })
        ).catch((err) => {
          console.error("QUERY VALID INSCR", err);
          throw new Error("QUERY VALID INSCR");
        });

        if (obtainedRoles.length) {
          if (!Job) {
            await prisma.job
              .create({
                data: { userId, address, Guild: { connect: { guildId } } },
              })
              .catch((err) => {
                console.error("CREATE JOB", err);
                throw new Error("CREATE JOB");
              });
          }

          const rolesToRemove = roles.filter(
            (r) => !obtainedRoles.includes(r.roleId)
          );

          for await (const role of rolesToRemove) {
            await discord.guilds
              .removeRoleFromMember(guildId, userId, role.roleId)
              .catch((err: { code?: number }) => {
                console.error("ROLE REMOVE", err);
                if (err?.code === 10004) {
                  throw getNotFoundException({
                    guildId,
                    type: "GuildNotFound",
                  });
                }
                if (err?.code === 10007) {
                  throw getNotFoundException({
                    userId,
                    guildId,
                    type: "MemberNotFound",
                  });
                }
                if (err?.code === 10011) {
                  throw getNotFoundException({
                    guildId,
                    type: "RoleNotFound",
                    roleId: role.roleId,
                  });
                }
                throw new Error("ROLE REMOVE");
              });
          }

          for await (const role of obtainedRoles) {
            await discord.guilds
              .addRoleToMember(guildId, userId, role)
              .catch((err) => {
                console.error("ROLE ADD", err);
                throw new Error("ROLE ADD");
              });
          }
        }

        discord.rest
          .patch(Routes.webhookMessage(APPID, itoken), {
            body: {
              components: [],
              flags: MessageFlags.Ephemeral,
              content: `<@${userId}>, verification finished! ${
                obtainedRoles.length ? "" : "No roles earned."
              }`,
              embeds: obtainedRoles.length
                ? [
                    new EmbedBuilder().setDescription(
                      obtainedRoles.map((role) => `<@&${role}> - ✅`).join("\n")
                    ),
                  ]
                : [],
            },
          })
          .catch((err) => {
            console.error("INTERACTION REPLY", err);
            throw new Error("INTERACTION REPLY");
          });

        return true;
      } catch (error: any) {
        discord.rest
          .patch(Routes.webhookMessage(APPID, itoken), {
            body: {
              components: [],
              flags: MessageFlags.Ephemeral,
              content: `<@${userId}>, verification failed!
Error: ${error?.message || "UNKNOWN ERROR. TRY AGAIN"}
            `,
              embeds: [],
            },
          })
          .catch((error) => {
            console.log("VERIFICATION FAILED REPLY ERROR", error);
          });

        if (errorIsNotFoundException(error)) {
          const data = error.data;
          if (data.type === "RoleNotFound") {
            await prisma.role
              .deleteMany({
                where: {
                  guildId: data.guildId,
                  roleId: data.roleId,
                },
              })
              .catch();
          }
          if (data.type === "MemberNotFound") {
            await prisma.job
              .deleteMany({
                where: {
                  userId: data.userId,
                  guildId: data.guildId,
                },
              })
              .catch();
            return "MEMBER NOT FOUND";
          }
          if (data.type === "GuildNotFound") {
            await prisma.guild
              .deleteMany({
                where: { guildId: data.guildId },
              })
              .catch();
            return "GUILD NOT FOUND";
          }
        }

        if (error instanceof Error) return error.message;
        return "UNKNOWN ERROR";
      }
    }
  },
  { connection: REDIS_CONNECTION, concurrency: 1 }
);

worker.on("error", (error) => {
  console.error("WORKER ERROR", error);
});

console.log("WORKER STARTED");
