import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AreasManager } from "@/components/areas-manager";

export default async function AreasPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const areas = await prisma.area.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { projects: true } } },
    orderBy: { order: "asc" },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Areas</h1>
        <p className="text-text-secondary text-sm mt-1">
          Life areas (PARA) — group your projects by area of responsibility.
        </p>
      </div>
      <AreasManager initialAreas={areas} />
    </div>
  );
}
