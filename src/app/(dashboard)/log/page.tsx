import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { parseTags } from "@/lib/utils";

export default async function LogPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const logs = await prisma.activityLog.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Group by date
  const grouped = new Map<string, typeof logs>();
  for (const log of logs) {
    const dateKey = new Date(log.createdAt).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    if (!grouped.has(dateKey)) grouped.set(dateKey, []);
    grouped.get(dateKey)!.push(log);
  }

  const totalXP = logs.reduce((sum, l) => sum + l.xpEarned, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Activity Log</h1>
        <span className="text-sm text-text-muted">
          {logs.length} entries | +{totalXP} XP total
        </span>
      </div>

      {logs.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center">
          <p className="text-text-muted">No activity yet. Use Quick Log to get started!</p>
        </div>
      ) : (
        Array.from(grouped.entries()).map(([date, dayLogs]) => (
          <section key={date} className="glass rounded-xl p-5">
            <h2 className="text-sm font-semibold text-text-secondary mb-3">
              {date}
            </h2>
            <div className="space-y-2">
              {dayLogs.map((log) => {
                const tags = parseTags(log.tags);
                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-text-muted w-12 shrink-0">
                        {new Date(log.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-bg-card text-text-muted">
                        {log.source}
                      </span>
                      <span className="text-sm text-text-primary">
                        {getCategoryIcon(log.category)} {log.content}
                      </span>
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs text-accent-purple"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    {log.xpEarned !== 0 && (
                      <span
                        className={`text-xs font-medium shrink-0 ${
                          log.xpEarned > 0 ? "text-accent-green" : "text-accent-red"
                        }`}
                      >
                        {log.xpEarned > 0 ? "+" : ""}
                        {log.xpEarned} XP
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))
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
