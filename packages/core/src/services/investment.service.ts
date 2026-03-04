import { Prisma, Investment, EventStatus } from "@prisma/client";
import { prisma } from "../models/prisma.js";
import { stellarService } from "./stellar.service.js";

export interface RecordInvestmentRequest {
  eventId: string;
  investorAddress: string;
  tokenAmount: number;
  usdcPaid: number;
  escrowFundingTxHash: string;
}

export interface RecordInvestmentResult {
  investment: Investment;
  tokenTxHash: string;
}

export class InvestmentService {
  /**
   * Records an investment and issues tokens to the investor.
   * Called after the frontend has funded the TW escrow with USDC.
   *
   * Two-step process:
   * 1. Frontend funds TW escrow with USDC (non-custodial) → escrowFundingTxHash
   * 2. Backend issues custom tokens to investor → tokenTxHash
   */
  async recordInvestmentAndIssueTokens(
    request: RecordInvestmentRequest
  ): Promise<RecordInvestmentResult> {
    const { eventId, investorAddress, tokenAmount, usdcPaid, escrowFundingTxHash } = request;

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

    // Ensure investor exists in DB
    await prisma.user.upsert({
      where: { address: investorAddress },
      update: {},
      create: {
        address: investorAddress,
        role: "INVESTOR",
      },
    });

    // Issue tokens to the investor via Stellar
    const { txHash: tokenTxHash } = await stellarService.issueTokensToInvestor(
      eventId,
      investorAddress,
      tokenAmount
    );

    // Create investment record with both tx hashes
    const investment = await prisma.investment.create({
      data: {
        eventId,
        investorAddress,
        amountTokens: new Prisma.Decimal(tokenAmount),
        usdcPaid: new Prisma.Decimal(usdcPaid),
        stellarTxHash: tokenTxHash,
        escrowFundingTxHash,
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
    const updatedEvent = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (updatedEvent) {
      const updatedTokensIssued = Number(updatedEvent.totalTokensIssued);

      if (updatedTokensIssued >= totalTokensAvailable) {
        await prisma.event.update({
          where: { id: eventId },
          data: { status: EventStatus.FUNDED },
        });
      }
    }

    return { investment, tokenTxHash };
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
      include: { event: true },
    });
  }
}

export const investmentService = new InvestmentService();
