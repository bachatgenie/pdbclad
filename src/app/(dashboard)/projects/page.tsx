import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProjectForm } from "@/components/project-form";
import { ProjectsPageClient } from "@/components/projects-page-client";
import { FolderKanban } from "lucide-react";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [projects, areas] = await Promise.all([
    prisma.project.findMany({
      where: { userId: session.user.id },
      include: {
        area: true,
        milestones: { orderBy: { order: "asc" } },
        subtasks: { orderBy: { order: "asc" } },
        waitingFor: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.area.findMany({
      where: { userId: session.user.id },
      orderBy: { order: "asc" },
    }),
  ]);

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Projects</h1>
          <ProjectForm />
        </div>

        {projects.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center space-y-3">
            <FolderKanban className="w-12 h-12 mx-auto text-text-muted" />
            <p className="text-text-secondary font-medium">No projects yet</p>
            <p className="text-sm text-text-muted">
              Create your first project to start tracking milestones and earning XP.
            </p>
          </div>
        ) : (
          <ProjectsPageClient projects={projects} areas={areas} />
        )}
      </div>
    </>
  );
}
