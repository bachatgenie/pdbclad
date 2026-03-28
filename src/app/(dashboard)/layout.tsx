import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import { CommandBar } from "@/components/command-bar";
import { XPBar } from "@/components/xp-bar";
import { prisma } from "@/lib/prisma";
import { User } from "lucide-react";
import { LoginStreakTracker } from "@/components/login-streak-tracker";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-bg-primary">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-bg-primary/80 backdrop-blur-xl border-b border-border px-6 py-3">
          <div className="flex items-center justify-between">
            <CommandBar />

            <div className="flex items-center gap-4">
              <div className="hidden sm:block w-48">
                <XPBar xp={user.xp} level={user.level} compact />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-text-primary hidden sm:inline">
                  {user.name}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">{children}</main>
        <LoginStreakTracker />
      </div>
    </div>
  );
}
