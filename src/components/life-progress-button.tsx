"use client";

import { incrementLifeProgress } from "@/lib/actions";
import { Plus, Minus } from "lucide-react";

interface LifeProgressButtonProps {
  todoId: string;
  progress: number;
  progressMax: number;
}

export function LifeProgressButton({ todoId, progress, progressMax }: LifeProgressButtonProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-text-muted">
        {progress}/{progressMax}
      </span>
      <div className="w-16 h-1.5 rounded-full bg-bg-card">
        <div
          className="h-full rounded-full bg-accent-purple transition-all"
          style={{ width: `${(progress / progressMax) * 100}%` }}
        />
      </div>
      <div className="flex gap-0.5">
        <button
          onClick={() => incrementLifeProgress(todoId, 1)}
          className="w-6 h-6 rounded-md bg-bg-card hover:bg-accent-purple/20 flex items-center justify-center text-text-muted hover:text-accent-purple transition-colors"
          title="+1"
        >
          <Plus className="w-3 h-3" />
        </button>
        {progress > 0 && (
          <button
            onClick={() => incrementLifeProgress(todoId, -1)}
            className="w-6 h-6 rounded-md bg-bg-card hover:bg-accent-red/20 flex items-center justify-center text-text-muted hover:text-accent-red transition-colors"
            title="-1"
          >
            <Minus className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
