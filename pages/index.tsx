import { ConnectButton } from "@rainbow-me/rainbowkit";
import type { NextPage } from "next";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import { useState } from "react";
import { parseEther } from "viem";
import { useAccount, useReadContract, useSignTypedData } from "wagmi";
import IERC20PermitAbi from "../public/abis/IERC20Permit.json";

const Home: NextPage = () => {
  const { address } = useAccount();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // новое состояние для загрузки
  const { signTypedDataAsync } = useSignTypedData();
  const { data: nonceData } = useReadContract({
    address: "0x37074befcC1c145A9BdA8De30693607E56f4c713",
    abi: IERC20PermitAbi,
    functionName: "nonces",
    args: [address],
  });
  const nonce = nonceData as bigint;

  const isAddressValid = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const send = async () => {
    setError(null);
    setSuccess(null);

    if (!recipient || !isAddressValid(recipient)) {
      setError("Please enter the correct recipient address.");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter the correct amount.");
      return;
    }

    setIsLoading(true); // Установка состояния загрузки перед отправкой

    const types = {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };

    const domainData = {
      name: "Maximium",
      version: "1",
      chainId: 17000,
      verifyingContract:
        "0x37074befcC1c145A9BdA8De30693607E56f4c713" as `0x{string}`,
    };

    const message = {
      owner: address,
      spender: "0x956aEe412973D0D80bEB7A9874cB6f60E24Dbbc8",
      value: parseEther(amount).toString(),
      nonce: nonce.toString(),
      deadline: Math.floor(Date.now() / 1000) + 60 * 20,
    };

    try {
      const signature = await signTypedDataAsync({
        account: address,
        message,
        domain: domainData,
        primaryType: "Permit",
        types,
      });
      await callAPI(message, signature);
    } catch (err) {
      setError("The contract has not been signed. Please confirm in MetaMask.");
      setIsLoading(false); // Установка состояния загрузки в false при ошибке
    }
  };

  const callAPI = async (message: any, signature: string | void) => {
    try {
      const res = await fetch(`/api/send`, {
        method: "POST",
        body: JSON.stringify({
          ...message,
          signature,
          recipient,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
      } else {
        setError(data.error || "An error occurred during the transaction.");
      }
    } catch (err) {
      setError("An error occurred while calling the API.");
      console.error(err);
    } finally {
      setIsLoading(false); // Установка состояния загрузки в false после завершения
    }
  };

  // Компонент для спиннера загрузки
  const LoadingSpinner = () => {
    return <div className={styles.spinner}></div>;
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Maximium</title>
        <meta content="Maximium" name="description" />
        <link rel="icon" href="/react-2.svg" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Maximium</h1>
        <ConnectButton showBalance={false} />
        {address && (
          <div className={`card bg-base-200 w-96 ${styles.mainCard}`}>
            <div className="card-body">
              <input
                placeholder="Recipient"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className={`input input-bordered ${styles.inputRecipient}`}
              />
              <input
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                className={`input input-bordered ${styles.inputAmount}`}
                min="0"
              />
              <button
                className={`${styles.send} ${
                  isLoading ? styles.buttonNoBorder : ""
                }`}
                onClick={send}
                disabled={isLoading}
              >
                {isLoading ? <LoadingSpinner /> : "Send"}{" "}
              </button>
              {error && (
                <div className={`error ${styles.errorSuccess}`}>{error}</div>
              )}
              {success && (
                <div className={`success ${styles.errorSuccess}`}>
                  {success}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
