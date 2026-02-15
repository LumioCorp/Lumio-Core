import {
  Keypair,
  TransactionBuilder,
  Operation,
  Asset,
  AuthRevocableFlag,
  AuthClawbackEnabledFlag,
} from "@stellar/stellar-sdk";
import { encryptSecret, decryptSecret } from "../lib/crypto.js";
import {
  getHorizonServer,
  getNetworkPassphrase,
  getUSDCAsset,
} from "../lib/stellar.js";
import { stellarLogger } from "../lib/logger.js";
import { prisma } from "../models/prisma.js";

export class StellarError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly recoverable: boolean = false
  ) {
    super(message);
    this.name = "StellarError";
  }
}

export interface EventWallet {
  publicKey: string;
  secretEncrypted: string;
}

export interface SetupAssetResult {
  transactionHash: string;
  assetCode: string;
  issuer: string;
}

export class StellarService {
  /**
   * Generates a new Stellar keypair for an event.
   * The secret key is encrypted before being returned.
   * @returns Public key and encrypted secret key
   */
  createEventWallet(): EventWallet {
    const keypair = Keypair.random();

    const publicKey = keypair.publicKey();
    const secret = keypair.secret();
    const secretEncrypted = encryptSecret(secret);

    return {
      publicKey,
      secretEncrypted,
    };
  }

  /**
   * Funds a Stellar account using Friendbot (Testnet only).
   * @param publicKey - The public key of the account to fund
   * @throws StellarError if funding fails or if used outside testnet
   */
  async fundWithFriendbot(publicKey: string): Promise<void> {
    const network = process.env.STELLAR_NETWORK || "testnet";

    if (network !== "testnet") {
      throw new StellarError(
        "Friendbot is only available on Stellar Testnet",
        "NETWORK_MISMATCH",
        false
      );
    }

    stellarLogger.info("Funding account with Friendbot", { publicKey });
    const startTime = Date.now();

    const friendbotUrl = `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`;

    try {
      const response = await fetch(friendbotUrl, {
        signal: AbortSignal.timeout(30000), // 30s timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new StellarError(
          `Friendbot funding failed: ${errorText}`,
          "FRIENDBOT_ERROR",
          true
        );
      }

      stellarLogger.info("Friendbot funding successful", {
        publicKey,
        duration: Date.now() - startTime,
      });
    } catch (error) {
      if (error instanceof StellarError) throw error;

      const message = error instanceof Error ? error.message : "Unknown error";
      stellarLogger.error("Friendbot funding failed", {
        publicKey,
        error: message,
        duration: Date.now() - startTime,
      });

      throw new StellarError(
        `Network error during funding: ${message}`,
        "NETWORK_ERROR",
        true
      );
    }
  }

