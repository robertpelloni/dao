import React, { useState } from 'react';
import { Milestone } from '../../../src/models/types';
import { Plus, Trash2, Send } from 'lucide-react';
import api from '../api/client';

interface ProposalFormProps {
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ProposalForm: React.FC<ProposalFormProps> = ({ userId, onSuccess, onCancel }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    id: `prop-${Date.now()}`,
    title: '',
    abstract: '',
    detailedSpecs: '',
    committeeId: 'comm-infra',
    totalTargetBudget: 0,
  });

  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: 'm1', description: '', targetBudget: 0, isCompleted: false }
  ]);

  const addMilestone = () => {
    setMilestones([...milestones, { id: `m${milestones.length + 1}`, description: '', targetBudget: 0, isCompleted: false }]);
  };

  const removeMilestone = (idx: number) => {
    setMilestones(milestones.filter((_, i) => i !== idx));
  };

  const updateMilestone = (idx: number, updates: Partial<Milestone>) => {
    const next = [...milestones];
    next[idx] = { ...next[idx], ...updates };
    setMilestones(next);
  };

  const handleSubmit = async () => {
    try {
      const totalBudget = milestones.reduce((acc, m) => acc + m.targetBudget, 0);
      await api.post('/proposals', {
        ...formData,
        proposerId: userId,
        milestones,
        totalTargetBudget: totalBudget
      });
      // Trigger AI Scoring immediately
      await api.post(`/proposals/${formData.id}/score`);
      onSuccess();
    } catch (err) {
      alert('Failed to create proposal');
    }
  };

  return (
    <div className="bg-white border rounded-2xl p-8 max-w-2xl mx-auto shadow-xl">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h2 className="text-2xl font-black text-slate-800">Create New Proposal</h2>
           <p className="text-gray-500 text-sm">Step {step} of 2</p>
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 font-bold">Cancel</button>
      </div>

      {step === 1 ? (
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-colors"
              placeholder="e.g., Solar Panel Installation"
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Abstract</label>
            <textarea
              value={formData.abstract}
              onChange={(e) => setFormData({...formData, abstract: e.target.value})}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-blue-500 outline-none h-24"
              placeholder="Short summary of the goal..."
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Detailed Specifications</label>
            <textarea
              value={formData.detailedSpecs}
              onChange={(e) => setFormData({...formData, detailedSpecs: e.target.value})}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-blue-500 outline-none h-48"
              placeholder="Technical details, requirements, etc..."
            />
          </div>
          <button
            onClick={() => setStep(2)}
            disabled={!formData.title || !formData.abstract}
            className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            Next: Milestones & Budget
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-4">
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Milestones</label>
            {milestones.map((m, idx) => (
              <div key={m.id} className="flex gap-3 items-start bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex-1 space-y-3">
                  <input
                    type="text"
                    value={m.description}
                    onChange={(e) => updateMilestone(idx, { description: e.target.value })}
                    className="w-full bg-white border rounded-lg px-3 py-2 text-sm"
                    placeholder="Milestone description"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-bold">$</span>
                    <input
                      type="number"
                      value={m.targetBudget}
                      onChange={(e) => updateMilestone(idx, { targetBudget: parseInt(e.target.value) || 0 })}
                      className="w-32 bg-white border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <button onClick={() => removeMilestone(idx)} className="text-red-400 p-2 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            <button
              onClick={addMilestone}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 flex items-center justify-center gap-2 text-gray-400 font-bold hover:bg-gray-50 transition-colors"
            >
              <Plus size={18} /> Add Milestone
            </button>
          </div>

          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex justify-between items-center">
            <span className="font-black text-blue-900 uppercase text-xs tracking-widest">Total Budget</span>
            <span className="text-2xl font-black text-blue-600">${milestones.reduce((acc, m) => acc + m.targetBudget, 0)}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setStep(1)}
              className="w-full bg-gray-100 text-gray-600 font-black py-4 rounded-2xl hover:bg-gray-200 transition-all"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
              <Send size={18} /> Submit Proposal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
