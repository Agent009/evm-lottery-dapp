import { useEffect, useState } from "react";
import Lottery from "@contracts/Lottery.json";
import deployedContracts from "@contracts/deployedContracts";
import { useScaffoldReadContract } from "@hooks/scaffold-eth";
import { notification } from "@utils/scaffold-eth";
import { Hex, parseEther } from "viem";
import { useAccount, useDeployContract } from "wagmi";

export const DeployLottery = () => {
  const { address, isConnected, chainId } = useAccount();
  const { deployContract, data, error: deploymentError, isSuccess } = useDeployContract();
  const [mounted, setMounted] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [purchaseRatio, setPurchaseRatio] = useState(1); // Default: 10^18 tokens / ETH
  const [betPrice, setBetPrice] = useState(1 / 1000); // Default: 10^15 tokens
  const [betFee, setBetFee] = useState((1 / 1000) * 0.05); // Default: 5% of bet price, 5^13 tokens
  const [loading, setLoading] = useState(false);
  console.log(
    "DeployLottery -> init -> isConnected",
    isConnected,
    "chainId",
    chainId,
    "mounted",
    mounted,
    "loading",
    loading,
  );

  useEffect(() => {
    if (isConnected) {
      setMounted(true);
    }
  }, [isConnected]);

  // @ts-expect-error ignore
  const deployedContract = deployedContracts[chainId]?.Lottery;
  const { data: tokenAddress } = useScaffoldReadContract({
    contractName: "Lottery",
    functionName: "paymentToken",
    args: [],
  });
  console.log("DeployLottery -> deployedContract", deployedContract?.address, "tokenAddress", tokenAddress);

  const deployLottery = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("DeployLottery -> deployLottery -> params", tokenName, tokenSymbol, purchaseRatio, betPrice, betFee);

    if (!window.ethereum || address === null) {
      notification.error("Please connect to a wallet to deploy the lottery contract.");
      return;
    }

    if (tokenName.trim() === "" || tokenSymbol.trim() === "" || purchaseRatio <= 0 || betPrice <= 0 || betFee <= 0) {
      notification.error("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);

      const lotteryContract = deployContract({
        abi: Lottery.abi,
        args: [
          tokenName,
          tokenSymbol,
          parseEther(String(purchaseRatio)),
          parseEther(String(betPrice)),
          parseEther(String(betFee)),
        ],
        bytecode: Lottery.bytecode as Hex,
      });
      console.log(
        "DeployLottery -> deployLottery -> lotteryContract:",
        lotteryContract,
        "isSuccess:",
        isSuccess,
        "error",
        deploymentError,
        "data",
        data,
      );
      notification.success(
        "Lottery contract deployed successfully. You should update the contract addresses in the `deployedContracts` object.",
      );
    } catch (error) {
      console.error("Error deploying contract:", error);
      notification.error("Deployment failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !isConnected || !chainId) return null;

  if (deployedContract) {
    return (
      <>
        <h2 className="text-xl font-bold text-center">Deployed Contract Details</h2>

        <label className="form-control w-full">
          <div className="label">
            <span className="label-text">Lottery contract</span>
            <span className="label-text-alt">Address</span>
          </div>
          <code className="flex-1 block whitespace-pre overflow-none text-left bg-base-100 p-2 rounded-md">
            {deployedContract.address}
          </code>
        </label>

        <label className="form-control w-full">
          <div className="label">
            <span className="label-text">Token contract</span>
            <span className="label-text-alt">Address</span>
          </div>
          <code className="flex-1 block whitespace-pre overflow-none text-left bg-base-100 p-2 rounded-md">
            {tokenAddress}
          </code>
        </label>
      </>
    );
  }

  return (
    <div className="flex flex-col items-center p-4">
      <form onSubmit={deployLottery} className="w-full max-w-md space-y-4">
        <label className="input input-bordered flex items-center gap-2">
          Name
          <input
            type="text"
            placeholder="Token Name"
            value={tokenName}
            onChange={e => setTokenName(e.target.value)}
            required
            className="grow"
          />
        </label>
        <label className="input input-bordered flex items-center gap-2">
          Symbol
          <input
            type="text"
            placeholder="Token Symbol"
            value={tokenSymbol}
            onChange={e => setTokenSymbol(e.target.value)}
            required
            className="grow"
          />
        </label>

        <label className="form-control w-full max-w-xs">
          <div className="label">
            <span className="label-text">Purchase Ratio</span>
            <span className="label-text-alt">ETH Value</span>
          </div>
          <input
            type="number"
            placeholder="Purchase Ratio"
            value={purchaseRatio}
            onChange={e => setPurchaseRatio(Number(e.target.value))}
            required
            className="input input-bordered w-full max-w-xs"
          />
        </label>

        <label className="form-control w-full max-w-xs">
          <div className="label">
            <span className="label-text">Best Price</span>
            <span className="label-text-alt">ETH Value</span>
          </div>
          <input
            type="number"
            placeholder="Bet Price"
            value={betPrice}
            onChange={e => setBetPrice(Number(e.target.value))}
            required
            className="input input-bordered w-full max-w-xs"
          />
        </label>

        <label className="form-control w-full max-w-xs">
          <div className="label">
            <span className="label-text">Best Fee</span>
            <span className="label-text-alt">ETH Value</span>
          </div>
          <input
            type="number"
            placeholder="Bet Fee"
            value={betFee}
            onChange={e => setBetFee(Number(e.target.value))}
            required
            className="input input-bordered w-full max-w-xs"
          />
        </label>

        <button type="submit" disabled={loading} className="btn w-full">
          {loading ? <span className="loading loading-spinner"></span> : "Deploy Lottery Contract"}
        </button>
      </form>
    </div>
  );
};
