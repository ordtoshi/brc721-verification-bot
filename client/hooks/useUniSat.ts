import { useCallback, useEffect, useRef, useState } from "react";

export const useUniSat = () => {
  const [unisatInstalled, setUnisatInstalled] = useState(false);
  const [connected, setConnected] = useState(false);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [address, setAddress] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [network, setNetwork] = useState("livenet");

  const getBasicInfo = async () => {
    const unisat = (window as any).unisat;
    const [address] = await unisat.getAccounts();
    setAddress(address);

    const publicKey = await unisat.getPublicKey();
    setPublicKey(publicKey);

    const network = await unisat.getNetwork();
    setNetwork(network);
  };

  const selfRef = useRef<{ accounts: string[] }>({
    accounts: [],
  });

  const self = selfRef.current;

  const handleAccountsChanged = useCallback(
    (_accounts: string[]) => {
      if (self.accounts[0] === _accounts[0]) {
        // prevent from triggering twice
        return;
      }
      self.accounts = _accounts;
      if (_accounts.length > 0) {
        setAccounts(_accounts);
        setConnected(true);

        setAddress(_accounts[0]);

        getBasicInfo();
      } else {
        setConnected(false);
      }
    },
    [self]
  );

  const handleNetworkChanged = useCallback((network: string) => {
    setNetwork(network);
    getBasicInfo();
  }, []);

  useEffect(() => {
    async function checkUnisat() {
      let unisat = (window as any).unisat;

      for (let i = 1; i < 10 && !unisat; i += 1) {
        await new Promise((resolve) => setTimeout(resolve, 100 * i));
        unisat = (window as any).unisat;
      }

      if (unisat) {
        setUnisatInstalled(true);
      } else if (!unisat) return;

      unisat.getAccounts().then((accounts: string[]) => {
        handleAccountsChanged(accounts);
      });

      unisat.on("accountsChanged", handleAccountsChanged);
      unisat.on("networkChanged", handleNetworkChanged);

      return () => {
        unisat.removeListener("accountsChanged", handleAccountsChanged);
        unisat.removeListener("networkChanged", handleNetworkChanged);
      };
    }

    checkUnisat().then();
  }, [handleAccountsChanged, handleNetworkChanged, self]);

  return {
    handleAccountsChanged,
    unisatInstalled,
    publicKey,
    connected,
    accounts,
    address,
    network,
  };
};
