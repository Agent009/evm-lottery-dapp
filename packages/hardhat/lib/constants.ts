import * as dotenv from "dotenv";
import { parseEther } from "ethers";
dotenv.config();

const alchemyAPIKey = process.env.ALCHEMY_API_KEY || "";
export const constants = Object.freeze({
  account: {
    deployerPrivateKey: process.env.DEPLOYER_PRIVATE_KEY || "",
  },
  contracts: {
    lotteryToken: {
      sepolia: process.env.LOTTERY_TOKEN_SEPOLIA || "",
    },
    lottery: {
      sepolia: process.env.LOTTERY_SEPOLIA || "",
      TOKEN_VALUE: parseEther(String(1 / 1_000)), // Default: 1 token equals 10^15 WEI
      TOKEN_RATIO: 1n, // Default: Get 1 token per WEI / 10^18 tokens per ETH
      BET_PRICE: parseEther(String(1 / 1_000)), // Default: Costs 10^15 tokens
      BET_FEE: parseEther(String(1 / 1_000 / 5)), // Default: Costs 2 * 10^14 tokens
    },
  },
  integrations: {
    alchemy: {
      apiKey: alchemyAPIKey,
      sepolia: `https://eth-sepolia.g.alchemy.com/v2/${alchemyAPIKey}`,
    },
    etherscan: {
      apiKey: process.env.ETHERSCAN_API_KEY || "",
    },
  },
});
