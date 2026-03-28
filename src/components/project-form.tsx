"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { createProject } from "@/lib/actions";

const COLOR_OPTIONS = [
  "#0066cc", "#10b981", "#f59e0b", "#ef4444", "#f97316",
  "#0099cc", "#ec4899", "#8b5cf6",
];

export function ProjectForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#0066cc");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || submitting) return;

    setSubmitting(true);
    await createProject({ title, description, color });
    setTitle("");
    setDescription("");
    setColor("#0066cc");
    setIsOpen(false);
    setSubmitting(false);
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-xp-bar text-white font-medium hover:opacity-90 transition-opacity"
      >
        <Plus className="w-4 h-4" />
        New Project
      </button>
    );
  }

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Create Project</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 rounded-lg hover:bg-bg-card-hover text-text-muted"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-text-secondary mb-1">
            Title <span className="text-accent-red">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Learn Rust, Fitness Transformation"
            className="w-full px-4 py-2.5 rounded-xl bg-bg-primary border border-border text-text-primary placeholder-text-muted focus:border-xp-bar focus:ring-1 focus:ring-xp-bar transition-colors"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this project about?"
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl bg-bg-primary border border-border text-text-primary placeholder-text-muted focus:border-xp-bar focus:ring-1 focus:ring-xp-bar transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-2">Color</label>
          <div className="flex gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-all ${
                  color === c ? "ring-2 ring-offset-2 ring-offset-bg-primary ring-text-primary scale-110" : "hover:scale-110"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={!title.trim() || submitting}
          className="w-full py-2.5 rounded-xl bg-xp-bar text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {submitting ? "Creating..." : "Create Project"}
        </button>
      </form>
    </div>
  );
}
