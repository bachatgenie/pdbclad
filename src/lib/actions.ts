"use server";

import { prisma } from "./prisma";
import { auth } from "./auth";
import { getLevelForXP, XP_REWARDS } from "./gamification";
import { revalidatePath } from "next/cache";

async function getUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

async function addXP(userId: string, amount: number, content: string, category: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { xp: { increment: amount } },
  });

  const newLevel = getLevelForXP(user.xp);
  if (newLevel !== user.level) {
    await prisma.user.update({
      where: { id: userId },
      data: { level: newLevel },
    });
  }

  await prisma.activityLog.create({
    data: {
      userId,
      content,
      category,
      source: "manual",
      xpEarned: amount,
    },
  });

  return user.xp;
}

// ── Quick Log ──
export async function quickLog(formData: FormData) {
  const userId = await getUser();
  const content = formData.get("content") as string;
  if (!content?.trim()) return;

  const tags: string[] = [];
  const cleanContent = content.replace(/#(\w+)/g, (_, tag) => {
    tags.push(tag);
    return "";
  }).trim();

  await addXP(userId, XP_REWARDS.LOG_ACTIVITY, cleanContent || content, "general");

  if (tags.length > 0) {
    // Update the last activity log with tags
    const lastLog = await prisma.activityLog.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    if (lastLog) {
      await prisma.activityLog.update({
        where: { id: lastLog.id },
        data: { tags: JSON.stringify(tags) },
      });
    }
  }

  revalidatePath("/");
}

// ── Todos ──
export async function createTodo(formData: FormData) {
  const userId = await getUser();
  const title = formData.get("title") as string;
  const priority = (formData.get("priority") as string) || "medium";
  const isLifetime = formData.get("isLifetime") === "true";
  const dueDate = formData.get("dueDate") as string;

  if (!title?.trim()) return;

  await prisma.todo.create({
    data: {
      userId,
      title: title.trim(),
      priority,
      isLifetime,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });

  revalidatePath("/");
  revalidatePath("/todos");
}

export async function toggleTodo(todoId: string) {
  const userId = await getUser();
  const todo = await prisma.todo.findFirst({
    where: { id: todoId, userId },
  });
  if (!todo) return;

  const isCompleting = !todo.completedAt;

  await prisma.todo.update({
    where: { id: todoId },
    data: { completedAt: isCompleting ? new Date() : null },
  });

  if (isCompleting) {
    await addXP(userId, XP_REWARDS.COMPLETE_TODO, `Completed: ${todo.title}`, "todo");
  }

  revalidatePath("/");
  revalidatePath("/todos");
}

export async function deleteTodo(todoId: string) {
  const userId = await getUser();
  const todo = await prisma.todo.findFirst({ where: { id: todoId, userId } });
  if (!todo) return;
  await prisma.todo.delete({ where: { id: todoId } });
  revalidatePath("/");
  revalidatePath("/todos");
}

export async function updateTodo(todoId: string, data: { title?: string; priority?: string; dueDate?: string | null }) {
  const userId = await getUser();
  const todo = await prisma.todo.findFirst({ where: { id: todoId, userId } });
  if (!todo) return;

  await prisma.todo.update({
    where: { id: todoId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
    },
  });

  revalidatePath("/");
  revalidatePath("/todos");
}

// ── Habits ──

// Toggle a simple boolean habit (no unit) or log first entry for a quantity habit
export async function toggleHabitLog(habitId: string) {
  const userId = await getUser();
  const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } });
  if (!habit) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.habitLog.findUnique({
    where: { habitId_date: { habitId, date: today } },
  });

  if (existing) {
    // For boolean habits: untoggle. For quantity habits: don't delete (use logHabitValue instead)
    if (!habit.unit) {
      await prisma.habitLog.delete({ where: { id: existing.id } });
    }
  } else {
    await prisma.habitLog.create({
      data: { habitId, date: today, completed: true, value: habit.unit ? 1 : null },
    });
    await awardHabitXP(userId, habit);
    await updateHabitStreak(userId, habitId, today);
  }

  revalidatePath("/");
  revalidatePath("/habits");
}

