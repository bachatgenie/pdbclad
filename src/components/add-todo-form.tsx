"use client";

import { createTodo } from "@/lib/actions";
import { useState } from "react";
import { Plus, ChevronDown } from "lucide-react";

export function AddTodoForm() {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [isLifetime, setIsLifetime] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const formData = new FormData();
    formData.set("title", title);
    formData.set("priority", priority);
    if (dueDate) formData.set("dueDate", dueDate);
    if (isLifetime) formData.set("isLifetime", "true");
    await createTodo(formData);
    setTitle("");
    setDueDate("");
    setPriority("medium");
    setIsLifetime(false);
    setExpanded(false);
  }

  const priorityColors: Record<string, string> = {
    high: "bg-accent-red/20 text-accent-red border-accent-red/30",
    medium: "bg-accent-yellow/20 text-accent-yellow border-accent-yellow/30",
    low: "bg-accent-green/20 text-accent-green border-accent-green/30",
  };

  return (
    <form onSubmit={handleSubmit} className="glass rounded-xl p-4 space-y-3">
      <div className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-bg-primary border border-border text-text-primary placeholder-text-muted focus:border-xp-bar focus:ring-1 focus:ring-xp-bar transition-colors"
        />
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="px-3 py-2.5 rounded-xl bg-bg-card border border-border text-text-muted hover:text-text-primary transition-colors"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
        <button
          type="submit"
          disabled={!title.trim()}
          className="px-4 py-2.5 rounded-xl bg-xp-bar text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {expanded && (
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {/* Priority */}
          <div className="flex gap-1.5">
            {(["high", "medium", "low"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                  priority === p ? priorityColors[p] : "bg-bg-card border-border text-text-muted"
                }`}
              >
                {p === "high" ? "🔴" : p === "medium" ? "🟡" : "🟢"} {p}
              </button>
            ))}
          </div>

          {/* Due date */}
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="px-3 py-1 rounded-lg bg-bg-card border border-border text-text-secondary text-xs focus:border-xp-bar"
          />

          {/* Life list toggle */}
          <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={isLifetime}
              onChange={(e) => setIsLifetime(e.target.checked)}
              className="rounded border-border"
            />
            ⭐ Life List
          </label>
        </div>
      )}
    </form>
  );
}
