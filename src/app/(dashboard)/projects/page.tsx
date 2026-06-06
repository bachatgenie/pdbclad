import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProjectForm } from "@/components/project-form";
import { ProjectCard } from "@/components/project-card";
import { FolderKanban } from "lucide-react";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    include: { milestones: { orderBy: { order: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  const activeProjects = projects.filter((p) => p.status === "active");
  const onHoldProjects = projects.filter((p) => p.status === "on_hold");
  const completedProjects = projects.filter((p) => p.status === "completed" || p.status === "archived");

  return (
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
        <div className="space-y-8">
          {/* Active projects */}
          {activeProjects.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                Active ({activeProjects.length})
              </h2>
              {activeProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </section>
          )}

          {/* On hold */}
          {onHoldProjects.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-accent-yellow uppercase tracking-wide">
                On Hold ({onHoldProjects.length})
              </h2>
              {onHoldProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </section>
          )}

          {/* Completed & Archived */}
          {completedProjects.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide">
                Completed ({completedProjects.length})
              </h2>
              {completedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
