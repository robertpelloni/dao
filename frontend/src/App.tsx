import { useState } from 'react'
import { Layout, Globe, Users, FileText, Shield, RefreshCw, ChevronLeft } from 'lucide-react'
import { IdentityWidget } from './components/IdentityWidget'
import { ProposalList } from './components/ProposalList'
import { ActionPanel } from './components/ActionPanel'
import { ProposalForm } from './components/ProposalForm'
import { CommitteeList } from './components/CommitteeList'
import { IdentityView } from './components/IdentityView'
import { useDashboard } from './hooks/useDashboard'
import { Milestone } from '../../src/models/types'

function App() {
  const [activeTab, setActiveTab] = useState('proposals')
  const [showForm, setShowForm] = useState(false)
  const { user, isVerified, proposals, committees, suggestedCommittees, allUsers, powerBreakdown, selectedProposal, setSelectedProposalId, loading, refresh } = useDashboard('alice')

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-lg shadow-blue-100">
            <Globe size={24} />
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-800 uppercase text-shadow-sm">LiquidGov</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => refresh()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-blue-600"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-800">{user?.name || 'Guest User'}</p>
            <p className={`text-[10px] font-black uppercase tracking-widest ${isVerified ? 'text-green-600' : 'text-amber-600'}`}>
              {isVerified ? 'Verified' : 'Unverified'}
            </p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-sm font-black border-2 border-white">
            {user?.name?.[0] || 'G'}
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r p-4 flex flex-col gap-1 sticky top-[73px] h-[calc(100vh-73px)]">
          <p className="px-4 py-2 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-2">Navigation</p>
          <button
            onClick={() => { setActiveTab('proposals'); setSelectedProposalId(null); setShowForm(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'proposals' ? 'bg-blue-600 text-white shadow-blue-200 shadow-lg' : 'hover:bg-gray-50 text-gray-500'}`}
          >
            <FileText size={18} />
            <span>Proposals</span>
          </button>
          <button
            onClick={() => { setActiveTab('committees'); setShowForm(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'committees' ? 'bg-blue-600 text-white shadow-blue-200 shadow-lg' : 'hover:bg-gray-50 text-gray-500'}`}
          >
            <Users size={18} />
            <span>Committees</span>
          </button>
          <button
            onClick={() => { setActiveTab('identity'); setShowForm(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'identity' ? 'bg-blue-600 text-white shadow-blue-200 shadow-lg' : 'hover:bg-gray-50 text-gray-500'}`}
          >
            <Shield size={18} />
            <span>My Identity</span>
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto bg-gray-50/30">
          <div className="max-w-5xl mx-auto">
            {showForm ? (
              <ProposalForm
                userId={user?.id || 'alice'}
                onSuccess={() => { setShowForm(false); refresh(); }}
                onCancel={() => setShowForm(false)}
              />
            ) : selectedProposal ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <button
                  onClick={() => setSelectedProposalId(null)}
                  className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-blue-600 transition-colors mb-4"
                >
                  <ChevronLeft size={16} /> Back to List
                </button>

                <div className="grid grid-cols-3 gap-8">
                  <div className="col-span-2 space-y-8">
                    <header>
                       <span className="text-xs font-black uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded mb-4 inline-block tracking-widest border border-blue-100">
                         {selectedProposal.committeeId}
                       </span>
                       <h2 className="text-4xl font-black text-slate-800 tracking-tight">{selectedProposal.title}</h2>
                       <p className="text-xl text-slate-500 mt-4 leading-relaxed font-medium">{selectedProposal.abstract}</p>
                    </header>

                    <section className="bg-white border rounded-3xl p-8 shadow-sm">
                      <h3 className="text-lg font-black text-slate-800 mb-4 border-b pb-4 flex items-center gap-2">
                         <FileText className="text-blue-500" size={20} />
                         Detailed Specifications
                      </h3>
                      <div className="prose prose-slate max-w-none text-slate-600 font-medium">
                        {selectedProposal.detailedSpecs}
                      </div>
                    </section>

                    <section className="bg-white border rounded-3xl p-8 shadow-sm">
                      <h3 className="text-lg font-black text-slate-800 mb-6 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                           <Layout className="text-blue-500" size={20} />
                           Project Milestones
                        </div>
                        <span className="text-sm font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                          {selectedProposal.milestones.filter((m: Milestone) => m.isCompleted).length} / {selectedProposal.milestones.length} Done
                        </span>
                      </h3>
                      <div className="space-y-4">
                        {selectedProposal.milestones.map((m: Milestone, idx: number) => (
                          <div key={m.id} className="flex items-center gap-4 p-4 rounded-2xl border bg-gray-50/50">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${m.isCompleted ? 'bg-green-500 text-white' : 'bg-white border-2 text-gray-400'}`}>
                              {m.isCompleted ? '✓' : idx + 1}
                            </div>
                            <div className="flex-1">
                              <p className={`font-bold ${m.isCompleted ? 'text-gray-400 line-through' : 'text-slate-800'}`}>{m.description}</p>
                              <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-0.5">Budget: ${m.targetBudget}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>

                  <div className="col-span-1">
                    <ActionPanel proposal={selectedProposal} user={user} onAction={refresh} />

                    <div className="mt-8 bg-slate-900 text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                       <Globe className="absolute -right-8 -bottom-8 text-blue-500/10 group-hover:scale-110 transition-transform duration-700" size={200} />
                       <div className="relative z-10">
                          <h4 className="font-black uppercase text-[10px] tracking-[0.2em] text-blue-400 mb-2">Proposal Status</h4>
                          <div className="text-2xl font-black mb-6 flex items-center gap-2">
                             {selectedProposal.status}
                             <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                          </div>
                          <div className="space-y-3">
                             <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                               <span>Funding Goal</span>
                               <span>{Math.round((selectedProposal.currentFunding / (selectedProposal.totalTargetBudget || 1)) * 100)}%</span>
                             </div>
                             <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                               <div className="h-full bg-blue-500 transition-all duration-1000 shadow-[0_0_12px_rgba(59,130,246,0.6)]" style={{ width: `${(selectedProposal.currentFunding / (selectedProposal.totalTargetBudget || 1)) * 100}%` }} />
                             </div>
                             <div className="flex justify-between items-center pt-2">
                                <p className="text-xs font-bold text-slate-300">
                                   ${selectedProposal.currentFunding.toLocaleString()} <span className="text-slate-500">/ ${selectedProposal.totalTargetBudget.toLocaleString()}</span>
                                </p>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in duration-500">
                <IdentityWidget user={user} isVerified={isVerified} />

                <div className="flex justify-between items-end mb-8 border-b border-gray-100 pb-8">
                  <div>
                    <h2 className="text-4xl font-black text-slate-800 capitalize tracking-tight">{activeTab}</h2>
                    <p className="text-slate-500 mt-2 font-medium">Manage and participate in distributed governance.</p>
                  </div>
                  {activeTab === 'proposals' && (
                    <button
                      onClick={() => setShowForm(true)}
                      className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 hover:-translate-y-1 active:translate-y-0"
                    >
                      Create Proposal
                    </button>
                  )}
                </div>

                {loading ? (
                  <div className="grid gap-6 opacity-50">
                    {[1,2,3].map(i => <div key={i} className="h-44 bg-gray-200 animate-pulse rounded-3xl" />)}
                  </div>
                ) : activeTab === 'proposals' ? (
                  <ProposalList proposals={proposals} onSelect={setSelectedProposalId} />
                ) : activeTab === 'committees' ? (
                   <CommitteeList committees={committees} />
                ) : (
                   <IdentityView currentUser={user} allUsers={allUsers} powerBreakdown={powerBreakdown} suggestedCommittees={suggestedCommittees} onAction={refresh} />
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
