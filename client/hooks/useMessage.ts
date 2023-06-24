import axios from "axios";
import { useQuery } from "@tanstack/react-query";

export const useMessage = () =>
  useQuery<any, any, string>({
    queryKey: ["message"],
    queryFn: () =>
      axios({
        method: "GET",
        url: "/message",
        baseURL: process.env.NEXT_PUBLIC_API,
      }).then(({ data }) => data),
    refetchOnWindowFocus: false,
  });
