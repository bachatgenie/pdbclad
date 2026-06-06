"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  Pencil,
  Check,
  X,
  ArrowRight,
} from "lucide-react";
import {
  deleteProject,
  updateProject,
  createMilestone,
  toggleMilestone,
  deleteMilestone,
} from "@/lib/actions";

type Milestone = {
  id: string;
  title: string;
  completedAt: Date | null;
  order: number;
};

type Project = {
  id: string;
  title: string;
  description: string | null;
  successDefinition: string | null;
  status: string;
  progressPct: number;
  color: string;
  milestones: Milestone[];
};

const STATUS_OPTIONS = [
  { value: "active", label: "Active", color: "text-accent-green" },
  { value: "on_hold", label: "On Hold", color: "text-accent-yellow" },
  { value: "completed", label: "Completed", color: "text-xp-bar" },
  { value: "archived", label: "Archived", color: "text-text-muted" },
];

export function ProjectCard({ project }: { project: Project }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(project.title);
  const [editDesc, setEditDesc] = useState(project.description || "");
  const [newMilestone, setNewMilestone] = useState("");
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const completedCount = project.milestones.filter((m) => m.completedAt).length;
  const totalCount = project.milestones.length;
  const statusInfo = STATUS_OPTIONS.find((s) => s.value === project.status) || STATUS_OPTIONS[0];

  async function handleSaveEdit() {
    if (!editTitle.trim()) return;
    setSubmitting(true);
    try {
      await updateProject(project.id, { title: editTitle, description: editDesc });
      setEditing(false);
    } catch (err) {
      console.error("Update project failed:", err);
      alert("Failed to update project: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    try {
      await updateProject(project.id, { status: newStatus });
    } catch (err) {
      console.error("Status change failed:", err);
    }
  }

  async function handleAddMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!newMilestone.trim()) return;
    setSubmitting(true);
    try {
      await createMilestone(project.id, newMilestone);
      setNewMilestone("");
      setAddingMilestone(false);
    } catch (err) {
      console.error("Add milestone failed:", err);
      alert("Failed to add milestone: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this project and all its milestones?")) return;
    try {
      await deleteProject(project.id);
    } catch (err) {
      console.error("Delete project failed:", err);
      alert("Failed to delete project: " + (err instanceof Error ? err.message : String(err)));
    }
  }

  return (
    <div className="glass rounded-xl p-5 space-y-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="w-3 h-3 rounded-full mt-1.5 shrink-0"
          style={{ backgroundColor: project.color }}
        />

        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-bg-primary border border-border text-text-primary text-lg font-semibold focus:border-xp-bar focus:ring-1 focus:ring-xp-bar"
                autoFocus
              />
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className="w-full px-3 py-1.5 rounded-lg bg-bg-primary border border-border text-text-primary text-sm focus:border-xp-bar focus:ring-1 focus:ring-xp-bar resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={submitting}
                  className="px-3 py-1 rounded-lg bg-xp-bar text-white text-sm flex items-center gap-1"
                >
                  <Check className="w-3 h-3" /> Save
                </button>
                <button
                  onClick={() => { setEditing(false); setEditTitle(project.title); setEditDesc(project.description || ""); }}
                  className="px-3 py-1 rounded-lg bg-bg-secondary text-text-secondary text-sm flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <Link href={`/projects/${project.id}`} className="group flex items-center gap-1.5">
                <h2 className="text-lg font-semibold group-hover:text-xp-bar transition-colors">{project.title}</h2>
                <ArrowRight className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              {project.description && (
                <p className="text-sm text-text-secondary mt-0.5">{project.description}</p>
              )}
              {project.successDefinition && (
                <p className="text-xs text-text-muted mt-0.5 italic">✓ {project.successDefinition}</p>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Status dropdown */}
          <select
            value={project.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className={`text-xs px-2 py-1 rounded-lg bg-bg-secondary border border-border ${statusInfo.color} cursor-pointer`}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg hover:bg-bg-card-hover text-text-muted hover:text-text-primary transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg hover:bg-accent-red/10 text-text-muted hover:text-accent-red transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-text-muted">
          <span>{completedCount}/{totalCount} milestones</span>
          <span>{project.progressPct}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-bg-secondary">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${project.progressPct}%`,
              backgroundColor: project.color,
            }}
          />
        </div>
      </div>

      {/* Milestones section - collapsed by default, expand inline */}
      {totalCount > 0 && (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Milestones ({totalCount})
          </button>

          {expanded && (
            <div className="mt-2 space-y-1.5">
              {project.milestones.map((m) => (
                <div key={m.id} className="flex items-center gap-2 group">
                  <button
                    onClick={() => toggleMilestone(m.id)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      m.completedAt
                        ? "bg-accent-green border-accent-green text-white"
                        : "border-border hover:border-xp-bar"
                    }`}
                  >
                    {m.completedAt && <Check className="w-3 h-3" />}
                  </button>
                  <span className={`text-sm flex-1 ${m.completedAt ? "text-text-muted line-through" : ""}`}>
                    {m.title}
                  </span>
                  {m.completedAt && (
                    <span className="text-[10px] text-accent-green font-medium">+50 XP</span>
                  )}
                  <button
                    onClick={() => deleteMilestone(m.id)}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-accent-red/10 text-text-muted hover:text-accent-red transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Add milestone inline */}
              {addingMilestone ? (
                <form
                  onSubmit={handleAddMilestone}
                  className="flex gap-2 mt-2"
                >
                  <input
                    type="text"
                    value={newMilestone}
                    onChange={(e) => setNewMilestone(e.target.value)}
                    placeholder="Milestone title..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-bg-primary border border-border text-sm text-text-primary placeholder-text-muted focus:border-xp-bar focus:ring-1 focus:ring-xp-bar"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!newMilestone.trim() || submitting}
                    className="px-3 py-1.5 rounded-lg bg-xp-bar text-white text-sm disabled:opacity-40"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAddingMilestone(false); setNewMilestone(""); }}
                    className="px-3 py-1.5 rounded-lg bg-bg-secondary text-text-secondary text-sm"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setAddingMilestone(true)}
                  className="flex items-center gap-1.5 text-sm text-text-muted hover:text-xp-bar transition-colors mt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add milestone
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Link to full detail */}
      <div className="pt-1 border-t border-border">
        <Link
          href={`/projects/${project.id}`}
          className="text-xs text-text-muted hover:text-xp-bar transition-colors flex items-center gap-1"
        >
          <ArrowRight className="w-3 h-3" />
          Open project — milestones, subtasks, planning panel
        </Link>
      </div>
    </div>
  );
}
