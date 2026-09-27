import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, 
  Coins, 
  Trophy, 
  Check, 
  X, 
  Eye, 
  Clock, 
  AlertCircle, 
  ArrowLeft, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  Award, 
  Flame, 
  Users, 
  Lock, 
  Unlock, 
  Key, 
  FileText,
  Search, 
  Filter, 
  QrCode, 
  RotateCcw, 
  Copy,
  Edit3,
  Ban,
  Radio,
  Bell,
  RefreshCw,
  Sliders,
  DollarSign,
  AlertTriangle,
  Send,
  Trash2
} from 'lucide-react';
import { Tournament, WalletTransaction, UserProfile, SystemNotice, SystemSettings } from '../types';

interface AdminPanelProps {
  userProfile: UserProfile;
  walletPoints: number;
  tournaments: Tournament[];
  transactions: WalletTransaction[];
  users: UserProfile[];
  settings: SystemSettings;
  notices: SystemNotice[];
  onApproveDeposit: (txId: string) => void;
  onRejectDeposit: (txId: string, reason: string) => void;
  onDistributeMatchPrizes: (
    tournamentId: string,
    resultData: {
      winnerTeam: string;
      topFragger: string;
      topFraggerKills: number;
      resultScreenshot?: string;
      placementPayouts: {
        rank: number;
        teamName: string;
        captainUid?: string;
        placementPoints: number;
        killPoints: number;
        totalPointsWon: number;
      }[];
    }
  ) => void;
  onPointOverride: (uid: string, action: 'ADD' | 'DEDUCT', amount: number, note: string) => Promise<void>;
  onToggleUserStatus: (uid: string) => Promise<void>;
  onUpdateRoomCredentials: (tournamentId: string, roomId: string, roomPassword: string, isReleased: boolean) => Promise<void>;
  onCancelMatchAndRefund: (tournamentId: string, reason: string) => Promise<void>;
  onUpdateSettings: (settings: Partial<SystemSettings>) => Promise<void>;
  onPostNotice: (title: string, content: string) => Promise<void>;
  onDeleteNotice: (id: string) => Promise<void>;
  onExitAdmin: () => void;
  onRefreshData?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  userProfile,
  walletPoints,
  tournaments,
  transactions,
  users,
  settings,
  notices,
  onApproveDeposit,
  onRejectDeposit,
  onDistributeMatchPrizes,
  onPointOverride,
  onToggleUserStatus,
  onUpdateRoomCredentials,
  onCancelMatchAndRefund,
  onUpdateSettings,
  onPostNotice,
  onDeleteNotice,
  onExitAdmin,
  onRefreshData,
}) => {
  // 1. ALL REACT HOOKS AT TOP LEVEL (UNCONDITIONAL)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('ff_admin_auth') === 'true';
  });
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');

  // Admin Navigation Tabs
  const [adminTab, setAdminTab] = useState<'deposits' | 'rooms' | 'users' | 'prizes' | 'withdrawals' | 'settings'>('deposits');

  // Screenshot viewer modal state
  const [viewingScreenshot, setViewingScreenshot] = useState<string | null>(null);

  // Reject Modal state
  const [rejectingTx, setRejectingTx] = useState<WalletTransaction | null>(null);
  const [rejectReason, setRejectReason] = useState('Invalid Transaction ID / Unconfirmed in merchant statement');
  const [rejectReasonError, setRejectReasonError] = useState<string | null>(null);

  // Deposit Filter state
  const [depositFilter, setDepositFilter] = useState<'pending' | 'completed' | 'failed' | 'all'>('pending');

  // User Management State
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [overrideModalUser, setOverrideModalUser] = useState<UserProfile | null>(null);
  const [overrideAction, setOverrideAction] = useState<'ADD' | 'DEDUCT'>('ADD');
  const [overrideAmount, setOverrideAmount] = useState<number>(50);
  const [overrideNote, setOverrideNote] = useState('');
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);
  const [overrideError, setOverrideError] = useState<string | null>(null);
  const [userActionSuccess, setUserActionSuccess] = useState<string | null>(null);

  // Rooms Management State
  const [roomFeeFilter, setRoomFeeFilter] = useState<'ALL' | 5 | 10 | 15 | 20>('ALL');
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [editingCredentialsTourney, setEditingCredentialsTourney] = useState<Tournament | null>(null);
  const [newRoomId, setNewRoomId] = useState('');
  const [newRoomPassword, setNewRoomPassword] = useState('');
  const [releaseImmediately, setReleaseImmediately] = useState(true);
  const [credSubmitting, setCredSubmitting] = useState(false);

  // Cancel & Refund State
  const [cancellingTourney, setCancellingTourney] = useState<Tournament | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('Host failed to provide room credentials 15 minutes before match start time.');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  // Settings State
  const [adminPhoneInput, setAdminPhoneInput] = useState(settings?.adminKhaltiNumber || '9813362603');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSuccessNotice, setSettingsSuccessNotice] = useState<string | null>(null);
  const [copiedAdminNum, setCopiedAdminNum] = useState(false);

  // Notice Board State
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticePosting, setNoticePosting] = useState(false);

  // Match Result Distributor State
  const [selectedTourneyId, setSelectedTourneyId] = useState<string>(
    tournaments.find(t => t.status !== 'completed')?.id || tournaments[0]?.id || ''
  );
  const selectedTournament = tournaments.find(t => t.id === selectedTourneyId);
  const [resultScreenshot, setResultScreenshot] = useState<string>('');
  const [resultScreenshotName, setResultScreenshotName] = useState<string>('');
  const resultFileInputRef = useRef<HTMLInputElement>(null);

  const [firstPlaceTeam, setFirstPlaceTeam] = useState<string>('');
  const [firstPlaceKills, setFirstPlaceKills] = useState<number>(8);
  const [firstPlacePoints, setFirstPlacePoints] = useState<number>(0);

  const [secondPlaceTeam, setSecondPlaceTeam] = useState<string>('');
  const [secondPlaceKills, setSecondPlaceKills] = useState<number>(5);
  const [secondPlacePoints, setSecondPlacePoints] = useState<number>(0);

  const [thirdPlaceTeam, setThirdPlaceTeam] = useState<string>('');
  const [thirdPlaceKills, setThirdPlaceKills] = useState<number>(3);
  const [thirdPlacePoints, setThirdPlacePoints] = useState<number>(0);

  const [topFraggerName, setTopFraggerName] = useState<string>('');
  const [topFraggerKills, setTopFraggerKills] = useState<number>(9);
  const [distributionSuccessMsg, setDistributionSuccessMsg] = useState<string | null>(null);

  // Sync settings when props change
  useEffect(() => {
    if (settings?.adminKhaltiNumber) {
      setAdminPhoneInput(settings.adminKhaltiNumber);
    }
  }, [settings?.adminKhaltiNumber]);

  // Sync prize distribution defaults
  useEffect(() => {
    if (selectedTournament) {
      setFirstPlacePoints(selectedTournament.payoutBreakdown?.first || 0);
      setSecondPlacePoints(selectedTournament.payoutBreakdown?.second || 0);
      setThirdPlacePoints(selectedTournament.payoutBreakdown?.third || 0);

      const teams = selectedTournament.registeredTeams || [];
      if (teams.length > 0) {
        setFirstPlaceTeam(teams[0].teamName);
        setTopFraggerName(teams[0].captainIgn);
      }
      if (teams.length > 1) {
        setSecondPlaceTeam(teams[1].teamName);
      }
      if (teams.length > 2) {
        setThirdPlaceTeam(teams[2].teamName);
      }
    }
  }, [selectedTourneyId, selectedTournament]);

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === 'ZEROXXX') {
      sessionStorage.setItem('ff_admin_auth', 'true');
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Invalid Admin Passcode.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('ff_admin_auth');
    setIsAuthenticated(false);
  };

  // Point Override Submission
  const handlePointOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideModalUser) return;
    if (!overrideAmount || overrideAmount <= 0) {
      setOverrideError('Please enter a valid points amount greater than 0.');
      return;
    }
    if (!overrideNote.trim()) {
      setOverrideError('A mandatory audit note is required for all administrative balance changes.');
      return;
    }

    try {
      setOverrideSubmitting(true);
      setOverrideError(null);
      await onPointOverride(overrideModalUser.uid, overrideAction, Number(overrideAmount), overrideNote.trim());
      setUserActionSuccess(
        `Successfully ${overrideAction === 'ADD' ? 'credited' : 'deducted'} ${overrideAmount} Points for ${overrideModalUser.ign}!`
      );
      setOverrideModalUser(null);
      setOverrideNote('');
      setTimeout(() => setUserActionSuccess(null), 4000);
    } catch (err: any) {
      setOverrideError(err.message || 'Failed to update points.');
    } finally {
      setOverrideSubmitting(false);
    }
  };

  // Toggle Account Status
  const handleToggleStatus = async (user: UserProfile) => {
    try {
      await onToggleUserStatus(user.uid);
      const nextStatus = user.status === 'BANNED' ? 'ACTIVE' : 'BANNED';
      setUserActionSuccess(`User ${user.ign} status flipped to ${nextStatus}.`);
      setTimeout(() => setUserActionSuccess(null), 3000);
    } catch (err: any) {
      setUserActionSuccess(`Error changing user status: ${err.message}`);
    }
  };

  // Room Credentials Submission
  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCredentialsTourney) return;
    if (!newRoomId.trim() || !newRoomPassword.trim()) {
      alert('Please enter both Room ID and Room Password.');
      return;
    }

    try {
      setCredSubmitting(true);
      await onUpdateRoomCredentials(
        editingCredentialsTourney.id,
        newRoomId.trim(),
        newRoomPassword.trim(),
        releaseImmediately
      );
      setEditingCredentialsTourney(null);
      setUserActionSuccess(`Credentials updated and saved directly to the database for "${editingCredentialsTourney.title}".`);
      setTimeout(() => setUserActionSuccess(null), 4000);
    } catch (err: any) {
      alert(`Error saving credentials: ${err.message}`);
    } finally {
      setCredSubmitting(false);
    }
  };

  // Cancel Room and Refund All
  const handleConfirmCancelRefund = async () => {
    if (!cancellingTourney) return;
    try {
      setCancelSubmitting(true);
      await onCancelMatchAndRefund(cancellingTourney.id, cancelReasonInput.trim());
      setCancellingTourney(null);
      setUserActionSuccess(`Match cancelled and entry points refunded to all players for "${cancellingTourney.title}".`);
      setTimeout(() => setUserActionSuccess(null), 5000);
    } catch (err: any) {
      alert(`Error cancelling match: ${err.message}`);
    } finally {
      setCancelSubmitting(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPhoneInput.trim()) {
      alert('Please enter a valid phone number.');
      return;
    }
    try {
      setSettingsSaving(true);
      await onUpdateSettings({ adminKhaltiNumber: adminPhoneInput.trim() });
      setSettingsSuccessNotice('Admin Khalti number updated in database and active across all player payment dialogs.');
      setTimeout(() => setSettingsSuccessNotice(null), 4000);
    } catch (err: any) {
      alert(`Error updating settings: ${err.message}`);
    } finally {
      setSettingsSaving(false);
    }
  };

  // Post Global Notice
  const handlePostNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) {
      alert('Please enter both a title and message for the announcement.');
      return;
    }
    try {
      setNoticePosting(true);
      await onPostNotice(noticeTitle.trim(), noticeContent.trim());
      setNoticeTitle('');
      setNoticeContent('');
      setSettingsSuccessNotice('Global announcement broadcasted to all player apps via shared database.');
      setTimeout(() => setSettingsSuccessNotice(null), 4000);
    } catch (err: any) {
      alert(`Error posting notice: ${err.message}`);
    } finally {
      setNoticePosting(false);
    }
  };

  // Prize Distribution Submission
  const handleConfirmDistribution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournament) return;

    const perKillBounty = selectedTournament.perKillBounty || 0;
    const rank1KillPoints = firstPlaceKills * perKillBounty;
    const rank1Total = firstPlacePoints + rank1KillPoints;
    const rank2KillPoints = secondPlaceKills * perKillBounty;
    const rank2Total = secondPlacePoints + rank2KillPoints;
    const rank3KillPoints = thirdPlaceKills * perKillBounty;
    const rank3Total = thirdPlacePoints + rank3KillPoints;

    const t1Reg = selectedTournament.registeredTeams.find(t => t.teamName === firstPlaceTeam);
    const t2Reg = selectedTournament.registeredTeams.find(t => t.teamName === secondPlaceTeam);
    const t3Reg = selectedTournament.registeredTeams.find(t => t.teamName === thirdPlaceTeam);

    const placementPayouts = [
      {
        rank: 1,
        teamName: firstPlaceTeam || 'Rank 1 Champion',
        captainUid: t1Reg?.captainUid,
        placementPoints: firstPlacePoints,
        killPoints: rank1KillPoints,
        totalPointsWon: rank1Total,
      },
      {
        rank: 2,
        teamName: secondPlaceTeam || 'Rank 2 Team',
        captainUid: t2Reg?.captainUid,
        placementPoints: secondPlacePoints,
        killPoints: rank2KillPoints,
        totalPointsWon: rank2Total,
      },
    ];

    if (thirdPlacePoints > 0 || thirdPlaceTeam) {
      placementPayouts.push({
        rank: 3,
        teamName: thirdPlaceTeam || 'Rank 3 Team',
        captainUid: t3Reg?.captainUid,
        placementPoints: thirdPlacePoints,
        killPoints: rank3KillPoints,
        totalPointsWon: rank3Total,
      });
    }

    onDistributeMatchPrizes(selectedTournament.id, {
      winnerTeam: firstPlaceTeam || 'Champion Squad',
      topFragger: topFraggerName || 'MVP Fragger',
      topFraggerKills: Number(topFraggerKills) || 0,
      resultScreenshot: resultScreenshot || undefined,
      placementPayouts,
    });

    setDistributionSuccessMsg(
      `Prizes distributed successfully! Credited total ${rank1Total + rank2Total + rank3Total} Points directly to winner user accounts in database.`
    );
    setTimeout(() => setDistributionSuccessMsg(null), 5000);
  };

  // Filtered lists
  const depositTransactions = transactions.filter(t => t.type === 'deposit');
  const filteredDeposits = depositTransactions.filter(t => {
    if (depositFilter === 'all') return true;
    return t.status === depositFilter;
  });
  const pendingDepositsCount = depositTransactions.filter(t => t.status === 'pending').length;
  const withdrawalTransactions = transactions.filter(t => t.type === 'withdraw');

  const filteredUsers = users.filter(u => {
    const q = userSearchQuery.toLowerCase();
    return (
      u.ign.toLowerCase().includes(q) ||
      u.uid.toLowerCase().includes(q) ||
      u.phoneNumber.toLowerCase().includes(q) ||
      (u.guild && u.guild.toLowerCase().includes(q))
    );
  });

  const filteredRooms = tournaments.filter(t => {
    if (roomFeeFilter !== 'ALL' && t.entryFee !== roomFeeFilter) return false;
    if (roomSearchQuery.trim()) {
      const q = roomSearchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.map.toLowerCase().includes(q) ||
        t.host.name.toLowerCase().includes(q) ||
        t.host.uid.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // 2. CONDITIONAL RETURN BELOW ALL HOOKS
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#141414] border border-[#2A2A2A] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E50914] to-[#80050A] flex items-center justify-center mx-auto text-white shadow-[0_0_20px_rgba(229,9,20,0.5)]">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="font-display text-3xl uppercase font-extrabold tracking-wide text-white">
              Secure Admin Console
            </h1>
            <p className="text-xs text-neutral-400 font-gaming uppercase tracking-widest">
              Route: /admin · Full Control & Database Override
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                Admin Passcode *
              </label>
              <input
                type="password"
                required
                autoFocus
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-[#2D2D2D] text-white focus:border-[#E50914] focus:outline-none text-sm font-mono tracking-widest placeholder:text-neutral-600"
              />
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn-crimson w-full py-3.5 text-xs uppercase tracking-wider font-bold cursor-pointer"
            >
              Authenticate & Access Admin Panel
            </button>
          </form>

          <div className="pt-4 border-t border-[#222222] text-center">
            <button
              onClick={onExitAdmin}
              className="text-xs text-neutral-400 hover:text-white flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Free Fire App</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. AUTHENTICATED ADMIN PANEL
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-sans selection:bg-[#E50914] selection:text-white">
      
      {/* Top Admin Bar */}
      <header className="sticky top-0 z-40 bg-[#121212]/95 backdrop-blur-md border-b border-[#242424]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E50914] flex items-center justify-center text-white shadow-[0_0_15px_rgba(229,9,20,0.5)]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-2xl text-white font-extrabold uppercase">
                    Admin Portal
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 font-mono">
                    /admin · LIVE DB
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400 font-gaming uppercase tracking-widest hidden sm:block">
                  Khiladi Nepal Esports Control & Database Mutations
                </p>
              </div>
            </div>

            {/* Quick Actions & Exit */}
            <div className="flex items-center gap-2 sm:gap-3">
              {pendingDepositsCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold font-gaming">
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                  <span className="hidden sm:inline">{pendingDepositsCount} Deposits</span>
                  <span className="sm:hidden">{pendingDepositsCount} Dep</span>
                </div>
              )}

              {onRefreshData && (
                <button
                  type="button"
                  onClick={onRefreshData}
                  className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  title="Sync Latest Database Data"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={onExitAdmin}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs text-white font-semibold cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Player Portal</span>
              </button>

              <button
                onClick={handleLogout}
                className="p-2 rounded-xl bg-neutral-800/80 hover:bg-red-950 text-neutral-400 hover:text-red-400 cursor-pointer transition-colors"
                title="Lock / Logout Admin"
              >
                <Lock className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Global Notification Toast */}
      {userActionSuccess && (
        <div className="sticky top-20 z-30 max-w-7xl mx-auto px-4 w-full mt-2">
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{userActionSuccess}</span>
            </div>
            <button onClick={() => setUserActionSuccess(null)} className="text-emerald-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-[#141414] rounded-2xl border border-[#242424] overflow-x-auto scrollbar-none">
          
          <button
            onClick={() => setAdminTab('deposits')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-gaming font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
              adminTab === 'deposits'
                ? 'bg-[#E50914] text-white shadow-[0_0_15px_rgba(229,9,20,0.5)]'
                : 'text-neutral-400 hover:text-white hover:bg-[#1E1E1E]'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>1. Khalti Deposits</span>
            {pendingDepositsCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-white text-black text-[10px] flex items-center justify-center font-bold">
                {pendingDepositsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setAdminTab('rooms')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-gaming font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
              adminTab === 'rooms'
                ? 'bg-[#E50914] text-white shadow-[0_0_15px_rgba(229,9,20,0.5)]'
                : 'text-neutral-400 hover:text-white hover:bg-[#1E1E1E]'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>2. Rooms & Matches ({tournaments.length})</span>
          </button>

          <button
            onClick={() => setAdminTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-gaming font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
              adminTab === 'users'
                ? 'bg-[#E50914] text-white shadow-[0_0_15px_rgba(229,9,20,0.5)]'
                : 'text-neutral-400 hover:text-white hover:bg-[#1E1E1E]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>3. Users & Wallet Control ({users.length})</span>
          </button>

          <button
            onClick={() => setAdminTab('prizes')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-gaming font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
              adminTab === 'prizes'
                ? 'bg-[#E50914] text-white shadow-[0_0_15px_rgba(229,9,20,0.5)]'
                : 'text-neutral-400 hover:text-white hover:bg-[#1E1E1E]'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>4. Prize Distributor</span>
          </button>

          <button
            onClick={() => setAdminTab('withdrawals')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-gaming font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
              adminTab === 'withdrawals'
                ? 'bg-[#E50914] text-white shadow-[0_0_15px_rgba(229,9,20,0.5)]'
                : 'text-neutral-400 hover:text-white hover:bg-[#1E1E1E]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>5. Khalti Payouts ({withdrawalTransactions.length})</span>
          </button>

          <button
            onClick={() => setAdminTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-gaming font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
              adminTab === 'settings'
                ? 'bg-[#E50914] text-white shadow-[0_0_15px_rgba(229,9,20,0.5)]'
                : 'text-neutral-400 hover:text-white hover:bg-[#1E1E1E]'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>6. Payment & Notice Board</span>
          </button>

        </div>

        {/* ============================================================== */}
        {/* TAB 1: KHALTI DEPOSIT VERIFICATION PANEL                       */}
        {/* ============================================================== */}
        {adminTab === 'deposits' && (
          <div className="space-y-6">
            
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#141414] border border-[#242424]">
              <div>
                <h3 className="font-display text-2xl text-white font-extrabold uppercase">
                  Khalti Manual Deposit Submissions
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Verify user Khalti TxnID and payment proof screenshot. Approving credits 1 NPR = 1 Point directly in database.
                </p>
              </div>

              {/* Status Segmented Buttons */}
              <div className="flex items-center gap-1.5 p-1 bg-[#0A0A0A] rounded-xl border border-[#262626]">
                {[
                  { id: 'pending', label: `Pending (${pendingDepositsCount})` },
                  { id: 'completed', label: 'Completed' },
                  { id: 'failed', label: 'Rejected' },
                  { id: 'all', label: 'All' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setDepositFilter(st.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-gaming font-bold uppercase transition-all cursor-pointer ${
                      depositFilter === st.id
                        ? 'bg-[#2A2A2A] text-white shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Deposits List */}
            {filteredDeposits.length === 0 ? (
              <div className="py-16 text-center rounded-2xl bg-[#141414] border border-[#242424] p-8 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="font-display text-2xl text-white font-bold uppercase">
                  No {depositFilter !== 'all' ? depositFilter.toUpperCase() : ''} Deposits Found
                </h4>
                <p className="text-xs text-neutral-400">
                  {depositFilter === 'pending'
                    ? 'All Khalti deposits have been reviewed and approved!'
                    : 'No transactions match this filter.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDeposits.map((tx) => {
                  const isPending = tx.status === 'pending';
                  const isCompleted = tx.status === 'completed';

                  return (
                    <div
                      key={tx.id}
                      className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-[#242424] hover:border-[#333333] transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                          isPending 
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' 
                            : isCompleted 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                            : 'bg-red-500/20 text-red-400 border border-red-500/40'
                        }`}>
                          {isPending ? <Clock className="w-6 h-6 animate-pulse" /> : isCompleted ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-gaming font-bold text-lg text-white">
                              रू {tx.amount.toLocaleString()} NPR
                            </span>
                            <span className="text-xs text-amber-400 font-semibold font-gaming">
                              (= {tx.points.toLocaleString()} Points)
                            </span>
                            
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isPending
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                : isCompleted
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : 'bg-red-500/20 text-red-400 border border-red-500/40'
                            }`}>
                              {tx.status}
                            </span>
                          </div>

                          <div className="text-xs text-neutral-300 font-mono flex items-center gap-2 flex-wrap">
                            <span>TxnID: <strong className="text-purple-300 font-bold">{tx.txnId || tx.referenceId}</strong></span>
                            <span aria-hidden="true" className="text-neutral-600">·</span>
                            <span>Sender: {tx.senderKhaltiId || tx.userPhone || userProfile.phoneNumber}</span>
                            <span aria-hidden="true" className="text-neutral-600">·</span>
                            <span>{tx.date}</span>
                          </div>

                          {tx.rejectionReason && (
                            <div className="text-xs text-red-400 font-medium">
                              Rejection Reason: {tx.rejectionReason}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#222222]">
                        {tx.screenshotUrl ? (
                          <button
                            type="button"
                            onClick={() => setViewingScreenshot(tx.screenshotUrl!)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/40 text-xs text-purple-300 cursor-pointer transition-colors"
                          >
                            <Eye className="w-4 h-4 text-purple-400" />
                            <span>View Proof Screenshot</span>
                          </button>
                        ) : (
                          <div className="text-[11px] text-neutral-500 italic">
                            No screenshot attached
                          </div>
                        )}

                        {isPending && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onApproveDeposit(tx.id)}
                              className="btn-crimson flex items-center gap-1.5 px-4 py-2 text-xs uppercase font-bold tracking-wider cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Approve (+{tx.points} Pts)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setRejectingTx(tx)}
                              className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-red-950/80 border border-neutral-700 hover:border-red-500/50 text-xs text-neutral-300 hover:text-red-300 font-bold uppercase transition-colors cursor-pointer"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Reject</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: ROOM & MATCH OVERRIDE CONTROLS                          */}
        {/* ============================================================== */}
        {adminTab === 'rooms' && (
          <div className="space-y-6">
            
            {/* Header and Filter Controls */}
            <div className="p-5 rounded-2xl bg-[#141414] border border-[#242424] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-2xl text-white font-extrabold uppercase">
                    User-Hosted Matches & Room Override
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Filter by entry points, override Room credentials before T-15m, or cancel and refund all players directly.
                  </p>
                </div>

                {/* Entry Fee Filters: Strictly 5, 10, 15, 20 Points */}
                <div className="flex items-center gap-1 p-1 bg-[#0A0A0A] rounded-xl border border-[#262626]">
                  {(['ALL', 5, 10, 15, 20] as const).map((fee) => (
                    <button
                      key={fee.toString()}
                      type="button"
                      onClick={() => setRoomFeeFilter(fee)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-gaming font-bold uppercase transition-all cursor-pointer ${
                        roomFeeFilter === fee
                          ? 'bg-[#E50914] text-white shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {fee === 'ALL' ? 'All Fees' : `${fee} Pts`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  value={roomSearchQuery}
                  onChange={(e) => setRoomSearchQuery(e.target.value)}
                  placeholder="Search rooms by Title, Map (Bermuda/Kalahari/Purgatory), Host IGN, or UID..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#262626] text-white text-xs placeholder:text-neutral-600 focus:outline-none focus:border-[#E50914]"
                />
              </div>
            </div>

            {/* Rooms Cards */}
            {filteredRooms.length === 0 ? (
              <div className="py-16 text-center rounded-2xl bg-[#141414] border border-[#242424] p-8 space-y-2">
                <AlertCircle className="w-10 h-10 text-neutral-500 mx-auto" />
                <h4 className="font-display text-xl text-white font-bold uppercase">
                  No Rooms Found
                </h4>
                <p className="text-xs text-neutral-400">
                  No matches match the selected entry fee ({roomFeeFilter} Points) or search query.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredRooms.map((room) => {
                  const hasCredentials = room.roomDetails.roomId && room.roomDetails.roomId !== 'Waiting Host Setup';
                  const isCancelled = room.status === 'cancelled';
                  const isCompleted = room.status === 'completed';
                  const registeredCount = room.registeredTeams.length;

                  return (
                    <div
                      key={room.id}
                      className="p-5 rounded-2xl bg-[#141414] border border-[#242424] hover:border-[#333333] transition-all space-y-4"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#202020] pb-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-display text-xl font-extrabold uppercase text-white tracking-wide">
                              {room.title}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-neutral-800 text-neutral-300 border border-neutral-700 font-gaming">
                              {room.map} · {room.mode}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              room.status === 'live'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                                : room.status === 'completed'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                                : room.status === 'cancelled'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            }`}>
                              {room.status}
                            </span>
                          </div>

                          <div className="text-xs text-neutral-400 mt-1 flex items-center gap-3 flex-wrap">
                            <span>Host: <strong className="text-white">{room.host.name}</strong> (UID: {room.host.uid})</span>
                            <span className="text-neutral-600">·</span>
                            <span>Time: <strong className="text-amber-300">{room.startTime}</strong></span>
                            <span className="text-neutral-600">·</span>
                            <span>Slots: <strong className="text-white">{registeredCount} / {room.totalSlots}</strong> Teams Joined</span>
                          </div>
                        </div>

                        {/* Financial Metrics */}
                        <div className="flex items-center gap-3">
                          <div className="px-3.5 py-1.5 rounded-xl bg-[#0A0A0A] border border-[#282828] text-right">
                            <div className="text-[10px] uppercase font-bold text-neutral-400 font-gaming">Entry Fee</div>
                            <div className="font-gaming text-sm font-bold text-amber-400">
                              {room.entryFee} Points <span className="text-neutral-500 text-[10px]">(रू {room.entryFee})</span>
                            </div>
                          </div>

                          <div className="px-3.5 py-1.5 rounded-xl bg-[#0A0A0A] border border-[#282828] text-right">
                            <div className="text-[10px] uppercase font-bold text-neutral-400 font-gaming">Prize Pool</div>
                            <div className="font-gaming text-sm font-bold text-emerald-400">
                              {room.prizePool} Points
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Credentials Display & Override Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                        
                        {/* Credentials Info Box */}
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0A0A0A] border border-[#222222] min-w-0">
                          <Key className="w-5 h-5 text-neutral-400 shrink-0" />
                          <div className="text-xs">
                            <div className="font-mono text-neutral-300">
                              Room ID: <strong className={hasCredentials ? 'text-emerald-400 font-bold' : 'text-neutral-500'}>{room.roomDetails.roomId}</strong>
                              {'  ·  '}
                              Pass: <strong className={hasCredentials ? 'text-emerald-400 font-bold' : 'text-neutral-500'}>{room.roomDetails.roomPassword}</strong>
                            </div>
                            <div className="text-[10px] text-neutral-500 mt-0.5">
                              Status: {room.roomDetails.isReleased ? (
                                <span className="text-emerald-400 font-semibold">Released to Players</span>
                              ) : (
                                <span className="text-amber-400 font-semibold">Locked until T-15m</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Admin Action Buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                          
                          {/* [EDIT CREDENTIALS] */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCredentialsTourney(room);
                              setNewRoomId(room.roomDetails.roomId === 'Waiting Host Setup' ? '' : room.roomDetails.roomId);
                              setNewRoomPassword(room.roomDetails.roomPassword === 'Waiting Host Setup' ? '' : room.roomDetails.roomPassword);
                              setReleaseImmediately(room.roomDetails.isReleased);
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-200 hover:text-white transition-colors cursor-pointer border border-neutral-700"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                            <span>Edit Credentials</span>
                          </button>

                          {/* [CANCEL MATCH & REFUND ALL] */}
                          {!isCancelled && !isCompleted && (
                            <button
                              type="button"
                              onClick={() => {
                                setCancellingTourney(room);
                                setCancelReasonInput('Host failed to provide room credentials 15 minutes before match start.');
                              }}
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/50 text-xs font-bold text-red-300 transition-colors cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5 text-red-400" />
                              <span>Cancel & Refund All</span>
                            </button>
                          )}

                          {/* [DISTRIBUTE PRIZES] */}
                          {!isCancelled && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTourneyId(room.id);
                                setAdminTab('prizes');
                              }}
                              className="btn-crimson flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer"
                            >
                              <Trophy className="w-3.5 h-3.5" />
                              <span>Distribute Prizes</span>
                            </button>
                          )}

                        </div>

                      </div>

                      {room.cancellationReason && (
                        <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>Cancellation & Refund Reason: {room.cancellationReason}</span>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: FULL USER & WALLET CONTROL                              */}
        {/* ============================================================== */}
        {adminTab === 'users' && (
          <div className="space-y-6">
            
            {/* Header & Search */}
            <div className="p-5 rounded-2xl bg-[#141414] border border-[#242424] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-2xl text-white font-extrabold uppercase">
                    User & Wallet Management
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Manual point override (Add / Deduct with mandatory audit note) and instant ban/unban toggles stored in database.
                  </p>
                </div>

                <div className="text-xs text-neutral-400 font-gaming">
                  Total Registered Players: <strong className="text-white text-sm">{users.length}</strong>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search user by In-Game Name (IGN), Free Fire UID, Phone Number, or Guild..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#262626] text-white text-xs placeholder:text-neutral-600 focus:outline-none focus:border-[#E50914]"
                />
              </div>
            </div>

            {/* Users Table / Card Grid */}
            <div className="space-y-3">
              {filteredUsers.map((user) => {
                const isBanned = user.status === 'BANNED';

                return (
                  <div
                    key={user.uid}
                    className={`p-4 sm:p-5 rounded-2xl bg-[#141414] border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                      isBanned 
                        ? 'border-red-500/40 bg-red-950/10' 
                        : 'border-[#242424] hover:border-[#333333]'
                    }`}
                  >
                    {/* User Identity Info */}
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${
                        isBanned 
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40' 
                          : 'bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/40'
                      }`}>
                        {user.ign.charAt(0).toUpperCase()}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display font-extrabold text-base text-white">
                            {user.ign}
                          </span>
                          
                          {/* Status Badge */}
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isBanned
                              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          }`}>
                            {user.status || 'ACTIVE'}
                          </span>

                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-neutral-800 text-neutral-300 font-gaming">
                            {user.rank}
                          </span>
                        </div>

                        <div className="text-xs text-neutral-400 font-mono flex items-center gap-2 flex-wrap">
                          <span>UID: <strong className="text-white">{user.uid}</strong></span>
                          <span className="text-neutral-600">·</span>
                          <span>Phone: {user.phoneNumber}</span>
                          {user.guild && (
                            <>
                              <span className="text-neutral-600">·</span>
                              <span>Guild: {user.guild}</span>
                            </>
                          )}
                          <span className="text-neutral-600">·</span>
                          <span>Matches: {user.totalMatches} (Wins: {user.totalWins})</span>
                        </div>
                      </div>
                    </div>

                    {/* Wallet Points & Controls */}
                    <div className="flex items-center gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#222222] justify-between lg:justify-end">
                      
                      {/* Current Balance Display */}
                      <div className="px-4 py-2 rounded-xl bg-[#0A0A0A] border border-[#282828] text-right">
                        <div className="text-[10px] uppercase font-bold text-neutral-400 font-gaming">Wallet Points</div>
                        <div className="font-gaming text-base font-bold text-amber-400">
                          {user.walletPoints ?? 10} Pts <span className="text-neutral-500 text-xs">(= रू {user.walletPoints ?? 10})</span>
                        </div>
                      </div>

                      {/* Interactive Buttons */}
                      <div className="flex items-center gap-2">
                        
                        {/* [MANUAL POINT OVERRIDE] Modal Trigger */}
                        <button
                          type="button"
                          onClick={() => {
                            setOverrideModalUser(user);
                            setOverrideAction('ADD');
                            setOverrideAmount(50);
                            setOverrideNote('');
                            setOverrideError(null);
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold font-gaming transition-colors cursor-pointer"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>Point Override</span>
                        </button>

                        {/* [ACCOUNT STATUS TOGGLE] */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold font-gaming uppercase transition-colors cursor-pointer border ${
                            isBanned
                              ? 'bg-emerald-950/40 hover:bg-emerald-900/60 border-emerald-500/50 text-emerald-300'
                              : 'bg-red-950/40 hover:bg-red-900/60 border-red-500/50 text-red-300'
                          }`}
                        >
                          {isBanned ? <Unlock className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                          <span>{isBanned ? 'Unban User' : 'Ban User'}</span>
                        </button>

                      </div>

                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: MANUAL RESULT & PRIZE DISTRIBUTOR                       */}
        {/* ============================================================== */}
        {adminTab === 'prizes' && (
          <div className="space-y-6">
            
            <div className="p-4 rounded-2xl bg-[#141414] border border-[#242424]">
              <h3 className="font-display text-2xl text-white font-extrabold uppercase">
                Match Result & Prize Distributor Engine
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Set Kill Count and Placement Rank per player/team. Calculates winnings and credits player wallets directly in the shared database.
              </p>
            </div>

            {distributionSuccessMsg && (
              <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{distributionSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleConfirmDistribution} className="p-5 sm:p-7 rounded-2xl bg-[#141414] border border-[#242424] space-y-6">
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Select Tournament to Settle *
                </label>
                <select
                  value={selectedTourneyId}
                  onChange={(e) => setSelectedTourneyId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-[#2D2D2D] text-white text-xs font-gaming focus:border-[#E50914] focus:outline-none"
                >
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.map} · {t.mode} · Entry: {t.entryFee} Pts · Status: {t.status.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {selectedTournament && (
                <div className="space-y-6 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* Rank 1 */}
                    <div className="p-4 rounded-xl bg-[#0A0A0A] border border-amber-500/40 space-y-3">
                      <div className="flex items-center justify-between text-amber-400 font-gaming font-bold text-xs uppercase">
                        <span>🥇 Rank 1 (Champion)</span>
                        <span>{firstPlacePoints} Pts Base</span>
                      </div>

                      <div>
                        <label className="block text-[10px] text-neutral-400 uppercase font-semibold mb-1">
                          Team / Player IGN
                        </label>
                        <input
                          type="text"
                          required
                          value={firstPlaceTeam}
                          onChange={(e) => setFirstPlaceTeam(e.target.value)}
                          placeholder="e.g. Gorkha Warriors"
                          className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-[#282828] text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-neutral-400 uppercase font-semibold mb-1">
                          Kills Count
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={firstPlaceKills}
                          onChange={(e) => setFirstPlaceKills(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-[#282828] text-xs text-white font-mono"
                        />
                      </div>
                    </div>

                    {/* Rank 2 */}
                    <div className="p-4 rounded-xl bg-[#0A0A0A] border border-neutral-700 space-y-3">
                      <div className="flex items-center justify-between text-neutral-300 font-gaming font-bold text-xs uppercase">
                        <span>🥈 Rank 2</span>
                        <span>{secondPlacePoints} Pts Base</span>
                      </div>

                      <div>
                        <label className="block text-[10px] text-neutral-400 uppercase font-semibold mb-1">
                          Team / Player IGN
                        </label>
                        <input
                          type="text"
                          value={secondPlaceTeam}
                          onChange={(e) => setSecondPlaceTeam(e.target.value)}
                          placeholder="e.g. Royal Kathmandu"
                          className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-[#282828] text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-neutral-400 uppercase font-semibold mb-1">
                          Kills Count
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={secondPlaceKills}
                          onChange={(e) => setSecondPlaceKills(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-[#282828] text-xs text-white font-mono"
                        />
                      </div>
                    </div>

                    {/* Rank 3 */}
                    <div className="p-4 rounded-xl bg-[#0A0A0A] border border-amber-900/40 space-y-3">
                      <div className="flex items-center justify-between text-amber-600 font-gaming font-bold text-xs uppercase">
                        <span>🥉 Rank 3</span>
                        <span>{thirdPlacePoints} Pts Base</span>
                      </div>

                      <div>
                        <label className="block text-[10px] text-neutral-400 uppercase font-semibold mb-1">
                          Team / Player IGN
                        </label>
                        <input
                          type="text"
                          value={thirdPlaceTeam}
                          onChange={(e) => setThirdPlaceTeam(e.target.value)}
                          placeholder="e.g. Pokhara Squad"
                          className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-[#282828] text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-neutral-400 uppercase font-semibold mb-1">
                          Kills Count
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={thirdPlaceKills}
                          onChange={(e) => setThirdPlaceKills(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-[#282828] text-xs text-white font-mono"
                        />
                      </div>
                    </div>

                  </div>

                  <button
                    type="submit"
                    className="btn-crimson w-full py-4 text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Distribute Prizes & Credit Player Wallets
                  </button>
                </div>
              )}

            </form>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: KHALTI PAYOUTS / WITHDRAWALS                            */}
        {/* ============================================================== */}
        {adminTab === 'withdrawals' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#141414] border border-[#242424]">
              <h3 className="font-display text-2xl text-white font-extrabold uppercase">
                Player Khalti Withdrawal Requests
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Send funds to user Khalti accounts in Nepal and mark requests as completed.
              </p>
            </div>

            {withdrawalTransactions.length === 0 ? (
              <div className="py-12 text-center rounded-2xl bg-[#141414] border border-[#242424] text-xs text-neutral-500">
                No withdrawal requests submitted yet.
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawalTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-4 rounded-xl bg-[#141414] border border-[#242424] flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="font-bold text-white text-sm">
                        रू {tx.amount} NPR Payout ({tx.points} Points)
                      </div>
                      <div className="text-xs text-neutral-400 font-mono mt-0.5">
                        Target Khalti ID: <strong className="text-purple-300">{tx.khaltiNumber || 'Khalti ID'}</strong>
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">
                        Ref: {tx.referenceId} · {tx.date}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase ${
                        tx.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 6: PAYMENT & NOTICE BOARD SETTINGS                         */}
        {/* ============================================================== */}
        {adminTab === 'settings' && (
          <div className="space-y-6">
            
            {/* Success Alert */}
            {settingsSuccessNotice && (
              <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{settingsSuccessNotice}</span>
              </div>
            )}

            {/* 1. Admin Khalti Number & Static QR Verification */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#141414] border border-[#242424] space-y-6">
              <div className="flex items-center gap-3 border-b border-[#202020] pb-4">
                <div className="p-2.5 rounded-xl bg-[#E50914]/20 border border-[#E50914]/40 text-[#E50914]">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-gaming text-lg font-bold uppercase tracking-wider text-white">
                    Payment Gateway & Deposit Configuration
                  </h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Configure the receiver Khalti ID and verify static QR code asset for all player top-up deposits.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Admin Phone Number Form */}
                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                      Admin Khalti Mobile Number (Receiver ID) *
                    </label>
                    <input
                      type="text"
                      required
                      value={adminPhoneInput}
                      onChange={(e) => setAdminPhoneInput(e.target.value)}
                      placeholder="e.g. 9813362603"
                      className="w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-[#2D2D2D] text-white text-base font-mono focus:border-[#E50914] focus:outline-none"
                    />
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Saving this directly updates the database and reflects in the Khalti payment dialog for every player.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={settingsSaving}
                    className="btn-crimson flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{settingsSaving ? 'Saving to DB...' : 'Save Khalti Number to DB'}</span>
                  </button>
                </form>

                {/* Static Asset Verification */}
                <div className="p-4 rounded-xl bg-[#0B0B0B] border border-[#222222] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      Static QR Asset Status
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                      Preserved & Untouched
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-black border border-neutral-700 shrink-0 flex items-center justify-center p-1">
                      <img
                        src="/khalti-qr.png"
                        alt="Static Khalti QR"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          // Fallback to placeholder if not loaded
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="text-xs text-neutral-400 space-y-1">
                      <div className="font-mono text-white text-xs">/public/khalti-qr.png</div>
                      <div className="text-[11px] text-neutral-400">
                        Official NepalQR Khalti scanner asset. Guaranteed 100% scannable by all mobile banking and Khalti apps in Nepal.
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* 2. System Notice Board */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#141414] border border-[#242424] space-y-6">
              <div className="flex items-center gap-3 border-b border-[#202020] pb-4">
                <div className="p-2.5 rounded-xl bg-[#E50914]/20 border border-[#E50914]/40 text-[#E50914]">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-gaming text-lg font-bold uppercase tracking-wider text-white">
                    System Notice Board (Global Broadcast)
                  </h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Post announcements and urgent notices that save directly to the shared database for real-time display on the player app.
                  </p>
                </div>
              </div>

              {/* Notice Form */}
              <form onSubmit={handlePostNotice} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                    Announcement Headline / Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    placeholder="e.g. Free Fire Bermuda Solo Championship - Registrations Open!"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#2D2D2D] text-white text-xs focus:border-[#E50914] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                    Announcement Content *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={noticeContent}
                    onChange={(e) => setNoticeContent(e.target.value)}
                    placeholder="Provide details about tournaments, match rules, deposit bonuses, or server status..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#2D2D2D] text-white text-xs focus:border-[#E50914] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={noticePosting}
                  className="btn-crimson flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{noticePosting ? 'Broadcasting...' : 'Post Global Announcement to DB'}</span>
                </button>
              </form>

              {/* Active Notices List */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Active Global Announcements ({notices.length})
                </div>

                {notices.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#222222] text-xs text-neutral-500 italic">
                    No active announcements. Post a new announcement above to broadcast across all player screens.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notices.map((n) => (
                      <div
                        key={n.id}
                        className="p-3.5 rounded-xl bg-[#0A0A0A] border border-[#242424] flex items-start justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white uppercase">{n.title}</span>
                            <span className="text-[10px] text-neutral-500">{n.createdAt}</span>
                          </div>
                          <p className="text-xs text-neutral-400">{n.content}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => onDeleteNotice(n.id)}
                          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-red-950 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                          title="Delete Notice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </main>

      {/* ============================================================== */}
      {/* MODAL 1: MANUAL POINT OVERRIDE MODAL                           */}
      {/* ============================================================== */}
      {overrideModalUser && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#141414] border border-[#2B2B2B] rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <h4 className="font-display text-xl font-bold uppercase text-white">
                  Manual Point Override
                </h4>
              </div>
              <button
                onClick={() => setOverrideModalUser(null)}
                className="p-1 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target User Info */}
            <div className="p-3.5 rounded-xl bg-[#0A0A0A] border border-[#242424] flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-white">{overrideModalUser.ign}</div>
                <div className="text-xs text-neutral-400 font-mono">UID: {overrideModalUser.uid}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-neutral-400 uppercase font-gaming">Current Balance</div>
                <div className="font-gaming font-bold text-amber-400 text-sm">
                  {overrideModalUser.walletPoints ?? 10} Points
                </div>
              </div>
            </div>

            <form onSubmit={handlePointOverrideSubmit} className="space-y-4">
              
              {/* Action Selection (ADD or DEDUCT) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Select Action *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setOverrideAction('ADD')}
                    className={`py-2.5 rounded-xl text-xs font-bold font-gaming uppercase border cursor-pointer transition-all ${
                      overrideAction === 'ADD'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                        : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                    }`}
                  >
                    + ADD POINTS
                  </button>

                  <button
                    type="button"
                    onClick={() => setOverrideAction('DEDUCT')}
                    className={`py-2.5 rounded-xl text-xs font-bold font-gaming uppercase border cursor-pointer transition-all ${
                      overrideAction === 'DEDUCT'
                        ? 'bg-red-600 text-white border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                        : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                    }`}
                  >
                    - DEDUCT POINTS
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Points Amount *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={overrideAmount}
                  onChange={(e) => setOverrideAmount(Number(e.target.value))}
                  placeholder="e.g. 100"
                  className="w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-[#2D2D2D] text-white text-base font-mono focus:border-[#E50914] focus:outline-none"
                />
              </div>

              {/* Mandatory Audit Note */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Mandatory Audit Note *
                </label>
                <textarea
                  rows={3}
                  required
                  value={overrideNote}
                  onChange={(e) => setOverrideNote(e.target.value)}
                  placeholder="State the administrative reason for this balance adjustment (e.g. tournament dispute resolution, goodwill bonus, fraud rollback)..."
                  className="w-full px-3 py-2 rounded-xl bg-[#0A0A0A] border border-[#2D2D2D] text-white text-xs focus:border-[#E50914] focus:outline-none"
                />
              </div>

              {overrideError && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{overrideError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOverrideModalUser(null)}
                  className="px-4 py-2.5 rounded-xl bg-neutral-800 text-xs text-neutral-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={overrideSubmitting}
                  className="btn-crimson px-5 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                >
                  {overrideSubmitting ? 'Mutating Database...' : `Confirm ${overrideAction} Points in DB`}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: EDIT CREDENTIALS MODAL                                */}
      {/* ============================================================== */}
      {editingCredentialsTourney && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#141414] border border-[#2B2B2B] rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                <h4 className="font-display text-xl font-bold uppercase text-white">
                  Override Room Credentials
                </h4>
              </div>
              <button
                onClick={() => setEditingCredentialsTourney(null)}
                className="p-1 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-300">
              Editing Free Fire Room ID and Password for <strong>{editingCredentialsTourney.title}</strong>.
            </p>

            <form onSubmit={handleSaveCredentials} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Free Fire Custom Room ID *
                </label>
                <input
                  type="text"
                  required
                  value={newRoomId}
                  onChange={(e) => setNewRoomId(e.target.value)}
                  placeholder="e.g. 48291038"
                  className="w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-[#2D2D2D] text-white text-sm font-mono focus:border-[#E50914] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Custom Room Password *
                </label>
                <input
                  type="text"
                  required
                  value={newRoomPassword}
                  onChange={(e) => setNewRoomPassword(e.target.value)}
                  placeholder="e.g. 1234"
                  className="w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-[#2D2D2D] text-white text-sm font-mono focus:border-[#E50914] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#0A0A0A] border border-[#242424]">
                <input
                  type="checkbox"
                  id="releaseImmediatelyCheckbox"
                  checked={releaseImmediately}
                  onChange={(e) => setReleaseImmediately(e.target.checked)}
                  className="w-4 h-4 accent-[#E50914] rounded cursor-pointer"
                />
                <label htmlFor="releaseImmediatelyCheckbox" className="text-xs text-neutral-200 cursor-pointer">
                  Release credentials immediately to registered players (bypass T-15m lock)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCredentialsTourney(null)}
                  className="px-4 py-2.5 rounded-xl bg-neutral-800 text-xs text-neutral-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={credSubmitting}
                  className="btn-crimson px-5 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                >
                  {credSubmitting ? 'Saving to DB...' : 'Save Credentials in DB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: CANCEL MATCH & REFUND ALL DIALOG                      */}
      {/* ============================================================== */}
      {cancellingTourney && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#141414] border border-red-500/50 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h4 className="font-display text-xl font-bold uppercase text-red-400">
                  Cancel Match & Refund All
                </h4>
              </div>
              <button
                onClick={() => setCancellingTourney(null)}
                className="p-1 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/30 text-xs text-red-200 space-y-1">
              <div>Are you sure you want to cancel <strong>{cancellingTourney.title}</strong>?</div>
              <div className="text-[11px] text-neutral-300">
                This will instantly refund <strong>{cancellingTourney.entryFee} Points</strong> back to each of the <strong>{cancellingTourney.registeredTeams.length} registered player wallets</strong> directly in the database.
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Reason for Cancellation (Shown to Players) *
              </label>
              <textarea
                rows={3}
                required
                value={cancelReasonInput}
                onChange={(e) => setCancelReasonInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0A0A0A] border border-[#2D2D2D] text-white text-xs focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancellingTourney(null)}
                className="px-4 py-2.5 rounded-xl bg-neutral-800 text-xs text-neutral-300 hover:text-white cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={cancelSubmitting}
                onClick={handleConfirmCancelRefund}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white uppercase tracking-wider cursor-pointer disabled:opacity-50"
              >
                {cancelSubmitting ? 'Processing Refunds...' : 'Confirm Cancel & Refund All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: REJECT KHALTI DEPOSIT MODAL                           */}
      {/* ============================================================== */}
      {rejectingTx && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#141414] border border-[#2B2B2B] rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between text-white border-b border-[#222222] pb-3">
              <h4 className="font-display text-xl font-bold uppercase text-red-400">
                Reject Khalti Deposit Request
              </h4>
              <button
                onClick={() => setRejectingTx(null)}
                className="p-1 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-300">
              You are rejecting the deposit of <strong>रू {rejectingTx.amount}</strong> (TxnID: <strong>{rejectingTx.txnId || rejectingTx.referenceId}</strong>).
            </p>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Reason for Rejection *
              </label>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  if (rejectReasonError) setRejectReasonError(null);
                }}
                className="w-full px-3 py-2 rounded-xl bg-[#0A0A0A] border border-[#2D2D2D] text-white text-xs focus:border-red-500 focus:outline-none"
              />
              {rejectReasonError && (
                <div className="text-xs text-red-400 mt-1 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{rejectReasonError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectingTx(null);
                  setRejectReasonError(null);
                }}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-xs text-neutral-300 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const trimmed = rejectReason.trim();
                  if (!trimmed) {
                    setRejectReasonError('Please provide a descriptive reason for rejecting this deposit.');
                    return;
                  }
                  if (trimmed.length < 5) {
                    setRejectReasonError('Rejection reason must be at least 5 characters long.');
                    return;
                  }
                  onRejectDeposit(rejectingTx.id, trimmed);
                  setRejectingTx(null);
                  setRejectReasonError(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: FULL-SCREEN SCREENSHOT PREVIEW MODAL                  */}
      {/* ============================================================== */}
      {viewingScreenshot && (
        <div 
          onClick={() => setViewingScreenshot(null)}
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-lg w-full bg-[#141414] border border-[#2B2B2B] rounded-2xl p-4 shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between text-white border-b border-[#222222] pb-2">
              <div className="text-xs font-bold uppercase tracking-wider">
                Submitted Khalti Payment Proof
              </div>
              <button
                onClick={() => setViewingScreenshot(null)}
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto rounded-xl bg-black flex items-center justify-center p-1">
              <img
                src={viewingScreenshot}
                alt="Proof screenshot"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>

            <button
              onClick={() => setViewingScreenshot(null)}
              className="btn-crimson w-full py-2.5 text-xs uppercase font-bold"
            >
              Close Viewer
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
