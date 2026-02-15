import {
  Prisma,
  Distribution,
  DistributionStatus,
  EventStatus,
} from "@prisma/client";
import {
  TransactionBuilder,
  Operation,
  Keypair,
  Asset,
} from "@stellar/stellar-sdk";
import { prisma } from "../models/prisma.js";
import { decryptSecret } from "../lib/crypto.js";
import {
  getHorizonServer,
  getNetworkPassphrase,
  getUSDCAsset,
} from "../lib/stellar.js";
import { distributionLogger } from "../lib/logger.js";

export interface PayoutCalculation {
  eventId: string;
  totalRevenue: number;
  revenueSharePct: number;
  distributableAmount: number;
  totalTokensIssued: number;
  payoutPerToken: number;
  holders: HolderPayout[];
}

export interface HolderPayout {
  address: string;
  tokenBalance: number;
  usdcPayout: number;
}

export interface DistributionResult {
  distributionId: string;
  transactionHash: string;
  totalDistributed: number;
  holdersCount: number;
  status: DistributionStatus;
}

const MAX_OPERATIONS_PER_TX = 100;

export class DistributionService {
  /**
   * Calculates payout amounts for all token holders.
   * @param eventId - Event ID
   * @returns Payout calculation with per-holder amounts
   */
  async calculatePayout(eventId: string): Promise<PayoutCalculation> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    if (!event.stellarPublicKey || !event.assetCode) {
      throw new Error("Event asset not configured");
    }

    const totalRevenue = Number(event.totalRevenue);
    const revenueSharePct = Number(event.revenueSharePct);
    const totalTokensIssued = Number(event.totalTokensIssued);

    if (totalTokensIssued === 0) {
      throw new Error("No tokens issued for this event");
    }

    // Calculate distributable amount
    const distributableAmount = totalRevenue * (revenueSharePct / 100);
    const payoutPerToken = distributableAmount / totalTokensIssued;

    // Get current token holders from Horizon
    const holders = await this.getTokenHolders(
      event.assetCode,
      event.stellarPublicKey
    );

    // Calculate payout for each holder
    const holderPayouts: HolderPayout[] = holders.map((holder) => ({
      address: holder.address,
      tokenBalance: holder.balance,
      usdcPayout: Number((holder.balance * payoutPerToken).toFixed(7)),
    }));

