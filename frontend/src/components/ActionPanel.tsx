import React, { useState } from 'react';
import { Proposal, User } from '../../../src/models/types.js';
import { ThumbsUp, ThumbsDown, DollarSign, CheckCircle2, UserPlus, Info } from 'lucide-react';
import api from '../api/client.js';

interface ActionPanelProps {
  proposal: Proposal;
  user: User | null;
  onAction: () => void;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({ proposal, user, onAction }) => {
  const [voteCount, setVoteCount] = useState(1);
  const [contribution, setContribution] = useState(10);
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleVote = async (isFor: boolean) => {
    try {
      setLoading(true);
      await api.post(`/proposals/${proposal.id}/vote`, {
        userId: user.id,
        votes: isFor ? voteCount : -voteCount,
        subject: proposal.committeeId // Simplified
      });
      onAction();
    } catch (err) {
      alert('Voting failed: ' + (err as any).response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  const handleContribute = async () => {
    try {
      setLoading(true);
      await api.post(`/proposals/${proposal.id}/contribute`, {
        userId: user.id,
        amount: contribution
      });
      onAction();
    } catch (err) {
      alert('Contribution failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    try {
      setLoading(true);
      await api.post(`/proposals/${proposal.id}/finalize-funding`);
      onAction();
    } catch (err) {
      alert('Finalization failed');
    } finally {
      setLoading(false);
    }
  };

  const handleJuryVote = async (milestoneId: string) => {
    try {
      setLoading(true);
      await api.post(`/proposals/${proposal.id}/milestones/${milestoneId}/jury-vote`, {
        userId: user.id
      });
      onAction();
    } catch (err) {
      alert('Jury vote failed: ' + (err as any).response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  const showJurySection = proposal.status === 'FUNDED' || proposal.status === 'IN_PROGRESS';

  return (
    <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6 border-b bg-gray-50">
        <h3 className="font-black uppercase text-xs tracking-widest text-gray-500">Governance Actions</h3>
      </div>

      <div className="p-6 space-y-8">
        {/* Voting Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold flex items-center gap-2 text-slate-800">
              <CheckCircle2 size={18} className="text-blue-500" />
              Quadratic Voting
            </h4>
            <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded">
              Cost: {voteCount * voteCount} credits
            </span>
          </div>
          <div className="flex gap-2 mb-4">
            <input
              type="number"
              min="1"
              value={voteCount}
              onChange={(e) => setVoteCount(parseInt(e.target.value) || 1)}
              className="flex-1 border rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              disabled={loading}
              onClick={() => handleVote(true)}
              className="flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-2.5 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <ThumbsUp size={18} /> Support
            </button>
            <button
              disabled={loading}
              onClick={() => handleVote(false)}
              className="flex items-center justify-center gap-2 bg-red-600 text-white font-bold py-2.5 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <ThumbsDown size={18} /> Oppose
            </button>
          </div>
        </section>

        {/* AI Impact Scoring */}
        <section className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
             <h4 className="font-bold flex items-center gap-2 text-slate-800">
               <CheckCircle2 size={18} className="text-blue-500" />
               Impact Analysis
             </h4>
             <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded">AI Heuristic</span>
          </div>
          <p className="text-xs text-slate-500 mb-4 font-medium italic">Current Impact Score: <span className="font-black text-slate-800">{proposal.impactScore ?? 'Pending'}</span></p>
          <button
            disabled={loading}
            onClick={async () => {
               setLoading(true);
               try {
                 await api.post(`/proposals/${proposal.id}/score`);
                 onAction();
               } catch (err) {
                 alert('Scoring failed');
               } finally {
                 setLoading(false);
               }
            }}
            className="w-full bg-slate-100 text-slate-600 font-bold py-2.5 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50 text-sm"
          >
            Recalculate Impact Score
          </button>
        </section>

        {/* Crowdfunding Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold flex items-center gap-2 text-slate-800">
              <DollarSign size={18} className="text-emerald-500" />
              Crowdfunding
            </h4>
            <div className="group relative">
               <Info size={14} className="text-slate-300 cursor-help" />
               <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  Quadratic Funding Matching is active. Your contribution will be amplified.
               </div>
            </div>
          </div>
          <div className="flex gap-2 mb-4">
            <input
              type="number"
              min="1"
              value={contribution}
              onChange={(e) => setContribution(parseInt(e.target.value) || 1)}
              className="flex-1 border rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <button
            disabled={loading}
            onClick={handleContribute}
            className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            Contribute Funds
          </button>
        </section>

        {proposal.status === 'ACTIVE_VOTING' && (
           <button
            onClick={handleFinalize}
            className="w-full border-2 border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest py-3 rounded-xl hover:bg-slate-50 transition-colors"
           >
             Finalize Voting Period
           </button>
        )}

        {showJurySection && (
          <section className="border-t pt-6">
            <h4 className="font-bold flex items-center gap-2 text-slate-800 mb-4">
              <UserPlus size={18} className="text-indigo-500" />
              Jury Verification
            </h4>
            <div className="space-y-3">
              {proposal.milestones.filter(m => !m.isCompleted).map(m => (
                <div key={m.id} className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                  <p className="text-sm font-bold text-indigo-900">{m.description}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[10px] font-black uppercase text-indigo-400">
                      Votes: {(m as any).juryVotes?.length || 0} / {(m as any).requiredJuryQuorum || 1}
                    </span>
                    <button
                      disabled={loading || (m as any).juryVotes?.includes(user.id)}
                      onClick={() => handleJuryVote(m.id)}
                      className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {(m as any).juryVotes?.includes(user.id) ? 'Voted' : 'Verify'}
                    </button>
                  </div>
                </div>
              ))}
              {proposal.milestones.every(m => m.isCompleted) && (
                <p className="text-xs text-center text-slate-400 font-medium italic">All milestones verified.</p>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
