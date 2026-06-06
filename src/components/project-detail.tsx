"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  Upload,
  Pencil,
  X,
  Save,
  Target,
  Calendar,
  Zap,
  Sparkles,
} from "lucide-react";
import {
  updateProject,
  updateProjectPlan,
  createMilestone,
  toggleMilestone,
  deleteMilestone,
  createSubtask,
  toggleSubtask,
  deleteSubtask,
  importAISuggestions,
} from "@/lib/actions";

type Subtask = {
  id: string;
  title: string;
  completedAt: Date | null;
  order: number;
};

type Milestone = {
  id: string;
  title: string;
  completedAt: Date | null;
  order: number;
  subtasks: Subtask[];
};

type Area = { id: string; name: string; icon: string; color: string };

type Project = {
  id: string;
  title: string;
  description: string | null;
  successDefinition: string | null;
  firstStep: string | null;
  planThisMonth: string | null;
  planThisWeek: string | null;
  planToday: string | null;
  planRightNow: string | null;
  status: string;
  progressPct: number;
  color: string;
  area: Area | null;
  milestones: Milestone[];
};

export function ProjectDetail({
  project,
  areas,
}: {
  project: Project;
  areas: Area[];
}) {
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set());
  const [addingSubtask, setAddingSubtask] = useState<string | null>(null);
  const [newSubtask, setNewSubtask] = useState("");
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [newMilestone, setNewMilestone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit states
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    title: project.title,
    description: project.description || "",
    successDefinition: project.successDefinition || "",
    firstStep: project.firstStep || "",
    planThisMonth: project.planThisMonth || "",
    planThisWeek: project.planThisWeek || "",
    planToday: project.planToday || "",
    planRightNow: project.planRightNow || "",
    areaId: project.area?.id || "",
    color: project.color,
  });

  // AI Import state
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [parsedSuggestions, setParsedSuggestions] = useState<{
    successDefinition?: string;
    firstStep?: string;
    milestones: { title: string; subtasks: string[] }[];
  } | null>(null);
  const [importSubmitting, setImportSubmitting] = useState(false);

  const completedMilestones = project.milestones.filter((m) => m.completedAt).length;
  const totalMilestones = project.milestones.length;

  // ── Field editing ──
  async function saveField(field: string) {
    setSubmitting(true);
    if (["title", "description", "successDefinition", "firstStep", "areaId", "color"].includes(field)) {
      await updateProject(project.id, {
        [field]: editValues[field as keyof typeof editValues] || undefined,
        ...(field === "areaId" && { areaId: editValues.areaId || null }),
      });
    } else {
      await updateProjectPlan(project.id, {
        planThisMonth: editValues.planThisMonth || undefined,
        planThisWeek: editValues.planThisWeek || undefined,
        planToday: editValues.planToday || undefined,
        planRightNow: editValues.planRightNow || undefined,
      });
    }
    setEditingField(null);
    setSubmitting(false);
  }

  // ── Milestones ──
  async function handleAddMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!newMilestone.trim()) return;
    setSubmitting(true);
    await createMilestone(project.id, newMilestone);
    setNewMilestone("");
    setAddingMilestone(false);
    setSubmitting(false);
  }

  // ── Subtasks ──
  async function handleAddSubtask(milestoneId: string, e: React.FormEvent) {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    setSubmitting(true);
    await createSubtask(milestoneId, newSubtask);
    setNewSubtask("");
    setAddingSubtask(null);
    setSubmitting(false);
  }

  function toggleMilestoneExpand(id: string) {
    setExpandedMilestones((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ── AI Export ──
  function handleExport() {
    const lines: string[] = [];
    lines.push(`# Project: ${project.title}`);
    lines.push("");
    if (project.description) { lines.push(`## Description`); lines.push(project.description); lines.push(""); }
    if (project.successDefinition) { lines.push(`## What does 100% success look like?`); lines.push(project.successDefinition); lines.push(""); }
    if (project.firstStep) { lines.push(`## First Step`); lines.push(project.firstStep); lines.push(""); }
    lines.push(`## Current Progress`);
    lines.push(`${project.progressPct}% complete (${completedMilestones}/${totalMilestones} milestones)`);
    lines.push("");

    if (project.milestones.length > 0) {
      lines.push("## Milestones");
      project.milestones.forEach((m, i) => {
        lines.push(`${i + 1}. [${m.completedAt ? "x" : " "}] ${m.title}`);
        m.subtasks.forEach((s) => {
          lines.push(`   - [${s.completedAt ? "x" : " "}] ${s.title}`);
        });
      });
      lines.push("");
    }

    lines.push("---");
    lines.push("## AI Prompt");
    lines.push("");
    lines.push("You are helping me plan my project. Based on the details above, please provide:");
    lines.push("");
    lines.push("1. **Refined success definition** — A clearer, more specific, measurable definition of what project completion looks like.");
    lines.push("2. **Suggested milestones** — 5-8 milestones that break this project into trackable chunks. Format: `MILESTONE: <title>`");
    lines.push("3. **Subtasks per milestone** — 2-4 subtasks for each milestone. Format: `  SUBTASK: <title>`");
    lines.push("4. **First step** — The single most important first action to take right now.");
    lines.push("5. **Planning breakdown**:");
    lines.push("   - MONTH: What can I realistically accomplish this month?");
    lines.push("   - WEEK: What should I focus on this week?");
    lines.push("   - TODAY: What task can I complete today?");
    lines.push("   - NOW: What can I do right now (15-30 minutes)?");
    lines.push("");
    lines.push("Please structure your response exactly with those labels (MILESTONE:, SUBTASK:, MONTH:, WEEK:, TODAY:, NOW:) so I can import it back into my dashboard.");

    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_ai_prompt.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── AI Import parse ──
  function handleParse() {
    const text = importText;
    const result: { successDefinition?: string; firstStep?: string; milestones: { title: string; subtasks: string[] }[] } = {
      milestones: [],
    };

    // Extract success definition
    const successMatch = text.match(/SUCCESS:\s*([\s\S]+?)(?=\n[A-Z]+:|$)/i);
    if (successMatch) result.successDefinition = successMatch[1].trim();

    // Extract first step
    const firstStepMatch = text.match(/(?:FIRST STEP|NOW):\s*([\s\S]+?)(?=\n[A-Z]+:|$)/i);
    if (firstStepMatch) result.firstStep = firstStepMatch[1].trim();

    // Extract milestones + subtasks
    const milestoneRegex = /MILESTONE:\s*(.+)/g;
    const subtaskRegex = /SUBTASK:\s*(.+)/g;

    let milestoneMatch;
    const milestonePositions: { title: string; pos: number }[] = [];
    while ((milestoneMatch = milestoneRegex.exec(text)) !== null) {
      milestonePositions.push({ title: milestoneMatch[1].trim(), pos: milestoneMatch.index });
    }

    const allSubtasks: { title: string; pos: number }[] = [];
    let subtaskMatch;
    while ((subtaskMatch = subtaskRegex.exec(text)) !== null) {
      allSubtasks.push({ title: subtaskMatch[1].trim(), pos: subtaskMatch.index });
    }

    // Assign subtasks to milestones by position
    for (let i = 0; i < milestonePositions.length; i++) {
      const start = milestonePositions[i].pos;
      const end = milestonePositions[i + 1]?.pos ?? Infinity;
      const subtasksForMilestone = allSubtasks
        .filter((s) => s.pos > start && s.pos < end)
        .map((s) => s.title);
      result.milestones.push({ title: milestonePositions[i].title, subtasks: subtasksForMilestone });
    }

    setParsedSuggestions(result);
  }

  async function handleImport() {
    if (!parsedSuggestions || importSubmitting) return;
    setImportSubmitting(true);
    await importAISuggestions(project.id, parsedSuggestions);
    setShowImport(false);
    setImportText("");
    setParsedSuggestions(null);
    setImportSubmitting(false);
  }

  // ── Planning panel save ──
  async function savePlanningPanel() {
    setSubmitting(true);
    try {
      await updateProjectPlan(project.id, {
        planThisMonth: editValues.planThisMonth,
        planThisWeek: editValues.planThisWeek,
        planToday: editValues.planToday,
        planRightNow: editValues.planRightNow,
      });
      setEditingField(null);
    } catch (e) {
      console.error("Planning save failed:", e);
      alert("Save failed — check browser console for details.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Back link */}
      <Link
        href="/projects"
        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        All Projects
      </Link>

      {/* Header */}
      <div className="glass rounded-xl p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div
            className="w-4 h-12 rounded-full shrink-0"
            style={{ backgroundColor: project.color }}
          />
          <div className="flex-1 min-w-0">
            {editingField === "title" ? (
              <div className="space-y-2">
                <input
                  autoFocus
                  value={editValues.title}
                  onChange={(e) => setEditValues({ ...editValues, title: e.target.value })}
                  className="w-full text-2xl font-bold px-2 py-1 rounded-lg bg-bg-primary border border-border focus:border-xp-bar focus:ring-1 focus:ring-xp-bar"
                />
                <div className="flex gap-2">
                  <button onClick={() => saveField("title")} disabled={submitting}
                    className="px-3 py-1.5 rounded-lg bg-xp-bar text-white text-sm flex items-center gap-1">
                    <Check className="w-3 h-3" /> Save
                  </button>
                  <button onClick={() => setEditingField(null)}
                    className="px-3 py-1.5 rounded-lg bg-bg-secondary text-text-secondary text-sm">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-2xl font-bold">{project.title}</h1>
                <button onClick={() => setEditingField("title")}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-bg-secondary text-text-muted transition-all">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {project.area && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-sm">{project.area.icon}</span>
                <span className="text-sm font-medium" style={{ color: project.area.color }}>
                  {project.area.name}
                </span>
              </div>
            )}
          </div>

          {/* AI buttons */}
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors text-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Export .md
            </button>
            <button
              onClick={() => setShowImport(!showImport)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors text-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              Import AI
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">{completedMilestones}/{totalMilestones} milestones</span>
            <span className="font-semibold" style={{ color: project.color }}>{project.progressPct}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-bg-secondary">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${project.progressPct}%`, backgroundColor: project.color }}
            />
          </div>
        </div>

        {/* Description */}
        <EditableTextArea
          label="Description"
          value={project.description || ""}
          editValue={editValues.description}
          isEditing={editingField === "description"}
          onEdit={() => setEditingField("description")}
          onChange={(v) => setEditValues({ ...editValues, description: v })}
          onSave={() => saveField("description")}
          onCancel={() => setEditingField(null)}
          placeholder="Add a description..."
          submitting={submitting}
        />
      </div>

      {/* AI Import panel */}
      {showImport && (
        <div className="glass rounded-xl p-5 space-y-4 border-2 border-dashed border-xp-bar/30">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-xp-bar" />
            <h2 className="font-semibold">Import AI Suggestions</h2>
          </div>
          <ol className="text-sm text-text-secondary space-y-1 list-decimal list-inside">
            <li>Export the .md file above and paste it into Claude or ChatGPT</li>
            <li>Copy the AI&apos;s full response</li>
            <li>Paste it here and click Parse</li>
            <li>Review the suggestions, then Import</li>
          </ol>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste AI response here..."
            rows={8}
            className="w-full px-4 py-3 rounded-xl bg-bg-primary border border-border text-text-primary text-sm placeholder-text-muted focus:border-xp-bar focus:ring-1 focus:ring-xp-bar resize-none font-mono"
          />
          <div className="flex gap-2">
            <button
              onClick={handleParse}
              disabled={!importText.trim()}
              className="px-4 py-2 rounded-xl bg-xp-bar text-white text-sm font-medium disabled:opacity-40"
            >
              Parse Response
            </button>
            <button
              onClick={() => { setShowImport(false); setImportText(""); setParsedSuggestions(null); }}
              className="px-4 py-2 rounded-xl bg-bg-secondary text-text-secondary text-sm"
            >
              Cancel
            </button>
          </div>

          {/* Parsed preview */}
          {parsedSuggestions && (
            <div className="space-y-3 pt-2 border-t border-border">
              <h3 className="font-medium text-sm">Parsed Suggestions — Review before importing</h3>
              {parsedSuggestions.successDefinition && (
                <div>
                  <p className="text-xs text-text-muted mb-1">Success Definition</p>
                  <p className="text-sm bg-bg-secondary rounded-lg p-2">{parsedSuggestions.successDefinition}</p>
                </div>
              )}
              {parsedSuggestions.firstStep && (
                <div>
                  <p className="text-xs text-text-muted mb-1">First Step</p>
                  <p className="text-sm bg-bg-secondary rounded-lg p-2">{parsedSuggestions.firstStep}</p>
                </div>
              )}
              {parsedSuggestions.milestones.length > 0 && (
                <div>
                  <p className="text-xs text-text-muted mb-1">Milestones ({parsedSuggestions.milestones.length})</p>
                  <div className="space-y-1.5">
                    {parsedSuggestions.milestones.map((m, i) => (
                      <div key={i} className="bg-bg-secondary rounded-lg p-2.5">
                        <p className="text-sm font-medium">📌 {m.title}</p>
                        {m.subtasks.map((s, j) => (
                          <p key={j} className="text-xs text-text-muted ml-4 mt-1">→ {s}</p>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={handleImport}
                disabled={importSubmitting || parsedSuggestions.milestones.length === 0}
                className="px-4 py-2 rounded-xl bg-accent-green text-white text-sm font-medium disabled:opacity-40 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                {importSubmitting ? "Importing..." : "Import These Suggestions"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Success Definition */}
      <div className="glass rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-xp-bar" />
          <h2 className="font-semibold">What does 100% success look like?</h2>
        </div>
        <EditableTextArea
          label=""
          value={project.successDefinition || ""}
          editValue={editValues.successDefinition}
          isEditing={editingField === "successDefinition"}
          onEdit={() => setEditingField("successDefinition")}
          onChange={(v) => setEditValues({ ...editValues, successDefinition: v })}
          onSave={() => saveField("successDefinition")}
          onCancel={() => setEditingField(null)}
          placeholder="Define clearly what success looks like — the more specific, the less room for procrastination."
          submitting={submitting}
          emptyText="Not defined yet — click to add your success definition."
        />

        {/* First step */}
        <div className="pt-2 border-t border-border">
          <p className="text-xs font-medium text-text-muted mb-1.5 flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-accent-yellow" />
            First step you can take right now
          </p>
          <EditableTextArea
            label=""
            value={project.firstStep || ""}
            editValue={editValues.firstStep}
            isEditing={editingField === "firstStep"}
            onEdit={() => setEditingField("firstStep")}
            onChange={(v) => setEditValues({ ...editValues, firstStep: v })}
            onSave={() => saveField("firstStep")}
            onCancel={() => setEditingField(null)}
            placeholder="What is the very first action to take?"
            submitting={submitting}
            emptyText="Not set — click to add your first step."
          />
        </div>
      </div>

      {/* Planning Panel */}
      <div className="glass rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-xp-bar" />
            <h2 className="font-semibold">Planning Panel</h2>
          </div>
          {editingField !== "planning" && (
            <button
              onClick={() => setEditingField("planning")}
              className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
          )}
        </div>

        {editingField === "planning" ? (
          <div className="space-y-3">
            {[
              { key: "planThisMonth", label: "This month — what can I realistically accomplish?" },
              { key: "planThisWeek", label: "This week — what should I focus on?" },
              { key: "planToday", label: "Today — what task can I complete?" },
              { key: "planRightNow", label: "Right now — what can I do in the next 15-30 minutes?" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs font-medium text-text-muted mb-1 block">{label}</label>
                <textarea
                  value={editValues[key as keyof typeof editValues]}
                  onChange={(e) => setEditValues({ ...editValues, [key]: e.target.value })}
                  rows={2}
                  placeholder="Write your plan..."
                  className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-sm text-text-primary placeholder-text-muted focus:border-xp-bar focus:ring-1 focus:ring-xp-bar resize-none"
                />
              </div>
            ))}
            <div className="flex gap-2">
              <button
                onClick={savePlanningPanel}
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-xp-bar text-white text-sm font-medium flex items-center gap-1.5 disabled:opacity-40"
              >
                <Save className="w-3.5 h-3.5" />
                {submitting ? "Saving..." : "Save Plan"}
              </button>
              <button
                onClick={() => setEditingField(null)}
                className="px-4 py-2 rounded-xl bg-bg-secondary text-text-secondary text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: "planThisMonth", label: "📅 This Month", value: project.planThisMonth },
              { key: "planThisWeek", label: "📆 This Week", value: project.planThisWeek },
              { key: "planToday", label: "☀️ Today", value: project.planToday },
              { key: "planRightNow", label: "⚡ Right Now", value: project.planRightNow },
            ].map(({ key, label, value }) => (
              <div key={key} className="p-3 rounded-xl bg-bg-secondary space-y-1">
                <p className="text-xs font-semibold text-text-muted">{label}</p>
                <p className={`text-sm ${value ? "text-text-primary" : "text-text-muted italic"}`}>
                  {value || "Not set"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Milestones + Subtasks */}
      <div className="glass rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">
            Milestones
            <span className="text-text-muted font-normal ml-2 text-sm">
              ({completedMilestones}/{totalMilestones})
            </span>
          </h2>
          <button
            onClick={() => setAddingMilestone(true)}
            className="flex items-center gap-1.5 text-sm text-xp-bar hover:opacity-80 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            Add milestone
          </button>
        </div>

        <div className="space-y-2">
          {project.milestones.map((milestone) => {
            const isExpanded = expandedMilestones.has(milestone.id);
            const completedSubs = milestone.subtasks.filter((s) => s.completedAt).length;
            const milestoneProgress = milestone.subtasks.length > 0
              ? Math.round((completedSubs / milestone.subtasks.length) * 100)
              : milestone.completedAt ? 100 : 0;

            return (
              <div key={milestone.id} className="border border-border rounded-xl overflow-hidden">
                {/* Milestone row */}
                <div className="flex items-center gap-3 p-3">
                  <button
                    onClick={() => toggleMilestone(milestone.id)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      milestone.completedAt
                        ? "bg-accent-green border-accent-green text-white"
                        : "border-border hover:border-xp-bar"
                    }`}
                  >
                    {milestone.completedAt && <Check className="w-3 h-3" />}
                  </button>

                  <button
                    onClick={() => toggleMilestoneExpand(milestone.id)}
                    className="flex items-center gap-2 flex-1 text-left min-w-0"
                  >
                    <span className={`text-sm font-medium flex-1 truncate ${milestone.completedAt ? "line-through text-text-muted" : ""}`}>
                      {milestone.title}
                    </span>
                    {milestone.subtasks.length > 0 && (
                      <span className="text-xs text-text-muted shrink-0">
                        {completedSubs}/{milestone.subtasks.length}
                      </span>
                    )}
                    {milestone.subtasks.length > 0 && (
                      isExpanded
                        ? <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
                        : <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
                    )}
                  </button>

                  {milestone.completedAt && (
                    <span className="text-[10px] text-accent-green font-medium shrink-0">+50 XP</span>
                  )}

                  <button
                    onClick={() => {
                      if (addingSubtask === milestone.id) { setAddingSubtask(null); setNewSubtask(""); }
                      else { setAddingSubtask(milestone.id); setExpandedMilestones(prev => new Set([...prev, milestone.id])); }
                    }}
                    className="p-1 rounded text-text-muted hover:text-xp-bar transition-colors shrink-0"
                    title="Add subtask"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => deleteMilestone(milestone.id)}
                    className="p-1 rounded text-text-muted hover:text-accent-red transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Mini progress bar for subtasks */}
                {milestone.subtasks.length > 0 && (
                  <div className="h-1 bg-bg-secondary">
                    <div
                      className="h-full bg-accent-green transition-all"
                      style={{ width: `${milestoneProgress}%` }}
                    />
                  </div>
                )}

                {/* Subtasks */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 space-y-1 bg-bg-secondary/50">
                    {milestone.subtasks.map((sub) => (
                      <div key={sub.id} className="flex items-center gap-2 group py-1">
                        <button
                          onClick={() => toggleSubtask(sub.id)}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                            sub.completedAt
                              ? "bg-accent-green border-accent-green text-white"
                              : "border-border hover:border-xp-bar"
                          }`}
                        >
                          {sub.completedAt && <Check className="w-2.5 h-2.5" />}
                        </button>
                        <span className={`text-sm flex-1 ${sub.completedAt ? "line-through text-text-muted" : ""}`}>
                          {sub.title}
                        </span>
                        <button
                          onClick={() => deleteSubtask(sub.id)}
                          className="p-0.5 rounded opacity-0 group-hover:opacity-100 text-text-muted hover:text-accent-red transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {/* Add subtask inline */}
                    {addingSubtask === milestone.id && (
                      <form
                        onSubmit={(e) => handleAddSubtask(milestone.id, e)}
                        className="flex gap-2 mt-1"
                      >
                        <input
                          autoFocus
                          value={newSubtask}
                          onChange={(e) => setNewSubtask(e.target.value)}
                          placeholder="Subtask title..."
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-bg-primary border border-border text-sm text-text-primary placeholder-text-muted focus:border-xp-bar focus:ring-1 focus:ring-xp-bar"
                        />
                        <button
                          type="submit"
                          disabled={!newSubtask.trim() || submitting}
                          className="px-3 py-1.5 rounded-lg bg-xp-bar text-white text-xs disabled:opacity-40"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAddingSubtask(null); setNewSubtask(""); }}
                          className="px-3 py-1.5 rounded-lg bg-bg-primary border border-border text-text-secondary text-xs"
                        >
                          Cancel
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Add milestone form */}
          {addingMilestone ? (
            <form onSubmit={handleAddMilestone} className="flex gap-2">
              <input
                autoFocus
                value={newMilestone}
                onChange={(e) => setNewMilestone(e.target.value)}
                placeholder="Milestone title..."
                className="flex-1 px-3 py-2 rounded-xl bg-bg-primary border border-border text-sm text-text-primary placeholder-text-muted focus:border-xp-bar focus:ring-1 focus:ring-xp-bar"
              />
              <button
                type="submit"
                disabled={!newMilestone.trim() || submitting}
                className="px-4 py-2 rounded-xl bg-xp-bar text-white text-sm disabled:opacity-40"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => { setAddingMilestone(false); setNewMilestone(""); }}
                className="px-4 py-2 rounded-xl bg-bg-secondary text-text-secondary text-sm"
              >
                Cancel
              </button>
            </form>
          ) : project.milestones.length === 0 ? (
            <button
              onClick={() => setAddingMilestone(true)}
              className="w-full py-6 border-2 border-dashed border-border rounded-xl text-text-muted hover:border-xp-bar hover:text-xp-bar transition-colors text-sm flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add your first milestone
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ── Reusable inline edit textarea ──
function EditableTextArea({
  label,
  value,
  editValue,
  isEditing,
  onEdit,
  onChange,
  onSave,
  onCancel,
  placeholder,
  submitting,
  emptyText,
}: {
  label: string;
  value: string;
  editValue: string;
  isEditing: boolean;
  onEdit: () => void;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  placeholder: string;
  submitting: boolean;
  emptyText?: string;
}) {
  if (isEditing) {
    return (
      <div className="space-y-2">
        {label && <label className="text-sm text-text-muted">{label}</label>}
        <textarea
          autoFocus
          value={editValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full px-3 py-2 rounded-xl bg-bg-primary border border-border text-sm text-text-primary placeholder-text-muted focus:border-xp-bar focus:ring-1 focus:ring-xp-bar resize-none"
        />
        <div className="flex gap-2">
          <button
            onClick={onSave}
            disabled={submitting}
            className="px-3 py-1.5 rounded-lg bg-xp-bar text-white text-sm flex items-center gap-1 disabled:opacity-40"
          >
            <Check className="w-3 h-3" /> Save
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg bg-bg-secondary text-text-secondary text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group cursor-pointer"
      onClick={onEdit}
    >
      {label && <p className="text-xs font-medium text-text-muted mb-1">{label}</p>}
      <div className="flex items-start gap-2">
        <p className={`text-sm flex-1 ${value ? "text-text-primary" : "text-text-muted italic"}`}>
          {value || emptyText || placeholder}
        </p>
        <Pencil className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 shrink-0" />
      </div>
    </div>
  );
}