    return {
      eventId,
      totalRevenue,
      revenueSharePct,
      distributableAmount,
      totalTokensIssued,
      payoutPerToken,
      holders: holderPayouts,
    };
  }

  /**
   * Executes the revenue distribution to all token holders.
   * Uses database transaction to ensure consistency on failures.
   * @param eventId - Event ID
   * @returns Distribution result with transaction hash
   */
  async executeDistribution(eventId: string): Promise<DistributionResult> {
    const startTime = Date.now();

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    if (event.status !== EventStatus.LIVE && event.status !== EventStatus.FUNDED) {
      throw new Error(`Event must be LIVE or FUNDED to distribute. Current: ${event.status}`);
    }

    if (!event.stellarPublicKey || !event.stellarSecretEncrypted) {
      throw new Error("Event wallet not initialized");
    }

    // Calculate payouts
    const calculation = await this.calculatePayout(eventId);

    if (calculation.holders.length === 0) {
      throw new Error("No token holders found");
    }

    if (calculation.distributableAmount === 0) {
      throw new Error("No revenue to distribute");
    }

    distributionLogger.info("Starting distribution", {
      eventId,
      holdersCount: calculation.holders.length,
      totalAmount: calculation.distributableAmount,
      payoutPerToken: calculation.payoutPerToken,
    });

    // Create distribution record in PENDING state first
    const distribution = await prisma.distribution.create({
      data: {
        eventId,
        totalAmount: new Prisma.Decimal(calculation.distributableAmount),
        payoutPerToken: new Prisma.Decimal(calculation.payoutPerToken),
        status: DistributionStatus.PENDING,
      },
    });

    // Update to PROCESSING before Stellar operations
    await prisma.distribution.update({
      where: { id: distribution.id },
      data: { status: DistributionStatus.PROCESSING },
    });

    try {
      // Execute the distribution transaction
      const txHash = await this.executePayoutTransaction(
        event.stellarPublicKey,
        event.stellarSecretEncrypted,
        calculation.holders,
        eventId
      );

      // Use transaction to update both records atomically
      await prisma.$transaction([
        prisma.distribution.update({
          where: { id: distribution.id },
          data: {
            status: DistributionStatus.COMPLETED,
            stellarTxHash: txHash,
            completedAt: new Date(),
          },
        }),
        prisma.event.update({
          where: { id: eventId },
          data: { status: EventStatus.COMPLETED },
        }),
      ]);

      const duration = Date.now() - startTime;
      distributionLogger.info("Distribution completed successfully", {
        eventId,
        distributionId: distribution.id,
        txHash,
        duration,
        holdersCount: calculation.holders.length,
      });

      return {
        distributionId: distribution.id,
        transactionHash: txHash,
        totalDistributed: calculation.distributableAmount,
        holdersCount: calculation.holders.length,
        status: DistributionStatus.COMPLETED,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const duration = Date.now() - startTime;

      distributionLogger.error("Distribution failed", {
        eventId,
        distributionId: distribution.id,
        error: errorMessage,
        duration,
      });

      // Mark distribution as failed (don't throw if this fails)
      try {
        await prisma.distribution.update({
          where: { id: distribution.id },
          data: {
            status: DistributionStatus.FAILED,
            error: errorMessage,
          },
        });
      } catch (dbError) {
        distributionLogger.error("Failed to update distribution status", {
          distributionId: distribution.id,
          error: dbError instanceof Error ? dbError.message : "Unknown",
        });
      }

      throw error;
    }
  }

  /**
   * Gets all token holders from Horizon.
   */
  private async getTokenHolders(
    assetCode: string,
    issuer: string
  ): Promise<{ address: string; balance: number }[]> {
    const server = getHorizonServer();
    const asset = new Asset(assetCode, issuer);

    const accounts = await server.accounts().forAsset(asset).limit(200).call();

    const holders: { address: string; balance: number }[] = [];

    for (const account of accounts.records) {
      // Skip the issuer account
      if (account.id === issuer) continue;

      const balance = account.balances.find(
        (b) =>
          b.asset_type !== "native" &&
          (b as { asset_code: string; asset_issuer: string }).asset_code === assetCode &&
          (b as { asset_code: string; asset_issuer: string }).asset_issuer === issuer
      );

      if (balance && Number(balance.balance) > 0) {
        holders.push({
          address: account.id,
          balance: Number(balance.balance),
        });
      }
    }

    return holders;
  }

  /**
   * Executes the batch payment transaction with retry logic.
   */
  private async executePayoutTransaction(
    eventPublicKey: string,
    eventSecretEncrypted: string,
    holders: HolderPayout[],
    eventId: string
  ): Promise<string> {
    const server = getHorizonServer();
    const networkPassphrase = getNetworkPassphrase();
    const usdcAsset = getUSDCAsset();

    // Decrypt event secret
    const secret = decryptSecret(eventSecretEncrypted);
    const keypair = Keypair.fromSecret(secret);

    // Filter out zero payouts
    const validHolders = holders.filter((h) => h.usdcPayout > 0);

    if (validHolders.length === 0) {
      throw new Error("No valid payouts to process");
    }

    // Split into batches if needed (max 100 ops per tx)
    const batches = this.splitIntoBatches(validHolders, MAX_OPERATIONS_PER_TX);
    let lastTxHash = "";

    distributionLogger.info("Executing payout batches", {
      eventId,
      totalBatches: batches.length,
      totalHolders: validHolders.length,
    });

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchNum = i + 1;

      // Reload account for each batch to get current sequence
      const account = await server.loadAccount(eventPublicKey);

      const txBuilder = new TransactionBuilder(account, {
        fee: (100000 * batch.length).toString(),
        networkPassphrase,
      });

      for (const holder of batch) {
        txBuilder.addOperation(
          Operation.payment({
            destination: holder.address,
            asset: usdcAsset,
            amount: holder.usdcPayout.toFixed(7),
          })
        );
      }

      const transaction = txBuilder.setTimeout(60).build();
      transaction.sign(keypair);

      distributionLogger.info(`Submitting batch ${batchNum}/${batches.length}`, {
        eventId,
        batchNum,
        operations: batch.length,
      });

      try {
        const result = await server.submitTransaction(transaction);
        lastTxHash = result.hash;

        distributionLogger.info(`Batch ${batchNum} completed`, {
          eventId,
          batchNum,
          txHash: result.hash,
        });
      } catch (error) {
        distributionLogger.error(`Batch ${batchNum} failed`, {
          eventId,
          batchNum,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }

      // Small delay between batches to avoid rate limits
      if (i < batches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return lastTxHash;
  }

  /**
   * Splits holders into batches for transaction limits.
   */
  private splitIntoBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Gets distribution history for an event.
   */
  async getDistributions(eventId: string): Promise<Distribution[]> {
    return prisma.distribution.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Gets a specific distribution by ID.
   */
  async getDistribution(distributionId: string): Promise<Distribution | null> {
    return prisma.distribution.findUnique({
      where: { id: distributionId },
    });
  }
}

export const distributionService = new DistributionService();
