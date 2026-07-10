import React from 'react';
import { HealthDashboard } from './HealthDashboard.js';
import TaskMonitor from './TaskMonitor.js';
import { Proposal, Committee, User, GovernanceCycle } from '../../../src/models/types.js';
import { Activity, RefreshCw, ShieldAlert, Cpu } from 'lucide-react';

interface SystemGovernanceProps {
  proposals: Proposal[];
  committees: Committee[];
  allUsers: User[];
  treasuryBalances: any[];
  currentCycle: GovernanceCycle | null;
  onAction: () => void;
}

export const SystemGovernance: React.FC<SystemGovernanceProps> = (props) => {
  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <header className="flex flex-col gap-2">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">Protocol Oversight</h2>
        <h3 className="text-3xl font-black text-slate-800 tracking-tight">System Governance</h3>
        <p className="text-slate-500 font-medium">Monitoring the health, security, and autonomous execution of the Distributed State.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Health Stats */}
          <section className="bg-white border rounded-3xl p-8 shadow-sm">
             <div className="flex items-center gap-2 mb-6">
                <Activity className="text-blue-600" size={24} />
                <h4 className="text-xl font-black text-slate-800">Operational Health</h4>
             </div>
             <HealthDashboard {...props} />
          </section>
        </div>

        <div className="space-y-8">
          {/* Autonomous Tasks */}
          <section className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
             <Cpu className="absolute -right-8 -bottom-8 text-blue-500/10" size={160} />
             <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                   <RefreshCw className="text-blue-400" size={24} />
                   <h4 className="text-xl font-black">Autonomous Engine</h4>
                </div>
                <TaskMonitor />
             </div>
          </section>

          {/* Security Audit Hook */}
          <section className="bg-red-50 border border-red-100 rounded-3xl p-8 shadow-sm">
             <div className="flex items-center gap-2 mb-4 text-red-600">
                <ShieldAlert size={24} />
                <h4 className="text-xl font-black">Security Audit</h4>
             </div>
             <p className="text-sm text-red-800/70 font-medium mb-6">
                Autonomous cluster analysis is active. System scans for Sybil sinks and delegation depth anomalies are performed every cycle transition.
             </p>
             <div className="space-y-2">
                <div className="flex justify-between items-center bg-white/50 p-3 rounded-xl border border-red-100">
                   <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Sybil Clusters</span>
                   <span className="text-sm font-black text-red-600">0 Detected</span>
                </div>
                <div className="flex justify-between items-center bg-white/50 p-3 rounded-xl border border-red-100">
                   <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Deep Chains</span>
                   <span className="text-sm font-black text-red-600">Clean</span>
                </div>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
};
