"use server";

import { prisma } from "./prisma";
import { auth } from "./auth";
import { getLevelForXP, XP_REWARDS } from "./gamification";
import { revalidatePath } from "next/cache";

function handleDbError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("database") || msg.includes("prisma")) return "Database error. Please try again.";
    return error.message;
  }
  return "An error occurred. Please try again.";
}

async function getUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

async function addXP(userId: string, amount: number, content: string, category: string) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: amount } },
    });
    const newLevel = getLevelForXP(user.xp);
    if (newLevel !== user.level) {
      await prisma.user.update({ where: { id: userId }, data: { level: newLevel } });
    }
    await prisma.activityLog.create({
      data: { userId, content, category, source: "manual", xpEarned: amount },
    });
    return user.xp;
  } catch (error) {
    console.error("Error adding XP:", error);
    throw new Error(handleDbError(error));
  }
}

// ── Quick Log ──
export async function quickLog(formData: FormData) {
  try {
    const userId = await getUser();
    const content = formData.get("content") as string;
    if (!content?.trim()) return;
    const tags: string[] = [];
    const cleanContent = content.replace(/#(\w+)/g, (_, tag) => { tags.push(tag); return ""; }).trim();
    await addXP(userId, XP_REWARDS.LOG_ACTIVITY, cleanContent || content, "general");
    if (tags.length > 0) {
      const lastLog = await prisma.activityLog.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
      if (lastLog) await prisma.activityLog.update({ where: { id: lastLog.id }, data: { tags: JSON.stringify(tags) } });
    }
    revalidatePath("/");
  } catch (error) {
    console.error("Error in quickLog:", error);
    throw new Error(handleDbError(error));
  }
}

// ── Todos ──
export async function createTodo(formData: FormData) {
  try {
    const userId = await getUser();
    const title = formData.get("title") as string;
    const priority = (formData.get("priority") as string) || "medium";
    const isLifetime = formData.get("isLifetime") === "true";
    const dueDate = formData.get("dueDate") as string;
    if (!title?.trim()) return;
    await prisma.todo.create({
      data: { userId, title: title.trim(), priority, isLifetime, dueDate: dueDate ? new Date(dueDate) : null },
    });
    revalidatePath("/"); revalidatePath("/todos");
  } catch (error) { console.error("Error creating todo:", error); throw new Error(handleDbError(error)); }
}

export async function toggleTodo(todoId: string) {
  try {
    const userId = await getUser();
    const todo = await prisma.todo.findFirst({ where: { id: todoId, userId } });
    if (!todo) return;
    const isCompleting = !todo.completedAt;
    await prisma.todo.update({ where: { id: todoId }, data: { completedAt: isCompleting ? new Date() : null } });
    if (isCompleting) await addXP(userId, XP_REWARDS.COMPLETE_TODO, `Completed: ${todo.title}`, "todo");
    revalidatePath("/"); revalidatePath("/todos");
  } catch (error) { console.error("Error toggling todo:", error); throw new Error(handleDbError(error)); }
}

export async function deleteTodo(todoId: string) {
  try {
    const userId = await getUser();
    const todo = await prisma.todo.findFirst({ where: { id: todoId, userId } });
    if (!todo) return;
    await prisma.todo.delete({ where: { id: todoId } });
    revalidatePath("/"); revalidatePath("/todos");
  } catch (error) { console.error("Error deleting todo:", error); throw new Error(handleDbError(error)); }
}

export async function updateTodo(todoId: string, data: { title?: string; priority?: string; dueDate?: string | null }) {
  try {
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
    revalidatePath("/"); revalidatePath("/todos");
  } catch (error) { console.error("Error updating todo:", error); throw new Error(handleDbError(error)); }
}

// ── Habits ──
export async function toggleHabitLog(habitId: string) {
  try {
    const userId = await getUser();
    const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } });
    if (!habit) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const existing = await prisma.habitLog.findUnique({ where: { habitId_date: { habitId, date: today } } });
    if (existing) {
      if (!habit.unit) await prisma.habitLog.delete({ where: { id: existing.id } });
    } else {
      await prisma.habitLog.create({ data: { habitId, date: today, completed: true, value: habit.unit ? 1 : null } });
      await awardHabitXP(userId, habit);
      await updateHabitStreak(userId, habitId, today);
    }
    revalidatePath("/"); revalidatePath("/habits");
  } catch (error) { console.error("Error toggling habit log:", error); throw new Error(handleDbError(error)); }
}

