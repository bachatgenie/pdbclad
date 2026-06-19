"use client";

import { useState } from "react";
import { X, ChevronDown, Plus, Trash2, Check } from "lucide-react";
import { PlanningPanel } from "./planning-panel";
import {
  updateProject,
  updateMilestone,
  createSubtask,
  toggleSubtask,
  deleteSubtask,
  addWaitingFor,
  deleteWaitingFor,
} from "@/lib/actions";

interface Milestone {
  id: string;
  projectId: string;
  title: string;
  order: number;
  timeFrame: string | null;
  isFirstStep: boolean;
  completedAt: Date | null;
  createdAt: Date;
}

interface Subtask {
  id: string;
  projectId: string;
  milestoneId: string | null;
  title: string;
  order: number;
  timeFrame: string | null;
  completed: boolean;
  completedAt: Date | null;
  createdAt: Date;
}

interface WaitingFor {
  id: string;
  projectId: string;
  referencedMilestoneId: string | null;
  referencedSubtaskId: string | null;
  note: string | null;
  createdAt: Date;
}

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
}

interface Area {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface ProjectDetailPanelProps {
  project: Project & {
    milestones: Milestone[];
    subtasks: Subtask[];
    waitingFor: WaitingFor[];
    area?: Area | null;
  };
  areas: Area[];
  onClose: () => void;
}

const TIME_FRAMES = [
  { value: "thisMonth", label: "This Month" },
  { value: "thisWeek", label: "This Week" },
  { value: "today", label: "Today" },
  { value: "rightNow", label: "Right Now" },
];

export function ProjectDetailPanel({ project, areas, onClose }: ProjectDetailPanelProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    title: project.title,
    successDefinition: project.successDefinition || "",
    firstStep: project.firstStep || "",
    notes: project.notes || "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Calculate progress
  const completedMilestones = project.milestones.filter((m) => m.completedAt).length;
  const totalMilestones = project.milestones.length;
  const completedSubtasks = project.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = project.subtasks.length;

  // Get next step (first incomplete milestone or subtask)
  const nextMilestone = project.milestones.find((m) => !m.completedAt);
  const nextSubtask = project.subtasks.find((s) => !s.completed);
  const nextStep = nextMilestone || nextSubtask;

  async function handleSaveField(field: string, value: string) {
    setSubmitting(true);
    try {
      await updateProject(project.id, {
        [field]: field === "title" ? value : value || undefined,
      });
      setEditingField(null);
    } catch (error) {
      console.error("Error updating field:", error);
    }
    setSubmitting(false);
  }

  async function handleAddSubtask(title: string) {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await createSubtask(project.id, { title });
    } catch (error) {
      console.error("Error creating subtask:", error);
    }
    setSubmitting(false);
  }

