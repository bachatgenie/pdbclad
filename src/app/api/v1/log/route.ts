import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { XP_REWARDS, getLevelForXP } from "@/lib/gamification";
import { createHash } from "crypto";

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json({ error: "Missing x-api-key header" }, { status: 401 });
  }

  // Hash the key and look it up
  const keyHash = createHash("sha256").update(apiKey).digest("hex");
  const keyRecord = await prisma.apiKey.findFirst({
    where: { keyHash },
    include: { user: true },
  });

  if (!keyRecord) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.content) {
    return NextResponse.json({ error: "Missing content field" }, { status: 400 });
  }

  const { content, type = "log", tags = [], source = "api" } = body;

  // Extract tags from content if not provided
  const parsedTags = [...tags];
  const cleanContent = content.replace(/#(\w+)/g, (_: string, tag: string) => {
    parsedTags.push(tag);
    return "";
  }).trim();

  const xp = type === "todo" ? XP_REWARDS.COMPLETE_TODO : XP_REWARDS.LOG_ACTIVITY;

  // Create activity log
  const log = await prisma.activityLog.create({
    data: {
      userId: keyRecord.userId,
      content: cleanContent || content,
      category: type === "todo" ? "todo" : "general",
      source,
      tags: JSON.stringify(parsedTags),
      xpEarned: xp,
    },
  });

  // Update user XP
  const user = await prisma.user.update({
    where: { id: keyRecord.userId },
    data: { xp: { increment: xp } },
  });

  const newLevel = getLevelForXP(user.xp);
  if (newLevel !== user.level) {
    await prisma.user.update({
      where: { id: user.id },
      data: { level: newLevel },
    });
  }

  return NextResponse.json({
    success: true,
    xpEarned: xp,
    totalXP: user.xp,
    level: newLevel,
    logId: log.id,
  });
}
