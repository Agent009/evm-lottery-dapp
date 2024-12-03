import { constants } from "./constants";

export { formatUrl, getApiUrl, getUrl } from "./api";
export { constants } from "./constants";

/**
 * Convert displayed token amount to stored amount in WEI.
 * @param amount
 * @param tokenRatio
 * @param tokenValue
 */
export const tokenAmountInWEI = (
  amount: string | number | bigint,
  tokenRatio: bigint = constants.contracts.lottery.TOKEN_RATIO,
  tokenValue: bigint = constants.contracts.lottery.TOKEN_VALUE,
) => {
  return (BigInt(amount || 1n) * tokenValue) / tokenRatio;
};

/**
 * Convert stored amount in WEI to displayed token amount.
 * @param amount
 * @param tokenRatio
 * @param tokenValue
 */
export const weiToTokenAmount = (
  amount: bigint,
  tokenRatio: bigint = constants.contracts.lottery.TOKEN_RATIO,
  tokenValue: bigint = constants.contracts.lottery.TOKEN_VALUE,
) => {
  return (BigInt(amount || 1n) * tokenRatio) / tokenValue;
};

/**
 * Convert stored amount in WEI to displayed token amount.
 * @param amount
 * @param tokenRatio
 * @param tokenValue
 */
export const weiToFractionalTokenAmount = (
  amount: bigint,
  tokenRatio: bigint = constants.contracts.lottery.TOKEN_RATIO,
  tokenValue: bigint = constants.contracts.lottery.TOKEN_VALUE,
) => {
  return (Number(amount || 1) * Number(tokenRatio)) / Number(tokenValue);
};

/**
 * Use underscore as thousands separator. 1000 -> 1_000, 1000000 -> 1_000_000
 * @param amount
 */
export const formatNumber = (amount: string | number | bigint) => {
  return String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, "_");
};
