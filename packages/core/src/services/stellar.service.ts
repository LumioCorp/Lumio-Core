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
import { logger } from "../lib/logger.js";
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
   * Generates a new Stellar keypair for token issuance.
   * This wallet is used ONLY for issuing custom tokens — it does NOT custody investor funds.
   * The secret key is encrypted before being returned.
   */
  createTokenIssuerWallet(): EventWallet {
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

    logger.info("Funding account with Friendbot", { publicKey });
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

      logger.info("Friendbot funding successful", {
        publicKey,
        duration: Date.now() - startTime,
      });
    } catch (error) {
      if (error instanceof StellarError) throw error;

      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Friendbot funding failed", {
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

    logger.txStart("SETUP_ASSET", eventId, {
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
            setFlags: (AuthRevocableFlag | AuthClawbackEnabledFlag) as number as typeof AuthRevocableFlag,
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

      logger.txSuccess(
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

      logger.txFailed("SETUP_ASSET", eventId, err, duration);

      throw new StellarError(
        `Failed to setup asset: ${err.message}`,
        "TX_FAILED",
        true
      );
    }
  }

  /**
   * Issues custom tokens to an investor after they have funded the TW escrow.
   * The issuer wallet signs and submits a Payment operation.
   * @param eventId - Event ID
   * @param investorPublicKey - Investor's Stellar public key
   * @param tokenAmount - Number of tokens to issue
   * @returns Transaction hash of the token issuance
   */
  async issueTokensToInvestor(
    eventId: string,
    investorPublicKey: string,
    tokenAmount: number
  ): Promise<{ txHash: string }> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new StellarError(`Event not found: ${eventId}`, "EVENT_NOT_FOUND");
    }

    if (!event.stellarPublicKey || !event.stellarSecretEncrypted) {
      throw new StellarError("Token issuer wallet not initialized", "WALLET_NOT_INITIALIZED");
    }

    if (!event.assetCode) {
      throw new StellarError("Event asset not configured", "ASSET_NOT_SET");
    }

    logger.info("Issuing tokens to investor", {
      eventId,
      investorPublicKey,
      tokenAmount,
    });

    try {
      const server = getHorizonServer();
      const networkPassphrase = getNetworkPassphrase();

      // Decrypt issuer secret
      const secret = decryptSecret(event.stellarSecretEncrypted);
      const issuerKeypair = Keypair.fromSecret(secret);

      // Event's custom asset
      const eventAsset = new Asset(event.assetCode, event.stellarPublicKey);

      // Load issuer account
      const issuerAccount = await server.loadAccount(event.stellarPublicKey);

      // Build token issuance transaction
      const transaction = new TransactionBuilder(issuerAccount, {
        fee: "100000",
        networkPassphrase,
      })
        .addOperation(
          Operation.payment({
            destination: investorPublicKey,
            asset: eventAsset,
            amount: tokenAmount.toFixed(7),
          })
        )
        .setTimeout(30)
        .build();

      // Sign with issuer keypair
      transaction.sign(issuerKeypair);

      // Submit to network
      const result = await server.submitTransaction(transaction);

      logger.info("Tokens issued successfully", {
        eventId,
        investorPublicKey,
        tokenAmount,
        txHash: result.hash,
      });

      return { txHash: result.hash };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error("Failed to issue tokens", {
        eventId,
        investorPublicKey,
        error: message,
      });

      throw new StellarError(
        `Failed to issue tokens: ${message}`,
        "TX_FAILED",
        true
      );
    }
  }

  /**
   * Builds an unsigned XDR for transferring USDC from a buyer to the event wallet.
   * The buyer signs this XDR client-side via their connected wallet.
   */
  async buildTicketPaymentXdr(
    eventId: string,
    buyerAddress: string,
    usdcAmount: number
  ): Promise<{ xdr: string; destinationAddress: string }> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new StellarError(`Event not found: ${eventId}`, "EVENT_NOT_FOUND");
    }

    if (!event.stellarPublicKey) {
      throw new StellarError("Event wallet not initialized", "WALLET_NOT_INITIALIZED");
    }

    logger.info("Building ticket payment XDR", {
      eventId,
      buyerAddress,
      usdcAmount,
      destination: event.stellarPublicKey,
    });

    try {
      const server = getHorizonServer();
      const networkPassphrase = getNetworkPassphrase();
      const usdcAsset = getUSDCAsset();

      const buyerAccount = await server.loadAccount(buyerAddress);

      const transaction = new TransactionBuilder(buyerAccount, {
        fee: "100000",
        networkPassphrase,
      })
        .addOperation(
          Operation.payment({
            destination: event.stellarPublicKey,
            asset: usdcAsset,
            amount: usdcAmount.toFixed(7),
          })
        )
        .setTimeout(120)
        .build();

      const xdr = transaction.toXDR();

      return { xdr, destinationAddress: event.stellarPublicKey };
    } catch (error) {
      if (error instanceof StellarError) throw error;

      const message = error instanceof Error ? error.message : String(error);
      logger.error("Failed to build ticket payment XDR", {
        eventId,
        buyerAddress,
        error: message,
      });

      throw new StellarError(
        `Failed to build payment transaction: ${message}`,
        "TX_BUILD_FAILED",
        true
      );
    }
  }
}

export const stellarService = new StellarService();
