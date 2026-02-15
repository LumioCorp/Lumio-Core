# Stellar Flows - Lumio Protocol

## Resumen de Operaciones Stellar

Lumio utiliza operaciones nativas de Stellar para implementar el protocolo de financiamiento colectivo. No requiere smart contracts (Soroban) para el MVP.

---

## 1. Creación de Event Wallet

Cada evento requiere una cuenta Stellar dedicada que actúa como issuer del token y custodio del revenue.

### Flujo

```
1. Organizador crea evento via API
2. Backend genera nuevo Keypair
3. Se cifra la secret key con AES-256-GCM
4. Se almacena (publicKey, encryptedSecret) en DB
5. Se fondea la cuenta con XLM mínimo (friendbot en testnet)
6. Evento queda en status "WALLET_CREATED"
```

### Operaciones Stellar

```typescript
// Crear cuenta
const keypair = Keypair.random();

// Fondear cuenta (testnet)
await friendbot(keypair.publicKey());

// Mainnet: Usar cuenta master de Lumio para CREATE_ACCOUNT
const tx = new TransactionBuilder(masterAccount)
  .addOperation(Operation.createAccount({
    destination: keypair.publicKey(),
    startingBalance: "2.5" // Mínimo para reserves
  }))
  .build();
```

---

## 2. Configuración del Asset (Setup)

Antes de abrir el funding, se debe configurar la cuenta del evento con los flags de compliance y trustlines necesarios.

### Flags de Autorización

| Flag | Propósito |
|------|-----------|
| AUTH_REVOCABLE | Permite revocar tokens en caso de fraude/compliance |
| AUTH_CLAWBACK | Permite recuperar tokens de cualquier holder |

### Flujo de Setup

```
1. Evento en status WALLET_CREATED (ya fondeado)
2. POST /api/events/:id/setup-asset
3. Transacción atómica:
   - setOptions: AUTH_REVOCABLE + AUTH_CLAWBACK
   - changeTrust: Trustline a USDC
4. Evento listo para abrir funding
```

### Implementación (`setupEventAsset`)

```typescript
const transaction = new TransactionBuilder(eventAccount, { fee, networkPassphrase })
  // Configurar flags de compliance
  .addOperation(Operation.setOptions({
    setFlags: AuthRevocableFlag | AuthClawbackEnabledFlag,
  }))
  // Trustline para recibir USDC
  .addOperation(Operation.changeTrust({
    asset: USDC_ASSET,
    limit: "10000000",
  }))
  .setTimeout(30)
  .build();

transaction.sign(eventKeypair);
await server.submitTransaction(transaction);
```

---

## 3. Emisión de Asset del Evento (SEP-41 Compliant)

Cada evento emite su propio token fungible siguiendo el estándar SEP-41.

### Características del Asset

| Propiedad | Valor |
|-----------|-------|
| Código | `EVT{id}` (4-12 chars) |
| Issuer | Event Wallet public key |
| Decimals | 7 (estándar Stellar) |
| Supply | `fundingGoal / tokenPrice` |

---

## 4. Compra de Tokens (Atomic Swap)

Los inversores compran tokens mediante un atomic swap: envían USDC y reciben tokens en la misma transacción.

### Flujo de Compra

```
1. Inversor tiene trustline al asset del evento
2. POST /api/events/:id/invest { investorAddress, tokenAmount }
3. Backend genera XDR con atomic swap
4. XDR pre-firmado por Event Wallet
5. Frontend recibe XDR, inversor firma
6. Se envía a Stellar
7. Backend registra inversión tras confirmación
```

### Implementación (`buildPurchaseTransaction`)

```typescript
// Source: Investor account (paga fee)
const transaction = new TransactionBuilder(investorAccount, { fee, networkPassphrase })
  // 1. Inversor envía USDC al evento
  .addOperation(Operation.payment({
    destination: eventPublicKey,
    asset: USDC_ASSET,
    amount: usdcAmount,
    source: investorPublicKey,
  }))
  // 2. Evento envía tokens al inversor
  .addOperation(Operation.payment({
    destination: investorPublicKey,
    asset: eventAsset,
    amount: tokenAmount,
    source: eventPublicKey,
  }))
  .setTimeout(300)
  .build();

// Event wallet firma su operación
transaction.sign(eventKeypair);

// Retorna XDR para que inversor firme
return transaction.toXDR();
```

### Prerequisitos del Inversor

El inversor debe tener una trustline al asset del evento antes de la compra:

```typescript
// Firmada por el inversor en su wallet
const trustlineTx = new TransactionBuilder(investorAccount)
  .addOperation(Operation.changeTrust({
    asset: new Asset(eventAssetCode, eventWalletPublicKey),
    limit: "1000000"
  }))
  .build();
```

---

## 5. Recepción de Pagos USDC (Venta de Entradas)

Las entradas al evento se pagan en USDC. El revenue acumula en la Event Wallet.

### Asset USDC en Stellar

| Red | Código | Issuer |
|-----|--------|--------|
| Testnet | USDC | `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5` |
| Mainnet | USDC | `GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN` (Circle) |

