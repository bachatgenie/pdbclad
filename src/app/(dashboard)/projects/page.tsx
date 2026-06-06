import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProjectForm } from "@/components/project-form";
import { ProjectCard } from "@/components/project-card";
import { FolderKanban, Layers } from "lucide-react";
import Link from "next/link";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [projects, areas] = await Promise.all([
    prisma.project.findMany({
      where: { userId: session.user.id },
      include: {
        milestones: { orderBy: { order: "asc" } },
        area: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.area.findMany({
      where: { userId: session.user.id },
      orderBy: { order: "asc" },
    }),
  ]);

  // Group by area
  const byArea: Record<string, typeof projects> = {};
  const noArea: typeof projects = [];

  for (const p of projects) {
    if (p.areaId && p.area) {
      if (!byArea[p.areaId]) byArea[p.areaId] = [];
      byArea[p.areaId].push(p);
    } else {
      noArea.push(p);
    }
  }

  const activeProjects = projects.filter((p) => p.status === "active");
  const completedProjects = projects.filter((p) => p.status === "completed" || p.status === "archived");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {activeProjects.length} active · {completedProjects.length} completed
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/areas"
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors text-sm"
          >
            <Layers className="w-4 h-4" />
            Manage Areas
          </Link>
          <ProjectForm areas={areas} />
        </div>
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
          {/* Projects grouped by area */}
          {areas.map((area) => {
            const areaProjects = byArea[area.id];
            if (!areaProjects || areaProjects.length === 0) return null;
            return (
              <section key={area.id} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{area.icon}</span>
                  <h2
                    className="text-sm font-semibold uppercase tracking-wide"
                    style={{ color: area.color }}
                  >
                    {area.name}
                  </h2>
                  <span className="text-xs text-text-muted">({areaProjects.length})</span>
                </div>
                {areaProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </section>
            );
          })}

          {/* Projects without an area */}
          {noArea.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                Unassigned ({noArea.length})
              </h2>
              {noArea.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
