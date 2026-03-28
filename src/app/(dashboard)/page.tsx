import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getGreeting, parseTags } from "@/lib/utils";
import { getCategoryConfig } from "@/lib/vault-categories";
import { getLevelTitle } from "@/lib/gamification";
import { XPBar } from "@/components/xp-bar";
import { StatCard } from "@/components/stat-card";
import { TodoItem } from "@/components/todo-item";
import { HabitQuickToggle } from "@/components/habit-quick-toggle";
import { Zap, AlertTriangle, ArrowRight, Target } from "lucide-react";
import Link from "next/link";

export default async function DashboardHome() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/login");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    todayTodos,
    habits,
    recentActivity,
    loginStreak,
    todayXP,
    upcomingReminders,
    totalCompleted,
    activeProjects,
    vaultItemCount,
  ] = await Promise.all([
    prisma.todo.findMany({
      where: {
        userId,
        OR: [
          { dueDate: { gte: today, lt: tomorrow } },
          { dueDate: null, isLifetime: false, completedAt: null },
        ],
      },
      orderBy: [{ completedAt: "asc" }, { priority: "asc" }, { createdAt: "desc" }],
      take: 6,
    }),
    prisma.habit.findMany({
      where: { userId },
      include: {
        logs: { where: { date: { gte: today, lt: tomorrow } } },
      },
    }),
    prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.streak.findFirst({ where: { userId, type: "login" } }),
    prisma.activityLog.aggregate({
      where: { userId, createdAt: { gte: today } },
      _sum: { xpEarned: true },
    }),
    prisma.vaultReminder.findMany({
      where: {
        vaultItem: { userId },
        isActive: true,
        remindAt: { gte: new Date(), lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
      },
      include: { vaultItem: true },
      orderBy: { remindAt: "asc" },
      take: 5,
    }),
    prisma.todo.count({ where: { userId, completedAt: { not: null } } }),
    prisma.project.count({ where: { userId, status: "active" } }),
    prisma.vaultItem.count({ where: { userId } }),
  ]);

  const streakCount = loginStreak?.currentCount ?? 0;
  const todayDone = todayTodos.filter((t) => t.completedAt).length;
  const todayTotal = todayTodos.length;
  const xpToday = todayXP._sum.xpEarned ?? 0;
  const habitsLogged = habits.filter((h) => h.logs.length > 0).length;
  const levelTitle = getLevelTitle(user.level);

  // Motivational nudge based on state
  const hour = new Date().getHours();
  let nudge = "";
  if (habitsLogged === 0 && hour >= 8) nudge = "No habits logged yet — tap one to get started!";
  else if (todayDone === 0 && todayTotal > 0) nudge = "You have tasks waiting. Knock one out for +10 XP!";
  else if (streakCount >= 7) nudge = `${streakCount}-day streak! Keep the fire alive 🔥`;
  else if (xpToday > 50) nudge = `Already +${xpToday} XP today — you're on fire!`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Greeting + XP + Level */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {getGreeting()}, {user.name.split(" ")[0]}
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Level {user.level} {levelTitle} · {totalCompleted} tasks done · {activeProjects} active projects · {vaultItemCount} vault items
          </p>
          <div className="mt-3 max-w-sm">
            <XPBar xp={user.xp} level={user.level} />
          </div>
        </div>
      </div>

      {/* Nudge */}
      {nudge && (
        <div className="bg-accent-purple/10 border border-accent-purple/20 rounded-xl px-4 py-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-accent-purple shrink-0" />
          <p className="text-sm text-accent-purple">{nudge}</p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon="🔥"
          label="streak"
          value={`${streakCount}d`}
          sub={streakCount >= 7 ? "on fire!" : "days"}
          className={streakCount >= 7 ? "border border-accent-orange/30" : ""}
        />
        <StatCard
          icon="✅"
          label="tasks"
          value={`${todayDone}/${todayTotal}`}
          sub="done today"
        />
        <StatCard
          icon="⚡"
          label="XP"
          value={`+${xpToday}`}
          sub="earned today"
        />
      </div>

      {/* Attention Needed — Vault Reminders */}
      {upcomingReminders.length > 0 && (
        <section className="glass rounded-xl p-5 border border-accent-yellow/20">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-accent-yellow flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              ATTENTION NEEDED
            </h2>
            <Link href="/vault" className="text-xs text-text-muted hover:text-accent-purple flex items-center gap-1">
              View vault <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {upcomingReminders.map((r) => {
              const daysUntil = Math.ceil(
                (new Date(r.remindAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              const urgency =
                daysUntil <= 3 ? "text-accent-red" : daysUntil <= 14 ? "text-accent-yellow" : "text-accent-green";
              const cat = getCategoryConfig(r.vaultItem.category);
              let detail = "";
              try {
                const d = JSON.parse(r.vaultItem.data);
                if (d.cost) detail = `$${d.cost}`;
                if (d.premium) detail = `₹${d.premium}`;
              } catch { /* skip */ }
              return (
                <Link
                  key={r.id}
                  href={`/vault/${r.vaultItem.category}`}
                  className="flex items-center justify-between py-1.5 hover:bg-bg-card-hover rounded px-2 -mx-2 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${urgency}`}>
                      {daysUntil <= 0 ? "🔴" : daysUntil <= 7 ? "🟡" : "🟢"}
                    </span>
                    <span className="text-sm">
                      {cat.icon} {r.vaultItem.title}
                    </span>
                    {detail && <span className="text-xs text-text-muted">{detail}</span>}
                  </div>
                  <span className={`text-xs font-medium ${urgency}`}>
                    {daysUntil <= 0 ? "Today!" : daysUntil === 1 ? "Tomorrow" : `in ${daysUntil}d`}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Daily Quests */}
      <section className="glass rounded-xl p-5">
        <h2 className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent-yellow" />
          TODAY&apos;S QUESTS
        </h2>
        <div className="space-y-2">
          <QuestRow done={todayDone >= 3} label="Complete 3 tasks" xp={30} />
          <QuestRow done={habitsLogged >= 3} label="Log 3 habits" xp={45} />
          <QuestRow done={recentActivity.length >= 3} label="Log 3 activities" xp={30} />
          <QuestRow done={xpToday >= 50} label="Earn 50+ XP today" xp={25} />
        </div>
      </section>

      {/* Tasks + Habits side by side */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Today's Tasks */}
        <section className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-secondary">
              TODAY&apos;S TASKS
            </h2>
            <Link href="/todos" className="text-xs text-text-muted hover:text-accent-purple flex items-center gap-1">
              All todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-1">
            {todayTodos.length === 0 ? (
              <p className="text-text-muted text-sm py-4 text-center">
                No tasks for today. <Link href="/todos" className="text-accent-purple hover:underline">Add one</Link>
              </p>
            ) : (
              todayTodos.map((todo) => (
                <TodoItem key={todo.id} todo={todo} />
              ))
            )}
          </div>
        </section>

        {/* Habits */}
        <section className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-secondary">
              HABITS ({habitsLogged}/{habits.length})
            </h2>
            <Link href="/habits" className="text-xs text-text-muted hover:text-accent-purple flex items-center gap-1">
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-1">
            {habits.length === 0 ? (
              <p className="text-text-muted text-sm py-4 text-center">
                No habits yet. <Link href="/habits" className="text-accent-purple hover:underline">Set some up</Link>
              </p>
            ) : (
              habits.map((habit) => (
                <HabitQuickToggle
                  key={habit.id}
                  habit={habit}
                  loggedToday={habit.logs.length > 0}
                  todayValue={habit.logs[0]?.value}
                />
              ))
            )}
          </div>
        </section>
      </div>

      {/* Recent Activity */}
      <section className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-secondary">
            RECENT ACTIVITY
          </h2>
          <Link href="/log" className="text-xs text-text-muted hover:text-accent-purple flex items-center gap-1">
            Full log <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-2">
          {recentActivity.length === 0 ? (
            <p className="text-text-muted text-sm py-4 text-center">
              No activity yet. Press <kbd className="text-xs bg-bg-card px-1.5 py-0.5 rounded">Ctrl+K</kbd> to quick log!
            </p>
          ) : (
            recentActivity.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-text-muted w-12 shrink-0">
                    {new Date(log.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="text-sm text-text-primary truncate">
                    {getCategoryIcon(log.category)} {log.content}
                  </span>
                </div>
                {log.xpEarned > 0 && (
                  <span className="text-xs text-accent-green font-medium shrink-0 ml-2">
                    +{log.xpEarned} XP
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Quick links footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/todos", icon: "✅", label: "Todos" },
          { href: "/projects", icon: "📁", label: "Projects" },
          { href: "/vault", icon: "🧠", label: "Vault" },
          { href: "/stats", icon: "📊", label: "Stats" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="glass rounded-xl p-3 text-center hover:bg-bg-card-hover transition-all group"
          >
            <span className="text-xl">{link.icon}</span>
            <p className="text-xs text-text-muted group-hover:text-accent-purple mt-1">
              {link.label}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function QuestRow({ done, label, xp }: { done: boolean; label: string; xp: number }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <span className={done ? "text-accent-green" : "text-text-muted"}>
          {done ? "●" : "○"}
        </span>
        <span
          className={`text-sm ${done ? "text-text-muted line-through" : "text-text-primary"}`}
        >
          {label}
        </span>
      </div>
      <span className={`text-xs font-medium ${done ? "text-accent-green" : "text-text-muted"}`}>
        +{xp} XP {done && "✓"}
      </span>
    </div>
  );
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    todo: "✅",
    habit: "🔄",
    project: "📁",
    vault: "🧠",
    system: "🔑",
    general: "📝",
  };
  return icons[category] || "📝";
}
