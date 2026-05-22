import React from 'react';
import { Proposal } from '../../../src/models/types';
import { BarChart3, Clock, DollarSign } from 'lucide-react';

interface ProposalListProps {
  proposals: Proposal[];
  onSelect: (id: string) => void;
}

export const ProposalList: React.FC<ProposalListProps> = ({ proposals, onSelect }) => {
  return (
    <div className="grid gap-4">
      {proposals.map((p) => (
        <div
          key={p.id}
          onClick={() => onSelect(p.id)}
          className="bg-white border rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg group-hover:text-blue-600 transition-colors">{p.title}</h3>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              p.status === 'ACTIVE_VOTING' ? 'bg-green-100 text-green-700' :
              p.status === 'FUNDED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {p.status}
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{p.abstract}</p>

          <div className="flex gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <BarChart3 size={16} />
              <span>Score: <span className="font-semibold text-gray-900">{p.impactScore ?? 'N/A'}</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <DollarSign size={16} />
              <span>Budget: <span className="font-semibold text-gray-900">${p.totalTargetBudget}</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={16} />
              <span>{p.milestones.length} Milestones</span>
            </div>
          </div>

          <div className="mt-4 w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all"
              style={{ width: `${Math.min(100, (p.currentFunding / p.totalTargetBudget) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
