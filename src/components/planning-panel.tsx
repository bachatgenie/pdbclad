"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { createMilestone, updateMilestone, createSubtask, updateSubtask } from "@/lib/actions";

interface Milestone {
  id: string;
  title: string;
  order: number;
  timeFrame: string | null;
  isFirstStep: boolean;
  completedAt: Date | null;
}

interface Subtask {
  id: string;
  milestoneId: string | null;
  title: string;
  order: number;
  timeFrame: string | null;
  completed: boolean;
}

interface PlanningPanelProps {
  projectId: string;
  milestones: Milestone[];
  subtasks: Subtask[];
}

const TIME_FRAMES = [
  { value: "thisMonth", label: "This Month", emoji: "📅" },
  { value: "thisWeek", label: "This Week", emoji: "📆" },
  { value: "today", label: "Today", emoji: "📌" },
  { value: "rightNow", label: "Right Now", emoji: "⚡" },
];

export function PlanningPanel({ projectId, milestones, subtasks }: PlanningPanelProps) {
  const [activeTab, setActiveTab] = useState("rightNow");
  const [newItemTitle, setNewItemTitle] = useState("");
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const itemsInFrame = {
    milestones: milestones.filter((m) => m.timeFrame === activeTab || (!m.timeFrame && activeTab === "rightNow")),
    subtasks: subtasks.filter((s) => s.timeFrame === activeTab || (!s.timeFrame && activeTab === "rightNow")),
  };

  async function handleAddMilestone() {
    if (!newItemTitle.trim()) return;
    setSubmitting(true);
    try {
      await createMilestone(projectId, newItemTitle);
      // Update timeFrame for the newly created milestone
      // This will be set in the next step
      setNewItemTitle("");
      setIsAddingMilestone(false);
    } catch (error) {
      console.error("Error adding milestone:", error);
    }
    setSubmitting(false);
  }

  async function handleAddSubtask() {
    if (!newItemTitle.trim()) return;
    setSubmitting(true);
    try {
      await createSubtask(projectId, { title: newItemTitle, timeFrame: activeTab });
      setNewItemTitle("");
    } catch (error) {
      console.error("Error adding subtask:", error);
    }
    setSubmitting(false);
  }

  async function handleMoveToTimeFrame(itemId: string, itemType: "milestone" | "subtask") {
    setSubmitting(true);
    try {
      if (itemType === "milestone") {
        await updateMilestone(itemId, { timeFrame: activeTab });
      } else {
        await updateSubtask(itemId, { timeFrame: activeTab });
      }
    } catch (error) {
      console.error("Error moving item:", error);
    }
    setSubmitting(false);
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-text-secondary">Planning</h3>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-text-muted/20">
        {TIME_FRAMES.map((tf) => (
          <button
            key={tf.value}
            onClick={() => setActiveTab(tf.value)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tf.value
                ? "border-xp-bar text-xp-bar"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {tf.emoji} {tf.label}
          </button>
        ))}
      </div>

      {/* Items in Current Tab */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {itemsInFrame.milestones.length === 0 && itemsInFrame.subtasks.length === 0 ? (
          <p className="text-xs text-text-muted text-center py-4">No items scheduled for {TIME_FRAMES.find(tf => tf.value === activeTab)?.label}</p>
        ) : (
          <>
            {/* Milestones */}
            {itemsInFrame.milestones.map((milestone) => (
              <div key={milestone.id} className="space-y-1 bg-text-muted/5 rounded p-2">
                <div className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!milestone.completedAt} className="w-4 h-4" />
                  <span className={milestone.completedAt ? "line-through text-text-muted" : "text-text-primary"}>
                    {milestone.title}
                  </span>
                </div>
                {/* Subtasks for this milestone in this frame */}
                {subtasks
                  .filter((s) => s.milestoneId === milestone.id && (s.timeFrame === activeTab || !s.timeFrame))
                  .map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-2 text-sm ml-6">
                      <input type="checkbox" checked={subtask.completed} className="w-4 h-4" />
                      <span className={subtask.completed ? "line-through text-text-muted" : "text-text-primary"}>
                        {subtask.title}
                      </span>
                    </div>
                  ))}
              </div>
            ))}

            {/* Standalone Subtasks */}
            {itemsInFrame.subtasks
              .filter((s) => !s.milestoneId)
              .map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-2 text-sm bg-text-muted/5 rounded p-2">
                  <input type="checkbox" checked={subtask.completed} className="w-4 h-4" />
                  <span className={subtask.completed ? "line-through text-text-muted" : "text-text-primary"}>
                    {subtask.title}
                  </span>
                </div>
              ))}
          </>
        )}
      </div>

      {/* Add Item Form */}
      <div className="space-y-2 border-t border-text-muted/20 pt-2">
        {!isAddingMilestone ? (
          <button
            onClick={() => setIsAddingMilestone(true)}
            className="w-full text-xs text-text-secondary hover:text-text-primary flex items-center gap-1 py-1"
          >
            <Plus className="w-3 h-3" /> Add milestone
          </button>
        ) : (
          <div className="space-y-1">
            <input
              type="text"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              placeholder="Milestone title"
              className="w-full bg-bg-primary border border-text-muted/20 rounded px-2 py-1 text-xs"
              autoFocus
            />
            <div className="flex gap-1">
              <button
                onClick={handleAddMilestone}
                disabled={submitting}
                className="flex-1 bg-xp-bar text-white rounded px-2 py-1 text-xs"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setIsAddingMilestone(false);
                  setNewItemTitle("");
                }}
                className="flex-1 bg-text-muted/10 rounded px-2 py-1 text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-1">
          <input
            type="text"
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            placeholder="Add subtask..."
            className="flex-1 bg-bg-primary border border-text-muted/20 rounded px-2 py-1 text-xs"
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleAddSubtask();
              }
            }}
          />
          <button
            onClick={handleAddSubtask}
            disabled={submitting || !newItemTitle.trim()}
            className="bg-xp-bar text-white rounded px-2 py-1 text-xs"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
