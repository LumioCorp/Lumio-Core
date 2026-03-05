import { Router, Request, Response } from "express";
import { z } from "zod";
import {
  eventService,
  stellarService,
  investmentService,
  revenueService,
  distributionService,
} from "../../services/index.js";
import {
  LUMIO_PLATFORM_ADDRESS,
  LUMIO_BACKEND_ADDRESS,
  LUMIO_PLATFORM_FEE,
  USDC_TESTNET_ISSUER,
} from "../../lib/platform.js";

export const eventsRouter = Router();

const createEventSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  fundingGoal: z.number().positive(),
  tokenPrice: z.number().positive(),
  revenueSharePct: z.number().min(0).max(100),
  organizerId: z.string().min(1),
  organizerAddress: z.string().min(56).max(56).optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  eventDate: z.string().optional(),
  fundingDeadline: z.string().optional(),
  ticketPrice: z.number().positive().optional(),
  imageUrl: z.string().optional(),
});

const eventIdSchema = z.object({
  id: z.string().min(1),
});

/**
 * POST /api/events
 * Creates a new event in DRAFT status.
 */
eventsRouter.post("/", async (req: Request, res: Response) => {
  try {
    const input = createEventSchema.parse(req.body);
    const event = await eventService.createEvent(input);

    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors,
      });
      return;
    }

    console.error("Error creating event:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /api/events
 * Lists all events. Supports ?organizerAddress=G... and ?status=FUNDING_OPEN filters.
 */
eventsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const { organizerAddress, status } = req.query;
    const events = await eventService.getEvents({
      organizerAddress: organizerAddress as string | undefined,
      status: status as any,
    });

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Error listing events:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /api/events/:id
 * Retrieves a single event by ID.
 */
eventsRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = eventIdSchema.parse(req.params);
    const event = await eventService.getEvent(id);

    if (!event) {
      res.status(404).json({
        success: false,
        error: "Event not found",
      });
      return;
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("Error getting event:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /api/events/:id/full
 * Retrieves event with all relations (investments, distributions, tickets, organizer).
 */
eventsRouter.get("/:id/full", async (req: Request, res: Response) => {
  try {
    const { id } = eventIdSchema.parse(req.params);
    const event = await eventService.getEventFull(id);

    if (!event) {
      res.status(404).json({
        success: false,
        error: "Event not found",
      });
      return;
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("Error getting full event:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * POST /api/events/:id/token-issuer
 * Initializes the token issuer wallet for an event.
 */
eventsRouter.post("/:id/token-issuer", async (req: Request, res: Response) => {
  try {
    const { id } = eventIdSchema.parse(req.params);
    const event = await eventService.initializeTokenIssuer(id);

    res.json({
      success: true,
      data: {
        id: event.id,
        stellarPublicKey: event.stellarPublicKey,
        assetCode: event.assetCode,
        status: event.status,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    console.error("Error initializing token issuer:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * POST /api/events/:id/fund
 * Funds event wallet with Friendbot (testnet only).
 */
eventsRouter.post("/:id/fund", async (req: Request, res: Response) => {
  try {
    const { id } = eventIdSchema.parse(req.params);
    await eventService.fundEventWallet(id);

    res.json({
      success: true,
      message: "Wallet funded successfully",
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    console.error("Error funding wallet:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * POST /api/events/:id/escrow
 * Registers a TW escrow contract for an event.
 * Called after the frontend deploys the escrow via TW SDK.
 */
eventsRouter.post("/:id/escrow", async (req: Request, res: Response) => {
  try {
    const { id } = eventIdSchema.parse(req.params);
    const { escrowContractId } = z
      .object({ escrowContractId: z.string().min(1) })
      .parse(req.body);

    const event = await eventService.registerEscrow(id, escrowContractId);

    res.json({
      success: true,
      data: {
        id: event.id,
        escrowContractId: event.escrowContractId,
        escrowStatus: event.escrowStatus,
        status: event.status,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors,
      });
      return;
    }

    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    console.error("Error registering escrow:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * PATCH /api/events/:id/escrow-status
 * Updates the escrow status field on the event.
 */
eventsRouter.patch("/:id/escrow-status", async (req: Request, res: Response) => {
  try {
    const { id } = eventIdSchema.parse(req.params);
    const { escrowStatus } = z
      .object({ escrowStatus: z.string().min(1) })
      .parse(req.body);

    const event = await eventService.updateEscrowStatus(id, escrowStatus);

    res.json({
      success: true,
      data: {
        id: event.id,
        escrowStatus: event.escrowStatus,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    console.error("Error updating escrow status:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /api/events/:id/escrow-config
 * Returns the deploy configuration for the TW escrow.
 * Frontend uses this payload with the TW SDK to deploy the escrow.
 */
eventsRouter.get("/:id/escrow-config", async (req: Request, res: Response) => {
  try {
    const { id } = eventIdSchema.parse(req.params);
    const event = await eventService.getEvent(id);

    if (!event) {
      res.status(404).json({
        success: false,
        error: "Event not found",
      });
      return;
    }

    const organizerAddr = event.organizerAddress || "";

    res.json({
      success: true,
      data: {
        title: event.name,
        description: event.description || "",
        amount: Number(event.fundingGoal).toFixed(7),
        platformFee: LUMIO_PLATFORM_FEE,
        roles: {
          approver: LUMIO_BACKEND_ADDRESS,
          serviceProvider: organizerAddr,
          platformAddress: LUMIO_PLATFORM_ADDRESS,
          releaseSigner: LUMIO_BACKEND_ADDRESS,
          disputeResolver: LUMIO_PLATFORM_ADDRESS,
          receiver: organizerAddr,
        },
        trustline: {
          address: USDC_TESTNET_ISSUER,
          decimals: 7,
        },
        milestones: [
          { description: "Event executed and revenue collected" },
        ],
      },
    });
  } catch (error) {
    console.error("Error getting escrow config:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * POST /api/events/:id/open-funding
 * Opens funding for an event. Requires ESCROW_DEPLOYED status.
 */
eventsRouter.post("/:id/open-funding", async (req: Request, res: Response) => {
  try {
    const { id } = eventIdSchema.parse(req.params);
    const event = await eventService.openFunding(id);

    res.json({
      success: true,
      data: {
        id: event.id,
        status: event.status,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    console.error("Error opening funding:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * POST /api/events/:id/setup-asset
 * Configures Stellar asset flags and USDC trustline.
 */
eventsRouter.post("/:id/setup-asset", async (req: Request, res: Response) => {
  try {
    const { id } = eventIdSchema.parse(req.params);
    const result = await stellarService.setupEventAsset(id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    console.error("Error setting up asset:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

const investSchema = z.object({
  investorAddress: z.string().min(56).max(56),
  tokenAmount: z.number().positive(),
  usdcPaid: z.number().positive(),
  escrowFundingTxHash: z.string().min(1),
});

/**
 * POST /api/events/:id/invest
 * Records an investment and issues tokens to the investor.
 * Called after the frontend has funded the TW escrow with USDC.
 */
eventsRouter.post("/:id/invest", async (req: Request, res: Response) => {
  try {
    const { id } = eventIdSchema.parse(req.params);
    const { investorAddress, tokenAmount, usdcPaid, escrowFundingTxHash } =
      investSchema.parse(req.body);

    const result = await investmentService.recordInvestmentAndIssueTokens({
      eventId: id,
      investorAddress,
      tokenAmount,
      usdcPaid,
      escrowFundingTxHash,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors,
      });
      return;
    }

    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    console.error("Error recording investment:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * POST /api/events/:id/mark-live
 * Transitions event from FUNDED to LIVE.
 */
eventsRouter.post("/:id/mark-live", async (req: Request, res: Response) => {
  try {
    const { id } = eventIdSchema.parse(req.params);
    const event = await eventService.markEventLive(id);

    res.json({
      success: true,
      data: {
        id: event.id,
        status: event.status,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    console.error("Error marking event live:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /api/events/:id/revenue
 * Gets revenue statistics for an event.
 */
eventsRouter.get("/:id/revenue", async (req: Request, res: Response) => {
  try {
    const { id } = eventIdSchema.parse(req.params);
    const stats = await revenueService.getRevenueStats(id);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    console.error("Error getting revenue stats:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * POST /api/events/:id/distribute
 * Executes revenue distribution to all token holders.
 */
eventsRouter.post("/:id/distribute", async (req: Request, res: Response) => {
  try {
    const { id } = eventIdSchema.parse(req.params);
    const result = await distributionService.executeDistribution(id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    console.error("Error executing distribution:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /api/events/:id/payout-preview
 * Preview payout calculation before executing distribution.
 */
eventsRouter.get("/:id/payout-preview", async (req: Request, res: Response) => {
  try {
    const { id } = eventIdSchema.parse(req.params);
    const calculation = await distributionService.calculatePayout(id);

    res.json({
      success: true,
      data: calculation,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    console.error("Error calculating payout:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /api/events/:id/distributions
 * Gets distribution history for an event.
 */
eventsRouter.get("/:id/distributions", async (req: Request, res: Response) => {
  try {
    const { id } = eventIdSchema.parse(req.params);
    const distributions = await distributionService.getDistributions(id);

    res.json({
      success: true,
      data: distributions,
    });
  } catch (error) {
    console.error("Error getting distributions:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /api/events/:id/investments
 * Gets all investments for an event.
 */
eventsRouter.get("/:id/investments", async (req: Request, res: Response) => {
  try {
    const { id } = eventIdSchema.parse(req.params);
    const investments = await investmentService.getEventInvestments(id);

    res.json({
      success: true,
      data: investments,
    });
  } catch (error) {
    console.error("Error getting investments:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * POST /api/events/:id/ticket
 * Records a ticket sale.
 */
eventsRouter.post("/:id/ticket", async (req: Request, res: Response) => {
  try {
    const { id } = eventIdSchema.parse(req.params);
    const { buyerAddress, usdcPaid, stellarTxHash } = z
      .object({
        buyerAddress: z.string().min(56).max(56),
        usdcPaid: z.number().positive(),
        stellarTxHash: z.string().optional(),
      })
      .parse(req.body);

    const ticket = await revenueService.recordTicketSale({
      eventId: id,
      buyerAddress,
      usdcPaid,
      stellarTxHash,
    });

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors,
      });
      return;
    }

    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    console.error("Error recording ticket sale:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * POST /api/events/:id/build-ticket-tx
 * Builds an unsigned XDR for a USDC ticket payment from buyer to event wallet.
 */
const buildTicketTxSchema = z.object({
  buyerAddress: z.string().min(56).max(56),
  ticketCount: z.number().int().positive(),
});

eventsRouter.post("/:id/build-ticket-tx", async (req: Request, res: Response) => {
  try {
    const { id } = eventIdSchema.parse(req.params);
    const { buyerAddress, ticketCount } = buildTicketTxSchema.parse(req.body);

    const event = await eventService.getEvent(id);

    if (!event) {
      res.status(404).json({
        success: false,
        error: "Event not found",
      });
      return;
    }

    if (!event.ticketPrice) {
      res.status(400).json({
        success: false,
        error: "Event does not have a ticket price",
      });
      return;
    }

    const usdcAmount = Number(event.ticketPrice) * ticketCount;

    const { xdr, destinationAddress } =
      await stellarService.buildTicketPaymentXdr(id, buyerAddress, usdcAmount);

    res.json({
      success: true,
      data: { xdr, destinationAddress, usdcAmount },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors,
      });
      return;
    }

    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    console.error("Error building ticket tx:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});
