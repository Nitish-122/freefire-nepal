import { Tournament, UserProfile, WalletTransaction } from '../types';
import heroImg from '../assets/images/freefire_hero_banner_1790409666534.jpg';
import bermudaImg from '../assets/images/bermuda_championship_1790409686232.jpg';
import clashSquadImg from '../assets/images/clash_squad_esports_1790409703820.jpg';

export const initialUserProfile: UserProfile = {
  ign: '⚡NEP_SHERPA⚡',
  uid: '2849102847',
  phoneNumber: '9841203948',
  guild: 'Gorkha Squad Nepal',
  rank: 'Grandmaster',
  city: 'Kathmandu',
  totalMatches: 68,
  totalWins: 23,
  totalKills: 284,
  totalEarnings: 8450,
};

export const initialTournaments: Tournament[] = [];

export const initialTransactions: WalletTransaction[] = [
  {
    id: 'tx-1001',
    type: 'deposit',
    amount: 500,
    points: 500,
    date: '2026-09-25 14:32',
    status: 'completed',
    method: 'eSewa',
    referenceId: 'ESW-9482019',
    note: 'Added 500 Points (रू 500)',
  },
  {
    id: 'tx-1002',
    type: 'entry_fee',
    amount: 50,
    points: 50,
    date: '2026-09-25 19:40',
    status: 'completed',
    method: 'Tournament Entry',
    referenceId: 'TOUR-106',
    note: 'Entry Fee: Kathmandu Sunday Showdown #41',
  },
  {
    id: 'tx-1003',
    type: 'winning',
    amount: 800,
    points: 800,
    date: '2026-09-25 21:15',
    status: 'completed',
    method: 'Tournament Prize',
    referenceId: 'WIN-106',
    note: 'Rank #3 Prize + 4 Kills Bounty',
  },
];
