/**
 * Demo Runner - Simulates the complete Lumio flow
 *
 * This script demonstrates the full lifecycle of an event:
 * 1. Create event with Stellar wallet
 * 2. Fund wallet with Friendbot
 * 3. Setup asset (flags + USDC trustline)
 * 4. Open funding
 * 5. Simulate 5 investments
 * 6. Simulate 10 ticket sales
 * 7. Show revenue stats
 *
 * Usage: npm run demo
 */

import "dotenv/config";
import { PrismaClient, EventStatus } from "@prisma/client";
import { Keypair } from "@stellar/stellar-sdk";
import { eventService } from "../services/event.service.js";
import { stellarService } from "../services/stellar.service.js";
import { investmentService } from "../services/investment.service.js";
import { revenueService } from "../services/revenue.service.js";
import { distributionService } from "../services/distribution.service.js";
import { logger } from "./logger.js";

const prisma = new PrismaClient();

// Demo configuration
const DEMO_EVENT_ID = "demo-feria-hamburguesas";
const NUM_INVESTORS = 5;
const TOKENS_PER_INVESTOR = 50; // 50 tokens * 10 USDC = 500 USDC per investor
const NUM_TICKET_SALES = 10;
const TICKET_PRICE = 15; // USDC

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function logStep(step: number, message: string): void {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`STEP ${step}: ${message}`);
  console.log("=".repeat(60));
}

function logSuccess(message: string): void {
  console.log(`  [OK] ${message}`);
}

function logInfo(message: string): void {
  console.log(`  [i] ${message}`);
}

function logError(message: string): void {
  console.log(`  [ERROR] ${message}`);
}

async function ensureOrganizerExists(): Promise<string> {
  const organizerAddress = Keypair.random().publicKey();

  const organizer = await prisma.user.upsert({
    where: { address: organizerAddress },
    update: {},
    create: {
      address: organizerAddress,
      role: "ORGANIZER",
    },
  });

  return organizer.id;
}

async function createDemoEvent(organizerId: string): Promise<string> {
  // Check if event already exists
  const existing = await prisma.event.findUnique({
    where: { id: DEMO_EVENT_ID },
  });

  if (existing && existing.status !== EventStatus.DRAFT) {
    logInfo(`Event already exists in status: ${existing.status}`);
    return existing.id;
  }

  // Delete existing if in DRAFT to start fresh
  if (existing) {
    await prisma.event.delete({ where: { id: DEMO_EVENT_ID } });
  }

  const event = await prisma.event.create({
    data: {
      id: DEMO_EVENT_ID,
      name: "Demo: Feria de Hamburguesas",
      description: "Evento de demostración para Lumio",
      fundingGoal: 2500, // 2,500 USDC goal (5 investors * 500 USDC)
      tokenPrice: 10, // 10 USDC per token
      revenueSharePct: 30, // 30% revenue share
      ticketPrice: 15,
      organizerId,
      status: EventStatus.DRAFT,
    },
  });

  logSuccess(`Created event: ${event.name}`);
  logInfo(`  Funding Goal: ${event.fundingGoal} USDC`);
  logInfo(`  Token Price: ${event.tokenPrice} USDC/token`);
  logInfo(`  Revenue Share: ${event.revenueSharePct}%`);

  return event.id;
}

async function initializeWallet(eventId: string): Promise<void> {
  const event = await eventService.initializeWallet(eventId);
  logSuccess(`Wallet created: ${event.stellarPublicKey}`);
  logInfo(`  Asset Code: ${event.assetCode}`);
}

async function fundWallet(eventId: string): Promise<void> {
  logInfo("Funding with Friendbot (this may take a few seconds)...");
  await eventService.fundEventWallet(eventId);
  logSuccess("Wallet funded with testnet XLM");
}

async function setupAsset(eventId: string): Promise<void> {
  logInfo("Setting up asset flags and USDC trustline...");
  const result = await stellarService.setupEventAsset(eventId);
  logSuccess(`Asset configured: ${result.assetCode}`);
  logInfo(`  Transaction: ${result.transactionHash}`);
}

async function openFunding(eventId: string): Promise<void> {
  await eventService.openFunding(eventId);
  logSuccess("Funding is now OPEN");
}

