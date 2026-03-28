"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Zap, X } from "lucide-react";
import { quickLog } from "@/lib/actions";
import { motion, AnimatePresence } from "framer-motion";

export function CommandBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const open = useCallback(() => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Global Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) {
          setIsOpen(false);
        } else {
          open();
        }
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || submitting) return;

    setSubmitting(true);
    const formData = new FormData();
    formData.set("content", value);
    await quickLog(formData);

    setValue("");
    setSubmitting(false);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setIsOpen(false);
    }, 1200);
  }

  return (
    <>
      {/* Trigger button — desktop top bar */}
      <button
        onClick={open}
        className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl glass text-text-secondary hover:text-text-primary hover:border-accent-purple/30 transition-all cursor-text"
      >
        <Zap className="w-4 h-4 text-accent-purple" />
        <span className="text-sm">Quick log...</span>
        <kbd className="ml-8 text-xs text-text-muted bg-bg-primary px-1.5 py-0.5 rounded">
          Ctrl+K
        </kbd>
      </button>

      {/* Mobile floating button */}
      <button
        onClick={open}
        className="md:hidden fixed bottom-16 left-4 right-4 z-40 flex items-center gap-2 px-4 py-3 rounded-xl glass-bright text-text-secondary"
      >
        <Zap className="w-4 h-4 text-accent-purple" />
        <span className="text-sm">Quick log...</span>
      </button>

      {/* Command bar overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15 }}
              className="fixed z-50 top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg px-4"
            >
              <div className="glass-bright rounded-2xl p-6 shadow-2xl shadow-accent-purple/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-accent-purple" />
                    <span className="text-sm font-medium text-text-secondary">
                      What did you do?
                    </span>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-text-muted hover:text-text-primary"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <input
                    ref={inputRef}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder='e.g. "30 min gym session #fitness"'
                    className="w-full px-4 py-3 rounded-xl bg-bg-primary border border-border text-text-primary placeholder-text-muted text-lg focus:border-accent-purple focus:ring-1 focus:ring-accent-purple transition-colors"
                  />

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex gap-2">
                      {["#fitness", "#work", "#reading", "#health"].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setValue((v) => `${v} ${tag}`)}
                          className="text-xs px-2 py-1 rounded-lg bg-bg-card text-text-muted hover:text-accent-purple transition-colors"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                    <button
                      type="submit"
                      disabled={!value.trim() || submitting}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-accent-purple to-accent-blue text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
                    >
                      {showSuccess ? (
                        "Logged! +3 XP"
                      ) : (
                        <>
                          Log it <Zap className="w-3.5 h-3.5" /> +3 XP
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
