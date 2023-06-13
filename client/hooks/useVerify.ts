import axios from "axios";
import { useMutation } from "@tanstack/react-query";

export const useVerify = ({
  address,
  code,
}: {
  address?: string;
  code?: string;
}) =>
  useMutation({
    mutationKey: ["verify", address, code],
    mutationFn: (signature: string) =>
      axios({
        method: "POST",
        url: "/verify",
        data: { address, code, signature },
        baseURL: process.env.NEXT_PUBLIC_API,
      }).then(({ data }) => data),
  });