async function simulateInvestments(eventId: string): Promise<void> {
  logInfo(`Simulating ${NUM_INVESTORS} investments...`);

  for (let i = 1; i <= NUM_INVESTORS; i++) {
    const investorKeypair = Keypair.random();
    const investorAddress = investorKeypair.publicKey();

    // Record the investment directly (simulating post-transaction)
    const usdcPaid = TOKENS_PER_INVESTOR * 10; // 10 USDC per token

    await investmentService.recordInvestment(
      eventId,
      investorAddress,
      TOKENS_PER_INVESTOR,
      usdcPaid,
      `demo_tx_invest_${i}_${Date.now()}`
    );

    logSuccess(`Investment ${i}: ${TOKENS_PER_INVESTOR} tokens (${usdcPaid} USDC)`);
    await sleep(100);
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  logInfo(`Total tokens issued: ${event?.totalTokensIssued}`);
  logInfo(`Event status: ${event?.status}`);
}

async function simulateTicketSales(eventId: string): Promise<void> {
  logInfo(`Simulating ${NUM_TICKET_SALES} ticket sales...`);

  // Set event to LIVE first
  await prisma.event.update({
    where: { id: eventId },
    data: { status: EventStatus.LIVE },
  });

  for (let i = 1; i <= NUM_TICKET_SALES; i++) {
    const buyerAddress = Keypair.random().publicKey();

    await revenueService.recordTicketSale({
      eventId,
      buyerAddress,
      usdcPaid: TICKET_PRICE,
      stellarTxHash: `demo_tx_ticket_${i}_${Date.now()}`,
    });

    logSuccess(`Ticket ${i} sold: ${TICKET_PRICE} USDC`);
    await sleep(50);
  }
}

async function showRevenueStats(eventId: string): Promise<void> {
  const stats = await revenueService.getRevenueStats(eventId);

  console.log("\n  Revenue Statistics:");
  console.log(`  -------------------`);
  console.log(`  Total Revenue: ${stats.totalRevenue} USDC`);
  console.log(`  Tickets Sold: ${stats.ticketsSold}`);
  console.log(`  Revenue Share: ${stats.revenueSharePct}%`);
  console.log(`  Distributable: ${stats.distributableAmount.toFixed(2)} USDC`);
  console.log(`  Tokens Issued: ${stats.tokensIssued}`);
  console.log(`  Payout/Token: ${stats.payoutPerToken.toFixed(4)} USDC`);
}

async function showPayoutPreview(eventId: string): Promise<void> {
  try {
    const calculation = await distributionService.calculatePayout(eventId);

    console.log("\n  Payout Preview:");
    console.log(`  ----------------`);
    console.log(`  Total to distribute: ${calculation.distributableAmount.toFixed(2)} USDC`);
    console.log(`  Payout per token: ${calculation.payoutPerToken.toFixed(4)} USDC`);
    console.log(`  Number of holders: ${calculation.holders.length}`);

    if (calculation.holders.length > 0) {
      console.log("\n  Sample payouts:");
      calculation.holders.slice(0, 3).forEach((h, i) => {
        console.log(`    Holder ${i + 1}: ${h.tokenBalance} tokens = ${h.usdcPayout.toFixed(2)} USDC`);
      });
    }
  } catch (error) {
    logInfo("Payout preview not available (no on-chain holders in demo mode)");
  }
}

async function runDemo(): Promise<void> {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║           LUMIO DEMO RUNNER - Full Flow Simulation         ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  try {
    // Step 1: Create organizer and event
    logStep(1, "Creating Demo Event");
    const organizerId = await ensureOrganizerExists();
    const eventId = await createDemoEvent(organizerId);

    // Step 2: Initialize Stellar wallet
    logStep(2, "Initializing Stellar Wallet");
    await initializeWallet(eventId);

    // Step 3: Fund with Friendbot
    logStep(3, "Funding Wallet (Testnet)");
    await fundWallet(eventId);

    // Step 4: Setup asset
    logStep(4, "Configuring Asset & USDC Trustline");
    await setupAsset(eventId);

    // Step 5: Open funding
    logStep(5, "Opening Funding");
    await openFunding(eventId);

    // Step 6: Simulate investments
    logStep(6, "Simulating Investments");
    await simulateInvestments(eventId);

    // Step 7: Simulate ticket sales
    logStep(7, "Simulating Ticket Sales");
    await simulateTicketSales(eventId);

    // Step 8: Show revenue stats
    logStep(8, "Revenue Statistics");
    await showRevenueStats(eventId);

    // Step 9: Payout preview
    logStep(9, "Distribution Preview");
    await showPayoutPreview(eventId);

    // Summary
    console.log("\n");
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║                    DEMO COMPLETED                          ║");
    console.log("╚════════════════════════════════════════════════════════════╝");
    console.log("\nThe demo event is ready for the frontend team.");
    console.log("Event ID:", eventId);
    console.log("\nAPI endpoints to test:");
    console.log(`  GET  http://localhost:3000/api/events/${eventId}`);
    console.log(`  GET  http://localhost:3000/api/events/${eventId}/revenue`);
    console.log(`  GET  http://localhost:3000/api/events/${eventId}/payout-preview`);
    console.log(`  POST http://localhost:3000/api/events/${eventId}/distribute`);
  } catch (error) {
    console.error("\nDemo failed:", error);
    process.exit(1);
  }
}

// Run the demo
runDemo()
  .catch((error) => {
    logger.error("Demo runner failed", { error: error.message });
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
