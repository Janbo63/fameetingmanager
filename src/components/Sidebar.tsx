'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  FileText, 
  Layers, 
  CheckSquare, 
  Calendar, 
  Sparkles,
  LogOut,
  User,
  ArrowLeft,
  Plus
} from 'lucide-react';
import { useTemplateNav } from '@/context/TemplateNavContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { 
    activeTemplate, 
    activeSectionId, 
    scrollToSection, 
    onAddSection 
  } = useTemplateNav();

  // If on login page, don't show sidebar
  if (pathname === '/login') return null;

  // Check if we are inside a template editor page
  const isInsideTemplate = pathname.startsWith('/templates/') && pathname !== '/templates/new' && activeTemplate;

  const navItems = [
    { label: 'Meeting Templates', href: '/templates', icon: Layers, active: pathname.startsWith('/templates') },
    { label: 'Documents', href: '#', icon: FileText, disabled: true },
    { label: 'Tasks', href: '#', icon: CheckSquare, disabled: true },
    { label: 'Meetings', href: '#', icon: Calendar, disabled: true },
  ];

  const getTypeBadge = (type?: string) => {
    switch (type) {
      case 'table':
        return <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">Table</span>;
      case 'template':
        return <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">Email</span>;
      case 'checklist':
        return <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">Check</span>;
      default:
        return null;
    }
  };

  return (
    <aside className="w-72 bg-slate-950 border-r border-slate-800 flex flex-col h-screen select-none shrink-0 transition-all">
      {isInsideTemplate ? (
        /* ================= MODE B: TEMPLATE SECTION OUTLINE ================= */
        <>
          {/* Header with Back Button */}
          <div className="p-4 border-b border-slate-800 space-y-3">
            <Link
              href="/templates"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 px-2 py-1.5 rounded-lg border border-transparent hover:border-slate-800 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Meeting templates
            </Link>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center text-base shrink-0 border border-sky-500/20">
                {activeTemplate.icon || '📋'}
              </div>
              <div className="overflow-hidden flex-1">
                <h2 className="font-bold text-sm text-white truncate" title={activeTemplate.name}>
                  {activeTemplate.name}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block text-[10px] font-semibold text-sky-400 bg-sky-500/10 px-1.5 py-0.2 rounded border border-sky-500/20">
                    {activeTemplate.category}
                  </span>
                  {activeTemplate.tier && (
                    <span className="inline-block text-[10px] font-bold uppercase text-indigo-300 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20 font-mono">
                      {activeTemplate.tier}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section Outline List */}
          <div className="flex-1 p-3 space-y-1 overflow-y-auto">
            <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Outline</span>
              <span className="font-mono text-slate-400">{activeTemplate.sections.length} Sections</span>
            </div>

            {/* Global Instructions Item */}
            <button
              onClick={() => scrollToSection('global-instructions')}
              className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                activeSectionId === 'global-instructions'
                  ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="truncate">Global Instructions</span>
            </button>

            {/* Section & Subsection List */}
            <div className="pt-1.5 space-y-1">
              {activeTemplate.sections.map((section, sIndex) => {
                const sectionId = `section-${sIndex}`;
                const isSecActive = activeSectionId === sectionId;

                return (
                  <div key={sIndex} className="space-y-0.5">
                    {/* Section Top Level Item */}
                    <button
                      onClick={() => scrollToSection(sectionId)}
                      className={`w-full text-left flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                        isSecActive
                          ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 font-semibold'
                          : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-[10px] font-bold text-slate-400 font-mono w-4 shrink-0">
                          §{sIndex + 1}
                        </span>
                        <span className="truncate">{section.title || 'Untitled'}</span>
                      </div>
                      {getTypeBadge(section.type)}
                    </button>

                    {/* Subsections Tree */}
                    {section.subsections && section.subsections.length > 0 && (
                      <div className="pl-6 space-y-0.5 border-l border-slate-800/80 ml-4 py-0.5">
                        {section.subsections.map((sub, subIdx) => {
                          const subId = `subsection-${sIndex}-${subIdx}`;
                          const isSubActive = activeSectionId === subId;

                          return (
                            <button
                              key={subIdx}
                              onClick={() => scrollToSection(subId)}
                              className={`w-full text-left flex items-center gap-1.5 px-2 py-1 rounded text-[11px] transition ${
                                isSubActive
                                  ? 'text-sky-300 font-semibold bg-sky-500/10'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                              }`}
                            >
                              <span className="text-[9px] text-slate-400 font-mono">
                                {sIndex + 1}.{subIdx + 1}
                              </span>
                              <span className="truncate">{sub.title || 'Untitled'}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Add Section Button */}
            {onAddSection && (
              <div className="pt-3">
                <button
                  onClick={onAddSection}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-dashed border-slate-800 hover:border-sky-500/40 text-slate-400 hover:text-sky-400 text-xs font-semibold hover:bg-sky-500/5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Section
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        /* ================= MODE A: GLOBAL WORKSPACES ================= */
        <>
          {/* Brand Logo Header */}
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-sky-500/20">
              FA
            </div>
            <div>
              <h1 className="font-bold text-base text-white tracking-tight flex items-center gap-1.5">
                FA Meeting Manager
              </h1>
              <p className="text-[11px] text-sky-400 font-medium">FutureSolutions AI</p>
            </div>
          </div>

          {/* Navigation List */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Workspaces
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              if (item.disabled) {
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 text-sm cursor-not-allowed opacity-60"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    <span className="ml-auto text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Soon</span>
                  </div>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    item.active
                      ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${item.active ? 'text-sky-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </>
      )}

      {/* User Session & Logout Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80 space-y-2 shrink-0">
        {session?.user && (
          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2 overflow-hidden">
              {session.user.image ? (
                <img src={session.user.image} alt="" className="w-7 h-7 rounded-full border border-slate-700" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
              <div className="overflow-hidden text-left">
                <p className="text-xs font-semibold text-white truncate">{session.user.name || 'Adviser'}</p>
                <p className="text-[10px] text-slate-400 truncate">{session.user.email}</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="px-2 text-[10px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-sky-400" />
            FutureSolutions AI
          </span>
          <span className="font-mono">11 Active</span>
        </div>
      </div>
    </aside>
  );
}