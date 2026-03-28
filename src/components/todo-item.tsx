"use client";

import { toggleTodo, deleteTodo, updateTodo } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { useState } from "react";

interface TodoItemProps {
  todo: {
    id: string;
    title: string;
    priority: string;
    completedAt: Date | null;
  };
  showActions?: boolean;
}

const priorityColors: Record<string, string> = {
  high: "border-l-accent-red",
  medium: "border-l-accent-yellow",
  low: "border-l-accent-green",
};

export function TodoItem({ todo, showActions = true }: TodoItemProps) {
  const done = !!todo.completedAt;
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);

  async function handleSaveEdit() {
    if (editTitle.trim() && editTitle !== todo.title) {
      await updateTodo(todo.id, { title: editTitle.trim() });
    }
    setEditing(false);
  }

  if (editing) {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg border-l-2",
        priorityColors[todo.priority] || "border-l-border"
      )}>
        <input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSaveEdit();
            if (e.key === "Escape") setEditing(false);
          }}
          autoFocus
          className="flex-1 px-2 py-1 rounded-lg bg-bg-primary border border-border text-sm text-text-primary focus:border-xp-bar focus:ring-1 focus:ring-xp-bar"
        />
        <button onClick={handleSaveEdit} className="text-accent-green hover:opacity-80">
          <Check className="w-4 h-4" />
        </button>
        <button onClick={() => setEditing(false)} className="text-text-muted hover:text-text-primary">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn(
      "group flex items-center gap-2 rounded-lg border-l-2 transition-all hover:bg-bg-card-hover",
      priorityColors[todo.priority] || "border-l-border",
      done && "opacity-50"
    )}>
      <button
        onClick={() => toggleTodo(todo.id)}
        className="flex-1 flex items-center gap-3 px-3 py-2.5 text-left"
      >
        <span className={cn("text-sm", done && "line-through text-text-muted")}>
          {done ? "✅" : "☐"} {todo.title}
        </span>
        {done && (
          <span className="ml-auto text-xs text-accent-green">+10 XP</span>
        )}
      </button>

      {showActions && !done && (
        <div className="hidden group-hover:flex items-center gap-1 pr-2">
          <button
            onClick={() => setEditing(true)}
            className="p-1 rounded text-text-muted hover:text-xp-bar transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => deleteTodo(todo.id)}
            className="p-1 rounded text-text-muted hover:text-accent-red transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
