import { PrismaClient, UserRole, EventStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create organizer
  const organizer = await prisma.user.upsert({
    where: { address: "GDEMO_ORGANIZER_ADDRESS_PLACEHOLDER_56CHARS" },
    update: {},
    create: {
      address: "GDEMO_ORGANIZER_ADDRESS_PLACEHOLDER_56CHARS",
      role: UserRole.ORGANIZER,
    },
  });
  console.log(`Created organizer: ${organizer.id}`);

  // Create demo event: Feria de Hamburguesas
  const demoEvent = await prisma.event.upsert({
    where: { id: "demo-feria-hamburguesas" },
    update: {},
    create: {
      id: "demo-feria-hamburguesas",
      name: "Demo: Feria de Hamburguesas",
      description:
        "La mejor feria gastronómica de la ciudad. 20 puestos de hamburguesas artesanales, música en vivo, y zona de food trucks. Financiado colectivamente por la comunidad.",
      fundingGoal: 10000, // 10,000 USDC
      tokenPrice: 10, // 10 USDC per token
      revenueSharePct: 30, // 30% of revenue goes to investors
      ticketPrice: 15, // 15 USDC per ticket
      status: EventStatus.DRAFT,
      organizerId: organizer.id,
    },
  });
  console.log(`Created event: ${demoEvent.name} (${demoEvent.id})`);

  // Create sample investors
  const investors = [
    {
      address: "GINVESTOR1_PLACEHOLDER_ADDRESS_56CHARACTERS",
      name: "Investor 1",
    },
    {
      address: "GINVESTOR2_PLACEHOLDER_ADDRESS_56CHARACTERS",
      name: "Investor 2",
    },
    {
      address: "GINVESTOR3_PLACEHOLDER_ADDRESS_56CHARACTERS",
      name: "Investor 3",
    },
    {
      address: "GINVESTOR4_PLACEHOLDER_ADDRESS_56CHARACTERS",
      name: "Investor 4",
    },
    {
      address: "GINVESTOR5_PLACEHOLDER_ADDRESS_56CHARACTERS",
      name: "Investor 5",
    },
  ];

  for (const inv of investors) {
    await prisma.user.upsert({
      where: { address: inv.address },
      update: {},
      create: {
        address: inv.address,
        role: UserRole.INVESTOR,
      },
    });
  }
  console.log(`Created ${investors.length} sample investors`);

  console.log("\nSeed data summary:");
  console.log("==================");
  console.log(`Event: ${demoEvent.name}`);
  console.log(`  - Funding Goal: ${demoEvent.fundingGoal} USDC`);
  console.log(`  - Token Price: ${demoEvent.tokenPrice} USDC`);
  console.log(`  - Revenue Share: ${demoEvent.revenueSharePct}%`);
  console.log(`  - Ticket Price: ${demoEvent.ticketPrice} USDC`);
  console.log(`  - Status: ${demoEvent.status}`);
  console.log(`  - Total Tokens Available: ${Number(demoEvent.fundingGoal) / Number(demoEvent.tokenPrice)}`);
  console.log("\nTo continue with demo flow:");
  console.log("  1. npm run dev");
  console.log("  2. npx tsx src/lib/demo-runner.ts");
  console.log("\nSeeding complete!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
