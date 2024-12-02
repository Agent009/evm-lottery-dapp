import { useEffect, useState } from "react";
import { renderLabelAndValue } from "@components/lottery/LabelAndValue";
import { IntegerInput } from "@components/scaffold-eth";
import deployedContracts from "@contracts/deployedContracts";
import { useReadData, useWriteData } from "@hooks/lotteryToken";
import { useScaffoldReadContract, useScaffoldWriteContract } from "@hooks/scaffold-eth";
import { TransactionReceipt, parseEther } from "viem";
import { useAccount } from "wagmi";

export const ManageTokens = () => {
  const { address, isConnected, chainId } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [balance, setBalance] = useState<bigint>(0n);
  const [tokenAmount, setTokenAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  console.log("ManageTokens -> init -> isConnected", isConnected, "chainId", chainId, "mounted", mounted);
  const { data: tokenAddress } = useScaffoldReadContract({
    contractName: "Lottery",
    functionName: "paymentToken",
    args: [],
  });
  const tokenData = useReadData(tokenAddress);
  const tokenWrite = useWriteData(tokenAddress, address);

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
    if (tokenAmount <= 0) return;

    setLoading(true);
    const purchaseCost = parseEther("" + tokenAmount) / (purchaseRatio as bigint);

    try {
      const result = await writeContractAsync({
        functionName: "purchaseTokens",
        value: purchaseCost,
      });
      console.log(`ManageTokens -> buyTokens -> purchased ${tokenAmount} tokens for ${purchaseCost}`, result);
    } catch (error) {
      console.error("ManageTokens -> buyTokens -> error", error);
    } finally {
      setLoading(false);
    }
  };

  const returnTokens = async () => {
    if (tokenAmount <= 0) return;

    setLoading(true);
    const returnedEth = tokenAmount / purchaseRatio;

    try {
      // Approve the burn
      // @ts-expect-error ignore
      const deployedContract = deployedContracts[chainId]?.Lottery;
      const receipt = (await tokenWrite("approve", [
        deployedContract.address,
        returnedEth,
      ])) as unknown as TransactionReceipt;
      console.log(`ManageTokens -> returnTokens -> approved ${returnedEth} -> receipt`, receipt);
      const result = await writeContractAsync({
        functionName: "returnTokens",
        args: [returnedEth],
      });
      console.log(
        `ManageTokens -> returnTokens -> returned ${tokenAmount} tokens for ${returnedEth}, result ->`,
        result,
      );
    } catch (error) {
      console.error("ManageTokens -> returnTokens -> error", error);
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
        <IntegerInput
          value={String(tokenAmount)}
          onChange={val => {
            setTokenAmount(Number(val));
          }}
          placeholder="Tokens"
        />
        <div className="join join-vertical lg:join-horizontal">
          <button disabled={loading} className="btn join-item" onClick={buyTokens}>
            {loading ? <span className="loading loading-spinner"></span> : "Buy"}
          </button>
          <button disabled={loading} className="btn join-item" onClick={returnTokens}>
            {loading ? <span className="loading loading-spinner"></span> : "Return"}
          </button>
        </div>
      </div>
    </div>
  );
};
