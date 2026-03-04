import { Prisma, Event, EventStatus } from "@prisma/client";
import { prisma } from "../models/prisma.js";
import { stellarService } from "./stellar.service.js";

export interface CreateEventInput {
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

export class EventService {
  /**
   * Creates a new event in DRAFT status.
   * Does not create Stellar wallet yet.
   */
  async createEvent(input: CreateEventInput): Promise<Event> {
    const event = await prisma.event.create({
      data: {
        name: input.name,
        description: input.description,
        fundingGoal: new Prisma.Decimal(input.fundingGoal),
        tokenPrice: new Prisma.Decimal(input.tokenPrice),
        revenueSharePct: new Prisma.Decimal(input.revenueSharePct),
        organizerId: input.organizerId,
        organizerAddress: input.organizerAddress,
        category: input.category ?? "other",
        location: input.location,
        eventDate: input.eventDate ? new Date(input.eventDate) : undefined,
        fundingDeadline: input.fundingDeadline ? new Date(input.fundingDeadline) : undefined,
        ticketPrice: input.ticketPrice ? new Prisma.Decimal(input.ticketPrice) : undefined,
        imageUrl: input.imageUrl,
        status: EventStatus.DRAFT,
      },
    });

    return event;
  }

  /**
   * Initializes the token issuer wallet for an event.
   * Generates keypair, encrypts secret, updates event to ESCROW_DEPLOYED (ready for escrow).
   * This wallet is ONLY for issuing custom tokens — it does NOT custody funds.
   */
  async initializeTokenIssuer(eventId: string): Promise<Event> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    if (event.status !== EventStatus.DRAFT) {
      throw new Error(`Event must be in DRAFT status. Current: ${event.status}`);
    }

    const wallet = stellarService.createTokenIssuerWallet();
    const assetCode = this.generateAssetCode(eventId);

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: {
        stellarPublicKey: wallet.publicKey,
        stellarSecretEncrypted: wallet.secretEncrypted,
        assetCode,
      },
    });

    return updated;
  }

  /**
   * Registers a TW escrow contract for an event.
   * Called after the frontend deploys the escrow via TW SDK.
   */
  async registerEscrow(eventId: string, escrowContractId: string): Promise<Event> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    if (event.status !== EventStatus.DRAFT) {
      throw new Error(`Event must be in DRAFT status to register escrow. Current: ${event.status}`);
    }

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: {
        escrowContractId,
        escrowStatus: "DEPLOYED",
        status: EventStatus.ESCROW_DEPLOYED,
      },
    });

    return updated;
  }

  /**
   * Updates the escrow status field on the event.
   */
  async updateEscrowStatus(eventId: string, escrowStatus: string): Promise<Event> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: { escrowStatus },
    });

    return updated;
  }

  /**
   * Transitions event from FUNDED to LIVE.
   */
  async markEventLive(eventId: string): Promise<Event> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    if (event.status !== EventStatus.FUNDED) {
      throw new Error(`Event must be in FUNDED status. Current: ${event.status}`);
    }

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: { status: EventStatus.LIVE },
    });

    return updated;
  }

  /**
   * Funds event wallet using Friendbot (testnet only).
   */
  async fundEventWallet(eventId: string): Promise<void> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event?.stellarPublicKey) {
      throw new Error("Event wallet not initialized");
    }

    await stellarService.fundWithFriendbot(event.stellarPublicKey);
  }

  /**
   * Opens funding for an event.
   * Escrow must be deployed first.
   */
  async openFunding(eventId: string): Promise<Event> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    if (event.status !== EventStatus.ESCROW_DEPLOYED) {
      throw new Error(`Event must be in ESCROW_DEPLOYED status. Current: ${event.status}`);
    }

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: { status: EventStatus.FUNDING_OPEN },
    });

    return updated;
  }

  /**
   * Retrieves an event by ID.
   */
  async getEvent(eventId: string): Promise<Event | null> {
    return prisma.event.findUnique({
      where: { id: eventId },
    });
  }

  /**
   * Retrieves an event with all relations (investments, distributions, tickets).
   */
  async getEventFull(eventId: string) {
    return prisma.event.findUnique({
      where: { id: eventId },
      include: {
        investments: { orderBy: { createdAt: "desc" } },
        distributions: { orderBy: { createdAt: "desc" } },
        tickets: { orderBy: { createdAt: "desc" } },
        organizer: true,
        _count: {
          select: { investments: true, tickets: true },
        },
      },
    });
  }

  /**
   * Lists events, optionally filtered by organizer, status, or organizerAddress.
   */
  async getEvents(filters?: {
    organizerId?: string;
    organizerAddress?: string;
    status?: EventStatus;
  }): Promise<Event[]> {
    return prisma.event.findMany({
      where: {
        organizerId: filters?.organizerId,
        organizerAddress: filters?.organizerAddress,
        status: filters?.status,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Generates a unique asset code for an event.
   * Format: EVT + first 8 chars of event ID (uppercase)
   */
  private generateAssetCode(eventId: string): string {
    const suffix = eventId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase();
    return `EVT${suffix}`;
  }
}

export const eventService = new EventService();
