import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { HabitQuickToggle } from "@/components/habit-quick-toggle";
import { AddHabitForm } from "@/components/add-habit-form";

export default async function HabitsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get habits with today's log and streaks
  const habits = await prisma.habit.findMany({
    where: { userId: session.user.id },
    include: {
      logs: {
        where: { date: { gte: today, lt: tomorrow } },
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

  const goodHabits = habits.filter((h) => h.type === "good");
  const badHabits = habits.filter((h) => h.type === "bad");
  const loggedCount = habits.filter((h) => h.logs.length > 0).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Habits</h1>
        <span className="text-sm text-text-muted">
          {loggedCount}/{habits.length} logged today
        </span>
      </div>

      <AddHabitForm />

      {/* Good Habits */}
      <section className="glass rounded-xl p-5">
        <h2 className="text-sm font-semibold text-accent-green mb-3">
          GOOD HABITS (earn XP)
        </h2>
        <div className="space-y-1">
          {goodHabits.length === 0 ? (
            <p className="text-text-muted text-sm py-4 text-center">
              Add a good habit to start tracking!
            </p>
          ) : (
            goodHabits.map((habit) => {
              const streak = streakMap.get(habit.id);
              return (
                <div key={habit.id} className="flex items-center gap-2">
                  <div className="flex-1">
                    <HabitQuickToggle
                      habit={habit}
                      loggedToday={habit.logs.length > 0}
                      todayValue={habit.logs[0]?.value}
                      showDelete
                    />
                  </div>
                  <div className="text-xs text-text-muted text-right min-w-[60px]">
                    {streak && streak.currentCount > 0 && (
                      <span className={streak.currentCount >= 7 ? "text-accent-orange streak-glow" : ""}>
                        🔥 {streak.currentCount}d
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Bad Habits */}
      <section className="glass rounded-xl p-5">
        <h2 className="text-sm font-semibold text-accent-red mb-3">
          BAD HABITS (track to break them)
        </h2>
        <div className="space-y-1">
          {badHabits.length === 0 ? (
            <p className="text-text-muted text-sm py-4 text-center">
              Track bad habits you want to break. You lose XP but gain honesty points.
            </p>
          ) : (
            badHabits.map((habit) => {
              const streak = streakMap.get(habit.id);
              return (
                <div key={habit.id} className="flex items-center gap-2">
                  <div className="flex-1">
                    <HabitQuickToggle
                      habit={habit}
                      loggedToday={habit.logs.length > 0}
                      todayValue={habit.logs[0]?.value}
                      showDelete
                    />
                  </div>
                  <div className="text-xs text-text-muted text-right min-w-[60px]">
                    {streak && streak.currentCount > 0 && (
                      <span>✨ {streak.currentCount}d clean</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
