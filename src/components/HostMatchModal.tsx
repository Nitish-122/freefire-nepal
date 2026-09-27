import React, { useState } from 'react';
import { 
  X, 
  PlusCircle, 
  Gamepad2, 
  Coins, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Calendar,
  AlertCircle,
  Key,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { Tournament, GameMap, GameMode, UserProfile } from '../types';
import bermudaImg from '../assets/images/bermuda_championship_1790409686232.jpg';
import heroImg from '../assets/images/freefire_hero_banner_1790409666534.jpg';
import clashSquadImg from '../assets/images/clash_squad_esports_1790409703820.jpg';

interface HostMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onCreateTournament: (tournament: Tournament) => void;
}

export const HostMatchModal: React.FC<HostMatchModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onCreateTournament,
}) => {
  // 1. Match Title & Map (strictly: Bermuda, Kalahari, Purgatory)
  const [title, setTitle] = useState('');
  const [map, setMap] = useState<GameMap>('Bermuda');

  // 2. Match Mode (strictly: Solo, Duo, Squad)
  const [mode, setMode] = useState<GameMode>('Squad');

  // 3. Entry Fee Radio Options: STRICTLY limited to 5, 10, 15, or 20 Points
  const [entryFee, setEntryFee] = useState<5 | 10 | 15 | 20>(10);

  // Slots based on mode
  const totalSlots = mode === 'Solo' ? 48 : mode === 'Duo' ? 24 : 12;

  // 4. Per Kill Points & Total Prize Pool Points
  const [perKillBounty, setPerKillBounty] = useState<number>(3);
  const defaultPrizePool = entryFee * (mode === 'Solo' ? 48 : 48); // 48 players total
  const [prizePool, setPrizePool] = useState<number>(defaultPrizePool);

  // 5. Match Date & Time
  const todayStr = new Date().toISOString().split('T')[0];
  const [matchDate, setMatchDate] = useState<string>(todayStr);
  const [matchTime, setMatchTime] = useState<string>('20:30');

  // 6. Room Host Controls: Host can input Room ID & Password
  const [roomId, setRoomId] = useState<string>('');
  const [roomPassword, setRoomPassword] = useState<string>('');
  const [startsInMinutes, setStartsInMinutes] = useState<number>(30); // minutes until match start
  const [fixedClosingTimeMinutes, setFixedClosingTimeMinutes] = useState<number>(15); // grace window until room auto-closes
  const [customRules, setCustomRules] = useState<string>('Strict Gun Attributes OFF. Character Skills ON. Emulators Banned.');

  // Auto-update estimated prize pool when entry fee changes unless manually customized
  const handleEntryFeeChange = (fee: 5 | 10 | 15 | 20) => {
    setEntryFee(fee);
    const calculatedPool = fee * 48; // Total players 48
    setPrizePool(calculatedPool);
    setPerKillBounty(fee === 5 ? 1 : fee === 10 ? 3 : fee === 15 ? 5 : 8);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const bannerImage = 
      map === 'Bermuda' ? bermudaImg : 
      map === 'Kalahari' ? clashSquadImg : heroImg;

    // Format start time string
    const formattedStartTime = `${matchDate === todayStr ? 'Today' : matchDate} at ${matchTime} NPT`;

    // Payout breakdown
    const firstPrize = Math.floor(prizePool * 0.60);
    const secondPrize = Math.floor(prizePool * 0.25);
    const thirdPrize = Math.floor(prizePool * 0.15);

    const now = Date.now();
    const scheduledStartTimeMs = now + (startsInMinutes * 60 * 1000);
    const closingTimeMs = scheduledStartTimeMs + (fixedClosingTimeMinutes * 60 * 1000);

    const newTournament: Tournament = {
      id: `custom-room-${now}`,
      title: title.trim() || `${userProfile.ign}'s ${mode} Cup (${map})`,
      bannerImage,
      map,
      mode,
      status: 'upcoming',
      startTime: formattedStartTime,
      matchDate,
      startsInMinutes,
      scheduledStartTimeMs,
      closingTimeMs,
      createdAtMs: now,
      fixedClosingTimeMinutes,
      server: 'South Asia / Nepal',
      entryFee,
      prizePool: Number(prizePool) || defaultPrizePool,
      perKillBounty: Number(perKillBounty) || 0,
      totalSlots,
      registeredTeams: [],
      roomDetails: {
        roomId: roomId.trim() || 'Waiting Host Setup',
        roomPassword: roomPassword.trim() || 'Waiting Host Setup',
        customRules,
        isReleased: startsInMinutes <= 15 && roomId.trim() !== '',
      },
      payoutBreakdown: {
        first: firstPrize,
        second: secondPrize,
        third: thirdPrize,
      },
      host: {
        name: userProfile.ign || 'Host Player',
        uid: userProfile.uid || 'HOST',
        verified: true,
      },
    };

    onCreateTournament(newTournament);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-xl bg-[#141414] border border-[#2B2B2B] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[#222222] bg-[#101010] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E50914] to-[#80050A] flex items-center justify-center text-white shadow-[0_0_15px_rgba(229,9,20,0.4)]">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-2xl sm:text-3xl text-white font-extrabold uppercase tracking-wide leading-none">
                Host Custom Match
              </h2>
              <p className="text-[11px] text-amber-400 font-gaming uppercase tracking-widest mt-1">
                Custom Tournament Creator · Nepal Community
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-sm">
          
          {/* Match Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
              Match Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Kathmandu Midnight Bermuda Cup #1"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#2D2D2D] text-white focus:border-[#E50914] focus:outline-none text-sm placeholder:text-neutral-600 font-medium"
            />
          </div>

          {/* Map Selection: STRICTLY Bermuda, Kalahari, Purgatory */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5 flex items-center justify-between">
              <span>Select Map (Nepal Battlegrounds) *</span>
              <span className="text-[10px] text-neutral-500 font-normal">Strict Map Set</span>
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {(['Bermuda', 'Kalahari', 'Purgatory'] as GameMap[]).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMap(m)}
                  className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer font-gaming font-bold uppercase text-sm ${
                    map === m
                      ? 'bg-[#E50914]/20 border-[#FF2E3B] text-white shadow-[0_0_15px_rgba(255,46,59,0.35)]'
                      : 'bg-[#0A0A0A] border-[#2A2A2A] text-neutral-400 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Match Mode Selection: Solo, Duo, Squad */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
              Match Mode *
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {(['Solo', 'Duo', 'Squad'] as GameMode[]).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMode(m)}
                  className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer font-gaming font-bold uppercase text-sm ${
                    mode === m
                      ? 'bg-[#E50914]/20 border-[#FF2E3B] text-white shadow-[0_0_15px_rgba(255,46,59,0.35)]'
                      : 'bg-[#0A0A0A] border-[#2A2A2A] text-neutral-400 hover:text-white'
                  }`}
                >
                  <span>{m}</span>
                  <span className="block text-[10px] text-neutral-500 font-normal mt-0.5">
                    {m === 'Solo' ? '48 Players' : m === 'Duo' ? '24 Teams' : '12 Squads'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ENTRY FEE RADIO OPTIONS: STRICTLY LIMITED TO 5, 10, 15, OR 20 POINTS */}
          <div className="p-4 rounded-2xl bg-[#0A0A0A] border border-[#2B2B2B] space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-200 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>Entry Fee (Strict Radio Options) *</span>
              </label>
              <span className="text-[10px] text-neutral-400 font-mono">1 NPR = 1 Point</span>
            </div>

            <p className="text-[11px] text-neutral-400">
              Select one of the official tournament entry fee tiers:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {([5, 10, 15, 20] as const).map((fee) => (
                <label
                  key={fee}
                  className={`relative flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${
                    entryFee === fee
                      ? 'bg-[#E50914]/25 border-[#FF2E3B] text-white shadow-[0_0_15px_rgba(255,46,59,0.4)]'
                      : 'bg-[#141414] border-[#262626] text-neutral-300 hover:border-neutral-500'
                  }`}
                >
                  <input
                    type="radio"
                    name="entryFee"
                    value={fee}
                    checked={entryFee === fee}
                    onChange={() => handleEntryFeeChange(fee)}
                    className="sr-only"
                  />
                  <div className="font-gaming font-extrabold text-xl text-white tabular-nums">
                    {fee} Pts
                  </div>
                  <div className="text-[10px] text-amber-400 font-semibold mt-0.5">
                    रू {fee} NPR
                  </div>
                  {entryFee === fee && (
                    <span className="w-2 h-2 rounded-full bg-[#FF2E3B] mt-1" />
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Per Kill Points & Total Prize Pool Points */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                Per Kill Points (Bounty) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="20"
                  required
                  value={perKillBounty}
                  onChange={(e) => setPerKillBounty(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#2D2D2D] text-white focus:border-[#E50914] focus:outline-none text-base font-gaming font-bold"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                  Pts / Kill
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                Total Prize Pool Points *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="50"
                  step="10"
                  required
                  value={prizePool}
                  onChange={(e) => setPrizePool(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#2D2D2D] text-amber-400 focus:border-[#E50914] focus:outline-none text-base font-gaming font-bold"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                  Points
                </span>
              </div>
            </div>
          </div>

          {/* Match Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#FF2E3B]" />
                <span>Match Date *</span>
              </label>
              <input
                type="date"
                required
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#2D2D2D] text-white focus:border-[#E50914] focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#FF2E3B]" />
                <span>Match Time (NPT) *</span>
              </label>
              <input
                type="time"
                required
                value={matchTime}
                onChange={(e) => setMatchTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#2D2D2D] text-white focus:border-[#E50914] focus:outline-none text-sm"
              />
            </div>
          </div>

          {/* Room Host Controls: Host can input Room ID & Password 15m before start */}
          <div className="p-4 rounded-2xl bg-[#0A0A0A] border border-[#2B2B2B] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-gaming text-sm font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-400" />
                <span>Room Host Controls (Credentials)</span>
              </h4>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">Host Authority</span>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              As host, you can set Room ID & Password now or enter/update them <strong>15 minutes before match start</strong>. Credentials will stay strictly hidden from unauthorized users and will unlock ONLY for joined participants within the 15-minute window.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                  Custom Room ID (Optional now)
                </label>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="e.g. 94820194 (or set later)"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-[#2D2D2D] text-white focus:border-[#E50914] focus:outline-none text-sm font-mono placeholder:text-neutral-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                  Room Password (Optional now)
                </label>
                <input
                  type="text"
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                  placeholder="e.g. NEPAL99 (or set later)"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-[#2D2D2D] text-white focus:border-[#E50914] focus:outline-none text-sm font-mono placeholder:text-neutral-600"
                />
              </div>
            </div>

            {/* Starts in minutes selector & Fixed Closing Window */}
            <div className="pt-1 space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Match Starts In:</span>
                <select
                  value={startsInMinutes}
                  onChange={(e) => setStartsInMinutes(Number(e.target.value))}
                  className="px-2.5 py-1 rounded-lg bg-[#141414] border border-[#2D2D2D] text-xs text-white"
                >
                  <option value={5}>5 minutes (Fast start)</option>
                  <option value={10}>10 minutes (Within 15-min Window)</option>
                  <option value={15}>15 minutes</option>
                  <option value={25}>25 minutes (Credentials Hidden)</option>
                  <option value={45}>45 minutes</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>

              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Fixed Auto-Close Window:</span>
                <select
                  value={fixedClosingTimeMinutes}
                  onChange={(e) => setFixedClosingTimeMinutes(Number(e.target.value))}
                  className="px-2.5 py-1 rounded-lg bg-[#141414] border border-[#2D2D2D] text-xs text-white"
                >
                  <option value={10}>10 min after start</option>
                  <option value={15}>15 min after start (Recommended)</option>
                  <option value={30}>30 min after start</option>
                  <option value={45}>45 min after start</option>
                </select>
              </div>

              <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-400">
                <span className="text-amber-400 font-bold">Fixed Closing Policy:</span> Registration closes at match start. If the host does not launch the room within <span className="text-white font-semibold">{fixedClosingTimeMinutes} minutes</span> after start, the room automatically closes and all entry fees are 100% refunded.
              </div>
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="btn-crimson w-full py-3.5 text-sm uppercase tracking-wider font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-5 h-5 text-white" />
              <span>Create Tournament ({entryFee} Points Entry)</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
