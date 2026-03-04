# Lumio — Technical Architecture

## 1. Overview

Lumio is an event tokenization platform on Stellar. Organizers raise funding by selling revenue-share tokens; investors buy tokens and receive automatic payouts from event revenue. Escrow logic is handled by **Trustless Work** (Soroban smart contracts), ensuring trustless, non-custodial fund management.

### System Components

| Component | Stack | Repo |
|-----------|-------|------|
| **Lumio Web** | Next.js 16.1, React 19, Tailwind 4 | `packages/web/` |
| **Lumio Core** | Express, Prisma, Stellar SDK | `packages/core/` |
| **Lumio Pay** | Integrated in Web (ticket purchase page) | `packages/web/` |
| **Escrow Layer** | Trustless Work API + Soroban | External service |
| **Database** | PostgreSQL + Prisma ORM | Managed by Core |
| **Blockchain** | Stellar Network (USDC) | — |

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USERS                                   │
│  Organizer          Investor           Attendee                 │
└──────┬──────────────────┬──────────────────┬────────────────────┘
       │                  │                  │
       ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LUMIO WEB (Next.js)                        │
│  Landing · Dashboards · Wallet Connection · Event Explorer      │
│  Stellar Wallets Kit · TW Escrow SDK · Lumio Pay                │
│  Role Switch (Organizer / Investor)                             │
│                                                                 │
│  Frontend drives escrow operations:                             │
│  Deploy → Fund → Milestone → Approve → Release                 │
│  Then reports results to Lumio Core backend                     │
└──────┬───────────────────────┬──────────────────────────────────┘
       │ REST API              │ Direct (TW SDK)
       ▼                       ▼
┌──────────────────────┐   ┌─────────────────────────────────────┐
│   LUMIO CORE         │   │      TRUSTLESS WORK (Soroban)       │
│   (Express)          │   │  Escrow Deploy · Fund · Approve     │
│                      │   │  Release · Dispute · Milestone      │
│  Event Service       │   │  API: api.trustlesswork.com         │
│  Investment Service  │   │  SDK: @trustless-work/escrow        │
│  Distribution Svc    │   └─────────────────────────────────────┘
│  Revenue Service     │
│  Stellar Service     │   ┌─────────────────────────────────────┐
│  (token issuance)    │──►│        STELLAR NETWORK              │
│                      │   │  Token Issue · USDC Transfers       │
│  ┌──────────┐        │   │  Horizon: horizon-testnet.stellar   │
│  │  Prisma   │◄─ PG  │   └─────────────────────────────────────┘
│  └──────────┘        │
└──────────────────────┘
```

---

## 3. Escrow Integration (Trustless Work)

Each event creates a **Single-Release Escrow** via the Trustless Work API. This is the financial core of the system.

### Role Mapping: Lumio → Trustless Work

| Lumio Role | TW Escrow Role | Description |
|------------|---------------|-------------|
| Lumio Platform | **Platform Address** | Receives 5% fee, can configure escrow before funding |
| Organizer | **Service Provider** | Marks event as executed, can request force majeure |
| Lumio Core (backend) | **Approver** | Validates event execution, approves milestone |
| Lumio Core (backend) | **Release Signer** | Triggers fund release after liquidation deadline |
| Lumio Platform | **Dispute Resolver** | Handles force majeure cases |
| Organizer | **Receiver** | Receives remaining funds after distribution |

### Escrow Configuration Per Event

```
{
  type: "single-release",
  amount: <funding_target>,
  trustline: "USDC",
  platformFee: 5,                          // Lumio's 5% fee
  platformAddress: LUMIO_WALLET,
  roles: {
    serviceProvider: ORGANIZER_WALLET,
    approver: LUMIO_BACKEND_WALLET,
    releaseSigner: LUMIO_BACKEND_WALLET,
    disputeResolver: LUMIO_PLATFORM_WALLET,
    receiver: ORGANIZER_WALLET
  },
  milestones: [
    { description: "Event executed and revenue collected" }
  ]
}
```

### Escrow Lifecycle Per Event

```
 DEPLOY          FUND             EXECUTE           CLOSE
   │               │                 │                │
   ▼               ▼                 ▼                ▼
┌──────┐    ┌───────────┐    ┌────────────┐    ┌───────────┐
│Create│───►│  Funding   │───►│   Event    │───►│ Distribute│
│Escrow│    │  (USDC in) │    │  Active    │    │  & Close  │
└──────┘    └───────────┘    └────────────┘    └───────────┘
                 │                                    │
            If target NOT       Revenue enters    Automatic:
            reached → REFUND    via Lumio Pay     - 5% → Lumio
                                                  - X% revenue → Investors
                                                  - Rest → Organizer
```

---

## 4. Lumio Pay

**Lumio Pay** is an integrated ticket purchase page within the Lumio web app, accessible at `/dashboard/pay/[eventId]`.

### Purpose

- Process attendee ticket payments during events
- Accept USDC payments via connected wallet
- Record ticket sales in the backend
- Shareable link that organizers distribute for ticket sales

### How It Connects

```
Attendee ──► /dashboard/pay/[id] ──► Connect wallet ──► Pay USDC ──► api.recordTicketSale()
                                                                          │
                                                                     Backend tracks revenue
