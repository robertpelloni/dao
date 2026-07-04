import React, { useState } from 'react';
import { Proposal, User } from '../../../src/models/types.js';
import { ThumbsUp, ThumbsDown, DollarSign, CheckCircle2, UserPlus, Info, ExternalLink, Fingerprint } from 'lucide-react';
import api from '../api/client.js';

interface ActionPanelProps {
  proposal: Proposal;
  user: User | null;
  onAction: () => void;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({ proposal, user, onAction }) => {
  const [voteCount, setVoteCount] = useState(1);
  const [contribution, setContribution] = useState(10);
  const [isBlinded, setIsBlinded] = useState(false);
  const [matchEstimate, setMatchEstimate] = useState<{ delta: number, multiplier: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [proofUrls, setProofUrls] = useState<Record<string, string>>({});

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

  const handleProofSubmit = async (milestoneId: string) => {
    try {
      setLoading(true);

      // If URL looks like a CID or special instruction, we could handle it here.
      // For now, we allow the backend to handle the evidenceData if we were to add a file upload.
      // Simulation: prefix with ipfs:// if it looks like a CID
      const input = proofUrls[milestoneId];
      const finalUrl = (input.startsWith('Qm') && input.length > 40) ? `ipfs://${input}` : input;

      await api.post(`/proposals/${proposal.id}/milestones/${milestoneId}/proof`, {
        proofUrl: finalUrl
      });
      setProofUrls({ ...proofUrls, [milestoneId]: '' });
      onAction();
    } catch (err) {
      alert('Proof submission failed: ' + (err as any).response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEstimate = async (amount: number) => {
    try {
      const res = await api.get(`/proposals/${proposal.id}/estimate-match?amount=${amount}&userId=${user?.id}`);
      setMatchEstimate({ delta: res.data.delta, multiplier: res.data.multiplier });
    } catch (err) {
      console.error('Failed to fetch estimate', err);
    }
  };

  React.useEffect(() => {
    if (contribution > 0 && user) {
      const timer = setTimeout(() => fetchEstimate(contribution), 500);
      return () => clearTimeout(timer);
    } else {
      setMatchEstimate(null);
    }
  }, [contribution, user]);

  const handleContribute = async () => {
    try {
      setLoading(true);
      await api.post(`/proposals/${proposal.id}/contribute`, {
        userId: user.id,
        amount: contribution,
        isBlinded
      });
      setMatchEstimate(null);
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

  const handleJuryVote = async (milestoneId: string, action: 'APPROVE' | 'REJECT' = 'APPROVE') => {
    try {
      setLoading(true);
      await api.post(`/proposals/${proposal.id}/milestones/${milestoneId}/jury-vote`, {
        userId: user.id,
        action
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
            <h4 className="font-bold flex items-center gap-2 text-slate-800">
              <CheckCircle2 size={18} className="text-blue-500" />
              Quadratic Voting
            </h4>
            <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded">
              Cost: {voteCount * voteCount} credits
            </span>
          </div>
          <div className="flex gap-2 mb-2">
            <input
              type="number"
              min="1"
              value={voteCount}
              onChange={(e) => setVoteCount(parseInt(e.target.value) || 1)}
              className="flex-1 border rounded-xl px-4 py-3 sm:py-2 text-lg sm:text-base focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              disabled={loading}
              onClick={() => handleVote(true)}
              className="flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-4 sm:py-2.5 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 text-lg sm:text-base"
            >
              <ThumbsUp size={18} /> Support
            </button>
            <button
              disabled={loading}
              onClick={() => handleVote(false)}
              className="flex items-center justify-center gap-2 bg-red-600 text-white font-bold py-4 sm:py-2.5 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 text-lg sm:text-base"
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
              className="flex-1 border rounded-xl px-4 py-3 sm:py-2 text-lg sm:text-base focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          {matchEstimate && (
            <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
               <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">
                     <span>QF Amplification</span>
                     <span className="bg-emerald-600 text-white px-1.5 py-0.5 rounded">{matchEstimate.multiplier.toFixed(1)}x Impact</span>
                  </div>
                  <p className="text-xs font-bold text-emerald-800">
                     Your ${contribution} will trigger an additional <span className="text-emerald-600">${Math.round(matchEstimate.delta)}</span> in matching funds.
                  </p>
               </div>
            </div>
          )}
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="blinded"
              checked={isBlinded}
              onChange={(e) => setIsBlinded(e.target.checked)}
              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
            />
            <label htmlFor="blinded" className="text-xs font-bold text-slate-600 uppercase tracking-tighter cursor-pointer">
              Privacy-Preserving (MACI-lite)
            </label>
          </div>

          <button
            disabled={loading}
            onClick={handleContribute}
            className="w-full bg-emerald-600 text-white font-bold py-4 sm:py-2.5 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 text-lg sm:text-base"
          >
            {isBlinded ? 'Contribute Privately' : 'Contribute Funds'}
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
                <div key={m.id} className={`p-3 rounded-xl border ${m.isDisputed ? 'bg-red-50 border-red-100' : 'bg-indigo-50 border-indigo-100'}`}>
                  <div className="flex justify-between items-start">
                    <p className={`text-sm font-bold ${m.isDisputed ? 'text-red-900' : 'text-indigo-900'}`}>{m.description}</p>
                    {m.isDisputed && (
                      <span className="bg-red-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded animate-pulse">Disputed</span>
                    )}
                  </div>

                  {m.completionProof && (
                    <div className="mt-2 p-2 bg-white rounded border border-indigo-200 shadow-sm space-y-2">
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] text-indigo-400 font-black uppercase tracking-tight">Proof Submitted</span>
                          {m.completionProof.startsWith('ipfs://') ? (
                             <button
                                onClick={async () => {
                                   const cid = m.completionProof?.replace('ipfs://', '');
                                   try {
                                      const res = await api.get(`/storage/${cid}`);
                                      alert(JSON.stringify(res.data, null, 2));
                                   } catch (e) { alert('Failed to fetch IPFS evidence'); }
                                }}
                                className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-[10px] font-black underline decoration-indigo-300 decoration-2 underline-offset-2"
                             >
                                Inspect Data <Fingerprint size={10} />
                             </button>
                          ) : (
                             <a
                              href={m.completionProof}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-[10px] font-black underline decoration-indigo-300 decoration-2 underline-offset-2"
                             >
                                View Evidence <ExternalLink size={10} />
                             </a>
                          )}
                       </div>
                       {m.completionProof.startsWith('ipfs://') && (
                          <p className="text-[8px] font-mono text-slate-400 truncate">CID: {m.completionProof.replace('ipfs://', '')}</p>
                       )}
                    </div>
                  )}

                  {user.id === proposal.proposerId && !m.isCompleted && (
                    <div className="mt-3 space-y-2">
                       <div className="flex gap-2">
                          <input
                             type="text"
                             placeholder="Evidence URL (GitHub, PDF, etc)"
                             value={proofUrls[m.id] || ''}
                             onChange={(e) => setProofUrls({ ...proofUrls, [m.id]: e.target.value })}
                             className="flex-1 text-[10px] border border-indigo-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                          />
                          <button
                             disabled={loading || !proofUrls[m.id]}
                             onClick={() => handleProofSubmit(m.id)}
                             className="bg-indigo-600 text-white text-[10px] font-black uppercase px-3 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
                          >
                             Submit
                          </button>
                       </div>
                    </div>
                  )}

                  <div className="mt-2 flex flex-wrap gap-1">
                     {(m as any).assignedJury?.map((jid: string) => (
                        <span key={jid} className="text-[9px] font-bold bg-white text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100" title="Assigned Jury Member">
                           {jid}
                        </span>
                     ))}
                  </div>

                  <div className={`flex justify-between items-center mt-3 pt-2 border-t ${m.isDisputed ? 'border-red-100' : 'border-indigo-100/50'}`}>
                    <span className={`text-[10px] font-black uppercase ${m.isDisputed ? 'text-red-400' : 'text-indigo-400'}`}>
                      {m.isDisputed ? 'Resolution Pending' : `Quorum: ${(m as any).requiredJuryQuorum || 2}`}
                    </span>

                    <div className="flex gap-2">
                      {!m.isDisputed ? (
                        <>
                          <button
                            disabled={loading || !(m as any).assignedJury?.includes(user.id) || (m as any).juryVotes?.includes(user.id) || (m as any).rejectionVotes?.includes(user.id)}
                            onClick={() => handleJuryVote(m.id, 'APPROVE')}
                            className="text-[10px] px-2 py-1 rounded font-bold transition-all disabled:opacity-30 bg-indigo-600 text-white hover:bg-indigo-700"
                          >
                             Approve
                          </button>
                          <button
                            disabled={loading || !(m as any).assignedJury?.includes(user.id) || (m as any).juryVotes?.includes(user.id) || (m as any).rejectionVotes?.includes(user.id)}
                            onClick={() => handleJuryVote(m.id, 'REJECT')}
                            className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded font-bold hover:bg-red-200 transition-all disabled:opacity-30"
                          >
                             Reject
                          </button>
                        </>
                      ) : (
                        <button
                          disabled={loading}
                          onClick={async () => {
                             if(confirm('Resolve dispute by releasing funds? Proposer reputation will be partially restored.')) {
                                try {
                                   setLoading(true);
                                   await api.post(`/proposals/${proposal.id}/milestones/${m.id}/resolve-dispute`, { resolution: 'RELEASE' });
                                   onAction();
                                } catch (err) {
                                   alert('Resolution failed');
                                } finally {
                                   setLoading(false);
                                }
                             }
                          }}
                          className="text-[10px] bg-emerald-600 text-white px-2 py-1 rounded font-bold hover:bg-emerald-700 transition-all"
                        >
                           Resolve & Release
                        </button>
                      )}
                    </div>
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
