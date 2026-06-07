"use client";

import { useState } from "react";
import { Pencil, Trash2, Check, X, Plus } from "lucide-react";
import { createArea, updateArea, deleteArea } from "@/lib/actions";

const ICON_OPTIONS = ["📁","🏠","💼","💰","💪","🚀","📚","📖","🏢","🎯","🌱","❤️","🎨","🧘","✈️","🍎"];
const COLOR_OPTIONS = ["#6b7280","#10b981","#0066cc","#f59e0b","#f97316","#8b5cf6","#06b6d4","#ec4899","#ef4444"];

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
  const [showAdd, setShowAdd]   = useState(false);
  const [newName, setNewName]   = useState("");
  const [newIcon, setNewIcon]   = useState("📁");
  const [newColor, setNewColor] = useState("#6b7280");
  const [newDesc, setNewDesc]   = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editName, setEditName]     = useState("");
  const [editIcon, setEditIcon]     = useState("📁");
  const [editColor, setEditColor]   = useState("#6b7280");
  const [editDesc, setEditDesc]     = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || submitting) return;
    setSubmitting(true);
    const fd = new FormData();
    fd.set("name", newName);
    fd.set("icon", newIcon);
    fd.set("color", newColor);
    fd.set("description", newDesc);
    const result = await createArea(fd);
    if (result?.error) {
      alert("Failed to create area: " + result.error);
    } else {
      setNewName(""); setNewIcon("📁"); setNewColor("#6b7280"); setNewDesc("");
      setShowAdd(false);
    }
    setSubmitting(false);
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
    const result = await updateArea(areaId, { name: editName, icon: editIcon, color: editColor, description: editDesc });
    if (result?.error) {
      alert("Failed to update area: " + result.error);
    } else {
      setEditingId(null);
    }
    setSubmitting(false);
  }

  async function handleDelete(areaId: string, projectCount: number) {
    const msg = projectCount > 0
      ? `Delete this area? ${projectCount} project(s) will become unassigned.`
      : "Delete this area?";
    if (!confirm(msg)) return;
    const result = await deleteArea(areaId);
    if (result?.error) alert("Failed to delete area: " + result.error);
  }

  return (
    <div className="space-y-4">
      {/* Area list */}
      <div className="space-y-3">
        {initialAreas.length === 0 && (
          <p className="text-text-muted text-sm text-center py-8">No areas yet. Add your first area below.</p>
        )}
        {initialAreas.map((area) => (
          <div key={area.id} className="glass rounded-xl p-4">
            {editingId === area.id ? (
              <div className="space-y-3">
                {/* Icon picker */}
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((ic) => (
                    <button key={ic} type="button" onClick={() => setEditIcon(ic)}
                      className={`text-xl w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${editIcon === ic ? "bg-xp-bar/20 ring-2 ring-xp-bar" : "hover:bg-bg-secondary"}`}>
                      {ic}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Name <span className="text-red-400">*</span></label>
                    <input data-testid="edit-name-input" autoFocus value={editName} onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm focus:border-xp-bar focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Description</label>
                    <input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Optional"
                      className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm focus:border-xp-bar focus:outline-none" />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_OPTIONS.map((c) => (
                    <button key={c} type="button" onClick={() => setEditColor(c)}
                      className={`w-7 h-7 rounded-full transition-all ${editColor === c ? "ring-2 ring-offset-2 ring-offset-bg-card ring-white scale-110" : "hover:scale-110"}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleSaveEdit(area.id)} disabled={submitting || !editName.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-xp-bar text-white text-sm disabled:opacity-50">
                    <Check className="w-3.5 h-3.5" /> {submitting ? "Saving..." : "Save"}
                  </button>
                  <button onClick={() => setEditingId(null)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-secondary text-text-secondary text-sm">
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-2xl">{area.icon}</span>
                <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: area.color }} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{area.name}</p>
                  {area.description && <p className="text-xs text-text-muted truncate">{area.description}</p>}
                  <p className="text-xs text-text-muted">{area._count.projects} project{area._count.projects !== 1 ? "s" : ""}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button data-testid="edit-area" onClick={() => startEdit(area)}
                    className="p-1.5 rounded-lg hover:bg-bg-secondary text-text-muted hover:text-text-primary transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button data-testid="delete-area" onClick={() => handleDelete(area.id, area._count.projects)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add area form */}
      {showAdd ? (
        <form onSubmit={handleCreate} className="glass rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium">New Area</p>
          <div className="flex flex-wrap gap-2">
            {ICON_OPTIONS.map((ic) => (
              <button key={ic} type="button" onClick={() => setNewIcon(ic)}
                className={`text-xl w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${newIcon === ic ? "bg-xp-bar/20 ring-2 ring-xp-bar" : "hover:bg-bg-secondary"}`}>
                {ic}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted mb-1 block">Name <span className="text-red-400">*</span></label>
              <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Health"
                className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm focus:border-xp-bar focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Description</label>
              <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Optional"
                className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm focus:border-xp-bar focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {COLOR_OPTIONS.map((c) => (
              <button key={c} type="button" onClick={() => setNewColor(c)}
                className={`w-7 h-7 rounded-full transition-all ${newColor === c ? "ring-2 ring-offset-2 ring-offset-bg-card ring-white scale-110" : "hover:scale-110"}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting || !newName.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-xp-bar text-white text-sm disabled:opacity-50">
              <Check className="w-3.5 h-3.5" /> {submitting ? "Adding..." : "Add Area"}
            </button>
            <button type="button" onClick={() => { setShowAdd(false); setNewName(""); setNewIcon("📁"); setNewColor("#6b7280"); setNewDesc(""); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-secondary text-text-secondary text-sm">
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-border text-text-secondary hover:border-xp-bar hover:text-text-primary transition-colors w-full justify-center text-sm">
          <Plus className="w-4 h-4" /> Add Area
        </button>
      )}
    </div>
  );
}
