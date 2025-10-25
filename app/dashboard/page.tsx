"use client";

import { FormEvent, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Wallet } from "@coinbase/onchainkit/wallet";
import { useSearchParams } from "next/navigation";
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
import LiveAudioComponent from "@/components/LiveAudioComponent";
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

type LiveSessionState = {
  liveRoomId: string;
  roomId: string;
  title: string;
  description: string;
  creator: string;
  mode: "host" | "listener";
  userName: string;
};

const composeLiveRoomId = (creator: string, numericId: string) =>
  `${creator.toLowerCase()}::${numericId}`;

const shortenAddress = (value: string) =>
  value ? `${value.slice(0, 6)}...${value.slice(-4)}` : "";

type SectionId = "overview" | "register" | "token" | "rooms" | "explore";

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

function DashboardContent() {
  const contractAddress = useMemo(getContractAddress, []);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId: baseSepolia.id });
  const searchParams = useSearchParams();
  const registerQueryParam = searchParams?.get("register");

  const [lastCompletedAction, setLastCompletedAction] = useState<string | null>(
    null,
  );

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

  const [pendingRoomDraft, setPendingRoomDraft] = useState<
    | {
        title: string;
        description: string;
        category: string;
        start: string;
        end: string;
      }
    | null
  >(null);
  const [createdRoomInfo, setCreatedRoomInfo] = useState<
    | {
        roomId: string;
        title: string;
        description: string;
      }
    | null
  >(null);
  const [pendingStartRoom, setPendingStartRoom] = useState<string | null>(null);
  const [pendingJoinRequest, setPendingJoinRequest] = useState<
    | {
        creator: string;
        roomId: string;
      }
    | null
  >(null);
  const [liveSession, setLiveSession] = useState<LiveSessionState | null>(null);

  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    const completed = currentAction;
    setStatusTone("success");
    setStatusMessage(
      `${completed ?? "Transaction"} confirmed on Base Sepolia.`,
    );
    setRecentHash(pendingHash);
    setPendingHash(null);
    setLastCompletedAction(completed ?? null);
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
    setLastCompletedAction(null);
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

        setPendingRoomDraft({
          title: roomTitle.trim(),
          description: roomDescription.trim(),
          category: roomCategory.trim(),
          start: roomStart,
          end: roomEnd,
        });

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
        setPendingStartRoom(startRoomId.trim());
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
        setPendingJoinRequest({
          creator: joinCreator.trim(),
          roomId: joinRoomId.trim(),
        });
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

  const handleStageLeave = useCallback(() => {
    setLiveSession(null);
  }, []);

  useEffect(() => {
    if (lastCompletedAction !== "Create room") {
      return;
    }
    if (!pendingRoomDraft) {
      setLastCompletedAction(null);
      return;
    }
    if (!profile || !profile.exists || !address || !contractAddress) {
      setPendingRoomDraft(null);
      setLastCompletedAction(null);
      return;
    }
    if (profile.nextRoomId === ZERO_BIGINT) {
      setPendingRoomDraft(null);
      setLastCompletedAction(null);
      return;
    }

    const createdRoomIdBigInt = profile.nextRoomId - BigInt(1);
    const createdRoomId = createdRoomIdBigInt.toString();

    const loadDetails = async () => {
      try {
        if (!publicClient) {
          return {
            title: pendingRoomDraft.title,
            description: pendingRoomDraft.description,
          };
        }

        const room = (await publicClient.readContract({
          address: contractAddress,
          abi: YAPHOUSE_ABI,
          functionName: "getRoom",
          args: [address, createdRoomIdBigInt],
        })) as RoomDetails;

        return {
          title: room.title || pendingRoomDraft.title,
          description: room.description || pendingRoomDraft.description,
        };
      } catch (error) {
        console.error("Failed to fetch created room", error);
        return {
          title: pendingRoomDraft.title,
          description: pendingRoomDraft.description,
        };
      }
    };

    loadDetails().then((info) => {
      setCreatedRoomInfo({
        roomId: createdRoomId,
        title: info.title,
        description: info.description,
      });
      setStartRoomId(createdRoomId);
      setEndRoomId(createdRoomId);
      setActiveSection("rooms");
    }).finally(() => {
      setPendingRoomDraft(null);
      setLastCompletedAction(null);
      setRoomTitle("");
      setRoomDescription("");
      setRoomCategory("");
      setRoomStart("");
      setRoomEnd("");
    });
  }, [
    address,
    contractAddress,
    lastCompletedAction,
    pendingRoomDraft,
    profile,
    publicClient,
  ]);

  useEffect(() => {
    if (lastCompletedAction !== "Start room") {
      return;
    }
    if (!pendingStartRoom || !address) {
      setPendingStartRoom(null);
      setLastCompletedAction(null);
      return;
    }

    const openStage = async () => {
      let title = createdRoomInfo?.title;
      let description = createdRoomInfo?.description;

      if (publicClient && contractAddress) {
        try {
          const room = (await publicClient.readContract({
            address: contractAddress,
            abi: YAPHOUSE_ABI,
            functionName: "getRoom",
            args: [address, BigInt(pendingStartRoom)],
          })) as RoomDetails;
          title = room.title || title;
          description = room.description || description;
        } catch (error) {
          console.error("Failed to fetch started room", error);
        }
      }

      const liveRoomId = composeLiveRoomId(address, pendingStartRoom);
      setLiveSession({
        liveRoomId,
        roomId: pendingStartRoom,
        title: title ?? `Room ${pendingStartRoom}`,
        description: description ?? "",
        creator: address,
        mode: "host",
        userName:
          profile?.name && profile.name.trim().length
            ? profile.name
            : shortenAddress(address),
      });
      setActiveSection("rooms");
    };

    openStage().finally(() => {
      setPendingStartRoom(null);
      setLastCompletedAction(null);
    });
  }, [
    address,
    contractAddress,
    createdRoomInfo,
    lastCompletedAction,
    pendingStartRoom,
    profile,
    publicClient,
  ]);

  useEffect(() => {
    if (lastCompletedAction !== "Join room") {
      return;
    }
    if (!pendingJoinRequest) {
      setLastCompletedAction(null);
      return;
    }

    const { creator, roomId } = pendingJoinRequest;

    const openStage = async () => {
      let title: string | undefined;
      let description: string | undefined;

      if (publicClient && contractAddress) {
        try {
          const room = (await publicClient.readContract({
            address: contractAddress,
            abi: YAPHOUSE_ABI,
            functionName: "getRoom",
            args: [creator as `0x${string}`, BigInt(roomId)],
          })) as RoomDetails;
          title = room.title || undefined;
          description = room.description || undefined;
        } catch (error) {
          console.error("Failed to fetch joined room", error);
        }
      }

      setLiveSession({
        liveRoomId: composeLiveRoomId(creator, roomId),
        roomId,
        title: title ?? `Room ${roomId}`,
        description: description ?? "Join the conversation",
        creator,
        mode: "listener",
        userName:
          profile?.name && profile.name.trim().length
            ? profile.name
            : address
            ? shortenAddress(address)
            : "Listener",
      });
      setActiveSection("rooms");
    };

    openStage().finally(() => {
      setPendingJoinRequest(null);
      setLastCompletedAction(null);
      setJoinCreator("");
      setJoinRoomId("");
    });
  }, [
    address,
    contractAddress,
    lastCompletedAction,
    pendingJoinRequest,
    profile,
    publicClient,
  ]);

  useEffect(() => {
    if (lastCompletedAction !== "End room & distribute") {
      return;
    }
    setLiveSession(null);
    setCreatedRoomInfo(null);
    setLastCompletedAction(null);
  }, [lastCompletedAction]);

  useEffect(() => {
    if (!isConnected || !onBaseSepolia) {
      setLiveSession(null);
      setCreatedRoomInfo(null);
    }
  }, [isConnected, onBaseSepolia]);

  const liveAudioSession = liveSession
    ? {
        roomId: liveSession.liveRoomId,
        roomCode: liveSession.roomId,
        isHost: liveSession.mode === "host",
        roomTitle: liveSession.title,
        roomDescription: liveSession.description,
        userName: liveSession.userName,
      }
    : null;

  const disableActions =
    !isConnected || !onBaseSepolia || isPromptingWallet || isConfirming;

  const showRegisterForm = Boolean(
    profile && profile.exists === false && isConnected && onBaseSepolia,
  );

  const navItems = useMemo(() => {
    const items: { id: SectionId; label: string }[] = [
      { id: "overview", label: "Overview" },
    ];

    if (showRegisterForm) {
      items.push({ id: "register", label: "Register" });
    }

    items.push({
      id: "token",
      label: tokenSnapshot ? "Token Overview" : "Launch Token",
    });

    items.push({ id: "rooms", label: "Rooms" });
    items.push({ id: "explore", label: "Explore" });

    return items;
  }, [showRegisterForm, tokenSnapshot]);

  useEffect(() => {
    if (!navItems.some((item) => item.id === activeSection)) {
      setActiveSection(navItems[0]?.id ?? "overview");
    }
  }, [activeSection, navItems]);

  const handleNavClick = useCallback(
    (sectionId: SectionId) => {
      setActiveSection(sectionId);
      setIsSidebarOpen(false);
    },
    [],
  );

  useEffect(() => {
    const wantsRegister = registerQueryParam === "true";
    if (!wantsRegister) {
      return;
    }
    if (!showRegisterForm) {
      return;
    }
    const timer = window.setTimeout(() => {
      setActiveSection("register");
    }, 150);
    return () => window.clearTimeout(timer);
  }, [registerQueryParam, showRegisterForm]);

  const closeSidebarOnEscape = useCallback((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setIsSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    if (!isSidebarOpen) {
      return;
    }
    window.addEventListener("keydown", closeSidebarOnEscape);
    return () => window.removeEventListener("keydown", closeSidebarOnEscape);
  }, [closeSidebarOnEscape, isSidebarOpen]);

  return (
    <div className={styles.dashboard}>
      <aside
        className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ""}`}
        aria-label="YapHouse navigation"
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.brand}>
            <span className={styles.brandAccent}>YAP</span>
            house
          </div>
          <button
            type="button"
            className={styles.sidebarClose}
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close navigation"
          >
            X
          </button>
        </div>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`${styles.navButton} ${
                activeSection === item.id ? styles.navButtonActive : ""
              }`}
              onClick={() => handleNavClick(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          <span className={styles.sidebarHint}>
            Contract
          </span>
          <span className={styles.sidebarValue}>
            {contractAddress ?? "Not configured"}
          </span>
          {recentHash ? (
            <a
              className={styles.sidebarLink}
              href={explorerUrlForHash(recentHash)}
              target="_blank"
              rel="noreferrer"
            >
              Last tx: {recentHash}
            </a>
          ) : null}
        </div>
      </aside>

      {isSidebarOpen ? (
        <div className={styles.overlay} onClick={() => setIsSidebarOpen(false)}></div>
      ) : null}

      <div className={styles.mainColumn}>
        <header className={styles.topBar}>
          <button
            type="button"
            className={styles.menuButton}
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open navigation"
          >
            Menu
          </button>
          <div className={styles.statusStrip}>
            <span
              className={`${styles.chip} ${
                onBaseSepolia ? styles.chipSuccess : styles.chipDanger
              }`}
            >
              {onBaseSepolia ? "Base Sepolia" : "Wrong network"}
            </span>
            <span className={styles.chip}>
              {currentAction ? `Action: ${currentAction}` : "Idle"}
            </span>
            {pendingHash ? (
              <span className={styles.chip}>Waiting for confirmation...</span>
            ) : null}
          </div>
          <Wallet />
        </header>

        {!contractAddress ? (
          <div className={`${styles.banner} ${styles.bannerError}`}>
            Contract address env var is missing or invalid. Set
            {" "}
            <code className={styles.inlineCode}>NEXT_PUBLIC_CONTRACT_ADDRESS</code>
            {" "}
            before continuing.
          </div>
        ) : null}

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

        <main className={styles.content}>
          <section
            id="overview"
            className={`${styles.section} ${
              activeSection === "overview" ? "" : styles.sectionHidden
            }`}
          >
            <div className={styles.sectionHeader}>
              <h1 className={styles.sectionTitle}>Creator Overview</h1>
              <p className={styles.sectionDescription}>
                Track profile progress, token milestones, and room activity in one place.
              </p>
            </div>
            <div className={styles.cardGrid}>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>Profile</h2>
                  {!profile || !profile.exists ? (
                    <span className={styles.statusBadge}>Unregistered</span>
                  ) : (
                    <span className={`${styles.statusBadge} ${styles.statusBadgeActive}`}>
                      Active
                    </span>
                  )}
                </div>
                {profile ? (
                  profile.exists ? (
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
                      Complete your profile to unlock creator tools.
                    </p>
                  )
                ) : (
                  <p className={styles.placeholder}>
                    Connect on Base Sepolia to load your profile.
                  </p>
                )}
              </div>

              {tokenSnapshot ? (
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Token Overview</h2>
                    <span className={`${styles.statusBadge} ${styles.statusBadgeActive}`}>
                      Live
                    </span>
                  </div>
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
                </div>
              ) : (
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Token Progress</h2>
                    <span className={styles.statusBadge}>Pending</span>
                  </div>
                  <p className={styles.placeholder}>
                    Launch a creator token to reward your listeners and unlock room incentives.
                  </p>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => handleNavClick("token")}
                  >
                    Launch token
                  </button>
                </div>
              )}
            </div>
          </section>

          {showRegisterForm ? (
            <section
              id="register"
              className={`${styles.section} ${
                activeSection === "register" ? "" : styles.sectionHidden
              }`}
            >
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Register your profile</h2>
                <p className={styles.sectionDescription}>
                  Share a public name and contact so listeners can discover you across YapHouse rooms.
                </p>
              </div>
              <div className={styles.cardGridSingle}>
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Profile details</h3>
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
                      Register now
                    </button>
                  </form>
                </div>
              </div>
            </section>
          ) : null}

          <section
            id="token"
            className={`${styles.section} ${
              activeSection === "token" ? "" : styles.sectionHidden
            }`}
          >
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                {tokenSnapshot ? "Creator token" : "Launch creator token"}
              </h2>
              <p className={styles.sectionDescription}>
                Deploy an ERC-20 token that powers listener rewards within your rooms.
              </p>
            </div>
            <div className={styles.cardGridSingle}>
              {tokenSnapshot ? (
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Token snapshot</h3>
                  <dl className={styles.datalist}>
                    <div>
                      <dt>Token address</dt>
                      <dd>{tokenSnapshot.address}</dd>
                    </div>
                    <div>
                      <dt>Name</dt>
                      <dd>{tokenSnapshot.name}</dd>
                    </div>
                    <div>
                      <dt>Symbol</dt>
                      <dd>{tokenSnapshot.symbol}</dd>
                    </div>
                    <div>
                      <dt>Total supply</dt>
                      <dd>{formatUnits(tokenSnapshot.totalSupply, 18)}</dd>
                    </div>
                    <div>
                      <dt>Your balance</dt>
                      <dd>{formatUnits(tokenSnapshot.userBalance, 18)}</dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Deploy token</h3>
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
                      disabled={disableActions || !profile?.exists}
                    >
                      Deploy token
                    </button>
                    {!profile?.exists ? (
                      <p className={styles.formHint}>
                        Register your profile before launching a token.
                      </p>
                    ) : null}
                  </form>
                </div>
              )}
            </div>
          </section>

          <section
            id="rooms"
            className={`${styles.section} ${
              activeSection === "rooms" ? "" : styles.sectionHidden
            }`}
          >
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Room controls</h2>
              <p className={styles.sectionDescription}>
                Build, host, and reward conversations that keep listeners engaged.
              </p>
            </div>
            {liveAudioSession ? (
              <div className={styles.stageWrapper}>
                <LiveAudioComponent
                  session={liveAudioSession}
                  onLeaveStage={handleStageLeave}
                />
                <p className={styles.stageNotice}>
                  {liveSession?.mode === "host"
                    ? `You are live as host for room ${liveSession?.roomId}. Control the stage with the buttons above and end the room when you are done.`
                    : `You are listening to room ${liveSession?.roomId}. Leave the stage to return to the dashboard controls.`}
                </p>
              </div>
            ) : null}

            {createdRoomInfo ? (
              <div className={styles.cardGridSingle}>
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Latest room prepared</h3>
                  <dl className={styles.datalist}>
                    <div>
                      <dt>Room ID</dt>
                      <dd>{createdRoomInfo.roomId}</dd>
                    </div>
                    <div>
                      <dt>Title</dt>
                      <dd>{createdRoomInfo.title}</dd>
                    </div>
                    <div>
                      <dt>Description</dt>
                      <dd>{createdRoomInfo.description || "-"}</dd>
                    </div>
                  </dl>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => setStartRoomId(createdRoomInfo.roomId)}
                  >
                    Use in start form
                  </button>
                </div>
              </div>
            ) : null}
            <div className={styles.cardGrid}>
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Create room</h3>
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
                    disabled={disableActions || !profile?.exists}
                  >
                    Create room
                  </button>
                </form>
              </div>

              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Start room</h3>
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
                    disabled={disableActions || !profile?.exists}
                  >
                    Start room
                  </button>
                </form>
              </div>

              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Join room</h3>
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
              </div>

              <div className={styles.card}>
                <h3 className={styles.cardTitle}>End & reward</h3>
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
                    disabled={disableActions || !profile?.exists}
                  >
                    End room & distribute
                  </button>
                </form>
              </div>
            </div>
          </section>

          <section
            id="explore"
            className={`${styles.section} ${
              activeSection === "explore" ? "" : styles.sectionHidden
            }`}
          >
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Explore rooms & creators</h2>
              <p className={styles.sectionDescription}>
                Inspect creator stats, monitor tokens, and review live room data.
              </p>
            </div>
            <div className={styles.cardGrid}>
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Creator lookup</h3>
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
                    <h4>Profile</h4>
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
                    <h4>Token snapshot</h4>
                    <dl className={styles.datalist}>
                      <div>
                        <dt>Name</dt>
                        <dd>
                          {lookupToken.name} ({lookupToken.symbol})
                        </dd>
                      </div>
                      <div>
                        <dt>Total supply</dt>
                        <dd>{formatUnits(lookupToken.totalSupply, 18)}</dd>
                      </div>
                      <div>
                        <dt>Your balance</dt>
                        <dd>{formatUnits(lookupToken.userBalance, 18)}</dd>
                      </div>
                    </dl>
                  </div>
                ) : null}
              </div>

              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Room explorer</h3>
                <form className={styles.form} onSubmit={handleViewRoom}>
                  <label className={styles.label}>
                    Creator address
                    <input
                      type="text"
                      className={styles.input}
                      value={viewRoomCreator}
                      onChange={(event) => setViewRoomCreator(event.target.value)}
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
                    <h4>Room details</h4>
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
                          {formatTimestamp(roomDetails.scheduledStart)} → {formatTimestamp(roomDetails.scheduledEnd)}
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
                        <dt>Rewards sent</dt>
                        <dd>
                          {roomDetails.rewardCount
                            ? roomDetails.rewardCount.toString()
                            : "0"}
                        </dd>
                      </div>
                    </dl>
                    <div className={styles.participantList}>
                      <h4>Participants</h4>
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
                    <h4>Your attendance</h4>
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
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className={styles.loadingFallback}>Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
