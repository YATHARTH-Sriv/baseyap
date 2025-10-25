import { BaseError, isAddress } from "viem";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as `0x${string}`;
export const ZERO_BIGINT = BigInt(0);

export function getContractAddress(): `0x${string}` | null {
  const envValue =
    (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ??
      process.env.NEXT_PUBLIC_YAPHOUSE_ADDRESS ??
      process.env.CONTRACT_ADDRESS ??
      "") as string;

  if (!envValue || !isAddress(envValue)) {
    return null;
  }
  return envValue as `0x${string}`;
}

export function getExplorerTxUrl(hash: `0x${string}`) {
  return `https://sepolia.basescan.org/tx/${hash}`;
}

export function formatTimestamp(seconds: bigint | null | undefined) {
  if (!seconds || seconds === ZERO_BIGINT) {
    return "-";
  }
  const millis = Number(seconds) * 1000;
  if (!Number.isFinite(millis)) {
    return seconds.toString();
  }
  return new Date(millis).toLocaleString();
}

export function safeParseUint(value: string, label: string): bigint {
  if (!value.trim()) {
    throw new Error(`${label} is required.`);
  }
  if (!/^\d+$/.test(value.trim())) {
    throw new Error(`${label} must be a number.`);
  }
  return BigInt(value.trim());
}

export function parseDateTimeToSeconds(value: string, label: string): bigint {
  if (!value) {
    throw new Error(`${label} is required.`);
  }
  const asDate = new Date(value);
  if (Number.isNaN(asDate.getTime())) {
    throw new Error(`${label} is invalid.`);
  }
  return BigInt(Math.floor(asDate.getTime() / 1000));
}

export function getReadableError(error: unknown) {
  if (error instanceof BaseError) {
    return error.shortMessage ?? "Transaction failed.";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong. Check the console for more details.";
}
