import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { VAULT_CATEGORIES, getCategoryConfig } from "@/lib/vault-categories";
import Link from "next/link";
import { AddVaultItemButton } from "@/components/vault-add-button";

export default async function VaultPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [items, reminders] = await Promise.all([
    prisma.vaultItem.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.vaultReminder.findMany({
      where: {
        vaultItem: { userId },
        isActive: true,
        remindAt: { gte: new Date() },
      },
      include: { vaultItem: true },
      orderBy: { remindAt: "asc" },
      take: 10,
    }),
  ]);

  // Count by category
  const categoryCounts = new Map<string, number>();
  for (const item of items) {
    categoryCounts.set(item.category, (categoryCounts.get(item.category) || 0) + 1);
  }

  // Recent items
  const recentItems = items.slice(0, 5);

  // Subscription totals
  const subscriptions = items.filter((i) => i.category === "subscription");
  let monthlyTotal = 0;
  for (const sub of subscriptions) {
    try {
      const d = JSON.parse(sub.data);
      const cost = parseFloat(d.cost) || 0;
      if (d.billing_cycle === "yearly") monthlyTotal += cost / 12;
      else if (d.billing_cycle === "weekly") monthlyTotal += cost * 4.33;
      else monthlyTotal += cost;
    } catch { /* skip */ }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Life Vault 🧠</h1>
        <AddVaultItemButton />
      </div>

      {/* Upcoming Reminders */}
      {reminders.length > 0 && (
        <section className="glass rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text-secondary mb-3">
            ⏰ UPCOMING REMINDERS
          </h2>
          <div className="space-y-2">
            {reminders.map((r) => {
              const daysUntil = Math.ceil(
                (new Date(r.remindAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              const urgency =
                daysUntil <= 3 ? "text-accent-red" : daysUntil <= 14 ? "text-accent-yellow" : "text-accent-green";
              const cat = getCategoryConfig(r.vaultItem.category);
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${urgency}`}>
                      {new Date(r.remindAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="text-sm">
                      {cat.icon} {r.vaultItem.title}
                    </span>
                    {r.message && (
                      <span className="text-xs text-text-muted">— {r.message}</span>
                    )}
                  </div>
                  <span className={`text-xs ${urgency}`}>
                    {daysUntil === 0 ? "Today!" : daysUntil === 1 ? "Tomorrow" : `${daysUntil}d`}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Categories Grid */}
      <section>
        <h2 className="text-sm font-semibold text-text-secondary mb-3">CATEGORIES</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(VAULT_CATEGORIES).map(([key, cat]) => {
            const count = categoryCounts.get(key) || 0;
            return (
              <Link
                key={key}
                href={`/vault/${key}`}
                className="glass rounded-xl p-4 text-center hover:bg-bg-card-hover transition-all group"
              >
                <span className="text-2xl">{cat.icon}</span>
                <p className="text-sm font-medium mt-2 group-hover:text-accent-purple transition-colors">
                  {cat.label}
                </p>
                <p className="text-xs text-text-muted">
                  {count} item{count !== 1 ? "s" : ""}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Subscription summary */}
      {subscriptions.length > 0 && (
        <section className="glass rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text-secondary mb-2">
            📱 SUBSCRIPTION SPEND
          </h2>
          <div className="flex gap-6">
            <div>
              <p className="text-2xl font-bold text-accent-purple">
                ${monthlyTotal.toFixed(2)}
              </p>
              <p className="text-xs text-text-muted">per month</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-text-secondary">
                ${(monthlyTotal * 12).toFixed(2)}
              </p>
              <p className="text-xs text-text-muted">per year</p>
            </div>
          </div>
        </section>
      )}

      {/* Recent */}
      {recentItems.length > 0 && (
        <section className="glass rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text-secondary mb-3">
            RECENTLY UPDATED
          </h2>
          <div className="space-y-2">
            {recentItems.map((item) => {
              const cat = getCategoryConfig(item.category);
              return (
                <Link
                  key={item.id}
                  href={`/vault/${item.category}`}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0 hover:bg-bg-card-hover rounded px-2 -mx-2 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span>{cat.icon}</span>
                    <span className="text-sm">{item.title}</span>
                  </div>
                  <span className="text-xs text-text-muted">
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {items.length === 0 && (
        <div className="glass rounded-xl p-8 text-center space-y-3">
          <span className="text-4xl">🧠</span>
          <p className="text-text-secondary">
            Your second brain is empty. Start by adding a subscription, insurance policy, or any life admin item.
          </p>
        </div>
      )}
    </div>
  );
}
