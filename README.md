# Logistics Shipment Dashboard

**Interview Challenge** - The Collaborative Dynamic Operational Warp

A full-stack application demonstrating optimistic UI, real-time synchronization, and race-condition handling using custom mutex in Node.js.

You can access the live deployment at

- Client - **https://logi-stack-cnt.vercel.app/**
- Server - **https://logi-stack-svr.vercel.app/**

-# Note - Server might face issues because of the connection being timed out due to limitations by vercel.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Tailwind + Framer Motion + @dnd-kit + Sonner
- **Backend**: Node.js + Express + TypeScript + Server-Sent Events (SSE) + Custom In-Memory Mutex
- **Dev**: Vite + tsx

## Features Implemented

- ✅ Drag & Drop shipments into containers
- ✅ Strict container weight limits (500 / 750 / 1000 kg)
- ✅ Optimistic UI updates (instant visual feedback)
- ✅ 2.5s simulated server processing delay
- ✅ Custom mutex lock system (no Redis/DB)
- ✅ Detailed collision rejection payload
- ✅ Snap-back animation on conflict
- ✅ Real-time SSE sync between clients
- ✅ Live container updates (simulated)
- ✅ Strict frontend validation

## Project Structure

```
logistics-dashboard/
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── components/     # Dashboard, Container, ShipmentCard
│   │   ├── types.ts
│   │   ├── App.tsx
│   │   └── ...
│   └── ...
└── server/                 # Node.js backend
    ├── src/
    │   ├── state.ts        # In-memory state + mutex
    │   ├── index.ts        # Express + SSE
    │   └── types.ts
    └── ...
```

## Getting Started

### 1. Install dependencies

```bash
# Frontend
cd client
npm install

# Backend
cd ../server
npm install
```

### 2. Run both servers (recommended)

From root:

```bash
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
cd client
npm run dev
```

Then open **http://localhost:5173**

### 3. Test Race Condition

1. Open the app in **two browser tabs** (or incognito windows)
2. Try to drag the **same shipment** into a container in both tabs quickly
3. Watch:
   - First request succeeds
   - Second request gets detailed 409 conflict
   - Second shipment snaps back with animation

## API Endpoints (Backend)

| Method | Endpoint                | Description                 |
| ------ | ----------------------- | --------------------------- |
| GET    | `/api/shipments`        | Available shipments         |
| GET    | `/api/containers`       | All containers + state      |
| GET    | `/api/state`            | Full snapshot               |
| POST   | `/api/shipments/assign` | Assign (with mutex + delay) |
| GET    | `/api/events`           | SSE real-time stream        |

## Key Implementation Highlights

### Backend Mutex (state.ts)

- Pure `Map`-based locking
- First-come-first-serve
- Lock released only after validation + assignment
- Detailed conflict info returned

### Frontend Optimistic Flow

1. Drag -> immediate move (optimistic)
2. POST to backend
3. On 409 -> animate snapback + show collision details
4. SSE listener updates other clients instantly

---

**Built for interview assessment** - BairesDev Full-Stack Challenge
