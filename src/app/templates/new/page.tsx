'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';

interface TemplateOption {
  id: string;
  name: string;
  sectionCount?: number;
  sections?: unknown[];
  globalInstructions?: string[];
}

export default function NewTemplatePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Wealth');
  const [scope, setScope] = useState('Company');
  const [cloneFromId, setCloneFromId] = useState('');
  const [existingTemplates, setExistingTemplates] = useState<TemplateOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await fetch('/api/templates');
        const json = await res.json();
        if (json.success) {
          setExistingTemplates(json.data);
        }
      } catch {
        // ignore
      }
    }
    loadTemplates();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('Please enter a template name');

    try {
      setLoading(true);

      let globalInstructions = [
        'Ensure the writing style is concise, avoids unnecessary jargon, and focuses on clear, action-oriented language',
        'Where appropriate, summarise key points or actions using bullet points for clarity and quick reference',
        'Use spelling appropriate for the jurisdiction',
        'Document factual information rather than adviser opinions',
        'Document only topics actually discussed in the meeting',
      ];

      let sections: unknown[] = [
        {
          title: 'Meeting details',
          type: 'standard',
          guidance: 'Record all attendees and their roles. Note if key decision-makers are present.',
          contentToInclude: ['All attendees and their roles', 'Key decision-makers present'],
          subsections: [],
        },
        {
          title: 'Next steps',
          type: 'standard',
          guidance: 'List clear next steps with owners and timeframes as bullet points.',
          contentToInclude: ['Action items', 'Timeframes and owners'],
          subsections: [],
        },
      ];

      // If cloning from existing template
      if (cloneFromId) {
        const selected = existingTemplates.find((t) => t.id === cloneFromId);
        if (selected) {
          globalInstructions = selected.globalInstructions || globalInstructions;
          sections = selected.sections || sections;
        }
      }

      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          category,
          scope,
          icon: category === 'Wealth' ? '📋' : '💬',
          globalInstructions,
          sections,
        }),
      });

      const json = await res.json();
      if (json.success) {
        router.push(`/templates/${json.data.id}`);
      } else {
        alert('Failed to create: ' + json.error);
      }
    } catch {
      alert('Error creating template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl w-full mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/templates"
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Create meeting template</h1>
          <p className="text-xs text-slate-400">Design a new structured documentation workflow for Superbia</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-5 shadow-lg">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Template Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Annual Wealth Review, Discovery Meeting..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
            >
              <option value="Wealth">Wealth</option>
              <option value="Other">Other</option>
              <option value="Mortgages">Mortgages</option>
              <option value="Protection">Protection</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Scope
            </label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
            >
              <option value="Company">Company (Shared)</option>
              <option value="Personal">Personal</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Starting Structure (Optional)
          </label>
          <select
            value={cloneFromId}
            onChange={(e) => setCloneFromId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
          >
            <option value="">Start from standard clean structure</option>
            {existingTemplates.map((t) => (
              <option key={t.id} value={t.id}>
                Clone from {t.name} ({t.sectionCount || t.sections?.length || 0} sections)
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400 mt-1.5">
            You can clone any existing Superbia template to start with its sections pre-loaded.
          </p>
        </div>

        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
          <Link
            href="/templates"
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-600/20 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {loading ? 'Creating...' : 'Create & Open Editor'}
          </button>
        </div>
      </form>
    </div>
  );
}
