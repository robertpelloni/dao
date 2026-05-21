import React, { useState } from 'react';
import { Proposal, User } from '../../../src/models/types';
import { ThumbsUp, ThumbsDown, DollarSign, CheckCircle2, UserPlus } from 'lucide-react';
import api from '../api/client';

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

        {/* Crowdfunding Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold flex items-center gap-2 text-slate-800">
              <DollarSign size={18} className="text-emerald-500" />
              Crowdfunding
            </h4>
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
      </div>
    </div>
  );
};
