import { useEffect, useState } from "react";
import { renderLabelAndValue } from "@components/lottery/LabelAndValue";
import { IntegerInput } from "@components/scaffold-eth";
import { useReadData } from "@hooks/lotteryToken";
import { useScaffoldReadContract, useScaffoldWriteContract } from "@hooks/scaffold-eth";
import { parseEther } from "viem";
import { useAccount } from "wagmi";

export const ManageTokens = () => {
  const { address, isConnected, chainId } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [balance, setBalance] = useState<bigint>(0n);
  const [tokensToPurchase, setTokensToPurchase] = useState(0);
  const [loading, setLoading] = useState(false);
  console.log("ManageTokens -> init -> isConnected", isConnected, "chainId", chainId, "mounted", mounted);
  const { data: tokenAddress } = useScaffoldReadContract({
    contractName: "Lottery",
    functionName: "paymentToken",
    args: [],
  });
  const tokenData = useReadData(tokenAddress);

  useEffect(() => {
    if (isConnected) {
      setMounted(true);
    }
  }, [isConnected]);

  useEffect(() => {
    if (!mounted || !tokenAddress) return;

    const fetchBalance = async () => {
      const tokenBalance = (await tokenData("balanceOf", [address])) as unknown as bigint;
      setBalance(tokenBalance);
      console.log(`ManageTokens -> fetchBalance -> tokenBalance (${address})`, tokenBalance);
    };

    fetchBalance();
  }, [address, mounted, tokenAddress, tokenData]);

  const { data: purchaseRatio } = useScaffoldReadContract({
    contractName: "Lottery",
    functionName: "purchaseRatio",
    args: [],
  });
  const { data: betPrice } = useScaffoldReadContract({
    contractName: "Lottery",
    functionName: "betPrice",
    args: [],
  });
  const { data: betFee } = useScaffoldReadContract({
    contractName: "Lottery",
    functionName: "betFee",
    args: [],
  });
  const { writeContractAsync } = useScaffoldWriteContract("Lottery");
  console.log("ManageTokens -> purchaseRatio", purchaseRatio, "betPrice", betPrice, "betFee", betFee);

  const buyTokens = async () => {
    if (tokensToPurchase <= 0) return;

    setLoading(true);
    const purchaseCost = parseEther("" + tokensToPurchase) / (purchaseRatio as bigint);

    try {
      const result = await writeContractAsync({
        functionName: "purchaseTokens",
        value: purchaseCost,
      });
      console.log(`ManageTokens -> buyTokens -> purchased ${tokensToPurchase} tokens for ${purchaseCost}`, result);
    } catch (error) {
      console.error("ManageTokens -> buyTokens -> error", error);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !isConnected || !chainId) return null;

  return (
    <div className="flex flex-col items-center p-4">
      <h2 className="text-xl font-bold">Manage Tokens</h2>

      <div className="flex flex-wrap justify-center">
        {renderLabelAndValue<bigint>("Purchase Ratio", "ETH", purchaseRatio)}
        {renderLabelAndValue<bigint>("Bet Price", "ETH", betPrice)}
        {renderLabelAndValue<bigint>("Bet Fee", "ETH", betFee)}
        {renderLabelAndValue<bigint>("Token Balance", "", balance)}
      </div>

      <div className="flex flex-wrap justify-center mt-5">
        <div className="join">
          <IntegerInput
            value={String(tokensToPurchase)}
            onChange={updatedTxValue => {
              setTokensToPurchase(Number(updatedTxValue));
            }}
            placeholder="Tokens"
          />
          <button disabled={loading} className="btn join-item rounded-r-full" onClick={buyTokens}>
            {loading ? <span className="loading loading-spinner"></span> : "Buy Tokens"}
          </button>
        </div>
      </div>
    </div>
  );
};
