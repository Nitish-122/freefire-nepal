import React from 'react';
import { 
  Trophy, 
  Coins, 
  Flame, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  PlusCircle, 
  Users 
} from 'lucide-react';
import heroBg from '../assets/images/freefire_hero_banner_1790409666534.jpg';

interface HeroBannerProps {
  onExploreTournaments: () => void;
  onHostMatch: () => void;
  walletPoints: number;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onExploreTournaments,
  onHostMatch,
  walletPoints,
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#222222] bg-[#141414] shadow-2xl">
      {/* Background Graphic with Scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroBg}
          alt="Free Fire Nepal Esports Tournament"
          className="w-full h-full object-cover object-center opacity-40 scale-105 transition-transform duration-700 hover:scale-100"
          referrerPolicy="no-referrer"
        />
        {/* Measured dark scrim gradient to ensure WCAG AA contrast on text */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#141414]/90 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/85 to-transparent" />
        {/* Subtle crimson radial glow accent */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#E50914]/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 p-6 sm:p-10 lg:p-14 max-w-4xl">
        
        {/* Unboxed Micro-Header */}
        <div className="flex items-center gap-2 text-xs sm:text-sm font-gaming font-bold tracking-widest text-[#FF2E3B] uppercase mb-3">
          <Flame className="w-4 h-4 text-[#E50914] animate-pulse" />
          <span>Khiladi Nepal · Esports Arena</span>
          <span aria-hidden="true" className="text-neutral-600">·</span>
          <span className="text-neutral-400">South Asia Server</span>
        </div>

        {/* Primary Headline Highlighting 1 NPR = 1 Point */}
        <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl uppercase tracking-wider text-white font-extrabold leading-none mb-4 text-balance">
          Free Fire Cash Tournaments Nepal{' '}
          <span className="block mt-2 text-[#FF2E3B] drop-shadow-[0_0_20px_rgba(229,9,20,0.5)]">
            1 NPR = 1 Point
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-neutral-300 text-sm sm:text-base lg:text-lg max-w-2xl leading-relaxed mb-6 font-normal">
          Compete in daily Solo, Duo, Squad, and Clash Squad cash tournaments across Nepal. 
          Instant deposit and withdrawal with <strong className="text-white font-semibold">eSewa</strong>, <strong className="text-white font-semibold">Khalti</strong>, and <strong className="text-white font-semibold">IME Pay</strong>. 
          Automatic room credentials, fair-play anti-cheat, and direct cash payouts.
        </p>

        {/* Action Buttons: Vibrant Crimson Red (#E50914) with hover glow (#FF2E3B) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-8">
          <button
            onClick={onExploreTournaments}
            className="btn-crimson flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm sm:text-base uppercase tracking-wider cursor-pointer"
          >
            <Trophy className="w-5 h-5 text-white" />
            <span>Join Tournaments</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          <button
            onClick={onHostMatch}
            className="btn-crimson flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm sm:text-base uppercase tracking-wider cursor-pointer"
          >
            <PlusCircle className="w-5 h-5 text-white" />
            <span>Host Custom Match</span>
          </button>
        </div>

        {/* Unboxed Trust Markers / Feature Bar */}
        <div className="pt-6 border-t border-neutral-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-neutral-400">
          <div>
            <div className="flex items-center gap-1.5 text-white font-gaming text-lg sm:text-xl font-bold tabular-nums">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>1 NPR = 1 Pt</span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">Zero Conversion Fee</p>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-white font-gaming text-lg sm:text-xl font-bold tabular-nums">
              <Zap className="w-4 h-4 text-[#FF2E3B]" />
              <span>Instant Payouts</span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">eSewa & Khalti Verified</p>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-white font-gaming text-lg sm:text-xl font-bold tabular-nums">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Anti-Cheat 100%</span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">Strict Emulators Banned</p>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-white font-gaming text-lg sm:text-xl font-bold tabular-nums">
              <Users className="w-4 h-4 text-sky-400" />
              <span>24/7 Matchmaking</span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">Daily Scrims & Cups</p>
          </div>
        </div>

      </div>
    </div>
  );
};
