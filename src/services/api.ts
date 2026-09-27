import { Tournament, UserProfile, WalletTransaction, SystemNotice, SystemSettings } from '../types';

export interface AppSyncData {
  users: UserProfile[];
  tournaments: Tournament[];
  transactions: WalletTransaction[];
  settings: SystemSettings;
  notices: SystemNotice[];
}

export const api = {
  async fetchAppData(): Promise<AppSyncData> {
    const res = await fetch('/api/app-data');
    if (!res.ok) throw new Error('Failed to fetch app data');
    return res.json();
  },

  async pointOverride(uid: string, action: 'ADD' | 'DEDUCT', amount: number, note: string) {
    const res = await fetch('/api/users/point-override', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, action, amount, note }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Point override failed' }));
      throw new Error(err.error || 'Point override failed');
    }
    return res.json();
  },

  async toggleUserStatus(uid: string) {
    const res = await fetch('/api/users/toggle-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid }),
    });
    if (!res.ok) throw new Error('Failed to toggle status');
    return res.json();
  },

  async updateRoomCredentials(tournamentId: string, roomId: string, roomPassword: string, isReleased: boolean) {
    const res = await fetch('/api/tournaments/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tournamentId, roomId, roomPassword, isReleased }),
    });
    if (!res.ok) throw new Error('Failed to update credentials');
    return res.json();
  },

  async startTournament(tournamentId: string) {
    const res = await fetch('/api/tournaments/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tournamentId }),
    });
    if (!res.ok) throw new Error('Failed to start tournament');
    return res.json();
  },

  async cancelTournamentAndRefund(tournamentId: string, reason: string) {
    const res = await fetch('/api/tournaments/cancel-and-refund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tournamentId, reason }),
    });
    if (!res.ok) throw new Error('Failed to cancel tournament and refund');
    return res.json();
  },

  async distributeMatchPrizes(tournamentId: string, resultData: any) {
    const res = await fetch('/api/tournaments/distribute-prizes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tournamentId, resultData }),
    });
    if (!res.ok) throw new Error('Failed to distribute prizes');
    return res.json();
  },

  async saveTournament(tournament: Tournament) {
    const res = await fetch('/api/tournaments/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tournament }),
    });
    if (!res.ok) throw new Error('Failed to save tournament');
    return res.json();
  },

  async saveTransaction(transaction: WalletTransaction) {
    const res = await fetch('/api/transactions/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction }),
    });
    if (!res.ok) throw new Error('Failed to save transaction');
    return res.json();
  },

  async updateSettings(settings: Partial<SystemSettings>) {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  async postNotice(title: string, content: string) {
    const res = await fetch('/api/notices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    });
    if (!res.ok) throw new Error('Failed to post notice');
    return res.json();
  },

  async deleteNotice(id: string) {
    const res = await fetch(`/api/notices/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete notice');
    return res.json();
  },

  async upsertUser(user: UserProfile) {
    const res = await fetch('/api/users/upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user }),
    });
    if (!res.ok) throw new Error('Failed to update user');
    return res.json();
  },
};
