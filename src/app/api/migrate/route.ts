import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("token") !== "migrate-pdbclad-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Area" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "icon" TEXT NOT NULL DEFAULT '📁',
        "color" TEXT NOT NULL DEFAULT '#6b7280',
        "description" TEXT,
        "order" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Subtask" (
        "id" TEXT NOT NULL,
        "milestoneId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "order" INTEGER NOT NULL DEFAULT 0,
        "completedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Subtask_pkey" PRIMARY KEY ("id")
      )
    `);

    await prisma.$executeRawUnsafe(`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "areaId" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "successDefinition" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "firstStep" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "planThisMonth" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "planThisWeek" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "planToday" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "planRightNow" TEXT`);

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Area_userId_fkey') THEN
          ALTER TABLE "Area" ADD CONSTRAINT "Area_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
      END $$
    `);

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Subtask_milestoneId_fkey') THEN
          ALTER TABLE "Subtask" ADD CONSTRAINT "Subtask_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$
    `);

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Project_areaId_fkey') THEN
          ALTER TABLE "Project" ADD CONSTRAINT "Project_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
      END $$
    `);

    return NextResponse.json({ success: true, message: "Migration complete" });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
