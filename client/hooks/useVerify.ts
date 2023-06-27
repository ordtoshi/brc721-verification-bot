import axios from "axios";
import { useMutation } from "@tanstack/react-query";

import { WalletProvider } from "../pages";

export const useVerify = ({
  address,
  code,
  provider,
  publicKey,
}: {
  address?: string;
  code?: string;
  provider?: WalletProvider;
  publicKey?: string;
}) =>
  useMutation({
    mutationKey: ["verify", address, code],
    mutationFn: (signature: string) =>
      axios({
        method: "POST",
        url: "/verify",
        data: { address, code, signature, provider, publicKey },
        baseURL: process.env.NEXT_PUBLIC_API,
      }).then(({ data }) => data),
  });
