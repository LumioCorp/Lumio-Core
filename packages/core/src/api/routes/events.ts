import { Router, Request, Response } from "express";
import { z } from "zod";
import {
  eventService,
  stellarService,
  investmentService,
  revenueService,
  distributionService,
} from "../../services/index.js";

export const eventsRouter = Router();

const createEventSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  fundingGoal: z.number().positive(),
  tokenPrice: z.number().positive(),
  revenueSharePct: z.number().min(0).max(100),
  organizerId: z.string().min(1),
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
 * Lists all events.
 */
eventsRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const events = await eventService.getEvents();

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
 * POST /api/events/:id/wallet
 * Initializes Stellar wallet for an event.
 */
eventsRouter.post("/:id/wallet", async (req: Request, res: Response) => {
  try {
    const { id } = eventIdSchema.parse(req.params);
    const event = await eventService.initializeWallet(id);

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

    console.error("Error initializing wallet:", error);
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
 * POST /api/events/:id/open-funding
 * Opens funding for an event.
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
  investorAddress: z.string().min(56).max(56), // Stellar public key length
  tokenAmount: z.number().positive(),
});

/**
 * POST /api/events/:id/invest
 * Generates XDR transaction for token purchase.
 * Returns unsigned XDR for investor to sign on frontend.
 */
eventsRouter.post("/:id/invest", async (req: Request, res: Response) => {
  try {
    const { id } = eventIdSchema.parse(req.params);
    const { investorAddress, tokenAmount } = investSchema.parse(req.body);

    const transaction = await investmentService.purchaseTokens({
      eventId: id,
      investorAddress,
      tokenAmount,
    });

    res.json({
      success: true,
      data: transaction,
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

    console.error("Error generating investment transaction:", error);
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
