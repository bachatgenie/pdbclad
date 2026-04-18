import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getGreeting, timeAgo } from "@/lib/utils";
import { getCategoryConfig } from "@/lib/vault-categories";
import { getLevelTitle, getXPForNextLevel } from "@/lib/gamification";
import { TodoItem } from "@/components/todo-item";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FolderKanban,
  Flame,
  Zap,
  TrendingUp,
  Clock,
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
      take: 6,
    }),
    prisma.habit.findMany({
      where: { userId },
      include: { logs: { where: { date: { gte: today, lt: tomorrow } } } },
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
    prisma.todo.count({ where: { userId, completedAt: { gte: weekStart } } }),
    prisma.habitLog.count({ where: { habit: { userId }, date: { gte: weekStart } } }),
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

  // XP progress to next level
  const nextLevelXP = getXPForNextLevel(user.level);
  const prevLevelXP = user.level > 1 ? getXPForNextLevel(user.level - 1) : 0;
  const xpProgress = Math.min(
    ((user.xp - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100,
    100
  );
  const xpToNext = nextLevelXP - user.xp;

  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const tasksDonePercent = todayTotal > 0 ? (todayDone / todayTotal) * 100 : 0;
  const habitsDonePercent = habits.length > 0 ? (habitsLogged / habits.length) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-4">

      {/* ── HERO ─────────────────────────────────────────── */}
      <div className="rounded-2xl bg-bg-secondary border border-border p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs text-text-muted mb-1 flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              {dateStr}
            </p>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              {getGreeting()},{" "}
              <span className="text-xp-bar">{user.name.split(" ")[0]}</span>
            </h1>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-xs font-bold bg-xp-bar text-white rounded-full px-2.5 py-0.5">
              Lv.{user.level}
            </span>
            <span className="text-[11px] text-text-muted">{levelTitle}</span>
          </div>
        </div>

        {/* XP progress row */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary">
              <span className="font-semibold text-xp-bar">{user.xp.toLocaleString()} XP</span>
              <span className="text-text-muted"> · {xpToNext.toLocaleString()} to Level {user.level + 1}</span>
            </span>
            <span className="text-text-muted">{Math.round(xpProgress)}%</span>
          </div>
          <div className="h-2 rounded-full bg-xp-bar-bg overflow-hidden">
            <div
              className="h-full rounded-full xp-bar-fill"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── STATS STRIP ──────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatChip
          icon={<Flame className="w-3.5 h-3.5" />}
          colorClass="bg-accent-orange/10 text-accent-orange"
          value={streakCount > 0 ? `${streakCount}d` : "—"}
          label="Login streak"
          pulse={streakCount >= 7}
        />
        <StatChip
          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          colorClass="bg-accent-green/10 text-accent-green"
          value={todayTotal > 0 ? `${todayDone}/${todayTotal}` : "—"}
          label="Tasks done"
        />
        <StatChip
          icon={<Zap className="w-3.5 h-3.5" />}
          colorClass="bg-xp-bar/10 text-xp-bar"
          value={xpToday > 0 ? `+${xpToday}` : "0"}
          label="XP earned today"
        />
        <StatChip
          icon={<TrendingUp className="w-3.5 h-3.5" />}
          colorClass="bg-accent-green/10 text-accent-green"
          value={xpWeek > 0 ? `+${xpWeek}` : "0"}
          label={`${weekTodosCompleted}t · ${weekHabitLogs}h this week`}
        />
      </div>

      {/* ── VAULT ALERTS ─────────────────────────────────── */}
      {upcomingReminders.length > 0 && (
        <section className="rounded-2xl border border-accent-yellow/30 bg-accent-yellow/5 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-accent-yellow flex items-center gap-1.5 uppercase tracking-wide">
              <AlertTriangle className="w-3.5 h-3.5" />
              Attention needed
            </h2>
            <Link href="/vault" className="text-xs text-text-muted hover:text-xp-bar flex items-center gap-1">
              Vault <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-1">
            {upcomingReminders.map((r) => {
              const daysUntil = Math.ceil(
                (new Date(r.remindAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              const urgencyColor =
                daysUntil <= 3
                  ? "text-accent-red"
                  : daysUntil <= 14
                  ? "text-accent-yellow"
                  : "text-accent-green";
              const cat = getCategoryConfig(r.vaultItem.category);
              let detail = "";
              try {
                const d = JSON.parse(r.vaultItem.data);
                if (d.cost) detail = `$${d.cost}`;
                else if (d.premium) detail = `${d.premium}`;
              } catch { /* skip */ }

              return (
                <Link
                  key={r.id}
                  href={`/vault/${r.vaultItem.category}`}
                  className="flex items-center justify-between py-1.5 rounded-lg hover:bg-accent-yellow/5 px-1 -mx-1 transition-colors"
                >
                  <span className="text-sm text-text-primary">
                    {cat.icon} {r.vaultItem.title}
                    {detail && <span className="text-text-muted ml-1.5 text-xs">{detail}</span>}
                  </span>
                  <span className={`text-xs font-semibold ${urgencyColor} ml-3 shrink-0`}>
                    {daysUntil <= 0 ? "Today!" : daysUntil === 1 ? "Tomorrow" : `${daysUntil}d`}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── TASKS + HABITS ───────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* Today's Focus */}
        <section className="glass rounded-2xl overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-text-primary">Today's Focus</h2>
                <p className="text-xs text-text-muted mt-0.5">
                  {todayTotal === 0
                    ? "No tasks pending"
                    : todayDone === todayTotal
                    ? "All done! 🎉"
                    : `${todayTotal - todayDone} remaining`}
                </p>
              </div>
              <Link href="/todos" className="text-xs text-xp-bar hover:underline flex items-center gap-0.5">
                All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {/* Task progress bar */}
            {todayTotal > 0 && (
              <div className="mt-2.5 h-1 rounded-full bg-bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent-green transition-all duration-500"
                  style={{ width: `${tasksDonePercent}%` }}
                />
              </div>
            )}
          </div>

          <div className="px-4 pb-4">
            {todayTodos.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-2xl mb-2">✨</p>
                <p className="text-sm text-text-muted">All clear.</p>
                <Link href="/todos" className="text-xs text-xp-bar hover:underline mt-1 inline-block">
                  Add a task
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {todayTodos.map((todo) => (
                  <TodoItem key={todo.id} todo={todo} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Habits */}
        <section className="glass rounded-2xl overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-text-primary">Habits</h2>
                <p className="text-xs text-text-muted mt-0.5">
                  {habits.length === 0
                    ? "None set up yet"
                    : habitsLogged === habits.length
                    ? "All logged! 💪"
                    : `${habitsLogged} of ${habits.length} logged`}
                </p>
              </div>
              <Link href="/habits" className="text-xs text-xp-bar hover:underline flex items-center gap-0.5">
                Manage <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {/* Habit progress bar */}
            {habits.length > 0 && (
              <div className="mt-2.5 h-1 rounded-full bg-bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-xp-bar transition-all duration-500"
                  style={{ width: `${habitsDonePercent}%` }}
                />
              </div>
            )}
          </div>

          <div className="px-4 pb-4">
            {habits.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-2xl mb-2">🌱</p>
                <p className="text-sm text-text-muted">No habits yet.</p>
                <Link href="/habits" className="text-xs text-xp-bar hover:underline mt-1 inline-block">
                  Set some up
                </Link>
              </div>
            ) : (
              <div className="space-y-1 mt-1">
                {habits.slice(0, 7).map((habit) => (
                  <HabitRow
                    key={habit.id}
                    icon={habit.icon}
                    title={habit.title}
                    logged={habit.logs.length > 0}
                    isGood={habit.type === "good"}
                    unit={habit.unit}
                    value={habit.logs[0]?.value}
                    target={habit.targetValue}
                  />
                ))}
                {habits.length > 7 && (
                  <p className="text-xs text-text-muted pt-1 text-center">
                    +{habits.length - 7} more on{" "}
                    <Link href="/habits" className="text-xp-bar hover:underline">habits page</Link>
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ── ACTIVE PROJECTS ──────────────────────────────── */}
      {activeProjects.length > 0 && (
        <section className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
              <FolderKanban className="w-4 h-4 text-text-secondary" />
              Active Projects
            </h2>
            <Link href="/projects" className="text-xs text-xp-bar hover:underline flex items-center gap-0.5">
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {activeProjects.map((project) => {
              const completedMs = project.milestones.filter((m) => m.completedAt).length;
              const totalMs = project.milestones.length;
              const nextMilestone = project.milestones.find((m) => !m.completedAt);
              return (
                <Link key={project.id} href="/projects" className="block group">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-secondary hover:bg-bg-card-hover transition-colors">
                    {/* Accent bar */}
                    <div
                      className="w-1 self-stretch rounded-full shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-sm font-medium text-text-primary truncate">
                          {project.title}
                        </span>
                        <span className="text-xs font-semibold text-text-muted shrink-0">
                          {project.progressPct}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-bg-primary overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${project.progressPct}%`,
                            backgroundColor: project.color,
                          }}
                        />
                      </div>
                      {nextMilestone && (
                        <p className="text-[11px] text-text-muted mt-1.5 truncate">
                          <span className="text-text-muted">↳</span>{" "}
                          {nextMilestone.title}
                          {totalMs > 0 && (
                            <span className="ml-1">
                              ({completedMs}/{totalMs})
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── ACTIVITY FEED ────────────────────────────────── */}
      {recentActivity.length > 0 && (
        <section className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-text-primary">Recent Activity</h2>
            <Link href="/log" className="text-xs text-xp-bar hover:underline flex items-center gap-0.5">
              Full log <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div>
            {recentActivity.map((log, i) => (
              <div key={log.id} className="flex items-start gap-3 py-2.5">
                {/* Timeline dot */}
                <div className="flex flex-col items-center shrink-0 pt-1">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${getCategoryDotColor(log.category)}`}
                  />
                  {i < recentActivity.length - 1 && (
                    <div className="w-px flex-1 min-h-[1.25rem] bg-border mt-1" />
                  )}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0 pb-0.5">
                  <p className="text-sm text-text-primary leading-snug">
                    <span className="mr-1.5">{getCategoryEmoji(log.category)}</span>
                    {log.content}
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    {timeAgo(new Date(log.createdAt))}
                  </p>
                </div>
                {/* XP badge */}
                {log.xpEarned > 0 && (
                  <span className="text-[11px] font-semibold text-accent-green bg-accent-green/10 rounded-full px-2 py-0.5 shrink-0 mt-0.5">
                    +{log.xpEarned}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}

// ── Helper Components ─────────────────────────────────────────

function StatChip({
  icon,
  colorClass,
  value,
  label,
  pulse,
}: {
  icon: React.ReactNode;
  colorClass: string;
  value: string;
  label: string;
  pulse?: boolean;
}) {
  return (
    <div className={`glass rounded-xl p-3 ${pulse ? "ring-1 ring-accent-orange/30" : ""}`}>
      <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full mb-2 ${colorClass}`}>
        {icon}
      </div>
      <p className={`text-xl font-bold tracking-tight ${pulse ? "text-accent-orange" : "text-text-primary"}`}>
        {value}
      </p>
      <p className="text-[11px] text-text-muted mt-0.5 leading-tight">{label}</p>
    </div>
  );
}

function HabitRow({
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
  const hasQuantity = unit && value != null;
  const metTarget = hasQuantity && target ? value! >= target : false;

  return (
    <div className="flex items-center gap-2.5 py-1.5 border-b border-border/40 last:border-0">
      <span className="text-base shrink-0">{icon}</span>
      <span
        className={`text-sm flex-1 truncate ${
          logged ? "text-text-muted line-through" : "text-text-primary"
        }`}
      >
        {title}
      </span>

      {hasQuantity && target ? (
        <div className="flex items-center gap-1 shrink-0">
          <span
            className={`text-xs font-medium ${
              metTarget
                ? isGood
                  ? "text-accent-green"
                  : "text-accent-red"
                : "text-text-muted"
            }`}
          >
            {value}/{target} {unit}
          </span>
        </div>
      ) : logged ? (
        <span
          className={`text-xs font-medium shrink-0 ${
            isGood ? "text-accent-green" : "text-accent-red"
          }`}
        >
          {isGood ? "✓ done" : "✕ logged"}
        </span>
      ) : (
        <span className="text-xs text-border shrink-0">·</span>
      )}
    </div>
  );
}

function getCategoryDotColor(category: string): string {
  const colors: Record<string, string> = {
    todo: "bg-accent-green",
    habit: "bg-xp-bar",
    project: "bg-accent-orange",
    vault: "bg-accent-purple",
    system: "bg-text-muted",
    general: "bg-text-muted",
  };
  return colors[category] ?? "bg-text-muted";
}

function getCategoryEmoji(category: string): string {
  const icons: Record<string, string> = {
    todo: "✅",
    habit: "🔄",
    project: "📁",
    vault: "🧠",
    system: "🔑",
    general: "📝",
  };
  return icons[category] ?? "📝";
}
