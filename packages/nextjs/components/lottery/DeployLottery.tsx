import { useEffect, useState } from "react";
import { IntegerInput } from "@components/scaffold-eth";
import Lottery from "@contracts/Lottery.json";
import deployedContracts from "@contracts/deployedContracts";
import { useScaffoldReadContract } from "@hooks/scaffold-eth";
import { wagmiConfig } from "@services/web3/wagmiConfig";
import { constants } from "@utils/constants";
import { notification } from "@utils/scaffold-eth";
import { getPublicClient } from "@wagmi/core";
import { Hex } from "viem";
import { useAccount, useDeployContract } from "wagmi";

// const TOKEN_VALUE = constants.contracts.lottery.TOKEN_VALUE;
const TOKEN_RATIO = constants.contracts.lottery.TOKEN_RATIO;
const BET_PRICE = constants.contracts.lottery.BET_PRICE;
const BET_FEE = constants.contracts.lottery.BET_FEE;

export const DeployLottery = () => {
  const { address, isConnected, chainId } = useAccount();
  const { deployContract } = useDeployContract();
  const [mounted, setMounted] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [purchaseRatio, setPurchaseRatio] = useState<number>(Number(TOKEN_RATIO));
  const [betPrice, setBetPrice] = useState<number>(Number(BET_PRICE));
  const [betFee, setBetFee] = useState<number>(Number(BET_FEE));
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

      deployContract(
        {
          abi: Lottery.abi,
          args: [tokenName, tokenSymbol, BigInt(purchaseRatio), BigInt(betPrice), BigInt(betFee)],
          bytecode: Lottery.bytecode as Hex,
        },
        {
          onError: error => {
            console.error("DeployLottery -> deployLottery -> onError -> error", error);
            notification.error("Lottery deployment failed. Check console for details.");
          },
          onSuccess: tx => {
            console.log("DeployLottery -> deployLottery -> onSuccess -> tx", tx);
            // @ts-expect-error ignore
            const client = getPublicClient(wagmiConfig, { chainId: chainId });
            client.getTransactionReceipt({ hash: tx }).then(receipt => {
              const address = receipt.contractAddress || receipt.to;
              console.log("DeployLottery -> deployLottery -> onSuccess -> address", address, "receipt", receipt);
              notification.success(
                `Lottery contract deployed successfully at: ${address}` +
                  "\nYou should update the contract addresses in the `deployedContracts` object.",
              );
            });
          },
        },
      );
    } catch (error) {
      console.error("DeployLottery -> deployLottery -> error", error);
      notification.error("Lottery contract deployment failed. Check console for details.");
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
            <span className="label-text-alt">Tokens / WEI</span>
          </div>
          <input
            type="number"
            placeholder="Purchase Ratio"
            value={purchaseRatio}
            onChange={e => setPurchaseRatio(Number(e.target.value))}
            required
            className="input input-bordered w-full max-w-xs"
          />
          {/*<IntegerInput*/}
          {/*  value={String(purchaseRatio)}*/}
          {/*  onChange={val => {*/}
          {/*    setPurchaseRatio(Number(val));*/}
          {/*  }}*/}
          {/*  placeholder="Purchase Ratio"*/}
          {/*/>*/}
        </label>

        <label className="form-control w-full max-w-xs">
          <div className="label">
            <span className="label-text">Bet Price</span>
            <span className="label-text-alt">WEI Value</span>
          </div>
          {/*<input*/}
          {/*  type="number"*/}
          {/*  placeholder="Bet Price"*/}
          {/*  value={betPrice}*/}
          {/*  onChange={e => setBetPrice(Number(e.target.value))}*/}
          {/*  required*/}
          {/*  className="input input-bordered w-full max-w-xs"*/}
          {/*/>*/}
          <IntegerInput
            value={String(betPrice)}
            onChange={val => {
              setBetPrice(Number(val));
            }}
            placeholder="Bet Price"
          />
        </label>

        <label className="form-control w-full max-w-xs">
          <div className="label">
            <span className="label-text">Bet Fee</span>
            <span className="label-text-alt">WEI Value</span>
          </div>
          {/*<input*/}
          {/*  type="number"*/}
          {/*  placeholder="Bet Fee"*/}
          {/*  value={betFee}*/}
          {/*  onChange={e => setBetFee(Number(e.target.value))}*/}
          {/*  required*/}
          {/*  className="input input-bordered w-full max-w-xs"*/}
          {/*/>*/}
          <IntegerInput
            value={String(betFee)}
            onChange={val => {
              setBetFee(Number(val));
            }}
            placeholder="Bet Fee"
          />
        </label>

        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          {loading ? <span className="loading loading-spinner"></span> : "Deploy Lottery Contract"}
        </button>
      </form>
    </div>
  );
};
