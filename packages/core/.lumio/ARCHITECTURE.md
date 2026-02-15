# Lumio-Core Architecture

## Overview

Lumio es una plataforma de financiamiento colectivo para eventos construida sobre la red Stellar. Permite a organizadores tokenizar eventos para obtener financiamiento, mientras los inversores reciben una porción automática del revenue generado.

## Stack Tecnológico

| Capa | Tecnología | Propósito |
|------|------------|-----------|
| Runtime | Node.js 20 LTS | Servidor backend |
| Lenguaje | TypeScript 5.x | Type safety y DX |
| ORM | Prisma | Acceso a datos tipado |
| Base de Datos | PostgreSQL 16 | Persistencia principal |
| Blockchain | Stellar (Horizon API) | Tokenización y pagos |
| SDK | @stellar/stellar-sdk | Interacción con Stellar |

## Flujo de Datos

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Cliente   │────▶│   API       │────▶│   Prisma    │
│   (HTTP)    │     │   /src/api  │     │   ORM       │
└─────────────┘     └──────┬──────┘     └──────┬──────┘
                          │                    │
                          ▼                    ▼
                   ┌─────────────┐     ┌─────────────┐
                   │  Services   │     │  PostgreSQL │
                   │  /src/srv   │     │   Database  │
                   └──────┬──────┘     └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │  Stellar    │
                   │  Horizon    │
                   └─────────────┘
```

## Estructura de Carpetas

```
/src
├── /api
│   └── /routes
│       └── events.ts        # Todos los endpoints de eventos
├── /services
│   ├── stellar.service.ts   # Wallet, asset setup, transactions
│   ├── event.service.ts     # CRUD y estado de eventos
│   ├── investment.service.ts # Compra de tokens
│   ├── revenue.service.ts   # Tracking de ventas
│   └── distribution.service.ts # Payout a inversores
├── /models
│   ├── prisma.ts            # Cliente Prisma
│   └── index.ts             # Exports de tipos
└── /lib
    ├── crypto.ts            # AES-256-CBC cifrado
    ├── stellar.ts           # Horizon helpers, USDC config
    ├── logger.ts            # Logging estructurado
    └── demo-runner.ts       # Script de demostración
```

## Componentes Clave

### 1. Event Wallet (Cuenta Stellar del Evento)
Cada evento tiene una cuenta Stellar dedicada que:
- Emite el token del evento (asset nativo Stellar)
- Recibe pagos USDC de entradas
- Ejecuta distribuciones automáticas a holders

### 2. Asset del Evento
- Código: `EVT{eventId}` (ej: `EVT001`)
- Issuer: La cuenta del evento
- Supply: Limitado al `fundingGoal / tokenPrice`

### 3. Distribución de Revenue
- Los pagos de entradas llegan en USDC
- El porcentaje configurado (`revenueSharePct`) se distribuye
- Proporcional a tokens en posesión de cada inversor

## Variables de Entorno

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/lumio
STELLAR_NETWORK=testnet
HORIZON_URL=https://horizon-testnet.stellar.org
ENCRYPTION_KEY=<32-byte-hex>
```

## Decisiones de Diseño

1. **Custodia de Claves**: Las secret keys de eventos se almacenan cifradas con AES-256-CBC. Solo el backend puede descifrarlas para firmar transacciones.

2. **Sin Smart Contracts**: MVP usa operaciones nativas de Stellar (Assets, Trustlines, Payments) para simplicidad y bajo costo.

3. **USDC como Moneda Base**: Todos los pagos y distribuciones en USDC (Stellar) para estabilidad.

4. **Idempotencia**: Las operaciones de distribución usan el hash de la transacción como clave de idempotencia.

5. **Atomic Swaps**: Las compras de tokens usan transacciones atómicas (USDC → Event, Token → Inversor en una sola tx).

---

## Diagrama de Secuencia: Distribución de Revenue

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Frontend│     │   API   │     │DistServ │     │  Prisma │     │ Horizon │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │               │
     │ POST /distribute              │               │               │
     │──────────────▶│               │               │               │
     │               │               │               │               │
     │               │ executeDistribution()         │               │
     │               │──────────────▶│               │               │
     │               │               │               │               │
     │               │               │ findEvent()   │               │
     │               │               │──────────────▶│               │
     │               │               │◀──────────────│               │
     │               │               │               │               │
     │               │               │ create Distribution (PENDING) │
     │               │               │──────────────▶│               │
     │               │               │◀──────────────│               │
     │               │               │               │               │
     │               │               │ update (PROCESSING)           │
     │               │               │──────────────▶│               │
     │               │               │               │               │
     │               │               │ getTokenHolders()             │
     │               │               │──────────────────────────────▶│
     │               │               │◀──────────────────────────────│
     │               │               │               │               │
     │               │               │ buildPaymentTx()              │
     │               │               │──────────────────────────────▶│
     │               │               │               │               │
     │               │               │ submitTransaction()           │
     │               │               │──────────────────────────────▶│
     │               │               │◀──────────────────────────────│
     │               │               │               │               │
     │               │               │ $transaction [                │
     │               │               │   update Distribution         │
     │               │               │   update Event status         │
     │               │               │ ]─────────────▶│               │
     │               │               │◀──────────────│               │
     │               │               │               │               │
     │               │◀──────────────│               │               │
     │◀──────────────│               │               │               │
     │               │               │               │               │
     │ { distributionId, txHash, status: COMPLETED } │               │
     │               │               │               │               │
```

---

## Diagrama de Secuencia: Compra de Tokens (Atomic Swap)

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Frontend│     │   API   │     │InvestSrv│     │ Stellar │     │ Wallet  │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │               │
     │ POST /invest {investorAddr, amount}           │               │
     │──────────────▶│               │               │               │
     │               │               │               │               │
     │               │ purchaseTokens()              │               │
     │               │──────────────▶│               │               │
     │               │               │               │               │
     │               │               │ buildPurchaseTransaction()    │
     │               │               │──────────────▶│               │
     │               │               │               │               │
     │               │               │ loadAccount(investor)         │
     │               │               │               │──────────────▶│
     │               │               │               │◀──────────────│
     │               │               │               │               │
     │               │               │ build tx [                    │
     │               │               │   payment: investor→event USDC│
     │               │               │   payment: event→investor TKN │
     │               │               │ ]             │               │
     │               │               │               │               │
     │               │               │ sign(eventKeypair)            │
     │               │               │◀──────────────│               │
     │               │               │               │               │
     │               │◀──────────────│               │               │
     │◀──────────────│               │               │               │
     │               │               │               │               │
     │ { xdr: "AAAA...", usdcAmount }│               │               │
     │               │               │               │               │
     │ User signs with Freighter     │               │               │
     │───────────────────────────────────────────────────────────────▶
     │               │               │               │               │
     │ submitTransaction(signedXdr) │               │               │
     │───────────────────────────────────────────────▶               │
     │◀──────────────────────────────────────────────│               │
     │               │               │               │               │
```

---

## Documentación Relacionada

- `API_SPEC.md` - Especificación completa de endpoints
- `STELLAR_FLOWS.md` - Detalles de operaciones Stellar
- `ROADMAP_STATUS.md` - Estado del proyecto y log de sesiones
