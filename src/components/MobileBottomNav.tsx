import React from 'react';
import { Home, Swords, Plus, Coins, User } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  walletPoints: number;
  onOpenHost: () => void;
  onOpenWallet: () => void;
  onOpenProfile: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  walletPoints,
  onOpenHost,
  onOpenWallet,
  onOpenProfile,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#141414]/95 backdrop-blur-lg border-t border-[#262626] px-2 py-1 shadow-[0_-5px_20px_rgba(0,0,0,0.7)]">
      <nav className="grid grid-cols-5 items-center h-14 max-w-md mx-auto">
        
        {/* Tab 1: Home */}
        <button
          onClick={() => setActiveTab('home')}
          className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center transition-all ${
            activeTab === 'home'
              ? 'text-[#FF2E3B]'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-0.5">Home</span>
          {activeTab === 'home' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#E50914] mt-0.5" />
          )}
        </button>

        {/* Tab 2: Tournaments */}
        <button
          onClick={() => setActiveTab('tournaments')}
          className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center transition-all ${
            activeTab === 'tournaments'
              ? 'text-[#FF2E3B]'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Swords className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-0.5">Matches</span>
          {activeTab === 'tournaments' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#E50914] mt-0.5" />
          )}
        </button>

        {/* Tab 3: Host Match (Prominent Gaming Action Center Button) */}
        <div className="flex items-center justify-center">
          <button
            onClick={onOpenHost}
            className="w-12 h-12 -mt-4 rounded-full bg-[#E50914] hover:bg-[#FF2E3B] text-white flex items-center justify-center shadow-[0_0_18px_rgba(229,9,20,0.6)] active:scale-95 transition-all border-2 border-[#0A0A0A]"
            aria-label="Host Match"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab 4: Wallet */}
        <button
          onClick={onOpenWallet}
          className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center transition-all ${
            activeTab === 'wallet'
              ? 'text-[#FF2E3B]'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Coins className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-0.5">Wallet</span>
          {activeTab === 'wallet' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#E50914] mt-0.5" />
          )}
        </button>

        {/* Tab 5: Profile */}
        <button
          onClick={onOpenProfile}
          className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center transition-all ${
            activeTab === 'profile'
              ? 'text-[#FF2E3B]'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-0.5">Profile</span>
          {activeTab === 'profile' && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#E50914] mt-0.5" />
          )}
        </button>

      </nav>
    </div>
  );
};
