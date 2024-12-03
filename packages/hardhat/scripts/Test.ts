import hre from "hardhat";
import { parseEther, formatEther } from "ethers";
import { Address } from "viem";
import * as readline from "readline";
import { LotteryToken } from "@typechain-types";
import { ContractTransactionReceipt } from "ethers";
import { gasPrices } from "./utils";
import { constants } from "../lib/constants";

const MAXUINT256 = 115792089237316195423570985008687907853269984665640564039457584007913129639935n;
let contractAddress: Address;
let tokenAddress: Address;
const TOKEN_VALUE = constants.contracts.lottery.TOKEN_VALUE;
const TOKEN_RATIO = constants.contracts.lottery.TOKEN_RATIO;
const BET_PRICE = constants.contracts.lottery.BET_PRICE;
const BET_FEE = constants.contracts.lottery.BET_FEE;

async function main() {
  await initContracts();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  mainMenu(rl);
}

async function getAccounts() {
  return await hre.ethers.getSigners();
}

async function getProvider() {
  return hre.ethers.provider;
}

async function initContracts() {
  const accounts = await getAccounts();
  const deployer = accounts[0]!;
  const lotteryFactory = await hre.ethers.getContractFactory("Lottery", deployer!);
  const lotteryContract = (await lotteryFactory.deploy(
    "LotteryToken",
    "LTO",
    TOKEN_RATIO,
    BET_PRICE,
    BET_FEE,
  )) as unknown as LotteryToken;
  // Wait for the deployment to complete
  await lotteryContract.waitForDeployment();
  contractAddress = (await lotteryContract.getAddress()) as Address;
  tokenAddress = await lotteryContract.paymentToken();
  const tokenContract = await hre.ethers.getContractAt("LotteryToken", tokenAddress);
  const MINTER_ROLE = await tokenContract.MINTER_ROLE();
  console.log(`Lottery contract deployed at ${contractAddress}, with token address ${tokenAddress}`);
  // const tokenRatio = await lotteryContract.purchaseRatio();
  // const betPrice = await lotteryContract.betPrice();
  // const betFee = await lotteryContract.betFee();
  // console.log("TOKEN_RATIO", TOKEN_RATIO, "BET_PRICE", BET_PRICE, "BET_FEE", BET_FEE);
  // console.log("tokenRatio", tokenRatio, "betPrice", betPrice, "betFee", betFee);
  const deployerAddress = deployer.address;
  console.log(`Deployer: ${deployerAddress}`);
  const deployerHasMinterRole = await tokenContract.hasRole(MINTER_ROLE as Address, deployerAddress);
  console.log("Deployer has minter role?", deployerHasMinterRole);

  const contractHasMinterRole = await tokenContract.hasRole(MINTER_ROLE as Address, contractAddress);
  console.log("Lottery contract has minter role?", contractHasMinterRole);
}

async function mainMenu(rl: readline.Interface) {
  menuOptions(rl);
}

