import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import api from '../api/client.js';
import { User, Proposal, Committee, GovernanceCycle } from '../../../src/models/types.js';

export function useDashboard(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [suggestedCommittees, setSuggestedCommittees] = useState<Committee[]>([]);
  const [suggestedProposals, setSuggestedProposals] = useState<Proposal[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [treasuryBalances, setTreasuryBalances] = useState<any[]>([]);
  const [currentCycle, setCurrentCycle] = useState<GovernanceCycle | null>(null);
  const [powerBreakdown, setPowerBreakdown] = useState<Record<string, number>>({});
  const [userTransactions, setUserTransactions] = useState<any[]>([]);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [uRes, pRes, cRes, usersRes, bRes, sRes, cyRes, spRes, tRes, utRes] = await Promise.all([
        api.get(`/users/${userId}`),
        api.get('/proposals'),
        api.get('/committees'),
        api.get('/users'),
        api.get(`/identity/${userId}/breakdown`),
        api.get(`/committees/suggested/${userId}`),
        api.get('/governance/cycle'),
        api.get(`/proposals/suggested/${userId}`),
        api.get('/treasury/balance'),
        api.get(`/treasury/transactions?userId=${userId}`)
      ]);
      setUser(uRes.data);
      // Automatically trigger welcome for new users if they have no reputation yet
      if (uRes.data && Object.keys(uRes.data.reputation).length === 0 && !silent) {
         try {
            await api.post(`/users/${userId}/welcome`, { interestSubject: 'General' });
            // Re-fetch to get new proposal and rep
            const uRetry = await api.get(`/users/${userId}`);
            setUser(uRetry.data);
         } catch (e) { console.warn('Welcome trigger failed', e); }
      }

      // Mock verification check
      setIsVerified(userId === 'dave' || userId === 'charlie' || userId === 'alice');
      setProposals(pRes.data);
      setCommittees(cRes.data);
      setSuggestedCommittees(sRes.data);
      setSuggestedProposals(spRes.data);
      setAllUsers(usersRes.data);
      setPowerBreakdown(bRes.data);
      setCurrentCycle(cyRes.data);
      setTreasuryBalances(tRes.data);
      setUserTransactions(utRes.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    // Request Notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const socket = io();

    socket.on('PROPOSAL_UPDATED', (data: any) => {
      console.log('Proposal updated, refreshing...');
      fetchData(true);

      if (data.isCritical && Notification.permission === 'granted') {
        new Notification('Critical Governance Event', {
          body: `A high-priority proposal requires your attention: ${data.proposalId}`,
          icon: '/favicon.ico'
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchData]);

  const selectedProposal = proposals.find(p => p.id === selectedProposalId) || null;

  return {
    user,
    isVerified,
    proposals,
    committees,
    suggestedCommittees,
    suggestedProposals,
    allUsers,
    treasuryBalances,
    currentCycle,
    powerBreakdown,
    userTransactions,
    selectedProposal,
    setSelectedProposalId,
    loading,
    refresh: fetchData
  };
}
