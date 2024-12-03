import { useEffect, useState } from "react";
import { renderLabelAndValue } from "@components/lottery/LabelAndValue";
import { useReadData } from "@hooks/lotteryToken";
import { useScaffoldReadContract, useScaffoldWriteContract } from "@hooks/scaffold-eth";
import { useAccount, useBlock } from "wagmi";
import { formatNumber, weiToFractionalTokenAmount, weiToTokenAmount } from "~~/utils";

export const LotteryInfo = () => {
  const { address, isConnected, chainId } = useAccount();
  const { data: blockData } = useBlock<false, "latest">();
  const [mounted, setMounted] = useState(false);
  const [balance, setBalance] = useState<bigint>(0n);
  const [lotteryDuration, setLotteryDuration] = useState<number>(3600);
  const [loading, setLoading] = useState(false);
  console.log(
    "LotteryInfo -> init -> isConnected",
    isConnected,
    "chainId",
    chainId,
    "mounted",
    mounted,
    // "blockData",
    // blockData,
  );
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
  const closingTimeDate = new Date(Number(betsClosingTime) * 1000);
  const { writeContractAsync } = useScaffoldWriteContract("Lottery");
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

  const openBets = async () => {
    if (lotteryDuration <= 0) return;

    setLoading(true);
    const timestamp = blockData?.timestamp ?? 0;
    const closingTime = BigInt(timestamp) + BigInt(lotteryDuration);
    console.log(
      `LotteryInfo -> openBets -> lotteryDuration`,
      lotteryDuration,
      "closingTime",
      closingTime,
      new Date(Number(closingTime * 1000n)),
    );

    try {
      const tx = await writeContractAsync({
        functionName: "openBets",
        args: [closingTime],
      });
      console.log("LotteryInfo -> openBets -> tx", tx);
    } catch (error) {
      console.error("LotteryInfo -> openBets -> error", error);
    } finally {
      setLoading(false);
      // @ts-expect-error-next-line
      document.getElementById("open_bets")?.close();
    }
  };

  const closeLottery = async () => {
    if (!betsOpen) return;

    setLoading(true);
    console.log(`LotteryInfo -> closeLottery`);

    try {
      const tx = await writeContractAsync({
        functionName: "closeLottery",
      });
      console.log("LotteryInfo -> closeLottery -> tx", tx);
    } catch (error) {
      console.error("LotteryInfo -> closeLottery -> error", error);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !isConnected || !chainId) return null;

  return (
    <div className="flex flex-col items-center p-4 md:min-w-[40rem] w-full">
      <h2 className="text-xl font-bold">Lottery Details</h2>

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
          label: "Owner Pool",
          label2: "Tokens",
          value: formatNumber(weiToTokenAmount(ownerPool)),
          asETH: false,
        })}
        {renderLabelAndValue<string>({
          label: "Prize Pool",
          label2: "Tokens",
          value: formatNumber(weiToTokenAmount(prizePool)),
          asETH: false,
        })}
        {renderLabelAndValue<string>({ label: "Token Balance", value: formatNumber(weiToTokenAmount(balance)) })}
        {renderLabelAndValue<boolean>({ label: "Bets Open", value: betsOpen })}
        {renderLabelAndValue<string>({
          label: "Bets Closing Time",
          value: betsOpen ? closingTimeDate.toLocaleDateString() + " : " + closingTimeDate.toLocaleTimeString() : "N/A",
        })}
      </div>

      <div className="flex flex-wrap justify-center">
        <div className="flex flex-wrap justify-center mt-5">
          {betsOpen ? (
            <>
              <button className="btn btn-accent" onClick={closeLottery}>
                Close Lottery
              </button>
            </>
          ) : (
            <>
              {/* @ts-expect-error ignore */}
              <button className="btn btn-accent" onClick={() => document.getElementById("open_bets").showModal()}>
                Open Bets
              </button>
            </>
          )}
        </div>
        <dialog id="open_bets" className="modal">
          <div className="modal-box justify-center">
            <h3 className="font-bold text-lg">Open Lottery</h3>
            <p className="py-4">Enter duration of the lottery, in seconds.</p>
            <div className="join flex flex-wrap justify-center">
              <label className="form-control w-full max-w-xs justify-center">
                <input
                  className="input input-accent bg-base-200 join-item"
                  placeholder="Duration"
                  type="number"
                  value={lotteryDuration}
                  onChange={e => setLotteryDuration(Number(e.target.value))}
                />
                <div className="label">
                  <span className="label-text-alt">Duration</span>
                  <span className="label-text-alt">Seconds</span>
                </div>
              </label>
              <button disabled={loading} className="btn btn-accent join-item" onClick={openBets}>
                {loading ? <span className="loading loading-spinner"></span> : "Open Bets"}
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button>close</button>
          </form>
        </dialog>
      </div>
    </div>
  );
};
