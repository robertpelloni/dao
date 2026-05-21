import React from 'react';
import { Committee } from '../../../src/models/types';
import { Users, Target, Shield } from 'lucide-react';

interface CommitteeListProps {
  committees: Committee[];
}

export const CommitteeList: React.FC<CommitteeListProps> = ({ committees }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {committees.map((c) => (
        <div key={c.id} className="bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4 text-blue-600">
            <Target size={24} />
            <h3 className="text-xl font-black tracking-tight">{c.subject}</h3>
          </div>

          <p className="text-gray-500 text-sm mb-6 font-medium">
            Threshold Quorum: <span className="text-slate-900 font-bold">{(c.thresholdQuorum * 100).toFixed(0)}%</span>
          </p>

          <div className="flex items-center justify-between pt-6 border-t border-gray-50">
             <div className="flex items-center gap-2 text-gray-500">
               <Users size={16} />
               <span className="text-sm font-bold">{c.members.length} Members</span>
             </div>
             <div className="flex -space-x-2">
                {c.members.slice(0, 3).map((m, i) => (
                   <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] font-black uppercase">
                      {m[0]}
                   </div>
                ))}
                {c.members.length > 3 && (
                   <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-black">
                      +{c.members.length - 3}
                   </div>
                )}
             </div>
          </div>
        </div>
      ))}
    </div>
  );
};
