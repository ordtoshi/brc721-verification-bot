import * as dotenv from "dotenv";
import { EmbedBuilder } from "@discordjs/builders";

import {
  ChannelType,
  ApplicationCommandType,
  ApplicationCommandOptionType,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "@discordjs/core";

dotenv.config();

export const VER_BUTTON_ID = "BRC721";
export const TOKEN = process.env.DISCORD_TOKEN!;
export const APPID = process.env.DISCORD_APP_ID!;

export const COMMANDS: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [
  {
    name: "brc721",
    description: "brc721 commands",
    default_member_permissions: "0",
    type: ApplicationCommandType.ChatInput,
    options: [
      {
        name: "add",
        description: "add role",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "collection",
            required: true,
            description: "Select collection",
            type: ApplicationCommandOptionType.String,
          },
          {
            name: "role",
            required: true,
            description: "Select role",
            type: ApplicationCommandOptionType.Role,
          },
        ],
      },
      {
        name: "list",
        description: "lists all added collections",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: "channel",
        description: "set verification channel",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            required: true,
            name: "channel_tag",
            description: "select channel",
            channel_types: [ChannelType.GuildText],
            type: ApplicationCommandOptionType.Channel,
          },
        ],
      },
    ],
  },
];

export const StartVerificationButton = new EmbedBuilder()
  .addFields({
    name: "Welcome to BRC721!",
    value:
      "We made a bot to help verify your BRC721 assets.\nClick the button below to start the process.",
  })
  .setColor([255, 153, 0]).data;

export const VerificationLinkButton = new EmbedBuilder()
  .addFields({
    name: "Verification link",
    value:
      "Your one-time link to the verification page. You will need to sign the message with OrdinalSafe to verify ownership of your assets.",
  })
  .setTimestamp().data;

export const REDIS_CONNECTION = {
  tls: {},
  connectTimeout: 30000,
  host: process.env.REDIS_HOST,
  password: process.env.REDIS_PASSWORD,
  username: process.env.REDIS_USERNAME,
  port: parseInt(process.env.REDIS_PORT!),
};