  return (
    <div className="fixed right-0 top-0 h-screen w-96 bg-bg-secondary border-l border-text-muted/20 shadow-lg z-40 flex flex-col">
      {/* Header */}
      <div className="border-b border-text-muted/20 p-4 flex items-center justify-between">
        <h2 className="font-semibold text-lg truncate">{project.title}</h2>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Area Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary">Area</label>
          <select
            value={project.areaId || ""}
            onChange={(e) => {
              const areaId = e.target.value || null;
              updateProject(project.id, { areaId });
            }}
            className="w-full bg-bg-primary border border-text-muted/20 rounded p-2 text-sm"
          >
            <option value="">No Area</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.icon} {area.name}
              </option>
            ))}
          </select>
        </div>

        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary font-medium">Progress</span>
            <span className="text-text-muted">{project.progressPct}%</span>
          </div>
          <div className="w-full bg-text-muted/10 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${project.progressPct}%`,
                backgroundColor: project.color,
              }}
            />
          </div>
          <p className="text-xs text-text-muted">
            {completedMilestones}/{totalMilestones} milestones • {completedSubtasks}/
            {totalSubtasks} subtasks
          </p>
        </div>

        {/* Success Definition */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary">Success Definition</label>
          {editingField === "successDefinition" ? (
            <div className="space-y-2">
              <textarea
                value={editValues.successDefinition}
                onChange={(e) =>
                  setEditValues({ ...editValues, successDefinition: e.target.value })
                }
                className="w-full bg-bg-primary border border-text-muted/20 rounded p-2 text-sm"
                rows={3}
                placeholder="What does 100% look like?"
              />
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handleSaveField("successDefinition", editValues.successDefinition)
                  }
                  disabled={submitting}
                  className="flex-1 bg-xp-bar text-white rounded px-2 py-1 text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingField(null)}
                  className="flex-1 bg-text-muted/10 rounded px-2 py-1 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p
              onClick={() => setEditingField("successDefinition")}
              className="text-sm text-text-secondary bg-text-muted/5 rounded p-2 cursor-pointer hover:bg-text-muted/10 min-h-12 flex items-center"
            >
              {project.successDefinition || "Click to add definition..."}
            </p>
          )}
        </div>

        {/* First Step */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary">First Step</label>
          {editingField === "firstStep" ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editValues.firstStep}
                onChange={(e) => setEditValues({ ...editValues, firstStep: e.target.value })}
                className="w-full bg-bg-primary border border-text-muted/20 rounded p-2 text-sm"
                placeholder="First action to take"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleSaveField("firstStep", editValues.firstStep)}
                  disabled={submitting}
                  className="flex-1 bg-xp-bar text-white rounded px-2 py-1 text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingField(null)}
                  className="flex-1 bg-text-muted/10 rounded px-2 py-1 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p
              onClick={() => setEditingField("firstStep")}
              className="text-sm text-text-secondary bg-text-muted/5 rounded p-2 cursor-pointer hover:bg-text-muted/10"
            >
              {project.firstStep || "Click to add first step..."}
            </p>
          )}
        </div>

        {/* Next Step Display */}
        {nextStep && (
          <div className="bg-accent-green/10 border border-accent-green/30 rounded p-3">
            <p className="text-xs text-accent-green font-medium mb-1">Next Step</p>
            <p className="text-sm text-text-primary">{nextStep.title}</p>
          </div>
        )}

        {/* Notes */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary">Notes</label>
          {editingField === "notes" ? (
            <div className="space-y-2">
              <textarea
                value={editValues.notes}
                onChange={(e) => setEditValues({ ...editValues, notes: e.target.value })}
                className="w-full bg-bg-primary border border-text-muted/20 rounded p-2 text-sm"
                rows={3}
                placeholder="Project notes"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleSaveField("notes", editValues.notes)}
                  disabled={submitting}
                  className="flex-1 bg-xp-bar text-white rounded px-2 py-1 text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingField(null)}
                  className="flex-1 bg-text-muted/10 rounded px-2 py-1 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p
              onClick={() => setEditingField("notes")}
              className="text-sm text-text-secondary bg-text-muted/5 rounded p-2 cursor-pointer hover:bg-text-muted/10 min-h-12 flex items-center"
            >
              {project.notes || "Click to add notes..."}
            </p>
          )}
        </div>

        {/* Planning Panel */}
        <PlanningPanel projectId={project.id} milestones={project.milestones} subtasks={project.subtasks} />

        {/* All Milestones & Subtasks */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-secondary">All Items</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {project.milestones.length === 0 && project.subtasks.length === 0 ? (
              <p className="text-xs text-text-muted">No milestones or subtasks yet</p>
            ) : (
              <>
                {project.milestones.map((milestone) => (
                  <div key={milestone.id} className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={!!milestone.completedAt}
                        onChange={() => updateMilestone(milestone.id, {})}
                        className="w-4 h-4"
                      />
                      <span
                        className={
                          milestone.completedAt ? "line-through text-text-muted" : "text-text-primary"
                        }
                      >
                        {milestone.title}
                      </span>
                    </div>
                    {/* Subtasks for this milestone */}
                    {project.subtasks
                      .filter((s) => s.milestoneId === milestone.id)
                      .map((subtask) => (
                        <div key={subtask.id} className="flex items-center gap-2 text-sm ml-6">
                          <input
                            type="checkbox"
                            checked={subtask.completed}
                            onChange={() => toggleSubtask(subtask.id)}
                            className="w-4 h-4"
                          />
                          <span
                            className={
                              subtask.completed
                                ? "line-through text-text-muted"
                                : "text-text-primary"
                            }
                          >
                            {subtask.title}
                          </span>
                        </div>
                      ))}
                  </div>
                ))}
                {/* Standalone subtasks */}
                {project.subtasks
                  .filter((s) => !s.milestoneId)
                  .map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={subtask.completed}
                        onChange={() => toggleSubtask(subtask.id)}
                        className="w-4 h-4"
                      />
                      <span
                        className={
                          subtask.completed ? "line-through text-text-muted" : "text-text-primary"
                        }
                      >
                        {subtask.title}
                      </span>
                    </div>
                  ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
