# YapHouse

YapHouse is a decentralized audio stage for creators who want to host live conversations, reward their listeners on-chain, and grow communities around scheduled rooms.

## 🚀 Live Demo
- App: https://yaphouse.vercel.app/
- Contracts (Base Sepolia): https://github.com/YATHARTH-Sriv/basecontract

## 🧠 Architecture Overview
- **Next.js**
- **wagmi + Viem** 
- **Coinbase OnchainKit** 
- **WebRTC + Socket.io signaling** (see `hooks/useWebRTC.ts`) gives hosts a Twitter Spaces–style audio stage.
- **YapHouse smart contracts** 

## 📂 Project Structure
```
app/
	layout.tsx          # Root layout and providers
	rootProvider.tsx    # Wagmi + OnchainKit + theme providers
	page.tsx            # Landing page
	dashboard/
		page.tsx          # Main dashboard logic (rooms, tokens, overview)
		page.module.css   # Dashboard styling

components/
	LandingPage/        # Hero, info cards, footer, etc.
	LiveAudioComponent.tsx # Client-side audio stage UI
	HostedRooms.tsx     # Wrapper around live audio experience
	ui/accordion.tsx    # Reusable UI primitives

hooks/
	useWebRTC.ts        # Connects to signaling server and manages audio tracks
	use-mobile.ts       # Hook for responsive UI logic
	useInteractionObserver.ts # Intersection observer utility

lib/
	utils.ts            # Shared helpers (formatting, copy utilities)
	yaphouse.ts         # Contract helper utilities for the dashboard

abi/
	YapHouse.json       # ABI for creator/room management contract
	YapToken.json       # ABI for creator ERC-20 token

public/               # Static assets
```

## 📝 How the Dashboard Flows
1. **Register** – Creators submit name and email, storing profile data on-chain via `registerUser`.
2. **Launch token** – Optional ERC-20 deployment through `createCreatorToken`; balances are surfaced in the UI.
3. **Create room** – Define title, description, category, and schedule; the contract allocates the next room ID.
4. **Start room** – When ready to broadcast, `startRoom` opens the stage and spawns a WebRTC session for the host.
5. **Join room** – Listeners call `joinRoom` to register attendance and obtain access to the live audio stage.
6. **End & reward** – Hosts run `endRoom` with arrays of winners and reward amounts, distributing creator tokens.
7. **Explore** – Lookup tools let anyone inspect profiles, tokens, and room history using read-only contract calls.

## 🔐 Contract & ABI Integration
- ABIs live under `abi/` and are imported in the dashboard (`app/dashboard/page.tsx`).
- `YapHouse` exposes functions like `getProfile`, `createRoom`, `startRoom`, and `endRoom` to coordinate state.
- `YapToken` ABIs enable balance checks, total supply reads, and token metadata retrieval for each creator.
- `lib/yaphouse.ts` contains helper utilities and constants for contract interaction (e.g., address resolution).
- Transactions are dispatched through wagmi’s `useWriteContract`; receipts are tracked with `useWaitForTransactionReceipt`.

## 🔊 WebRTC Signaling Path
1. The dashboard derives a `liveRoomId` combining creator address and room ID.
2. `LiveAudioComponent` hands this session info to `useWebRTC`.
3. `useWebRTC` connects to the signaling server `NEXT_PUBLIC_SIGNALING_URL` (defaults to `http://localhost:3001`).
4. Hosts publish audio streams; listeners subscribe to the host track and can request stage access.
5. Session state (host vs. listener, participant lists) is echoed back through Socket.io events and mirrored in UI state.

## 🧰 Getting Started

### Prerequisites
- Node.js 18+
- npm (bundled with Node.js)
- Wallet funded on Base Sepolia for contract transactions

### Installation
```bash
npm install
```

### Environment Variables
Create a `.env` file in the project root and supply the following values:

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_PROJECT_NAME` | Display name rendered across the UI |
| `NEXT_PUBLIC_ONCHAINKIT_API_KEY` | Coinbase OnchainKit API key for wallet widgets |
| `NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL` | RPC endpoint for Base Sepolia (Infura, Alchemy, etc.) |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Deployed YapHouse contract address |
| `NEXT_PUBLIC_SIGNALING_URL` | Public URL of your WebRTC signaling server |

### Local Development
```bash
npm run dev
```
Visit http://localhost:3000 and connect a wallet on Base Sepolia.

Built for Everyone by Yatharth Srivastava.
