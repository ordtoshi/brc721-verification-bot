import dotenv from "dotenv";

dotenv.config();

export const TOKEN = process.env.DISCORD_TOKEN!;
export const APPID = process.env.DISCORD_APP_ID!;
export const REDIS_CONNECTION = {
  tls: {},
  connectTimeout: 30000,
  host: process.env.REDIS_HOST,
  password: process.env.REDIS_PASSWORD,
  username: process.env.REDIS_USERNAME,
  port: parseInt(process.env.REDIS_PORT!),
};
