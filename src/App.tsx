import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { GeneratorForm } from './components/GeneratorForm';
import { PlanView } from './components/PlanView';
import { AdminDashboard } from './components/AdminDashboard';
import { UserRecord, WorkoutPlan } from './types';
import confetti from 'canvas-confetti';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'generator' | 'plan' | 'admin'>('generator');
  const [currentUser, setCurrentUser] = useState<UserRecord | null>(null);
  const [currentPlan, setCurrentPlan] = useState<WorkoutPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [totalUsersCount, setTotalUsersCount] = useState<number>(0);

  const fetchUsersCount = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.users) {
        setTotalUsersCount(data.users.length);
      }
    } catch (e) {
      // silent fail
    }
  };

  useEffect(() => {
    fetchUsersCount();
  }, []);

  const handlePlanGenerated = (user: UserRecord, plan: WorkoutPlan) => {
    setCurrentUser(user);
    setCurrentPlan(plan);
    setCurrentTab('plan');
    fetchUsersCount();

    // Fire celebratory confetti on generation
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#34d399', '#6ee7b7', '#10b981', '#059669'],
    });
  };

  const handlePlanUpdated = (updatedUser: UserRecord, updatedPlan: WorkoutPlan) => {
    setCurrentUser(updatedUser);
    setCurrentPlan(updatedPlan);
    fetchUsersCount();
  };

  const handleSelectFromAdmin = (user: UserRecord, plan: WorkoutPlan) => {
    setCurrentUser(user);
    setCurrentPlan(plan);
    setCurrentTab('plan');
  };

  return (
    <div className="min-h-screen bg-[#080d0b] text-gray-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        hasPlan={Boolean(currentUser && currentPlan)}
        totalUsersCount={totalUsersCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {currentTab === 'generator' && (
          <GeneratorForm
            onPlanGenerated={handlePlanGenerated}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        )}

        {currentTab === 'plan' && currentUser && currentPlan && (
          <PlanView
            user={currentUser}
            plan={currentPlan}
            onPlanUpdated={handlePlanUpdated}
            onBackToGenerator={() => setCurrentTab('generator')}
          />
        )}

        {currentTab === 'admin' && (
          <AdminDashboard
            onSelectUserPlan={handleSelectFromAdmin}
            onRefreshUsers={fetchUsersCount}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-emerald-950/60 py-6 text-center text-xs text-gray-500">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-300">FitBuddy</span>
            <span>•</span>
            <span>AI 7-Day Fitness Plan & PDF Generator</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-gray-500">
            <span>Powered by Google Gemini Models</span>
            <span>•</span>
            <span>Interactive Coach Platform</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
