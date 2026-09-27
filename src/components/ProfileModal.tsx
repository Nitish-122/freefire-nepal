import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Shield, 
  Phone, 
  Gamepad2, 
  MapPin, 
  Check, 
  Trophy, 
  Flame, 
  Award,
  Crosshair,
  Coins,
  LogOut
} from 'lucide-react';
import { UserProfile } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  walletPoints: number;
  onLogout?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile,
  walletPoints,
  onLogout,
}) => {
  const [ign, setIgn] = useState(userProfile.ign);
  const [uid, setUid] = useState(userProfile.uid);
  const [phoneNumber, setPhoneNumber] = useState(userProfile.phoneNumber);
  const [guild, setGuild] = useState(userProfile.guild || '');
  const [city, setCity] = useState(userProfile.city || 'Kathmandu');
  const [rank, setRank] = useState(userProfile.rank || 'Grandmaster');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setIgn(userProfile.ign);
    setUid(userProfile.uid);
    setPhoneNumber(userProfile.phoneNumber);
    setGuild(userProfile.guild || '');
    setCity(userProfile.city || 'Kathmandu');
    setRank(userProfile.rank || 'Grandmaster');
  }, [userProfile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: UserProfile = {
      ...userProfile,
      ign: ign.trim() || 'Player',
      uid: uid.trim() || '000000000',
      phoneNumber: phoneNumber.trim() || '9800000000',
      guild: guild.trim(),
      city: city.trim(),
      rank,
    };

    onUpdateProfile(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-lg bg-[#141414] border border-[#2B2B2B] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#222222] bg-[#101010] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E50914] to-[#80050A] flex items-center justify-center text-white shadow-[0_0_15px_rgba(229,9,20,0.4)]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-2xl text-white font-extrabold uppercase tracking-wide leading-none">
                Player Profile
              </h2>
              <p className="text-[11px] text-neutral-400 font-gaming uppercase tracking-widest mt-0.5">
                Free Fire Esports Credentials
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

        {/* Player Badge Card */}
        <div className="p-5 bg-gradient-to-r from-[#1A1414] to-[#121212] border-b border-[#222222] flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#202020] to-[#0A0A0A] border-2 border-[#E50914] flex items-center justify-center font-display text-2xl text-white font-bold shadow-[0_0_15px_rgba(229,9,20,0.3)]">
              {ign.slice(0, 2).toUpperCase() || 'FF'}
            </div>
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded bg-[#E50914] text-white text-[9px] font-bold font-gaming uppercase">
              {rank}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-display text-xl text-white font-bold tracking-wide truncate">
              {ign || 'Unset IGN'}
            </div>
            <div className="text-xs text-neutral-400 font-mono flex items-center gap-1.5 mt-0.5">
              <span>UID:</span>
              <span className="text-[#FF2E3B] font-bold">{uid || 'Unset UID'}</span>
            </div>
            <div className="text-[11px] text-neutral-400 flex items-center gap-2 mt-1">
              <span>{guild || 'No Guild'}</span>
              <span aria-hidden="true">·</span>
              <span>{city}</span>
            </div>
          </div>

          <div className="text-right pl-2 border-l border-neutral-800">
            <div className="text-[10px] text-neutral-400 uppercase font-semibold">Wallet</div>
            <div className="font-gaming font-extrabold text-base text-amber-400 tabular-nums">
              {walletPoints} <span className="text-[10px] text-neutral-400">Pts</span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 text-sm">
          
          {/* In-Game Name (IGN) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5 flex items-center gap-1.5">
              <Gamepad2 className="w-4 h-4 text-[#FF2E3B]" />
              <span>In-Game Name (IGN) *</span>
            </label>
            <input
              type="text"
              required
              value={ign}
              onChange={(e) => setIgn(e.target.value)}
              placeholder="e.g. NEP_GOKU99 or ⚡RAAZ⚡"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#2D2D2D] text-white focus:border-[#E50914] focus:outline-none text-sm font-gaming font-bold"
            />
            <span className="text-[10px] text-neutral-500 mt-1 block">
              Must exactly match your Free Fire character name for prize validation.
            </span>
          </div>

          {/* Free Fire UID */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#FF2E3B]" />
              <span>Free Fire UID (Numeric ID) *</span>
            </label>
            <input
              type="text"
              required
              pattern="[0-9]{8,12}"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              placeholder="e.g. 2849102847 (8 to 12 digits)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#2D2D2D] text-white focus:border-[#E50914] focus:outline-none text-sm font-mono tracking-wider font-bold"
            />
            <span className="text-[10px] text-neutral-500 mt-1 block">
              Found in your Free Fire in-game profile banner.
            </span>
          </div>

          {/* Phone Number (Nepal) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-[#FF2E3B]" />
              <span>Phone Number (Nepal Mobile / eSewa) *</span>
            </label>
            <input
              type="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. 9841234567 or 9801234567"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#2D2D2D] text-white focus:border-[#E50914] focus:outline-none text-sm font-mono tracking-wider"
            />
            <span className="text-[10px] text-neutral-500 mt-1 block">
              Used for custom room SMS notifications and eSewa / Khalti cash rewards.
            </span>
          </div>

          {/* Guild / Team Name & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                Guild / Clan Name
              </label>
              <input
                type="text"
                value={guild}
                onChange={(e) => setGuild(e.target.value)}
                placeholder="e.g. Gorkha Warriors"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#2D2D2D] text-white focus:border-[#E50914] focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                City / Region (Nepal)
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#2D2D2D] text-white focus:border-[#E50914] focus:outline-none text-sm cursor-pointer"
              >
                <option value="Kathmandu">Kathmandu Valley</option>
                <option value="Pokhara">Pokhara</option>
                <option value="Chitwan">Chitwan</option>
                <option value="Butwal">Butwal</option>
                <option value="Dharan">Dharan / Itahari</option>
                <option value="Biratnagar">Biratnagar</option>
                <option value="Nepalgunj">Nepalgunj</option>
                <option value="Dhangadhi">Dhangadhi</option>
                <option value="Other Nepal">Other Nepal</option>
              </select>
            </div>
          </div>

          {/* Rank Badge Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
              Current Free Fire Rank Tier
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['Grandmaster', 'Heroic', 'Master', 'Diamond'] as const).map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRank(r)}
                  className={`py-2 px-1 text-center rounded-xl border text-xs font-gaming font-bold uppercase transition-all cursor-pointer ${
                    rank === r
                      ? 'bg-[#E50914]/20 border-[#FF2E3B] text-white shadow-[0_0_12px_rgba(255,46,59,0.4)]'
                      : 'bg-[#0A0A0A] border-[#2A2A2A] text-neutral-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Career Stats Summary */}
          <div className="p-3.5 rounded-xl bg-[#0A0A0A] border border-[#242424] grid grid-cols-4 gap-2 text-center">
            <div>
              <div className="text-[10px] text-neutral-500 uppercase font-semibold">Matches</div>
              <div className="font-gaming font-bold text-base text-white tabular-nums">
                {userProfile.totalMatches}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-neutral-500 uppercase font-semibold">Booyah</div>
              <div className="font-gaming font-bold text-base text-amber-400 tabular-nums">
                {userProfile.totalWins}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-neutral-500 uppercase font-semibold">Kills</div>
              <div className="font-gaming font-bold text-base text-[#FF2E3B] tabular-nums">
                {userProfile.totalKills}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-neutral-500 uppercase font-semibold">Earned</div>
              <div className="font-gaming font-bold text-base text-emerald-400 tabular-nums">
                रू {userProfile.totalEarnings.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Action Button: Crimson Red (#E50914) with hover glow (#FF2E3B) */}
          <div className="pt-2 space-y-2.5">
            <button
              type="submit"
              className="btn-crimson w-full py-3.5 text-sm uppercase tracking-wider font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-5 h-5 text-white" />
                  <span>Profile Saved!</span>
                </>
              ) : (
                <span>Save Profile Credentials</span>
              )}
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="w-full py-3 rounded-xl bg-neutral-900 hover:bg-red-950/40 border border-neutral-800 hover:border-red-500/50 text-neutral-300 hover:text-red-400 font-gaming text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of Account</span>
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
};
