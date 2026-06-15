import React, { useState, useEffect } from 'react';
import { Landmark, TrendingUp, History, DollarSign, ArrowUpRight, Shield, Filter } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../api/client.js';

interface TreasuryDashboardProps {
  onAction?: () => void;
}

export const TreasuryDashboard: React.FC<TreasuryDashboardProps> = ({ onAction }) => {
  const [balances, setBalances] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [committees, setCommittees] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('General');
  const [filterSubject, setFilterSubject] = useState('All');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const bRes = await api.get('/treasury/balance');
      setBalances(bRes.data);

      const tRes = await api.get('/treasury/transactions');
      setTransactions(tRes.data);

      const cRes = await api.get('/committees');
      setCommittees(cRes.data);
    } catch (err) {
      console.error('Failed to fetch treasury data', err);
    }
  };

  useEffect(() => {
    fetchData();

    const socket = io('http://localhost:3000');
    socket.on('TREASURY_UPDATED', () => {
      fetchData();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    setLoading(true);
    try {
      await api.post('/treasury/deposit', {
        amount: Number(amount),
        tokenSymbol: 'USD',
        subject: selectedSubject,
        description: description || 'Voluntary Contribution'
      });
      setAmount('');
      setDescription('');
      fetchData();
      if (onAction) onAction();
    } catch (err) {
      console.error('Deposit failed', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = filterSubject === 'All'
    ? transactions
    : transactions.filter(tx => tx.subject === filterSubject);

  const totalUSD = balances
    .filter(b => b.tokenSymbol === 'USD')
    .reduce((acc, b) => acc + b.amount, 0);

  const subjects = ['General', ...new Set(committees.map(c => c.subject))];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <Landmark className="absolute -right-10 -bottom-10 text-white/5 w-64 h-64" />
        <div className="relative z-10">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-blue-400 mb-2">Central Treasury</h2>
          <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-12">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Voluntary Capital (USD)</p>
              <p className="text-4xl md:text-6xl font-black">${totalUSD.toLocaleString()}</p>
            </div>
            <div className="flex gap-8 border-l border-slate-700 pl-8 hidden md:flex">
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Subject Pools</p>
                 <p className="text-xl font-bold">{balances.length}</p>
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Global Audit</p>
                 <p className="text-xl font-bold text-green-400 flex items-center gap-1">
                    <Shield size={16} /> Verified
                 </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Subject Breakdown */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         {balances.map((b, i) => (
           <div key={i} className="bg-white border rounded-2xl p-4 shadow-sm hover:border-blue-200 transition-colors">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{b.subject}</p>
              <p className="text-xl font-black text-slate-800">${b.amount.toLocaleString()}</p>
              <p className="text-[10px] font-bold text-blue-600 mt-1">{b.tokenSymbol} Pool</p>
           </div>
         ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white border rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <History className="text-blue-500" size={20} />
                Treasury Audit Log
              </h3>
              <div className="flex items-center gap-2 bg-gray-50 border rounded-xl px-3 py-1.5">
                 <Filter size={14} className="text-slate-400" />
                 <select
                   value={filterSubject}
                   onChange={(e) => setFilterSubject(e.target.value)}
                   className="bg-transparent text-xs font-bold text-slate-600 outline-none"
                 >
                   <option value="All">All Subjects</option>
                   {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
              </div>
            </div>

            <div className="space-y-4">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-2xl text-slate-400 font-medium">
                  No transactions matching filter.
                </div>
              ) : (
                filteredTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl border bg-gray-50/50 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                        {tx.amount > 0 ? <TrendingUp size={18} /> : <ArrowUpRight size={18} />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{tx.description}</p>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                          {tx.type} • {tx.subject} • {new Date(tx.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-black ${tx.amount > 0 ? 'text-green-600' : 'text-slate-800'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} {tx.tokenSymbol}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="col-span-1">
          <section className="bg-blue-600 text-white rounded-3xl p-8 shadow-xl sticky top-24">
            <h3 className="text-xl font-black mb-2 flex items-center gap-2">
              <DollarSign size={24} />
              Voluntary Tax
            </h3>
            <p className="text-blue-100 text-sm font-medium mb-8 leading-relaxed">
              Fuel a specific subject pool. Your capital will be used to match projects within the chosen committee.
            </p>

            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 block mb-2">Target Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full bg-blue-700/50 border border-blue-400/30 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:ring-2 focus:ring-white/20 transition-all appearance-none"
                >
                  {subjects.map(s => <option key={s} value={s} className="text-slate-800">{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 block mb-2">Amount (USD)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-blue-700/50 border border-blue-400/30 rounded-xl px-4 py-3 text-white placeholder-blue-300/50 font-bold focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 block mb-2">Description (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Supporting public goods..."
                  className="w-full bg-blue-700/50 border border-blue-400/30 rounded-xl px-4 py-3 text-white placeholder-blue-300/50 font-bold focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-blue-600 font-black py-4 rounded-xl shadow-lg shadow-blue-900/20 hover:bg-blue-50 transition-all active:scale-95 disabled:opacity-50 mt-4"
              >
                {loading ? 'Processing...' : 'Contribute to Pool'}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-blue-500/30">
               <div className="flex items-center gap-3 text-blue-100 italic text-xs leading-snug">
                  <Shield size={16} className="shrink-0" />
                  "Distributed governance requires distributed funding. Targeted capital ensures local needs are met."
               </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
