'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Download, 
  CheckCircle2,
  Sparkles,
  Layers
} from 'lucide-react';
import { useTemplateNav } from '@/context/TemplateNavContext';

interface Subsection {
  title: string;
  type?: string;
  guidance?: string;
  contentToInclude?: string[];
}

interface Section {
  id?: string;
  title: string;
  type?: string;
  guidance?: string;
  contentToInclude?: string[];
  questions?: string[];
  subsections?: Subsection[];
}

interface TemplateData {
  id: string;
  name: string;
  category: string;
  scope: string;
  icon: string;
  globalInstructions: string[];
  sections: Section[];
}

export default function TemplateEditorPage() {
  const params = useParams();
  const id = params.id as string;

  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const { setActiveTemplate, setOnAddSection } = useTemplateNav();

  useEffect(() => {
    async function loadTemplate() {
      try {
        setLoading(true);
        const res = await fetch(`/api/templates/${id}`);
        const json = await res.json();
        if (json.success) {
          setTemplate(json.data);
        }
      } catch (err) {
        console.error('Failed to load template:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTemplate();

    return () => {
      setActiveTemplate(null);
      setOnAddSection(undefined);
    };
  }, [id, setActiveTemplate, setOnAddSection]);

  // Sync with Sidebar Template Navigation
  useEffect(() => {
    if (template) {
      setActiveTemplate({
        id: template.id,
        name: template.name,
        category: template.category,
        icon: template.icon,
        globalInstructions: template.globalInstructions,
        sections: template.sections.map((s) => ({
          title: s.title,
          type: s.type,
          subsections: s.subsections?.map((sub) => ({ title: sub.title })),
        })),
      });
    }
  }, [template, setActiveTemplate]);

  const handleSave = async () => {
    if (!template) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      const json = await res.json();
      if (json.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      } else {
        alert('Failed to save: ' + json.error);
      }
    } catch {
      alert('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleExportJson = () => {
    if (!template) return;
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `fameetingmanager_template_${template.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Global Instructions handlers
  const handleAddGlobalInstruction = () => {
    if (!template) return;
    setTemplate({
      ...template,
      globalInstructions: [...template.globalInstructions, 'New instruction...'],
    });
  };

  const handleUpdateGlobalInstruction = (index: number, val: string) => {
    if (!template) return;
    const updated = [...template.globalInstructions];
    updated[index] = val;
    setTemplate({ ...template, globalInstructions: updated });
  };

  const handleDeleteGlobalInstruction = (index: number) => {
    if (!template) return;
    const updated = template.globalInstructions.filter((_, i) => i !== index);
    setTemplate({ ...template, globalInstructions: updated });
  };

  // Section Handlers
  const handleAddSection = useCallback(() => {
    if (!template) return;
    const newSec: Section = {
      title: 'New Section',
      type: 'standard',
      guidance: 'Enter guidance and AI directives for this section...',
      contentToInclude: [],
      subsections: [],
    };
    setTemplate((prev) => (prev ? { ...prev, sections: [...prev.sections, newSec] } : null));
  }, [template]);

  useEffect(() => {
    setOnAddSection(() => handleAddSection);
  }, [handleAddSection, setOnAddSection]);

  const handleUpdateSection = <K extends keyof Section>(sIndex: number, field: K, val: Section[K]) => {
    if (!template) return;
    const updated = [...template.sections];
    updated[sIndex] = { ...updated[sIndex], [field]: val };
    setTemplate({ ...template, sections: updated });
  };

  const handleDeleteSection = (sIndex: number) => {
    if (!template) return;
    if (!confirm('Are you sure you want to delete this section?')) return;
    const updated = template.sections.filter((_, i) => i !== sIndex);
    setTemplate({ ...template, sections: updated });
  };

  const handleMoveSection = (sIndex: number, direction: 'up' | 'down') => {
    if (!template) return;
    const target = direction === 'up' ? sIndex - 1 : sIndex + 1;
    if (target < 0 || target >= template.sections.length) return;
    const updated = [...template.sections];
    const temp = updated[sIndex];
    updated[sIndex] = updated[target];
    updated[target] = temp;
    setTemplate({ ...template, sections: updated });
  };

  // Subsection Handlers
  const handleAddSubsection = (sIndex: number) => {
    if (!template) return;
    const updated = [...template.sections];
    const sec = updated[sIndex];
    const newSub: Subsection = {
      title: 'New Subsection',
      guidance: 'Enter subsection guidance...',
      contentToInclude: [],
    };
    sec.subsections = [...(sec.subsections || []), newSub];
    setTemplate({ ...template, sections: updated });
  };

  const handleUpdateSubsection = <K extends keyof Subsection>(sIndex: number, subIndex: number, field: K, val: Subsection[K]) => {
    if (!template) return;
    const updated = [...template.sections];
    const subs = [...(updated[sIndex].subsections || [])];
    subs[subIndex] = { ...subs[subIndex], [field]: val };
    updated[sIndex].subsections = subs;
    setTemplate({ ...template, sections: updated });
  };

  const handleDeleteSubsection = (sIndex: number, subIndex: number) => {
    if (!template) return;
    const updated = [...template.sections];
    updated[sIndex].subsections = updated[sIndex].subsections?.filter((_, i) => i !== subIndex);
    setTemplate({ ...template, sections: updated });
  };

  const handleMoveSubsection = (sIndex: number, subIndex: number, direction: 'up' | 'down') => {
    if (!template) return;
    const updated = [...template.sections];
    const subs = [...(updated[sIndex].subsections || [])];
    const target = direction === 'up' ? subIndex - 1 : subIndex + 1;
    if (target < 0 || target >= subs.length) return;
    const temp = subs[subIndex];
    subs[subIndex] = subs[target];
    subs[target] = temp;
    updated[sIndex].subsections = subs;
    setTemplate({ ...template, sections: updated });
  };

  // Content To Include Handlers (Bullets)
  const handleAddBullet = (sIndex: number, subIndex?: number) => {
    if (!template) return;
    const updated = [...template.sections];
    if (subIndex !== undefined) {
      const subs = [...(updated[sIndex].subsections || [])];
      subs[subIndex].contentToInclude = [...(subs[subIndex].contentToInclude || []), 'New item'];
      updated[sIndex].subsections = subs;
    } else {
      updated[sIndex].contentToInclude = [...(updated[sIndex].contentToInclude || []), 'New item'];
    }
    setTemplate({ ...template, sections: updated });
  };

  const handleUpdateBullet = (sIndex: number, bIndex: number, val: string, subIndex?: number) => {
    if (!template) return;
    const updated = [...template.sections];
    if (subIndex !== undefined) {
      const subs = [...(updated[sIndex].subsections || [])];
      const items = [...(subs[subIndex].contentToInclude || [])];
      items[bIndex] = val;
      subs[subIndex].contentToInclude = items;
      updated[sIndex].subsections = subs;
    } else {
      const items = [...(updated[sIndex].contentToInclude || [])];
      items[bIndex] = val;
      updated[sIndex].contentToInclude = items;
    }
    setTemplate({ ...template, sections: updated });
  };

  const handleDeleteBullet = (sIndex: number, bIndex: number, subIndex?: number) => {
    if (!template) return;
    const updated = [...template.sections];
    if (subIndex !== undefined) {
      const subs = [...(updated[sIndex].subsections || [])];
      subs[subIndex].contentToInclude = subs[subIndex].contentToInclude?.filter((_, i) => i !== bIndex);
      updated[sIndex].subsections = subs;
    } else {
      updated[sIndex].contentToInclude = updated[sIndex].contentToInclude?.filter((_, i) => i !== bIndex);
    }
    setTemplate({ ...template, sections: updated });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        <div className="animate-spin w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full mb-3" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-white">Template not found</h2>
        <Link href="/templates" className="text-sky-400 hover:underline mt-2 inline-block">
          Return to templates
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Editor Top Sticky Header */}
      <header className="px-8 py-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4 flex-1">
          <Link
            href="/templates"
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
            title="Back to Catalog"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1 max-w-xl">
            <input
              type="text"
              value={template.name}
              onChange={(e) => setTemplate({ ...template, name: e.target.value })}
              className="w-full text-xl font-extrabold text-white bg-transparent border border-transparent hover:border-slate-800 focus:border-sky-500 focus:bg-slate-900 px-2 py-1 rounded-lg outline-none transition"
              placeholder="Untitled Template"
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <select
            value={template.category}
            onChange={(e) => setTemplate({ ...template, category: e.target.value })}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs font-semibold rounded-lg px-3 py-2 outline-none focus:border-sky-500"
          >
            <option value="Wealth">Wealth</option>
            <option value="Other">Other</option>
            <option value="Mortgages">Mortgages</option>
            <option value="Protection">Protection</option>
          </select>

          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition"
          >
            <Download className="w-3.5 h-3.5" />
            JSON
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold shadow-lg transition ${
              savedSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/20'
            }`}
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Template'}
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Scrollable Canvas */}
      <div className="flex-1 overflow-y-auto p-8 max-w-5xl w-full mx-auto space-y-6 scroll-smooth">
        
        {/* Global Instructions Card */}
        <div 
          id="global-instructions"
          className="p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-sm space-y-4 scroll-mt-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-sky-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Global Instructions & AI Rules
            </h3>
            <button
              onClick={handleAddGlobalInstruction}
              className="flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 px-2.5 py-1 rounded-md border border-sky-500/20 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Rule
            </button>
          </div>
          <p className="text-xs text-slate-400">
            These standing instructions govern tone, jurisdiction spelling, bold prefixes, and formatting across the entire output.
          </p>

          <div className="space-y-2">
            {template.globalInstructions.map((rule, idx) => (
              <div key={idx} className="flex items-center gap-2 group">
                <span className="text-xs font-bold text-slate-400 w-5">{idx + 1}.</span>
                <input
                  type="text"
                  value={rule}
                  onChange={(e) => handleUpdateGlobalInstruction(idx, e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800/80 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500 transition"
                />
                <button
                  onClick={() => handleDeleteGlobalInstruction(idx)}
                  className="p-2 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section List Header */}
        <div className="flex items-center justify-between pt-2">
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-400" />
            Sections & Subsections ({template.sections.length})
          </h2>
          <button
            onClick={handleAddSection}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            Add Section
          </button>
        </div>

        {/* Sections Map */}
        <div className="space-y-6">
          {template.sections.map((section, sIndex) => (
            <div
              key={sIndex}
              id={`section-${sIndex}`}
              className="p-6 rounded-2xl bg-slate-950 border border-slate-800/90 shadow-md space-y-4 relative scroll-mt-6 hover:border-slate-700 transition-colors"
            >
              {/* Section Header Bar */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-xs font-bold bg-slate-800 text-slate-300 px-2 py-1 rounded font-mono">
                    § {sIndex + 1}
                  </span>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => handleUpdateSection(sIndex, 'title', e.target.value)}
                    className="text-base font-bold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-sky-400 px-1 py-0.5 outline-none flex-1"
                  />
                </div>

                {/* Section Controls */}
                <div className="flex items-center gap-1.5">
                  <select
                    value={section.type || 'standard'}
                    onChange={(e) => handleUpdateSection(sIndex, 'type', e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded px-2 py-1 outline-none"
                  >
                    <option value="standard">Standard</option>
                    <option value="table">Table Format</option>
                    <option value="template">Email/Doc Template</option>
                    <option value="checklist">Compliance Checklist</option>
                  </select>

                  <button
                    onClick={() => handleMoveSection(sIndex, 'up')}
                    disabled={sIndex === 0}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMoveSection(sIndex, 'down')}
                    disabled={sIndex === template.sections.length - 1}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSection(sIndex)}
                    className="p-1 text-slate-400 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Section AI Guidance Box (Blue Box) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1">
                  AI Guidance / Directives
                </label>
                <textarea
                  value={section.guidance || ''}
                  onChange={(e) => handleUpdateSection(sIndex, 'guidance', e.target.value)}
                  rows={3}
                  placeholder="Instructions telling the AI what to extract and how to format this section..."
                  className="w-full bg-slate-900/90 border border-sky-500/30 rounded-xl p-3 text-sm text-sky-100 placeholder-slate-400 focus:outline-none focus:border-sky-400 leading-relaxed font-sans transition"
                />
              </div>

              {/* Content To Include (Bullets) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Content to Include (Prompts / Bullets)
                  </span>
                  <button
                    onClick={() => handleAddBullet(sIndex)}
                    className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add item
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-1.5">
                  {section.contentToInclude?.map((bullet, bIdx) => (
                    <div key={bIdx} className="flex items-center gap-2 group">
                      <span className="text-sky-400 text-sm">•</span>
                      <input
                        type="text"
                        value={bullet}
                        onChange={(e) => handleUpdateBullet(sIndex, bIdx, e.target.value)}
                        className="flex-1 bg-slate-900/60 border border-slate-800/60 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                      />
                      <button
                        onClick={() => handleDeleteBullet(sIndex, bIdx)}
                        className="p-1 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subsections Area */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between border-t border-slate-800/40 pt-3">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                    Subsections ({section.subsections?.length || 0})
                  </span>
                  <button
                    onClick={() => handleAddSubsection(sIndex)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-sky-400 text-xs font-semibold border border-slate-800 transition"
                  >
                    <Plus className="w-3 h-3" /> Add Subsection
                  </button>
                </div>

                {/* Subsections Map */}
                <div className="space-y-3 pl-4 border-l-2 border-slate-800">
                  {section.subsections?.map((sub, subIdx) => (
                    <div
                      key={subIdx}
                      id={`subsection-${sIndex}-${subIdx}`}
                      className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-3 scroll-mt-6 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-[10px] font-bold bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                            {sIndex + 1}.{subIdx + 1}
                          </span>
                          <input
                            type="text"
                            value={sub.title}
                            onChange={(e) => handleUpdateSubsection(sIndex, subIdx, 'title', e.target.value)}
                            className="font-semibold text-sm text-sky-300 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-sky-400 px-1 py-0.5 outline-none flex-1"
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleMoveSubsection(sIndex, subIdx, 'up')}
                            disabled={subIdx === 0}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveSubsection(sIndex, subIdx, 'down')}
                            disabled={subIdx === (section.subsections?.length || 0) - 1}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSubsection(sIndex, subIdx)}
                            className="p-1 text-slate-400 hover:text-red-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Subsection Guidance */}
                      <textarea
                        value={sub.guidance || ''}
                        onChange={(e) => handleUpdateSubsection(sIndex, subIdx, 'guidance', e.target.value)}
                        rows={2}
                        placeholder="Subsection guidance and directives..."
                        className="w-full bg-slate-950 border border-slate-800/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-400 leading-relaxed font-sans"
                      />

                      {/* Subsection Content to Include (Bullets) */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold uppercase text-slate-400">
                            Sub-items
                          </span>
                          <button
                            onClick={() => handleAddBullet(sIndex, subIdx)}
                            className="text-[11px] text-sky-400 hover:text-sky-300 font-medium flex items-center gap-0.5"
                          >
                            <Plus className="w-2.5 h-2.5" /> add
                          </button>
                        </div>
                        {sub.contentToInclude?.map((bItem, bIdx) => (
                          <div key={bIdx} className="flex items-center gap-1.5 group">
                            <span className="text-slate-400 text-xs">•</span>
                            <input
                              type="text"
                              value={bItem}
                              onChange={(e) => handleUpdateBullet(sIndex, bIdx, e.target.value, subIdx)}
                              className="flex-1 bg-slate-950/60 border border-slate-800/50 rounded px-2 py-0.5 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
                            />
                            <button
                              onClick={() => handleDeleteBullet(sIndex, bIdx, subIdx)}
                              className="p-1 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Add Section Action */}
        <div className="pt-4 pb-12 text-center">
          <button
            onClick={handleAddSection}
            className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-sm font-bold inline-flex items-center gap-2 transition hover:border-slate-700"
          >
            <Plus className="w-4 h-4 text-sky-400" />
            Add New Section
          </button>
        </div>

      </div>
    </div>
  );
}