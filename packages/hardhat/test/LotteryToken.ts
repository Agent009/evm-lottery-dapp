import { expect } from "chai";
import { ethers } from "hardhat";
import { parseEther as ethersParseEther, formatEther as ethersFormatEther } from "ethers";
import { parseEther as viemParseEther, formatEther as viemFormatEther } from "viem";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { LotteryToken } from "@typechain-types";

const CONTRACT_NAME = "LotteryToken";

function formatSmallNumber(numerator: number, denominator: number, decimals = 18) {
  const result = numerator / denominator;
  return result.toFixed(decimals);
}

describe("formatEther", function () {
  const expectedVal = formatSmallNumber(77814, 1000000000000000000);
  console.log("formatEther (77814) -> expected", expectedVal);
  describe("ethers formatEther", function () {
    it("Should format bigint value correctly", async function () {
      expect(ethersFormatEther(77814n)).to.equal(expectedVal);
    });
    // it("Should format numeric value correctly", async function () {
    //   expect(ethersFormatEther(BigInt(77814))).to.equal(expectedVal);
    // });
    // it("Should format string value correctly", async function () {
    //   expect(ethersFormatEther(Number("77814"))).to.equal(expectedVal);
    // });
  });
  describe("viem formatEther", function () {
    it("Should format bigint value correctly", async function () {
      expect(viemFormatEther(77814n)).to.equal(expectedVal);
    });
    // it("Should format numeric value correctly", async function () {
    //   expect(viemFormatEther(BigInt(77814))).to.equal(expectedVal);
    // });
    // it("Should format string value correctly", async function () {
    //   expect(viemFormatEther(BigInt(Number("77814")))).to.equal(expectedVal);
    // });
  });
});

describe("parseEther", function () {
  const expectedVal = BigInt(5 * 10 ** 18);
  console.log("parseEther (5) -> expected", expectedVal);
  describe("ethers parseEther", function () {
    it("Should parse bigint value correctly", async function () {
      expect(ethersParseEther(5n.toString())).to.equal(expectedVal);
    });
    // it("Should parse numeric value correctly", async function () {
    //   expect(ethersParseEther(Number(5).toString())).to.equal(expectedVal);
    // });
    // it("Should parse string value correctly", async function () {
    //   expect(ethersParseEther("5")).to.equal(expectedVal);
    // });
    it("Should parse division result value correctly", async function () {
      expect(ethersParseEther("1000") / 1n).to.equal(1000000000000000000000n);
    });
  });
  describe("viem parseEther", function () {
    it("Should parse bigint value correctly", async function () {
      expect(viemParseEther(5n.toString())).to.equal(expectedVal);
    });
    // it("Should parse numeric value correctly", async function () {
    //   expect(viemParseEther(Number(5).toString())).to.equal(expectedVal);
    // });
    // it("Should parse string value correctly", async function () {
    //   expect(viemParseEther("5")).to.equal(expectedVal);
    // });
  });
});

describe(CONTRACT_NAME, function () {
  // We define a fixture to reuse the same setup in every test.
  let contract: LotteryToken;
  let deployer: HardhatEthersSigner;
  before(async () => {
    const [owner] = await ethers.getSigners();
    deployer = owner!;
    const contractFactory = await ethers.getContractFactory(CONTRACT_NAME, owner!);
    contract = (await contractFactory.deploy("Lottery Token", "LTK")) as LotteryToken;
    await contract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should have the correct name", async function () {
      expect(await contract.name()).to.equal("Lottery Token");
    });
    it("Should have the correct symbol", async function () {
      expect(await contract.symbol()).to.equal("LTK");
    });
    it("Deployer should have the minter role", async function () {
      const minterRole = await contract.MINTER_ROLE();
      expect(await contract.hasRole(minterRole, deployer)).to.be.true;
    });
  });
});
