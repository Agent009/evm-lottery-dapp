import { useEffect, useState } from "react";
import { renderLabelAndValue } from "@components/lottery/LabelAndValue";
import deployedContracts from "@contracts/deployedContracts";
import { useReadData, useWriteData } from "@hooks/lotteryToken";
import { useScaffoldReadContract, useScaffoldWriteContract } from "@hooks/scaffold-eth";
import { TransactionReceipt, formatEther } from "viem";
import { useAccount } from "wagmi";
import { formatNumber, tokenAmountInWEI, weiToTokenAmount } from "~~/utils";

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
  const tokenWrite = useWriteData(tokenAddress);

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

  const tokenAmountWEIValue = tokenAmountInWEI(BigInt(tokenAmount), purchaseRatio || 1n);
  const tokenAmountETHValue = formatEther(tokenAmountWEIValue);
  const { writeContractAsync } = useScaffoldWriteContract("Lottery");
  console.log("ManageTokens -> purchaseRatio", purchaseRatio, "betPrice", betPrice, "betFee", betFee);

  const buyTokens = async () => {
    if (tokenAmount <= 0) return;

    setLoading(true);
    console.log(
      `ManageTokens -> buyTokens -> tokenAmount`,
      tokenAmount,
      "tokenCost (ETH / WEI)",
      tokenAmountETHValue,
      tokenAmountWEIValue,
    );

    try {
      const result = await writeContractAsync({
        functionName: "purchaseTokens",
        value: tokenAmountWEIValue,
      });
      console.log(
        `ManageTokens -> buyTokens -> purchased ${tokenAmount} tokens for ${tokenAmountETHValue} ETH`,
        result,
      );
    } catch (error) {
      console.error("ManageTokens -> buyTokens -> error", error);
    } finally {
      setLoading(false);
    }
  };

  const returnTokens = async () => {
    if (tokenAmount <= 0) return;

    setLoading(true);

    try {
      console.log(
        `ManageTokens -> returnTokens -> tokenAmount`,
        tokenAmount,
        "returnedETH (ETH / WEI)",
        tokenAmountETHValue,
        tokenAmountWEIValue,
      );
      // Approve the burn
      // @ts-expect-error ignore
      const deployedContract = deployedContracts[chainId]?.Lottery;
      const receipt = (await tokenWrite("approve", [
        deployedContract.address,
        tokenAmountWEIValue,
      ])) as unknown as TransactionReceipt;
      console.log(`ManageTokens -> returnTokens -> approved ${tokenAmount} -> receipt`, receipt);
      const result = await writeContractAsync({
        functionName: "returnTokens",
        args: [tokenAmountWEIValue],
      });
      console.log(
        `ManageTokens -> returnTokens -> returned ${tokenAmount} tokens for ${tokenAmountETHValue} ETH, result ->`,
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
        {renderLabelAndValue<bigint>({
          label: "Purchase Ratio",
          label2: "Tokens / WEI",
          value: purchaseRatio,
          asETH: false,
        })}
        {renderLabelAndValue<string>({
          label: "Bet Price",
          label2: "Tokens",
          value: formatNumber(betPrice),
          asETH: false,
        })}
        {renderLabelAndValue<string>({ label: "Bet Fee", label2: "Tokens", value: formatNumber(betFee), asETH: false })}
        {renderLabelAndValue<string>({
          label: "Token Balance",
          value: formatNumber(weiToTokenAmount(balance)),
          size: "1/2",
          asETH: false,
        })}
      </div>

      <div className="flex flex-wrap justify-center mt-5">
        <div className="join">
          {/*<IntegerInput*/}
          {/*  value={String(tokenAmount)}*/}
          {/*  onChange={val => {*/}
          {/*    setTokenAmount(Number(val));*/}
          {/*  }}*/}
          {/*  placeholder="Tokens"*/}
          {/*/>*/}
          <label className="form-control w-full max-w-xs">
            <input
              className="input input-accent bg-base-200 join-item"
              placeholder="Tokens"
              type="number"
              value={tokenAmount}
              onChange={e => setTokenAmount(Number(e.target.value))}
            />
            <div className="label">
              <span className="label-text-alt">Value</span>
              <span className="label-text-alt">{tokenAmountETHValue} ETH</span>
            </div>
          </label>

          <div
            className="tooltip tooltip-info"
            data-tip="You will pay ETH equal to number of tokens divided by 'Purchase Ratio'"
          >
            <button disabled={loading} className="btn join-item" onClick={buyTokens}>
              {loading ? <span className="loading loading-spinner"></span> : "Buy"}
            </button>
          </div>
          <div
            className="tooltip tooltip-info"
            data-tip="You will get ETH equal to number of returned tokens divided by 'Purchase Ratio'"
          >
            <button disabled={loading} className="btn join-item" onClick={returnTokens}>
              {loading ? <span className="loading loading-spinner"></span> : "Return"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
