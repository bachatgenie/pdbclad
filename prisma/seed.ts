import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";
import { createHash } from "crypto";

const prisma = new PrismaClient();

async function main() {
  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: "avadh@pdbclad.app" },
    update: {},
    create: {
      email: "avadh@pdbclad.app",
      passwordHash: hashSync("password123", 12),
      name: "Avadh",
      xp: 0,
      level: 1,
    },
  });

  console.log("Created user:", user.email);

  // Create sample todos
  const todos = [
    { title: "Review PR for auth module", priority: "high" },
    { title: "Call dentist", priority: "medium" },
    { title: "Write blog post draft", priority: "medium" },
    { title: "Set up PDBclad dashboard", priority: "low" },
  ];

  for (const t of todos) {
    await prisma.todo.create({
      data: { userId: user.id, title: t.title, priority: t.priority, dueDate: new Date() },
    });
  }

  // Life list items
  await prisma.todo.create({
    data: {
      userId: user.id,
      title: "Read 100 books",
      isLifetime: true,
      progress: 37,
      progressMax: 100,
      tags: JSON.stringify(["reading"]),
    },
  });
  await prisma.todo.create({
    data: { userId: user.id, title: "Visit Japan", isLifetime: true, tags: JSON.stringify(["travel"]) },
  });

  // Create sample habits
  const habits = [
    { title: "Meditate", type: "good", icon: "🧘" },
    { title: "Read 20 min", type: "good", icon: "📖" },
    { title: "Exercise", type: "good", icon: "🏋️" },
    { title: "Journal", type: "good", icon: "✍️" },
    { title: "Code 1hr", type: "good", icon: "💻" },
    { title: "Sugar", type: "bad", icon: "🚫" },
    { title: "Doom scroll", type: "bad", icon: "📱" },
    { title: "Late sleep", type: "bad", icon: "🌙" },
  ];

  for (const h of habits) {
    await prisma.habit.create({
      data: { userId: user.id, title: h.title, type: h.type, icon: h.icon },
    });
  }

  // Create a sample project
  const project = await prisma.project.create({
    data: {
      userId: user.id,
      title: "PDBclad Dashboard",
      description: "Build the personal dashboard for life",
      color: "#3b82f6",
      progressPct: 20,
    },
  });

  await prisma.milestone.createMany({
    data: [
      { projectId: project.id, title: "Design wireframes", order: 1, completedAt: new Date() },
      { projectId: project.id, title: "Set up project & database", order: 2 },
      { projectId: project.id, title: "Build core features", order: 3 },
      { projectId: project.id, title: "Deploy to production", order: 4 },
    ],
  });

  // Create login streak
  await prisma.streak.create({
    data: { userId: user.id, type: "login", currentCount: 1, bestCount: 1, lastDate: new Date() },
  });

  // Create an API key for the user (key: pdbclad_demo_key_123)
  const apiKey = "pdbclad_demo_key_123";
  const keyHash = createHash("sha256").update(apiKey).digest("hex");
  await prisma.apiKey.create({
    data: { userId: user.id, keyHash, label: "Demo API Key" },
  });

  console.log("Seed complete!");
  console.log("Login: avadh@pdbclad.app / password123");
  console.log("API Key: pdbclad_demo_key_123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
