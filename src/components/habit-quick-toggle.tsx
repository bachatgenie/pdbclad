"use client";

import { toggleHabitLog, logHabitValue, deleteHabit } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { Trash2, Plus, Minus } from "lucide-react";
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
  showDelete?: boolean;
}

export function HabitQuickToggle({ habit, loggedToday, todayValue, showDelete }: HabitQuickToggleProps) {
  const isGood = habit.type === "good";
  const hasUnit = !!habit.unit;
  const [note, setNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);

  const progress = todayValue || 0;
  const target = habit.targetValue || 0;
  const progressPct = target > 0 ? Math.min((progress / target) * 100, 100) : 0;
  const targetMet = target > 0 && progress >= target;

  if (hasUnit) {
    // Quantity-based habit
    return (
      <div className={cn(
        "group rounded-lg transition-all px-3 py-2.5",
        loggedToday && isGood && "bg-accent-green/5",
        loggedToday && !isGood && "bg-accent-red/5"
      )}>
        <div className="flex items-center gap-3">
          <span className="text-lg">{habit.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-primary truncate">{habit.title}</span>
              {target > 0 && (
                <span className={cn(
                  "text-xs font-medium",
                  targetMet ? (isGood ? "text-accent-green" : "text-accent-red") : "text-text-muted"
                )}>
                  {progress}/{target} {habit.unit}
                </span>
              )}
              {!target && progress > 0 && (
                <span className="text-xs text-text-muted">
                  {progress} {habit.unit}
                </span>
              )}
            </div>
            {/* Progress bar */}
            {target > 0 && (
              <div className="w-full h-1 rounded-full bg-bg-card mt-1.5">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    isGood
                      ? (targetMet ? "bg-accent-green" : "bg-accent-purple")
                      : (targetMet ? "bg-accent-red" : "bg-accent-yellow")
                  )}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            )}
          </div>

          {/* Quick +1 / -1 buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => logHabitValue(habit.id, 1)}
              className="w-7 h-7 rounded-lg bg-bg-card hover:bg-accent-purple/20 flex items-center justify-center text-text-muted hover:text-accent-purple transition-colors"
              title={`+1 ${habit.unit}`}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            {progress > 0 && (
              <button
                onClick={() => logHabitValue(habit.id, -1)}
                className="w-7 h-7 rounded-lg bg-bg-card hover:bg-accent-red/20 flex items-center justify-center text-text-muted hover:text-accent-red transition-colors"
                title={`-1 ${habit.unit}`}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {showDelete && (
            <button
              onClick={() => deleteHabit(habit.id)}
              className="hidden group-hover:block p-1 rounded text-text-muted hover:text-accent-red transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Boolean habit (original behavior)
  return (
    <div className={cn(
      "group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:bg-bg-card-hover",
      loggedToday && isGood && "bg-accent-green/5",
      loggedToday && !isGood && "bg-accent-red/5"
    )}>
      <button
        onClick={() => toggleHabitLog(habit.id)}
        className="flex-1 flex items-center gap-3 text-left"
      >
        <span className="text-lg">{habit.icon}</span>
        <span className={cn(
          "text-sm flex-1",
          loggedToday ? "text-text-muted" : "text-text-primary"
        )}>
          {habit.title}
        </span>
        {loggedToday ? (
          <span className={cn(
            "text-xs font-medium",
            isGood ? "text-accent-green" : "text-accent-red"
          )}>
            {isGood ? "✅ +15 XP" : "❌ -3 XP"}
          </span>
        ) : (
          <span className="text-xs text-text-muted">tap to log</span>
        )}
      </button>

      {showDelete && (
        <button
          onClick={() => deleteHabit(habit.id)}
          className="hidden group-hover:block p-1 rounded text-text-muted hover:text-accent-red transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