export async function logHabitValue(habitId: string, amount: number, note?: string) {
  try {
    const userId = await getUser();
    const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } });
    if (!habit) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const existing = await prisma.habitLog.findUnique({ where: { habitId_date: { habitId, date: today } } });
    if (existing) {
      const newValue = (existing.value || 0) + amount;
      const isComplete = habit.targetValue ? newValue >= habit.targetValue : true;
      await prisma.habitLog.update({
        where: { id: existing.id },
        data: { value: newValue, completed: isComplete, notes: note ? `${existing.notes ? existing.notes + "; " : ""}${note}` : existing.notes },
      });
      if (habit.type === "good") await addXP(userId, 2, `${habit.title}: +${amount} ${habit.unit}`, "habit");
      else await addXP(userId, XP_REWARDS.LOG_BAD_HABIT + XP_REWARDS.LOG_BAD_HABIT_HONESTY, `${habit.title}: +${amount} ${habit.unit}`, "habit");
    } else {
      const isComplete = habit.targetValue ? amount >= habit.targetValue : true;
      await prisma.habitLog.create({ data: { habitId, date: today, completed: isComplete, value: amount, notes: note || null } });
      await awardHabitXP(userId, habit);
      await updateHabitStreak(userId, habitId, today);
    }
    revalidatePath("/"); revalidatePath("/habits");
  } catch (error) { console.error("Error logging habit value:", error); throw new Error(handleDbError(error)); }
}

async function awardHabitXP(userId: string, habit: { type: string; title: string }) {
  if (habit.type === "good") await addXP(userId, XP_REWARDS.COMPLETE_HABIT_GOOD, `Habit: ${habit.title}`, "habit");
  else await addXP(userId, XP_REWARDS.LOG_BAD_HABIT + XP_REWARDS.LOG_BAD_HABIT_HONESTY, `Logged bad habit: ${habit.title}`, "habit");
}

async function updateHabitStreak(userId: string, habitId: string, today: Date) {
  const streak = await prisma.streak.upsert({
    where: { userId_type: { userId, type: `habit_${habitId}` } },
    create: { userId, type: `habit_${habitId}`, currentCount: 1, bestCount: 1, lastDate: today },
    update: {},
  });
  const lastDate = streak.lastDate;
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  if (lastDate && lastDate.getTime() === yesterday.getTime()) {
    const newCount = streak.currentCount + 1;
    await prisma.streak.update({ where: { id: streak.id }, data: { currentCount: newCount, bestCount: Math.max(newCount, streak.bestCount), lastDate: today } });
  } else if (!lastDate || lastDate.getTime() !== today.getTime()) {
    await prisma.streak.update({ where: { id: streak.id }, data: { currentCount: 1, lastDate: today } });
  }
}

export async function createHabit(formData: FormData) {
  try {
    const userId = await getUser();
    const title = formData.get("title") as string;
    const type = (formData.get("type") as string) || "good";
    const icon = (formData.get("icon") as string) || "⭐";
    const unit = formData.get("unit") as string || null;
    const targetValue = formData.get("targetValue") as string;
    if (!title?.trim()) return;
    await prisma.habit.create({ data: { userId, title: title.trim(), type, icon, unit: unit || null, targetValue: targetValue ? parseFloat(targetValue) : null } });
    revalidatePath("/"); revalidatePath("/habits");
  } catch (error) { console.error("Error creating habit:", error); throw new Error(handleDbError(error)); }
}

export async function deleteHabit(habitId: string) {
  try {
    const userId = await getUser();
    const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } });
    if (!habit) return;
    await prisma.habit.delete({ where: { id: habitId } });
    revalidatePath("/"); revalidatePath("/habits");
  } catch (error) { console.error("Error deleting habit:", error); throw new Error(handleDbError(error)); }
}

