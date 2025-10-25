# YapHouse

A Decentralized Audio Platform For Creators and Listeners

## 🚀 Live Demo
- App: https://yaphouse.vercel.app/
- Smart contracts: https://github.com/YATHARTH-Sriv/basecontract

## 🧰 Getting Started

### Prerequisites
- Node.js 18+
- npm (bundled with Node.js)
- A Base Sepolia funded wallet for contract interactions

### Installation
```bash
npm install
```

### Environment variables
Create a `.env` file in the project root and supply the following values:

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_PROJECT_NAME` | Display name shown across the UI |
| `NEXT_PUBLIC_ONCHAINKIT_API_KEY` | Coinbase OnchainKit API key for wallet components |
| `NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL` | RPC endpoint for Base Sepolia interactions |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Deployed YapHouse contract address |
| `NEXT_PUBLIC_SIGNALING_URL` | Public URL of the WebRTC signaling server (defaults to `http://localhost:3001` locally) |

### Local development
```bash
npm run dev
```
The Next.js app will be available at http://localhost:3000.
