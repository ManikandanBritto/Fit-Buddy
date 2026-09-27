import React from 'react';
import { Dumbbell, Sparkles, Users, CalendarCheck } from 'lucide-react';

interface NavbarProps {
  currentTab: 'generator' | 'plan' | 'admin';
  setCurrentTab: (tab: 'generator' | 'plan' | 'admin') => void;
  hasPlan: boolean;
  totalUsersCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  hasPlan,
  totalUsersCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-950/60 bg-[#080d0b]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div 
          onClick={() => setCurrentTab('generator')}
          className="flex cursor-pointer items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-700 text-black shadow-lg shadow-emerald-900/30">
            <Dumbbell className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-white">FitBuddy</span>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-400 border border-emerald-500/20">
                AI
              </span>
            </div>
            <p className="text-[11px] text-gray-400">Personalized 7-Day Fitness Plans</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setCurrentTab('generator')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              currentTab === 'generator'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-gray-400 hover:bg-emerald-950/40 hover:text-gray-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>Generator</span>
          </button>

          <button
            onClick={() => setCurrentTab('plan')}
            disabled={!hasPlan}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              !hasPlan
                ? 'cursor-not-allowed opacity-40 text-gray-500'
                : currentTab === 'plan'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm cursor-pointer'
                : 'text-gray-400 hover:bg-emerald-950/40 hover:text-gray-200 cursor-pointer'
            }`}
          >
            <CalendarCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Active Plan</span>
            {hasPlan && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setCurrentTab('admin')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              currentTab === 'admin'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-gray-400 hover:bg-emerald-950/40 hover:text-gray-200'
            }`}
          >
            <Users className="h-3.5 w-3.5 text-emerald-400" />
            <span>Admin / Coach</span>
            {totalUsersCount > 0 && (
              <span className="rounded-full bg-emerald-900/60 px-1.5 py-0.2 text-[10px] text-emerald-300 border border-emerald-700/50">
                {totalUsersCount}
              </span>
            )}
          </button>
        </nav>

        {/* Gemini status */}
        <div className="hidden lg:flex items-center gap-2 rounded-full border border-emerald-800/40 bg-emerald-950/30 px-3 py-1 text-[11px] text-emerald-300/80">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Gemini AI Ready</span>
        </div>
      </div>
    </header>
  );
};
