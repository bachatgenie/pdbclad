import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { VAULT_CATEGORIES, getCategoryConfig } from "@/lib/vault-categories";
import { VaultItemCard } from "@/components/vault-item-card";
import { AddVaultItemButton } from "@/components/vault-add-button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function VaultCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  if (!(category in VAULT_CATEGORIES)) notFound();

  const catConfig = getCategoryConfig(category);

  const items = await prisma.vaultItem.findMany({
    where: { userId: session.user.id, category },
    include: { reminders: { where: { isActive: true }, orderBy: { remindAt: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });

  // Calculate totals for subscriptions
  let monthlyTotal = 0;
  let yearlyTotal = 0;
  if (category === "subscription") {
    for (const item of items) {
      try {
        const d = JSON.parse(item.data);
        const cost = parseFloat(d.cost) || 0;
        if (d.billing_cycle === "yearly") {
          yearlyTotal += cost;
          monthlyTotal += cost / 12;
        } else if (d.billing_cycle === "weekly") {
          monthlyTotal += cost * 4.33;
          yearlyTotal += cost * 52;
        } else {
          monthlyTotal += cost;
          yearlyTotal += cost * 12;
        }
      } catch { /* skip */ }
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/vault"
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">
            {catConfig.icon} {catConfig.label}
          </h1>
        </div>
        <AddVaultItemButton />
      </div>

      {/* Subscription totals */}
      {category === "subscription" && items.length > 0 && (
        <div className="glass rounded-xl p-5 flex gap-8">
          <div>
            <p className="text-2xl font-bold text-accent-purple">
              ${monthlyTotal.toFixed(2)}
            </p>
            <p className="text-xs text-text-muted">monthly total</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-text-secondary">
              ${yearlyTotal.toFixed(2)}
            </p>
            <p className="text-xs text-text-muted">yearly total</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-text-muted">{items.length}</p>
            <p className="text-xs text-text-muted">subscriptions</p>
          </div>
        </div>
      )}

      {/* Items */}
      {items.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center space-y-3">
          <span className="text-4xl">{catConfig.icon}</span>
          <p className="text-text-muted">
            No {catConfig.label.toLowerCase()} yet. Click &quot;Add Item&quot; to start.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <VaultItemCard key={item.id} item={item} category={category} />
          ))}
        </div>
      )}
    </div>
  );
}