// ── Life List Progress ──
export async function incrementLifeProgress(todoId: string, amount: number = 1) {
  try {
    const userId = await getUser();
    const todo = await prisma.todo.findFirst({ where: { id: todoId, userId, isLifetime: true } });
    if (!todo || !todo.progressMax) return;
    const newProgress = Math.max(0, Math.min((todo.progress || 0) + amount, todo.progressMax));
    const isComplete = newProgress >= todo.progressMax;
    await prisma.todo.update({ where: { id: todoId }, data: { progress: newProgress, completedAt: isComplete ? new Date() : null } });
    await addXP(userId, XP_REWARDS.LOG_ACTIVITY, `${todo.title}: ${newProgress}/${todo.progressMax}`, "todo");
    if (isComplete) await addXP(userId, XP_REWARDS.COMPLETE_TODO, `Life goal completed: ${todo.title}!`, "todo");
    revalidatePath("/"); revalidatePath("/todos");
  } catch (error) { console.error("Error incrementing life progress:", error); throw new Error(handleDbError(error)); }
}

// ── Login streak ──
export async function recordLoginStreak() {
  try {
    const userId = await getUser();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const streak = await prisma.streak.upsert({
      where: { userId_type: { userId, type: "login" } },
      create: { userId, type: "login", currentCount: 1, bestCount: 1, lastDate: today },
      update: {},
    });
    if (streak.lastDate) {
      const lastDate = new Date(streak.lastDate); lastDate.setHours(0, 0, 0, 0);
      if (lastDate.getTime() === today.getTime()) return streak.currentCount;
      const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
      if (lastDate.getTime() === yesterday.getTime()) {
        const newCount = streak.currentCount + 1;
        await prisma.streak.update({ where: { id: streak.id }, data: { currentCount: newCount, bestCount: Math.max(newCount, streak.bestCount), lastDate: today } });
        return newCount;
      }
    }
    await prisma.streak.update({ where: { id: streak.id }, data: { currentCount: 1, lastDate: today } });
    return 1;
  } catch (error) { console.error("Error recording login streak:", error); throw new Error(handleDbError(error)); }
}

// ── Areas ──
export const DEFAULT_AREAS = [
  { name: "Home",             icon: "🏠", color: "#10b981", order: 0 },
  { name: "Career",           icon: "💼", color: "#0066cc", order: 1 },
  { name: "Personal Finance", icon: "💰", color: "#f59e0b", order: 2 },
  { name: "Personal Fitness", icon: "💪", color: "#f97316", order: 3 },
  { name: "Side Hustle",      icon: "🚀", color: "#8b5cf6", order: 4 },
  { name: "Self Learning",    icon: "📚", color: "#06b6d4", order: 5 },
  { name: "Reading",          icon: "📖", color: "#ec4899", order: 6 },
  { name: "Office",           icon: "🏢", color: "#6b7280", order: 7 },
];

export async function seedDefaultAreas(userId: string) {
  const existing = await prisma.area.count({ where: { userId } });
  if (existing > 0) return;
  await prisma.area.createMany({
    data: DEFAULT_AREAS.map((a) => ({ ...a, userId })),
  });
}

export async function createArea(formData: FormData) {
  try {
    const userId = await getUser();
    const name = (formData.get("name") as string)?.trim();
    const icon = (formData.get("icon") as string) || "📁";
    const color = (formData.get("color") as string) || "#6b7280";
    const description = (formData.get("description") as string)?.trim() || null;
    if (!name) return;
    const last = await prisma.area.findFirst({ where: { userId }, orderBy: { order: "desc" } });
    await prisma.area.create({ data: { userId, name, icon, color, description, order: (last?.order ?? -1) + 1 } });
    revalidatePath("/areas"); revalidatePath("/projects");
  } catch (error) { console.error("Error creating area:", error); throw new Error(handleDbError(error)); }
}

export async function updateArea(areaId: string, data: { name?: string; icon?: string; color?: string; description?: string }) {
  try {
    const userId = await getUser();
    const area = await prisma.area.findFirst({ where: { id: areaId, userId } });
    if (!area) return;
    await prisma.area.update({
      where: { id: areaId },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.description !== undefined && { description: data.description.trim() || null }),
      },
    });
    revalidatePath("/areas"); revalidatePath("/projects");
  } catch (error) { console.error("Error updating area:", error); throw new Error(handleDbError(error)); }
}

