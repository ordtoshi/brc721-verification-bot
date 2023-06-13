import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const getNonce = () => {
  const milliseconds = new Date().valueOf();
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  return hours;
};

export const verifySig = async ({
  message,
  address,
  signature,
}: {
  message: string;
  address: string;
  signature: string;
}) => {
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
