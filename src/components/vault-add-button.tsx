"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { VaultItemForm } from "./vault-item-form";

export function AddVaultItemButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-purple text-white text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <Plus className="w-4 h-4" />
        Add Item
      </button>

      {isOpen && (
        <VaultItemForm onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}
