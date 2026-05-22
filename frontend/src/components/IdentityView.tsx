import React, { useState, useEffect } from 'react';
import { User } from '../../../src/models/types';
import { IdentityProfile } from '../../../src/core/identity';
import { ShieldCheck, UserPlus, Fingerprint, Award } from 'lucide-react';
import api from '../api/client';

interface IdentityViewProps {
  currentUser: User | null;
  allUsers: User[];
  onAction: () => void;
}

export const IdentityView: React.FC<IdentityViewProps> = ({ currentUser, allUsers, onAction }) => {
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
                {profiles[currentUser.id].isVerified ? (
                  <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full flex items-center gap-2 border border-green-500/30">
                    <ShieldCheck size={20} />
                    <span className="font-black text-sm uppercase">Verified</span>
                  </div>
                ) : (
                  <div className="bg-amber-500/20 text-amber-400 px-4 py-2 rounded-full flex items-center gap-2 border border-amber-500/30">
                    <Fingerprint size={20} />
                    <span className="font-black text-sm uppercase">Pending</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-8">
                 <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                    <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] mb-2">Trust Score</p>
                    <p className="text-4xl font-black">{profiles[currentUser.id].verificationScore}%</p>
                    <div className="mt-4 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500" style={{ width: `${profiles[currentUser.id].verificationScore}%` }} />
                    </div>
                 </div>
                 <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                    <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] mb-2">Endorsements</p>
                    <p className="text-4xl font-black">{profiles[currentUser.id].endorsedBy.length}</p>
                    <div className="flex mt-3 -space-x-2">
                       {profiles[currentUser.id].endorsedBy.map((e, i) => (
                          <div key={i} className="w-6 h-6 rounded-full border border-slate-900 bg-slate-700 flex items-center justify-center text-[8px] font-black">{e[0]}</div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </section>
      )}

      {/* Citizens List */}
      <section>
        <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
           <UserPlus className="text-blue-600" />
           Citizen Registry
        </h3>
        <div className="grid gap-4">
          {allUsers.filter(u => u.id !== currentUser?.id).map((u) => (
            <div key={u.id} className="bg-white border rounded-2xl p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xl uppercase">
                     {u.name[0]}
                  </div>
                  <div>
                     <div className="flex items-center gap-2">
                        <h4 className="font-black text-slate-800">{u.name}</h4>
                        {profiles[u.id]?.isVerified && <ShieldCheck size={14} className="text-green-500" />}
                     </div>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Trust Score: {profiles[u.id]?.verificationScore || 0}%</p>
                  </div>
               </div>

               <button
                disabled={loading || profiles[u.id]?.endorsedBy.includes(currentUser?.id || '')}
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