```

### Key Features

| Feature | Detail |
|---------|--------|
| Input | USDC from attendee's Stellar wallet |
| Output | Ticket sale recorded in DB, revenue tracked per event |
| Tracking | Each payment linked to event ID + buyer address |
| UX | Quantity selector, animated payment flow, toast confirmation |
| Scope MVP | Accept USDC payments, record in backend |

---

## 5. Data Model

```
┌──────────┐       ┌───────────┐       ┌──────────────┐
│   User   │       │   Event   │       │  Investment  │
├──────────┤       ├───────────┤       ├──────────────┤
│ address  │──┐    │ id        │◄──────│ eventId      │
│ role     │  │    │ name      │       │ investorAddr │
│ name     │  ├───►│ organizer │       │ tokenAmount  │
│ email    │  │    │ status    │       │ usdcPaid     │
└──────────┘  │    │ tokenPrice│       │ stellarTxId  │
              │    │ revShare% │       └──────────────┘
              │    │ escrowId  │
              │    │ fundTarget│       ┌──────────────┐
              │    │ totalRev  │       │ Distribution │
              │    └───────────┘       ├──────────────┤
              │         │              │ eventId      │
              │         └─────────────►│ status       │
              │                        │ payoutPerTkn │
              │    ┌───────────┐       └──────────────┘
              │    │  Ticket   │
              └───►├───────────┤
                   │ eventId   │
                   │ buyerAddr │
                   │ usdcAmount│
                   │ stellarTx │
                   └───────────┘
```

### Event Status Flow

```
DRAFT → ESCROW_DEPLOYED → FUNDING_OPEN → FUNDED → LIVE → COMPLETED
                                  │                          │
                                  └──► CANCELLED ◄───────────┘
```

### Escrow Status (TW escrow lifecycle, tracked separately)

```
PENDING → DEPLOYED → FUNDED → MILESTONE_DONE → APPROVED → RELEASED
                                                    │
                                                    └──► DISPUTED
```

---

## 6. Financial Flow (End to End)

Example: Burger Fair, 10 tokens at 100 USDC, 30% revenue share.

```
PHASE 1: FUNDING
─────────────────
10 Investors × 100 USDC = 1,000 USDC → Escrow

PHASE 2: EVENT + REVENUE
─────────────────────────
Attendees pay via Lumio Pay → 5,000 USDC enters Escrow

PHASE 3: DISTRIBUTION (after liquidation deadline)
──────────────────────────────────────────────────
Revenue total:        5,000 USDC
Lumio fee (5%):      -  250 USDC  → Lumio wallet
Revenue neto:         4,750 USDC
Investor pool (30%): -1,425 USDC  → 142.50 per token
Organizer receives:   3,325 USDC  + collateral returned
```

---

## 7. Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16.1, React 19, Tailwind 4, Framer Motion |
| Backend | Express, Node.js (>=20), TypeScript |
| Database | PostgreSQL, Prisma ORM |
| Blockchain | Stellar Network, USDC |
| Wallet | Stellar Wallets Kit (Freighter, Lobstr, etc.) |
| Escrow | Trustless Work API + Soroban smart contracts |
| Payments | Lumio Pay (USDC gateway, separate service) |
| Charts | Recharts |

---

## 8. Integration Points

### Trustless Work SDK

```typescript
// packages: @trustless-work/escrow, @trustless-work/blocks
// Auth: API Key via Bearer token
// Base URL: https://dev.api.trustlesswork.com (testnet)
// All write operations return unsigned XDR → sign client-side
```

| Action | Endpoint |
|--------|----------|
| Deploy escrow | `POST /deployer/single-release` |
| Fund escrow | `POST /escrow/single-release/fund-escrow` |
| Approve milestone | `POST /escrow/single-release/approve-milestone` |
| Release funds | `POST /escrow/single-release/release-funds` |
| Dispute | `POST /escrow/single-release/dispute-escrow` |
| Resolve dispute | `POST /escrow/single-release/resolve-dispute` |

### Stellar Operations (Direct)

| Operation | Purpose |
|-----------|---------|
| Issue custom asset | Event token issuance |
| Set trustline | Investors opt-in to event token |
| Payment | USDC transfers |

---

## 9. Security Model

| Aspect | Approach |
|--------|----------|
| USDC fund custody | Non-custodial via Trustless Work escrow on-chain |
| Token issuance | Minimal custodial: backend holds encrypted issuer wallet keys (AES-256-CBC), used ONLY for token minting |
| Fund release | Requires role-based signatures (XDR signing via client wallet) |
| Revenue validation | Ticket sales recorded via backend API |
| Parameter immutability | Escrow params locked after funding |
| Secret key storage | Issuer wallet secrets encrypted at rest, never exposed to frontend |
| Frontend-driven escrow | Frontend calls TW SDK directly, then reports to backend for tracking |
| Fraud prevention | Organizer collateral (10-20% of funding target) |
| Dispute resolution | TW dispute mechanism + force majeure path |
