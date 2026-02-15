# Lumio-Core API Specification

> Version: 1.0.0
> Base URL: `http://localhost:3000`
> Content-Type: `application/json`

## Response Format

All endpoints return responses in this format:

```json
{
  "success": true,
  "data": { ... }
}
```

On error:
```json
{
  "success": false,
  "error": "Error message",
  "details": [ ... ]  // Optional, for validation errors
}
```

---

## Health Check

### `GET /health`

Check if the server is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-11T12:00:00.000Z"
}
```

---

## Events

### `POST /api/events`

Create a new event in DRAFT status.

**Request Body:**
```json
{
  "name": "Feria de Hamburguesas",
  "description": "La mejor feria gastronómica",
  "fundingGoal": 10000,
  "tokenPrice": 10,
  "revenueSharePct": 30,
  "organizerId": "cluser123..."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Event name (1-200 chars) |
| description | string | No | Event description (max 2000 chars) |
| fundingGoal | number | Yes | Target funding in USDC |
| tokenPrice | number | Yes | Price per token in USDC |
| revenueSharePct | number | Yes | Percentage for investors (0-100) |
| organizerId | string | Yes | User ID of the organizer |

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "clevent123...",
    "name": "Feria de Hamburguesas",
    "status": "DRAFT",
    "fundingGoal": "10000",
    "tokenPrice": "10",
    "revenueSharePct": "30",
    "stellarPublicKey": null,
    "assetCode": null,
    "totalTokensIssued": "0",
    "totalRevenue": "0",
    "createdAt": "2026-02-11T12:00:00.000Z"
  }
}
```

---

### `GET /api/events`

List all events.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clevent123...",
      "name": "Feria de Hamburguesas",
      "status": "FUNDING_OPEN",
      ...
    }
  ]
}
```

---

### `GET /api/events/:id`

Get a single event by ID.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "clevent123...",
    "name": "Feria de Hamburguesas",
    "description": "...",
    "fundingGoal": "10000",
    "tokenPrice": "10",
    "revenueSharePct": "30",
    "status": "FUNDING_OPEN",
    "stellarPublicKey": "GABCD...",
    "assetCode": "EVTFERIA",
    "totalTokensIssued": "500",
    "totalRevenue": "0",
    "organizerId": "cluser123...",
    "createdAt": "2026-02-11T12:00:00.000Z",
    "updatedAt": "2026-02-11T12:05:00.000Z"
  }
}
```

---

### `POST /api/events/:id/wallet`

Initialize Stellar wallet for the event. Creates keypair and stores encrypted secret.

**Prerequisites:** Event must be in `DRAFT` status.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "clevent123...",
    "stellarPublicKey": "GABCD...",
    "assetCode": "EVTFERIA",
    "status": "WALLET_CREATED"
  }
}
```

---

### `POST /api/events/:id/fund`

Fund the event wallet using Stellar Friendbot (testnet only).

**Prerequisites:** Event must have wallet initialized.

**Response (200):**
```json
{
  "success": true,
  "message": "Wallet funded successfully"
}
```

---

### `POST /api/events/:id/setup-asset`

Configure Stellar asset with compliance flags and USDC trustline.

**What it does:**
1. Sets `AUTH_REVOCABLE` and `AUTH_CLAWBACK` flags
2. Creates trustline to USDC

**Prerequisites:** Event must have funded wallet.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "transactionHash": "abc123...",
    "assetCode": "EVTFERIA",
    "issuer": "GABCD..."
  }
}
```

---

### `POST /api/events/:id/open-funding`

Open the event for investments.

**Prerequisites:** Event must be in `WALLET_CREATED` status.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "clevent123...",
    "status": "FUNDING_OPEN"
  }
}
```

---

### `POST /api/events/:id/invest`

Generate XDR transaction for token purchase (atomic swap).

**Prerequisites:**
- Event must be in `FUNDING_OPEN` status
- Investor must have trustline to event asset

**Request Body:**
```json
{
  "investorAddress": "GINVESTOR123...",
  "tokenAmount": 100
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| investorAddress | string | Yes | Stellar public key (56 chars) |
| tokenAmount | number | Yes | Number of tokens to purchase |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "xdr": "AAAAAGB...",
    "usdcAmount": "1000.0000000",
    "tokenAmount": "100.0000000",
    "eventId": "clevent123...",
    "investorAddress": "GINVESTOR123..."
  }
}
```