function menuOptions(rl: readline.Interface) {
  rl.question(
    "Select operation: \n Options: \n [0]: Exit \n [1]: Check state \n [2]: Open bets \n [3]: Top up account tokens \n [4]: Bet with account \n [5]: Close bets \n [6]: Check player prize \n [7]: Withdraw \n [8]: Burn tokens \n",
    async (answer: string) => {
      console.log(`Selected: ${answer}\n`);
      const option = Number(answer);
      switch (option) {
        case 0:
          rl.close();
          return;
        case 1:
          await checkState();
          mainMenu(rl);
          break;
        case 2:
          rl.question("Input duration (in seconds)\n", async duration => {
            try {
              await openBets(duration);
            } catch (error) {
              console.log("error\n");
              console.log({ error });
            }
            mainMenu(rl);
          });
          break;
        case 3:
          rl.question("What account (index) to use?\n", async index => {
            const balance0 = await getAccountBalance(index);
            await displayTokenBalance(index);
            rl.question("Buy how many tokens?\n", async amount => {
              try {
                const txInfo = await buyTokens(index, amount);
                const balance1 = await getAccountBalance(index);
                const diff = parseEther(balance0) - parseEther(balance1) + txInfo.totalCost;
                console.log("Token cost", diff, "WEI", formatEther(diff), "ETH");
                await displayTokenBalance(index);
              } catch (error) {
                console.log("error\n");
                console.log({ error });
              }
              mainMenu(rl);
            });
          });
          break;
        case 4:
          rl.question("What account (index) to use?\n", async index => {
            await displayTokenBalance(index);
            rl.question("Bet how many times?\n", async amount => {
              try {
                const totalBetPrice = BET_PRICE * BigInt(amount);
                const totalBetFee = BET_FEE * BigInt(amount);
                const totalAmount = totalBetPrice + totalBetFee;
                console.log("Betting", amount, "times will cost", totalAmount, "tokens");
                await bet(index, amount);
                await displayTokenBalance(index);
              } catch (error) {
                console.log("error\n");
                console.log({ error });
              }
              mainMenu(rl);
            });
          });
          break;
        case 5:
          try {
            await closeLottery();
          } catch (error) {
            console.log("error\n");
            console.log({ error });
          }
          mainMenu(rl);
          break;
        case 6:
          rl.question("What account (index) to use?\n", async index => {
            const prize = await displayPrize(index);
            if (Number(prize) > 0) {
              rl.question("Do you want to claim your prize? [Y/N]\n", async answer => {
                if (answer.toLowerCase() === "y") {
                  try {
                    await claimPrize(index, prize);
                  } catch (error) {
                    console.log("error\n");
                    console.log({ error });
                  }
                }
                mainMenu(rl);
              });
            } else {
              mainMenu(rl);
            }
          });
          break;
        case 7:
          await displayTokenBalance("0");
          await displayOwnerPool();
          rl.question("Withdraw how many tokens?\n", async amount => {
            try {
              await withdrawTokens(amount);
            } catch (error) {
              console.log("error\n");
              console.log({ error });
            }
            mainMenu(rl);
          });
          break;
        case 8:
          rl.question("What account (index) to use?\n", async index => {
            await displayTokenBalance(index);
            rl.question("Burn how many tokens?\n", async amount => {
              try {
                await burnTokens(index, amount);
                await getAccountBalance(index);
                await displayTokenBalance(index);
              } catch (error) {
                console.log("error\n");
                console.log({ error });
              }
              mainMenu(rl);
            });
          });
          break;
        default:
          throw new Error("Invalid option");
      }
    },
  );
}

async function checkState() {
  const contract = await hre.ethers.getContractAt("Lottery", contractAddress);
  const state = await contract.betsOpen();
  console.log("Each token costs", TOKEN_VALUE);
  const amounts = [1, 10, 100, 1000];
  amounts.forEach(amount => {
    const tokenCost = (BigInt(amount) * TOKEN_VALUE) / TOKEN_RATIO;
    console.log("Buying", amount, "tokens will cost", tokenCost, "WEI", formatEther(tokenCost), "ETH");
  });

  const bettingCost = BET_PRICE + BET_FEE;
  console.log("Betting once will cost", bettingCost, "tokens", formatEther(bettingCost / TOKEN_VALUE), "ETH");

  console.log(`The lottery is ${state ? "open" : "closed"}\n`);
  if (!state) return;
  const provider = await getProvider();
  const currentBlock = await provider.getBlock("latest");
  const timestamp = Number(currentBlock?.timestamp) ?? 0;
  const currentBlockDate = new Date(timestamp * 1000);
  const closingTime = await contract.betsClosingTime();
  const closingTimeDate = new Date(Number(closingTime) * 1000);
  console.log(
    `The last block was mined at ${currentBlockDate.toLocaleDateString()} : ${currentBlockDate.toLocaleTimeString()}\n`,
  );
  console.log(
    `lottery should close at ${closingTimeDate.toLocaleDateString()} : ${closingTimeDate.toLocaleTimeString()}\n`,
  );
}

async function openBets(duration: string) {
  const contract = await hre.ethers.getContractAt("Lottery", contractAddress);
  const provider = await getProvider();
  const currentBlock = await provider.getBlock("latest");
  const timestamp = currentBlock?.timestamp ?? 0;
  const tx = await contract.openBets(BigInt(timestamp) + BigInt(duration));
  const receipt = await tx.wait();
  console.log(`Bets opened (${receipt?.hash})`);
  printTxInfo(receipt!);
}

async function getAccountBalance(index: string) {
  const provider = await getProvider();
  const accounts = await getAccounts();
  const account = accounts[Number(index)]!;
  const address = account.address!;
  const balanceBN = await provider.getBalance(address);
  const balance = formatEther(balanceBN);
  console.log(`${address} balance`, balance, "ETH");
  return balance;
}

