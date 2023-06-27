import dotenv from "dotenv";
import axios from "axios";
import { verifyMessage } from "@unisat/wallet-utils";
import { WalletProvider } from "./types";

dotenv.config();

const getNonce = () => {
  const milliseconds = new Date().valueOf();
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  return hours;
};

export const verifySig = async ({
  message,
  address,
  provider,
  signature,
  publicKey,
}: {
  message: string;
  address: string;
  signature: string;
  provider: WalletProvider;
  publicKey?: string;
}) => {
  if (provider === "unisat" && publicKey) {
    const result = verifyMessage(publicKey, message, signature);
    return result;
  }
  if (provider === "ordinalsafe") {
    const res = await axios({
      method: "POST",
      url: "verifymessage",
      baseURL: "http://45.55.104.148:3000",
      data: { address, signature, message },
    });

    if (res.status !== 200) {
      throw new Error("Error verifying signature");
    }

    return res.data?.result;
  }

  return false;
};

export const getCurrentMessage = () => {
  return `
Signing is the only way we can truly know that you are the owner of
the wallet you are connecting.

Signing is a safe, gas-less and does not in any way give permission
to perform any transactions with your wallet.

nonce : ${getNonce()}
`;
};
