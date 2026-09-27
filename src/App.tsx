import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Swords, 
  Flame, 
  Search, 
  Filter, 
  PlusCircle, 
  Coins, 
  ShieldCheck, 
  Smartphone, 
  Clock, 
  CheckCircle2, 
  Users, 
  ArrowRight,
  TrendingUp,
  Sparkles,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { Tournament, UserProfile, WalletTransaction, GameMode, TeamRegistration, SystemNotice, SystemSettings } from './types';
import { initialTournaments, initialUserProfile, initialTransactions } from './data/mockData';
import { getTournamentTimes } from './utils/timeUtils';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { HeroBanner } from './components/HeroBanner';
import { TournamentCard } from './components/TournamentCard';
import { TournamentDetailModal } from './components/TournamentDetailModal';
import { HostMatchModal } from './components/HostMatchModal';
import { WalletModal } from './components/WalletModal';
import { ProfileModal } from './components/ProfileModal';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import logoImg from './assets/images/khiladinepal_logo_1790422424911.jpg';

export default function App() {
  // Routing State for route /admin
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname === '/admin' || window.location.hash === '#/admin' ? '/admin' : '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/admin' || window.location.hash === '#/admin') {
        setCurrentPath('/admin');
      } else {
        setCurrentPath('/');
      }
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  // Persistence state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('ff_nepal_logged_in_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('ff_nepal_profile');
    return saved ? JSON.parse(saved) : (currentUser || initialUserProfile);
  });

  const [walletPoints, setWalletPoints] = useState<number>(() => {
    const saved = localStorage.getItem('ff_nepal_wallet');
    return saved ? Number(saved) : 10; // Starter points: exactly 10 pts
  });

  const handleLoginSuccess = (user: UserProfile & { walletPoints: number }) => {
    setCurrentUser(user);
    setUserProfile(user);
    setWalletPoints(user.walletPoints ?? 10);
    localStorage.setItem('ff_nepal_logged_in_user', JSON.stringify(user));
    showToast(`Welcome, ${user.ign}! (10 Pts loaded)`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ff_nepal_logged_in_user');
    showToast('Logged out successfully. Please login or sign up.');
  };

  const [tournaments, setTournaments] = useState<Tournament[]>(() => {
    const saved = localStorage.getItem('ff_nepal_tournaments');
    if (saved) {
      try {
        const parsed: Tournament[] = JSON.parse(saved);
        const userHosted = parsed.filter(t => !t.id.startsWith('ff-tourney-'));
        return userHosted;
      } catch {
        return initialTournaments;
      }
    }
    return initialTournaments;
  });

  const [transactions, setTransactions] = useState<WalletTransaction[]>(() => {
    const saved = localStorage.getItem('ff_nepal_transactions');
    return saved ? JSON.parse(saved) : initialTransactions;
  });

  // Shared Database State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({
    adminKhaltiNumber: '9813362603',
    minWithdrawal: 100,
    noticeBoardText: '',
  });
  const [notices, setNotices] = useState<SystemNotice[]>([]);

  // Real-Time Database Sync Engine (Every 5 seconds + on Mount)
  const refreshAppData = async () => {
    try {
      const data = await api.fetchAppData();
      if (data.users && data.users.length > 0) setUsers(data.users);
      if (data.tournaments) setTournaments(data.tournaments);
      if (data.transactions) setTransactions(data.transactions);
      if (data.settings) setSettings(data.settings);
      if (data.notices) setNotices(data.notices);

      // Sync active user balance & status from database
      if (currentUser?.uid) {
        const liveUser = data.users?.find(u => u.uid === currentUser.uid);
        if (liveUser) {
          setUserProfile(liveUser);
          if (liveUser.walletPoints !== undefined) {
            setWalletPoints(liveUser.walletPoints);
          }
          if (liveUser.status && liveUser.status !== currentUser.status) {
            setCurrentUser(prev => prev ? { ...prev, status: liveUser.status } : null);
          }
        }
      }
    } catch (err) {
      console.warn('Database fetch warning:', err);
    }
  };

  useEffect(() => {
    refreshAppData();
    const interval = setInterval(refreshAppData, 4000);
    return () => clearInterval(interval);
  }, [currentUser?.uid]);

  // Navigation & Modals state
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [isHostOpen, setIsHostOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters state
  const [selectedMode, setSelectedMode] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('ff_nepal_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('ff_nepal_wallet', walletPoints.toString());
  }, [walletPoints]);

  useEffect(() => {
    localStorage.setItem('ff_nepal_tournaments', JSON.stringify(tournaments));
  }, [tournaments]);

  useEffect(() => {
    localStorage.setItem('ff_nepal_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // AUTOMATED ROOM CLOSING & SCHEDULING ENGINE
  useEffect(() => {
    const checkAndAutoCloseRooms = () => {
      setTournaments((prevTournaments) => {
        let hasChanges = false;

        const updated = prevTournaments.map((t) => {
          // If already completed or cancelled, do not mutate
          if (t.status === 'completed' || t.status === 'cancelled') {
            return t;
          }

          const { isClosingTimeReached, isStartReached, remainingSecondsToStart } = getTournamentTimes(t);

          // 1. AUTO-CLOSE ROOM AT FIXED CLOSING TIME
          if (t.status === 'upcoming' && isClosingTimeReached) {
            hasChanges = true;

            // Auto-refund entry fee points to player if they joined
            const userReg = t.registeredTeams.find(
              (r) => r.captainUid === userProfile.uid || r.members.some((m) => m.uid === userProfile.uid)
            );

            if (userReg && t.entryFee > 0) {
              setWalletPoints((prevPts) => prevPts + t.entryFee);
              const refundTx: WalletTransaction = {
                id: `ref-autoclose-${Date.now()}-${t.id}`,
                type: 'refund',
                amount: t.entryFee,
                points: t.entryFee,
                date: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                status: 'completed',
                method: 'Tournament Refund',
                referenceId: `AUTOCLOSE-${t.id}`,
                note: `Fixed time room closure refund: ${t.title}`,
              };
              setTransactions((prevTxs) => [refundTx, ...prevTxs]);
              showToast(`Room "${t.title}" reached fixed closing time and closed. Entry fee (+${t.entryFee} Pts) was refunded.`);
            }

            const updatedTourney: Tournament = {
              ...t,
              status: 'cancelled',
              cancellationReason: 'Room auto-closed at scheduled closing time. Match launch window expired without host start. Full entry fee refunded.',
              cancelledAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            };

            if (selectedTournament?.id === t.id) {
              setSelectedTournament(updatedTourney);
            }

            return updatedTourney;
          }

          // 2. AUTO-TRANSITION TO LIVE WHEN START TIME ARRIVES AND CREDENTIALS ARE READY
          if (t.status === 'upcoming' && isStartReached) {
            if (t.roomDetails.roomId && t.roomDetails.roomId !== 'Waiting Host Setup' && t.roomDetails.isReleased) {
              hasChanges = true;
              const liveTourney: Tournament = {
                ...t,
                status: 'live',
              };
              if (selectedTournament?.id === t.id) {
                setSelectedTournament(liveTourney);
              }
              return liveTourney;
            }
          }

          // 3. SYNCHRONIZE REMAINING MINUTES
          const remainingMinutes = Math.max(0, Math.ceil(remainingSecondsToStart / 60));
          if (t.startsInMinutes !== remainingMinutes) {
            hasChanges = true;
            return {
              ...t,
              startsInMinutes: remainingMinutes,
            };
          }

          return t;
        });

        return hasChanges ? updated : prevTournaments;
      });
    };

    checkAndAutoCloseRooms();
    const interval = setInterval(checkAndAutoCloseRooms, 2000);
    return () => clearInterval(interval);
  }, [userProfile.uid, selectedTournament?.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Tournament Registration Handler
  const handleRegisterTeam = (tournamentId: string, registration: TeamRegistration, entryFee: number): boolean => {
    if (userProfile.status === 'BANNED') {
      showToast('⛔ Your account has been BANNED by Admin. Tournament participation is blocked.');
      return false;
    }
    if (walletPoints < entryFee) {
      showToast('Insufficient wallet balance. Please recharge.');
      return false;
    }

    // Deduct points
    if (entryFee > 0) {
      setWalletPoints((prev) => prev - entryFee);
      const newTx: WalletTransaction = {
        id: `tx-${Date.now()}`,
        type: 'entry_fee',
        amount: entryFee,
        points: entryFee,
        date: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        status: 'completed',
        method: 'Tournament Entry',
        referenceId: `REG-${registration.slotNumber}`,
        note: `Joined Slot #${registration.slotNumber} (${registration.teamName})`,
      };
      setTransactions((prev) => [newTx, ...prev]);
    }

    // Update tournament slots
    setTournaments((prev) =>
      prev.map((t) => {
        if (t.id === tournamentId) {
          const updated = {
            ...t,
            registeredTeams: [...t.registeredTeams, registration],
          };
          // If modal is open for this tournament, update selected
          if (selectedTournament?.id === tournamentId) {
            setSelectedTournament(updated);
          }
          return updated;
        }
        return t;
      })
    );

    // Update player match stats
    setUserProfile((prev) => ({
      ...prev,
      totalMatches: prev.totalMatches + 1,
    }));

    showToast(`Registered for Slot #${registration.slotNumber}! ${entryFee > 0 ? `${entryFee} Points deducted.` : 'Free Entry!'}`);
    return true;
  };

  // Cancel Registration / Leave Tournament Handler (Refunds entry fee points)
  const handleCancelRegistration = (tournamentId: string) => {
    const targetTournament = tournaments.find((t) => t.id === tournamentId);
    if (!targetTournament) return;

    const userReg = targetTournament.registeredTeams.find(
      (r) => r.captainUid === userProfile.uid || r.members.some((m) => m.uid === userProfile.uid)
    );

    if (!userReg) {
      showToast('You are not registered in this tournament.');
      return;
    }

    if (targetTournament.status !== 'upcoming') {
      showToast('Cannot cancel registration. Tournament has already started or completed.');
      return;
    }

    const entryFee = targetTournament.entryFee;

    // 1. Refund entry fee to wallet points
    if (entryFee > 0) {
      setWalletPoints((prev) => prev + entryFee);
      const refundTx: WalletTransaction = {
        id: `ref-${Date.now()}`,
        type: 'refund',
        amount: entryFee,
        points: entryFee,
        date: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        status: 'completed',
        method: 'Tournament Refund',
        referenceId: `CANC-${tournamentId}`,
        note: `Refund for cancelling registration in ${targetTournament.title} (Slot #${userReg.slotNumber})`,
      };
      setTransactions((prev) => [refundTx, ...prev]);
    }

    // 2. Remove team from registered teams
    setTournaments((prev) =>
      prev.map((t) => {
        if (t.id === tournamentId) {
          const updated = {
            ...t,
            registeredTeams: t.registeredTeams.filter((r) => r.captainUid !== userProfile.uid && !r.members.some((m) => m.uid === userProfile.uid)),
          };
          if (selectedTournament?.id === tournamentId) {
            setSelectedTournament(updated);
          }
          return updated;
        }
        return t;
      })
    );

    // 3. Update player stats
    setUserProfile((prev) => ({
      ...prev,
      totalMatches: Math.max(0, prev.totalMatches - 1),
    }));

    showToast(`Registration cancelled successfully! ${entryFee > 0 ? `+${entryFee} Points refunded to your wallet.` : ''}`);
  };

  // Cancel Tournament / Room due to Error or Host Timeout (With Reason & Full Points Refund)
  const handleCancelTournamentWithReason = (tournamentId: string, reason: string) => {
    const targetTournament = tournaments.find((t) => t.id === tournamentId);
    if (!targetTournament) return;

    if (targetTournament.status === 'completed' || targetTournament.status === 'cancelled') {
      showToast('Tournament is already completed or cancelled.');
      return;
    }

    const entryFee = targetTournament.entryFee;

    // Check if current user was registered and needs refund
    const userReg = targetTournament.registeredTeams.find(
      (r) => r.captainUid === userProfile.uid || r.members.some((m) => m.uid === userProfile.uid)
    );

    if (userReg && entryFee > 0) {
      setWalletPoints((prev) => prev + entryFee);
      const refundTx: WalletTransaction = {
        id: `ref-err-${Date.now()}`,
        type: 'refund',
        amount: entryFee,
        points: entryFee,
        date: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        status: 'completed',
        method: 'Tournament Refund',
        referenceId: `ERR-CANC-${tournamentId}`,
        note: `Room/Match Cancelled & Refunded. Reason: ${reason}`,
      };
      setTransactions((prev) => [refundTx, ...prev]);
    }

    // Update tournament status to cancelled with reason
    setTournaments((prev) =>
      prev.map((t) => {
        if (t.id === tournamentId) {
          const updated = {
            ...t,
            status: 'cancelled' as const,
            cancellationReason: reason,
            cancelledAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          };
          if (selectedTournament?.id === tournamentId) {
            setSelectedTournament(updated);
          }
          return updated;
        }
        return t;
      })
    );

    showToast(`Tournament cancelled due to: "${reason}". ${entryFee > 0 && userReg ? `+${entryFee} Points refunded!` : ''}`);
  };

  // Host Tournament Handler
  const handleCreateTournament = (newTournament: Tournament) => {
    setTournaments((prev) => [newTournament, ...prev]);
    showToast(`Tournament "${newTournament.title}" created successfully!`);
    setActiveTab('tournaments');
  };

  // Manual Khalti Deposit Handler
  const handleSubmitManualKhaltiDeposit = ({
    amount,
    txnId,
    screenshotUrl,
    senderKhaltiId,
  }: {
    amount: number;
    txnId: string;
    screenshotUrl?: string;
    senderKhaltiId?: string;
  }) => {
    // 1 NPR Deposited = 1 App Point Credited upon admin approval
    const newTx: WalletTransaction = {
      id: `khalti-dep-${Date.now()}`,
      type: 'deposit',
      amount,
      points: amount,
      date: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      status: 'pending', // Saves request with status "PENDING"
      method: 'Khalti',
      referenceId: `KH-${Math.floor(100000 + Math.random() * 900000)}`,
      txnId,
      screenshotUrl,
      senderKhaltiId,
      note: `Khalti Deposit: रू ${amount} (TxnID: ${txnId})`,
    };

    setTransactions((prev) => [newTx, ...prev]);
    showToast(`Khalti deposit of रू ${amount} submitted! Status: PENDING (Admin verifying)`);
  };

  // Khalti Withdrawal Request Handler
  const handleRequestKhaltiWithdrawal = ({
    points,
    khaltiId,
  }: {
    points: number;
    khaltiId: string;
  }): boolean => {
    if (walletPoints < points) {
      showToast('Insufficient wallet balance.');
      return false;
    }

    // Deduct points from available balance and save request as PENDING
    setWalletPoints((prev) => prev - points);
    const newTx: WalletTransaction = {
      id: `khalti-wth-${Date.now()}`,
      type: 'withdraw',
      amount: points, // 1 Point = 1 NPR
      points,
      date: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      status: 'pending', // Saves request with status "PENDING"
      method: 'Khalti',
      referenceId: `WTH-KH-${Math.floor(100000 + Math.random() * 900000)}`,
      khaltiNumber: khaltiId,
      note: `Khalti Payout to ${khaltiId} (Pending)`,
    };

    setTransactions((prev) => [newTx, ...prev]);
    showToast(`Withdrawal of ${points} Points (रू ${points}) to Khalti (${khaltiId}) requested! Status: PENDING`);
    return true;
  };

  // Admin Approval for Pending Transactions (1 NPR = 1 Point Credited)
  const handleApprovePendingTransaction = (txId: string) => {
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id === txId && tx.status === 'pending') {
          if (tx.type === 'deposit') {
            // Rule: 1 NPR Deposited = 1 App Point Credited!
            setWalletPoints((curr) => curr + tx.points);
            showToast(`Deposit Approved! +${tx.points} Points credited to user wallet (1 NPR = 1 Pt).`);
          } else {
            showToast(`Withdrawal of रू ${tx.amount} marked as COMPLETED.`);
          }
          return {
            ...tx,
            status: 'completed' as const,
            reviewedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          };
        }
        return tx;
      })
    );
  };

  // Admin Rejection for Pending Deposit
  const handleRejectDeposit = (txId: string, reason: string) => {
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id === txId && tx.status === 'pending') {
          showToast(`Deposit rejected: ${reason}`);
          return {
            ...tx,
            status: 'failed' as const,
            rejectionReason: reason,
            reviewedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          };
        }
        return tx;
      })
    );
  };

  // Match Result & Prize Distribution Handler
  const handleDistributeMatchPrizes = (
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
  ) => {
    const targetTournament = tournaments.find((t) => t.id === tournamentId);

    // 1. Update tournament status to completed with official results
    setTournaments((prev) =>
      prev.map((t) => {
        if (t.id === tournamentId) {
          return {
            ...t,
            status: 'completed' as const,
            results: {
              winnerTeam: resultData.winnerTeam,
              topFragger: resultData.topFragger,
              topFraggerKills: resultData.topFraggerKills,
              resultScreenshot: resultData.resultScreenshot,
              settledAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              placementPayouts: resultData.placementPayouts,
            },
          };
        }
        return t;
      })
    );

    // 2. Check if current user is one of the winners and credit their account directly
    const userWinningPayout = resultData.placementPayouts.find((p) => {
      return (
        (p.captainUid && p.captainUid === userProfile.uid) ||
        p.teamName.toLowerCase().trim() === userProfile.ign.toLowerCase().trim() ||
        (userProfile.guild && p.teamName.toLowerCase().trim() === userProfile.guild.toLowerCase().trim())
      );
    });

    if (userWinningPayout && userWinningPayout.totalPointsWon > 0) {
      const wonPoints = userWinningPayout.totalPointsWon;
      setWalletPoints((prev) => prev + wonPoints);
      setUserProfile((prev) => ({
        ...prev,
        totalWins: userWinningPayout.rank === 1 ? prev.totalWins + 1 : prev.totalWins,
        totalEarnings: prev.totalEarnings + wonPoints,
      }));

      const winTx: WalletTransaction = {
        id: `win-${Date.now()}`,
        type: 'winning',
        amount: wonPoints,
        points: wonPoints,
        date: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        status: 'completed',
        method: 'Tournament Prize',
        referenceId: `WIN-${tournamentId}`,
        note: `Match Prize: ${targetTournament?.title || 'Tournament'} (Rank #${userWinningPayout.rank}, ${userWinningPayout.placementPoints} Pts + ${userWinningPayout.killPoints} Kill Pts)`,
      };
      setTransactions((prev) => [winTx, ...prev]);
      showToast(`Prizes Settled! Credited +${wonPoints} Points directly to your account!`);
    } else {
      showToast(`Match settled! Results published and prizes distributed to winners.`);
    }
  };

  // Host Room Details update (15m before start)
  const handleUpdateHostRoomDetails = (tournamentId: string, roomId: string, roomPassword: string, isReleased: boolean) => {
    setTournaments((prev) =>
      prev.map((t) => {
        if (t.id === tournamentId) {
          const updated = {
            ...t,
            roomDetails: {
              ...t.roomDetails,
              roomId,
              roomPassword,
              isReleased,
            },
          };
          if (selectedTournament?.id === tournamentId) {
            setSelectedTournament(updated);
          }
          return updated;
        }
        return t;
      })
    );
    showToast('Custom Room ID & Password saved and published to joined players!');
  };

  const handleStartTournament = async (tournamentId: string) => {
    try {
      const updated = await api.startTournament(tournamentId);
      if (updated) {
        setTournaments(prev => prev.map(t => t.id === tournamentId ? updated : t));
        if (selectedTournament?.id === tournamentId) {
          setSelectedTournament(updated);
        }
        showToast('Match started successfully! Room is now LIVE.');
        await refreshAppData();
      }
    } catch (e: any) {
      showToast(e.message || 'Failed to start tournament');
    }
  };

  // Filtered Tournaments
  const filteredTournaments = tournaments.filter((t) => {
    const matchesMode = selectedMode === 'All' || t.mode === selectedMode;
    const matchesStatus = selectedStatus === 'all' || t.status === selectedStatus;
    const matchesSearch = 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.map.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.mode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMode && matchesStatus && matchesSearch;
  });

  // Registered Matches for Quick Access Banner
  const myRegisteredTournaments = tournaments.filter((t) =>
    t.registeredTeams.some((r) => r.captainUid === userProfile.uid || r.members.some((m) => m.uid === userProfile.uid))
  );

  // Admin Shared DB Mutation Handlers
  const handlePointOverride = async (uid: string, action: 'ADD' | 'DEDUCT', amount: number, note: string) => {
    const res = await api.pointOverride(uid, action, amount, note);
    await refreshAppData();
    if (currentUser && currentUser.uid === uid) {
      setWalletPoints(res.newBalance);
      setUserProfile(prev => ({ ...prev, walletPoints: res.newBalance }));
    }
  };

  const handleToggleUserStatus = async (uid: string) => {
    const res = await api.toggleUserStatus(uid);
    await refreshAppData();
    if (currentUser && currentUser.uid === uid) {
      setCurrentUser(prev => prev ? { ...prev, status: res.status } : null);
      setUserProfile(prev => ({ ...prev, status: res.status }));
    }
  };

  const handleAdminUpdateRoomCredentials = async (tournamentId: string, roomId: string, roomPassword: string, isReleased: boolean) => {
    await api.updateRoomCredentials(tournamentId, roomId, roomPassword, isReleased);
    await refreshAppData();
  };

  const handleAdminCancelMatchAndRefund = async (tournamentId: string, reason: string) => {
    await api.cancelTournamentAndRefund(tournamentId, reason);
    await refreshAppData();
  };

  const handleUpdateSettings = async (newSettings: Partial<SystemSettings>) => {
    const updated = await api.updateSettings(newSettings);
    setSettings(updated);
  };

  const handlePostNotice = async (title: string, content: string) => {
    await api.postNotice(title, content);
    await refreshAppData();
  };

  const handleDeleteNotice = async (id: string) => {
    await api.deleteNotice(id);
    await refreshAppData();
  };

  const handleOpenHostModal = () => {
    if (userProfile.status === 'BANNED') {
      showToast('⛔ Your account has been BANNED by Admin. Room creation is blocked.');
      return;
    }
    setIsHostOpen(true);
  };

  // Check if routed to /admin
  if (currentPath === '/admin') {
    return (
      <AdminPanel
        userProfile={userProfile}
        walletPoints={walletPoints}
        tournaments={tournaments}
        transactions={transactions}
        users={users}
        settings={settings}
        notices={notices}
        onApproveDeposit={handleApprovePendingTransaction}
        onRejectDeposit={handleRejectDeposit}
        onDistributeMatchPrizes={handleDistributeMatchPrizes}
        onPointOverride={handlePointOverride}
        onToggleUserStatus={handleToggleUserStatus}
        onUpdateRoomCredentials={handleAdminUpdateRoomCredentials}
        onCancelMatchAndRefund={handleAdminCancelMatchAndRefund}
        onStartTournament={handleStartTournament}
        onUpdateSettings={handleUpdateSettings}
        onPostNotice={handlePostNotice}
        onDeleteNotice={handleDeleteNotice}
        onExitAdmin={() => navigateTo('/')}
        onRefreshData={refreshAppData}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-sans selection:bg-[#E50914] selection:text-white pb-20 md:pb-12">
      
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        walletPoints={walletPoints}
        userProfile={userProfile}
        onOpenWallet={() => setIsWalletOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenHost={handleOpenHostModal}
        onNavigateAdmin={() => navigateTo('/admin')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-4 sm:right-8 z-50 p-4 rounded-2xl bg-[#141414] border-2 border-[#E50914] text-white shadow-[0_0_25px_rgba(229,9,20,0.5)] flex items-center gap-3 animate-in slide-in-from-top duration-300">
            <Flame className="w-5 h-5 text-[#FF2E3B] shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* SYSTEM NOTICE BOARD (GLOBAL BROADCAST FROM ADMIN) */}
        {notices.length > 0 && notices[0]?.active && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/90 via-[#180608] to-red-950/90 border border-[#E50914]/50 shadow-[0_0_20px_rgba(229,9,20,0.2)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#E50914] flex items-center justify-center text-white shrink-0 shadow-[0_0_15px_rgba(229,9,20,0.5)]">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-600 text-white font-gaming tracking-wider">
                    Official Notice
                  </span>
                  <span className="text-[11px] text-neutral-400 font-mono">{notices[0].createdAt}</span>
                </div>
                <h4 className="font-gaming text-sm sm:text-base font-bold text-white uppercase tracking-wide">
                  {notices[0].title}
                </h4>
                <p className="text-xs text-neutral-300">
                  {notices[0].content}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Banned User Alert Banner */}
        {userProfile.status === 'BANNED' && (
          <div className="p-4 rounded-2xl bg-red-950/90 border-2 border-red-500 text-white flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-400 shrink-0" />
            <div>
              <div className="font-bold text-sm uppercase text-red-200">Account Suspended / Banned by Admin</div>
              <div className="text-xs text-neutral-300">
                Your account is currently flagged as BANNED in the database. Room creation and slot registrations are restricted. Contact admin support on WhatsApp or Khalti for account review.
              </div>
            </div>
          </div>
        )}

        {/* HERO BANNER - Highlighting 1 NPR = 1 Point & Free Fire Cash Tournaments Nepal */}
        {(activeTab === 'home' || activeTab === 'tournaments') && (
          <HeroBanner
            onExploreTournaments={() => {
              setActiveTab('tournaments');
              const el = document.getElementById('tournaments-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            onHostMatch={handleOpenHostModal}
            walletPoints={walletPoints}
          />
        )}

        {/* Active Registered Match Alert (If player has joined an upcoming/live match) */}
        {myRegisteredTournaments.length > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#171111] via-[#141414] to-[#171111] border border-[#E50914]/40 shadow-[0_0_20px_rgba(229,9,20,0.15)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E50914] flex items-center justify-center text-white shrink-0 shadow-[0_0_15px_rgba(229,9,20,0.5)]">
                <Flame className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-[11px] font-bold text-[#FF2E3B] uppercase tracking-wider font-gaming">
                  <span>Registered Active Match</span>
                  <span aria-hidden="true">·</span>
                  <span>{myRegisteredTournaments[0].startTime}</span>
                </div>
                <h4 className="font-display text-lg sm:text-xl text-white font-bold uppercase truncate max-w-lg">
                  {myRegisteredTournaments[0].title}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedTournament(myRegisteredTournaments[0])}
                className="btn-crimson px-5 py-2.5 text-xs uppercase tracking-wider font-bold whitespace-nowrap cursor-pointer"
              >
                View Room ID & Password
              </button>
            </div>
          </div>
        )}

        {/* TOURNAMENTS SECTION */}
        <section id="tournaments-section" className="space-y-6">
          
          {/* Section Header & Search */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#222222] pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-gaming font-bold text-[#FF2E3B] uppercase tracking-wider">
                <Swords className="w-4 h-4 text-[#E50914]" />
                <span>Live & Upcoming Cash Battles</span>
                <span aria-hidden="true">·</span>
                <span className="text-neutral-400">1 NPR = 1 Point</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl text-white font-extrabold uppercase tracking-wide mt-1">
                Featured Tournaments
              </h2>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search mode, map, title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#141414] border border-[#2B2B2B] text-white text-xs placeholder:text-neutral-500 focus:border-[#E50914] focus:outline-none"
              />
            </div>
          </div>

          {/* Interactive Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 overflow-x-auto pb-2">
            
            {/* Game Mode Segmented Buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-[#141414] rounded-xl border border-[#242424] shrink-0">
              {['All', 'Solo', 'Duo', 'Squad'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSelectedMode(mode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-gaming font-bold uppercase transition-all cursor-pointer whitespace-nowrap ${
                    selectedMode === mode
                      ? 'bg-[#E50914] text-white shadow-[0_0_12px_rgba(229,9,20,0.5)]'
                      : 'text-neutral-400 hover:text-white hover:bg-[#1E1E1E]'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Status Segmented Buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-[#141414] rounded-xl border border-[#242424] shrink-0">
              {[
                { label: 'All Matches', value: 'all' },
                { label: 'Open', value: 'upcoming' },
                { label: 'Live', value: 'live' },
                { label: 'Finished', value: 'completed' },
              ].map((st) => (
                <button
                  key={st.value}
                  onClick={() => setSelectedStatus(st.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedStatus === st.value
                      ? 'bg-[#2A2A2A] text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

          </div>

          {/* Tournament Grid */}
          {filteredTournaments.length === 0 ? (
            <div className="py-16 text-center rounded-2xl bg-[#141414] border border-[#222222] p-8 space-y-3">
              <Swords className="w-12 h-12 text-neutral-600 mx-auto" />
              <h3 className="font-display text-2xl text-white font-bold uppercase">
                No Tournaments Found
              </h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                No matches match your current filter settings. Try selecting "All" or host your own custom tournament!
              </p>
              <button
                onClick={() => setIsHostOpen(true)}
                className="btn-crimson inline-flex items-center gap-2 px-5 py-2.5 text-xs uppercase font-bold mt-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Host A Tournament</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTournaments.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  onSelect={(t) => setSelectedTournament(t)}
                  userPoints={walletPoints}
                  userUid={userProfile.uid}
                />
              ))}
            </div>
          )}

        </section>

        {/* HOW IT WORKS IN NEPAL SECTION */}
        <section className="rounded-2xl sm:rounded-3xl bg-[#141414] border border-[#242424] p-6 sm:p-10 space-y-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-gaming font-bold text-[#FF2E3B] uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-[#E50914]" />
              <span>Simple 4-Step Process</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl text-white font-extrabold uppercase tracking-wide">
              How To Play & Win Cash
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              Nepal's fastest automated Free Fire tournament platform with instant eSewa and Khalti payouts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            
            {/* Step 1 */}
            <div className="p-5 rounded-2xl bg-[#0A0A0A] border border-[#222222] space-y-3 relative group hover:border-[#E50914]/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-[#E50914]/50 flex items-center justify-center font-display text-xl font-bold text-[#FF2E3B]">
                01
              </div>
              <h3 className="font-display text-xl font-bold text-white uppercase">
                Setup Game Profile
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Add your Free Fire In-Game Name (IGN), numeric Free Fire UID, and phone number in your profile.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-2xl bg-[#0A0A0A] border border-[#222222] space-y-3 relative group hover:border-[#E50914]/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-[#E50914]/50 flex items-center justify-center font-display text-xl font-bold text-[#FF2E3B]">
                02
              </div>
              <h3 className="font-display text-xl font-bold text-white uppercase">
                Load Points (1 NPR = 1 Pt)
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Deposit points using eSewa, Khalti, or IME Pay with zero conversion fee. 1 NPR directly equals 1 Point.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-2xl bg-[#0A0A0A] border border-[#222222] space-y-3 relative group hover:border-[#E50914]/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-[#E50914]/50 flex items-center justify-center font-display text-xl font-bold text-[#FF2E3B]">
                03
              </div>
              <h3 className="font-display text-xl font-bold text-white uppercase">
                Join Slot & Get Room ID
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Select your preferred slot. Room ID & Password are delivered automatically 15 mins before match time.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-5 rounded-2xl bg-[#0A0A0A] border border-[#222222] space-y-3 relative group hover:border-[#E50914]/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-[#E50914]/50 flex items-center justify-center font-display text-xl font-bold text-[#FF2E3B]">
                04
              </div>
              <h3 className="font-display text-xl font-bold text-white uppercase">
                Booyah & Instant Cash Out
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Win rank prizes + per-kill bounties. Withdraw winnings straight to your eSewa or Khalti account in minutes.
              </p>
            </div>

          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#1C1C1C] bg-[#0A0A0A] py-8 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#E50914]/50 shadow">
              <img src={logoImg} alt="Khiladi Nepal Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <span className="font-display text-lg text-white font-bold uppercase">
              KHILADI<span className="text-[#E50914]">NEPAL</span> ESPORTS
            </span>
          </div>
          <div className="text-center sm:text-right space-y-1">
            <div>© {new Date().getFullYear()} Khiladi Nepal - Free Fire Cash Tournament Platform. 1 NPR = 1 Point.</div>
            <div className="flex items-center justify-center sm:justify-end gap-3 text-[10px] text-neutral-600">
              <span>Not affiliated with Garena Free Fire.</span>
              <span>·</span>
              <button 
                onClick={() => navigateTo('/admin')} 
                className="text-purple-400 hover:text-purple-300 font-bold uppercase tracking-wider cursor-pointer"
              >
                Admin Portal (/admin)
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* MOBILE BOTTOM NAVIGATION DOCK (Thumb Ergonomics) */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'tournaments') {
            const el = document.getElementById('tournaments-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        walletPoints={walletPoints}
        onOpenHost={handleOpenHostModal}
        onOpenWallet={() => setIsWalletOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* MODALS */}
      <TournamentDetailModal
        tournament={selectedTournament}
        onClose={() => setSelectedTournament(null)}
        userProfile={userProfile}
        userPoints={walletPoints}
        onRegisterTeam={handleRegisterTeam}
        onOpenWallet={() => {
          setSelectedTournament(null);
          setIsWalletOpen(true);
        }}
        onUpdateHostRoomDetails={handleUpdateHostRoomDetails}
        onCancelRegistration={handleCancelRegistration}
        onCancelTournamentWithReason={handleCancelTournamentWithReason}
        onStartTournament={handleStartTournament}
      />

      <HostMatchModal
        isOpen={isHostOpen}
        onClose={() => setIsHostOpen(false)}
        userProfile={userProfile}
        onCreateTournament={handleCreateTournament}
      />

      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        walletPoints={walletPoints}
        transactions={transactions}
        userProfile={userProfile}
        adminKhaltiNumber={settings.adminKhaltiNumber}
        onSubmitManualKhaltiDeposit={handleSubmitManualKhaltiDeposit}
        onRequestKhaltiWithdrawal={handleRequestKhaltiWithdrawal}
        onApprovePendingTransaction={handleApprovePendingTransaction}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userProfile={userProfile}
        onUpdateProfile={(updated) => {
          setUserProfile(updated);
          showToast('Profile updated successfully!');
        }}
        walletPoints={walletPoints}
        onLogout={handleLogout}
      />

      <AuthModal
        isOpen={!currentUser}
        onLoginSuccess={handleLoginSuccess}
        onNavigateAdmin={() => navigateTo('/admin')}
      />

    </div>
  );
}
