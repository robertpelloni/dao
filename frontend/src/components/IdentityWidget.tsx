import React from 'react';
import { User } from '../../../src/models/types.js';
import { ShieldCheck, ShieldAlert, Coins } from 'lucide-react';

interface IdentityWidgetProps {
  user: User | null;
  isVerified: boolean;
}

export const IdentityWidget: React.FC<IdentityWidgetProps> = ({ user, isVerified }) => {
  if (!user) return null;

  return (
    <div className="bg-white border rounded-xl p-6 mb-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isVerified ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
          {isVerified ? <ShieldCheck size={28} /> : <ShieldAlert size={28} />}
        </div>
        <div>
          <h2 className="font-bold text-lg">{user.name}</h2>
          <div className="flex items-center gap-2 text-sm">
            <span className={isVerified ? 'text-green-700' : 'text-amber-700'}>
              {isVerified ? 'Verified Citizen' : 'Unverified Identity'}
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-gray-500">ID: {user.id}</span>
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className="flex items-center gap-2 text-blue-600 mb-1 justify-end">
          <Coins size={20} />
          <span className="text-2xl font-black">{user.voiceCredits}</span>
        </div>
        <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Voice Credits</p>
      </div>
    </div>
  );
};
