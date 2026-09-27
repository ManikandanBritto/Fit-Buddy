import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Eye,
  Trash2,
  Download,
  GitCompare,
  Calendar,
  Sparkles,
  RefreshCw,
  X,
  FileText,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { UserRecord, WorkoutPlan } from '../types';
import { generateFitnessPlanPDF } from '../utils/pdfGenerator';

interface AdminDashboardProps {
  onSelectUserPlan: (user: UserRecord, plan: WorkoutPlan) => void;
  onRefreshUsers: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onSelectUserPlan,
  onRefreshUsers,
}) => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGoal, setFilterGoal] = useState<string>('all');
  const [selectedUserForComparison, setSelectedUserForComparison] = useState<UserRecord | null>(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (id: string) => {
    try {
      const res = await fetch(`/api/user/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        setDeleteCandidateId(null);
        onRefreshUsers();
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const handleDownloadUserPDF = (userRecord: UserRecord) => {
    const plan = userRecord.updatedPlan || userRecord.originalPlan;
    const doc = generateFitnessPlanPDF(
      {
        name: userRecord.name,
        userId: userRecord.id,
        age: userRecord.age,
        weight: userRecord.weight,
        goal: userRecord.goal,
        intensity: userRecord.intensity,
      },
      plan
    );
    doc.save(`FitBuddy_${userRecord.name.replace(/\s+/g, '_')}_${userRecord.id}.pdf`);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGoal = filterGoal === 'all' || u.goal === filterGoal;
    return matchesSearch && matchesGoal;
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col px-4 py-8 sm:px-6">
      {/* Dashboard Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-emerald-950/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <Users className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-extrabold text-white sm:text-2xl">
              Admin & Coach Dashboard
            </h1>
          </div>
          <p className="mt-1 text-xs text-gray-300">
            Scenario 4: View all registered clients, track progress, review feedback revisions, and download reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchUsers();
              onRefreshUsers();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-900/60 bg-[#0c1612] px-3 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-950/60 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Stats row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-emerald-950/80 bg-[#0c1612] p-4">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Total Users</div>
          <div className="mt-1 text-2xl font-black text-white">{users.length}</div>
        </div>

        <div className="rounded-xl border border-emerald-950/80 bg-[#0c1612] p-4">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">AI Revisions</div>
          <div className="mt-1 text-2xl font-black text-emerald-400">
            {users.filter((u) => u.updatedPlan).length}
          </div>
        </div>

        <div className="rounded-xl border border-emerald-950/80 bg-[#0c1612] p-4">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Weight Loss</div>
          <div className="mt-1 text-2xl font-black text-teal-300">
            {users.filter((u) => u.goal === 'Weight Loss').length}
          </div>
        </div>

        <div className="rounded-xl border border-emerald-950/80 bg-[#0c1612] p-4">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Muscle Gain</div>
          <div className="mt-1 text-2xl font-black text-sky-400">
            {users.filter((u) => u.goal === 'Muscle Gain').length}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 min-w-[240px]">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or User ID..."
              className="w-full rounded-xl border border-emerald-900/60 bg-[#07100c] pl-9 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="relative">
            <select
              value={filterGoal}
              onChange={(e) => setFilterGoal(e.target.value)}
              className="rounded-xl border border-emerald-900/60 bg-[#07100c] px-3 py-1.5 text-xs text-gray-200 focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">All Goals</option>
              <option value="Weight Loss">Weight Loss</option>
              <option value="Muscle Gain">Muscle Gain</option>
              <option value="General Wellness">General Wellness</option>
              <option value="Flexibility">Flexibility</option>
              <option value="Endurance">Endurance</option>
            </select>
          </div>
        </div>

        <span className="text-xs text-gray-400">
          Showing {filteredUsers.length} of {users.length} clients
        </span>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-emerald-900/60 bg-[#0c1612] shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-emerald-950 bg-[#07100c] text-[11px] font-bold uppercase tracking-wider text-gray-400">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">User ID</th>
                <th className="px-4 py-3">Age / Weight</th>
                <th className="px-4 py-3">Goal & Intensity</th>
                <th className="px-4 py-3">Plan Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/60 text-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" />
                      <span>Loading client records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    No client records found. Generate a plan on the Generator tab to populate this dashboard!
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const hasUpdated = Boolean(user.updatedPlan);
                  return (
                    <tr key={user.id} className="transition-colors hover:bg-emerald-950/20">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-white">{user.name}</div>
                        <div className="text-[10px] text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-emerald-400">
                        {user.id}
                      </td>

                      <td className="px-4 py-3.5">
                        {user.age} yrs • {user.weight} kg
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-medium text-emerald-300">{user.goal}</div>
                        <div className="text-[10px] text-gray-400">{user.intensity} Intensity</div>
                      </td>

                      <td className="px-4 py-3.5">
                        {hasUpdated ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-teal-500/15 px-2 py-0.5 text-[10px] font-semibold text-teal-300 border border-teal-500/30">
                            <Sparkles className="h-3 w-3" />
                            <span>Updated (Rev #{user.updatedPlan?.revision || 2})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-gray-800 px-2 py-0.5 text-[10px] font-medium text-gray-400">
                            Original Plan
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Compare Plans button */}
                          {hasUpdated && (
                            <button
                              onClick={() => setSelectedUserForComparison(user)}
                              className="rounded-lg border border-teal-800/40 bg-teal-950/30 p-1.5 text-teal-300 hover:bg-teal-900/40"
                              title="Compare Original vs Updated Plan"
                            >
                              <GitCompare className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {/* Load Active Plan */}
                          <button
                            onClick={() => {
                              const plan = user.updatedPlan || user.originalPlan;
                              onSelectUserPlan(user, plan);
                            }}
                            className="rounded-lg border border-emerald-800/40 bg-emerald-950/30 p-1.5 text-emerald-300 hover:bg-emerald-900/40"
                            title="Open Plan View"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          {/* Download PDF */}
                          <button
                            onClick={() => handleDownloadUserPDF(user)}
                            className="rounded-lg border border-emerald-800/40 bg-emerald-950/30 p-1.5 text-emerald-300 hover:bg-emerald-900/40"
                            title="Download PDF"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteCandidateId(user.id)}
                            className="rounded-lg border border-rose-900/40 bg-rose-950/20 p-1.5 text-rose-400 hover:bg-rose-900/40"
                            title="Delete Record"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteCandidateId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-rose-900/60 bg-[#0e1612] p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-base font-bold text-white">Delete User Record?</h3>
            </div>
            <p className="mt-2 text-xs text-gray-300">
              Are you sure you want to delete client record <strong className="text-white font-mono">{deleteCandidateId}</strong>? This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDeleteCandidateId(null)}
                className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(deleteCandidateId)}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500"
              >
                Delete Client
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compare Modal (Original vs Updated Plan) */}
      {selectedUserForComparison && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl border border-emerald-900/80 bg-[#0c1612] p-6 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-emerald-950 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <GitCompare className="h-5 w-5 text-emerald-400" />
                  <span>Compare Plans: {selectedUserForComparison.name} ({selectedUserForComparison.id})</span>
                </h3>
                <p className="text-xs text-gray-400">
                  Review original Gemini plan against the updated feedback-driven revision.
                </p>
              </div>
              <button
                onClick={() => setSelectedUserForComparison(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Feedback Summary Banner */}
            {selectedUserForComparison.feedbackList && selectedUserForComparison.feedbackList.length > 0 && (
              <div className="my-3 rounded-xl border border-teal-900/60 bg-teal-950/30 p-3 text-xs text-teal-200">
                <span className="font-bold">Latest User Feedback: </span>
                <span>"{selectedUserForComparison.feedbackList[selectedUserForComparison.feedbackList.length - 1].feedback}"</span>
              </div>
            )}

            {/* Side-by-Side Comparison Container */}
            <div className="grid flex-1 grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-1 py-2">
              {/* Left: Original Plan */}
              <div className="rounded-xl border border-emerald-950 bg-[#07100c] p-4">
                <div className="mb-3 border-b border-emerald-950 pb-2">
                  <span className="rounded bg-gray-800 px-2 py-0.5 text-[10px] font-bold text-gray-300">
                    Original Generation
                  </span>
                  <h4 className="mt-1 font-bold text-white text-sm">
                    {selectedUserForComparison.originalPlan.planTitle}
                  </h4>
                  <p className="mt-1 text-[11px] text-gray-400 leading-relaxed">
                    {selectedUserForComparison.originalPlan.planSummary}
                  </p>
                </div>

                <div className="space-y-3">
                  {selectedUserForComparison.originalPlan.days.map((day, dIdx) => (
                    <div key={dIdx} className="rounded-lg border border-emerald-950/60 bg-[#0a1510] p-2.5 text-xs">
                      <div className="font-semibold text-emerald-400">{day.dayName || `Day ${day.day}`}: {day.title}</div>
                      <div className="text-[11px] text-gray-400">{day.focus}</div>
                      <div className="mt-1 text-[11px] text-gray-300">
                        {day.exercises?.slice(0, 3).map((e) => e.name).join(', ')}...
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Updated Plan */}
              <div className="rounded-xl border border-teal-900/60 bg-[#07100c] p-4">
                <div className="mb-3 border-b border-teal-950 pb-2">
                  <span className="rounded bg-teal-500/20 px-2 py-0.5 text-[10px] font-bold text-teal-300 border border-teal-500/30">
                    Updated Revision #{selectedUserForComparison.updatedPlan?.revision || 2}
                  </span>
                  <h4 className="mt-1 font-bold text-teal-200 text-sm">
                    {selectedUserForComparison.updatedPlan?.planTitle}
                  </h4>
                  <p className="mt-1 text-[11px] text-teal-300/80 leading-relaxed">
                    {selectedUserForComparison.updatedPlan?.planSummary}
                  </p>
                </div>

                <div className="space-y-3">
                  {selectedUserForComparison.updatedPlan?.days.map((day, dIdx) => (
                    <div key={dIdx} className="rounded-lg border border-teal-950/60 bg-[#081714] p-2.5 text-xs">
                      <div className="font-semibold text-teal-300">{day.dayName || `Day ${day.day}`}: {day.title}</div>
                      <div className="text-[11px] text-gray-400">{day.focus}</div>
                      <div className="mt-1 text-[11px] text-gray-300">
                        {day.exercises?.slice(0, 3).map((e) => e.name).join(', ')}...
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-4 flex items-center justify-between border-t border-emerald-950 pt-4">
              <button
                onClick={() => setSelectedUserForComparison(null)}
                className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-gray-700"
              >
                Close Comparison
              </button>

              <button
                onClick={() => {
                  const plan = selectedUserForComparison.updatedPlan || selectedUserForComparison.originalPlan;
                  onSelectUserPlan(selectedUserForComparison, plan);
                  setSelectedUserForComparison(null);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[#6ee7b7] px-4 py-2 text-xs font-bold text-gray-950 hover:bg-[#86efac]"
              >
                <span>Open Full Plan in Viewer</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
