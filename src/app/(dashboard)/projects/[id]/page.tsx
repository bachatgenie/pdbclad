import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { ProjectDetail } from "@/components/project-detail";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const [project, areas] = await Promise.all([
    prisma.project.findFirst({
      where: { id, userId: session.user.id },
      include: {
        area: true,
        milestones: {
          orderBy: { order: "asc" },
          include: {
            subtasks: { orderBy: { order: "asc" } },
          },
        },
      },
    }),
    prisma.area.findMany({
      where: { userId: session.user.id },
      orderBy: { order: "asc" },
    }),
  ]);

  if (!project) notFound();

  return <ProjectDetail project={project} areas={areas} />;
}
