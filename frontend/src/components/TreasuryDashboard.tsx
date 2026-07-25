
import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Shield, ArrowRightCircle } from 'lucide-react';

export const TreasuryDashboard: React.FC = () => {
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [depositToken, setDepositToken] = useState('USD');
  const [loading, setLoading] = useState(false);

  const fetchBalances = async () => {
    try {
      const res = await api.get('/treasury/balances');
      setBalances(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, []);

  const handleDeposit = async () => {
    if (depositAmount <= 0) return;
    setLoading(true);
    try {
      await api.post('/treasury/deposit', { amount: depositAmount, tokenSymbol: depositToken });
      setDepositAmount(0);
      fetchBalances();
    } catch (err) {
      alert('Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border rounded-3xl p-8 shadow-sm">
      <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
        <Shield className="text-emerald-500" size={24} />
        Treasury & Multi-Token Matching Pools
        <div className="group relative inline-block">
           <div className="w-4 h-4 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-black cursor-help">?</div>
           <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
             The treasury holds matching funds across various tokens. These are used to amplify individual contributions via Quadratic Funding.
           </div>
        </div>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
           <h4 className="text-sm font-black uppercase text-slate-500 tracking-widest mb-4">Current Balances</h4>
           <div className="space-y-3">
             {Object.entries(balances).map(([token, amount]) => (
               <div key={token} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                 <span className="font-bold text-slate-700">{token}</span>
                 <span className="font-black text-lg text-emerald-600">{amount.toLocaleString()}</span>
               </div>
             ))}
             {Object.keys(balances).length === 0 && (
               <p className="text-slate-400 text-sm italic font-medium">Treasury is empty.</p>
             )}
           </div>
        </div>

        <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100">
           <h4 className="text-sm font-black uppercase text-emerald-800 tracking-widest mb-4 flex items-center gap-2">
             <ArrowRightCircle size={16} />
             Deposit Matching Funds
           </h4>
           <div className="space-y-4">
             <div className="flex gap-2">
               <input
                 type="number"
                 min="0"
                 placeholder="Amount"
                 className="flex-1 bg-white border border-emerald-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                 value={depositAmount || ''}
                 onChange={e => setDepositAmount(Number(e.target.value))}
               />
               <select
                 className="w-28 bg-white border border-emerald-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 font-bold appearance-none"
                 value={depositToken}
                 onChange={e => setDepositToken(e.target.value)}
               >
                 <option value="USD">USD</option>
                 <option value="ETH">ETH</option>
                 <option value="USDC">USDC</option>
                 <option value="BTC">BTC</option>
               </select>
             </div>
             <button
               onClick={handleDeposit}
               disabled={loading || depositAmount <= 0}
               className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-3 rounded-xl shadow-lg shadow-emerald-200 transition-all"
             >
               Confirm Deposit
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};
