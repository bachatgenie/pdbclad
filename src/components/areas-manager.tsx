"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X, FolderKanban } from "lucide-react";
import { createArea, updateArea, deleteArea } from "@/lib/actions";
import Link from "next/link";

const COLOR_OPTIONS = [
  "#10b981", "#0066cc", "#f59e0b", "#f97316", "#8b5cf6",
  "#06b6d4", "#ec4899", "#6b7280", "#ef4444", "#84cc16",
];

const ICON_OPTIONS = ["📁", "🏠", "💼", "💰", "💪", "🚀", "📚", "📖", "🏢", "🎯", "❤️", "🌱", "🎨", "🔬", "✈️"];

type Area = {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string | null;
  order: number;
  _count: { projects: number };
};

export function AreasManager({ initialAreas }: { initialAreas: Area[] }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📁");
  const [newColor, setNewColor] = useState("#6b7280");
  const [newDesc, setNewDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editDesc, setEditDesc] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || submitting) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.set("name", newName);
      fd.set("icon", newIcon);
      fd.set("color", newColor);
      fd.set("description", newDesc);
      await createArea(fd);
      setNewName(""); setNewIcon("📁"); setNewColor("#6b7280"); setNewDesc("");
      setShowAdd(false);
    } catch (err) {
      console.error("Create area failed:", err);
      alert("Failed to create area: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(area: Area) {
    setEditingId(area.id);
    setEditName(area.name);
    setEditIcon(area.icon);
    setEditColor(area.color);
    setEditDesc(area.description || "");
  }

  async function handleSaveEdit(areaId: string) {
    if (!editName.trim()) return;
    setSubmitting(true);
    try {
      await updateArea(areaId, { name: editName, icon: editIcon, color: editColor, description: editDesc });
      setEditingId(null);
    } catch (err) {
      console.error("Update area failed:", err);
      alert("Failed to update area: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(areaId: string, projectCount: number) {
    const msg = projectCount > 0
      ? `Delete this area? ${projectCount} project(s) will become unassigned.`
      : "Delete this area?";
    if (!confirm(msg)) return;
    try {
      await deleteArea(areaId);
    } catch (err) {
      console.error("Delete area failed:", err);
      alert("Failed to delete area: " + (err instanceof Error ? err.message : String(err)));
    }
  }

  return (
    <div className="space-y-4">
      {/* Area list */}
      <div className="space-y-3">
        {initialAreas.map((area) => (
          <div key={area.id} className="glass rounded-xl p-4">
            {editingId === area.id ? (
              <div className="space-y-3">
                {/* Icon picker */}
                <div>
                  <label className="text-xs text-text-muted mb-1.5 block">Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {ICON_OPTIONS.map((ic) => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setEditIcon(ic)}
                        className={`text-xl w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                          editIcon === ic ? "bg-xp-bar/10 ring-2 ring-xp-bar" : "hover:bg-bg-secondary"
                        }`}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Name <span className="text-accent-red">*</span></label>
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm focus:border-xp-bar focus:ring-1 focus:ring-xp-bar"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Description</label>
                    <input
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      placeholder="Optional"
                      className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm focus:border-xp-bar focus:ring-1 focus:ring-xp-bar"
                    />
                  </div>
                </div>
                {/* Color picker */}
                <div>
                  <label className="text-xs text-text-muted mb-1.5 block">Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditColor(c)}
                        className={`w-7 h-7 rounded-full transition-all ${
                          editColor === c ? "ring-2 ring-offset-2 ring-offset-bg-primary ring-text-primary scale-110" : "hover:scale-110"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveEdit(area.id)}
                    disabled={!editName.trim() || submitting}
                    className="px-4 py-2 rounded-lg bg-xp-bar text-white text-sm flex items-center gap-1.5 disabled:opacity-40"
                  >
                    <Check className="w-3.5 h-3.5" /> Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-4 py-2 rounded-lg bg-bg-secondary text-text-secondary text-sm flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                {/* Area icon + color dot */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: area.color + "20", border: `2px solid ${area.color}40` }}
                >
                  {area.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold" style={{ color: area.color }}>{area.name}</h3>
                    <Link
                      href={`/projects?area=${area.id}`}
                      className="flex items-center gap-1 text-xs text-text-muted hover:text-xp-bar transition-colors"
                    >
                      <FolderKanban className="w-3 h-3" />
                      {area._count.projects} project{area._count.projects !== 1 ? "s" : ""}
                    </Link>
                  </div>
                  {area.description && (
                    <p className="text-sm text-text-muted mt-0.5 truncate">{area.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => startEdit(area)}
                    className="p-1.5 rounded-lg hover:bg-bg-secondary text-text-muted hover:text-text-primary transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(area.id, area._count.projects)}
                    className="p-1.5 rounded-lg hover:bg-accent-red/10 text-text-muted hover:text-accent-red transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {initialAreas.length === 0 && (
          <div className="glass rounded-xl p-8 text-center">
            <p className="text-text-muted text-sm">No areas yet. Add your first area below.</p>
          </div>
        )}
      </div>

      {/* Add new area */}
      {showAdd ? (
        <form onSubmit={handleCreate} className="glass rounded-xl p-4 space-y-3">
          <h3 className="font-medium text-sm">New Area</h3>

          {/* Icon picker */}
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Icon</label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setNewIcon(ic)}
                  className={`text-xl w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                    newIcon === ic ? "bg-xp-bar/10 ring-2 ring-xp-bar" : "hover:bg-bg-secondary"
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted mb-1 block">Name <span className="text-accent-red">*</span></label>
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Health, Creative Work"
                className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm focus:border-xp-bar focus:ring-1 focus:ring-xp-bar"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Description</label>
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm focus:border-xp-bar focus:ring-1 focus:ring-xp-bar"
              />
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${
                    newColor === c ? "ring-2 ring-offset-2 ring-offset-bg-primary ring-text-primary scale-110" : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-bg-secondary">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0"
              style={{ backgroundColor: newColor + "20", border: `2px solid ${newColor}40` }}
            >
              {newIcon}
            </div>
            <span className="text-sm font-medium" style={{ color: newColor }}>
              {newName || "Area name"}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!newName.trim() || submitting}
              className="px-4 py-2 rounded-lg bg-xp-bar text-white text-sm font-medium disabled:opacity-40 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              {submitting ? "Adding..." : "Add Area"}
            </button>
            <button
              type="button"
              onClick={() => { setShowAdd(false); setNewName(""); setNewIcon("📁"); setNewColor("#6b7280"); setNewDesc(""); }}
              className="px-4 py-2 rounded-lg bg-bg-secondary text-text-secondary text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-border text-text-secondary hover:text-text-primary hover:border-xp-bar transition-colors text-sm w-full justify-center"
        >
          <Plus className="w-4 h-4" />
          Add Area
        </button>
      )}
    </div>
  );
}
