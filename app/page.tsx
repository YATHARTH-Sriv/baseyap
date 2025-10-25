"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Wallet } from "@coinbase/onchainkit/wallet";
import { baseSepolia } from "wagmi/chains";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { BaseError, formatUnits, isAddress, parseUnits } from "viem";
import yaphouse from "@/abi/YapHouse.json";
import yapToken from "@/abi/YapToken.json";
import styles from "./page.module.css";

type Profile = {
  wallet: string;
  email: string;
  name: string;
  createdRooms: bigint;
  joinedRooms: bigint;
  nextRoomId: bigint;
  lastActiveAt: bigint;
  token: `0x${string}` | null;
  exists: boolean;
};

type RoomDetails = {
  roomId: bigint;
  owner: string;
  title: string;
  description: string;
  category: string;
  createdAt: bigint;
  scheduledStart: bigint;
  scheduledEnd: bigint;
  startedAt: bigint;
  endedAt: bigint;
  participantCount: bigint;
  rewardCount: bigint;
  active: boolean;
  exists: boolean;
};

type JoinDetails = {
  totalDuration: bigint;
  isActive: boolean;
  lastJoinedAt: bigint;
  hasJoined: boolean;
};

type TokenSnapshot = {
  address: `0x${string}`;
  name: string;
  symbol: string;
  totalSupply: bigint;
  userBalance: bigint;
};

const YAPHOUSE_ABI = yaphouse.abi;
const YAPTOKEN_ABI = yapToken.abi;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as `0x${string}`;
const ZERO_BIGINT = BigInt(0);

