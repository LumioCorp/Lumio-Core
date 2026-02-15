export type EventStatus =
  | "funding_open"
  | "funding_successful"
  | "event_executed"
  | "liquidation_countdown"
  | "distribution_executed"
  | "cancelled";

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
