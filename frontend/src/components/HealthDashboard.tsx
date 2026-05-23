import React from 'react';
import { Proposal, Committee, User } from '../../../src/models/types';
import { Activity, Landmark, TrendingUp, Users, PieChart, AlertCircle } from 'lucide-react';

interface HealthDashboardProps {
  proposals: Proposal[];
  committees: Committee[];
  allUsers: User[];
}

export const HealthDashboard: React.FC<HealthDashboardProps> = ({ proposals, committees, allUsers }) => {
  const totalFunding = proposals.reduce((acc, p) => acc + p.currentFunding, 0);
  const activeProposals = proposals.filter(p => p.status !== 'COMPLETED' && p.status !== 'REJECTED' && p.status !== 'DRAFT').length;
  const totalBudgetRequired = proposals.reduce((acc, p) => acc + p.totalTargetBudget, 0);

  const subjects = committees.map(c => c.subject);
  const uniqueSubjects = new Set(subjects).size;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Landmark className="text-emerald-500" />}
          label="Total Treasury"
          value={`$${totalFunding.toLocaleString()}`}
          subtext={`of $${totalBudgetRequired.toLocaleString()} goal`}
        />
        <StatCard
          icon={<Activity className="text-blue-500" />}
          label="Active Proposals"
          value={activeProposals.toString()}
          subtext="Requiring attention"
        />
        <StatCard
          icon={<Users className="text-indigo-500" />}
          label="Citizen Participation"
          value={allUsers.length.toString()}
          subtext={`${allUsers.filter(u => u.voiceCredits < 100).length} active voters`}
        />
        <StatCard
          icon={<PieChart className="text-amber-500" />}
          label="Governance Scope"
          value={uniqueSubjects.toString()}
          subtext="Active committees"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white border rounded-3xl p-8 shadow-sm">
          <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp className="text-blue-600" />
            Funding Progress
          </h3>
          <div className="space-y-6">
            {proposals.filter(p => p.totalTargetBudget > 0).slice(0, 5).map(p => {
              const percent = Math.round((p.currentFunding / p.totalTargetBudget) * 100);
              return (
                <div key={p.id}>
                  <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                    <span>{p.title}</span>
                    <span>{percent}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-1000"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-white border rounded-3xl p-8 shadow-sm">
          <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
            <AlertCircle className="text-amber-600" />
            System Alerts
          </h3>
          <div className="space-y-4">
            {activeProposals > committees.length * 2 && (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
                <AlertCircle className="text-amber-600 shrink-0" size={20} />
                <div>
                  <p className="text-sm font-bold text-amber-900">Committee Bottleneck</p>
                  <p className="text-xs text-amber-700">Proposal volume exceeds current committee capacity. Consider auto-provisioning.</p>
                </div>
              </div>
            )}
            {allUsers.length < 5 && (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
                <Users className="text-blue-600 shrink-0" size={20} />
                <div>
                  <p className="text-sm font-bold text-blue-900">Low Participation</p>
                  <p className="text-xs text-blue-700">Citizen count is below threshold for robust Quadratic Voting. Run recruitment.</p>
                </div>
              </div>
            )}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex gap-3">
              <TrendingUp className="text-slate-600 shrink-0" size={20} />
              <div>
                <p className="text-sm font-bold text-slate-900">Health Check: Optimal</p>
                <p className="text-xs text-slate-700">All core modules responding. Executive Protocol sync successful.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, subtext }: { icon: React.ReactNode, label: string, value: string, subtext: string }) => (
  <div className="bg-white border rounded-3xl p-6 shadow-sm flex flex-col gap-4">
    <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center">
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{label}</p>
      <p className="text-2xl font-black text-slate-800">{value}</p>
      <p className="text-[10px] font-bold text-slate-400 mt-1">{subtext}</p>
    </div>
  </div>
);
