"use client";

import { useEffect, useRef } from "react";
import { recordLoginStreak } from "@/lib/actions";

export function LoginStreakTracker() {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    recordLoginStreak();
  }, []);

  return null;
}