### Flujo de Venta de Entradas

```
1. Event Wallet ya tiene trustline a USDC (del setup)
2. Asistente paga USDC a Event Wallet
3. Backend registra la venta en DB
4. USDC queda custodiado en Event Wallet
5. Evento pasa a status LIVE
```

---

## 6. Distribución de Revenue

El porcentaje configurado del revenue se distribuye automáticamente a los token holders.

### Fórmula

```
distributableAmount = totalRevenue * (revenueSharePct / 100)
payoutPerToken = distributableAmount / totalTokensIssued
payoutPerInvestor = tokenBalance * payoutPerToken
```

### Flujo de Distribución

```
1. GET /api/events/:id/revenue         → Ver estadísticas actuales
2. GET /api/events/:id/payout-preview  → Preview de distribución
3. POST /api/events/:id/distribute     → Ejecutar payout
4. Event status → COMPLETED
```

### Implementación (`executeDistribution`)

```typescript
// 1. Obtener holders del asset desde Horizon
const accounts = await server.accounts().forAsset(eventAsset).limit(200).call();

// 2. Filtrar issuer y calcular payouts
const holders = accounts.records
  .filter(acc => acc.id !== issuer)
  .map(acc => ({
    address: acc.id,
    balance: getTokenBalance(acc),
    payout: balance * payoutPerToken
  }));

// 3. Construir batch de pagos (max 100 ops/tx)
for (const batch of splitIntoBatches(holders, 100)) {
  const tx = new TransactionBuilder(eventAccount, { fee, networkPassphrase });

  for (const holder of batch) {
    tx.addOperation(Operation.payment({
      destination: holder.address,
      asset: USDC_ASSET,
      amount: holder.payout.toFixed(7)
    }));
  }

  tx.setTimeout(60).build();
  tx.sign(eventKeypair);
  await server.submitTransaction(tx);
}

// 4. Registrar en DB y actualizar estado
await prisma.distribution.update({ status: COMPLETED, stellarTxHash });
await prisma.event.update({ status: COMPLETED });
```

### Límites y Consideraciones

| Límite | Valor | Manejo |
|--------|-------|--------|
| Ops por transacción | 100 | Split en batches automático |
| Holders máximo | 200 (paginado) | Implementar cursor para >200 |
| Fee por op | 100 stroops | Escala con batch size |

### Estados de Distribution

```
PENDING → PROCESSING → COMPLETED
                    ↘ FAILED (con error message)
```

---

## 7. Diagrama de Estados del Evento

```
DRAFT
  │
  ├─── POST /events/:id/wallet
  ▼
WALLET_CREATED
  │
  ├─── POST /events/:id/fund (testnet)
  ├─── POST /events/:id/setup-asset
  ├─── POST /events/:id/open-funding
  ▼
FUNDING_OPEN ────── POST /events/:id/invest (atomic swap)
  │
  ├─── (auto cuando totalTokensIssued >= fundingGoal/tokenPrice)
  ▼
FUNDED ──────────── (meta de financiamiento alcanzada)
  │
  ├─── (manual o auto al iniciar evento)
  ▼
LIVE ────────────── (vendiendo entradas, acumulando revenue)
  │                  GET /events/:id/revenue
  │
  ├─── POST /events/:id/distribute
  ▼
COMPLETED ───────── (payout ejecutado a todos los holders)
```

### Flujo Completo de API

```
Fase 1: Crear Evento
  POST /events                    → DRAFT

Fase 2: Configurar Wallet
  POST /events/:id/wallet         → WALLET_CREATED
  POST /events/:id/fund           → (fondeado en testnet)
  POST /events/:id/setup-asset    → (flags + USDC trustline)
  POST /events/:id/open-funding   → FUNDING_OPEN

Fase 3: Recibir Inversiones
  POST /events/:id/invest         → (XDR para firmar)
  [inversor firma y envía]        → tokens emitidos
  [auto si meta alcanzada]        → FUNDED

Fase 4: Vender Entradas
  [pagos USDC a event wallet]     → revenue acumulado
  [manual]                        → LIVE

Fase 5: Distribuir Revenue
  GET  /events/:id/revenue        → stats
  GET  /events/:id/payout-preview → cálculo detallado
  POST /events/:id/distribute     → COMPLETED
```

---

## 8. Seguridad

### Custodia de Claves

```typescript
// Cifrado al crear evento
const encrypted = encrypt(secretKey, process.env.ENCRYPTION_KEY);
await prisma.event.update({
  where: { id: eventId },
  data: { stellarSecretEncrypted: encrypted }
});

// Descifrado para firmar
const secret = decrypt(event.stellarSecretEncrypted, process.env.ENCRYPTION_KEY);
const keypair = Keypair.fromSecret(secret);
transaction.sign(keypair);
```

### Validaciones

- Verificar balance suficiente antes de distribuciones
- Validar trustlines antes de enviar assets
- Usar sequence numbers correctos para evitar replay
- Implementar timeouts en transacciones
