# Blockchain Supply Chain Tracking

A blockchain-based supply chain tracking system built with **Hardhat 3**, **Solidity**, **React** and **ethers.js**. The system tracks product status through the supply chain, records all transactions on-chain, and verifies whether product data has been tampered with.

> **PTIT — Advanced Information Security Demo 2026**

## Features

- **Product Registration** — Create products with a unique hash fingerprint stored on blockchain
- **Status Tracking** — Track products through 4 stages: Created → Shipped → Received → Sold
- **Role-based Access** — Only authorized participants (Manufacturer, Distributor, Retailer) can update status
- **Tamper Detection** — Verify product authenticity by comparing hash values on-chain
- **Audit Trail** — Full history of every status change with who, where, and when
- **React Frontend** — Interactive UI to interact with the smart contract

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Solidity 0.8.28 |
| Development | Hardhat 3 |
| Frontend | React 19 + Vite |
| Blockchain Interaction | ethers.js v6 |
| Local Blockchain | Hardhat Node (EDR) |

## Project Structure

```
├── contracts/
│   └── SupplyChainTracker.sol    # Smart contract
├── scripts/
│   ├── deploy-supplychain-ui.ts  # Deploy & export ABI for frontend
│   └── supply-chain-demo.ts     # CLI demo (full flow in terminal)
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Main React component
│   │   ├── App.css               # Styles (dark mode, glassmorphism)
│   │   ├── contract-info.json    # Auto-generated: contract address + ABI
│   │   └── main.jsx              # Entry point
│   ├── package.json
│   └── vite.config.js
├── hardhat.config.ts
└── package.json
```

## Prerequisites

- **Node.js** >= 22.13.0
- **npm** >= 10

## Getting Started

### 1. Install dependencies

```bash
# Install Hardhat dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Compile the smart contract

```bash
npx hardhat compile
```

### Quick Test (CLI only)

Run the full supply chain flow in terminal without UI:

```bash
npx hardhat run scripts/supply-chain-demo.ts
```

### Full Demo (with Frontend UI)

Open **3 terminals**:

**Terminal 1** — Start local blockchain:
```bash
npx hardhat node
```

**Terminal 2** — Deploy contract:
```bash
npx hardhat run scripts/deploy-supplychain-ui.ts --network localhost
```

**Terminal 3** — Start frontend:
```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` and click buttons **in order**:

1. **Authorize Participants** — Grant access to Distributor & Retailer
2. **Create Product** — Register a new product on blockchain
3. **Update to Shipped** — Distributor ships the product
4. **Update to Received** — Retailer receives the product
5. **Verify Product** — Compare original vs tampered hash
6. **View History** — See full audit trail on blockchain

## Smart Contract Overview

### SupplyChainTracker.sol

| Function | Access | Description |
|---|---|---|
| `authorizeParticipant(address)` | Owner only | Grant permission to a participant |
| `createProduct(name, origin, hash)` | Authorized | Register a new product |
| `updateStatus(id, status, location)` | Authorized | Update product status (forward only) |
| `verifyProduct(id, hash)` | Anyone | Verify product authenticity |
| `getProduct(id)` | Anyone | Get product information |
| `getHistoryCount(id)` | Anyone | Get number of history records |
| `getHistoryRecord(id, index)` | Anyone | Get a specific history record |

### Product Status Flow

```
Created (Manufacturer) → Shipped (Distributor) → Received (Retailer) → Sold (Customer)
```

Status can only move **forward** — no rollbacks allowed.

## How Tamper Detection Works

```
Original: "Product: PTIT Laptop | Serial: PTIT-2026-001 | Origin: Hanoi Factory"
  → keccak256 hash → 0x7f3a8b... → stored on blockchain

Tampered: "Product: FAKE PTIT Laptop | Serial: PTIT-2026-001 | Origin: Unknown"
  → keccak256 hash → 0xe91c4d... → does NOT match → verification fails
```

Changing even **one character** produces a completely different hash → tampering is immediately detected.

## License

MIT