export async function deleteArea(areaId: string) {
  try {
    const userId = await getUser();
    const area = await prisma.area.findFirst({ where: { id: areaId, userId } });
    if (!area) return;
    // Unlink projects from this area before deleting
    await prisma.project.updateMany({ where: { areaId, userId }, data: { areaId: null } });
    await prisma.area.delete({ where: { id: areaId } });
    revalidatePath("/areas"); revalidatePath("/projects");
  } catch (error) { console.error("Error deleting area:", error); throw new Error(handleDbError(error)); }
}

// ── Projects ──
export async function createProject(data: {
  title: string;
  description?: string;
  color?: string;
  areaId?: string;
  successDefinition?: string;
  firstStep?: string;
}) {
  try {
    const userId = await getUser();
    if (!data.title?.trim()) return;
    const project = await prisma.project.create({
      data: {
        userId,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        color: data.color || "#0066cc",
        areaId: data.areaId || null,
        successDefinition: data.successDefinition?.trim() || null,
        firstStep: data.firstStep?.trim() || null,
      },
    });
    await addXP(userId, XP_REWARDS.LOG_ACTIVITY, `Created project: ${data.title}`, "project");
    revalidatePath("/"); revalidatePath("/projects"); revalidatePath("/areas");
    return project.id;
  } catch (error) { console.error("Error creating project:", error); throw new Error(handleDbError(error)); }
}

export async function updateProject(projectId: string, data: {
  title?: string;
  description?: string;
  status?: string;
  color?: string;
  areaId?: string | null;
  successDefinition?: string;
  firstStep?: string;
}) {
  try {
    const userId = await getUser();
    const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) return;
    await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(data.title !== undefined && { title: data.title.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() || null }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.areaId !== undefined && { areaId: data.areaId }),
        ...(data.successDefinition !== undefined && { successDefinition: data.successDefinition.trim() || null }),
        ...(data.firstStep !== undefined && { firstStep: data.firstStep.trim() || null }),
      },
    });
    revalidatePath("/"); revalidatePath("/projects"); revalidatePath(`/projects/${projectId}`);
  } catch (error) { console.error("Error updating project:", error); throw new Error(handleDbError(error)); }
}

export async function updateProjectPlan(projectId: string, data: {
  planThisMonth?: string;
  planThisWeek?: string;
  planToday?: string;
  planRightNow?: string;
}) {
  try {
    const userId = await getUser();
    const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) return;
    await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(data.planThisMonth !== undefined && { planThisMonth: data.planThisMonth.trim() || null }),
        ...(data.planThisWeek !== undefined && { planThisWeek: data.planThisWeek.trim() || null }),
        ...(data.planToday !== undefined && { planToday: data.planToday.trim() || null }),
        ...(data.planRightNow !== undefined && { planRightNow: data.planRightNow.trim() || null }),
      },
    });
    revalidatePath(`/projects/${projectId}`);
  } catch (error) { console.error("Error updating project plan:", error); throw new Error(handleDbError(error)); }
}

export async function deleteProject(projectId: string) {
  try {
    const userId = await getUser();
    const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) return;
    await prisma.project.delete({ where: { id: projectId } });
    revalidatePath("/"); revalidatePath("/projects"); revalidatePath("/areas");
  } catch (error) { console.error("Error deleting project:", error); throw new Error(handleDbError(error)); }
}

export async function createMilestone(projectId: string, title: string) {
  try {
    const userId = await getUser();
    const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project || !title?.trim()) return;
    const lastMilestone = await prisma.milestone.findFirst({ where: { projectId }, orderBy: { order: "desc" } });
    await prisma.milestone.create({ data: { projectId, title: title.trim(), order: (lastMilestone?.order ?? -1) + 1 } });
    await recalcProjectProgress(projectId);
    revalidatePath("/"); revalidatePath("/projects"); revalidatePath(`/projects/${projectId}`);
  } catch (error) { console.error("Error creating milestone:", error); throw new Error(handleDbError(error)); }
}

