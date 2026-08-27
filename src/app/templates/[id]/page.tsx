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
  Layers,
  Eye,
  Edit3,
  Copy,
  Check,
  RotateCcw,
  History,
  GitFork,
  FileSpreadsheet
} from 'lucide-react';
import { useTemplateNav } from '@/context/TemplateNavContext';

export type TierType = 'simple' | 'standard' | 'complex';

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

interface TierVariantData {
  current: {
    globalInstructions: string[];
    sections: Section[];
    updatedAt: string;
  };
  previous?: {
    globalInstructions: string[];
    sections: Section[];
    savedAt: string;
  };
}

interface VariantsMap {
  simple?: TierVariantData;
  standard?: TierVariantData;
  complex?: TierVariantData;
}

interface TemplateData {
  id: string;
  name: string;
  category: string;
  scope: string;
  icon: string;
  globalInstructions: string[];
  sections: Section[];
  variants: VariantsMap;
}

export default function TemplateEditorPage() {
  const params = useParams();
  const id = params.id as string;

  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [activeTier, setActiveTier] = useState<TierType>('standard');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [revertSuccess, setRevertSuccess] = useState(false);
  
  // View Modes: 'read' (Read Prompt View) vs 'edit' (Full Edit View)
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSectionIdx, setEditingSectionIdx] = useState<number | null>(null);
  const [editingGlobalRules, setEditingGlobalRules] = useState(false);
  
  // Create Variant Modal state
  const [createVariantModal, setCreateVariantModal] = useState<{
    targetTier: TierType;
    isOpen: boolean;
  }>({ targetTier: 'simple', isOpen: false });

  // Copied feedback for prompt text
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  const { setActiveTemplate, setOnAddSection } = useTemplateNav();

  useEffect(() => {
    async function loadTemplate() {
      try {
        setLoading(true);
        const res = await fetch(`/api/templates/${id}`);
        const json = await res.json();
        if (json.success) {
          setTemplate(json.data);
          if (json.data.variants?.standard) {
            setActiveTier('standard');
          } else if (json.data.variants?.simple) {
            setActiveTier('simple');
          } else if (json.data.variants?.complex) {
            setActiveTier('complex');
          }
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

  const currentTierData = template?.variants?.[activeTier]?.current;
  const previousTierData = template?.variants?.[activeTier]?.previous;

  const globalInstructions = currentTierData?.globalInstructions || [];
  const sections = currentTierData?.sections || [];

  // Sync with Sidebar Template Navigation
  useEffect(() => {
    if (template && currentTierData) {
      setActiveTemplate({
        id: template.id,
        name: template.name,
        category: template.category,
        icon: template.icon,
        tier: activeTier,
        globalInstructions: currentTierData.globalInstructions || [],
        sections: (currentTierData.sections || []).map((s) => ({
          title: s.title,
          type: s.type,
          subsections: s.subsections?.map((sub) => ({ title: sub.title })),
        })),
      });
    }
  }, [template, activeTier, currentTierData, setActiveTemplate]);

  // Switch Tier
  const handleSelectTier = (tier: TierType) => {
    if (!template) return;
    if (template.variants?.[tier]) {
      setActiveTier(tier);
      setEditingSectionIdx(null);
      setEditingGlobalRules(false);
    } else {
      setCreateVariantModal({ targetTier: tier, isOpen: true });
    }
  };

  // Create Tier Variant (Fork from Standard or Start Blank)
  const handleConfirmCreateVariant = async (source: 'fork_standard' | 'blank') => {
    if (!template) return;
    const targetTier = createVariantModal.targetTier;

    let baseInstructions: string[] = [];
    let baseSections: Section[] = [];

    if (source === 'fork_standard') {
      const standardCurrent = template.variants?.standard?.current;
      if (standardCurrent) {
        baseInstructions = JSON.parse(JSON.stringify(standardCurrent.globalInstructions || []));
        baseSections = JSON.parse(JSON.stringify(standardCurrent.sections || []));
      }
    } else {
      baseInstructions = ['Concise bullet format', 'Jurisdiction-specific compliance'];
      baseSections = [
        {
          title: 'Meeting Overview & Key Objectives',
          type: 'standard',
          guidance: 'Summarize core meeting context and objectives...',
          contentToInclude: ['Attendees and date', 'Primary discussion themes'],
          subsections: [],
        },
      ];
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: targetTier,
          action: 'create_variant',
          globalInstructions: baseInstructions,
          sections: baseSections,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setTemplate(json.data);
        setActiveTier(targetTier);
        setCreateVariantModal({ targetTier: 'simple', isOpen: false });
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2000);
      } else {
        alert('Failed to create variant: ' + json.error);
      }
    } catch {
      alert('Error creating variant');
    } finally {
      setSaving(false);
    }
  };

  // Save current tier changes
  const handleSave = async () => {
    if (!template || !currentTierData) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          category: template.category,
          tier: activeTier,
          action: 'save',
          globalInstructions: currentTierData.globalInstructions,
          sections: currentTierData.sections,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setTemplate(json.data);
        setSavedSuccess(true);
        setEditingSectionIdx(null);
        setEditingGlobalRules(false);
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

  // Revert / Rollback to previous version
  const handleRevertToPrevious = async () => {
    if (!template || !previousTierData) return;
    const confirmRevert = window.confirm(
      `Are you sure you want to revert to the previous version saved on ${new Date(
        previousTierData.savedAt
      ).toLocaleString()}? Current unsaved modifications will be replaced.`
    );
    if (!confirmRevert) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: activeTier,
          action: 'revert',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setTemplate(json.data);
        setRevertSuccess(true);
        setEditingSectionIdx(null);
        setEditingGlobalRules(false);
        setTimeout(() => setRevertSuccess(false), 3000);
      } else {
        alert('Failed to revert: ' + json.error);
      }
    } catch {
      alert('Failed to revert version');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyPrompt = (text: string, copyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptId(copyId);
    setTimeout(() => setCopiedPromptId(null), 2000);
  };

  const handleExportJson = () => {
    if (!template) return;
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `fameetingmanager_${template.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_${activeTier}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Update helper for active tier state
  const updateActiveTierData = (
    updater: (prev: TierVariantData['current']) => TierVariantData['current']
  ) => {
    setTemplate((prev) => {
      if (!prev || !prev.variants?.[activeTier]) return prev;
      const currentObj = prev.variants[activeTier]!.current;
      const updatedCurrent = updater(currentObj);

      return {
        ...prev,
        variants: {
          ...prev.variants,
          [activeTier]: {
            ...prev.variants[activeTier],
            current: updatedCurrent,
          },
        },
      };
    });
  };

  // Global Instructions handlers
  const handleAddGlobalInstruction = () => {
    updateActiveTierData((curr) => ({
      ...curr,
      globalInstructions: [...(curr.globalInstructions || []), 'New instruction...'],
    }));
  };

  const handleUpdateGlobalInstruction = (index: number, val: string) => {
    updateActiveTierData((curr) => {
      const updated = [...(curr.globalInstructions || [])];
      updated[index] = val;
      return { ...curr, globalInstructions: updated };
    });
  };

  const handleDeleteGlobalInstruction = (index: number) => {
    updateActiveTierData((curr) => ({
      ...curr,
      globalInstructions: (curr.globalInstructions || []).filter((_, i) => i !== index),
    }));
  };

  // Section Handlers
  const handleAddSection = useCallback(() => {
    const newSec: Section = {
      title: 'New Section',
      type: 'standard',
      guidance: 'Enter guidance and AI directives for this section...',
      contentToInclude: [],
      subsections: [],
    };

    updateActiveTierData((curr) => {
      const newSecs = [...(curr.sections || []), newSec];
      setEditingSectionIdx(newSecs.length - 1);
      return { ...curr, sections: newSecs };
    });
  }, [activeTier]);

  useEffect(() => {
    setOnAddSection(() => handleAddSection);
  }, [handleAddSection, setOnAddSection]);

  const handleUpdateSection = <K extends keyof Section>(sIndex: number, field: K, val: Section[K]) => {
    updateActiveTierData((curr) => {
      const updated = [...(curr.sections || [])];
      updated[sIndex] = { ...updated[sIndex], [field]: val };
      return { ...curr, sections: updated };
    });
  };

  const handleDeleteSection = (sIndex: number) => {
    if (!confirm('Are you sure you want to delete this section?')) return;
    updateActiveTierData((curr) => ({
      ...curr,
      sections: (curr.sections || []).filter((_, i) => i !== sIndex),
    }));
    if (editingSectionIdx === sIndex) setEditingSectionIdx(null);
  };

  const handleMoveSection = (sIndex: number, direction: 'up' | 'down') => {
    updateActiveTierData((curr) => {
      const target = direction === 'up' ? sIndex - 1 : sIndex + 1;
      const secs = [...(curr.sections || [])];
      if (target < 0 || target >= secs.length) return curr;
      const temp = secs[sIndex];
      secs[sIndex] = secs[target];
      secs[target] = temp;
      if (editingSectionIdx === sIndex) setEditingSectionIdx(target);
      return { ...curr, sections: secs };
    });
  };

  // Subsection Handlers
  const handleAddSubsection = (sIndex: number) => {
    updateActiveTierData((curr) => {
      const secs = [...(curr.sections || [])];
      const sec = secs[sIndex];
      const newSub: Subsection = {
        title: 'New Subsection',
        guidance: 'Enter subsection guidance...',
        contentToInclude: [],
      };
      sec.subsections = [...(sec.subsections || []), newSub];
      return { ...curr, sections: secs };
    });
  };

  const handleUpdateSubsection = <K extends keyof Subsection>(
    sIndex: number,
    subIndex: number,
    field: K,
    val: Subsection[K]
  ) => {
    updateActiveTierData((curr) => {
      const secs = [...(curr.sections || [])];
      const subs = [...(secs[sIndex].subsections || [])];
      subs[subIndex] = { ...subs[subIndex], [field]: val };
      secs[sIndex].subsections = subs;
      return { ...curr, sections: secs };
    });
  };

  const handleDeleteSubsection = (sIndex: number, subIndex: number) => {
    updateActiveTierData((curr) => {
      const secs = [...(curr.sections || [])];
      secs[sIndex].subsections = secs[sIndex].subsections?.filter((_, i) => i !== subIndex);
      return { ...curr, sections: secs };
    });
  };

  const handleMoveSubsection = (sIndex: number, subIndex: number, direction: 'up' | 'down') => {
    updateActiveTierData((curr) => {
      const secs = [...(curr.sections || [])];
      const subs = [...(secs[sIndex].subsections || [])];
      const target = direction === 'up' ? subIndex - 1 : subIndex + 1;
      if (target < 0 || target >= subs.length) return curr;
      const temp = subs[subIndex];
      subs[subIndex] = subs[target];
      subs[target] = temp;
      secs[sIndex].subsections = subs;
      return { ...curr, sections: secs };
    });
  };

  // Content To Include Handlers (Bullets)
  const handleAddBullet = (sIndex: number, subIndex?: number) => {
    updateActiveTierData((curr) => {
      const secs = [...(curr.sections || [])];
      if (subIndex !== undefined) {
        const subs = [...(secs[sIndex].subsections || [])];
        subs[subIndex].contentToInclude = [...(subs[subIndex].contentToInclude || []), 'New item'];
        secs[sIndex].subsections = subs;
      } else {
        secs[sIndex].contentToInclude = [...(secs[sIndex].contentToInclude || []), 'New item'];
      }
      return { ...curr, sections: secs };
    });
  };

  const handleUpdateBullet = (sIndex: number, bIndex: number, val: string, subIndex?: number) => {
    updateActiveTierData((curr) => {
      const secs = [...(curr.sections || [])];
      if (subIndex !== undefined) {
        const subs = [...(secs[sIndex].subsections || [])];
        const items = [...(subs[subIndex].contentToInclude || [])];
        items[bIndex] = val;
        subs[subIndex].contentToInclude = items;
        secs[sIndex].subsections = subs;
      } else {
        const items = [...(secs[sIndex].contentToInclude || [])];
        items[bIndex] = val;
        secs[sIndex].contentToInclude = items;
      }
      return { ...curr, sections: secs };
    });
  };

  const handleDeleteBullet = (sIndex: number, bIndex: number, subIndex?: number) => {
    updateActiveTierData((curr) => {
      const secs = [...(curr.sections || [])];
      if (subIndex !== undefined) {
        const subs = [...(secs[sIndex].subsections || [])];
        subs[subIndex].contentToInclude = subs[subIndex].contentToInclude?.filter((_, i) => i !== bIndex);
        secs[sIndex].subsections = subs;
      } else {
        secs[sIndex].contentToInclude = secs[sIndex].contentToInclude?.filter((_, i) => i !== bIndex);
      }
      return { ...curr, sections: secs };
    });
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

  const tierOptions: { key: TierType; label: string; desc: string }[] = [
    { key: 'simple', label: 'Simple', desc: 'Concise summary format' },
    { key: 'standard', label: 'Standard', desc: 'Default comprehensive notes' },
    { key: 'complex', label: 'Complex', desc: 'In-depth multi-disciplinary review' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Editor Top Sticky Header */}
      <header className="px-8 py-3.5 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 shadow-md">
        <div className="flex items-center gap-4 flex-1">
          <Link
            href="/templates"
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
            title="Back to Catalog"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1 max-w-xl">
            {isEditMode ? (
              <input
                type="text"
                value={template.name}
                onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                className="w-full text-xl font-extrabold text-white bg-transparent border border-slate-700 hover:border-slate-600 focus:border-sky-500 focus:bg-slate-900 px-2 py-1 rounded-lg outline-none transition"
                placeholder="Untitled Template"
              />
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xl">{template.icon || '📋'}</span>
                <h1 className="text-xl font-extrabold text-white tracking-tight">
                  {template.name}
                </h1>
                <span className="text-xs font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20 ml-2">
                  {template.category}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls & Mode Switcher */}
        <div className="flex items-center gap-3">
          {/* Read View / Edit Mode Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 shadow-inner">
            <button
              onClick={() => {
                setIsEditMode(false);
                setEditingSectionIdx(null);
                setEditingGlobalRules(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                !isEditMode && editingSectionIdx === null
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Read Prompts
            </button>
            <button
              onClick={() => setIsEditMode(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                isEditMode
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Mode
            </button>
          </div>

          {isEditMode && (
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
          )}

          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition"
          >
            <Download className="w-3.5 h-3.5" />
            JSON
          </button>

          {(isEditMode || editingSectionIdx !== null || editingGlobalRules) && (
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
                  {saving ? 'Saving...' : 'Save Changes'}
                </>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Tier Options & Version Control Ribbon */}
      <div className="bg-slate-950/90 border-b border-slate-800/80 px-8 py-2.5 flex flex-wrap items-center justify-between gap-4">
        {/* Tier Tabs (Simple | Standard | Complex) */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            Complexity Tier:
          </span>

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
            {tierOptions.map((t) => {
              const isSelected = activeTier === t.key;
              const isCreated = !!template.variants?.[t.key];

              return (
                <button
                  key={t.key}
                  onClick={() => handleSelectTier(t.key)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    isSelected
                      ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20'
                      : isCreated
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'
                  }`}
                >
                  <span>{t.label}</span>
                  {!isCreated && (
                    <span className="text-[9px] bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.2 rounded font-normal">
                      + Create
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Version Control & Rollback Actions */}
        <div className="flex items-center gap-3">
          {revertSuccess && (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 animate-pulse">
              <Check className="w-3.5 h-3.5" /> Restored previous version!
            </span>
          )}

          {previousTierData ? (
            <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <History className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  Previous snapshot:{' '}
                  <strong className="text-slate-300 font-mono text-[11px]">
                    {new Date(previousTierData.savedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </strong>
                </span>
              </div>

              <button
                onClick={handleRevertToPrevious}
                disabled={saving}
                className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 px-2.5 py-1 rounded-lg border border-amber-400/30 transition shadow-sm"
                title="Restore previous version snapshot"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Revert to Previous
              </button>
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-slate-400" />
              <span>Current version active</span>
            </div>
          )}
        </div>
      </div>

      {/* Create Variant Modal */}
      {createVariantModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <GitFork className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Create {createVariantModal.targetTier.toUpperCase()} Version
                </h3>
                <p className="text-xs text-slate-400">
                  This variant has not been defined yet for this template.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                How would you like to initialize the <strong>{createVariantModal.targetTier}</strong> option?
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => handleConfirmCreateVariant('fork_standard')}
                  disabled={saving}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-left transition group"
                >
                  <Sparkles className="w-5 h-5 text-sky-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white group-hover:text-sky-300">
                      Copy from Standard (Recommended)
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Copies existing Standard instructions and sections as your starting baseline.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => handleConfirmCreateVariant('blank')}
                  disabled={saving}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-left transition group"
                >
                  <FileSpreadsheet className="w-5 h-5 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-300 group-hover:text-white">
                      Start Blank
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Starts with a fresh, empty outline structure.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setCreateVariantModal({ targetTier: 'simple', isOpen: false })}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Scrollable Canvas */}
      <div className="flex-1 overflow-y-auto p-8 max-w-5xl w-full mx-auto space-y-8 scroll-smooth">
        
        {/* Global Instructions Card */}
        <div 
          id="global-instructions"
          className="p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-sm space-y-4 scroll-mt-6 hover:border-slate-700 transition"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-sky-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Global Instructions & AI Standing Rules ({activeTier.toUpperCase()})
            </h3>
            
            <div className="flex items-center gap-2">
              {!isEditMode && (
                <button
                  onClick={() => setEditingGlobalRules(!editingGlobalRules)}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-sky-400 bg-slate-900 hover:bg-slate-850 px-2.5 py-1 rounded-lg border border-slate-800 transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {editingGlobalRules ? 'Done Editing' : 'Edit Rules'}
                </button>
              )}
              {(isEditMode || editingGlobalRules) && (
                <button
                  onClick={handleAddGlobalInstruction}
                  className="flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 px-2.5 py-1 rounded-md border border-sky-500/20 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Rule
                </button>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            These standing instructions for the <strong>{activeTier}</strong> tier govern tone, jurisdiction spelling, bold prefixes, and formatting across the output.
          </p>

          {/* Read View for Global Instructions */}
          {!isEditMode && !editingGlobalRules ? (
            <div className="space-y-2 pt-1">
              {globalInstructions.map((rule, idx) => (
                <div 
                  key={idx} 
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-sm text-slate-200 leading-relaxed font-sans"
                >
                  <span className="w-5 h-5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 font-mono">
                    {idx + 1}
                  </span>
                  <div className="flex-1">{rule}</div>
                </div>
              ))}
            </div>
          ) : (
            /* Edit View for Global Instructions */
            <div className="space-y-2 pt-1">
              {globalInstructions.map((rule, idx) => (
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
          )}
        </div>

        {/* Section List Header */}
        <div className="flex items-center justify-between pt-2">
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-400" />
            Sections & Subsections ({sections.length})
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
        <div className="space-y-8">
          {sections.map((section, sIndex) => {
            const isEditingThisSection = isEditMode || editingSectionIdx === sIndex;
            const promptCopyId = `prompt-${sIndex}`;

            return (
              <div
                key={sIndex}
                id={`section-${sIndex}`}
                className={`p-6 rounded-2xl bg-slate-950 border transition-all duration-200 space-y-5 relative scroll-mt-6 ${
                  isEditingThisSection 
                    ? 'border-sky-500/50 shadow-xl shadow-sky-950/20 ring-1 ring-sky-500/20' 
                    : 'border-slate-800 hover:border-slate-700 shadow-md'
                }`}
              >
                {/* Section Header Bar */}
                <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div className="flex items-center gap-2.5 flex-1">
                    <span className="text-xs font-bold bg-slate-800 text-sky-400 px-2.5 py-1 rounded-md font-mono border border-slate-700">
                      § {sIndex + 1}
                    </span>
                    {isEditingThisSection ? (
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => handleUpdateSection(sIndex, 'title', e.target.value)}
                        className="text-lg font-bold text-white bg-slate-900 border border-slate-700 focus:border-sky-400 px-2.5 py-1 rounded-lg outline-none flex-1"
                      />
                    ) : (
                      <h3 className="text-lg font-bold text-white tracking-tight">
                        {section.title || 'Untitled Section'}
                      </h3>
                    )}
                  </div>

                  {/* Section Controls & Edit Toggle */}
                  <div className="flex items-center gap-2">
                    {/* Section Type Badge */}
                    {section.type && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800">
                        {section.type}
                      </span>
                    )}

                    {/* Quick Inline Edit Toggle */}
                    {!isEditMode && (
                      <button
                        onClick={() => setEditingSectionIdx(isEditingThisSection ? null : sIndex)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                          isEditingThisSection
                            ? 'bg-sky-500 text-white border-sky-400'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:text-white'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        {isEditingThisSection ? 'Done' : 'Edit Section'}
                      </button>
                    )}

                    {isEditingThisSection && (
                      <>
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
                          className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-900"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMoveSection(sIndex, 'down')}
                          disabled={sIndex === template.sections.length - 1}
                          className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-900"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSection(sIndex)}
                          className="p-1.5 text-slate-400 hover:text-red-400 transition rounded hover:bg-slate-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Section AI Guidance Box (Read vs Edit) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Guidance & Extraction Directives
                    </label>

                    {/* Copy prompt button */}
                    {section.guidance && (
                      <button
                        onClick={() => handleCopyPrompt(section.guidance || '', promptCopyId)}
                        className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-sky-300 transition px-2 py-0.5 rounded hover:bg-slate-900"
                      >
                        {copiedPromptId === promptCopyId ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 font-semibold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Prompt</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {isEditingThisSection ? (
                    <textarea
                      value={section.guidance || ''}
                      onChange={(e) => handleUpdateSection(sIndex, 'guidance', e.target.value)}
                      rows={4}
                      placeholder="Instructions telling the AI what to extract and how to format this section..."
                      className="w-full bg-slate-900 border border-sky-500/40 rounded-xl p-3.5 text-sm text-sky-100 placeholder-slate-400 focus:outline-none focus:border-sky-400 leading-relaxed font-sans transition"
                    />
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-sky-500/20 text-sm text-sky-100 leading-relaxed font-sans whitespace-pre-line shadow-inner">
                      {section.guidance || (
                        <span className="text-slate-400 italic">No specific AI guidance entered for this section.</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Content To Include (Bullets / Prompts) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Content to Include ({section.contentToInclude?.length || 0} items)
                    </span>
                    {isEditingThisSection && (
                      <button
                        onClick={() => handleAddBullet(sIndex)}
                        className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add item
                      </button>
                    )}
                  </div>

                  {isEditingThisSection ? (
                    /* Edit mode for bullets */
                    <div className="grid grid-cols-1 gap-1.5">
                      {section.contentToInclude?.map((bullet, bIdx) => (
                        <div key={bIdx} className="flex items-center gap-2 group">
                          <span className="text-sky-400 text-sm">•</span>
                          <input
                            type="text"
                            value={bullet}
                            onChange={(e) => handleUpdateBullet(sIndex, bIdx, e.target.value)}
                            className="flex-1 bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                          />
                          <button
                            onClick={() => handleDeleteBullet(sIndex, bIdx)}
                            className="p-1 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Read mode for bullets */
                    <div className="space-y-1.5">
                      {section.contentToInclude && section.contentToInclude.length > 0 ? (
                        section.contentToInclude.map((bullet, bIdx) => (
                          <div 
                            key={bIdx} 
                            className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-900/40 px-3 py-2 rounded-lg border border-slate-800/60"
                          >
                            <span className="text-sky-400 font-bold">•</span>
                            <span className="leading-relaxed">{bullet}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">No content bullet requirements listed.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Subsections Area */}
                {((section.subsections && section.subsections.length > 0) || isEditingThisSection) && (
                  <div className="pt-3 space-y-4">
                    <div className="flex items-center justify-between border-t border-slate-800/80 pt-4">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                        Subsections ({section.subsections?.length || 0})
                      </span>
                      {isEditingThisSection && (
                        <button
                          onClick={() => handleAddSubsection(sIndex)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-sky-400 text-xs font-semibold border border-slate-800 transition"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Subsection
                        </button>
                      )}
                    </div>

                    {/* Subsections Map */}
                    <div className="space-y-4 pl-4 border-l-2 border-slate-800">
                      {section.subsections?.map((sub, subIdx) => {
                        return (
                          <div
                            key={subIdx}
                            id={`subsection-${sIndex}-${subIdx}`}
                            className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 scroll-mt-6 hover:border-slate-700 transition"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1">
                                <span className="text-[10px] font-bold bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                                  {sIndex + 1}.{subIdx + 1}
                                </span>
                                {isEditingThisSection ? (
                                  <input
                                    type="text"
                                    value={sub.title}
                                    onChange={(e) => handleUpdateSubsection(sIndex, subIdx, 'title', e.target.value)}
                                    className="font-semibold text-sm text-sky-300 bg-slate-950 border border-slate-800 focus:border-sky-400 px-2 py-0.5 rounded outline-none flex-1"
                                  />
                                ) : (
                                  <h4 className="font-semibold text-sm text-sky-200">
                                    {sub.title || 'Untitled Subsection'}
                                  </h4>
                                )}
                              </div>

                              {isEditingThisSection && (
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
                              )}
                            </div>

                            {/* Subsection Guidance */}
                            {isEditingThisSection ? (
                              <textarea
                                value={sub.guidance || ''}
                                onChange={(e) => handleUpdateSubsection(sIndex, subIdx, 'guidance', e.target.value)}
                                rows={2}
                                placeholder="Subsection guidance and directives..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-400 leading-relaxed font-sans"
                              />
                            ) : (
                              sub.guidance && (
                                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                                  {sub.guidance}
                                </div>
                              )
                            )}

                            {/* Subsection Content to Include (Bullets) */}
                            {((sub.contentToInclude && sub.contentToInclude.length > 0) || isEditingThisSection) && (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-semibold uppercase text-slate-400">
                                    Sub-items
                                  </span>
                                  {isEditingThisSection && (
                                    <button
                                      onClick={() => handleAddBullet(sIndex, subIdx)}
                                      className="text-[11px] text-sky-400 hover:text-sky-300 font-medium flex items-center gap-0.5"
                                    >
                                      <Plus className="w-2.5 h-2.5" /> add
                                    </button>
                                  )}
                                </div>

                                {isEditingThisSection ? (
                                  sub.contentToInclude?.map((bItem, bIdx) => (
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
                                  ))
                                ) : (
                                  <div className="space-y-1">
                                    {sub.contentToInclude?.map((bItem, bIdx) => (
                                      <div key={bIdx} className="flex items-start gap-2 text-xs text-slate-400">
                                        <span className="text-sky-400">•</span>
                                        <span>{bItem}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Add Section Action */}
        <div className="pt-4 pb-12 text-center">
          <button
            onClick={handleAddSection}
            className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-sm font-bold inline-flex items-center gap-2 transition hover:border-slate-700 shadow-sm"
          >
            <Plus className="w-4 h-4 text-sky-400" />
            Add New Section
          </button>
        </div>

      </div>
    </div>
  );
}