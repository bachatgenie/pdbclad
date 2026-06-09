"use client";

import { useState } from "react";
import { ProjectCard } from "./project-card";
import { ProjectDetailPanel } from "./project-detail-panel";

interface Project {
  id: string;
  userId: string;
  areaId: string | null;
  title: string;
  description: string | null;
  successDefinition: string | null;
  firstStep: string | null;
  notes: string | null;
  status: string;
  progressPct: number;
  color: string;
  createdAt: Date;
  milestones: Array<{
    id: string;
    projectId: string;
    title: string;
    order: number;
    timeFrame: string | null;
    isFirstStep: boolean;
    completedAt: Date | null;
    createdAt: Date;
  }>;
  subtasks: Array<{
    id: string;
    projectId: string;
    milestoneId: string | null;
    title: string;
    order: number;
    timeFrame: string | null;
    completed: boolean;
    completedAt: Date | null;
    createdAt: Date;
  }>;
  waitingFor: Array<{
    id: string;
    projectId: string;
    referencedMilestoneId: string | null;
    referencedSubtaskId: string | null;
    note: string | null;
    createdAt: Date;
  }>;
}

interface ProjectsPageClientProps {
  projects: Project[];
}

export function ProjectsPageClient({ projects }: ProjectsPageClientProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const activeProjects = projects.filter((p) => p.status === "active");
  const onHoldProjects = projects.filter((p) => p.status === "on_hold");
  const completedProjects = projects.filter((p) => p.status === "completed" || p.status === "archived");

  return (
    <div className="space-y-8">
      {/* Active projects */}
      {activeProjects.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
            Active ({activeProjects.length})
          </h2>
          {activeProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onOpenDetail={() => setSelectedProjectId(project.id)}
            />
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
            <ProjectCard
              key={project.id}
              project={project}
              onOpenDetail={() => setSelectedProjectId(project.id)}
            />
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
            <ProjectCard
              key={project.id}
              project={project}
              onOpenDetail={() => setSelectedProjectId(project.id)}
            />
          ))}
        </section>
      )}

      {/* Detail Panel Overlay */}
      {selectedProject && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => setSelectedProjectId(null)}
          />
          {/* Panel */}
          <ProjectDetailPanel project={selectedProject} onClose={() => setSelectedProjectId(null)} />
        </>
      )}
    </div>
  );
}
