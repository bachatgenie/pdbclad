import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: "avadh@pdbclad.app" } });
  if (!user) {
    console.log("User not found. Run the main seed first.");
    return;
  }

  // Subscriptions
  const subs = [
    {
      title: "Claude Pro",
      data: { provider: "Anthropic", plan: "Pro", cost: "20", currency: "USD", billing_cycle: "monthly", next_billing: "2026-04-18", login_url: "console.anthropic.com" },
      tags: ["ai", "llm", "tools"],
      notes: "Using for coding + writing",
      reminderDays: 3,
    },
    {
      title: "ChatGPT Plus",
      data: { provider: "OpenAI", plan: "Plus", cost: "20", currency: "USD", billing_cycle: "monthly", next_billing: "2026-04-20", login_url: "chat.openai.com" },
      tags: ["ai", "llm", "tools"],
      reminderDays: 3,
    },
    {
      title: "Spotify Premium",
      data: { provider: "Spotify", plan: "Premium Individual", cost: "10.99", currency: "USD", billing_cycle: "monthly", next_billing: "2026-04-05" },
      tags: ["music", "entertainment"],
      reminderDays: 1,
    },
    {
      title: "Netflix Standard",
      data: { provider: "Netflix", plan: "Standard", cost: "15.99", currency: "USD", billing_cycle: "monthly", next_billing: "2026-04-01" },
      tags: ["entertainment"],
      reminderDays: 3,
    },
    {
      title: "GitHub Pro",
      data: { provider: "GitHub", plan: "Pro", cost: "4", currency: "USD", billing_cycle: "monthly", next_billing: "2026-04-08" },
      tags: ["dev", "tools"],
      reminderDays: 1,
    },
  ];

  for (const sub of subs) {
    const item = await prisma.vaultItem.create({
      data: {
        userId: user.id,
        category: "subscription",
        title: sub.title,
        data: JSON.stringify(sub.data),
        tags: JSON.stringify(sub.tags),
        notes: sub.notes || null,
      },
    });

    // Add reminder before next billing
    const nextBilling = new Date(sub.data.next_billing);
    const remindAt = new Date(nextBilling);
    remindAt.setDate(remindAt.getDate() - sub.reminderDays);

    await prisma.vaultReminder.create({
      data: {
        vaultItemId: item.id,
        remindAt,
        repeat: "monthly",
        message: `${sub.title} renews in ${sub.reminderDays} days`,
      },
    });
  }

  // Insurance
  const insurance = await prisma.vaultItem.create({
    data: {
      userId: user.id,
      category: "insurance",
      title: "Car Insurance — ICICI Lombard",
      data: JSON.stringify({
        provider: "ICICI Lombard",
        policy_number: "IL-AUTO-2025-78342",
        type: "auto",
        premium: "18500",
        start_date: "2025-06-15",
        end_date: "2026-06-15",
        coverage_amount: "8,00,000",
        agent_contact: "Rajesh - 98765-43210",
      }),
      tags: JSON.stringify(["car", "insurance"]),
      notes: "Includes zero depreciation add-on",
    },
  });

  await prisma.vaultReminder.create({
    data: {
      vaultItemId: insurance.id,
      remindAt: new Date("2026-05-15"),
      repeat: "yearly",
      message: "Car insurance expires in 30 days — start comparing quotes",
    },
  });

  // Finance
  await prisma.vaultItem.create({
    data: {
      userId: user.id,
      category: "finance",
      title: "HDFC Credit Card",
      data: JSON.stringify({
        bank: "HDFC Bank",
        card_type: "credit",
        last_four: "4832",
        due_date: "25th of every month",
        credit_limit: "2,00,000",
        statement_date: "5th of every month",
      }),
      tags: JSON.stringify(["finance", "credit"]),
    },
  });

  // Vehicle
  await prisma.vaultItem.create({
    data: {
      userId: user.id,
      category: "vehicle",
      title: "Honda City",
      data: JSON.stringify({
        make: "Honda",
        model: "City",
        year: "2022",
        plate: "MH-02-AB-1234",
        last_service_date: "2026-02-15",
        last_service_km: "12340",
        next_service_due: "2026-05-15",
      }),
      tags: JSON.stringify(["car"]),
      notes: "Next service at 15,000 km",
    },
  });

  // Document
  await prisma.vaultItem.create({
    data: {
      userId: user.id,
      category: "document",
      title: "Passport",
      data: JSON.stringify({
        document_type: "passport",
        document_number: "J8765432",
        issued_date: "2020-03-15",
        expiry_date: "2030-03-14",
        issuing_authority: "Govt of India",
      }),
      tags: JSON.stringify(["travel", "id"]),
    },
  });

  console.log("Vault seed complete! Added subscriptions, insurance, finance, vehicle, document.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
