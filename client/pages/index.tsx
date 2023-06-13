/* eslint-disable @next/next/no-img-element */
import Head from "next/head";
import * as React from "react";
import { useRouter } from "next/router";
import { IWallet, useOrdinalSafe } from "../hooks/useOrdinalSafe";
import type { NextPage } from "next";
import { useMessage } from "../hooks/useMessage";
import { useVerify } from "../hooks/useVerify";
import { Button } from "../components/Button";

const Home: NextPage = () => {
  const message = useMessage();
  const wallet = useOrdinalSafe();
  const { query } = useRouter();

  const [address, setAddress] = React.useState<string>();
  const verify = useVerify({ address, code: query.code as string });

  React.useEffect(() => {
    async function setupAccount(wallet: IWallet) {
      if (wallet) {
        const accounts = await wallet.requestAccounts();
        setAddress(accounts[0]);
      }
    }

    if (wallet.wallet) {
      setupAccount(wallet.wallet);
    }
  }, [wallet.wallet]);

  return (
    <>
      <Head>
        <title>BRC721 Discord Verification</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex items-center justify-center w-screen h-screen p-10 text-white rounded-lg shadow-xl bg-neutral-800">
        <div className="max-w-md">
          <div className="flex items-center gap-2 mb-10">
            <img className="w-8 h-8" src="/logo.svg" alt="BRC721" />
            <h1>BRC721 Discord Verification</h1>
          </div>
          <p>
            Signing is the only way we can truly know that you are the owner of
            the wallet you are connecting.
          </p>
          <p>
            Signing is a safe, gas-less and does not in any way give permission
            to perform any transactions with your wallet.
          </p>
          {(() => {
            if (!message.data) {
              return (
                <div className="text-rose-300">
                  Something went wrong! Try again later.
                </div>
              );
            }

            if (wallet.injection.isError) {
              return (
                <div className="text-white">
                  {wallet.injection.error}.{" "}
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href="https://ordinalsafe.xyz"
                  >
                    Download from the official page.
                  </a>
                </div>
              );
            }

            if (wallet.initialization.isError) {
              return (
                <div className="text-white">{wallet.initialization.error}</div>
              );
            }

            if (wallet.injection.isSuccess && wallet.initialization.isIdle) {
              return (
                <Button onClick={wallet.initialize}>Connect wallet</Button>
              );
            }

            if (wallet.initialization.isSuccess) {
              if (verify.isSuccess) {
                return (
                  <div className="text-white">
                    Verification submitted! You can now close this window.
                  </div>
                );
              }

              if (verify.isError) {
                return (
                  <div className="text-rose-300">
                    Verification error! Try again later.
                  </div>
                );
              }

              return (
                <Button
                  disabled={verify.isLoading}
                  onClick={async () => {
                    const signMessage = wallet.wallet?.signMessage;
                    if (!signMessage) return;

                    const signature = await signMessage(message.data!);
                    if (!signature) return;

                    await verify.mutateAsync(signature);
                  }}
                >
                  Verify tokens
                </Button>
              );
            }
          })()}
        </div>
      </main>
    </>
  );
};

export default Home;