// Log a specific value for quantity habits (e.g., +1 cup of tea, +5 minutes meditation)
export async function logHabitValue(habitId: string, amount: number, note?: string) {
  const userId = await getUser();
  const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } });
  if (!habit) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.habitLog.findUnique({
    where: { habitId_date: { habitId, date: today } },
  });

  if (existing) {
    // Increment the value
    const newValue = (existing.value || 0) + amount;
    const isComplete = habit.targetValue ? newValue >= habit.targetValue : true;
    await prisma.habitLog.update({
      where: { id: existing.id },
      data: {
        value: newValue,
        completed: isComplete,
        notes: note ? `${existing.notes ? existing.notes + "; " : ""}${note}` : existing.notes,
      },
    });

    // Award XP for each increment logged
    if (habit.type === "good") {
      await addXP(userId, 2, `${habit.title}: +${amount} ${habit.unit}`, "habit");
    } else {
      await addXP(userId, XP_REWARDS.LOG_BAD_HABIT + XP_REWARDS.LOG_BAD_HABIT_HONESTY,
        `${habit.title}: +${amount} ${habit.unit} (honesty bonus)`, "habit");
    }
  } else {
    // First log of the day
    const isComplete = habit.targetValue ? amount >= habit.targetValue : true;
    await prisma.habitLog.create({
      data: { habitId, date: today, completed: isComplete, value: amount, notes: note || null },
    });
    await awardHabitXP(userId, habit);
    await updateHabitStreak(userId, habitId, today);
  }

  revalidatePath("/");
  revalidatePath("/habits");
}

async function awardHabitXP(userId: string, habit: { type: string; title: string }) {
  if (habit.type === "good") {
    await addXP(userId, XP_REWARDS.COMPLETE_HABIT_GOOD, `Habit: ${habit.title}`, "habit");
  } else {
    const net = XP_REWARDS.LOG_BAD_HABIT + XP_REWARDS.LOG_BAD_HABIT_HONESTY;
    await addXP(userId, net, `Logged bad habit: ${habit.title} (honesty +2)`, "habit");
  }
}

async function updateHabitStreak(userId: string, habitId: string, today: Date) {
  const streak = await prisma.streak.upsert({
    where: { userId_type: { userId, type: `habit_${habitId}` } },
    create: { userId, type: `habit_${habitId}`, currentCount: 1, bestCount: 1, lastDate: today },
    update: {},
  });

  const lastDate = streak.lastDate;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (lastDate && lastDate.getTime() === yesterday.getTime()) {
    const newCount = streak.currentCount + 1;
    await prisma.streak.update({
      where: { id: streak.id },
      data: { currentCount: newCount, bestCount: Math.max(newCount, streak.bestCount), lastDate: today },
    });
  } else if (!lastDate || lastDate.getTime() !== today.getTime()) {
    await prisma.streak.update({
      where: { id: streak.id },
      data: { currentCount: 1, lastDate: today },
    });
  }
}

export async function createHabit(formData: FormData) {
  const userId = await getUser();
  const title = formData.get("title") as string;
  const type = (formData.get("type") as string) || "good";
  const icon = (formData.get("icon") as string) || "⭐";
  const unit = formData.get("unit") as string || null;
  const targetValue = formData.get("targetValue") as string;

  if (!title?.trim()) return;

  await prisma.habit.create({
    data: {
      userId,
      title: title.trim(),
      type,
      icon,
      unit: unit || null,
      targetValue: targetValue ? parseFloat(targetValue) : null,
    },
  });

  revalidatePath("/");
  revalidatePath("/habits");
}

export async function deleteHabit(habitId: string) {
  const userId = await getUser();
  const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } });
  if (!habit) return;
  await prisma.habit.delete({ where: { id: habitId } });
  revalidatePath("/");
  revalidatePath("/habits");
}

// ── Life List Progress ──
export async function incrementLifeProgress(todoId: string, amount: number = 1) {
  const userId = await getUser();
  const todo = await prisma.todo.findFirst({
    where: { id: todoId, userId, isLifetime: true },
  });
  if (!todo || !todo.progressMax) return;

  const newProgress = Math.max(0, Math.min((todo.progress || 0) + amount, todo.progressMax));
  const isComplete = newProgress >= todo.progressMax;

  await prisma.todo.update({
    where: { id: todoId },
    data: {
      progress: newProgress,
      completedAt: isComplete ? new Date() : null,
    },
  });

  await addXP(userId, XP_REWARDS.LOG_ACTIVITY,
    `${todo.title}: ${newProgress}/${todo.progressMax}`, "todo");

  if (isComplete) {
    await addXP(userId, XP_REWARDS.COMPLETE_TODO, `Life goal completed: ${todo.title}!`, "todo");
  }

  revalidatePath("/");
  revalidatePath("/todos");
}

