type RoleJobCron = {
  type: "cron";
};

type RoleJobNew = {
  type: "new";
  code: string;
  address: string;
};

type RoleJobOld = {
  type: "old";
  id: string;
};

export type RoleJob = RoleJobNew | RoleJobOld | RoleJobCron;

export type GuildNotFound = {
  type: "GuildNotFound";
  guildId: string;
};
export type RoleNotFound = {
  type: "RoleNotFound";
  guildId: string;
  roleId: string;
};
export type MemberNotFound = {
  type: "MemberNotFound";
  guildId: string;
  userId: string;
};

export interface NotFoundException {
  data: GuildNotFound | RoleNotFound | MemberNotFound;
  discriminator: "NotFoundException";
}
