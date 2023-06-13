import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const api = axios.create({
  baseURL: process.env.API,
});

const hiroApi = axios.create({
  baseURL: process.env.HIRO_API,
});

const getNonce = () => {
  const milliseconds = new Date().valueOf();
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  return hours;
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

export const getInscriptions = async (address: string): Promise<string[]> => {
  let page = 0;
  const limit = 10;
  let advance = true;
  const inscriptionIds: string[][] = [];
  while (advance) {
    const { data } = await hiroApi({
      method: "GET",
      url: "inscriptions",
      params: { address, limit, offset: page * limit },
    });

    inscriptionIds.push(data.results.map((i: any) => i.id));
    if (data.total <= page * limit + limit) advance = false;
    page += 1;
  }

  return inscriptionIds.flat();
};

export const hasValid = async (ids: string[], collectionId: string) => {
  const chunks: string[][] = [];
  const chunkSize = 10;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    chunks.push(chunk);
  }

  let hasValid = false;
  for await (const chunk of chunks) {
    const { data } = await api({
      method: "GET",
      url: "inscriptions",
      params: { ids: chunk.join(","), collectionId },
    }).catch((err) => {
      console.error("QUERY VALID INSCR", err);
      throw new Error("QUERY VALID INSCR");
    });

    if (data?.inscriptions.length > 0) {
      hasValid = true;
      break;
    }
  }

  return hasValid;
};
