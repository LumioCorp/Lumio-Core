# Lumio — Technical Architecture

## 1. Overview

Lumio is an event tokenization platform on Stellar. Organizers raise funding by selling revenue-share tokens; investors buy tokens and receive automatic payouts from event revenue. Escrow logic is handled by **Trustless Work** (Soroban smart contracts), ensuring trustless, non-custodial fund management.

### System Components

| Component | Stack | Repo |
|-----------|-------|------|
| **Lumio Web** | Next.js 16.1, React 19, Tailwind 4 | `packages/web/` |
| **Lumio Core** | Express, Prisma, Stellar SDK | `packages/core/` |
| **Lumio Pay** | TBD (separate repo) | `lumio-pay/` |
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
│  Stellar Wallets Kit · Role Switch (Organizer / Investor)       │
└──────────────────────────┬──────────────────────────────────────┘
                           │ REST API
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     LUMIO CORE (Express)                        │
│  Event Service · Investment Service · Distribution Service      │
│  Revenue Service · Stellar Service                              │
│  ┌──────────┐                                                   │
│  │  Prisma   │◄──── PostgreSQL                                  │
│  └──────────┘                                                   │
└──────┬────────────────────────┬─────────────────────────────────┘
       │                        │
       ▼                        ▼
┌──────────────┐   ┌─────────────────────────────────────────────┐
│ STELLAR      │   │          TRUSTLESS WORK (Soroban)           │
│ NETWORK      │   │  Escrow Deploy · Fund · Approve · Release   │
│ Token Issue  │   │  Dispute · Resolve · Milestone tracking     │
│ USDC Transfers│  │  API: api.trustlesswork.com                 │
└──────────────┘   │  SDK: @trustless-work/escrow                │
                   └─────────────────────────────────────────────┘
                           ▲
                           │ Revenue deposits (USDC)
                           │
                   ┌───────┴───────┐
                   │   LUMIO PAY   │
                   │  Payment gate │
                   │  for events   │
                   └───────────────┘
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

**Lumio Pay** is a separate service (own repo, not yet built) that acts as the payment gateway for events.

### Purpose

- Process attendee payments (tickets, purchases) during events
- Convert payments to USDC
- Route all revenue directly into the event's escrow wallet
- Ensure only verified revenue counts for distribution

### How It Connects

```
Attendee pays ──► Lumio Pay ──► USDC ──► Event Escrow (TW)
                  (payment       (on Stellar)
                   gateway)
```

### Key Requirements

| Requirement | Detail |
|-------------|--------|
| Input | Attendee payments (fiat or crypto) |
| Output | USDC deposited to event escrow address |
| Tracking | Each payment linked to event ID |
| Integrity | Only revenue through Lumio Pay is valid for distribution |
| Scope MVP | Accept USDC payments, deposit to escrow |

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
DRAFT → WALLET_CREATED → FUNDING_OPEN → FUNDED → LIVE → COMPLETED
                                │                          │
                                └──► CANCELLED ◄───────────┘
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
| Fund custody | Non-custodial via Trustless Work escrow |
| Fund release | Requires role-based signatures (XDR signing) |
| Revenue validation | Only Lumio Pay deposits count |
| Parameter immutability | Escrow params locked after funding |
| KYC | Required for organizers and investors |
| Fraud prevention | Organizer collateral (10-20% of funding target) |
| Dispute resolution | Automatic cancellation + force majeure path |
