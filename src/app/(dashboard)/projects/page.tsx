import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    include: { milestones: { orderBy: { order: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Projects</h1>

      {projects.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center">
          <p className="text-text-muted">No projects yet. Coming soon with full CRUD!</p>
        </div>
      ) : (
        projects.map((project) => {
          const completedMilestones = project.milestones.filter((m) => m.completedAt).length;
          return (
            <div key={project.id} className="glass rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                <h2 className="text-lg font-semibold">{project.title}</h2>
                <span className="text-xs text-text-muted ml-auto">{project.status}</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-bg-card">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${project.progressPct}%`,
                    backgroundColor: project.color,
                  }}
                />
              </div>
              <span className="text-xs text-text-muted">{project.progressPct}%</span>

              {/* Milestones */}
              {project.milestones.length > 0 && (
                <div className="space-y-1 mt-2">
                  {project.milestones.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 text-sm">
                      <span>{m.completedAt ? "✅" : "○"}</span>
                      <span className={m.completedAt ? "text-text-muted line-through" : ""}>
                        {m.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
