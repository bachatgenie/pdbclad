import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    const user = await prisma.user.findFirst({
      select: { email: true, id: true },
    });
    return NextResponse.json({
      ok: true,
      userCount,
      firstUser: user?.email ?? "none",
      dbUrl: process.env.DATABASE_URL?.slice(0, 40) + "...",
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
