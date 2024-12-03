import { useEffect, useState } from "react";
import { renderLabelAndValue } from "@components/lottery/LabelAndValue";
import deployedContracts from "@contracts/deployedContracts";
import { useReadData, useWriteData } from "@hooks/lotteryToken";
import { useScaffoldReadContract, useScaffoldWriteContract } from "@hooks/scaffold-eth";
import { TransactionReceipt } from "viem";
import { useAccount } from "wagmi";
import { formatNumber, tokenAmountInWEI, weiToFractionalTokenAmount, weiToTokenAmount } from "~~/utils";

export const ManageBets = () => {
  const { address, isConnected, chainId } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [balance, setBalance] = useState<bigint>(0n);
  const [betTimes, setBetTimes] = useState(0);
  const [loading, setLoading] = useState(false);
  console.log("ManageBets -> init -> isConnected", isConnected, "chainId", chainId, "mounted", mounted);
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
      console.log(`ManageBets -> fetchBalance -> tokenBalance (${address})`, tokenBalance);
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
  const { data: ownerPool } = useScaffoldReadContract({
    contractName: "Lottery",
    functionName: "ownerPool",
    args: [],
  });
  const { data: prizePool } = useScaffoldReadContract({
    contractName: "Lottery",
    functionName: "prizePool",
    args: [],
  });

  const tokenAmountWEIValue = tokenAmountInWEI(BigInt(balance), purchaseRatio || 1n);
  // const tokenAmountETHValue = formatEther(tokenAmountWEIValue);
  const betCostWEIValue = BigInt(betTimes) * (BigInt(betPrice || 1n) + BigInt(betFee || 1n));
  const betCost = weiToTokenAmount(betCostWEIValue);
  const { writeContractAsync } = useScaffoldWriteContract("Lottery");
  console.log(
    "ManageBets -> tokens",
    balance,
    "inWEI",
    tokenAmountWEIValue,
    "betCost",
    betCost,
    "inWEI",
    betCostWEIValue,
    "ownerPool",
    ownerPool,
    "prizePool",
    prizePool,
  );

  const placeBet = async () => {
    if (betTimes <= 0) return;

    setLoading(true);
    console.log(`ManageBets -> placeBet -> betTimes`, betTimes);

    try {
      // Approve the spend
      // @ts-expect-error ignore
      const deployedContract = deployedContracts[chainId]?.Lottery;
      const receipt = (await tokenWrite("approve", [
        deployedContract.address,
        tokenAmountWEIValue,
      ])) as unknown as TransactionReceipt;
      console.log(`ManageBets -> placeBet -> approved ${tokenAmountWEIValue} tokens (WEI) -> receipt`, receipt);
      // Place the bets
      const tx = await writeContractAsync({
        functionName: "betMany",
        args: [BigInt(betTimes)],
      });
      console.log(`ManageBets -> placeBet -> placed ${betTimes} bets, tx`, tx);
    } catch (error) {
      console.error("ManageBets -> placeBet -> error", error);
    } finally {
      setLoading(false);
      setBetTimes(0);
    }
  };

  if (!mounted || !isConnected || !chainId) return null;

  return (
    <div className="flex flex-col items-center p-4 md:min-w-[40rem] w-full">
      <h2 className="text-xl font-bold">Manage Bets</h2>

      <div className="flex flex-wrap justify-center w-full">
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
          asETH: false,
        })}
        {renderLabelAndValue<string>({
          label: "Owner Pool",
          value: formatNumber(weiToTokenAmount(ownerPool)),
          asETH: false,
        })}
        {renderLabelAndValue<string>({
          label: "Prize Pool",
          value: formatNumber(weiToTokenAmount(prizePool)),
          asETH: false,
        })}
      </div>

      {/* Place bets */}
      <div className="flex flex-wrap justify-center mt-5">
        <div className="join">
          <label className="form-control w-full max-w-xs">
            <input
              className="input input-accent bg-base-200 join-item"
              placeholder="Bets"
              type="number"
              value={betTimes}
              onChange={e => setBetTimes(Number(e.target.value))}
            />
            <div className="label">
              <span className="label-text-alt">Will consume</span>
              <span className="label-text-alt">{String(betCost || 1)} tokens</span>
            </div>
          </label>

          <div
            className="tooltip tooltip-info"
            data-tip="Placing a bet will consume tokens equal the 'Bet Price' + 'Bet Fee', multiplied by the number of bets"
          >
            <button disabled={loading} className="btn btn-accent join-item" onClick={placeBet}>
              {loading ? <span className="loading loading-spinner"></span> : "Bet"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
