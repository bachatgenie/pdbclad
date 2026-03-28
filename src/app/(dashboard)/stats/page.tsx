import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { XPBar } from "@/components/xp-bar";
import { getLevelTitle } from "@/lib/gamification";

export default async function StatsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [user, streaks, badges, totalTodos, totalLogs] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.streak.findMany({ where: { userId } }),
    prisma.badge.findMany({ where: { userId } }),
    prisma.todo.count({ where: { userId, completedAt: { not: null } } }),
    prisma.activityLog.count({ where: { userId } }),
  ]);

  if (!user) redirect("/login");

  const loginStreak = streaks.find((s) => s.type === "login");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Your Stats</h1>

      {/* Profile card */}
      <div className="glass rounded-xl p-6 text-center space-y-3">
        <div className="w-16 h-16 mx-auto rounded-full bg-xp-bar flex items-center justify-center text-2xl font-bold text-white">
          {user.name.charAt(0)}
        </div>
        <h2 className="text-xl font-bold">{user.name}</h2>
        <p className="text-accent-purple font-medium">
          Level {user.level} — {getLevelTitle(user.level)}
        </p>
        <div className="max-w-xs mx-auto">
          <XPBar xp={user.xp} level={user.level} />
        </div>
      </div>

      {/* Streaks */}
      <section className="glass rounded-xl p-5">
        <h2 className="text-sm font-semibold text-text-secondary mb-3">STREAKS</h2>
        <div className="space-y-2">
          {streaks.length === 0 ? (
            <p className="text-text-muted text-sm">No streaks yet. Start logging!</p>
          ) : (
            streaks.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-1">
                <span className="text-sm text-text-primary">
                  🔥 {s.type.replace("habit_", "").replace("login", "Login")}
                </span>
                <span className="text-sm text-text-muted">
                  {s.currentCount} days (best: {s.bestCount})
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass rounded-xl p-5 text-center">
          <p className="text-3xl font-bold text-accent-green">{totalTodos}</p>
          <p className="text-sm text-text-muted">Todos Completed</p>
        </div>
        <div className="glass rounded-xl p-5 text-center">
          <p className="text-3xl font-bold text-xp-bar">{totalLogs}</p>
          <p className="text-sm text-text-muted">Activities Logged</p>
        </div>
      </div>

      {/* Badges */}
      <section className="glass rounded-xl p-5">
        <h2 className="text-sm font-semibold text-text-secondary mb-3">BADGES</h2>
        {badges.length === 0 ? (
          <div className="flex gap-3">
            {["??????", "??????", "??????"].map((b, i) => (
              <div
                key={i}
                className="w-16 h-16 rounded-xl bg-bg-card flex items-center justify-center text-text-muted text-xs"
              >
                {b}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-3 flex-wrap">
            {badges.map((b) => (
              <div
                key={b.id}
                className="px-3 py-2 rounded-xl bg-bg-card text-sm"
              >
                {b.badgeType}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
