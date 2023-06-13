import * as dotenv from "dotenv";
import { cache } from "./cache";
import { randomUUID } from "crypto";
import { REST } from "@discordjs/rest";
import { PrismaClient } from "@prisma/client";
import { WebSocketManager } from "@discordjs/ws";

import {
  APPID,
  COMMANDS,
  TOKEN,
  VER_BUTTON_ID,
  StartVerificationButton,
  VerificationLinkButton,
} from "./constant";

import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ButtonStyle,
  Client,
  ComponentType,
  GatewayDispatchEvents,
  GatewayIntentBits,
  InteractionType,
  MessageFlags,
} from "@discordjs/core";

dotenv.config();

const prisma = new PrismaClient();

const rest = new REST({
  version: "10",
}).setToken(TOKEN);

export const gateway = new WebSocketManager({
  rest,
  token: TOKEN,
  intents: GatewayIntentBits.GuildMessages,
});

export const discord = new Client({ rest, gateway });

discord.on(
  GatewayDispatchEvents.InteractionCreate,
  async ({ data: interaction, api }) => {
    if (!interaction.guild_id) return;
    const { id, token } = interaction;
    const { type, data, guild_id } = interaction;

    if (type === InteractionType.MessageComponent) {
      if (data.component_type === ComponentType.Button) {
        if (data.custom_id.startsWith("remove:")) {
          await prisma.role
            .delete({
              where: { id: data.custom_id.split(":")[1] },
            })
            .catch((error) => {
              console.log("ERROR: DELETE ROLE", error);
            });

          const roles = await prisma.role.findMany({
            where: { guildId: guild_id },
          });

          if (roles.length === 0) {
            await api.interactions.reply(id, token, {
              flags: MessageFlags.Ephemeral,
              content: "no roles set",
            });
            return;
          }

          await api.interactions.reply(id, token, {
            flags: MessageFlags.Ephemeral,
            components: [
              {
                type: ComponentType.ActionRow,
                components: roles.map((role) => ({
                  type: ComponentType.Button,
                  style: ButtonStyle.Danger,
                  label: `${role.collectionId.replace(
                    /(.{7})..+/,
                    "$1..."
                  )} - @${role.roleName}`,
                  custom_id: `remove:${role.id}`,
                  emoji: { name: "🗑️" },
                })),
              },
            ],
          });
        }
        if (data.custom_id === VER_BUTTON_ID) {
          if (!interaction.member) return;

          const deferSuccess = await api.interactions
            .defer(id, token, { flags: MessageFlags.Ephemeral })
            .then(() => true)
            .catch((error) => {
              console.log("ERROR: DEFER", error);
              return false;
            });

          if (!deferSuccess) return;

          const uuid = randomUUID({
            disableEntropyCache: true,
          });

          await cache.set(
            uuid,
            `${interaction.member.user.id}:${guild_id}:${interaction.token}`,
            "EX",
            24 * 60 * 60
          );

          const editReplySuccess = await api.interactions
            .editReply(APPID, token, {
              flags: MessageFlags.Ephemeral,
              content: "",
              embeds: [VerificationLinkButton],
              components: [
                {
                  type: ComponentType.ActionRow,
                  components: [
                    {
                      label: `Verify`,
                      style: ButtonStyle.Link,
                      type: ComponentType.Button,
                      url: `${process.env.FE_URL}?code=${uuid}`,
                    },
                  ],
                },
              ],
            })
            .then(() => true)
            .catch((error) => {
              console.log("ERROR: LINK REPLY", error);
              return false;
            });

          if (!editReplySuccess) return;

          setTimeout(() => {
            api.interactions.deleteReply(APPID, token).catch((error) => {
              console.log("ERROR: DELETE LINK", error);
            });
          }, 2 * 60 * 1000);
        }
      }
    }
    if (type === InteractionType.ApplicationCommand) {
      if (data.type === ApplicationCommandType.ChatInput) {
        if (!Array.isArray(data.options)) return;
        const command = data.options[0];
        if (command.type === ApplicationCommandOptionType.Subcommand) {
          if (command.name === "channel") {
            if (!Array.isArray(command.options)) return;
            const channelCommand = command.options[0];
            if (channelCommand.type === ApplicationCommandOptionType.Channel) {
              if (channelCommand.name === "channel_tag") {
                const channelId = channelCommand.value;
                await prisma.guild.upsert({
                  where: { guildId: guild_id },
                  update: { channel: channelId },
                  create: { channel: channelId, guildId: guild_id },
                });
                await api.interactions.reply(id, token, {
                  content: "channel set",
                  flags: MessageFlags.Ephemeral,
                });
                await api.channels.createMessage(channelId, {
                  embeds: [StartVerificationButton],
                  components: [
                    {
                      type: ComponentType.ActionRow,
                      components: [
                        {
                          custom_id: VER_BUTTON_ID,
                          type: ComponentType.Button,
                          style: ButtonStyle.Secondary,
                          label: "Start Verification",
                          emoji: { name: "🟠" },
                        },
                      ],
                    },
                  ],
                });
              }
            }
          }
          if (command.name === "add") {
            if (!Array.isArray(command.options)) return;
            if (command.options.length !== 2) return;
            const roleCommand = command.options[1];
            const collection = command.options[0];

            if (roleCommand.type !== ApplicationCommandOptionType.Role) return;
            if (collection.type !== ApplicationCommandOptionType.String) return;

            const guild = await prisma.guild.findUnique({
              where: { guildId: guild_id },
            });

            if (!guild) {
              await api.interactions.reply(id, token, {
                content: `setup channel`,
                flags: MessageFlags.Ephemeral,
              });
              return;
            }

            const roleId = roleCommand.value;
            const guildRoles = await api.guilds.getRoles(guild_id);
            const role = guildRoles.find((r) => r.id === roleId);
            if (!role) return;
            const roleName = role.name;
            const collectionId = collection.value;

            await prisma.role.upsert({
              where: {
                guildId_collectionId_roleId: {
                  roleId,
                  collectionId,
                  guildId: guild_id,
                },
              },
              create: {
                roleName,
                collectionId,
                guildId: guild_id,
                roleId,
              },
              update: { roleId, roleName },
            });

            await api.interactions.reply(id, token, {
              content: `updated`,
              flags: MessageFlags.Ephemeral,
            });
          }
          if (command.name === "list") {
            const roles = await prisma.role.findMany({
              where: { guildId: guild_id },
            });

            if (roles.length === 0) {
              await api.interactions.reply(id, token, {
                content: `add collections`,
                flags: MessageFlags.Ephemeral,
              });
              return;
            }

            await api.interactions.reply(id, token, {
              flags: MessageFlags.Ephemeral,
              components: [
                {
                  type: ComponentType.ActionRow,
                  components: roles.map((role) => ({
                    type: ComponentType.Button,
                    style: ButtonStyle.Danger,
                    label: `${role.collectionId.replace(
                      /(.{7})..+/,
                      "$1..."
                    )} - @${role.roleName}`,
                    custom_id: `remove:${role.id}`,
                    emoji: { name: "🗑️" },
                  })),
                },
              ],
            });
          }
        }
      }
    }
  }
);

discord.once(GatewayDispatchEvents.Ready, async ({ api }) => {
  console.log("Discord: Overwriting commands...");
  await api.applicationCommands.bulkOverwriteGlobalCommands(APPID, COMMANDS);
  console.log("Discord: Ready", new Date().toUTCString());
});