**Frontend Flow:**
1. Call this endpoint to get XDR
2. XDR is pre-signed by event wallet
3. Investor signs with their wallet (e.g., Freighter)
4. Submit to Stellar network
5. Call backend to record investment (webhook or manual)

---

### `GET /api/events/:id/revenue`

Get revenue statistics for an event.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "eventId": "clevent123...",
    "totalRevenue": 1500,
    "ticketsSold": 100,
    "revenueSharePct": 30,
    "distributableAmount": 450,
    "tokensIssued": 1000,
    "payoutPerToken": 0.45
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| totalRevenue | number | Total USDC from ticket sales |
| ticketsSold | number | Number of tickets sold |
| revenueSharePct | number | Configured share percentage |
| distributableAmount | number | totalRevenue * (revenueSharePct/100) |
| tokensIssued | number | Total tokens in circulation |
| payoutPerToken | number | USDC each token holder receives per token |

---

### `GET /api/events/:id/payout-preview`

Preview distribution calculation before executing.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "eventId": "clevent123...",
    "totalRevenue": 1500,
    "revenueSharePct": 30,
    "distributableAmount": 450,
    "totalTokensIssued": 1000,
    "payoutPerToken": 0.45,
    "holders": [
      {
        "address": "GHOLDER1...",
        "tokenBalance": 100,
        "usdcPayout": 45
      },
      {
        "address": "GHOLDER2...",
        "tokenBalance": 200,
        "usdcPayout": 90
      }
    ]
  }
}
```

---

### `POST /api/events/:id/distribute`

Execute revenue distribution to all token holders.

**Prerequisites:**
- Event must be in `LIVE` or `FUNDED` status
- Event must have revenue to distribute
- Event must have token holders

**Response (200):**
```json
{
  "success": true,
  "data": {
    "distributionId": "cldist123...",
    "transactionHash": "abc123...",
    "totalDistributed": 450,
    "holdersCount": 10,
    "status": "COMPLETED"
  }
}
```

**Note:** This is an atomic operation. On success, event status changes to `COMPLETED`.

---

### `GET /api/events/:id/distributions`

Get distribution history for an event.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "cldist123...",
      "totalAmount": "450",
      "payoutPerToken": "0.45",
      "status": "COMPLETED",
      "stellarTxHash": "abc123...",
      "createdAt": "2026-02-11T14:00:00.000Z",
      "completedAt": "2026-02-11T14:00:05.000Z"
    }
  ]
}
```

---

## Event Status Flow

```
DRAFT
  ↓ POST /events/:id/wallet
WALLET_CREATED
  ↓ POST /events/:id/fund (testnet)
  ↓ POST /events/:id/setup-asset
  ↓ POST /events/:id/open-funding
FUNDING_OPEN
  ↓ (auto when funding goal reached)
FUNDED
  ↓ (manual transition)
LIVE
  ↓ POST /events/:id/distribute
COMPLETED
```

---

## Error Codes

| HTTP Code | Meaning |
|-----------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 404 | Not Found |
| 500 | Internal Server Error |

Common error messages:
- `Event not found: {id}`
- `Event wallet not initialized`
- `Event must be in DRAFT status`
- `No token holders found`
- `No revenue to distribute`

---

## USDC Asset (Testnet)

```
Code: USDC
Issuer: GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5
```

---

## Example: Complete Flow

```bash
# 1. Create event
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Event","fundingGoal":1000,"tokenPrice":10,"revenueSharePct":30,"organizerId":"user123"}'

# 2. Initialize wallet
curl -X POST http://localhost:3000/api/events/{id}/wallet

# 3. Fund wallet (testnet)
curl -X POST http://localhost:3000/api/events/{id}/fund

# 4. Setup asset
curl -X POST http://localhost:3000/api/events/{id}/setup-asset

# 5. Open funding
curl -X POST http://localhost:3000/api/events/{id}/open-funding

# 6. Generate investment XDR
curl -X POST http://localhost:3000/api/events/{id}/invest \
  -H "Content-Type: application/json" \
  -d '{"investorAddress":"GABC...","tokenAmount":50}'

# 7. Check revenue
curl http://localhost:3000/api/events/{id}/revenue

# 8. Execute distribution
curl -X POST http://localhost:3000/api/events/{id}/distribute
```

---

## WebSocket Events (Future)

Reserved for future real-time updates:
- `investment.created`
- `ticket.sold`
- `distribution.completed`

---

*Generated for lumio-pay frontend team - LumioCorp 2026*
