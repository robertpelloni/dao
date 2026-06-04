import React, { useState } from 'react';
import { Proposal, Committee, User, GovernanceCycle } from '../../../src/models/types.js';
import { Activity, Landmark, TrendingUp, Users, PieChart, AlertCircle, FastForward, Clock, Coins } from 'lucide-react';
import api from '../api/client.js';
import { CycleTrends } from './CycleTrends.js';

interface HealthDashboardProps {
  proposals: Proposal[];
  committees: Committee[];
  allUsers: User[];
  currentCycle: GovernanceCycle | null;
  onAction: () => void;
}

export const HealthDashboard: React.FC<HealthDashboardProps> = ({ proposals, committees, allUsers, currentCycle, onAction }) => {
  const [loading, setLoading] = useState(false);
  const totalFunding = proposals.reduce((acc, p) => acc + p.currentFunding, 0);
  const activeProposals = proposals.filter(p => p.status !== 'COMPLETED' && p.status !== 'REJECTED' && p.status !== 'DRAFT').length;
  const totalBudgetRequired = proposals.reduce((acc, p) => acc + p.totalTargetBudget, 0);

  const subjects = committees.map(c => c.subject);
  const uniqueSubjects = new Set(subjects).size;

  const handleTransition = async () => {
    if (!confirm('Are you sure you want to transition to the next governance cycle? This will trigger reputation decay.')) return;
    try {
      setLoading(true);
      await api.post('/governance/transition-cycle');
      onAction();
    } catch (err) {
      alert('Transition failed');
    } finally {
      setLoading(false);
    }
  };

  const timeLeft = currentCycle ? Math.max(0, currentCycle.endTime - Date.now()) : 0;
  const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Cycle Control Card */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden">
         <Clock className="absolute -right-8 -bottom-8 text-white/10" size={240} />
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div>
               <div className="flex items-center gap-2 mb-2">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">Active Cycle</span>
                  <span className="text-blue-200 text-xs font-bold uppercase tracking-widest italic">• Epoch {currentCycle?.number}</span>
               </div>
               <h3 className="text-4xl font-black tracking-tight">Phase {currentCycle?.number}: Expansion</h3>
               <p className="text-blue-100 mt-2 font-medium max-w-xl text-sm leading-relaxed opacity-80">
                  The current governance epoch is scheduled to conclude in {daysLeft} days. All reputation scores will decay by 10% to ensure active expertise remains current.
               </p>
            </div>
            <button
              disabled={loading}
              onClick={handleTransition}
              className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-black text-sm hover:bg-blue-50 transition-all shadow-xl flex items-center gap-3 shrink-0 group"
            >
               <FastForward size={18} className="group-hover:translate-x-1 transition-transform" />
               End Current Cycle
            </button>
         </div>
      </section>

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
        <CycleTrends />

        <section className="bg-slate-900 text-white border rounded-3xl p-8 shadow-xl relative overflow-hidden">
          <Coins className="absolute -right-8 -bottom-8 text-blue-500/10" size={200} />
          <div className="relative z-10">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
              <Landmark className="text-blue-400" />
              Matching Pool Status
            </h3>
            <div className="space-y-6">
               <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Available Matching Funds</p>
                  <p className="text-4xl font-black text-blue-400">$25,000</p>
               </div>
               <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-xs font-bold text-slate-300 leading-relaxed italic">
                    "Quadratic Funding matches individual contributions, amplifying the reach of projects supported by a broad base of citizens."
                  </p>
               </div>
               <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <span>Pool Utilization</span>
                    <span>42%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]" style={{ width: '42%' }} />
                  </div>
               </div>
            </div>
          </div>
        </section>

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
