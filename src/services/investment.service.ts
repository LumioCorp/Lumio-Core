import { Prisma, Investment, EventStatus } from "@prisma/client";
import { prisma } from "../models/prisma.js";
import { stellarService } from "./stellar.service.js";

export interface PurchaseRequest {
  eventId: string;
  investorAddress: string;
  tokenAmount: number;
}

export interface PurchaseTransaction {
  xdr: string;
  usdcAmount: string;
  tokenAmount: string;
  eventId: string;
  investorAddress: string;
}

export class InvestmentService {
  /**
   * Generates a purchase transaction for token investment.
   * Returns XDR for the investor to sign on frontend.
   * @param request - Purchase request details
   * @returns Transaction XDR and amounts
   */
  async purchaseTokens(request: PurchaseRequest): Promise<PurchaseTransaction> {
    const { eventId, investorAddress, tokenAmount } = request;

    // Validate event exists and is open for funding
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    if (event.status !== EventStatus.FUNDING_OPEN) {
      throw new Error(`Event is not open for funding. Status: ${event.status}`);
    }

    // Calculate available tokens
    const fundingGoal = Number(event.fundingGoal);
    const tokenPrice = Number(event.tokenPrice);
    const totalTokensAvailable = fundingGoal / tokenPrice;
    const tokensIssued = Number(event.totalTokensIssued);
    const tokensRemaining = totalTokensAvailable - tokensIssued;

    if (tokenAmount > tokensRemaining) {
      throw new Error(
        `Insufficient tokens available. Requested: ${tokenAmount}, Available: ${tokensRemaining}`
      );
    }

    // Build the atomic swap transaction
    const { xdr, usdcAmount } = await stellarService.buildPurchaseTransaction(
      eventId,
      investorAddress,
      tokenAmount
    );

    return {
      xdr,
      usdcAmount,
      tokenAmount: tokenAmount.toFixed(7),
      eventId,
      investorAddress,
    };
  }

  /**
   * Records a completed investment after transaction confirmation.
   * Should be called after verifying the transaction on Stellar.
   * @param eventId - Event ID
   * @param investorAddress - Investor's Stellar address
   * @param tokenAmount - Tokens purchased
   * @param usdcPaid - USDC paid
   * @param stellarTxHash - Transaction hash for traceability
   */
  async recordInvestment(
    eventId: string,
    investorAddress: string,
    tokenAmount: number,
    usdcPaid: number,
    stellarTxHash: string
  ): Promise<Investment> {
    // Ensure investor exists in DB
    await prisma.user.upsert({
      where: { address: investorAddress },
      update: {},
      create: {
        address: investorAddress,
        role: "INVESTOR",
      },
    });

    // Create investment record
    const investment = await prisma.investment.create({
      data: {
        eventId,
        investorAddress,
        amountTokens: new Prisma.Decimal(tokenAmount),
        usdcPaid: new Prisma.Decimal(usdcPaid),
        stellarTxHash,
      },
    });

    // Update event's total tokens issued
    await prisma.event.update({
      where: { id: eventId },
      data: {
        totalTokensIssued: {
          increment: new Prisma.Decimal(tokenAmount),
        },
      },
    });

    // Check if funding goal reached
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (event) {
      const fundingGoal = Number(event.fundingGoal);
      const tokenPrice = Number(event.tokenPrice);
      const totalTokensAvailable = fundingGoal / tokenPrice;
      const tokensIssued = Number(event.totalTokensIssued);

      if (tokensIssued >= totalTokensAvailable) {
        await prisma.event.update({
          where: { id: eventId },
          data: { status: EventStatus.FUNDED },
        });
      }
    }

    return investment;
  }

  /**
   * Gets investments for a specific event.
   */
  async getEventInvestments(eventId: string): Promise<Investment[]> {
    return prisma.investment.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Gets investments by a specific investor.
   */
  async getInvestorInvestments(investorAddress: string): Promise<Investment[]> {
    return prisma.investment.findMany({
      where: { investorAddress },
      orderBy: { createdAt: "desc" },
    });
  }
}

export const investmentService = new InvestmentService();
