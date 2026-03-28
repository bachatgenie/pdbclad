"use client";

import { toggleHabitLog, logHabitValue, deleteHabit } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { Trash2, Plus, Minus, Check } from "lucide-react";
import { useState } from "react";

interface HabitQuickToggleProps {
  habit: {
    id: string;
    title: string;
    icon: string;
    type: string;
    unit: string | null;
    targetValue: number | null;
  };
  loggedToday: boolean;
  todayValue?: number | null;
  streak?: number;
  recentDays?: boolean[]; // last 7 days: true = logged, false = not
  showDelete?: boolean;
}

export function HabitQuickToggle({
  habit,
  loggedToday,
  todayValue,
  streak = 0,
  recentDays = [],
  showDelete,
}: HabitQuickToggleProps) {
  const isGood = habit.type === "good";
  const hasUnit = !!habit.unit;
  const [customValue, setCustomValue] = useState("");
  const [showInput, setShowInput] = useState(false);

  const progress = todayValue || 0;
  const target = habit.targetValue || 0;
  const progressPct = target > 0 ? Math.min((progress / target) * 100, 100) : 0;
  const targetMet = target > 0 && progress >= target;

  async function handleSetValue(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(customValue);
    if (isNaN(val) || val <= 0) return;
    await logHabitValue(habit.id, val);
    setCustomValue("");
    setShowInput(false);
  }

  if (hasUnit) {
    // Quantity-based habit — cleaner layout
    return (
      <div
        className={cn(
          "group rounded-xl border transition-all px-4 py-3",
          targetMet && isGood && "border-accent-green/30 bg-accent-green/5",
          targetMet && !isGood && "border-accent-red/30 bg-accent-red/5",
          !targetMet && "border-border bg-bg-card"
        )}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{habit.icon}</span>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-primary truncate">
                {habit.title}
              </span>
              {targetMet && (
                <span className="flex items-center gap-0.5 text-xs font-medium text-accent-green">
                  <Check className="w-3 h-3" /> Done
                </span>
              )}
            </div>

            {/* Progress display */}
            <div className="flex items-center gap-2 mt-1">
              {target > 0 ? (
                <span
                  className={cn(
                    "text-xs font-semibold",
                    targetMet
                      ? isGood
                        ? "text-accent-green"
                        : "text-accent-red"
                      : "text-text-secondary"
                  )}
                >
                  {progress}/{target} {habit.unit}
                </span>
              ) : (
                progress > 0 && (
                  <span className="text-xs text-text-secondary">
                    {progress} {habit.unit}
                  </span>
                )
              )}

              {/* Mini 7-day dots */}
              {recentDays.length > 0 && (
                <div className="flex gap-0.5 ml-auto">
                  {recentDays.map((logged, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        logged
                          ? isGood
                            ? "bg-accent-green"
                            : "bg-accent-red"
                          : "bg-border"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Progress bar */}
            {target > 0 && (
              <div className="w-full h-1.5 rounded-full bg-bg-secondary mt-1.5">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    isGood
                      ? targetMet
                        ? "bg-accent-green"
                        : "bg-xp-bar"
                      : targetMet
                        ? "bg-accent-red"
                        : "bg-accent-yellow"
                  )}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            )}
          </div>

          {/* Quick buttons */}
          <div className="flex items-center gap-1">
            {progress > 0 && (
              <button
                onClick={() => logHabitValue(habit.id, -1)}
                className="w-8 h-8 rounded-lg bg-bg-secondary hover:bg-accent-red/10 flex items-center justify-center text-text-muted hover:text-accent-red transition-colors"
                title={`-1 ${habit.unit}`}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
            )}

            {showInput ? (
              <form onSubmit={handleSetValue} className="flex items-center gap-1">
                <input
                  type="number"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  placeholder="0"
                  className="w-14 px-2 py-1.5 rounded-lg bg-bg-primary border border-border text-sm text-center text-text-primary focus:border-xp-bar focus:ring-1 focus:ring-xp-bar"
                  autoFocus
                  min="0"
                  step="any"
                />
                <button
                  type="submit"
                  className="px-2 py-1.5 rounded-lg bg-xp-bar text-white text-xs"
                >
                  Log
                </button>
              </form>
            ) : (
              <>
                <button
                  onClick={() => logHabitValue(habit.id, 1)}
                  className="w-8 h-8 rounded-lg bg-bg-secondary hover:bg-xp-bar/10 flex items-center justify-center text-text-muted hover:text-xp-bar transition-colors"
                  title={`+1 ${habit.unit}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setShowInput(true)}
                  className="text-[10px] px-2 py-1 rounded-lg bg-bg-secondary text-text-muted hover:text-xp-bar transition-colors"
                  title="Enter custom value"
                >
                  #
                </button>
              </>
            )}
          </div>

          {showDelete && (
            <button
              onClick={() => deleteHabit(habit.id)}
              className="hidden group-hover:block p-1.5 rounded-lg hover:bg-accent-red/10 text-text-muted hover:text-accent-red transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Streak indicator */}
        {streak > 0 && (
          <div className="mt-2 pt-2 border-t border-border/50 text-xs text-text-muted">
            {isGood ? (
              <span className={streak >= 7 ? "text-accent-orange" : ""}>
                🔥 {streak} day streak
              </span>
            ) : (
              <span>✨ {streak} days clean</span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Boolean habit — simpler toggle
  return (
    <div
      className={cn(
        "group rounded-xl border transition-all px-4 py-3",
        loggedToday && isGood && "border-accent-green/30 bg-accent-green/5",
        loggedToday && !isGood && "border-accent-red/30 bg-accent-red/5",
        !loggedToday && "border-border bg-bg-card hover:bg-bg-card-hover"
      )}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => toggleHabitLog(habit.id)}
          className="flex-1 flex items-center gap-3 text-left"
        >
          <span className="text-xl">{habit.icon}</span>
          <div className="flex-1 min-w-0">
            <span
              className={cn(
                "text-sm font-medium",
                loggedToday ? "text-text-muted" : "text-text-primary"
              )}
            >
              {habit.title}
            </span>

            {/* Mini 7-day dots */}
            {recentDays.length > 0 && (
              <div className="flex gap-0.5 mt-1">
                {recentDays.map((logged, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      logged
                        ? isGood
                          ? "bg-accent-green"
                          : "bg-accent-red"
                        : "bg-border"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
          {loggedToday ? (
            <span
              className={cn(
                "text-xs font-medium",
                isGood ? "text-accent-green" : "text-accent-red"
              )}
            >
              {isGood ? "✅ Done" : "❌ Logged"}
            </span>
          ) : (
            <span className="text-xs text-text-muted">tap to log</span>
          )}
        </button>

        {/* Streak */}
        {streak > 0 && (
          <span className={cn("text-xs text-text-muted", streak >= 7 && isGood && "text-accent-orange")}>
            {isGood ? `🔥 ${streak}d` : `✨ ${streak}d`}
          </span>
        )}

        {showDelete && (
          <button
            onClick={() => deleteHabit(habit.id)}
            className="hidden group-hover:block p-1.5 rounded-lg hover:bg-accent-red/10 text-text-muted hover:text-accent-red transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
