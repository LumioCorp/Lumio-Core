// Backend-aligned event statuses
export type EventStatus =
  | "DRAFT"
  | "ESCROW_DEPLOYED"
  | "FUNDING_OPEN"
  | "FUNDED"
  | "LIVE"
  | "COMPLETED"
  | "CANCELLED";

export type EventCategory = "gastronomy" | "music" | "sports" | "culture" | "other";

export interface LumioEvent {
  id: string;
  name: string;
  description: string;
  category: EventCategory;
  location: string;
  imageUrl: string;
  organizer: {
    name: string;
    walletAddress: string;
    rating: number;
    eventsCompleted: number;
  };

  eventDate: string;
  fundingDeadline: string;
  liquidationDeadline: string;

  fundingTarget: number;
  tokenSupply: number;
  pricePerToken: number;
  revenueSharePercent: number;
  lumioFeePercent: number;
  collateralPercent: number;
  collateralAmount: number;
  maxPerWalletPercent: number;

  status: EventStatus;
  totalFunded: number;
  tokensSold: number;
  investorCount: number;
  totalRevenue: number;
  ticketsSold: number;
  ticketPrice: number;

  // Escrow fields
  escrowContractId?: string;
  escrowStatus?: string;
  organizerAddress?: string;
  assetCode?: string;

  distribution?: {
    totalDistributed: number;
    lumioFee: number;
    organizerReceived: number;
    payoutPerToken: number;
  };
}

export interface Investment {
  eventId: string;
  eventName: string;
  tokensOwned: number;
  totalInvested: number;
  status: EventStatus;
  estimatedPayout: number;
  actualPayout?: number;
  roi?: number;
  purchaseDate: string;
  escrowFundingTxHash?: string;
}

export interface DistributionRecord {
  eventId: string;
  eventName: string;
  date: string;
  tokensHeld: number;
  payoutAmount: number;
  roi: number;
}

export interface TicketPurchase {
  id: string;
  eventId: string;
  buyerWallet: string;
  amount: number;
  date: string;
}
