"use client";

import { createHabit } from "@/lib/actions";
import { useState } from "react";
import { Plus, ChevronDown } from "lucide-react";

const UNIT_PRESETS = [
  { value: "", label: "Yes/No (boolean)" },
  { value: "minutes", label: "Minutes" },
  { value: "cups", label: "Cups" },
  { value: "pages", label: "Pages" },
  { value: "reps", label: "Reps" },
  { value: "km", label: "Kilometers" },
  { value: "glasses", label: "Glasses" },
  { value: "times", label: "Times" },
];

const ICON_PRESETS = ["⭐", "🧘", "📖", "🏋️", "✍️", "💻", "🚫", "📱", "🌙", "💧", "🍎", "🏃", "🎵", "🧠", "☕"];

export function AddHabitForm() {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("good");
  const [icon, setIcon] = useState("⭐");
  const [unit, setUnit] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [expanded, setExpanded] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const formData = new FormData();
    formData.set("title", title);
    formData.set("type", type);
    formData.set("icon", icon);
    if (unit) formData.set("unit", unit);
    if (targetValue) formData.set("targetValue", targetValue);
    await createHabit(formData);
    setTitle("");
    setUnit("");
    setTargetValue("");
    setExpanded(false);
  }

  return (
    <form onSubmit={handleSubmit} className="glass rounded-xl p-4 space-y-3">
      <div className="flex gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-bg-card border border-border text-text-primary text-sm"
        >
          <option value="good">Good</option>
          <option value="bad">Bad</option>
        </select>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a habit..."
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
        <div className="space-y-3 pt-1">
          {/* Icon picker */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Icon</label>
            <div className="flex flex-wrap gap-1.5">
              {ICON_PRESETS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all ${
                    icon === i ? "bg-xp-bar/20 ring-1 ring-xp-bar" : "bg-bg-card hover:bg-bg-card-hover"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          {/* Measurement */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Measurement
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-bg-card border border-border text-text-primary text-sm"
              >
                {UNIT_PRESETS.map((u) => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>

            {unit && (
              <div className="w-32">
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Daily target
                </label>
                <input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder={type === "bad" ? "Max" : "Goal"}
                  min="1"
                  step="1"
                  className="w-full px-3 py-2 rounded-xl bg-bg-card border border-border text-text-primary text-sm"
                />
              </div>
            )}
          </div>

          {unit && (
            <p className="text-xs text-text-muted">
              {type === "good"
                ? `Log ${unit} each time. ${targetValue ? `Goal: ${targetValue} ${unit}/day.` : "No daily target set — any amount counts."}`
                : `Track each occurrence. ${targetValue ? `Try to stay under ${targetValue} ${unit}/day.` : "Each log costs XP but earns honesty points."}`
              }
            </p>
          )}
        </div>
      )}
    </form>
  );
}
