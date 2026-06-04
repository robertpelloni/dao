import React, { useState, useEffect } from 'react';
import { User, Committee } from '../../../src/models/types.js';
import { IdentityProfile } from '../../../src/core/identity.js';
import { ShieldCheck, UserPlus, Fingerprint, Award, GitGraph, Users, UserCheck, Key } from 'lucide-react';
import api from '../api/client.js';
import { DelegationGraph } from './DelegationGraph.js';

interface IdentityViewProps {
  currentUser: User | null;
  allUsers: User[];
  powerBreakdown: Record<string, number>;
  suggestedCommittees: Committee[];
  onAction: () => void;
}

export const IdentityView: React.FC<IdentityViewProps> = ({ currentUser, allUsers, powerBreakdown, suggestedCommittees, onAction }) => {
  const [profiles, setProfiles] = useState<Record<string, IdentityProfile>>({});
  const [loading, setLoading] = useState(false);

  const fetchProfiles = async () => {
    try {
      const results = await Promise.all(allUsers.map(u => api.get(`/identity/${u.id}`)));
      const profileMap: Record<string, IdentityProfile> = {};
      results.forEach(r => {
        if (r.data) profileMap[r.data.userId] = r.data;
      });
      setProfiles(profileMap);
    } catch (err) {
      console.error('Failed to fetch identity profiles', err);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [allUsers]);

  const handleVerifyZKP = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      // In a real app, this would involve generating a Semaphore proof on the client.
      // Here we simulate the successful verification via API.
      await api.post(`/identity/${currentUser.id}/verify-human`, { method: 'ZKP' });
      await fetchProfiles();
      onAction();
    } catch (err) {
      alert('ZKP Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEndorse = async (targetId: string) => {
    if (!currentUser) return;
    try {
      setLoading(true);
      await api.post(`/users/${targetId}/endorse`, { endorserId: currentUser.id });
      await fetchProfiles();
      onAction();
    } catch (err) {
      alert('Endorsement failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Current User Profile Card */}
      {currentUser && profiles[currentUser.id] && (
        <section className="bg-slate-900 text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden">
           <Fingerprint className="absolute -right-8 -bottom-8 text-slate-800 opacity-50" size={240} />
           <div className="relative z-10">
              <div className="flex justify-between items-start mb-12">
                <div>
                   <h3 className="text-3xl font-black tracking-tight">{currentUser.name}</h3>
                   <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mt-1">Global Citizen ID: {currentUser.id}</p>
                </div>
                <div className="flex gap-2">
                  {profiles[currentUser.id]!.isHuman && (
                    <div className="bg-indigo-500/20 text-indigo-400 px-4 py-2 rounded-full flex items-center gap-2 border border-indigo-500/30">
                      <UserCheck size={20} />
                      <span className="font-black text-sm uppercase">Human</span>
                    </div>
                  )}
                  {profiles[currentUser.id]!.isVerified ? (
                    <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full flex items-center gap-2 border border-green-500/30">
                      <ShieldCheck size={20} />
                      <span className="font-black text-sm uppercase">Citizen</span>
                    </div>
                  ) : (
                    <div className="bg-amber-500/20 text-amber-400 px-4 py-2 rounded-full flex items-center gap-2 border border-amber-500/30">
                      <Fingerprint size={20} />
                      <span className="font-black text-sm uppercase">Resident</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-8">
                 <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                    <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] mb-2">Trust Score</p>
                    <p className="text-4xl font-black">{profiles[currentUser.id]!.verificationScore}%</p>
                    <div className="mt-4 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500" style={{ width: `${profiles[currentUser.id]!.verificationScore}%` }} />
                    </div>
                 </div>
                 <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                    <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] mb-2">Endorsements</p>
                    <p className="text-4xl font-black">{profiles[currentUser.id]!.endorsedBy.length}</p>
                    <div className="flex mt-3 -space-x-2">
                       {profiles[currentUser.id]!.endorsedBy.map((e: any, i: number) => (
                          <div key={i} className="w-6 h-6 rounded-full border border-slate-900 bg-slate-700 flex items-center justify-center text-[8px] font-black">{e[0]}</div>
                       ))}
                    </div>
                 </div>
                 <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                    <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] mb-2">Voting Subjects</p>
                    <p className="text-4xl font-black">{Object.keys(powerBreakdown).length}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                       {Object.keys(powerBreakdown).slice(0, 3).map((s, i) => (
                          <span key={i} className="text-[8px] font-black uppercase bg-white/10 px-2 py-1 rounded-md">{s}</span>
                       ))}
                    </div>
                 </div>
              </div>

              {!profiles[currentUser.id]!.isHuman && (
                <div className="mt-8 pt-8 border-t border-white/10">
                  <button
                    onClick={handleVerifyZKP}
                    disabled={loading}
                    className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 transition-all font-black text-sm uppercase tracking-widest disabled:opacity-50"
                  >
                    <Key size={18} />
                    {loading ? 'Verifying...' : 'Verify Human Identity (ZKP)'}
                  </button>
                  <p className="text-[10px] text-slate-500 font-bold mt-3 uppercase tracking-wider">
                    Privacy-preserving proof of humanity using Semaphore.
                  </p>
                </div>
              )}
           </div>
        </section>
      )}

      {/* Suggested Committees */}
      {suggestedCommittees.length > 0 && (
        <section className="bg-blue-600 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden">
           <Users className="absolute -right-8 -bottom-8 text-white/10" size={200} />
           <div className="relative z-10">
              <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                 <Users size={24} />
                 Suggested Committees
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {suggestedCommittees.map(c => (
                    <div key={c.id} className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl hover:bg-white/20 transition-all cursor-pointer">
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 mb-1">{c.subject}</p>
                       <h4 className="font-bold text-sm">{c.id}</h4>
                       <div className="flex justify-between items-center mt-3">
                          <span className="text-[10px] font-black">{c.members.length} Members</span>
                          <span className="text-[10px] font-black bg-white text-blue-600 px-2 py-0.5 rounded">Join</span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </section>
      )}

      {/* Power Breakdown Table */}
      <section className="bg-white border rounded-3xl p-8 shadow-sm">
        <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
           <ShieldCheck className="text-blue-600" />
           Liquid Power Breakdown
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(powerBreakdown).map(([subject, power]) => (
            <div key={subject} className="p-4 rounded-2xl border bg-gray-50/50 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{subject}</p>
                <p className="text-xl font-black text-slate-800">{power}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <GitGraph size={20} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Delegation Graph */}
      <section>
        <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
           <GitGraph className="text-blue-600" />
           Voting Power Delegation flow
        </h3>
        <DelegationGraph users={allUsers} subject="Roads" />
      </section>

      {/* Citizens List */}
      <section>
        <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
           <UserPlus className="text-blue-600" />
           Citizen Registry
        </h3>
        <div className="grid gap-4">
          {allUsers.filter((u: User) => u.id !== currentUser?.id).map((u: User) => (
            <div key={u.id} className="bg-white border rounded-2xl p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xl uppercase">
                     {u.name[0]}
                  </div>
                  <div>
                     <div className="flex items-center gap-2">
                        <h4 className="font-black text-slate-800">{u.name}</h4>
                        {profiles[u.id]?.isVerified && <ShieldCheck size={14} className="text-green-500" />}
                        {profiles[u.id]?.isHuman && <UserCheck size={14} className="text-indigo-500" />}
                     </div>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        Trust Score: {profiles[u.id]?.verificationScore || 0}%
                        {profiles[u.id]?.isHuman && ` • ${profiles[u.id]?.pohMethod} PoH`}
                     </p>
                  </div>
               </div>

               <button
                disabled={loading || (profiles[u.id]?.endorsedBy.includes(currentUser?.id || '') ?? false)}
                onClick={() => handleEndorse(u.id)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest bg-white border-2 border-slate-100 text-slate-600 hover:border-blue-600 hover:text-blue-600 transition-all disabled:opacity-30 disabled:hover:border-slate-100 disabled:hover:text-slate-600"
               >
                  <Award size={16} />
                  {profiles[u.id]?.endorsedBy.includes(currentUser?.id || '') ? 'Endorsed' : 'Endorse'}
               </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
