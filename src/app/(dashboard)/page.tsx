import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getGreeting } from "@/lib/utils";
import { getCategoryConfig } from "@/lib/vault-categories";
import { getLevelTitle } from "@/lib/gamification";
import { XPBar } from "@/components/xp-bar";
import { TodoItem } from "@/components/todo-item";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FolderKanban,
  Repeat,
  ScrollText,
} from "lucide-react";
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

  // Start of this week (Monday)
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  if (weekStart > today) weekStart.setDate(weekStart.getDate() - 7);

  const [
    todayTodos,
    habits,
    recentActivity,
    loginStreak,
    todayXP,
    weekXP,
    upcomingReminders,
    weekTodosCompleted,
    weekHabitLogs,
    activeProjects,
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
      take: 5,
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
      take: 4,
    }),
    prisma.streak.findFirst({ where: { userId, type: "login" } }),
    prisma.activityLog.aggregate({
      where: { userId, createdAt: { gte: today } },
      _sum: { xpEarned: true },
    }),
    prisma.activityLog.aggregate({
      where: { userId, createdAt: { gte: weekStart } },
      _sum: { xpEarned: true },
    }),
    prisma.vaultReminder.findMany({
      where: {
        vaultItem: { userId },
        isActive: true,
        remindAt: { gte: new Date(), lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      },
      include: { vaultItem: true },
      orderBy: { remindAt: "asc" },
      take: 3,
    }),
    prisma.todo.count({
      where: { userId, completedAt: { gte: weekStart } },
    }),
    prisma.habitLog.count({
      where: {
        habit: { userId },
        date: { gte: weekStart },
      },
    }),
    prisma.project.findMany({
      where: { userId, status: "active" },
      include: { milestones: { orderBy: { order: "asc" } } },
      take: 3,
    }),
  ]);

  const streakCount = loginStreak?.currentCount ?? 0;
  const todayDone = todayTodos.filter((t) => t.completedAt).length;
  const todayTotal = todayTodos.length;
  const xpToday = todayXP._sum.xpEarned ?? 0;
  const xpWeek = weekXP._sum.xpEarned ?? 0;
  const habitsLogged = habits.filter((h) => h.logs.length > 0).length;
  const levelTitle = getLevelTitle(user.level);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header: Greeting + Level + XP */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">
          {getGreeting()}, {user.name.split(" ")[0]}
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Level {user.level} &middot; {levelTitle}
        </p>
        <div className="mt-3 max-w-sm">
          <XPBar xp={user.xp} level={user.level} />
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <QuickStat
          label="Streak"
          value={`${streakCount}d`}
          icon="🔥"
          highlight={streakCount >= 7}
        />
        <QuickStat
          label="Today"
          value={`${todayDone}/${todayTotal}`}
          icon="✅"
          sub="tasks done"
        />
        <QuickStat
          label="XP Today"
          value={`+${xpToday}`}
          icon="⚡"
        />
        <QuickStat
          label="This Week"
          value={`+${xpWeek}`}
          icon="📈"
          sub={`${weekTodosCompleted} tasks, ${weekHabitLogs} habits`}
        />
      </div>

      {/* Attention Needed — Vault Reminders */}
      {upcomingReminders.length > 0 && (
        <section className="rounded-xl border border-accent-yellow/30 bg-accent-yellow/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-accent-yellow flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Upcoming
            </h2>
            <Link href="/vault" className="text-xs text-text-muted hover:text-xp-bar flex items-center gap-1">
              Vault <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-1.5">
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
                if (d.premium) detail = `${d.premium}`;
              } catch { /* skip */ }
              return (
                <Link
                  key={r.id}
                  href={`/vault/${r.vaultItem.category}`}
                  className="flex items-center justify-between py-1 hover:bg-accent-yellow/5 rounded px-2 -mx-2 transition-colors"
                >
                  <span className="text-sm">
                    {daysUntil <= 3 ? "🔴" : daysUntil <= 7 ? "🟡" : "🟢"}{" "}
                    {cat.icon} {r.vaultItem.title}
                    {detail && <span className="text-text-muted ml-1">{detail}</span>}
                  </span>
                  <span className={`text-xs font-medium ${urgency}`}>
                    {daysUntil <= 0 ? "Today!" : daysUntil === 1 ? "Tomorrow" : `${daysUntil}d`}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Main Grid: Tasks + Habits */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Tasks */}
        <section className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-secondary flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Tasks
            </h2>
            <Link href="/todos" className="text-xs text-text-muted hover:text-xp-bar flex items-center gap-1">
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-1">
            {todayTodos.length === 0 ? (
              <p className="text-text-muted text-sm py-6 text-center">
                No tasks.{" "}
                <Link href="/todos" className="text-xp-bar hover:underline">
                  Add one
                </Link>
              </p>
            ) : (
              todayTodos.map((todo) => <TodoItem key={todo.id} todo={todo} />)
            )}
          </div>
        </section>

        {/* Habits */}
        <section className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-secondary flex items-center gap-1.5">
              <Repeat className="w-4 h-4" />
              Habits ({habitsLogged}/{habits.length})
            </h2>
            <Link href="/habits" className="text-xs text-text-muted hover:text-xp-bar flex items-center gap-1">
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {habits.length === 0 ? (
              <p className="text-text-muted text-sm py-6 text-center">
                No habits.{" "}
                <Link href="/habits" className="text-xp-bar hover:underline">
                  Set some up
                </Link>
              </p>
            ) : (
              habits.slice(0, 6).map((habit) => (
                <HabitMiniRow
                  key={habit.id}
                  icon={habit.icon}
                  title={habit.title}
                  logged={habit.logs.length > 0}
                  isGood={habit.type === "good"}
                  unit={habit.unit}
                  value={habit.logs[0]?.value}
                  target={habit.targetValue}
                />
              ))
            )}
          </div>
        </section>
      </div>

      {/* Active Projects */}
      {activeProjects.length > 0 && (
        <section className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-secondary flex items-center gap-1.5">
              <FolderKanban className="w-4 h-4" />
              Active Projects
            </h2>
            <Link href="/projects" className="text-xs text-text-muted hover:text-xp-bar flex items-center gap-1">
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {activeProjects.map((project) => {
              const completedMs = project.milestones.filter((m) => m.completedAt).length;
              const totalMs = project.milestones.length;
              const nextMilestone = project.milestones.find((m) => !m.completedAt);
              return (
                <Link
                  key={project.id}
                  href="/projects"
                  className="block p-3 rounded-lg bg-bg-secondary hover:bg-bg-card-hover transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="text-sm font-medium">{project.title}</span>
                    <span className="text-xs text-text-muted ml-auto">
                      {project.progressPct}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-bg-primary">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${project.progressPct}%`,
                        backgroundColor: project.color,
                      }}
                    />
                  </div>
                  {nextMilestone && (
                    <p className="text-xs text-text-muted mt-1.5">
                      Next: {nextMilestone.title}
                      {totalMs > 0 && (
                        <span className="ml-1">({completedMs}/{totalMs})</span>
                      )}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <section className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-secondary flex items-center gap-1.5">
              <ScrollText className="w-4 h-4" />
              Recent
            </h2>
            <Link href="/log" className="text-xs text-text-muted hover:text-xp-bar flex items-center gap-1">
              Full log <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-1">
            {recentActivity.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between py-1.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-text-muted w-10 shrink-0">
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
                    +{log.xpEarned}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Nav */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { href: "/todos", icon: "✅", label: "Todos" },
          { href: "/projects", icon: "📁", label: "Projects" },
          { href: "/vault", icon: "🧠", label: "Vault" },
          { href: "/stats", icon: "📊", label: "Stats" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="glass rounded-xl p-3 text-center hover:bg-bg-card-hover transition-all"
          >
            <span className="text-lg">{link.icon}</span>
            <p className="text-[11px] text-text-muted mt-0.5">{link.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

// --- Helper Components ---

function QuickStat({
  label,
  value,
  icon,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  icon: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`glass rounded-xl p-3 ${
        highlight ? "border border-accent-orange/30" : ""
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm">{icon}</span>
        <span className="text-xs text-text-muted uppercase">{label}</span>
      </div>
      <p className="text-lg font-bold text-text-primary">{value}</p>
      {sub && <p className="text-[11px] text-text-muted">{sub}</p>}
    </div>
  );
}

function HabitMiniRow({
  icon,
  title,
  logged,
  isGood,
  unit,
  value,
  target,
}: {
  icon: string;
  title: string;
  logged: boolean;
  isGood: boolean;
  unit: string | null;
  value?: number | null;
  target: number | null;
}) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-sm">{icon}</span>
      <span className={`text-sm flex-1 truncate ${logged ? "text-text-muted" : "text-text-primary"}`}>
        {title}
      </span>
      {unit && value != null && target ? (
        <span className={`text-xs font-medium ${value >= target ? (isGood ? "text-accent-green" : "text-accent-red") : "text-text-muted"}`}>
          {value}/{target}
        </span>
      ) : logged ? (
        <span className={`text-xs ${isGood ? "text-accent-green" : "text-accent-red"}`}>
          {isGood ? "✅" : "❌"}
        </span>
      ) : (
        <span className="text-xs text-text-muted">-</span>
      )}
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
