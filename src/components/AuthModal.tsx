import React, { useState } from 'react';
import { Shield, Gamepad2, Phone, Lock, User, KeyRound, Sparkles, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { UserProfile } from '../types';
import logoImg from '../assets/images/khiladinepal_logo_1790422424911.jpg';

interface AuthModalProps {
  isOpen: boolean;
  onLoginSuccess: (user: UserProfile & { walletPoints: number; password?: string }) => void;
  onNavigateAdmin: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onLoginSuccess, onNavigateAdmin }) => {
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('signup');

  // Signup state
  const [ign, setIgn] = useState('');
  const [uid, setUid] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('Kathmandu');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Login state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Secure Admin Modal state
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPasscode, setAdminPasscode] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ign.trim() || !uid.trim() || !phone.trim() || !password.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    const existingUsersJSON = localStorage.getItem('ff_nepal_users_db');
    const users: (UserProfile & { walletPoints: number; password?: string })[] = existingUsersJSON ? JSON.parse(existingUsersJSON) : [];

    // Check if phone or uid already registered
    const found = users.find(u => u.phoneNumber === phone.trim() || u.uid === uid.trim());
    if (found) {
      setErrorMsg('An account with this Phone Number or UID already exists. Please Login.');
      return;
    }

    const newUser: UserProfile & { walletPoints: number; password?: string } = {
      ign: ign.trim(),
      uid: uid.trim(),
      phoneNumber: phone.trim(),
      password: password.trim(),
      city: city.trim(),
      rank: 'Grandmaster',
      totalMatches: 0,
      totalWins: 0,
      totalKills: 0,
      totalEarnings: 0,
      walletPoints: 10, // 10 pts starting balance as requested
    };

    users.push(newUser);
    localStorage.setItem('ff_nepal_users_db', JSON.stringify(users));
    onLoginSuccess(newUser);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setErrorMsg('Please enter your credentials.');
      return;
    }

    const existingUsersJSON = localStorage.getItem('ff_nepal_users_db');
    const users: (UserProfile & { walletPoints: number; password?: string })[] = existingUsersJSON ? JSON.parse(existingUsersJSON) : [];

    const user = users.find(
      u => (u.phoneNumber === loginIdentifier.trim() || u.uid === loginIdentifier.trim()) && u.password === loginPassword.trim()
    );

    if (!user) {
      setErrorMsg('Invalid phone/UID or password. Please check your credentials or sign up.');
      return;
    }

    onLoginSuccess(user);
  };

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    // Secure admin passcode check (default secret: admin123 or 9999)
    if (adminPasscode.trim() === 'ZEROXXX') {
      onNavigateAdmin();
    } else {
      setAdminError('Invalid Admin Secure Passcode.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#121212] border border-[#2A2A2A] rounded-3xl shadow-[0_0_50px_rgba(229,9,20,0.25)] overflow-hidden my-auto">
        
        {/* Secure Admin Access Button in Top Corner */}
        <button
          type="button"
          onClick={() => { setShowAdminModal(true); setAdminError(null); setAdminPasscode(''); }}
          className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-[#E50914] border border-neutral-800 hover:border-[#E50914] text-neutral-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-gaming font-bold shadow-md"
          title="Secure Admin Access"
        >
          <Shield className="w-3.5 h-3.5 text-red-500 group-hover:text-white" />
          <span>Admin</span>
        </button>

        {/* Top Banner / Logo */}
        <div className="p-6 pb-4 bg-gradient-to-b from-[#1C1212] to-[#121212] border-b border-[#222222] text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#E50914] shadow-[0_0_20px_rgba(229,9,20,0.5)] mb-3">
            <img src={logoImg} alt="Khiladi Nepal Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-wider">
            KHILADI<span className="text-[#E50914]">NEPAL</span>
          </h1>
          <p className="text-xs text-neutral-400 font-gaming uppercase tracking-widest mt-1">
            Free Fire Esports Tournament Platform
          </p>
        </div>

        {/* SECURE ADMIN LOGIN OVERLAY/MODAL INJECTED */}
        {showAdminModal ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-red-500" />
                <h3 className="font-display text-base font-bold text-white uppercase">Secure Admin Login</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminModal(false)}
                className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Enter the secure administrator passcode to access the tournament management console and revenue dashboard.
            </p>

            {adminError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/50 text-red-300 text-xs font-medium text-center">
                {adminError}
              </div>
            )}

            <form onSubmit={handleAdminAuth} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Admin Passcode
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  value={adminPasscode}
                  onChange={(e) => setAdminPasscode(e.target.value)}
                  placeholder="Enter passcode"
                  className="w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-[#2D2D2D] text-white focus:border-[#E50914] focus:outline-none text-sm font-mono font-bold"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="flex-1 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-gaming text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#E50914] hover:bg-[#C40812] text-white font-gaming text-xs font-bold uppercase tracking-wider shadow-lg transition-colors cursor-pointer"
                >
                  Authorize Admin
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {/* Tab Switcher */}
            <div className="grid grid-cols-2 bg-[#0A0A0A] border-b border-[#222222] p-1.5">
              <button
                type="button"
                onClick={() => { setAuthTab('signup'); setErrorMsg(null); }}
                className={`py-2.5 rounded-xl text-xs font-gaming font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  authTab === 'signup'
                    ? 'bg-[#E50914] text-white shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Sign Up (10 Pts Free)
              </button>
              <button
                type="button"
                onClick={() => { setAuthTab('login'); setErrorMsg(null); }}
                className={`py-2.5 rounded-xl text-xs font-gaming font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  authTab === 'login'
                    ? 'bg-[#E50914] text-white shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Login
              </button>
            </div>

            {/* Error message */}
            {errorMsg && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-red-950/40 border border-red-500/50 text-red-300 text-xs text-center font-medium">
                {errorMsg}
              </div>
            )}

            {/* TAB 1: SIGNUP FORM */}
            {authTab === 'signup' && (
              <form onSubmit={handleSignup} className="p-6 space-y-4 text-sm">
                <div className="p-3 rounded-xl bg-[#1A1112] border border-[#E50914]/30 flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                  <div className="text-xs text-neutral-300">
                    New accounts instantly receive <strong className="text-amber-400 font-bold">10 Free Points</strong> to join daily scrims & tournaments!
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                    In-Game Name (IGN) *
                  </label>
                  <div className="relative">
                    <Gamepad2 className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      required
                      value={ign}
                      onChange={(e) => setIgn(e.target.value)}
                      placeholder="e.g. ⚡NEP_SHERPA⚡"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#2D2D2D] text-white focus:border-[#E50914] focus:outline-none text-sm font-gaming font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                    Free Fire UID (Numeric) *
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      required
                      value={uid}
                      onChange={(e) => setUid(e.target.value)}
                      placeholder="e.g. 2849102847"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#2D2D2D] text-white focus:border-[#E50914] focus:outline-none text-sm font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                    Phone Number (Khalti/eSewa) *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9841203948"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#2D2D2D] text-white focus:border-[#E50914] focus:outline-none text-sm font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a secure password"
                      autoComplete="new-password"
                      data-lpignore="true"
                      data-form-type="other"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#2D2D2D] text-white focus:border-[#E50914] focus:outline-none text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                    City / Province
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Kathmandu"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#2D2D2D] text-white focus:border-[#E50914] focus:outline-none text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#E50914] hover:bg-[#C40812] text-white font-gaming text-sm font-bold uppercase tracking-wider shadow-lg transition-colors cursor-pointer mt-2"
                >
                  Create Account & Claim 10 Pts
                </button>
              </form>
            )}

            {/* TAB 2: LOGIN FORM */}
            {authTab === 'login' && (
              <form onSubmit={handleLogin} className="p-6 space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                    Phone Number or Free Fire UID *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="Enter phone or UID"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#2D2D2D] text-white focus:border-[#E50914] focus:outline-none text-sm font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      data-lpignore="true"
                      data-form-type="other"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#2D2D2D] text-white focus:border-[#E50914] focus:outline-none text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#E50914] hover:bg-[#C40812] text-white font-gaming text-sm font-bold uppercase tracking-wider shadow-lg transition-colors cursor-pointer mt-4"
                >
                  Login to Arena
                </button>
              </form>
            )}
          </>
        )}

      </div>
    </div>
  );
};