function getContractAddress(): `0x${string}` | null {
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

function getErrorMessage(error: unknown) {
  if (error instanceof BaseError) {
    return error.shortMessage ?? "Transaction failed.";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong. Check the console for more details.";
}

function explorerUrlForHash(hash: `0x${string}`) {
  return `https://sepolia.basescan.org/tx/${hash}`;
}

function formatTimestamp(seconds: bigint | null | undefined) {
  if (!seconds || seconds === ZERO_BIGINT) {
    return "-";
  }
  const millis = Number(seconds) * 1000;
  if (!Number.isFinite(millis)) {
    return seconds.toString();
  }
  return new Date(millis).toLocaleString();
}

function safeParseUint(value: string, label: string): bigint {
  if (!value.trim()) {
    throw new Error(`${label} is required.`);
  }
  if (!/^\d+$/.test(value.trim())) {
    throw new Error(`${label} must be a number.`);
  }
  return BigInt(value.trim());
}

function parseDateTimeToSeconds(value: string, label: string): bigint {
  if (!value) {
    throw new Error(`${label} is required.`);
  }
  const asDate = new Date(value);
  if (Number.isNaN(asDate.getTime())) {
    throw new Error(`${label} is invalid.`);
  }
  return BigInt(Math.floor(asDate.getTime() / 1000));
}

export default function Home() {
  const contractAddress = useMemo(getContractAddress, []);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId: baseSepolia.id });

  const [profile, setProfile] = useState<Profile | null>(null);
  const [tokenSnapshot, setTokenSnapshot] = useState<TokenSnapshot | null>(
    null,
  );
  const [pendingHash, setPendingHash] = useState<`0x${string}` | null>(null);
  const [recentHash, setRecentHash] = useState<`0x${string}` | null>(null);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"default" | "error" | "success">(
    "default",
  );

  const [registerEmail, setRegisterEmail] = useState("");
  const [registerName, setRegisterName] = useState("");

  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");

  const [roomTitle, setRoomTitle] = useState("");
  const [roomDescription, setRoomDescription] = useState("");
  const [roomCategory, setRoomCategory] = useState("");
  const [roomStart, setRoomStart] = useState("");
  const [roomEnd, setRoomEnd] = useState("");
  const [startRoomId, setStartRoomId] = useState("");

  const [joinCreator, setJoinCreator] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");

  const [endRoomId, setEndRoomId] = useState("");
  const [endWinners, setEndWinners] = useState("");
  const [endAmounts, setEndAmounts] = useState("");

  const [lookupCreator, setLookupCreator] = useState("");
  const [lookupProfile, setLookupProfile] = useState<Profile | null>(null);
  const [lookupToken, setLookupToken] = useState<TokenSnapshot | null>(null);

  const [viewRoomCreator, setViewRoomCreator] = useState("");
  const [viewRoomId, setViewRoomId] = useState("");
  const [roomDetails, setRoomDetails] = useState<RoomDetails | null>(null);
  const [roomParticipants, setRoomParticipants] = useState<string[]>([]);

  const [joinDetails, setJoinDetails] = useState<JoinDetails | null>(null);

  const onBaseSepolia = chainId === baseSepolia.id;

  const { writeContractAsync, isPending: isPromptingWallet } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: isReceiptError,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: pendingHash ?? undefined,
    chainId: baseSepolia.id,
    query: {
      enabled: Boolean(pendingHash),
    },
  });

  const resetStatus = useCallback(() => {
    setStatusTone("default");
    setStatusMessage(null);
    setCurrentAction(null);
  }, []);

  const postSuccessRefresh = useCallback(async () => {
    if (!publicClient || !contractAddress || !isConnected || !address || !onBaseSepolia) {
      return;
    }

    try {
      const rawProfile = (await publicClient.readContract({
        address: contractAddress,
        abi: YAPHOUSE_ABI,
        functionName: "getProfile",
        args: [address],
      })) as unknown as [
        string,
        string,
        string,
        bigint,
        bigint,
        bigint,
        bigint,
        `0x${string}`,
        boolean,
      ];

      const [wallet, email, name, createdRooms, joinedRooms, nextRoomId, lastActiveAt, token, exists] =
        rawProfile;

      const normalizedProfile: Profile = {
        wallet,
        email,
        name,
        createdRooms,
        joinedRooms,
        nextRoomId,
        lastActiveAt,
        token: token === ZERO_ADDRESS ? null : token,
        exists,
      };

      setProfile(normalizedProfile);

      if (normalizedProfile.token) {
        const [nameResult, symbolResult, totalResult, balanceResult] =
          (await Promise.all([
            publicClient.readContract({
              address: normalizedProfile.token,
              abi: YAPTOKEN_ABI,
              functionName: "name",
            }),
            publicClient.readContract({
              address: normalizedProfile.token,
              abi: YAPTOKEN_ABI,
              functionName: "symbol",
            }),
            publicClient.readContract({
              address: normalizedProfile.token,
              abi: YAPTOKEN_ABI,
              functionName: "totalSupply",
            }),
            publicClient.readContract({
              address: normalizedProfile.token,
              abi: YAPTOKEN_ABI,
              functionName: "balanceOf",
              args: [address],
            }),
          ])) as [string, string, bigint, bigint];

        setTokenSnapshot({
          address: normalizedProfile.token,
          name: nameResult,
          symbol: symbolResult,
          totalSupply: totalResult,
          userBalance: balanceResult,
        });
      } else {
        setTokenSnapshot(null);
      }
    } catch (error) {
      console.error("Failed to refresh profile", error);
      setProfile(null);
      setTokenSnapshot(null);
    }
  }, [address, contractAddress, isConnected, onBaseSepolia, publicClient]);

  useEffect(() => {
    if (!isConnected || !onBaseSepolia || !contractAddress) {
      setProfile(null);
      setTokenSnapshot(null);
      return;
    }
    postSuccessRefresh();
  }, [postSuccessRefresh, isConnected, onBaseSepolia, contractAddress]);

  useEffect(() => {
    if (!isConfirmed || !pendingHash) {
      return;
    }
    setStatusTone("success");
    setStatusMessage(
      `${currentAction ?? "Transaction"} confirmed on Base Sepolia.`,
    );
    setRecentHash(pendingHash);
    setPendingHash(null);
    setCurrentAction(null);
    postSuccessRefresh();
  }, [currentAction, isConfirmed, pendingHash, postSuccessRefresh]);

  useEffect(() => {
    if (!isReceiptError || !pendingHash) {
      return;
    }
    setStatusTone("error");
    setStatusMessage(
      receiptError
        ? getErrorMessage(receiptError)
        : `${currentAction ?? "Transaction"} reverted on Base Sepolia.`,
    );
    setPendingHash(null);
    setCurrentAction(null);
  }, [currentAction, isReceiptError, pendingHash, receiptError]);

  const submitTransaction = useCallback(
    async (
      functionName: (typeof YAPHOUSE_ABI)[number]["name"],
      args: readonly unknown[] = [],
      actionDescription?: string,
    ) => {
      if (!contractAddress) {
        setStatusTone("error");
        setStatusMessage("Contract address is not configured.");
        return;
      }
      if (!isConnected) {
        setStatusTone("error");
        setStatusMessage("Connect your wallet before interacting.");
        return;
      }
      if (!onBaseSepolia) {
        setStatusTone("error");
        setStatusMessage("Switch to Base Sepolia to continue.");
        return;
      }

      resetStatus();
      setCurrentAction(actionDescription ?? functionName);

      try {
        const hash = await writeContractAsync({
          address: contractAddress,
          abi: YAPHOUSE_ABI,
          functionName,
          args,
          chainId: baseSepolia.id,
        });
        setPendingHash(hash);
        setStatusTone("default");
        setStatusMessage("Waiting for Base Sepolia confirmation...");
      } catch (error) {
        setStatusTone("error");
        setStatusMessage(getErrorMessage(error));
        setCurrentAction(null);
      }
    },
    [contractAddress, isConnected, onBaseSepolia, resetStatus, writeContractAsync],
  );

  useEffect(() => {
    if (!statusMessage) {
      return;
    }
    const timer = window.setTimeout(() => {
      setStatusMessage(null);
      setStatusTone("default");
    }, 7000);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  useEffect(() => {
    if (!statusMessage && isPromptingWallet) {
      setStatusTone("default");
      setStatusMessage("Confirm the transaction in your wallet.");
    }
  }, [isPromptingWallet, statusMessage]);

  const handleRegister = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      await submitTransaction(
        "registerUser",
        [registerEmail.trim(), registerName.trim()],
        "Register user",
      );
    },
    [registerEmail, registerName, submitTransaction],
  );

  const handleCreateToken = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      await submitTransaction(
        "createCreatorToken",
        [tokenName.trim(), tokenSymbol.trim()],
        "Create creator token",
      );
    },
    [tokenName, tokenSymbol, submitTransaction],
  );

  const handleCreateRoom = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      try {
        const startSeconds = parseDateTimeToSeconds(
          roomStart,
          "Scheduled start",
        );
        const endSeconds = parseDateTimeToSeconds(roomEnd, "Scheduled end");
        if (endSeconds <= startSeconds) {
          throw new Error("End time must be later than start time.");
        }

        await submitTransaction(
          "createRoom",
          [
            roomTitle.trim(),
            roomDescription.trim(),
            roomCategory.trim(),
            startSeconds,
            endSeconds,
          ],
          "Create room",
        );
      } catch (error) {
        setStatusTone("error");
        setStatusMessage(getErrorMessage(error));
      }
    },
    [roomCategory, roomDescription, roomEnd, roomStart, roomTitle, submitTransaction],
  );

  const handleStartRoom = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      try {
        const roomIdValue = safeParseUint(startRoomId, "Room ID");
        await submitTransaction("startRoom", [roomIdValue], "Start room");
      } catch (error) {
        setStatusTone("error");
        setStatusMessage(getErrorMessage(error));
      }
    },
    [startRoomId, submitTransaction],
  );

  const handleJoinRoom = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      try {
        if (!isAddress(joinCreator.trim())) {
          throw new Error("Creator address is invalid.");
        }
        const roomIdValue = safeParseUint(joinRoomId, "Room ID");
        await submitTransaction(
          "joinRoom",
          [joinCreator.trim() as `0x${string}`, roomIdValue],
          "Join room",
        );
      } catch (error) {
        setStatusTone("error");
        setStatusMessage(getErrorMessage(error));
      }
    },
    [joinCreator, joinRoomId, submitTransaction],
  );

  const handleEndRoom = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      try {
        const roomIdValue = safeParseUint(endRoomId, "Room ID");

        const winnerAddresses = endWinners
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean);

        const rewardAmounts = endAmounts
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean);

        if (winnerAddresses.length !== rewardAmounts.length) {
          throw new Error("Winners and rewards must have the same length.");
        }

        const parsedWinners = winnerAddresses.map((item) => {
          if (!isAddress(item)) {
            throw new Error(`Invalid winner address: ${item}`);
          }
          return item as `0x${string}`;
        });

        const parsedRewards = rewardAmounts.map((item, index) => {
          if (!item) {
            throw new Error(`Reward missing for winner #${index + 1}`);
          }
          return parseUnits(item, 18);
        });

        await submitTransaction(
          "endRoom",
          [roomIdValue, parsedWinners, parsedRewards],
          "End room & distribute",
        );
      } catch (error) {
        setStatusTone("error");
        setStatusMessage(getErrorMessage(error));
      }
    },
    [endAmounts, endRoomId, endWinners, submitTransaction],
  );

  const handleLookupCreator = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!publicClient || !contractAddress) {
        return;
      }
      try {
        if (!isAddress(lookupCreator.trim())) {
          throw new Error("Enter a valid creator address.");
        }
        const creatorAddr = lookupCreator.trim() as `0x${string}`;

        const rawProfile = (await publicClient.readContract({
          address: contractAddress,
          abi: YAPHOUSE_ABI,
          functionName: "getProfile",
          args: [creatorAddr],
        })) as unknown as [
          string,
          string,
          string,
          bigint,
          bigint,
          bigint,
          bigint,
          `0x${string}`,
          boolean,
        ];

        const normalizedProfile: Profile = {
          wallet: rawProfile[0],
          email: rawProfile[1],
          name: rawProfile[2],
          createdRooms: rawProfile[3],
          joinedRooms: rawProfile[4],
          nextRoomId: rawProfile[5],
          lastActiveAt: rawProfile[6],
          token: rawProfile[7] === ZERO_ADDRESS ? null : rawProfile[7],
          exists: rawProfile[8],
        };

        setLookupProfile(normalizedProfile);

        if (
          normalizedProfile.token &&
          normalizedProfile.token !== ZERO_ADDRESS &&
          address
        ) {
          const [nameResult, symbolResult, totalResult, balanceResult] =
            (await Promise.all([
              publicClient.readContract({
                address: normalizedProfile.token,
                abi: YAPTOKEN_ABI,
                functionName: "name",
              }),
              publicClient.readContract({
                address: normalizedProfile.token,
                abi: YAPTOKEN_ABI,
                functionName: "symbol",
              }),
              publicClient.readContract({
                address: normalizedProfile.token,
                abi: YAPTOKEN_ABI,
                functionName: "totalSupply",
              }),
              publicClient.readContract({
                address: normalizedProfile.token,
                abi: YAPTOKEN_ABI,
                functionName: "balanceOf",
                args: [address],
              }),
            ])) as [string, string, bigint, bigint];

          setLookupToken({
            address: normalizedProfile.token,
            name: nameResult,
            symbol: symbolResult,
            totalSupply: totalResult,
            userBalance: balanceResult,
          });
        } else {
          setLookupToken(null);
        }
      } catch (error) {
        setStatusTone("error");
        setStatusMessage(getErrorMessage(error));
        setLookupProfile(null);
        setLookupToken(null);
      }
    },
    [address, contractAddress, lookupCreator, publicClient],
  );

  const handleViewRoom = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!publicClient || !contractAddress) {
        return;
      }
      try {
        if (!isAddress(viewRoomCreator.trim())) {
          throw new Error("Enter a valid creator address.");
        }
        const creatorAddr = viewRoomCreator.trim() as `0x${string}`;
        const roomIdValue = safeParseUint(viewRoomId, "Room ID");

        const room = (await publicClient.readContract({
          address: contractAddress,
          abi: YAPHOUSE_ABI,
          functionName: "getRoom",
          args: [creatorAddr, roomIdValue],
        })) as RoomDetails;

        const normalized: RoomDetails = {
          roomId: room.roomId,
          owner: room.owner,
          title: room.title,
          description: room.description,
          category: room.category,
          createdAt: room.createdAt,
          scheduledStart: room.scheduledStart,
          scheduledEnd: room.scheduledEnd,
          startedAt: room.startedAt,
          endedAt: room.endedAt,
          participantCount: room.participantCount,
          rewardCount: room.rewardCount,
          active: room.active,
          exists: room.exists,
        };

        setRoomDetails(normalized);

        const participants = (await publicClient.readContract({
          address: contractAddress,
          abi: YAPHOUSE_ABI,
          functionName: "getRoomParticipants",
          args: [creatorAddr, roomIdValue],
        })) as string[];
        setRoomParticipants(participants);

        if (address) {
          const join = (await publicClient.readContract({
            address: contractAddress,
            abi: YAPHOUSE_ABI,
            functionName: "getJoinDetails",
            args: [creatorAddr, roomIdValue, address],
          })) as unknown as [bigint, boolean, bigint, boolean];

          setJoinDetails({
            totalDuration: join[0],
            isActive: join[1],
            lastJoinedAt: join[2],
            hasJoined: join[3],
          });
        } else {
          setJoinDetails(null);
        }
      } catch (error) {
        setStatusTone("error");
        setStatusMessage(getErrorMessage(error));
        setRoomDetails(null);
        setJoinDetails(null);
        setRoomParticipants([]);
      }
    },
    [address, contractAddress, publicClient, viewRoomCreator, viewRoomId],
  );

  const disableActions =
    !isConnected || !onBaseSepolia || isPromptingWallet || isConfirming;

  return (
    <div className={styles.container}>
      <header className={styles.headerWrapper}>
        <Wallet />
      </header>
      <main className={styles.main}>
        <h1 className={styles.pageTitle}>YapHouse Control Center</h1>
        <p className={styles.pageSubtitle}>
          Interact with the YapHouse contract deployed on Base Sepolia. Focus on
          the flows first; polish the visuals later.
        </p>

        {!contractAddress ? (
          <div className={styles.noticeError}>
            Contract address env var is missing or invalid. Set
            `NEXT_PUBLIC_CONTRACT_ADDRESS` before continuing.
          </div>
        ) : null}

        <div className={styles.statusBar}>
          <span>
            Network: {onBaseSepolia ? "Base Sepolia" : "Unsupported network"}
          </span>
          <span>Contract: {contractAddress ?? "-"}</span>
          {currentAction ? <span>Action: {currentAction}</span> : null}
          {recentHash ? (
            <span>
              Last tx:{" "}
              <a
                href={explorerUrlForHash(recentHash)}
                target="_blank"
                rel="noreferrer"
                className={styles.txLink}
              >
                {recentHash}
              </a>
            </span>
          ) : null}
        </div>

        {statusMessage ? (
          <div
            className={`${styles.banner} ${
              statusTone === "error"
                ? styles.bannerError
                : statusTone === "success"
                ? styles.bannerSuccess
                : ""
            }`}
          >
            {statusMessage}
          </div>
        ) : null}

        <div className={styles.cardGrid}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Your Profile</h2>
            {profile && profile.exists ? (
              <dl className={styles.datalist}>
                <div>
                  <dt>Wallet</dt>
                  <dd>{profile.wallet}</dd>
                </div>
                <div>
                  <dt>Name</dt>
                  <dd>{profile.name || "-"}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{profile.email || "-"}</dd>
                </div>
                <div>
                  <dt>Rooms Created</dt>
                  <dd>{profile.createdRooms.toString()}</dd>
                </div>
                <div>
                  <dt>Rooms Joined</dt>
                  <dd>{profile.joinedRooms.toString()}</dd>
                </div>
                <div>
                  <dt>Next Room ID</dt>
                  <dd>{profile.nextRoomId.toString()}</dd>
                </div>
                <div>
                  <dt>Last Active</dt>
                  <dd>{formatTimestamp(profile.lastActiveAt)}</dd>
                </div>
                <div>
                  <dt>Creator Token</dt>
                  <dd>{profile.token ?? "(not created)"}</dd>
                </div>
              </dl>
            ) : (
              <p className={styles.placeholder}>
                No profile found. Register to get started.
              </p>
            )}
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Token Overview</h2>
            {tokenSnapshot ? (
              <dl className={styles.datalist}>
                <div>
                  <dt>Address</dt>
                  <dd>{tokenSnapshot.address}</dd>
                </div>
                <div>
                  <dt>Ticker</dt>
                  <dd>
                    {tokenSnapshot.name} ({tokenSnapshot.symbol})
                  </dd>
                </div>
                <div>
                  <dt>Total Supply</dt>
                  <dd>{formatUnits(tokenSnapshot.totalSupply, 18)}</dd>
                </div>
                <div>
                  <dt>Your Balance</dt>
                  <dd>{formatUnits(tokenSnapshot.userBalance, 18)}</dd>
                </div>
              </dl>
            ) : (
              <p className={styles.placeholder}>
                Creator token details appear here once you deploy one.
              </p>
            )}
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Register</h2>
            <form className={styles.form} onSubmit={handleRegister}>
              <label className={styles.label}>
                Email
                <input
                  type="email"
                  className={styles.input}
                  value={registerEmail}
                  onChange={(event) => setRegisterEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </label>
              <label className={styles.label}>
                Display name
                <input
                  type="text"
                  className={styles.input}
                  value={registerName}
                  onChange={(event) => setRegisterName(event.target.value)}
                  placeholder="Your name"
                  required
                />
              </label>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={disableActions}
              >
                Register user
              </button>
            </form>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Creator Token</h2>
            <form className={styles.form} onSubmit={handleCreateToken}>
              <label className={styles.label}>
                Token name
                <input
                  type="text"
                  className={styles.input}
                  value={tokenName}
                  onChange={(event) => setTokenName(event.target.value)}
                  placeholder="Yap Token"
                  required
                />
              </label>
              <label className={styles.label}>
                Symbol
                <input
                  type="text"
                  className={styles.input}
                  value={tokenSymbol}
                  onChange={(event) => setTokenSymbol(event.target.value)}
                  placeholder="YAP"
                  required
                />
              </label>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={disableActions}
              >
                Deploy creator token
              </button>
            </form>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Create Room</h2>
            <form className={styles.form} onSubmit={handleCreateRoom}>
              <label className={styles.label}>
                Title
                <input
                  type="text"
                  className={styles.input}
                  value={roomTitle}
                  onChange={(event) => setRoomTitle(event.target.value)}
                  placeholder="Weekly Yap"
                  required
                />
              </label>
              <label className={styles.label}>
                Description
                <textarea
                  className={styles.textarea}
                  value={roomDescription}
                  onChange={(event) => setRoomDescription(event.target.value)}
                  placeholder="Short description"
                  required
                />
              </label>
              <label className={styles.label}>
                Category
                <input
                  type="text"
                  className={styles.input}
                  value={roomCategory}
                  onChange={(event) => setRoomCategory(event.target.value)}
                  placeholder="Music"
                  required
                />
              </label>
              <label className={styles.label}>
                Scheduled start
                <input
                  type="datetime-local"
                  className={styles.input}
                  value={roomStart}
                  onChange={(event) => setRoomStart(event.target.value)}
                  required
                />
              </label>
              <label className={styles.label}>
                Scheduled end
                <input
                  type="datetime-local"
                  className={styles.input}
                  value={roomEnd}
                  onChange={(event) => setRoomEnd(event.target.value)}
                  required
                />
              </label>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={disableActions}
              >
                Create room
              </button>
            </form>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Start Room</h2>
            <form className={styles.form} onSubmit={handleStartRoom}>
              <label className={styles.label}>
                Room ID
                <input
                  type="number"
                  min="0"
                  className={styles.input}
                  value={startRoomId}
                  onChange={(event) => setStartRoomId(event.target.value)}
                  placeholder="0"
                  required
                />
              </label>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={disableActions}
              >
                Start room
              </button>
            </form>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Join Room</h2>
            <form className={styles.form} onSubmit={handleJoinRoom}>
              <label className={styles.label}>
                Creator address
                <input
                  type="text"
                  className={styles.input}
                  value={joinCreator}
                  onChange={(event) => setJoinCreator(event.target.value)}
                  placeholder="0x..."
                  required
                />
              </label>
              <label className={styles.label}>
                Room ID
                <input
                  type="number"
                  min="0"
                  className={styles.input}
                  value={joinRoomId}
                  onChange={(event) => setJoinRoomId(event.target.value)}
                  placeholder="0"
                  required
                />
              </label>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={disableActions}
              >
                Join room
              </button>
            </form>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>End & Reward</h2>
            <form className={styles.form} onSubmit={handleEndRoom}>
              <label className={styles.label}>
                Room ID
                <input
                  type="number"
                  min="0"
                  className={styles.input}
                  value={endRoomId}
                  onChange={(event) => setEndRoomId(event.target.value)}
                  placeholder="0"
                  required
                />
              </label>
              <label className={styles.label}>
                Winner addresses (comma separated)
                <textarea
                  className={styles.textarea}
                  value={endWinners}
                  onChange={(event) => setEndWinners(event.target.value)}
                  placeholder="0xabc...,0xdef..."
                />
              </label>
              <label className={styles.label}>
                Reward amounts (18 decimals, comma separated)
                <textarea
                  className={styles.textarea}
                  value={endAmounts}
                  onChange={(event) => setEndAmounts(event.target.value)}
                  placeholder="10,5"
                />
              </label>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={disableActions}
              >
                End room & distribute tokens
              </button>
            </form>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Creator Lookup</h2>
            <form className={styles.form} onSubmit={handleLookupCreator}>
              <label className={styles.label}>
                Creator address
                <input
                  type="text"
                  className={styles.input}
                  value={lookupCreator}
                  onChange={(event) => setLookupCreator(event.target.value)}
                  placeholder="0x..."
                  required
                />
              </label>
              <button type="submit" className={styles.primaryButton}>
                Load creator
              </button>
            </form>
            {lookupProfile && lookupProfile.exists ? (
              <div className={styles.lookupSection}>
                <h3>Profile</h3>
                <dl className={styles.datalist}>
                  <div>
                    <dt>Name</dt>
                    <dd>{lookupProfile.name || "-"}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{lookupProfile.email || "-"}</dd>
                  </div>
                  <div>
                    <dt>Rooms Created</dt>
                    <dd>{lookupProfile.createdRooms.toString()}</dd>
                  </div>
                  <div>
                    <dt>Rooms Joined</dt>
                    <dd>{lookupProfile.joinedRooms.toString()}</dd>
                  </div>
                  <div>
                    <dt>Token</dt>
                    <dd>{lookupProfile.token ?? "(none)"}</dd>
                  </div>
                </dl>
              </div>
            ) : null}
            {lookupToken ? (
              <div className={styles.lookupSection}>
                <h3>Token Snapshot</h3>
                <dl className={styles.datalist}>
                  <div>
                    <dt>Name</dt>
                    <dd>
                      {lookupToken.name} ({lookupToken.symbol})
                    </dd>
                  </div>
                  <div>
                    <dt>Total Supply</dt>
                    <dd>{formatUnits(lookupToken.totalSupply, 18)}</dd>
                  </div>
                  <div>
                    <dt>Your Balance</dt>
                    <dd>{formatUnits(lookupToken.userBalance, 18)}</dd>
                  </div>
                </dl>
              </div>
            ) : null}
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Room Explorer</h2>
            <form className={styles.form} onSubmit={handleViewRoom}>
              <label className={styles.label}>
                Creator address
                <input
                  type="text"
                  className={styles.input}
                  value={viewRoomCreator}
                  onChange={(event) =>
                    setViewRoomCreator(event.target.value)
                  }
                  placeholder="0x..."
                  required
                />
              </label>
              <label className={styles.label}>
                Room ID
                <input
                  type="number"
                  min="0"
                  className={styles.input}
                  value={viewRoomId}
                  onChange={(event) => setViewRoomId(event.target.value)}
                  placeholder="0"
                  required
                />
              </label>
              <button type="submit" className={styles.primaryButton}>
                Load room
              </button>
            </form>
            {roomDetails ? (
              <div className={styles.lookupSection}>
                <h3>Room Details</h3>
                <dl className={styles.datalist}>
                  <div>
                    <dt>Title</dt>
                    <dd>{roomDetails.title}</dd>
                  </div>
                  <div>
                    <dt>Description</dt>
                    <dd>{roomDetails.description}</dd>
                  </div>
                  <div>
                    <dt>Category</dt>
                    <dd>{roomDetails.category}</dd>
                  </div>
                  <div>
                    <dt>Created</dt>
                    <dd>{formatTimestamp(roomDetails.createdAt)}</dd>
                  </div>
                  <div>
                    <dt>Scheduled</dt>
                    <dd>
                      {formatTimestamp(roomDetails.scheduledStart)} →
                      {" "}
                      {formatTimestamp(roomDetails.scheduledEnd)}
                    </dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>
                      {roomDetails.active
                        ? "Active"
                        : roomDetails.endedAt > ZERO_BIGINT
                        ? "Ended"
                        : "Scheduled"}
                    </dd>
                  </div>
                  <div>
                    <dt>Started at</dt>
                    <dd>{formatTimestamp(roomDetails.startedAt)}</dd>
                  </div>
                  <div>
                    <dt>Ended at</dt>
                    <dd>{formatTimestamp(roomDetails.endedAt)}</dd>
                  </div>
                  <div>
                    <dt>Participants</dt>
                    <dd>
                      {roomDetails.participantCount
                        ? roomDetails.participantCount.toString()
                        : "0"}
                    </dd>
                  </div>
                  <div>
                    <dt>Rewards Sent</dt>
                    <dd>
                      {roomDetails.rewardCount
                        ? roomDetails.rewardCount.toString()
                        : "0"}
                    </dd>
                  </div>
                </dl>
                <div className={styles.participantList}>
                  <h3>Participants</h3>
                  {roomParticipants.length ? (
                    <ul>
                      {roomParticipants.map((participant) => (
                        <li key={participant}>{participant}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.placeholder}>No participants yet.</p>
                  )}
                </div>
              </div>
            ) : null}

            {joinDetails ? (
              <div className={styles.lookupSection}>
                <h3>Your Attendance</h3>
                <dl className={styles.datalist}>
                  <div>
                    <dt>Has joined</dt>
                    <dd>{joinDetails.hasJoined ? "Yes" : "No"}</dd>
                  </div>
                  <div>
                    <dt>Currently active</dt>
                    <dd>{joinDetails.isActive ? "Yes" : "No"}</dd>
                  </div>
                  <div>
                    <dt>Total duration</dt>
                    <dd>
                      {joinDetails.totalDuration
                        ? joinDetails.totalDuration.toString()
                        : "0"}
                      {" "}seconds
                    </dd>
                  </div>
                  <div>
                    <dt>Last joined at</dt>
                    <dd>{formatTimestamp(joinDetails.lastJoinedAt)}</dd>
                  </div>
                </dl>
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}
