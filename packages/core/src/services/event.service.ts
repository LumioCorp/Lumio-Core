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
        status: EventStatus.DRAFT,
      },
    });

    return event;
  }

  /**
   * Initializes Stellar wallet for an event.
   * Generates keypair, encrypts secret, updates event to WALLET_CREATED.
   */
  async initializeWallet(eventId: string): Promise<Event> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    if (event.status !== EventStatus.DRAFT) {
      throw new Error(`Event must be in DRAFT status. Current: ${event.status}`);
    }

    const wallet = stellarService.createEventWallet();
    const assetCode = this.generateAssetCode(eventId);

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: {
        stellarPublicKey: wallet.publicKey,
        stellarSecretEncrypted: wallet.secretEncrypted,
        assetCode,
        status: EventStatus.WALLET_CREATED,
      },
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
   * Wallet must be created and funded first.
   */
  async openFunding(eventId: string): Promise<Event> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    if (event.status !== EventStatus.WALLET_CREATED) {
      throw new Error(`Event must be in WALLET_CREATED status. Current: ${event.status}`);
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
   * Lists events, optionally filtered by organizer or status.
   */
  async getEvents(filters?: {
    organizerId?: string;
    status?: EventStatus;
  }): Promise<Event[]> {
    return prisma.event.findMany({
      where: {
        organizerId: filters?.organizerId,
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
