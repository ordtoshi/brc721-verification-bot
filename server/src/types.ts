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

export type VerifyRequestDto = {
  code: string;
  address: string;
  signature: string;
};
