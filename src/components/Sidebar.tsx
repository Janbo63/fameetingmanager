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
  User
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // If on login page, don't show sidebar
  if (pathname === '/login') return null;

  const navItems = [
    { label: 'Meeting Templates', href: '/templates', icon: Layers, active: pathname.startsWith('/templates') },
    { label: 'Documents', href: '#', icon: FileText, disabled: true },
    { label: 'Tasks', href: '#', icon: CheckSquare, disabled: true },
    { label: 'Meetings', href: '#', icon: Calendar, disabled: true },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-screen select-none shrink-0">
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

      {/* User Session & Logout Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80 space-y-2">
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
