'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Plus, 
  Search, 
  Layers, 
  Download, 
  Trash2, 
  Copy, 
  ChevronRight,
  GripVertical
} from 'lucide-react';

interface TemplateItem {
  id: string;
  internalId?: string;
  name: string;
  category: string;
  scope: string;
  icon: string;
  order?: number;
  sectionCount: number;
  tiers?: string[];
  updatedAt: string;
}

function TemplateCatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateType = (searchParams?.get('type') === 'Document' ? 'Document' : 'Meeting') as 'Meeting' | 'Document';
  
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Company');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [mounted, setMounted] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/templates?type=${templateType}&scope=${activeTab}`);
      const json = await res.json();
      if (json.success) {
        setTemplates(json.data);
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, templateType]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleDrop = async (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;

    const sourceIdx = templates.findIndex((t) => t.id === draggedId);
    const targetIdx = templates.findIndex((t) => t.id === targetId);
    if (sourceIdx === -1 || targetIdx === -1) return;

    // Reorder locally
    const updated = [...templates];
    const [moved] = updated.splice(sourceIdx, 1);
    updated.splice(targetIdx, 0, moved);

    setTemplates(updated);
    setDraggedId(null);
    setDragOverId(null);

    // Save to database
    try {
      const items = updated.map((tmpl, index) => ({
        id: tmpl.id,
        order: index,
      }));
      await fetch('/api/templates/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
    } catch (err) {
      console.error('Failed to persist template order:', err);
    }
  };

  const filteredTemplates = templates.filter((tmpl) => {
    const matchesSearch = tmpl.name.toLowerCase().includes(search.toLowerCase()) || 
                          tmpl.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || tmpl.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'Wealth', 'Other', 'Mortgages', 'Protection'];

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
      }
    } catch {
      alert('Failed to delete template');
    }
  };

  const handleDuplicate = async (e: React.MouseEvent, tmpl: TemplateItem) => {
    e.stopPropagation();
    try {
      const detailRes = await fetch(`/api/templates/${tmpl.id}`);
      const detailJson = await detailRes.json();
      if (!detailJson.success) return;

      const dupData = {
        name: `${detailJson.data.name} (Copy)`,
        category: detailJson.data.category,
        scope: detailJson.data.scope,
        icon: detailJson.data.icon,
        globalInstructions: detailJson.data.globalInstructions,
        sections: detailJson.data.sections,
      };

      const createRes = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dupData),
      });
      const createJson = await createRes.json();
      if (createJson.success) {
        fetchTemplates();
      }
    } catch {
      alert('Failed to duplicate template');
    }
  };

  const handleExportAll = async () => {
    try {
      const res = await fetch('/api/templates');
      const json = await res.json();
      if (json.success) {
        const blob = new Blob([JSON.stringify(json.data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'fameetingnotes_all_templates.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch {
      alert('Export failed');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!mounted) return '';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return '';
    }
  };

  return (
    <div className="p-8 max-w-6xl w-full mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {templateType === 'Meeting' ? 'Meeting templates' : 'Document templates'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {templateType === 'Meeting'
              ? 'Create, manage and customize structured meeting documentation templates for FA Meeting Notes.'
              : 'Manage policy analysis, suitability reports, fact finds, and client letter templates.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportAll}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
          <Link
            href="/templates/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold shadow-lg shadow-sky-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            {templateType === 'Meeting' ? 'New meeting template' : 'New document template'}
          </Link>
        </div>
      </div>

      {/* Scope Tabs */}
      <div className="flex border-b border-slate-800 gap-8">
        {['Company', 'Personal', 'Default'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-semibold transition relative ${
              activeTab === tab
                ? 'text-sky-400 font-bold'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab} {tab === 'Company' ? `(${templates.length})` : '(0)'}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-400 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Templates List Grid / Rows */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="animate-spin w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full mx-auto mb-3" />
          Loading templates...
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="py-16 text-center bg-slate-950/40 border border-slate-800/80 rounded-2xl p-8">
          <Layers className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">No templates found</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            {search ? 'Try adjusting your search criteria.' : 'Create your first meeting template to get started.'}
          </p>
          <Link
            href="/templates/new"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTemplates.map((tmpl) => {
            const isBeingDragged = draggedId === tmpl.id;
            const isDragTarget = dragOverId === tmpl.id;

            return (
              <div
                key={tmpl.id}
                draggable={!search && selectedCategory === 'All'}
                onDragStart={(e) => {
                  setDraggedId(tmpl.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverId !== tmpl.id) setDragOverId(tmpl.id);
                }}
                onDragLeave={() => {
                  if (dragOverId === tmpl.id) setDragOverId(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(tmpl.id);
                }}
                onDragEnd={() => {
                  setDraggedId(null);
                  setDragOverId(null);
                }}
                onClick={() => router.push(`/templates/${tmpl.id}`)}
                className={`group flex items-center justify-between p-4 px-5 rounded-xl border cursor-pointer transition-all duration-150 shadow-sm ${
                  isBeingDragged
                    ? 'opacity-40 border-dashed border-sky-400 bg-sky-500/5'
                    : isDragTarget
                    ? 'border-sky-400 bg-sky-500/10 shadow-lg shadow-sky-500/10 scale-[1.008]'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Drag Handle Indicator */}
                  {!search && selectedCategory === 'All' && (
                    <div
                      title="Drag to reorder"
                      onClick={(e) => e.stopPropagation()}
                      className="cursor-grab active:cursor-grabbing text-slate-600 group-hover:text-slate-400 hover:text-sky-400 p-1 -ml-2 rounded transition"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>
                  )}

                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                    {tmpl.icon || '📋'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white text-base group-hover:text-sky-300 transition-colors">
                        {tmpl.name}
                      </h3>
                      {tmpl.internalId && (
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-850 text-sky-400/90 border border-slate-700/80">
                          {tmpl.internalId}
                        </span>
                      )}
                      {tmpl.tiers && tmpl.tiers.length > 0 && (
                        <div className="flex items-center gap-1">
                          {tmpl.tiers.map((t) => (
                            <span
                              key={t}
                              className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      <span
                        className={`px-2 py-0.5 rounded font-medium ${
                          tmpl.category === 'Wealth'
                            ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {tmpl.category}
                      </span>
                      <span>•</span>
                      <span>{tmpl.sectionCount || 0} Sections</span>
                      {mounted && (
                        <>
                          <span>•</span>
                          <span>Updated {formatDate(tmpl.updatedAt)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDuplicate(e, tmpl)}
                    title="Duplicate Template"
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, tmpl.id, tmpl.name)}
                    title="Delete Template"
                    className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TemplateCatalogPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Loading templates...</div>}>
      <TemplateCatalogContent />
    </Suspense>
  );
}
