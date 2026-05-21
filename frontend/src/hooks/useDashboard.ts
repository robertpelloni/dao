import { useState, useEffect } from 'react';
import api from '../api/client';
import { User, Proposal, Committee } from '../../../src/models/types';

export function useDashboard(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [uRes, pRes, cRes, usersRes] = await Promise.all([
        api.get(`/users/${userId}`),
        api.get('/proposals'),
        api.get('/committees'),
        api.get('/users')
      ]);
      setUser(uRes.data);
      // Mock verification check
      setIsVerified(userId === 'dave' || userId === 'charlie' || userId === 'alice');
      setProposals(pRes.data);
      setCommittees(cRes.data);
      setAllUsers(usersRes.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const selectedProposal = proposals.find(p => p.id === selectedProposalId) || null;

  return {
    user,
    isVerified,
    proposals,
    committees,
    allUsers,
    selectedProposal,
    setSelectedProposalId,
    loading,
    refresh: fetchData
  };
}
