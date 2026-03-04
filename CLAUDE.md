# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Lumio

Lumio is an event tokenization platform on Stellar. Organizers raise funding by selling revenue-share tokens; investors buy tokens and receive automatic payouts from event revenue. Escrow logic uses Trustless Work (Soroban smart contracts) for non-custodial fund management. All payments are in USDC.

## Monorepo Structure

```
Lumio/
├── packages/
│   ├── core/    → @lumiocorp/lumio-core  (Express API + Prisma + Stellar SDK)
│   └── web/     → @lumiocorp/lumio-web   (Next.js 16.1 + React 19 + Tailwind 4)
├── package.json → npm workspaces root
└── TECHNICAL_ARCHITECTURE.md
```

Requires Node.js >= 20.

## Commands

### From monorepo root (`Lumio/`)
```bash
npm run dev:core          # Start Core backend (tsx watch)
npm run dev:web           # Start Web frontend (next dev)
npm run build:web         # Build Web for production
```

### Core package (`packages/core/`)
```bash
npm run dev               # Start with hot reload (tsx watch src/index.ts)
npm run build             # TypeScript compile to dist/
npm run typecheck         # tsc --noEmit
npm run lint              # ESLint on src/
npm run db:generate       # Generate Prisma client
npm run db:migrate        # Run Prisma migrations
npm run db:push           # Push schema to DB without migration
npm run db:studio         # Open Prisma Studio GUI
npm run db:seed           # Seed demo data (tsx prisma/seed.ts)
npm run demo              # Run full lifecycle demo script
```

### Web package (`packages/web/`)
```bash
npm run dev               # Next.js dev server (Turbopack)
npm run build             # Production build
npm run lint              # ESLint (next core-web-vitals + typescript)
```

### Database setup (first time)
```bash
cd packages/core
docker compose up -d      # Start PostgreSQL 16 on port 5434
cp .env.example .env      # Configure environment
npm run db:generate       # Generate Prisma client
npm run db:migrate        # Apply migrations
```

## Architecture

### Core (Backend API)

Express server on port 3000 with a single router mounted at `/api/events`. Health check at `GET /health`.

**Layered structure:**
- `src/api/routes/events.ts` — REST endpoints (event CRUD, token issuer setup, escrow registration, investment, revenue, distribution)
- `src/services/` — Business logic: `event.service.ts`, `stellar.service.ts`, `investment.service.ts`, `revenue.service.ts`, `distribution.service.ts`
- `src/models/` — Prisma client singleton and re-exported types
- `src/lib/crypto.ts` — AES-256-CBC encryption for Stellar secret keys
- `src/lib/stellar.ts` — Horizon server, keypair generation, USDC asset helpers
- `src/lib/platform.ts` — TW escrow role constants, platform fee config
- `src/lib/logger.ts` — Structured logger with transaction tracking

**Key patterns:**
- Hybrid custody model: backend manages token issuer wallets (encrypted secrets) for token issuance ONLY; USDC funds are non-custodial via TW escrow
- Two-step investment: (1) Frontend funds TW escrow with USDC via SDK, (2) Backend issues custom tokens to investor
- Batch distribution: supports >100 token holders via transaction batching (100 ops per tx)
- Zod validation on all request bodies
- CORS enabled for frontend cross-origin access

**Event status flow:** `DRAFT → ESCROW_DEPLOYED → FUNDING_OPEN → FUNDED → LIVE → COMPLETED` (or `CANCELLED`)

**Prisma models:** User, Event, Investment, Distribution, Ticket

### Web (Frontend)

Next.js App Router with client-side rendering for dashboard pages (`"use client"`).

**Route structure:**
- `/` — Landing page (Hero, HowItWorks, Features, LiveEventsPreview)
- `/explore` — Public event explorer
- `/dashboard/(main)/investor/` — Investor views: overview, explore, portfolio, distributions, event detail `[id]`
- `/dashboard/(main)/organizer/` — Organizer views: overview, create event, events list, event detail `[id]`
- `/dashboard/pay/[id]` — Standalone Lumio Pay ticket purchase page

**Component organization:**
- `components/dashboard/` — Shared shell: DashboardShell, Sidebar, Topbar, RoleSwitch, StatCard, StatusBadge, EventCard, ProgressBar
- `components/investor/` — InvestmentPanel, FilterBar
- `components/organizer/` — CreateEventForm, EventPreviewCard
- `components/landing/` — Hero, Features, HowItWorks, LiveEventsPreview, Footer
- `components/ui/` — WalletProvider, TrustlessWorkProvider, LumioLogo, Card, Chart, ChartDonut, Progress, Toast

**Wallet integration:** Stellar Wallets Kit wraps the entire app via `WalletProvider` (supports Freighter, xBull, Albedo, Lobstr). `WalletProvider` exposes `signTransaction(xdr)` for signing TW escrow operations. `DashboardShell` gates dashboard access behind wallet connection.

**Escrow integration:** `TrustlessWorkProvider` wraps the app with TW SDK config. Custom hooks in `src/hooks/useEscrow.ts` combine TW SDK + wallet signing + backend reporting: `useDeployEscrow()`, `useInvestViaEscrow()`, `useMarkMilestoneDone()`, `useEscrowDetails()`.

**Data layer:** Dashboard pages fetch from the Core API via `src/lib/api.ts` (typed client), with mock data in `src/data/mock.ts` as fallback when the API is unavailable. Types defined in `src/types/index.ts`.

## Dark Theme

Binance-inspired dark theme using CSS variables in `globals.css` with `@theme inline` for Tailwind 4 integration.

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#18121A` | Main background |
| `--bg-card` | `#1E1820` | Card surfaces |
| `--bg-elevated` | `#252028` | Elevated elements, tooltips |
| `--border` | `#2E2832` | Borders, grid lines |
| `--text-primary` | `#FBFBFC` | Primary text |
| `--text-secondary` | `#8B9298` | Secondary text |
| `--color-dominant` | `#3B82F6` | Accent blue |

Two color layers coexist: CSS variable classes (`bg-bg-card`) and hardcoded Tailwind classes (`bg-[#1E1820]`). Status badges use the `bg-{color}-500/15 text-{color}-400` pattern. Logo uses `brightness-0 invert` CSS filter.

## Key Integration Points

- **Trustless Work SDK:** `@trustless-work/escrow` — React hooks for escrow deploy, fund, milestone, approve, release (frontend)
- **Trustless Work API:** `https://dev.api.trustlesswork.com` (testnet) — backend queries (optional)
- **Stellar Horizon:** Testnet at `https://horizon-testnet.stellar.org`
- **USDC:** Stablecoin asset on Stellar, used as base currency for all financial operations
- **Stellar Wallets Kit:** `@creit.tech/stellar-wallets-kit` — client-side wallet connection + transaction signing

## Documentation

- `TECHNICAL_ARCHITECTURE.md` — System overview, escrow lifecycle, data model, financial flow
- `packages/core/.lumio/ARCHITECTURE.md` — Core tech stack and design decisions
- `packages/core/.lumio/API_SPEC.md` — Complete API documentation with curl examples
- `packages/core/.lumio/STELLAR_FLOWS.md` — Stellar operation details and atomic swap implementation
- `packages/core/.lumio/ROADMAP_STATUS.md` — Project status and deployment checklist
