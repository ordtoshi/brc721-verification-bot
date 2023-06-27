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

export type WalletProvider = "ordinalsafe" | "unisat";

export type VerifyRequestDto = {
  code: string;
  address: string;
  provider: WalletProvider;
  signature: string;
  publicKey: string;
};
