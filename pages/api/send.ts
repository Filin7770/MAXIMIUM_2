import type { NextApiRequest, NextApiResponse } from "next";
import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  erc20Abi,
  http,
} from "viem";
import { holesky } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import IERC20PermitAbi from "../../public/abis/IERC20Permit.json";

type ResponseData = {
  message: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    let requestBody;
    try {
      requestBody = JSON.parse(req.body);
    } catch (error) {
      return res.status(400).json({ message: "Invalid JSON input" });
    }

    const { owner, spender, recipient, value, nonce, deadline, signature } =
      requestBody;
    console.log(owner, spender, value, nonce, deadline, signature, recipient);

    const publicClient = createPublicClient({
      chain: holesky,
      transport: http("https://rpc.ankr.com/eth_holesky"),
    });

    const client = createWalletClient({
      chain: holesky,
      transport: http("https://rpc.ankr.com/eth_holesky"),
    });
    const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x{string}`);
    console.log(signature);
    const { v, r, s } = splitSignature(signature);

    const encodedDataPermit = encodeFunctionData({
      abi: IERC20PermitAbi,
      functionName: "permit",
      args: [
        owner,
        spender,
        value,
        deadline,
        v,
        r as `0x{string}`,
        s as `0x{string}`,
      ],
    });

    const transactionHashPermit = await client.sendTransaction({
      account,
      data: encodedDataPermit,
      to: "0x37074befcC1c145A9BdA8De30693607E56f4c713",
    });

    await publicClient.waitForTransactionReceipt({ hash: transactionHashPermit });

    const encodedDataTransferFrom = encodeFunctionData({
      abi: erc20Abi,
      functionName: "transferFrom",
      args: [owner, recipient, value],
    });

    const transactionHashTransferFrom = await client.sendTransaction({
      account,
      data: encodedDataTransferFrom,
      to: "0x37074befcC1c145A9BdA8De30693607E56f4c713",
    });
    await publicClient.waitForTransactionReceipt({
      hash: transactionHashTransferFrom,
    });
    res.status(200).json({ message: "Tokens have been successfully sent and received to another wallet." });
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    res.status(500).json({ message: "An error occurred", error: errorMessage });
  }
}

function splitSignature(signature: string) {
  console.log(signature);
  const r = "0x" + signature.slice(2, 66);
  const s = "0x" + signature.slice(66, 130);
  const v = parseInt(signature.slice(130, 132), 16);
  return { r, s, v };
}