// ── Login streak ──
export async function recordLoginStreak() {
  const userId = await getUser();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const streak = await prisma.streak.upsert({
    where: { userId_type: { userId, type: "login" } },
    create: { userId, type: "login", currentCount: 1, bestCount: 1, lastDate: today },
    update: {},
  });

  if (streak.lastDate) {
    const lastDate = new Date(streak.lastDate);
    lastDate.setHours(0, 0, 0, 0);

    if (lastDate.getTime() === today.getTime()) return streak.currentCount;

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastDate.getTime() === yesterday.getTime()) {
      const newCount = streak.currentCount + 1;
      await prisma.streak.update({
        where: { id: streak.id },
        data: {
          currentCount: newCount,
          bestCount: Math.max(newCount, streak.bestCount),
          lastDate: today,
        },
      });
      return newCount;
    }
  }

  // Streak broken or first time
  await prisma.streak.update({
    where: { id: streak.id },
    data: { currentCount: 1, lastDate: today },
  });
  return 1;
}

// ── Vault ──
export async function createVaultItem(data: {
  category: string;
  title: string;
  data: Record<string, unknown>;
  tags: string[];
  notes?: string;
  reminders?: { remindAt: string; repeat: string; message?: string }[];
}) {
  const userId = await getUser();

  const item = await prisma.vaultItem.create({
    data: {
      userId,
      category: data.category,
      title: data.title,
      data: JSON.stringify(data.data),
      tags: JSON.stringify(data.tags),
      notes: data.notes || null,
    },
  });

  if (data.reminders?.length) {
    for (const r of data.reminders) {
      await prisma.vaultReminder.create({
        data: {
          vaultItemId: item.id,
          remindAt: new Date(r.remindAt),
          repeat: r.repeat,
          message: r.message || null,
        },
      });
    }
  }

  await addXP(userId, XP_REWARDS.LOG_ACTIVITY, `Vault: Added ${data.title}`, "vault");

  revalidatePath("/");
  revalidatePath("/vault");
  return item.id;
}

export async function updateVaultItem(itemId: string, data: {
  category?: string;
  title?: string;
  data?: Record<string, unknown>;
  tags?: string[];
  notes?: string;
}) {
  const userId = await getUser();
  const item = await prisma.vaultItem.findFirst({ where: { id: itemId, userId } });
  if (!item) return;

  await prisma.vaultItem.update({
    where: { id: itemId },
    data: {
      ...(data.category !== undefined && { category: data.category }),
      ...(data.title !== undefined && { title: data.title }),
      ...(data.data !== undefined && { data: JSON.stringify(data.data) }),
      ...(data.tags !== undefined && { tags: JSON.stringify(data.tags) }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
  });

  revalidatePath("/");
  revalidatePath("/vault");
}

export async function deleteVaultItem(itemId: string) {
  const userId = await getUser();
  const item = await prisma.vaultItem.findFirst({ where: { id: itemId, userId } });
  if (!item) return;
  await prisma.vaultItem.delete({ where: { id: itemId } });
  revalidatePath("/");
  revalidatePath("/vault");
}

export async function createVaultReminder(vaultItemId: string, data: {
  remindAt: string;
  repeat: string;
  message?: string;
}) {
  const userId = await getUser();
  const item = await prisma.vaultItem.findFirst({ where: { id: vaultItemId, userId } });
  if (!item) return;

  await prisma.vaultReminder.create({
    data: {
      vaultItemId,
      remindAt: new Date(data.remindAt),
      repeat: data.repeat,
      message: data.message || null,
    },
  });

  revalidatePath("/vault");
}

export async function deleteVaultReminder(reminderId: string) {
  const userId = await getUser();
  const reminder = await prisma.vaultReminder.findFirst({
    where: { id: reminderId },
    include: { vaultItem: true },
  });
  if (!reminder || reminder.vaultItem.userId !== userId) return;
  await prisma.vaultReminder.delete({ where: { id: reminderId } });
  revalidatePath("/vault");
}
