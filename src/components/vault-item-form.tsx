"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { createVaultItem, updateVaultItem } from "@/lib/actions";
import { VAULT_CATEGORIES, type VaultCategoryKey } from "@/lib/vault-categories";
import { motion } from "framer-motion";

interface VaultItemFormProps {
  onClose: () => void;
  defaultCategory?: string;
  editItem?: {
    id: string;
    category: string;
    title: string;
    data: string;
    tags: string;
    notes: string | null;
  };
}

export function VaultItemForm({ onClose, defaultCategory, editItem }: VaultItemFormProps) {
  const isEditing = !!editItem;
  const [category, setCategory] = useState<VaultCategoryKey>(
    (editItem?.category || defaultCategory || "subscription") as VaultCategoryKey
  );
  const [title, setTitle] = useState(editItem?.title || "");
  const [tags, setTags] = useState(
    editItem ? (JSON.parse(editItem.tags) as string[]).join(", ") : ""
  );
  const [notes, setNotes] = useState(editItem?.notes || "");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
    if (editItem) {
      try { return JSON.parse(editItem.data); } catch { return {}; }
    }
    return {};
  });
  const [reminderDate, setReminderDate] = useState("");
  const [reminderRepeat, setReminderRepeat] = useState("none");
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const catConfig = VAULT_CATEGORIES[category];

  function setField(key: string, value: string) {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  }

  // Required fields: title always required, first 2 category fields required
  const requiredFieldKeys = catConfig.fields.slice(0, 2).map((f) => f.key);

  function isFormValid() {
    if (!title.trim()) return false;
    for (const key of requiredFieldKeys) {
      if (!fieldValues[key]?.trim()) return false;
    }
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAttempted(true);
    if (!isFormValid()) return;
    setSubmitting(true);

    const parsedTags = tags
      .split(",")
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean);

    const reminders =
      reminderDate && !isEditing
        ? [{ remindAt: reminderDate, repeat: reminderRepeat }]
        : [];

    if (isEditing && editItem) {
      await updateVaultItem(editItem.id, {
        category,
        title: title.trim(),
        data: fieldValues,
        tags: parsedTags,
        notes: notes || undefined,
      });
    } else {
      await createVaultItem({
        category,
        title: title.trim(),
        data: fieldValues,
        tags: parsedTags,
        notes: notes || undefined,
        reminders,
      });
    }

    setSubmitting(false);
    onClose();
  }

  function fieldError(key: string) {
    return attempted && requiredFieldKeys.includes(key as typeof requiredFieldKeys[number]) && !fieldValues[key]?.trim();
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="fixed z-50 top-[5%] left-1/2 -translate-x-1/2 w-full max-w-lg max-h-[90vh] overflow-y-auto px-4"
      >
        <div className="glass-bright rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold">
              {isEditing ? "Edit Vault Item" : "Add to Vault"}
            </h2>
            <button onClick={onClose} className="text-text-muted hover:text-text-primary">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as VaultCategoryKey);
                  setFieldValues({});
                  setAttempted(false);
                }}
                className="w-full px-3 py-2 rounded-xl bg-bg-primary border border-border text-text-primary text-sm"
              >
                {Object.entries(VAULT_CATEGORIES).map(([key, cat]) => (
                  <option key={key} value={key}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Title <span className="text-accent-red">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`e.g. "${category === "subscription" ? "Netflix" : category === "insurance" ? "Car Insurance" : category === "vehicle" ? "Honda City" : category === "finance" ? "HDFC Credit Card" : "Item name"}"`}
                className={`w-full px-3 py-2 rounded-xl bg-bg-primary border text-text-primary placeholder-text-muted text-sm focus:border-accent-purple focus:ring-1 focus:ring-accent-purple ${
                  attempted && !title.trim() ? "border-accent-red" : "border-border"
                }`}
              />
              {attempted && !title.trim() && (
                <p className="text-xs text-accent-red mt-1">Title is required</p>
              )}
            </div>

            {/* Category-specific fields */}
            <div className="space-y-3">
              {catConfig.fields.map((field, idx) => {
                const isRequired = idx < 2;
                const hasError = fieldError(field.key);
                return (
                  <div key={field.key}>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">
                      {field.label} {isRequired && <span className="text-accent-red">*</span>}
                    </label>
                    {field.type === "select" ? (
                      <select
                        value={fieldValues[field.key] || ""}
                        onChange={(e) => setField(field.key, e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl bg-bg-primary border text-text-primary text-sm ${
                          hasError ? "border-accent-red" : "border-border"
                        }`}
                      >
                        <option value="">Select...</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                        value={fieldValues[field.key] || ""}
                        onChange={(e) => setField(field.key, e.target.value)}
                        step={field.type === "number" ? "0.01" : undefined}
                        className={`w-full px-3 py-2 rounded-xl bg-bg-primary border text-text-primary text-sm focus:border-accent-purple focus:ring-1 focus:ring-accent-purple ${
                          hasError ? "border-accent-red" : "border-border"
                        }`}
                      />
                    )}
                    {hasError && (
                      <p className="text-xs text-accent-red mt-1">{field.label} is required</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Tags <span className="text-text-muted text-[10px]">(comma-separated)</span>
              </label>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="ai, tools, entertainment"
                className="w-full px-3 py-2 rounded-xl bg-bg-primary border border-border text-text-primary placeholder-text-muted text-sm focus:border-accent-purple focus:ring-1 focus:ring-accent-purple"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any extra details..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-bg-primary border border-border text-text-primary placeholder-text-muted text-sm focus:border-accent-purple focus:ring-1 focus:ring-accent-purple resize-none"
              />
            </div>

            {/* Reminder */}
            {!isEditing && (
              <div className="border-t border-border pt-4">
                <h3 className="text-xs font-semibold text-text-secondary mb-2">
                  SET A REMINDER
                </h3>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-bg-primary border border-border text-text-primary text-sm"
                  />
                  <select
                    value={reminderRepeat}
                    onChange={(e) => setReminderRepeat(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-bg-primary border border-border text-text-primary text-sm"
                  >
                    <option value="none">Once</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-accent-purple to-accent-blue text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting
                ? "Saving..."
                : isEditing
                ? "Update Item"
                : "Save to Vault 🧠"}
            </button>
          </form>
        </div>
      </motion.div>
    </>
  );
}
