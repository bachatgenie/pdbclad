import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AreasManager } from "@/components/areas-manager";
import { Layers } from "lucide-react";

export default async function AreasPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const areas = await prisma.area.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { projects: true } },
    },
    orderBy: { order: "asc" },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="w-6 h-6 text-xp-bar" />
            Areas of Life
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            Ongoing responsibilities and domains — your projects nest under these.
          </p>
        </div>
      </div>

      <AreasManager initialAreas={areas} />
    </div>
  );
}
