"use client";

import { useState } from "react";
import { deleteVaultItem } from "@/lib/actions";
import { getCategoryConfig } from "@/lib/vault-categories";
import { parseTags } from "@/lib/utils";
import { Trash2, Pencil, ChevronDown, ChevronUp } from "lucide-react";
import { VaultItemForm } from "./vault-item-form";

interface VaultItemCardProps {
  item: {
    id: string;
    category: string;
    title: string;
    data: string;
    tags: string;
    notes: string | null;
    updatedAt: Date;
    reminders: { id: string; remindAt: Date; repeat: string; message: string | null }[];
  };
  category: string;
}

export function VaultItemCard({ item, category }: VaultItemCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);

  const catConfig = getCategoryConfig(category);
  const tags = parseTags(item.tags);
  let data: Record<string, string> = {};
  try {
    data = JSON.parse(item.data);
  } catch { /* skip */ }

  // Build summary line based on category
  const summaryParts: string[] = [];
  if (category === "subscription") {
    if (data.cost) summaryParts.push(`$${data.cost}/${data.billing_cycle === "yearly" ? "yr" : "mo"}`);
    if (data.next_billing) summaryParts.push(`Next: ${data.next_billing}`);
    if (data.provider) summaryParts.push(data.provider);
  } else if (category === "insurance") {
    if (data.policy_number) summaryParts.push(`#${data.policy_number}`);
    if (data.end_date) summaryParts.push(`Expires: ${data.end_date}`);
  } else if (category === "vehicle") {
    if (data.make && data.model) summaryParts.push(`${data.make} ${data.model}`);
    if (data.year) summaryParts.push(data.year);
    if (data.plate) summaryParts.push(data.plate);
  } else if (category === "finance") {
    if (data.bank) summaryParts.push(data.bank);
    if (data.last_four) summaryParts.push(`****${data.last_four}`);
  }

  return (
    <>
      <div className="glass rounded-xl p-4 group">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">{catConfig.icon}</span>
              <h3 className="font-semibold text-text-primary">{item.title}</h3>
            </div>
            {summaryParts.length > 0 && (
              <p className="text-sm text-text-secondary mt-1">
                {summaryParts.join(" · ")}
              </p>
            )}
            {tags.length > 0 && (
              <div className="flex gap-1.5 mt-2">
                {tags.map((tag) => (
                  <span key={tag} className="text-xs text-xp-bar bg-xp-bar/10 px-2 py-0.5 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg text-text-muted hover:text-xp-bar transition-colors opacity-0 group-hover:opacity-100"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => deleteVaultItem(item.id)}
              className="p-1.5 rounded-lg text-text-muted hover:text-accent-red transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-4 pt-3 border-t border-border space-y-2">
            {catConfig.fields.map((field) => {
              const val = data[field.key];
              if (!val) return null;
              return (
                <div key={field.key} className="flex justify-between text-sm">
                  <span className="text-text-muted">{field.label}</span>
                  <span className="text-text-primary">{val}</span>
                </div>
              );
            })}
            {item.notes && (
              <div className="text-sm">
                <span className="text-text-muted">Notes: </span>
                <span className="text-text-primary">{item.notes}</span>
              </div>
            )}
            {item.reminders.length > 0 && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs font-medium text-text-secondary mb-1">Reminders:</p>
                {item.reminders.map((r) => (
                  <div key={r.id} className="text-xs text-text-muted">
                    ⏰ {new Date(r.remindAt).toLocaleDateString()} ({r.repeat})
                    {r.message && ` — ${r.message}`}
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-text-muted">
              Updated: {new Date(item.updatedAt).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      {editing && (
        <VaultItemForm onClose={() => setEditing(false)} editItem={item} />
      )}
    </>
  );
}