export async function toggleMilestone(milestoneId: string) {
  try {
    const userId = await getUser();
    const milestone = await prisma.milestone.findFirst({ where: { id: milestoneId }, include: { project: true } });
    if (!milestone || milestone.project.userId !== userId) return;
    const isCompleting = !milestone.completedAt;
    await prisma.milestone.update({ where: { id: milestoneId }, data: { completedAt: isCompleting ? new Date() : null } });
    if (isCompleting) await addXP(userId, XP_REWARDS.COMPLETE_MILESTONE, `Milestone: ${milestone.title} (${milestone.project.title})`, "project");
    await recalcProjectProgress(milestone.projectId);
    revalidatePath("/"); revalidatePath("/projects"); revalidatePath(`/projects/${milestone.projectId}`);
  } catch (error) { console.error("Error toggling milestone:", error); throw new Error(handleDbError(error)); }
}

export async function deleteMilestone(milestoneId: string) {
  try {
    const userId = await getUser();
    const milestone = await prisma.milestone.findFirst({ where: { id: milestoneId }, include: { project: true } });
    if (!milestone || milestone.project.userId !== userId) return;
    await prisma.milestone.delete({ where: { id: milestoneId } });
    await recalcProjectProgress(milestone.projectId);
    revalidatePath("/"); revalidatePath("/projects"); revalidatePath(`/projects/${milestone.projectId}`);
  } catch (error) { console.error("Error deleting milestone:", error); throw new Error(handleDbError(error)); }
}

async function recalcProjectProgress(projectId: string) {
  const milestones = await prisma.milestone.findMany({
    where: { projectId },
    include: { subtasks: true },
  });
  const total = milestones.length;
  if (total === 0) {
    await prisma.project.update({ where: { id: projectId }, data: { progressPct: 0 } });
    return;
  }
  // Each milestone worth equal weight. If milestone has subtasks, its completion = subtask completion %
  let totalWeight = 0;
  for (const m of milestones) {
    if (m.subtasks.length > 0) {
      const completedSubs = m.subtasks.filter((s) => s.completedAt).length;
      totalWeight += (completedSubs / m.subtasks.length);
    } else {
      totalWeight += m.completedAt ? 1 : 0;
    }
  }
  const pct = Math.round((totalWeight / total) * 100);
  await prisma.project.update({
    where: { id: projectId },
    data: { progressPct: pct, status: pct === 100 && total > 0 ? "completed" : undefined },
  });
}

// ── Subtasks ──
export async function createSubtask(milestoneId: string, title: string) {
  try {
    const userId = await getUser();
    const milestone = await prisma.milestone.findFirst({ where: { id: milestoneId }, include: { project: true } });
    if (!milestone || milestone.project.userId !== userId || !title?.trim()) return;
    const last = await prisma.subtask.findFirst({ where: { milestoneId }, orderBy: { order: "desc" } });
    await prisma.subtask.create({ data: { milestoneId, title: title.trim(), order: (last?.order ?? -1) + 1 } });
    await recalcProjectProgress(milestone.projectId);
    revalidatePath(`/projects/${milestone.projectId}`);
  } catch (error) { console.error("Error creating subtask:", error); throw new Error(handleDbError(error)); }
}

export async function toggleSubtask(subtaskId: string) {
  try {
    const userId = await getUser();
    const subtask = await prisma.subtask.findFirst({
      where: { id: subtaskId },
      include: { milestone: { include: { project: true } } },
    });
    if (!subtask || subtask.milestone.project.userId !== userId) return;
    const isCompleting = !subtask.completedAt;
    await prisma.subtask.update({ where: { id: subtaskId }, data: { completedAt: isCompleting ? new Date() : null } });
    if (isCompleting) await addXP(userId, 5, `Subtask: ${subtask.title}`, "project");
    await recalcProjectProgress(subtask.milestone.projectId);
    revalidatePath(`/projects/${subtask.milestone.projectId}`);
  } catch (error) { console.error("Error toggling subtask:", error); throw new Error(handleDbError(error)); }
}

