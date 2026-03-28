"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Dashboard error:", error);
    }
  }, [error]);

  const isDatabaseError =
    error.message?.toLowerCase().includes("database") ||
    error.message?.toLowerCase().includes("prisma") ||
    error.message?.toLowerCase().includes("connection");

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
      <div className="max-w-md w-full bg-bg-card rounded-lg p-8">
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          {isDatabaseError ? "Database Error" : "Dashboard Error"}
        </h1>
        <p className="text-text-secondary mb-4">
          {isDatabaseError
            ? "Unable to connect to the database. Please check your database configuration and try again."
            : error.message ||
              "An error occurred while loading the dashboard."}
        </p>

        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex-1 bg-accent-purple hover:bg-accent-purple/90 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
          <Link
            href="/login"
            className="flex-1 bg-bg-secondary hover:bg-bg-card-hover text-text-primary px-4 py-2 rounded-lg transition-colors text-center"
          >
            Back to Login
          </Link>
        </div>

        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400 font-mono overflow-auto max-h-32">
            {error.message}
          </div>
        )}
      </div>
    </div>
  );
}
