const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.error || `Request failed: ${res.status}`);
  }

  return json.data as T;
}

// ─── Event CRUD ───────────────────────────────────────────────

export interface CreateEventParams {
  name: string;
  description?: string;
  fundingGoal: number;
  tokenPrice: number;
  revenueSharePct: number;
  organizerId: string;
  organizerAddress?: string;
  category?: string;
  location?: string;
  eventDate?: string;
  fundingDeadline?: string;
  ticketPrice?: number;
  imageUrl?: string;
}

export async function createEvent(params: CreateEventParams) {
  return request<Record<string, unknown>>("/api/events", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function getEvents(filters?: {
  organizerAddress?: string;
  status?: string;
}) {
  const qs = new URLSearchParams();
  if (filters?.organizerAddress) qs.set("organizerAddress", filters.organizerAddress);
  if (filters?.status) qs.set("status", filters.status);
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return request<Record<string, unknown>[]>(`/api/events${query}`);
}

export async function getEvent(eventId: string) {
  return request<Record<string, unknown>>(`/api/events/${eventId}`);
}

export async function getEventFull(eventId: string) {
  return request<Record<string, unknown>>(`/api/events/${eventId}/full`);
}

// ─── Token Issuer & Escrow Setup ──────────────────────────────

export async function initializeTokenIssuer(eventId: string) {
  return request<{ id: string; stellarPublicKey: string; assetCode: string; status: string }>(
    `/api/events/${eventId}/token-issuer`,
    { method: "POST" }
  );
}

export async function fundWallet(eventId: string) {
  return request<{ message: string }>(`/api/events/${eventId}/fund`, {
    method: "POST",
  });
}

export async function setupAsset(eventId: string) {
  return request<{ transactionHash: string; assetCode: string; issuer: string }>(
    `/api/events/${eventId}/setup-asset`,
    { method: "POST" }
  );
}

export async function registerEscrow(eventId: string, escrowContractId: string) {
  return request<{ id: string; escrowContractId: string; status: string }>(
    `/api/events/${eventId}/escrow`,
    { method: "POST", body: JSON.stringify({ escrowContractId }) }
  );
}

export interface EscrowConfig {
  title: string;
  description: string;
  amount: string;
  platformFee: string;
  roles: {
    approver: string;
    serviceProvider: string;
    platformAddress: string;
    releaseSigner: string;
    disputeResolver: string;
    receiver: string;
  };
  trustline: { address: string; decimals: number };
  milestones: { description: string }[];
}

export async function getEscrowConfig(eventId: string) {
  return request<EscrowConfig>(`/api/events/${eventId}/escrow-config`);
}

export async function updateEscrowStatus(eventId: string, escrowStatus: string) {
  return request<{ id: string; escrowStatus: string }>(
    `/api/events/${eventId}/escrow-status`,
    { method: "PATCH", body: JSON.stringify({ escrowStatus }) }
  );
}

// ─── Funding ──────────────────────────────────────────────────

export async function openFunding(eventId: string) {
  return request<{ id: string; status: string }>(
    `/api/events/${eventId}/open-funding`,
    { method: "POST" }
  );
}

export async function markEventLive(eventId: string) {
  return request<{ id: string; status: string }>(
    `/api/events/${eventId}/mark-live`,
    { method: "POST" }
  );
}

// ─── Investment ───────────────────────────────────────────────

export interface RecordInvestmentParams {
  investorAddress: string;
  tokenAmount: number;
  usdcPaid: number;
  escrowFundingTxHash: string;
}

export async function recordInvestment(
  eventId: string,
  params: RecordInvestmentParams
) {
  return request<{ investment: Record<string, unknown>; tokenTxHash: string }>(
    `/api/events/${eventId}/invest`,
    { method: "POST", body: JSON.stringify(params) }
  );
}

export async function getEventInvestments(eventId: string) {
  return request<Record<string, unknown>[]>(`/api/events/${eventId}/investments`);
}

// ─── Revenue & Distribution ──────────────────────────────────

export async function getRevenueStats(eventId: string) {
  return request<{
    eventId: string;
    totalRevenue: number;
    ticketsSold: number;
    revenueSharePct: number;
    distributableAmount: number;
    tokensIssued: number;
    payoutPerToken: number;
  }>(`/api/events/${eventId}/revenue`);
}

export async function recordTicketSale(
  eventId: string,
  params: { buyerAddress: string; usdcPaid: number; stellarTxHash?: string }
) {
  return request<Record<string, unknown>>(`/api/events/${eventId}/ticket`, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function getDistributions(eventId: string) {
  return request<Record<string, unknown>[]>(`/api/events/${eventId}/distributions`);
}

export async function getPayoutPreview(eventId: string) {
  return request<Record<string, unknown>>(`/api/events/${eventId}/payout-preview`);
}

export async function executeDistribution(eventId: string) {
  return request<Record<string, unknown>>(`/api/events/${eventId}/distribute`, {
    method: "POST",
  });
}