async function buyTokens(index: string, amount: string) {
  const accounts = await getAccounts();
  const account = accounts[Number(index)]!;
  const contract = await hre.ethers.getContractAt("Lottery", contractAddress, account);
  const costInWEI = (BigInt(amount) * TOKEN_VALUE) / TOKEN_RATIO;
  const costInETH = formatEther(costInWEI);
  const tx = await contract.purchaseTokens({
    value: costInWEI,
  });
  const receipt = await tx.wait();
  console.log(`${amount} tokens bought for (WEI/ETH)`, costInWEI, "/", costInETH, "tx", receipt?.hash);
  return printTxInfo(receipt!);
}

async function displayTokenBalance(index: string) {
  const accounts = await getAccounts();
  const account = accounts[Number(index)]!;
  const token = await hre.ethers.getContractAt("LotteryToken", tokenAddress);
  const balanceBN = await token.balanceOf(account.address);
  const balance = balanceBN / TOKEN_VALUE;
  console.log(
    account.address,
    "has",
    balance,
    "LT0",
    " (raw value)",
    balanceBN,
    " (formatEther)",
    formatEther(balanceBN),
  );
}

async function bet(index: string, amount: string) {
  const accounts = await getAccounts();
  const account = accounts[Number(index)]!;
  const token = await hre.ethers.getContractAt("LotteryToken", tokenAddress, account);
  const contract = await hre.ethers.getContractAt("Lottery", contractAddress, account);
  const allowTx = await token.approve(contractAddress, MAXUINT256);
  const receiptAllow = await allowTx.wait();
  printTxInfo(receiptAllow!);
  const tx = await contract.betMany(BigInt(amount));
  const receipt = await tx.wait();
  console.log(`Bets placed (${receipt?.hash})\n`);
  printTxInfo(receipt!);
}

async function closeLottery() {
  const contract = await hre.ethers.getContractAt("Lottery", contractAddress);
  const tx = await contract.closeLottery();
  const receipt = await tx.wait();
  console.log(`Bets closed (${receipt?.hash})\n`);
  printTxInfo(receipt!);
}

async function displayPrize(index: string): Promise<string> {
  const accounts = await getAccounts();
  const account = accounts[Number(index)]!;
  const contract = await hre.ethers.getContractAt("Lottery", contractAddress);
  const prizeBN = await contract.prize(account.address);
  const prize = prizeBN / TOKEN_VALUE;
  console.log(account.address, "has earned a prize of", prize, "tokens");
  return "" + prize;
}

async function claimPrize(index: string, amount: string) {
  const accounts = await getAccounts();
  const account = accounts[Number(index)]!;
  const contract = await hre.ethers.getContractAt("Lottery", contractAddress, account);
  const tx = await contract.prizeWithdraw(BigInt(amount) * TOKEN_VALUE);
  const receipt = await tx.wait();
  console.log(`Prize claimed (${receipt?.hash})\n`);
  printTxInfo(receipt!);
}

async function displayOwnerPool() {
  const contract = await hre.ethers.getContractAt("Lottery", contractAddress);
  const balanceBN = await contract.ownerPool();
  const balance = balanceBN * TOKEN_VALUE;
  console.log(`The owner pool has (${balance}) Tokens \n`);
}

async function withdrawTokens(amount: string) {
  const contract = await hre.ethers.getContractAt("Lottery", contractAddress);
  const tx = await contract.ownerWithdraw(BigInt(amount) * TOKEN_VALUE);
  const receipt = await tx.wait();
  console.log(`Withdraw confirmed (${receipt?.hash})\n`);
  printTxInfo(receipt!);
}

async function burnTokens(index: string, amount: string) {
  const accounts = await getAccounts();
  const account = accounts[Number(index)]!;
  const token = await hre.ethers.getContractAt("LotteryToken", tokenAddress, account);
  const contract = await hre.ethers.getContractAt("Lottery", contractAddress, account);
  const allowTx = await token.approve(contractAddress, MAXUINT256);
  const receiptAllow = await allowTx.wait();
  console.log(`Allowance confirmed (${receiptAllow?.hash})\n`);
  printTxInfo(receiptAllow!);
  const tx = await contract.returnTokens(BigInt(amount) * TOKEN_VALUE);
  const receipt = await tx.wait();
  console.log(`Burn confirmed (${receipt?.hash})\n`);
  printTxInfo(receipt!);
}

const printTxInfo = (receipt: ContractTransactionReceipt) => {
  console.log(`hash ${receipt.hash} blockNumber ${receipt.blockNumber}`);
  return gasPrices(receipt);
};

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
