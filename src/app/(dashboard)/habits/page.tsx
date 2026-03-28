import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { HabitQuickToggle } from "@/components/habit-quick-toggle";
import { AddHabitForm } from "@/components/add-habit-form";
import { Repeat } from "lucide-react";

export default async function HabitsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get date range for last 7 days
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Get habits with today's log and last 7 days of logs
  const habits = await prisma.habit.findMany({
    where: { userId: session.user.id },
    include: {
      logs: {
        where: { date: { gte: sevenDaysAgo, lt: tomorrow } },
        orderBy: { date: "asc" },
      },
    },
  });

  // Get streaks for each habit
  const streaks = await prisma.streak.findMany({
    where: {
      userId: session.user.id,
      type: { startsWith: "habit_" },
    },
  });

  const streakMap = new Map(streaks.map((s) => [s.type.replace("habit_", ""), s]));

  // Build 7-day history for each habit
  function getRecentDays(habitLogs: { date: Date }[]) {
    const days: boolean[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const logged = habitLogs.some(
        (log) => new Date(log.date).toDateString() === d.toDateString()
      );
      days.push(logged);
    }
    return days;
  }

  const goodHabits = habits.filter((h) => h.type === "good");
  const badHabits = habits.filter((h) => h.type === "bad");
  const loggedCount = habits.filter((h) =>
    h.logs.some(
      (log) => new Date(log.date).toDateString() === today.toDateString()
    )
  ).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Habits</h1>
        <span className="text-sm text-text-muted">
          {loggedCount}/{habits.length} logged today
        </span>
      </div>

      <AddHabitForm />

      {habits.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center space-y-3">
          <Repeat className="w-12 h-12 mx-auto text-text-muted" />
          <p className="text-text-secondary font-medium">No habits yet</p>
          <p className="text-sm text-text-muted">
            Add a habit above to start tracking your daily progress.
          </p>
        </div>
      ) : (
        <>
          {/* Good Habits */}
          {goodHabits.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-accent-green uppercase tracking-wide">
                Good Habits ({goodHabits.length})
              </h2>
              {goodHabits.map((habit) => {
                const streak = streakMap.get(habit.id);
                const todayLog = habit.logs.find(
                  (log) =>
                    new Date(log.date).toDateString() === today.toDateString()
                );
                return (
                  <HabitQuickToggle
                    key={habit.id}
                    habit={habit}
                    loggedToday={!!todayLog}
                    todayValue={todayLog?.value}
                    streak={streak?.currentCount || 0}
                    recentDays={getRecentDays(habit.logs)}
                    showDelete
                  />
                );
              })}
            </section>
          )}

          {/* Bad Habits */}
          {badHabits.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-accent-red uppercase tracking-wide">
                Bad Habits ({badHabits.length})
              </h2>
              {badHabits.map((habit) => {
                const streak = streakMap.get(habit.id);
                const todayLog = habit.logs.find(
                  (log) =>
                    new Date(log.date).toDateString() === today.toDateString()
                );
                return (
                  <HabitQuickToggle
                    key={habit.id}
                    habit={habit}
                    loggedToday={!!todayLog}
                    todayValue={todayLog?.value}
                    streak={streak?.currentCount || 0}
                    recentDays={getRecentDays(habit.logs)}
                    showDelete
                  />
                );
              })}
            </section>
          )}
        </>
      )}

      {/* Legend */}
      <div className="text-xs text-text-muted flex items-center gap-4">
        <span className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-green" /> logged
        </span>
        <span className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-border" /> missed
        </span>
        <span>Last 7 days shown</span>
      </div>
    </div>
  );
}
