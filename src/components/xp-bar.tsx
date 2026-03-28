import { cn } from "@/lib/utils";
import { getLevelTitle, getXPForNextLevel } from "@/lib/gamification";
import { Zap } from "lucide-react";

interface XPBarProps {
  xp: number;
  level: number;
  compact?: boolean;
}

export function XPBar({ xp, level, compact }: XPBarProps) {
  const nextLevelXP = getXPForNextLevel(level);
  const prevLevelXP = level > 1 ? getXPForNextLevel(level - 1) : 0;
  const progress = ((xp - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100;
  const title = getLevelTitle(level);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-xp-bar">Lv.{level}</span>
        <div className="w-20 h-1.5 rounded-full bg-xp-bar-bg">
          <div
            className="h-full rounded-full xp-bar-fill"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary">
            Level {level}
          </span>
          <Zap className="w-4 h-4 text-accent-yellow" />
          <span className="text-xs text-text-secondary">{title}</span>
        </div>
        <span className="text-xs text-text-muted">
          {xp.toLocaleString()} / {nextLevelXP.toLocaleString()} XP
        </span>
      </div>
      <div className="w-full h-2.5 rounded-full bg-xp-bar-bg">
        <div
          className={cn("h-full rounded-full xp-bar-fill")}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
}
