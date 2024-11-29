// App
const name = "EVM Lottery DApp";
const caption = "Let's ETH!";
// Environment
const environment = process.env.NODE_ENV || "development";
const prodEnv = ["production", "prod"].includes(environment);
const devEnv = !prodEnv || environment === "development";
const localEnv = !prodEnv && !devEnv;
const devOrLocalEnv = devEnv || localEnv;
// Core Web App (CWA)
const cwaServerHost = process.env.CWA_SERVER_HOST || "http://localhost";
const cwaServerPort = process.env.CWA_SERVER_PORT || 3000;
const cwaServerUrl = process.env.NEXT_PUBLIC_CWA_SERVER_URL || `${cwaServerHost}:${cwaServerPort}`;

export const constants = Object.freeze({
  // Environment
  env: {
    dev: devEnv,
    local: localEnv,
    devOrLocal: devOrLocalEnv,
    prod: prodEnv,
  },
  // CWA
  cwa: {
    host: cwaServerHost,
    port: cwaServerPort,
    url: cwaServerUrl,
  },
  app: {
    id: "evm-se2",
    name: name,
    caption: caption,
    productionUrl: "https://connextar.com",
    repoUrl: "https://github.com/Agent009/evm-lottery-dapp",
  },
  routes: {
    home: "/",
    debug: "debug",
    test: "test",
    api: {
      base: cwaServerUrl + (cwaServerUrl?.charAt(cwaServerUrl?.length - 1) !== "/" ? "/" : "") + "api/",
    },
  },
  // Smart contracts
  account: {
    deployerMemonic: process.env.MNEMONIC || "",
    deployerAddress: process.env.DEPLOYER_ADDRESS || "",
    deployerPrivateKey: process.env.PRIVATE_KEY || "",
  },
  contracts: {
    lotteryToken: {
      sepolia: process.env.LOTTERY_TOKEN_SEPOLIA || "",
    },
    token: {
      sepolia: process.env.LOTTERY_SEPOLIA || "",
    },
  },
  integrations: {
    alchemy: {
      apiKey: process.env.ALCHEMY_API_KEY || "",
      sepolia: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY || ""}`,
    },
    etherscan: {
      apiKey: process.env.ETHERSCAN_API_KEY || "",
    },
    infura: {
      apiKey: process.env.INFURA_API_KEY || "",
      apiSecret: process.env.INFURA_API_SECRET || "",
    },
    pokt: {
      apiKey: process.env.POKT_API_KEY || "",
    },
  },
  // Misc
  ymdDateFormat: "y-MM-dd",
});
