import React, { useState } from 'react';
import { Proposal, Milestone } from '../../../src/models/types.js';
import { Send, Plus, X, Award, BrainCircuit, AlertTriangle } from 'lucide-react';
import api from '../api/client.js';

interface ProposalFormProps {
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ProposalForm: React.FC<ProposalFormProps> = ({ userId, onSuccess, onCancel }) => {
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [specs, setSpecs] = useState('');
  const [committeeId, setCommitteeId] = useState('Infrastructure-Committee');
  const [milestones, setMilestones] = useState<Partial<Milestone>[]>([
    { description: '', targetBudget: 0, isCompleted: false }
  ]);
  const [loading, setLoading] = useState(false);
  const [triaging, setTriaging] = useState(false);
  const [redundancyWarning, setRedundancyWarning] = useState<string | null>(null);

  const handleTriage = async () => {
    if (!title || !abstract) return;
    setTriaging(true);
    setRedundancyWarning(null);
    try {
      const res = await api.post('/proposals/triage', { title, abstract });
      if (res.data.suggestedCommittee) {
        setCommitteeId(res.data.suggestedCommittee.id);
      }
      if (res.data.isRedundant) {
        setRedundancyWarning(res.data.message);
      }
    } catch (err) {
      console.error('Triage failed', err);
    } finally {
      setTriaging(false);
    }
  };

  const addMilestone = () => {
    setMilestones([...milestones, { description: '', targetBudget: 0, isCompleted: false }]);
  };

  const removeMilestone = (idx: number) => {
    setMilestones(milestones.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const budget = milestones.reduce((acc, m) => acc + (m.targetBudget || 0), 0);
      const proposal: Partial<Proposal> = {
        id: `prop-${Date.now()}`,
        title,
        abstract,
        detailedSpecs: specs,
        proposerId: userId,
        committeeId,
        totalTargetBudget: budget,
        milestones: milestones.map((m, i) => ({
          ...m,
          id: `m-${i}`,
          description: m.description || '',
          targetBudget: m.targetBudget || 0,
          isCompleted: false,
          juryVotes: [],
          requiredJuryQuorum: 3
        })) as Milestone[],
        executionPayload: '{}'
      };

      await api.post('/proposals', proposal);
      onSuccess();
    } catch (err) {
      alert('Failed to create proposal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-3xl p-8 shadow-sm space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex justify-between items-center border-b pb-6">
         <h3 className="text-2xl font-black text-slate-800">Create New Proposal</h3>
         <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
         </button>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Proposal Title</label>
            <input
              required
              className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl px-6 py-4 outline-none font-bold transition-all"
              placeholder="e.g. Solar panels for public school"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Committee</label>
              <button
                type="button"
                disabled={triaging || !title || !abstract}
                onClick={handleTriage}
                className="text-indigo-600 hover:text-indigo-700 font-black text-[10px] uppercase flex items-center gap-1 disabled:opacity-30 transition-all"
              >
                <BrainCircuit size={14} /> {triaging ? 'Thinking...' : 'AI Suggest'}
              </button>
            </div>
            <select
              className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl px-6 py-4 outline-none font-bold transition-all appearance-none"
              value={committeeId}
              onChange={(e) => setCommitteeId(e.target.value)}
            >
              <option value="Infrastructure-Committee">Infrastructure</option>
              <option value="Education-Committee">Education</option>
              <option value="Healthcare-Committee">Healthcare</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Abstract Summary</label>
            {redundancyWarning && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-amber-800 text-xs font-bold animate-pulse">
                <AlertTriangle size={16} className="shrink-0" />
                {redundancyWarning}
              </div>
            )}
            <textarea
              required
              rows={4}
              className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl px-6 py-4 outline-none font-medium transition-all resize-none"
              placeholder="Briefly describe the goal..."
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Budget Milestones</label>
            <button
              type="button"
              onClick={addMilestone}
              className="text-blue-600 hover:text-blue-700 font-black text-[10px] uppercase flex items-center gap-1"
            >
              <Plus size={14} /> Add Milestone
            </button>
          </div>

          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            {milestones.map((m, idx) => (
              <div key={idx} className="bg-gray-50 p-6 rounded-2xl space-y-4 relative group border-2 border-transparent hover:border-blue-100 transition-all">
                {milestones.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMilestone(idx)}
                    className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
                <input
                  required
                  className="w-full bg-white rounded-xl px-4 py-3 outline-none font-bold text-sm"
                  placeholder="Milestone description"
                  value={m.description}
                  onChange={(e) => {
                    const newM = [...milestones];
                    newM[idx]!.description = e.target.value;
                    setMilestones(newM);
                  }}
                />
                <div className="flex items-center gap-3">
                   <div className="bg-white rounded-xl px-4 py-3 flex items-center gap-2 flex-1">
                      <span className="text-slate-400 font-bold">$</span>
                      <input
                        required
                        type="number"
                        className="w-full outline-none font-bold text-sm"
                        placeholder="Budget"
                        value={m.targetBudget || ''}
                        onChange={(e) => {
                          const newM = [...milestones];
                          newM[idx]!.targetBudget = parseInt(e.target.value) || 0;
                          setMilestones(newM);
                        }}
                      />
                   </div>
                   <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xs">
                      {idx + 1}
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-8 border-t flex justify-end items-center gap-4">
         <div className="mr-auto">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Requested</p>
            <p className="text-2xl font-black text-slate-800">
               ${milestones.reduce((acc, m) => acc + (m.targetBudget || 0), 0).toLocaleString()}
            </p>
         </div>
         <button
           type="button"
           onClick={onCancel}
           className="px-8 py-4 rounded-2xl font-black text-sm text-slate-400 hover:text-slate-600 transition-all"
         >
           Discard
         </button>
         <button
           disabled={loading}
           className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center gap-2 disabled:opacity-50"
         >
           <Send size={18} />
           Submit Proposal
         </button>
      </div>
    </form>
  );
};
