export type GameMode = 'Solo' | 'Duo' | 'Squad';
export type GameMap = 'Bermuda' | 'Kalahari' | 'Purgatory';
export type TournamentStatus = 'upcoming' | 'live' | 'completed' | 'cancelled';

export interface UserProfile {
  ign: string;
  uid: string;
  phoneNumber: string;
  guild?: string;
  rank: 'Grandmaster' | 'Heroic' | 'Master' | 'Diamond';
  avatarUrl?: string;
  city?: string;
  totalMatches: number;
  totalWins: number;
  totalKills: number;
  totalEarnings: number; // in Points/NPR
  walletPoints?: number;
  status?: 'ACTIVE' | 'BANNED';
  password?: string;
}

export interface SystemNotice {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  active: boolean;
}

export interface SystemSettings {
  adminKhaltiNumber: string;
  minWithdrawal: number;
  noticeBoardText?: string;
}

export interface TeamMember {
  ign: string;
  uid: string;
}

export interface TeamRegistration {
  slotNumber: number;
  teamName: string;
  captainIgn: string;
  captainUid: string;
  captainPhone: string;
  members: TeamMember[];
  registeredAt: string;
}

export interface Tournament {
  id: string;
  title: string;
  bannerImage: string;
  map: GameMap;
  mode: GameMode;
  status: TournamentStatus;
  startTime: string;
  matchDate?: string;
  startsInMinutes?: number;
  scheduledStartTimeMs?: number;
  closingTimeMs?: number;
  createdAtMs?: number;
  fixedClosingTimeMinutes?: number;
  server: string;
  entryFee: number; // in Points (1 NPR = 1 Point)
  prizePool: number; // in Points
  perKillBounty: number; // in Points
  totalSlots: number;
  registeredTeams: TeamRegistration[];
  roomDetails: {
    roomId: string;
    roomPassword: string;
    customRules: string;
    isReleased: boolean;
  };
  payoutBreakdown: {
    first: number;
    second: number;
    third: number;
  };
  host: {
    name: string;
    uid: string;
    verified: boolean;
  };
  cancellationReason?: string;
  cancelledAt?: string;
  results?: {
    winnerTeam: string;
    topFragger: string;
    topFraggerKills: number;
    resultScreenshot?: string;
    settledAt?: string;
    placementPayouts?: {
      rank: number;
      teamName: string;
      captainUid?: string;
      placementPoints: number;
      killPoints: number;
      totalPointsWon: number;
    }[];
  };
}

export interface WalletTransaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'entry_fee' | 'winning' | 'host_earning' | 'refund';
  amount: number;
  points: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  method: 'eSewa' | 'Khalti' | 'IME Pay' | 'Tournament Entry' | 'Tournament Prize' | 'Tournament Refund';
  referenceId: string;
  txnId?: string;
  screenshotUrl?: string;
  khaltiNumber?: string;
  senderKhaltiId?: string;
  userIgn?: string;
  userUid?: string;
  userPhone?: string;
  rejectionReason?: string;
  reviewedAt?: string;
  note?: string;
}
