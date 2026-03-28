// XP rewards for different actions
export const XP_REWARDS = {
  COMPLETE_TODO: 10,
  COMPLETE_HABIT_GOOD: 15,
  LOG_BAD_HABIT: -5,
  LOG_BAD_HABIT_HONESTY: 2,
  LOG_ACTIVITY: 3,
  COMPLETE_MILESTONE: 50,
  WEEKLY_REVIEW: 30,
  DAILY_LOGIN_BASE: 5,
  DAILY_LOGIN_CAP: 50,
} as const;

// Level thresholds — XP needed to reach each level
const LEVEL_THRESHOLDS = [
  0, 0, 50, 120, 200, 500, 700, 1000, 1400, 1800, 2000, 2500, 3000, 3600,
  4200, 5000, 6000, 7000, 8000, 9500, 11000, 13000, 15000, 17500, 20000,
  23000, 26000, 29000, 32000, 36000, 40000, 44000, 48000, 52000, 56000, 60000,
  65000, 70000, 75000, 80000, 86000, 92000, 98000, 104000, 110000, 117000,
  124000, 131000, 138000, 146000, 50000,
];

export function getLevelForXP(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i;
  }
  return 1;
}

export function getXPForNextLevel(level: number): number {
  if (level >= LEVEL_THRESHOLDS.length - 1) return LEVEL_THRESHOLDS[level];
  return LEVEL_THRESHOLDS[level + 1];
}

export function getLevelTitle(level: number): string {
  if (level >= 50) return "Legend";
  if (level >= 30) return "Grandmaster";
  if (level >= 20) return "Master";
  if (level >= 10) return "Journeyman";
  if (level >= 5) return "Apprentice";
  return "Beginner";
}

export function getLoginStreakXP(streakDays: number): number {
  return Math.min(XP_REWARDS.DAILY_LOGIN_BASE * streakDays, XP_REWARDS.DAILY_LOGIN_CAP);
}

// Badge definitions
export const BADGES = {
  SEVEN_DAY_WARRIOR: {
    id: "seven_day_warrior",
    name: "7-Day Warrior",
    icon: "🔥",
    description: "Maintain a 7-day login streak",
  },
  CENTURY: {
    id: "century",
    name: "Century",
    icon: "⚡",
    description: "Complete 100 todos",
  },
  PROJECT_CLOSER: {
    id: "project_closer",
    name: "Project Closer",
    icon: "🎯",
    description: "Complete your first project",
  },
  EARLY_BIRD: {
    id: "early_bird",
    name: "Early Bird",
    icon: "🌅",
    description: "Log before 7am, 30 times",
  },
  HABIT_DIAMOND: {
    id: "habit_diamond",
    name: "Habit Diamond",
    icon: "💎",
    description: "Maintain a 30-day habit streak",
  },
  FIRST_LOG: {
    id: "first_log",
    name: "First Steps",
    icon: "👣",
    description: "Log your very first activity",
  },
  VAULT_STARTER: {
    id: "vault_starter",
    name: "Vault Keeper",
    icon: "🧠",
    description: "Add your first item to the Life Vault",
  },
} as const;