  /**
   * Configures the event account for asset issuance:
   * - Sets AUTH_REVOCABLE and AUTH_CLAWBACK flags for compliance control
   * - Establishes USDC trustline so the account can receive payments
   * @param eventId - The event ID to configure
   * @returns Transaction hash and asset details
   */
  async setupEventAsset(eventId: string): Promise<SetupAssetResult> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new StellarError(`Event not found: ${eventId}`, "EVENT_NOT_FOUND");
    }

    if (!event.stellarPublicKey || !event.stellarSecretEncrypted) {
      throw new StellarError("Event wallet not initialized", "WALLET_NOT_INITIALIZED");
    }

    if (!event.assetCode) {
      throw new StellarError("Event asset code not set", "ASSET_NOT_SET");
    }

    stellarLogger.txStart("SETUP_ASSET", eventId, {
      assetCode: event.assetCode,
      publicKey: event.stellarPublicKey,
    });
    const startTime = Date.now();

    try {
      const server = getHorizonServer();
      const networkPassphrase = getNetworkPassphrase();
      const usdcAsset = getUSDCAsset();

      // Decrypt the secret key
      const secret = decryptSecret(event.stellarSecretEncrypted);
      const keypair = Keypair.fromSecret(secret);

      // Load the account from Horizon
      const account = await server.loadAccount(event.stellarPublicKey);

      // Build transaction with setOptions and changeTrust
      const transaction = new TransactionBuilder(account, {
        fee: "100000", // 0.01 XLM max fee
        networkPassphrase,
      })
        // Set authorization flags for compliance
        .addOperation(
          Operation.setOptions({
            setFlags: AuthRevocableFlag | AuthClawbackEnabledFlag,
          })
        )
        // Add USDC trustline so account can receive USDC payments
        .addOperation(
          Operation.changeTrust({
            asset: usdcAsset,
            limit: "10000000", // 10M USDC limit
          })
        )
        .setTimeout(30)
        .build();

      // Sign with event keypair
      transaction.sign(keypair);

      // Submit to network
      const result = await server.submitTransaction(transaction);

      stellarLogger.txSuccess(
        "SETUP_ASSET",
        eventId,
        result.hash,
        Date.now() - startTime
      );

      return {
        transactionHash: result.hash,
        assetCode: event.assetCode,
        issuer: event.stellarPublicKey,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));

      stellarLogger.txFailed("SETUP_ASSET", eventId, err, duration);

      throw new StellarError(
        `Failed to setup asset: ${err.message}`,
        "TX_FAILED",
        true
      );
    }
  }

  /**
   * Builds an atomic swap transaction for token purchase.
   * The investor sends USDC to the event, event sends tokens back.
   * Returns unsigned XDR for frontend signing.
   * @param eventId - Event ID
   * @param investorPublicKey - Investor's Stellar public key
   * @param tokenAmount - Number of tokens to purchase
   * @returns XDR string of the unsigned transaction
   */
  async buildPurchaseTransaction(
    eventId: string,
    investorPublicKey: string,
    tokenAmount: number
  ): Promise<{ xdr: string; usdcAmount: string }> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new StellarError(`Event not found: ${eventId}`, "EVENT_NOT_FOUND");
    }

    if (!event.stellarPublicKey || !event.stellarSecretEncrypted) {
      throw new StellarError("Event wallet not initialized", "WALLET_NOT_INITIALIZED");
    }

    if (!event.assetCode) {
      throw new StellarError("Event asset not configured", "ASSET_NOT_SET");
    }

    stellarLogger.info("Building purchase transaction", {
      eventId,
      investorPublicKey,
      tokenAmount,
    });

    try {
      const server = getHorizonServer();
      const networkPassphrase = getNetworkPassphrase();
      const usdcAsset = getUSDCAsset();

      // Calculate USDC cost
      const tokenPrice = Number(event.tokenPrice);
      const usdcAmount = (tokenAmount * tokenPrice).toFixed(7);

      // Event's custom asset
      const eventAsset = new Asset(event.assetCode, event.stellarPublicKey);

      // Decrypt event secret for signing
      const eventSecret = decryptSecret(event.stellarSecretEncrypted);
      const eventKeypair = Keypair.fromSecret(eventSecret);

      // Load investor account (transaction source)
      const investorAccount = await server.loadAccount(investorPublicKey);

      // Build atomic swap transaction
      // Source: Investor (pays fee and signs first)
      const transaction = new TransactionBuilder(investorAccount, {
        fee: "100000",
        networkPassphrase,
      })
        // 1. Investor sends USDC to event
        .addOperation(
          Operation.payment({
            destination: event.stellarPublicKey,
            asset: usdcAsset,
            amount: usdcAmount,
            source: investorPublicKey,
          })
        )
        // 2. Event sends tokens to investor
        .addOperation(
          Operation.payment({
            destination: investorPublicKey,
            asset: eventAsset,
            amount: tokenAmount.toFixed(7),
            source: event.stellarPublicKey,
          })
        )
        .setTimeout(300) // 5 minutes to sign
        .build();

      // Event signs its operation
      transaction.sign(eventKeypair);

      stellarLogger.info("Purchase transaction built successfully", {
        eventId,
        usdcAmount,
        tokenAmount,
      });

      // Return XDR for investor to sign
      return {
        xdr: transaction.toXDR(),
        usdcAmount,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      stellarLogger.error("Failed to build purchase transaction", {
        eventId,
        investorPublicKey,
        error: message,
      });

      throw new StellarError(
        `Failed to build transaction: ${message}`,
        "TX_BUILD_FAILED",
        true
      );
    }
  }
}

export const stellarService = new StellarService();
