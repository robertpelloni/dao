import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import api from '../api/client';
import { User, Proposal, Committee, GovernanceCycle } from '../../../src/models/types';

const SOCKET_URL = 'http://localhost:3000';

export function useDashboard(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [suggestedCommittees, setSuggestedCommittees] = useState<Committee[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentCycle, setCurrentCycle] = useState<GovernanceCycle | null>(null);
  const [powerBreakdown, setPowerBreakdown] = useState<Record<string, number>>({});
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [uRes, pRes, cRes, usersRes, bRes, sRes, cyRes] = await Promise.all([
        api.get(`/users/${userId}`),
        api.get('/proposals'),
        api.get('/committees'),
        api.get('/users'),
        api.get(`/identity/${userId}/breakdown`),
        api.get(`/committees/suggested/${userId}`),
        api.get('/governance/cycle')
      ]);
      setUser(uRes.data);
      // Mock verification check
      setIsVerified(userId === 'dave' || userId === 'charlie' || userId === 'alice');
      setProposals(pRes.data);
      setCommittees(cRes.data);
      setSuggestedCommittees(sRes.data);
      setAllUsers(usersRes.data);
      setPowerBreakdown(bRes.data);
      setCurrentCycle(cyRes.data);
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
    const socket = io(SOCKET_URL);

    socket.on('PROPOSAL_UPDATED', () => {
      console.log('Proposal updated, refreshing...');
      fetchData(true);
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
    allUsers,
    currentCycle,
    powerBreakdown,
    selectedProposal,
    setSelectedProposalId,
    loading,
    refresh: fetchData
  };
}
