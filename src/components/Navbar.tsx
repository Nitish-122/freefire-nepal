import React from 'react';
import { 
  Trophy, 
  Coins, 
  User, 
  PlusCircle, 
  Swords, 
  Flame, 
  Bell, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { UserProfile } from '../types';
import logoImg from '../assets/images/khiladinepal_logo_1790422424911.jpg';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  walletPoints: number;
  userProfile: UserProfile;
  onOpenWallet: () => void;
  onOpenProfile: () => void;
  onOpenHost: () => void;
  onNavigateAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  walletPoints,
  userProfile,
  onOpenWallet,
  onOpenProfile,
  onOpenHost,
  onNavigateAdmin,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#222222]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo Zone */}
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-11 h-11 rounded-xl overflow-hidden border border-[#E50914]/50 shadow-[0_0_15px_rgba(229,9,20,0.4)] group-hover:shadow-[0_0_25px_rgba(255,46,59,0.7)] transition-all duration-300">
              <img src={logoImg} alt="Khiladi Nepal Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display text-2xl sm:text-3xl tracking-wider text-white font-bold leading-none">
                  KHILADI<span className="text-[#E50914]">NEPAL</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#E50914]/20 text-[#FF2E3B] border border-[#E50914]/40 font-mono tracking-tighter">
                  ESPORTS
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-gaming tracking-widest uppercase hidden sm:block">
                Free Fire Tournament Arena
              </p>
            </div>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 flex items-center gap-2 ${
                activeTab === 'home'
                  ? 'text-white bg-[#1A1A1A] border-b-2 border-[#E50914]'
                  : 'text-neutral-400 hover:text-white hover:bg-[#141414]'
              }`}
            >
              <span>Home</span>
            </button>

            <button
              onClick={() => setActiveTab('tournaments')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 flex items-center gap-2 ${
                activeTab === 'tournaments'
                  ? 'text-white bg-[#1A1A1A] border-b-2 border-[#E50914]'
                  : 'text-neutral-400 hover:text-white hover:bg-[#141414]'
              }`}
            >
              <Swords className="w-4 h-4 text-[#E50914]" />
              <span>Tournaments</span>
            </button>

            <button
              onClick={onOpenHost}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 flex items-center gap-2 ${
                activeTab === 'host'
                  ? 'text-white bg-[#1A1A1A] border-b-2 border-[#E50914]'
                  : 'text-neutral-400 hover:text-white hover:bg-[#141414]'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-[#FF2E3B]" />
              <span>Host Match</span>
            </button>

            <button
              onClick={onOpenWallet}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 flex items-center gap-2 ${
                activeTab === 'wallet'
                  ? 'text-white bg-[#1A1A1A] border-b-2 border-[#E50914]'
                  : 'text-neutral-400 hover:text-white hover:bg-[#141414]'
              }`}
            >
              <Coins className="w-4 h-4 text-amber-400" />
              <span>Wallet</span>
            </button>
          </nav>

          {/* Action Zone: Points Counter & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Wallet Points Counter Button */}
            <button
              onClick={onOpenWallet}
              aria-label="View wallet points"
              className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#141414] hover:bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#E50914]/50 transition-all duration-200 group cursor-pointer shadow-inner"
            >
              <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs group-hover:scale-110 transition-transform">
                रू
              </div>
              <div className="text-left">
                <div className="flex items-baseline gap-1">
                  <span className="font-gaming font-bold text-sm sm:text-base text-white tabular-nums tracking-wide">
                    {walletPoints.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-amber-400 font-semibold tracking-wider uppercase">
                    Points
                  </span>
                </div>
                <div className="text-[9px] text-neutral-500 leading-none hidden sm:block">
                  1 NPR = 1 Pt
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-[#FF2E3B] transition-colors ml-0.5" />
            </button>

            {/* Quick Host Button (Desktop) */}
            <button
              onClick={onOpenHost}
              className="btn-crimson hidden lg:flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider font-bold"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Host Match</span>
            </button>

            {/* User Profile Button */}
            <button
              onClick={onOpenProfile}
              aria-label="Open user profile"
              className="flex items-center gap-2 p-1 sm:px-3 sm:py-1.5 rounded-xl bg-[#141414] hover:bg-[#1C1C1C] border border-[#2A2A2A] hover:border-neutral-600 transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-[#E50914]/50 flex items-center justify-center text-sm font-bold text-white group-hover:border-[#FF2E3B] transition-colors overflow-hidden">
                <span className="font-gaming text-[#FF2E3B] font-extrabold">FF</span>
              </div>
              <div className="text-left hidden xl:block max-w-[100px] truncate">
                <div className="text-xs font-bold text-white truncate">
                  {userProfile.ign || 'Set IGN'}
                </div>
                <div className="text-[10px] text-neutral-400 font-mono truncate">
                  UID: {userProfile.uid || 'None'}
                </div>
              </div>
            </button>

            {/* Admin Console Trigger */}
            {onNavigateAdmin && (
              <button
                onClick={onNavigateAdmin}
                className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-purple-950/30 hover:bg-purple-900/50 border border-purple-500/40 text-purple-300 hover:text-white transition-all text-xs font-gaming font-bold tracking-wider uppercase cursor-pointer"
                title="Go to /admin route"
              >
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}

          </div>
        </div>
      </div>
    </header>
  );
};