export async function deleteSubtask(subtaskId: string) {
  try {
    const userId = await getUser();
    const subtask = await prisma.subtask.findFirst({
      where: { id: subtaskId },
      include: { milestone: { include: { project: true } } },
    });
    if (!subtask || subtask.milestone.project.userId !== userId) return;
    const projectId = subtask.milestone.projectId;
    await prisma.subtask.delete({ where: { id: subtaskId } });
    await recalcProjectProgress(projectId);
    revalidatePath(`/projects/${projectId}`);
  } catch (error) { console.error("Error deleting subtask:", error); throw new Error(handleDbError(error)); }
}

// Import AI suggestions (milestones + subtasks from parsed AI response)
export async function importAISuggestions(projectId: string, suggestions: {
  successDefinition?: string;
  firstStep?: string;
  milestones: { title: string; subtasks: string[] }[];
}) {
  try {
    const userId = await getUser();
    const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) return;

    // Update success definition if provided
    if (suggestions.successDefinition || suggestions.firstStep) {
      await prisma.project.update({
        where: { id: projectId },
        data: {
          ...(suggestions.successDefinition && { successDefinition: suggestions.successDefinition }),
          ...(suggestions.firstStep && { firstStep: suggestions.firstStep }),
        },
      });
    }

    // Create milestones with subtasks
    for (let i = 0; i < suggestions.milestones.length; i++) {
      const m = suggestions.milestones[i];
      const last = await prisma.milestone.findFirst({ where: { projectId }, orderBy: { order: "desc" } });
      const milestone = await prisma.milestone.create({
        data: { projectId, title: m.title, order: (last?.order ?? -1) + 1 },
      });
      for (let j = 0; j < m.subtasks.length; j++) {
        await prisma.subtask.create({ data: { milestoneId: milestone.id, title: m.subtasks[j], order: j } });
      }
    }

    await recalcProjectProgress(projectId);
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (error) { console.error("Error importing AI suggestions:", error); throw new Error(handleDbError(error)); }
}

// ── Vault ──
export async function createVaultItem(data: {
  category: string; title: string; data: Record<string, unknown>; tags: string[]; notes?: string;
  reminders?: { remindAt: string; repeat: string; message?: string }[];
}) {
  const userId = await getUser();
  const item = await prisma.vaultItem.create({
    data: { userId, category: data.category, title: data.title, data: JSON.stringify(data.data), tags: JSON.stringify(data.tags), notes: data.notes || null },
  });
  if (data.reminders?.length) {
    for (const r of data.reminders) {
      await prisma.vaultReminder.create({ data: { vaultItemId: item.id, remindAt: new Date(r.remindAt), repeat: r.repeat, message: r.message || null } });
    }
  }
  await addXP(userId, XP_REWARDS.LOG_ACTIVITY, `Vault: Added ${data.title}`, "vault");
  revalidatePath("/"); revalidatePath("/vault");
  return item.id;
}

export async function updateVaultItem(itemId: string, data: { category?: string; title?: string; data?: Record<string, unknown>; tags?: string[]; notes?: string }) {
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
  revalidatePath("/"); revalidatePath("/vault");
}

export async function deleteVaultItem(itemId: string) {
  const userId = await getUser();
  const item = await prisma.vaultItem.findFirst({ where: { id: itemId, userId } });
  if (!item) return;
  await prisma.vaultItem.delete({ where: { id: itemId } });
  revalidatePath("/"); revalidatePath("/vault");
}

export async function createVaultReminder(vaultItemId: string, data: { remindAt: string; repeat: string; message?: string }) {
  const userId = await getUser();
  const item = await prisma.vaultItem.findFirst({ where: { id: vaultItemId, userId } });
  if (!item) return;
  await prisma.vaultReminder.create({ data: { vaultItemId, remindAt: new Date(data.remindAt), repeat: data.repeat, message: data.message || null } });
  revalidatePath("/vault");
}

export async function deleteVaultReminder(reminderId: string) {
  const userId = await getUser();
  const reminder = await prisma.vaultReminder.findFirst({ where: { id: reminderId }, include: { vaultItem: true } });
  if (!reminder || reminder.vaultItem.userId !== userId) return;
  await prisma.vaultReminder.delete({ where: { id: reminderId } });
  revalidatePath("/vault");
}
