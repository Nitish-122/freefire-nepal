import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Users, 
  Clock, 
  Coins, 
  ChevronRight,
  ShieldCheck,
  Flame,
  Lock,
  Unlock,
  Key,
  Timer,
  AlertCircle
} from 'lucide-react';
import { Tournament } from '../types';
import { getTournamentTimes, formatCountdown } from '../utils/timeUtils';

interface TournamentCardProps {
  tournament: Tournament;
  onSelect: (tournament: Tournament) => void;
  userPoints: number;
  userUid?: string;
}

export const TournamentCard: React.FC<TournamentCardProps> = ({
  tournament,
  onSelect,
  userPoints,
  userUid,
}) => {
  const [timing, setTiming] = useState(() => getTournamentTimes(tournament));

  useEffect(() => {
    const update = () => setTiming(getTournamentTimes(tournament));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [tournament]);

  const filledSlots = tournament.registeredTeams.length;
  const totalSlots = tournament.totalSlots;
  const isFull = filledSlots >= totalSlots;
  const isLive = tournament.status === 'live';
  const isCompleted = tournament.status === 'completed';
  const isCancelled = tournament.status === 'cancelled';
  const progressPercent = Math.min(100, Math.round((filledSlots / totalSlots) * 100));

  // Credential Security Status
  const isUserJoined = userUid ? tournament.registeredTeams.some(
    (t) => t.captainUid === userUid || t.members.some((m) => m.uid === userUid)
  ) : false;

  const isHost = userUid ? tournament.host.uid === userUid : false;
  const isWithin15Minutes = (tournament.startsInMinutes !== undefined && tournament.startsInMinutes <= 15) || tournament.roomDetails.isReleased || timing.isStartReached;

  return (
    <div className="group relative rounded-2xl bg-[#141414] border border-[#242424] hover:border-[#E50914]/50 transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-lg hover:shadow-[0_8px_30px_rgba(0,0,0,0.8)]">
      
      {/* Top Banner Image with Gradient Overlay */}
      <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-neutral-900">
        <img
          src={tournament.bannerImage}
          alt={tournament.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/60 to-transparent" />
        
        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-xs font-semibold gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0A0A0A]/85 backdrop-blur-md border border-[#333333]">
            {isCancelled ? (
              <span className="flex items-center gap-1.5 text-red-400 font-bold uppercase tracking-wider text-[11px]">
                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                Closed & Refunded
              </span>
            ) : isLive ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Match
              </span>
            ) : isCompleted ? (
              <span className="text-neutral-400 font-medium text-[11px] uppercase tracking-wider">
                Finished
              </span>
            ) : !timing.isStartReached ? (
              <span className="flex items-center gap-1 text-[#FF2E3B] font-bold uppercase tracking-wider text-[11px]">
                <Timer className="w-3.5 h-3.5 animate-pulse" />
                Starts in {formatCountdown(timing.remainingSecondsToStart)}
              </span>
            ) : !timing.isClosingTimeReached ? (
              <span className="flex items-center gap-1 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                Closes in {formatCountdown(timing.remainingSecondsToClose)}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-400 font-bold uppercase tracking-wider text-[11px]">
                <Clock className="w-3.5 h-3.5" />
                Auto-Closing
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0A0A0A]/85 backdrop-blur-md border border-[#333333] text-white font-gaming text-xs uppercase tracking-wider">
            <span>{tournament.mode}</span>
            <span aria-hidden="true" className="text-neutral-500">·</span>
            <span className="text-neutral-300">{tournament.map}</span>
          </div>
        </div>

        {/* Security & Schedule Overlay */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-1.5 text-neutral-200 font-medium bg-[#0A0A0A]/85 px-2 py-0.5 rounded backdrop-blur-sm border border-neutral-800 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-[#FF2E3B]" />
            <span>{tournament.startTime}</span>
            <span className="text-neutral-500">|</span>
            <span className="text-amber-400/90 text-[10px]">Closes: {timing.formattedClosingTime}</span>
          </div>

          {/* Credential Status Pill */}
          {isUserJoined || isHost ? (
            isWithin15Minutes ? (
              <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold bg-[#0A0A0A]/90 px-2 py-0.5 rounded border border-emerald-500/40">
                <Unlock className="w-3 h-3" />
                <span>Room ID Unlocked</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-amber-400 text-[10px] font-bold bg-[#0A0A0A]/90 px-2 py-0.5 rounded border border-amber-500/40">
                <Lock className="w-3 h-3" />
                <span>Room Unlocks 15m Before</span>
              </div>
            )
          ) : (
            <div className="flex items-center gap-1 text-neutral-400 text-[10px] font-medium bg-[#0A0A0A]/80 px-2 py-0.5 rounded">
              <Lock className="w-3 h-3 text-neutral-500" />
              <span>Room Protected</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Tournament Title */}
          <h3 className="font-display text-xl sm:text-2xl text-white font-bold tracking-wide uppercase leading-tight line-clamp-1 mb-2 group-hover:text-[#FF2E3B] transition-colors">
            {tournament.title}
          </h3>

          {/* Unboxed Metadata Line */}
          <div className="flex items-center gap-2 text-xs text-neutral-400 mb-4">
            <span>Host: {tournament.host.name}</span>
            <span aria-hidden="true">·</span>
            <span>{tournament.server}</span>
          </div>

          {/* 3 Core Match List Metrics: Entry Fee, Joined Slots, and Prize Pool */}
          <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-[#0E0E0E] border border-[#222222] mb-4">
            <div>
              <div className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">
                Prize Pool
              </div>
              <div className="font-gaming font-extrabold text-xl text-amber-400 tabular-nums leading-tight flex items-baseline gap-1">
                <span>{tournament.prizePool.toLocaleString()}</span>
                <span className="text-[10px] text-neutral-400 font-normal">Points</span>
              </div>
            </div>

            <div>
              <div className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">
                Per Kill Bounty
              </div>
              <div className="font-gaming font-bold text-lg text-white tabular-nums leading-tight flex items-baseline gap-1">
                {tournament.perKillBounty > 0 ? (
                  <>
                    <span className="text-[#FF2E3B]">+{tournament.perKillBounty}</span>
                    <span className="text-[10px] text-neutral-400 font-normal">Pts/kill</span>
                  </>
                ) : (
                  <span className="text-neutral-400 text-sm">Rank Only</span>
                )}
              </div>
            </div>
          </div>

          {/* Joined Slots Metric (e.g. 12/48 Joined) with Progress Bar */}
          <div className="space-y-1.5 mb-5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-neutral-400" />
                <span>Joined Slots</span>
              </span>
              <span className="font-gaming font-bold text-white tabular-nums text-sm">
                <strong className="text-amber-400">{filledSlots}</strong>/{totalSlots} Joined
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#80050A] to-[#E50914] transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card Footer: Entry Fee & Action Button (Crimson Red with Hover Glow) */}
        <div className="pt-3 border-t border-[#222222] flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase font-semibold text-neutral-400">
              Entry Fee
            </div>
            <div className="font-gaming font-extrabold text-lg sm:text-xl text-[#FF2E3B] tabular-nums leading-tight">
              {tournament.entryFee} <span className="text-xs text-neutral-400 font-normal">Points</span>
            </div>
          </div>

          <button
            onClick={() => onSelect(tournament)}
            className="btn-crimson flex items-center gap-1.5 px-4 py-2.5 text-xs uppercase tracking-wider font-bold cursor-pointer whitespace-nowrap"
          >
            <span>
              {isCancelled
                ? 'Cancelled / Details'
                : isUserJoined 
                ? (isWithin15Minutes ? 'Room Credentials' : 'Joined / Details') 
                : isHost 
                ? 'Host Controls' 
                : isCompleted 
                ? 'Results' 
                : isFull 
                ? 'Full' 
                : `Join (${tournament.entryFee} Pts)`}
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
