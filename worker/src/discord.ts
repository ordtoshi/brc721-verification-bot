import { API } from "@discordjs/core";
import { REST } from "@discordjs/rest";

import { TOKEN } from "./constant";

export const discord = new API(
  new REST({
    version: "10",
  }).setToken(TOKEN)
);
