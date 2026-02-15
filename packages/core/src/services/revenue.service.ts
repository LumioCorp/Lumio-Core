import { Prisma, Ticket, EventStatus } from "@prisma/client";
import { prisma } from "../models/prisma.js";
import { getHorizonServer, getUSDCAsset } from "../lib/stellar.js";

export interface TicketSale {
  eventId: string;
  buyerAddress: string;
  usdcPaid: number;
  stellarTxHash?: string;
}

export interface RevenueStats {
  eventId: string;
  totalRevenue: number;
  ticketsSold: number;
  revenueSharePct: number;
  distributableAmount: number;
  tokensIssued: number;
  payoutPerToken: number;
}

export class RevenueService {
  /**
   * Records a ticket sale and updates event revenue.
   * @param sale - Ticket sale details
   * @returns Created ticket record
   */
  async recordTicketSale(sale: TicketSale): Promise<Ticket> {
    const event = await prisma.event.findUnique({
      where: { id: sale.eventId },
    });

    if (!event) {
      throw new Error(`Event not found: ${sale.eventId}`);
    }

    if (event.status !== EventStatus.LIVE && event.status !== EventStatus.FUNDED) {
      throw new Error(`Event is not accepting ticket sales. Status: ${event.status}`);
    }

    // Create ticket and update revenue in transaction
    const [ticket] = await prisma.$transaction([
      prisma.ticket.create({
        data: {
          eventId: sale.eventId,
          buyerAddress: sale.buyerAddress,
          usdcPaid: new Prisma.Decimal(sale.usdcPaid),
          stellarTxHash: sale.stellarTxHash,
        },
      }),
      prisma.event.update({
        where: { id: sale.eventId },
        data: {
          totalRevenue: {
            increment: new Prisma.Decimal(sale.usdcPaid),
          },
        },
      }),
    ]);

    return ticket;
  }

  /**
   * Gets revenue statistics for an event.
   * @param eventId - Event ID
   * @returns Revenue stats including distributable amount
   */
  async getRevenueStats(eventId: string): Promise<RevenueStats> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: { tickets: true },
        },
      },
    });

    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    const totalRevenue = Number(event.totalRevenue);
    const revenueSharePct = Number(event.revenueSharePct);
    const tokensIssued = Number(event.totalTokensIssued);

    // Calculate distributable amount (revenue * share percentage)
    const distributableAmount = totalRevenue * (revenueSharePct / 100);

    // Calculate payout per token
    const payoutPerToken = tokensIssued > 0 ? distributableAmount / tokensIssued : 0;

    return {
      eventId,
      totalRevenue,
      ticketsSold: event._count.tickets,
      revenueSharePct,
      distributableAmount,
      tokensIssued,
      payoutPerToken,
    };
  }

  /**
   * Fetches recent USDC payments to the event wallet from Horizon.
   * Useful for reconciliation and monitoring.
   * @param eventId - Event ID
   * @param limit - Number of payments to fetch
   */
  async fetchRecentPayments(eventId: string, limit: number = 20) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event?.stellarPublicKey) {
      throw new Error("Event wallet not initialized");
    }

    const server = getHorizonServer();
    const usdcAsset = getUSDCAsset();

    // Fetch payments to the event account
    const payments = await server
      .payments()
      .forAccount(event.stellarPublicKey)
      .limit(limit)
      .order("desc")
      .call();

    // Filter for incoming USDC payments
    const usdcPayments = payments.records.filter((payment) => {
      if (payment.type !== "payment") return false;
      const p = payment as {
        asset_code?: string;
        asset_issuer?: string;
        to: string;
        from: string;
        amount: string;
      };
      return (
        p.asset_code === usdcAsset.code &&
        p.asset_issuer === usdcAsset.issuer &&
        p.to === event.stellarPublicKey
      );
    });

    return usdcPayments.map((p) => {
      const payment = p as {
        id: string;
        from: string;
        amount: string;
        created_at: string;
        transaction_hash: string;
      };
      return {
        id: payment.id,
        from: payment.from,
        amount: payment.amount,
        timestamp: payment.created_at,
        txHash: payment.transaction_hash,
      };
    });
  }

  /**
   * Syncs on-chain USDC payments with database.
   * Records any payments not yet in the tickets table.
   * @param eventId - Event ID
   */
  async syncPayments(eventId: string): Promise<number> {
    const payments = await this.fetchRecentPayments(eventId, 100);

    let synced = 0;

    for (const payment of payments) {
      // Check if already recorded
      const existing = await prisma.ticket.findUnique({
        where: { stellarTxHash: payment.txHash },
      });

      if (!existing) {
        await this.recordTicketSale({
          eventId,
          buyerAddress: payment.from,
          usdcPaid: Number(payment.amount),
          stellarTxHash: payment.txHash,
        });
        synced++;
      }
    }

    return synced;
  }

  /**
   * Gets all tickets for an event.
   */
  async getEventTickets(eventId: string): Promise<Ticket[]> {
    return prisma.ticket.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
    });
  }
}

export const revenueService = new RevenueService();
