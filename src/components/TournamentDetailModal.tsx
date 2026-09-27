import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trophy, 
  Users, 
  Clock, 
  Coins, 
  ShieldCheck, 
  Copy, 
  Check, 
  Key, 
  AlertCircle, 
  ChevronRight,
  Flame,
  Award,
  Lock,
  Unlock,
  Settings,
  ShieldAlert,
  Smartphone,
  Save,
  CheckCircle2,
  Timer,
  Radio
} from 'lucide-react';
import { Tournament, UserProfile, TeamRegistration } from '../types';
import { getTournamentTimes, formatCountdown } from '../utils/timeUtils';

interface TournamentDetailModalProps {
  tournament: Tournament | null;
  onClose: () => void;
  userProfile: UserProfile;
  userPoints: number;
  onRegisterTeam: (tournamentId: string, registration: TeamRegistration, entryFee: number) => boolean;
  onOpenWallet: () => void;
  onUpdateHostRoomDetails?: (tournamentId: string, roomId: string, roomPassword: string, isReleased: boolean) => void;
  onCancelRegistration?: (tournamentId: string) => void;
  onCancelTournamentWithReason?: (tournamentId: string, reason: string) => void;
  onStartTournament?: (tournamentId: string) => void;
}

export const TournamentDetailModal: React.FC<TournamentDetailModalProps> = ({
  tournament,
  onClose,
  userProfile,
  userPoints,
  onRegisterTeam,
  onOpenWallet,
  onUpdateHostRoomDetails,
  onCancelRegistration,
  onCancelTournamentWithReason,
  onStartTournament,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'slots' | 'room' | 'host_controls' | 'results'>('overview');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [teamName, setTeamName] = useState(userProfile.guild || `${userProfile.ign}'s Squad`);
  const [copiedRoomId, setCopiedRoomId] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [cancelReasonInput, setCancelReasonInput] = useState('');
  const [cancelReasonError, setCancelReasonError] = useState<string | null>(null);
  const [showCancelRoomConfirm, setShowCancelRoomConfirm] = useState(false);
  const [showCancelEntryConfirm, setShowCancelEntryConfirm] = useState(false);

  // Dynamic tick for 1-second countdown updates
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Host Controls state
  const [hostRoomIdInput, setHostRoomIdInput] = useState(
    tournament?.roomDetails?.roomId === 'Waiting Host Setup' ? '' : (tournament?.roomDetails?.roomId || '')
  );
  const [hostPasswordInput, setHostPasswordInput] = useState(
    tournament?.roomDetails?.roomPassword === 'Waiting Host Setup' ? '' : (tournament?.roomDetails?.roomPassword || '')
  );
  const [hostSimulatedWithin15m, setHostSimulatedWithin15m] = useState(false);
  const [hostSavedSuccess, setHostSavedSuccess] = useState(false);

  useEffect(() => {
    if (tournament) {
      setHostRoomIdInput(
        tournament.roomDetails?.roomId === 'Waiting Host Setup' ? '' : (tournament.roomDetails?.roomId || '')
      );
      setHostPasswordInput(
        tournament.roomDetails?.roomPassword === 'Waiting Host Setup' ? '' : (tournament.roomDetails?.roomPassword || '')
      );
    }
  }, [tournament?.id, tournament?.roomDetails?.roomId, tournament?.roomDetails?.roomPassword]);

  if (!tournament) return null;

  const timing = getTournamentTimes(tournament);

  const isHost = userProfile.uid === tournament.host.uid || tournament.host.uid === 'HOST';

  // Check if current user is registered in this room
  const isUserRegistered = tournament.registeredTeams.some(
    (t) => t.captainUid === userProfile.uid || t.members.some((m) => m.uid === userProfile.uid)
  );

  const registeredUserTeam = tournament.registeredTeams.find(
    (t) => t.captainUid === userProfile.uid || t.members.some((m) => m.uid === userProfile.uid)
  );

  // Credential Security check:
  // Visible ONLY to players who joined this specific room AND strictly 15 minutes before the match!
  const isTimeWithin15m = 
    hostSimulatedWithin15m || 
    (tournament.startsInMinutes !== undefined && tournament.startsInMinutes <= 15) || 
    tournament.roomDetails.isReleased;

  const canViewCredentials = (isUserRegistered || isHost) && isTimeWithin15m;

  const handleCopy = (text: string, type: 'id' | 'pass') => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedRoomId(true);
      setTimeout(() => setCopiedRoomId(false), 2000);
    } else {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  // Handle Host Saving Room ID & Password (15 minutes before match start)
  const handleSaveHostCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostRoomIdInput.trim() || !hostPasswordInput.trim()) {
      setErrorMsg('Please enter both Room ID and Room Password.');
      return;
    }

    if (onUpdateHostRoomDetails) {
      onUpdateHostRoomDetails(
        tournament.id, 
        hostRoomIdInput.trim(), 
        hostPasswordInput.trim(), 
        true // Release credentials
      );
    }

    setHostSavedSuccess(true);
    setTimeout(() => setHostSavedSuccess(false), 3000);
  };

  // Handle Joining Room
  const handleConfirmRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedSlot) {
      setErrorMsg('Please click to select an empty slot number.');
      return;
    }

    // AUTOMATIC WALLET CHECK: user.points >= room.entryFee
    if (userPoints < tournament.entryFee) {
      setErrorMsg(
        `Insufficient wallet points! You have ${userPoints} Points, but this room requires ${tournament.entryFee} Points. Please recharge via Khalti.`
      );
      return;
    }

    const members = [{ ign: userProfile.ign, uid: userProfile.uid }];
    if (tournament.mode === 'Duo' || tournament.mode === 'Squad') {
      members.push({ ign: `${userProfile.ign}_P2`, uid: `${userProfile.uid}2` });
    }
    if (tournament.mode === 'Squad') {
      members.push({ ign: `${userProfile.ign}_P3`, uid: `${userProfile.uid}3` });
      members.push({ ign: `${userProfile.ign}_P4`, uid: `${userProfile.uid}4` });
    }

    const newRegistration: TeamRegistration = {
      slotNumber: selectedSlot,
      teamName: tournament.mode === 'Solo' ? userProfile.ign : (teamName.trim() || `${userProfile.ign}'s Squad`),
      captainIgn: userProfile.ign,
      captainUid: userProfile.uid,
      captainPhone: userProfile.phoneNumber,
      members,
      registeredAt: 'Just now',
    };

    // Deducts entry points and saves registration
    const success = onRegisterTeam(tournament.id, newRegistration, tournament.entryFee);
    if (success) {
      setSuccessMsg(
        `Successfully joined Slot #${selectedSlot}! Deducted ${tournament.entryFee} Points. Room ID & Password will unlock 15 minutes before match start.`
      );
      setActiveTab('room');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-[#141414] border border-[#2A2A2A] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-[#222222] bg-[#101010] flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-gaming font-bold text-[#FF2E3B] tracking-wider uppercase mb-1">
              <span>{tournament.mode} Match</span>
              <span aria-hidden="true">·</span>
              <span>Map: {tournament.map}</span>
              <span aria-hidden="true">·</span>
              <span className="text-amber-400 font-mono">Entry: {tournament.entryFee} Points</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl text-white font-extrabold uppercase tracking-wide leading-tight">
              {tournament.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center border-b border-[#222222] bg-[#0E0E0E] px-4 overflow-x-auto text-xs sm:text-sm font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'border-[#E50914] text-white font-bold'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Match Overview
          </button>

          <button
            onClick={() => setActiveTab('slots')}
            className={`py-3 px-3.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'slots'
                ? 'border-[#E50914] text-white font-bold'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <span>Slots & Teams</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-amber-400 font-mono">
              {tournament.registeredTeams.length}/{tournament.totalSlots}
            </span>
          </button>

          {/* Room ID & Pass Tab with Lock Indicator */}
          <button
            onClick={() => setActiveTab('room')}
            className={`py-3 px-3.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'room'
                ? 'border-[#E50914] text-white font-bold'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            {canViewCredentials ? (
              <Unlock className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>Room ID & Pass</span>
          </button>

          {/* Host Controls Tab (For the Tournament Host) */}
          {isHost && (
            <button
              onClick={() => setActiveTab('host_controls')}
              className={`py-3 px-3.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'host_controls'
                  ? 'border-[#E50914] text-white font-bold'
                  : 'border-transparent text-amber-400 hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              <span>Host Controls</span>
            </button>
          )}

          {tournament.results && (
            <button
              onClick={() => setActiveTab('results')}
              className={`py-3 px-3.5 border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'results'
                  ? 'border-[#E50914] text-white font-bold'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-yellow-500" />
              <span>Results</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Prize, Bounty, Entry Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#222222] text-center">
                  <div className="text-[11px] text-neutral-400 uppercase font-bold tracking-wider mb-1">
                    Prize Pool
                  </div>
                  <div className="font-gaming font-extrabold text-2xl text-amber-400 tabular-nums">
                    {tournament.prizePool.toLocaleString()} Pts
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">
                    रू {tournament.prizePool.toLocaleString()} NPR
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#222222] text-center">
                  <div className="text-[11px] text-neutral-400 uppercase font-bold tracking-wider mb-1">
                    Per Kill Bounty
                  </div>
                  <div className="font-gaming font-extrabold text-2xl text-[#FF2E3B] tabular-nums">
                    +{tournament.perKillBounty} Pts
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">
                    Per kill bonus
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#222222] text-center">
                  <div className="text-[11px] text-neutral-400 uppercase font-bold tracking-wider mb-1">
                    Entry Fee
                  </div>
                  <div className="font-gaming font-extrabold text-2xl text-white tabular-nums">
                    {tournament.entryFee} Pts
                  </div>
                  <div className="text-[10px] text-amber-400 font-semibold mt-0.5">
                    रू {tournament.entryFee} NPR
                  </div>
                </div>
              </div>

              {/* Cancelled Banner if cancelled */}
              {tournament.status === 'cancelled' && (
                <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/80 space-y-2">
                  <div className="font-bold text-red-400 text-sm uppercase flex items-center gap-1.5">
                    <ShieldAlert className="w-5 h-5 text-red-500" />
                    <span>Tournament / Room Cancelled & Refunded</span>
                  </div>
                  <p className="text-xs text-neutral-300">
                    <strong>Cancellation Reason:</strong> {tournament.cancellationReason || 'Match/Room error or timeout occurred.'}
                  </p>
                  <div className="text-[11px] text-emerald-400 font-semibold">
                    ✓ All registered entry fee points have been successfully refunded to player wallets.
                  </div>
                </div>
              )}

              {/* Room Schedule & Fixed Closing Countdown Box */}
              <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#262626] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-gaming font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#FF2E3B]" />
                    <span>Room Schedule & Fixed Closing Time</span>
                  </div>
                  <div className="text-xs text-neutral-400">
                    Match Time: <strong className="text-white">{tournament.startTime}</strong> · Fixed Auto-Close: <strong className="text-amber-400">{timing.formattedClosingTime}</strong>
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    Registration closes at match start. Room automatically closes and refunds entry points if host fails to start within the window.
                  </div>
                </div>

                <div className="shrink-0 p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-center min-w-[140px]">
                  <div className="text-[10px] uppercase font-bold text-neutral-400">
                    {tournament.status === 'cancelled' ? 'Status' : !timing.isStartReached ? 'Registration Closes In' : !timing.isClosingTimeReached ? 'Auto-Closing In' : 'Time Expired'}
                  </div>
                  <div className={`font-gaming font-extrabold text-lg tabular-nums ${tournament.status === 'cancelled' ? 'text-red-400' : !timing.isStartReached ? 'text-[#FF2E3B]' : !timing.isClosingTimeReached ? 'text-amber-400 animate-pulse' : 'text-red-400'}`}>
                    {tournament.status === 'cancelled' ? 'CLOSED' : !timing.isStartReached ? formatCountdown(timing.remainingSecondsToStart) : !timing.isClosingTimeReached ? formatCountdown(timing.remainingSecondsToClose) : 'CLOSING'}
                  </div>
                </div>
              </div>

              {/* Joined Status or Join Prompt */}
              {tournament.status !== 'cancelled' && (
                <>
                  {isUserRegistered ? (
                    <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-emerald-400 text-sm flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>You have joined this room! (Slot #{registeredUserTeam?.slotNumber})</span>
                          </div>
                          <div className="text-xs text-neutral-300 mt-0.5">
                            Team: {registeredUserTeam?.teamName} · Room credentials unlock 15 minutes before start.
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => setActiveTab('room')}
                            className="btn-crimson px-4 py-2 text-xs uppercase whitespace-nowrap cursor-pointer"
                          >
                            View Room Status
                          </button>
                          {tournament.status === 'upcoming' && onCancelRegistration && (
                            <button
                              type="button"
                              onClick={() => setShowCancelEntryConfirm(true)}
                              className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-red-950 border border-neutral-700 hover:border-red-500 text-neutral-300 hover:text-red-300 text-xs uppercase font-bold transition-colors cursor-pointer"
                            >
                              Cancel Entry & Refund
                            </button>
                          )}
                        </div>
                      </div>

                      {/* IN-MODAL CONFIRMATION: Cancel Entry */}
                      {showCancelEntryConfirm && (
                        <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/60 space-y-2 animate-in fade-in duration-200">
                          <div className="font-bold text-red-300 text-xs uppercase flex items-center gap-1.5">
                            <ShieldAlert className="w-4 h-4 text-red-400" />
                            <span>Leave Room & Refund Points?</span>
                          </div>
                          <p className="text-xs text-neutral-300">
                            Cancel your entry for Slot #{registeredUserTeam?.slotNumber}? You will leave the room and <strong className="text-amber-300">{tournament.entryFee} Points</strong> will be instantly refunded to your wallet.
                          </p>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (onCancelRegistration) {
                                  onCancelRegistration(tournament.id);
                                }
                                setShowCancelEntryConfirm(false);
                              }}
                              className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase cursor-pointer"
                            >
                              Confirm & Refund ({tournament.entryFee} Pts)
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowCancelEntryConfirm(false)}
                              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs cursor-pointer"
                            >
                              Keep My Slot
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : tournament.status === 'live' ? (
                    <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-emerald-300 text-sm flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                          <span>Match Already Started (LIVE)</span>
                        </div>
                        <div className="text-xs text-neutral-400 mt-0.5">
                          This match has already started. Joining is now closed.
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('room')}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-gaming text-xs font-bold uppercase cursor-pointer whitespace-nowrap"
                      >
                        View Room Status
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#262626] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-white text-sm">
                          Ready to Battle? Choose a slot to join.
                        </div>
                        <div className="text-xs text-neutral-400">
                          Entry fee of {tournament.entryFee} Points will be deducted from your wallet ({userPoints} Points available).
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('slots')}
                        className="btn-crimson px-5 py-2.5 text-xs uppercase tracking-wider font-bold whitespace-nowrap cursor-pointer"
                      >
                        Select Slot & Join ({tournament.entryFee} Pts)
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Host / Admin Room Emergency Cancellation & Refund Section */}
              {tournament.status === 'upcoming' && onCancelTournamentWithReason && (
                <div className="p-4 rounded-xl bg-[#140D0E] border border-red-500/30 space-y-3">
                  <div className="font-bold text-red-400 text-xs uppercase flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Room Error & Timeout Cancellation Engine (Host / Admin)</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    If any error occurs in the room/match (or if the host fails to start within the window), enter the reason below to close the room and automatically refund entry points to all registered users.
                  </p>
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={cancelReasonInput}
                        onChange={(e) => {
                          setCancelReasonInput(e.target.value);
                          if (cancelReasonError) setCancelReasonError(null);
                        }}
                        placeholder="Reason (e.g. Host absent / Room crashed / 15-min timeout)"
                        className="flex-1 px-3 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#2D2D2D] text-white text-xs focus:border-[#E50914] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const trimmed = cancelReasonInput.trim();
                          if (!trimmed) {
                            setCancelReasonError('Cancellation reason is required to explain the closure.');
                            return;
                          }
                          if (trimmed.length < 5) {
                            setCancelReasonError('Cancellation reason must be at least 5 characters long.');
                            return;
                          }
                          setCancelReasonError(null);
                          setShowCancelRoomConfirm(true);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-gaming text-xs font-bold uppercase transition-colors cursor-pointer shrink-0"
                      >
                        Cancel Room & Refund All
                      </button>
                    </div>
                    {cancelReasonError && (
                      <div className="text-xs text-red-400 mt-1.5 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{cancelReasonError}</span>
                      </div>
                    )}
                  </div>

                  {/* IN-MODAL CONFIRMATION: Cancel Room with Reason */}
                  {showCancelRoomConfirm && (
                    <div className="p-3.5 rounded-xl bg-red-950/90 border border-red-500/80 space-y-2.5 animate-in fade-in duration-200">
                      <div className="font-bold text-red-300 text-xs uppercase flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-red-400" />
                        <span>Confirm Room Cancellation & 100% Refund</span>
                      </div>
                      <p className="text-xs text-neutral-300">
                        Are you sure you want to cancel <strong className="text-white">"{tournament.title}"</strong> with reason: <span className="text-amber-300 italic">"{cancelReasonInput.trim()}"</span>? All registered players will be fully refunded.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (onCancelTournamentWithReason) {
                              onCancelTournamentWithReason(tournament.id, cancelReasonInput.trim());
                            }
                            setCancelReasonInput('');
                            setCancelReasonError(null);
                            setShowCancelRoomConfirm(false);
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase cursor-pointer"
                        >
                          Yes, Cancel Room & Refund All
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCancelRoomConfirm(false)}
                          className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs cursor-pointer"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Prize Distribution */}
              <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#222222]">
                <h4 className="font-gaming text-base font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Prize Distribution</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#141414] border border-[#262626]">
                    <span className="font-bold text-amber-400">🥇 Rank 1 (Booyah)</span>
                    <span className="font-gaming font-bold text-base text-white tabular-nums">
                      {tournament.payoutBreakdown.first} Points (रू {tournament.payoutBreakdown.first})
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#141414] border border-[#262626]">
                    <span className="font-bold text-neutral-300">🥈 Rank 2</span>
                    <span className="font-gaming font-bold text-base text-white tabular-nums">
                      {tournament.payoutBreakdown.second} Points (रू {tournament.payoutBreakdown.second})
                    </span>
                  </div>
                  {tournament.payoutBreakdown.third > 0 && (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#141414] border border-[#262626]">
                      <span className="font-bold text-amber-600">🥉 Rank 3</span>
                      <span className="font-gaming font-bold text-base text-white tabular-nums">
                        {tournament.payoutBreakdown.third} Points (रू {tournament.payoutBreakdown.third})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Rules & Host */}
              <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#222222] space-y-2 text-xs">
                <div className="flex items-center justify-between text-neutral-400">
                  <span>Host: <strong className="text-white">{tournament.host.name}</strong></span>
                  <span>Server: <strong className="text-white">{tournament.server}</strong></span>
                </div>
                <div className="text-neutral-400">
                  Rules: <span className="text-neutral-200">{tournament.roomDetails.customRules}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SLOTS & JOINING (AUTOMATIC WALLET DEDUCTION) */}
          {activeTab === 'slots' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-gaming text-lg font-bold text-white uppercase tracking-wider mb-1">
                  Select Your Slot ({tournament.registeredTeams.length}/{tournament.totalSlots} Joined)
                </h4>
                <p className="text-xs text-neutral-400">
                  Click on an available slot. Entry fee of <strong>{tournament.entryFee} Points</strong> will be automatically checked and deducted.
                </p>
              </div>

              {/* Slot Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {Array.from({ length: tournament.totalSlots }, (_, i) => i + 1).map((slotNum) => {
                  const reg = tournament.registeredTeams.find((t) => t.slotNumber === slotNum);
                  const isOccupied = !!reg;
                  const isSelected = selectedSlot === slotNum;
                  const isMySlot = reg?.captainUid === userProfile.uid;

                  return (
                    <button
                      key={slotNum}
                      type="button"
                      disabled={isOccupied}
                      onClick={() => setSelectedSlot(slotNum)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isMySlot
                          ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                          : isOccupied
                          ? 'bg-[#0A0A0A] border-[#1F1F1F] text-neutral-500 cursor-not-allowed'
                          : isSelected
                          ? 'bg-[#E50914]/20 border-[#FF2E3B] text-white shadow-[0_0_15px_rgba(255,46,59,0.4)]'
                          : 'bg-[#181818] border-[#2A2A2A] text-neutral-300 hover:border-neutral-500 hover:text-white cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold mb-1">
                        <span className="font-gaming text-sm">Slot #{slotNum}</span>
                        {isMySlot ? (
                          <span className="text-[10px] text-emerald-400 font-bold uppercase">Your Team</span>
                        ) : isOccupied ? (
                          <span className="text-[10px] text-neutral-500 uppercase">Taken</span>
                        ) : isSelected ? (
                          <span className="text-[10px] text-[#FF2E3B] font-bold uppercase">Selected</span>
                        ) : (
                          <span className="text-[10px] text-emerald-400 uppercase">Available</span>
                        )}
                      </div>
                      <div className="text-xs truncate font-medium">
                        {reg ? reg.teamName : 'Empty Slot'}
                      </div>
                      {reg && (
                        <div className="text-[10px] text-neutral-500 truncate mt-0.5">
                          Capt: {reg.captainIgn}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Slot Confirmation & Automatic Wallet Deduction Form */}
              {selectedSlot && !isUserRegistered && (
                <form onSubmit={handleConfirmRegister} className="p-4 sm:p-5 rounded-2xl bg-[#0A0A0A] border border-[#2B2B2B] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#222222] pb-3">
                    <h5 className="font-gaming text-base font-bold text-white uppercase tracking-wider">
                      Confirming Slot #{selectedSlot}
                    </h5>
                    <div className="text-xs font-gaming font-bold text-amber-400">
                      Required Entry Fee: {tournament.entryFee} Points
                    </div>
                  </div>

                  {tournament.mode !== 'Solo' && (
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1">
                        Team Name
                      </label>
                      <input
                        type="text"
                        required
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="e.g. Kathmandu Legends"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-[#333333] text-white focus:border-[#E50914] focus:outline-none text-sm"
                      />
                    </div>
                  )}

                  {/* Player Credentials */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">Player In-Game Name (IGN)</label>
                      <div className="px-3.5 py-2 rounded-xl bg-[#141414] border border-[#262626] font-gaming text-white font-bold">
                        {userProfile.ign}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">Free Fire UID</label>
                      <div className="px-3.5 py-2 rounded-xl bg-[#141414] border border-[#262626] font-mono text-white">
                        {userProfile.uid}
                      </div>
                    </div>
                  </div>

                  {/* Automatic Point Balance Check */}
                  <div className="p-3.5 rounded-xl bg-[#141414] border border-[#282828] flex items-center justify-between text-xs">
                    <div>
                      <span className="text-neutral-400">Your Current Wallet Points:</span>
                      <strong className={`ml-1.5 font-gaming text-sm ${userPoints >= tournament.entryFee ? 'text-emerald-400' : 'text-red-400'}`}>
                        {userPoints} Points
                      </strong>
                    </div>

                    <div className="text-right">
                      {userPoints >= tournament.entryFee ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Sufficient Balance</span>
                        </span>
                      ) : (
                        <span className="text-red-400 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Need {tournament.entryFee - userPoints} More Points</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action or Recharge */}
                  <div>
                    {userPoints < tournament.entryFee ? (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={onOpenWallet}
                          className="btn-crimson w-full py-3.5 text-xs uppercase tracking-wider font-bold"
                        >
                          Recharge Wallet via Khalti (+{tournament.entryFee - userPoints} Points)
                        </button>
                      </div>
                    ) : (
                      <button
                        type="submit"
                        className="btn-crimson w-full py-3.5 text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Coins className="w-4 h-4" />
                        <span>Pay {tournament.entryFee} Points & Join Slot #{selectedSlot}</span>
                      </button>
                    )}
                  </div>
                </form>
              )}

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-300">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300">
                  {successMsg}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ROOM ID & PASSWORD (STRICT 15-MINUTE & JOINED PLAYER SECURITY) */}
          {activeTab === 'room' && (
            <div className="space-y-5">
              
              {/* Security Banner */}
              <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#222222] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Custom Room Credential Security Engine</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-mono">Anti-Leak Protocol</span>
                </div>

                {/* SCENARIO 1: USER NOT JOINED */}
                {!isUserRegistered && !isHost && (
                  <div className="p-5 rounded-2xl bg-red-950/20 border border-red-500/40 text-center space-y-3">
                    <Lock className="w-10 h-10 text-red-400 mx-auto" />
                    <div>
                      <div className="font-display text-xl text-white font-bold uppercase">
                        Credentials Restricted
                      </div>
                      <p className="text-xs text-neutral-400 max-w-md mx-auto mt-1 leading-relaxed">
                        Room ID & Password stay strictly hidden and are visible <strong>ONLY to players who joined this specific room</strong>.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('slots')}
                      className="btn-crimson px-5 py-2.5 text-xs uppercase tracking-wider font-bold inline-flex items-center gap-2"
                    >
                      <Coins className="w-4 h-4" />
                      <span>Join Room ({tournament.entryFee} Points) to Get Access</span>
                    </button>
                  </div>
                )}

                {/* SCENARIO 2: USER JOINED, BUT MORE THAN 15 MINUTES BEFORE MATCH */}
                {(isUserRegistered || isHost) && !isTimeWithin15m && (
                  <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/40 text-center space-y-3">
                    <Clock className="w-10 h-10 text-amber-400 mx-auto animate-pulse" />
                    <div>
                      <div className="font-display text-xl text-white font-bold uppercase">
                        Credentials Locked (15-Minute Rule)
                      </div>
                      <p className="text-xs text-neutral-300 max-w-md mx-auto mt-1 leading-relaxed">
                        You have joined this match! According to fair-play rules, Room ID & Password stay strictly hidden until <strong>15 minutes before the match start time ({tournament.startTime})</strong>.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#141414] border border-[#2B2B2B] max-w-xs mx-auto text-xs text-neutral-400">
                      <span>Status: </span>
                      <strong className="text-amber-400">Locked Until T-15m</strong>
                    </div>

                    {/* Simulation toggle for quick evaluation */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setHostSimulatedWithin15m(true)}
                        className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[11px] text-neutral-300 hover:text-white cursor-pointer transition-colors"
                      >
                        ⚡ Simulate: Fast-Forward to 15m Window
                      </button>
                    </div>
                  </div>
                )}

                {/* SCENARIO 3: USER JOINED (OR HOST) AND WITHIN 15 MINUTES -> UNLOCKED! */}
                {canViewCredentials && (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 flex items-center justify-between text-xs text-emerald-300">
                      <div className="flex items-center gap-2">
                        <Unlock className="w-4 h-4 text-emerald-400" />
                        <span>Credentials Unlocked (Within 15-Minute Match Window)</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-emerald-400 font-mono">Live Access</span>
                    </div>

                    {tournament.roomDetails.roomId === 'Waiting Host Setup' ? (
                      <div className="p-4 rounded-xl bg-[#141414] border border-[#282828] text-center text-xs text-neutral-400 space-y-1">
                        <Clock className="w-6 h-6 text-amber-400 mx-auto" />
                        <div className="font-bold text-white">Host is creating the Free Fire Custom Room...</div>
                        <div>Credentials will appear here the moment the host pastes them.</div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Room ID Box */}
                        <div className="p-4 rounded-xl bg-[#141414] border border-[#2A2A2A] flex items-center justify-between">
                          <div>
                            <div className="text-[10px] text-neutral-400 uppercase font-semibold">
                              Custom Room ID
                            </div>
                            <div className="font-mono font-bold text-xl text-white tracking-widest mt-0.5">
                              {tournament.roomDetails.roomId}
                            </div>
                          </div>
                          <button
                            onClick={() => handleCopy(tournament.roomDetails.roomId, 'id')}
                            className="btn-crimson p-2 text-xs flex items-center gap-1.5 uppercase cursor-pointer"
                            title="Copy Room ID"
                          >
                            {copiedRoomId ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            <span className="text-[10px] font-bold">{copiedRoomId ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>

                        {/* Room Password Box */}
                        <div className="p-4 rounded-xl bg-[#141414] border border-[#2A2A2A] flex items-center justify-between">
                          <div>
                            <div className="text-[10px] text-neutral-400 uppercase font-semibold">
                              Room Password
                            </div>
                            <div className="font-mono font-bold text-xl text-[#FF2E3B] tracking-widest mt-0.5">
                              {tournament.roomDetails.roomPassword}
                            </div>
                          </div>
                          <button
                            onClick={() => handleCopy(tournament.roomDetails.roomPassword, 'pass')}
                            className="btn-crimson p-2 text-xs flex items-center gap-1.5 uppercase cursor-pointer"
                            title="Copy Password"
                          >
                            {copiedPass ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            <span className="text-[10px] font-bold">{copiedPass ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="p-3.5 rounded-xl bg-[#0A0A0A] border border-[#222222] text-xs text-neutral-300 space-y-1">
                      <div className="font-bold text-white">How to Join In-Game:</div>
                      <ol className="list-decimal list-inside space-y-1 text-neutral-400">
                        <li>Launch Free Fire on your mobile device.</li>
                        <li>Tap Mode Selection → <strong>Custom</strong>.</li>
                        <li>Search Room ID <strong className="text-white font-mono">{tournament.roomDetails.roomId}</strong>.</li>
                        <li>Enter Room Password <strong className="text-white font-mono">{tournament.roomDetails.roomPassword}</strong>.</li>
                        <li>Take your assigned slot only: <strong>Slot #{registeredUserTeam?.slotNumber || 'Your Slot'}</strong>.</li>
                      </ol>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* TAB 4: ROOM HOST CONTROLS (HOST CAN INPUT ROOM ID & PASSWORD 15M BEFORE START) */}
          {activeTab === 'host_controls' && isHost && (
            <div className="space-y-5">
              {/* START MATCH & GO LIVE OPTION */}
              {tournament.status === 'upcoming' && onStartTournament && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 to-[#141414] border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-emerald-300 text-sm uppercase flex items-center gap-1.5">
                      <Radio className="w-4 h-4 animate-pulse text-emerald-400" />
                      <span>Start Match & Go Live</span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      The host must hit Start before playing. This marks the room as LIVE, locks joining, and notifies all players.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onStartTournament(tournament.id);
                      setSuccessMsg('Match started successfully! Room is now LIVE.');
                      setTimeout(() => setSuccessMsg(''), 4000);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-gaming text-xs font-bold uppercase transition-colors cursor-pointer whitespace-nowrap shadow-lg shadow-emerald-900/40"
                  >
                    🟢 Start Match Now
                  </button>
                </div>
              )}

              <form onSubmit={handleSaveHostCredentials} className="space-y-5">
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/30 to-[#0A0A0A] border border-amber-500/40 text-xs text-neutral-300 space-y-1">
                <div className="font-bold text-amber-400 flex items-center gap-1.5 text-sm">
                  <Key className="w-4 h-4" />
                  <span>Room Host Credentials Control (15m Window)</span>
                </div>
                <p className="text-neutral-400 leading-relaxed">
                  As the match host, you must create the Free Fire custom room in-game and input the Room ID & Password here 15 minutes before the match start time. Joined players will immediately receive access.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#0A0A0A] border border-[#262626] space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                    Free Fire Custom Room ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={hostRoomIdInput}
                    onChange={(e) => setHostRoomIdInput(e.target.value)}
                    placeholder="e.g. 98402910"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-[#2D2D2D] text-white focus:border-[#E50914] focus:outline-none text-base font-mono tracking-widest font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                    Room Password *
                  </label>
                  <input
                    type="text"
                    required
                    value={hostPasswordInput}
                    onChange={(e) => setHostPasswordInput(e.target.value)}
                    placeholder="e.g. NEPAL99"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-[#2D2D2D] text-white focus:border-[#E50914] focus:outline-none text-base font-mono tracking-widest font-bold"
                  />
                </div>

                {hostSavedSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Credentials saved and published to joined players!</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    className="btn-crimson w-full py-3.5 text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Publish Credentials to Joined Players</span>
                  </button>
                </div>
              </div>
            </form>
            </div>
          )}

          {/* TAB 5: RESULTS */}
          {activeTab === 'results' && tournament.results && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-[#0A0A0A] border border-amber-500/40 text-center space-y-2">
                <Trophy className="w-12 h-12 text-amber-400 mx-auto" />
                <div className="text-xs uppercase font-bold text-amber-400">Booyah Champion</div>
                <h3 className="font-display text-2xl text-white font-bold uppercase">
                  {tournament.results.winnerTeam}
                </h3>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#222222] bg-[#0F0F0F] flex items-center justify-between">
          <div className="text-xs text-neutral-400 flex items-center gap-1.5">
            <span>Your Points:</span>
            <span className="font-gaming font-bold text-white text-sm tabular-nums">
              {userPoints} Points
            </span>
          </div>

          <button
            onClick={onClose}
            className="btn-crimson px-5 py-2 text-xs uppercase tracking-wider font-bold cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
