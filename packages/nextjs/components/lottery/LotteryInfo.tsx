import { useEffect, useState } from "react";
import { renderLabelAndValue } from "@components/lottery/LabelAndValue";
import { useReadData } from "@hooks/lotteryToken";
import { useScaffoldReadContract } from "@hooks/scaffold-eth";
import { formatEther } from "viem";
import { useAccount } from "wagmi";

export const LotteryInfo = () => {
  const { address, isConnected, chainId } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [balance, setBalance] = useState<bigint>(0n);
  console.log("LotteryInfo -> init -> isConnected", isConnected, "chainId", chainId, "mounted", mounted);
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
      console.log(`LotteryInfo -> fetchBalance -> tokenBalance (${address})`, tokenBalance);
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
  const { data: prizePool } = useScaffoldReadContract({
    contractName: "Lottery",
    functionName: "prizePool",
    args: [],
  });
  const { data: ownerPool } = useScaffoldReadContract({
    contractName: "Lottery",
    functionName: "ownerPool",
    args: [],
  });
  const { data: betsOpen } = useScaffoldReadContract({
    contractName: "Lottery",
    functionName: "betsOpen",
    args: [],
  });
  const { data: betsClosingTime } = useScaffoldReadContract({
    contractName: "Lottery",
    functionName: "betsClosingTime",
    args: [],
  });
  console.log(
    "LotteryInfo -> purchaseRatio",
    purchaseRatio,
    "betPrice",
    betPrice,
    "betFee",
    betFee,
    "prizePool",
    prizePool,
    "ownerPool",
    ownerPool,
    "betsOpen",
    betsOpen,
    "betsClosingTime",
    betsClosingTime,
  );

  if (!mounted || !isConnected || !chainId) return null;

  return (
    <div className="flex flex-col items-center p-4">
      <h2 className="text-xl font-bold">Lottery Details</h2>

      <div className="flex flex-wrap justify-center">
        {renderLabelAndValue<bigint>("Purchase Ratio", "ETH", purchaseRatio)}
        {renderLabelAndValue<bigint>("Bet Price", "ETH", betPrice)}
        {renderLabelAndValue<bigint>("Bet Fee", "ETH", betFee)}
        {renderLabelAndValue<bigint>("Prize Pool", "ETH", prizePool)}
        {renderLabelAndValue<boolean>("Bets Open", "", betsOpen)}
        {renderLabelAndValue<bigint>("Bets Closing Time", "", betsClosingTime)}
        {renderLabelAndValue<bigint>("Token Balance", "", balance)}
      </div>
    </div>
  );
};
