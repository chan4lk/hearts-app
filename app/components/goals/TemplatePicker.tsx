'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Search, X, Check, ChevronDown } from 'lucide-react';

export interface GoalTemplate {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
}

interface TemplatePickerProps {
  templates: GoalTemplate[];
  onSelect: (t: GoalTemplate) => void;
  selectedId?: string | null;
  label?: string;
}

export default function TemplatePicker({
  templates,
  onSelect,
  selectedId,
  label = 'Use template',
}: TemplatePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter((t) => {
      const hay = `${t.title} ${t.description || ''} ${t.category || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [templates, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, GoalTemplate[]>();
    for (const t of filtered) {
      const key = t.category || 'Uncategorized';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const handleSelect = (t: GoalTemplate) => {
    onSelect(t);
    close();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-2xs font-medium text-accent bg-accent-muted hover:bg-[rgba(var(--color-accent),0.2)] border border-theme rounded-lg px-2.5 py-1.5 focus-ring transition-colors"
        aria-label="Open template picker"
      >
        <FileText className="w-3.5 h-3.5" />
        {label}
        <ChevronDown className="w-3 h-3 opacity-70" />
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="modal-backdrop"
              onClick={close}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15 }}
              className="relative bg-surface-elevated border border-theme rounded-2xl shadow-theme-xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
                <h3 className="text-base font-bold text-primary flex items-center gap-2">
                  <FileText className="w-4 h-4 text-accent" />
                  Pick a Template
                </h3>
                <button
                  onClick={close}
                  className="text-secondary hover:text-primary focus-ring rounded-lg p-1"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-5 pt-4 pb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary pointer-events-none" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by title, description, or category..."
                    className="w-full pl-10 pr-3 py-2 bg-surface-primary border border-theme rounded-lg text-sm text-primary placeholder:text-tertiary focus-ring"
                    autoFocus
                  />
                </div>
                <p className="text-2xs text-tertiary mt-2">
                  {filtered.length} of {templates.length} template{templates.length === 1 ? '' : 's'}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto px-3 pb-4">
                {grouped.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-10 h-10 text-tertiary mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-secondary">No templates match your search</p>
                  </div>
                ) : (
                  grouped.map(([category, items]) => (
                    <div key={category} className="mb-4 last:mb-0">
                      <div className="sticky top-0 bg-surface-elevated px-2 py-1.5 z-10">
                        <span className="text-2xs font-bold uppercase tracking-wider text-tertiary">
                          {category}
                        </span>
                      </div>
                      <div className="space-y-1 px-2">
                        {items.map((t) => {
                          const isSelected = selectedId === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => handleSelect(t)}
                              className={`w-full text-left p-3 rounded-xl border transition-all focus-ring group ${
                                isSelected
                                  ? 'border-accent bg-accent-muted'
                                  : 'border-theme bg-surface-primary hover:border-accent hover:bg-accent-muted'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-primary">{t.title}</p>
                                  {t.description && (
                                    <p className="text-xs text-tertiary mt-0.5 line-clamp-2">
                                      {t.description}
                                    </p>
                                  )}
                                </div>
                                {isSelected && (
                                  <Check className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="px-5 py-3 border-t border-theme bg-surface-secondary">
                <p className="text-2xs text-tertiary text-center">
                  Click a template to apply its title and description
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
