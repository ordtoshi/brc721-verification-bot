import "dotenv/config";
import Redis from "ioredis";
import { REDIS_CONNECTION } from "./constant";

export const cache = new Redis(REDIS_CONNECTION);
