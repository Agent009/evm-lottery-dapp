import { useEffect, useState } from "react";
import { renderLabelAndValue } from "@components/lottery/LabelAndValue";
import deployedContracts from "@contracts/deployedContracts";
import { useReadData, useWriteData } from "@hooks/lotteryToken";
import { useScaffoldReadContract, useScaffoldWriteContract } from "@hooks/scaffold-eth";
import { TransactionReceipt, formatEther } from "viem";
import { useAccount } from "wagmi";
import { formatNumber, tokenAmountInWEI, weiToFractionalTokenAmount, weiToTokenAmount } from "~~/utils";

export const ManageTokens = () => {
  const { address, isConnected, chainId } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [balance, setBalance] = useState<bigint>(0n);
  const [tokenAmount, setTokenAmount] = useState(0);
  const [claimAmount, setClaimAmount] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
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
  const { data: myPrizeWEIValue } = useScaffoldReadContract({
    contractName: "Lottery",
    functionName: "prize",
    args: [address],
  });
  const { data: ownerPoolWEIValue } = useScaffoldReadContract({
    contractName: "Lottery",
    functionName: "ownerPool",
    args: [],
  });

  const tokenAmountWEIValue = tokenAmountInWEI(BigInt(tokenAmount), purchaseRatio || 1n);
  const tokenAmountETHValue = formatEther(tokenAmountWEIValue);
  const claimAmountWEIValue = tokenAmountInWEI(BigInt(claimAmount), purchaseRatio || 1n);
  // const claimAmountETHValue = formatEther(claimAmountWEIValue);
  const withdrawAmountWEIValue = tokenAmountInWEI(BigInt(withdrawAmount), purchaseRatio || 1n);
  // const withdrawAmountETHValue = formatEther(withdrawAmountWEIValue);
  const myPrize = weiToTokenAmount(myPrizeWEIValue);
  const ownerPool = weiToTokenAmount(ownerPoolWEIValue);
  const { writeContractAsync } = useScaffoldWriteContract("Lottery");
  console.log(
    "ManageTokens -> purchaseRatio",
    purchaseRatio,
    "betPrice",
    betPrice,
    "betFee",
    betFee,
    "myPrize",
    myPrize,
    "inWEI",
    myPrizeWEIValue,
  );

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
      const tx = await writeContractAsync({
        functionName: "purchaseTokens",
        value: tokenAmountWEIValue,
      });
      console.log(
        `ManageTokens -> buyTokens -> purchased ${tokenAmount} tokens for ${tokenAmountETHValue} ETH, tx`,
        tx,
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
      setTokenAmount(0);
    }
  };

  const claimPrize = async () => {
    if (claimAmount <= 0) return;

    setLoading(true);

    try {
      console.log(`ManageTokens -> claimPrize -> claimAmount`, claimAmount);
      const result = await writeContractAsync({
        functionName: "prizeWithdraw",
        args: [claimAmountWEIValue],
      });
      console.log(`ManageTokens -> claimPrize -> claimed ${claimAmount} tokens from the prize pool, result ->`, result);
    } catch (error) {
      console.error("ManageTokens -> claimPrize -> error", error);
    } finally {
      setLoading(false);
      setClaimAmount(0);
    }
  };

  const withdrawTokens = async () => {
    if (withdrawAmount <= 0) return;

    setLoading(true);

    try {
      console.log(`ManageTokens -> withdrawTokens -> withdrawAmount`, withdrawAmount);
      const result = await writeContractAsync({
        functionName: "ownerWithdraw",
        args: [withdrawAmountWEIValue],
      });
      console.log(
        `ManageTokens -> withdrawTokens -> withdrew ${withdrawAmount} tokens from the owner pool, result ->`,
        result,
      );
    } catch (error) {
      console.error("ManageTokens -> withdrawTokens -> error", error);
    } finally {
      setLoading(false);
      setWithdrawAmount(0);
    }
  };

  if (!mounted || !isConnected || !chainId) return null;

  return (
    <div className="flex flex-col items-center p-4 md:min-w-[40rem] w-full">
      <h2 className="text-xl font-bold">Manage Tokens</h2>

      <div className="flex flex-wrap justify-center w-full">
        {renderLabelAndValue<bigint>({
          label: "Purchase Ratio",
          label2: "Tokens / WEI",
          value: purchaseRatio,
          asETH: false,
        })}
        {renderLabelAndValue<string>({
          label: "Bet Price",
          label2: "Tokens",
          value: formatNumber(weiToFractionalTokenAmount(betPrice)),
          asETH: false,
        })}
        {renderLabelAndValue<string>({
          label: "Bet Fee",
          label2: "Tokens",
          value: formatNumber(weiToFractionalTokenAmount(betFee)),
          asETH: false,
        })}
        {renderLabelAndValue<string>({
          label: "Token Balance",
          value: formatNumber(weiToTokenAmount(balance)),
          size: "1/2",
          asETH: false,
        })}
      </div>

      {/* Buy / return tokens */}
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
            <button disabled={loading} className="btn btn-accent join-item" onClick={buyTokens}>
              {loading ? <span className="loading loading-spinner"></span> : "Buy"}
            </button>
          </div>
          <div
            className="tooltip tooltip-info"
            data-tip="You will get ETH equal to number of returned tokens divided by 'Purchase Ratio'"
          >
            <button disabled={loading} className="btn btn-accent join-item" onClick={returnTokens}>
              {loading ? <span className="loading loading-spinner"></span> : "Return"}
            </button>
          </div>
        </div>
      </div>

      {/* Claim prize */}
      <div className="flex flex-wrap justify-center mt-5">
        <div className="join">
          <label className="form-control w-full max-w-xs">
            <input
              className="input input-accent bg-base-200 join-item"
              placeholder="Tokens"
              type="number"
              value={claimAmount}
              onChange={e => setClaimAmount(Number(e.target.value))}
            />
            <div className="label">
              <span className="label-text-alt">Tokens</span>
              <span className="label-text-alt">{String(myPrize || 0)} available</span>
            </div>
          </label>

          <div className="tooltip tooltip-info" data-tip="Withdraw tokens from the prize pool">
            <button disabled={loading} className="btn btn-accent join-item" onClick={claimPrize}>
              {loading ? <span className="loading loading-spinner"></span> : "Claim"}
            </button>
          </div>
        </div>
      </div>

      {/* Withdraw from owner pool */}
      <div className="flex flex-wrap justify-center mt-5">
        <div className="join">
          <label className="form-control w-full max-w-xs">
            <input
              className="input input-accent bg-base-200 join-item"
              placeholder="Tokens"
              type="number"
              value={withdrawAmount}
              onChange={e => setWithdrawAmount(Number(e.target.value))}
            />
            <div className="label">
              <span className="label-text-alt">Tokens</span>
              <span className="label-text-alt">{String(ownerPool || 0)} available</span>
            </div>
          </label>

          <div className="tooltip tooltip-info" data-tip="Withdraw tokens from the owner pool">
            <button disabled={loading} className="btn btn-accent join-item" onClick={withdrawTokens}>
              {loading ? <span className="loading loading-spinner"></span> : "Withdraw"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
