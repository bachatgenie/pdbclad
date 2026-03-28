"use client";

import { LogOut } from "lucide-react";

export function SignOutButton() {
  async function handleSignOut() {
    // Use the NextAuth signout endpoint directly
    const res = await fetch("/api/auth/signout", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        csrfToken: await getCsrfToken(),
        callbackUrl: "/login",
      }),
    });
    // Redirect manually
    window.location.href = "/login";
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-accent-red/70 hover:text-accent-red hover:bg-accent-red/10 transition-all w-full"
    >
      <LogOut className="w-5 h-5" />
      Sign Out
    </button>
  );
}

async function getCsrfToken(): Promise<string> {
  const res = await fetch("/api/auth/csrf");
  const data = await res.json();
  return data.csrfToken;
}
