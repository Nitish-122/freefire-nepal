import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Coins, 
  ArrowUpRight, 
  History, 
  CheckCircle2, 
  AlertCircle, 
  Smartphone, 
  Copy, 
  Check, 
  Upload, 
  Clock, 
  Eye,
  FileCheck,
  QrCode,
  ZoomIn,
  Maximize2,
  ShieldCheck,
  ArrowDownLeft,
  ImageIcon as ImageIconLucide,
  CheckCheck
} from 'lucide-react';
import { WalletTransaction, UserProfile } from '../types';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletPoints: number;
  transactions: WalletTransaction[];
  userProfile: UserProfile;
  adminKhaltiNumber?: string;
  onSubmitManualKhaltiDeposit: (deposit: {
    amount: number;
    txnId: string;
    screenshotUrl?: string;
    senderKhaltiId?: string;
  }) => void;
  onRequestKhaltiWithdrawal: (withdrawal: {
    points: number;
    khaltiId: string;
  }) => boolean;
  onApprovePendingTransaction?: (txId: string) => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  walletPoints,
  transactions,
  userProfile,
  adminKhaltiNumber,
  onSubmitManualKhaltiDeposit,
  onRequestKhaltiWithdrawal,
  onApprovePendingTransaction,
}) => {
  const [activeTab, setActiveTab] = useState<'khalti_deposit' | 'khalti_withdraw' | 'history'>('khalti_deposit');
  
  // Admin details
  const ADMIN_KHALTI_NUMBER = adminKhaltiNumber || "9813362603";
  const [copiedAdminNumber, setCopiedAdminNumber] = useState(false);
  const [customQrImage, setCustomQrImage] = useState<string | null>(() => {
    return localStorage.getItem('khalti_custom_qr_image') || null;
  });
  const [isQrZoomed, setIsQrZoomed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCustomQrImage(localStorage.getItem('khalti_custom_qr_image') || null);
    }
  }, [isOpen]);

  const effectiveQrImage = customQrImage || '/khalti-qr.png';

  // Manual Khalti Deposit Form state
  const [depositAmount, setDepositAmount] = useState<number>(100);
  const [txnId, setTxnId] = useState('');
  const [senderKhaltiId, setSenderKhaltiId] = useState(userProfile.phoneNumber || '');
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [screenshotName, setScreenshotName] = useState<string>('');
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);
  const [depositSuccessNotice, setDepositSuccessNotice] = useState<string | null>(null);
  const [depositErrorNotice, setDepositErrorNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Khalti Withdrawal Form state
  const [withdrawPoints, setWithdrawPoints] = useState<number>(100);
  const [withdrawKhaltiId, setWithdrawKhaltiId] = useState(userProfile.phoneNumber || '');
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState('');
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);

  // Preview screenshot modal state
  const [previewScreenshot, setPreviewScreenshot] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile.phoneNumber) {
      setSenderKhaltiId(userProfile.phoneNumber);
      setWithdrawKhaltiId(userProfile.phoneNumber);
    }
  }, [userProfile.phoneNumber]);

  const quickPacks = [50, 100, 250, 500, 1000];

  const handleCopyAdminNumber = () => {
    navigator.clipboard.writeText(ADMIN_KHALTI_NUMBER);
    setCopiedAdminNumber(true);
    setTimeout(() => setCopiedAdminNumber(false), 2000);
  };

  // Handle Screenshot File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setDepositErrorNotice('Please select an image file (PNG, JPG, or JPEG).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setDepositErrorNotice('Image file size must be less than 8MB.');
      return;
    }

    setScreenshotName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setScreenshotUrl(event.target.result);
        setDepositErrorNotice(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveScreenshot = () => {
    setScreenshotUrl('');
    setScreenshotName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit Manual Khalti Deposit
  const handleSubmitDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    setDepositErrorNotice(null);
    setDepositSuccessNotice(null);

    if (depositAmount <= 0) {
      setDepositErrorNotice('Please enter a valid deposit amount in NPR.');
      return;
    }

    if (!txnId.trim()) {
      setDepositErrorNotice('Please enter the Khalti Transaction ID (TxnID / Reference Code).');
      return;
    }

    setIsSubmittingDeposit(true);

    setTimeout(() => {
      onSubmitManualKhaltiDeposit({
        amount: Number(depositAmount),
        txnId: txnId.trim(),
        screenshotUrl: screenshotUrl || undefined,
        senderKhaltiId: senderKhaltiId.trim() || undefined,
      });

      setIsSubmittingDeposit(false);
      setDepositSuccessNotice(
        `Deposit request for रू ${depositAmount} (${depositAmount} Points) submitted with status "PENDING"! Admin will verify TxnID "${txnId.trim()}".`
      );

      // Reset form
      setTxnId('');
      setScreenshotUrl('');
      setScreenshotName('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Auto switch to history tab after 1.5s
      setTimeout(() => {
        setActiveTab('history');
      }, 1400);
    }, 400);
  };

  // Submit Khalti Withdrawal
  const handleSubmitWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError('');
    setWithdrawSuccess('');

    if (withdrawPoints < 100) {
      setWithdrawError('Minimum withdrawal is 100 Points (रू 100).');
      return;
    }

    if (withdrawPoints > walletPoints) {
      setWithdrawError(`Insufficient points. You only have ${walletPoints} Points available.`);
      return;
    }

    if (!withdrawKhaltiId.trim()) {
      setWithdrawError('Please enter your receiving Khalti Phone Number / Khalti ID.');
      return;
    }

    setIsSubmittingWithdraw(true);

    setTimeout(() => {
      const ok = onRequestKhaltiWithdrawal({
        points: Number(withdrawPoints),
        khaltiId: withdrawKhaltiId.trim(),
      });

      setIsSubmittingWithdraw(false);
      if (ok) {
        setWithdrawSuccess(
          `Withdrawal request for ${withdrawPoints} Points (रू ${withdrawPoints}) to Khalti ID "${withdrawKhaltiId}" submitted with status "PENDING"!`
        );
        setTimeout(() => {
          setActiveTab('history');
        }, 1400);
      }
    }, 400);
  };

  const pendingTransactionsCount = transactions.filter(t => t.status === 'pending').length;

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
        <div 
          className="relative w-full max-w-2xl bg-[#141414] border border-[#2B2B2B] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-[#222222] bg-[#101010] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E50914] to-[#80050A] flex items-center justify-center text-white shadow-[0_0_15px_rgba(229,9,20,0.4)]">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-2xl sm:text-3xl text-white font-extrabold uppercase tracking-wide leading-none">
                  Wallet & Khalti Engine
                </h2>
                <p className="text-[11px] text-amber-400 font-gaming uppercase tracking-widest mt-1">
                  1 NPR = 1 Point Economy · Manual Khalti Deposit & Payouts
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

          {/* Current Balance Banner */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-[#171212] via-[#141414] to-[#121212] border-b border-[#222222] flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase font-semibold text-neutral-400 tracking-wider">
                Current App Wallet Balance
              </div>
              <div className="font-gaming font-extrabold text-2xl sm:text-3xl text-amber-400 tabular-nums leading-none mt-1 flex items-baseline gap-2">
                <span>{walletPoints.toLocaleString()}</span>
                <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                  Points (रू {walletPoints.toLocaleString()} NPR)
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold px-2 py-1 rounded bg-[#E50914]/20 text-[#FF2E3B] border border-[#E50914]/40 font-gaming tracking-wider uppercase">
                1 NPR = 1 App Point
              </span>
            </div>
          </div>

            {/* Navigation Tabs */}
          <div className="flex items-center border-b border-[#222222] bg-[#0E0E0E] px-3 sm:px-4 text-xs sm:text-sm font-semibold overflow-x-auto">
            <button
              onClick={() => setActiveTab('khalti_deposit')}
              className={`py-3 px-3.5 sm:px-4 border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                activeTab === 'khalti_deposit'
                  ? 'border-[#E50914] text-white font-bold'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4 text-[#E50914]" />
              <span>Khalti Deposit (Number)</span>
            </button>

            <button
              onClick={() => setActiveTab('khalti_withdraw')}
              className={`py-3 px-3.5 sm:px-4 border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                activeTab === 'khalti_withdraw'
                  ? 'border-[#E50914] text-white font-bold'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 text-[#FF2E3B]" />
              <span>Khalti Withdrawal</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 px-3.5 sm:px-4 border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'border-[#E50914] text-white font-bold'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              <History className="w-4 h-4 text-neutral-400" />
              <span>Requests & Proofs</span>
              {pendingTransactionsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-mono border border-amber-500/40">
                  {pendingTransactionsCount} Pending
                </span>
              )}
            </button>
          </div>

          {/* Tab Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-sm">
            
            {/* TAB 1: MANUAL KHALTI DEPOSIT MODAL ENGINE */}
            {activeTab === 'khalti_deposit' && (
              <div className="space-y-6">
                
                {/* Khalti Official QR Code */}
                {effectiveQrImage && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#0A0A0A] border border-[#262626] flex flex-col items-center justify-center space-y-3 text-center">
                    <div className="flex items-center justify-between w-full max-w-[280px] pb-1.5 border-b border-[#1F1F1F]">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-300">
                        <QrCode className="w-4 h-4 text-[#E50914]" />
                        <span>Admin Khalti QR Code</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                        Active
                      </span>
                    </div>
                    <div 
                      onClick={() => setIsQrZoomed(true)}
                      className="relative w-full max-w-[240px] aspect-square rounded-2xl overflow-hidden bg-black border-2 border-neutral-700/80 shadow-2xl flex items-center justify-center cursor-pointer group transition-all hover:border-[#E50914]"
                      title="Click to open enlarged view"
                    >
                      <img
                        src={effectiveQrImage}
                        alt="Admin Khalti QR"
                        className="w-full h-full object-contain p-2 transition-transform duration-300 select-none group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-2 pt-6 flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity">
                        <span className="text-[11px] text-neutral-300 font-medium flex items-center gap-1">
                          <Maximize2 className="w-3 h-3 text-[#E50914]" />
                          <span>Tap to enlarge</span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Khalti Direct Payment Number Card */}
                <div className="p-5 sm:p-6 rounded-2xl bg-[#0A0A0A] border border-[#262626] flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-[#E50914]/20 border border-[#E50914]/40 flex items-center justify-center text-[#E50914] shadow-[0_0_15px_rgba(229,9,20,0.3)]">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-gaming text-lg sm:text-xl font-extrabold text-white uppercase tracking-wide">
                      Khalti Direct Payment Number
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                      Open your Khalti app, send funds to the official admin number below, and submit your Transaction ID and screenshot proof.
                    </p>
                  </div>

                  {/* Admin Number Display with Copy Action */}
                  <div className="w-full max-w-sm flex items-center justify-between px-4 py-3.5 rounded-xl bg-[#141414] border border-[#2A2A2A]">
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                        Khalti Number
                      </span>
                      <span className="font-mono font-bold text-xl sm:text-2xl text-amber-400 tracking-widest">
                        {ADMIN_KHALTI_NUMBER}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyAdminNumber}
                      className="px-4 py-2 rounded-xl bg-[#E50914] hover:bg-[#C40812] text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-md"
                      title="Click to copy number"
                    >
                      {copiedAdminNumber ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-200" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 3. Manual Deposit Form */}
                <form onSubmit={handleSubmitDeposit} className="p-4 sm:p-5 rounded-2xl bg-[#0A0A0A] border border-[#262626] space-y-4">
                  <h4 className="font-gaming text-base font-bold uppercase tracking-wider text-white flex items-center gap-2 border-b border-[#1F1F1F] pb-2">
                    <FileCheck className="w-4 h-4 text-[#FF2E3B]" />
                    <span>Deposit Confirmation Form</span>
                  </h4>

                  {/* Quick Amount Packs */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                      Select Quick Amount (1 NPR = 1 Point)
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {quickPacks.map((pack) => (
                        <button
                          type="button"
                          key={pack}
                          onClick={() => setDepositAmount(pack)}
                          className={`py-2 rounded-xl border font-gaming text-sm font-bold transition-all cursor-pointer ${
                            depositAmount === pack
                              ? 'bg-[#E50914]/20 border-[#FF2E3B] text-white shadow-[0_0_12px_rgba(255,46,59,0.4)]'
                              : 'bg-[#141414] border-[#2A2A2A] text-neutral-300 hover:text-white'
                          }`}
                        >
                          रू {pack}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Form Input 1: Deposit Amount (in NPR) */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                      Deposit Amount (in NPR) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold font-gaming text-base">
                        रू
                      </span>
                      <input
                        type="number"
                        min="10"
                        step="5"
                        required
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(Number(e.target.value))}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#141414] border border-[#2D2D2D] text-white focus:border-[#E50914] focus:outline-none text-base font-gaming font-bold"
                        placeholder="e.g. 100"
                      />
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-1 flex items-center justify-between">
                      <span>Points to credit upon verification: <strong className="text-amber-400">{depositAmount} Points</strong></span>
                      <span className="text-[#FF2E3B]">1 NPR = 1 Point</span>
                    </div>
                  </div>

                  {/* Form Input 2: Khalti Transaction ID (TxnID / Reference Code) */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                      Khalti Transaction ID (TxnID / Reference Code) *
                    </label>
                    <input
                      type="text"
                      required
                      value={txnId}
                      onChange={(e) => setTxnId(e.target.value)}
                      placeholder="e.g. KL-94820194 or 839201928"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-[#2D2D2D] text-white focus:border-[#E50914] focus:outline-none text-sm font-mono tracking-wider font-semibold placeholder:text-neutral-600"
                    />
                    <span className="text-[10px] text-neutral-500 mt-1 block">
                      Found in your Khalti transaction history / receipt.
                    </span>
                  </div>

                  {/* Sender Khalti Number */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                      Your Khalti Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={senderKhaltiId}
                      onChange={(e) => setSenderKhaltiId(e.target.value)}
                      placeholder="e.g. 98XXXXXXXX"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-[#2D2D2D] text-white focus:border-[#E50914] focus:outline-none text-sm font-mono"
                    />
                  </div>

                  {/* Form Input 3: Screenshot File Uploader for transfer proof */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                      Transfer Proof Screenshot (File Uploader) *
                    </label>
                    
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="screenshot-upload"
                    />

                    {!screenshotUrl ? (
                      <label
                        htmlFor="screenshot-upload"
                        className="border-2 border-dashed border-[#333333] hover:border-[#E50914] rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#121212] group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center text-neutral-400 group-hover:text-[#FF2E3B] transition-colors mb-2">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div className="text-xs font-semibold text-white group-hover:text-[#FF2E3B] transition-colors">
                          Click to upload Khalti payment screenshot
                        </div>
                        <div className="text-[10px] text-neutral-500 mt-1">
                          Supports PNG, JPG, JPEG (Max 8MB)
                        </div>
                      </label>
                    ) : (
                      <div className="p-3 rounded-xl bg-[#141414] border border-[#2D2D2D] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div 
                            onClick={() => setPreviewScreenshot(screenshotUrl)}
                            className="w-14 h-14 rounded-lg bg-neutral-900 border border-neutral-700 overflow-hidden cursor-pointer shrink-0 relative group"
                          >
                            <img
                              src={screenshotUrl}
                              alt="Payment Proof"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Eye className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-white truncate">
                              {screenshotName || 'Payment_Proof.png'}
                            </div>
                            <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Screenshot uploaded successfully</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewScreenshot(screenshotUrl)}
                            className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 hover:text-white cursor-pointer"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveScreenshot}
                            className="px-2.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-xs text-red-300 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {depositErrorNotice && (
                    <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                      <span>{depositErrorNotice}</span>
                    </div>
                  )}

                  {depositSuccessNotice && (
                    <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-300 flex items-center gap-2">
                      <Clock className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>{depositSuccessNotice}</span>
                    </div>
                  )}

                  {/* Submit Button (Vibrant Crimson Red with glow) */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmittingDeposit}
                      className="btn-crimson w-full py-3.5 text-sm uppercase tracking-wider font-bold flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {isSubmittingDeposit 
                          ? 'Submitting Verification Request...' 
                          : `Submit Deposit Request (Status: PENDING)`}
                      </span>
                    </button>
                  </div>

                  <div className="text-[11px] text-neutral-400 text-center">
                    Requests are saved as <strong>"PENDING"</strong> and approved by Admin within 5–15 minutes.
                  </div>
                </form>

              </div>
            )}

            {/* TAB 2: WITHDRAWAL REQUEST FORM (Back to Khalti) */}
            {activeTab === 'khalti_withdraw' && (
              <form onSubmit={handleSubmitWithdraw} className="space-y-5">
                
                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/30 to-[#0A0A0A] border border-purple-500/30 text-xs text-neutral-300 space-y-1">
                  <div className="font-bold text-purple-400 flex items-center gap-1.5 text-sm">
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Instant Khalti Payout System</span>
                  </div>
                  <p className="text-neutral-400 leading-relaxed">
                    Request payout to your Khalti wallet. Minimum 100 Points (रू 100). Request will be saved with status <strong>"PENDING"</strong>.
                  </p>
                </div>

                {/* Form Input 1: Points to withdraw */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                    Points to Withdraw (1 Point = 1 NPR) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold font-gaming text-base">
                      रू
                    </span>
                    <input
                      type="number"
                      min="100"
                      max={walletPoints}
                      step="10"
                      required
                      value={withdrawPoints}
                      onChange={(e) => setWithdrawPoints(Number(e.target.value))}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#2D2D2D] text-white focus:border-[#E50914] focus:outline-none text-base font-gaming font-bold"
                    />
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-1 flex items-center justify-between">
                    <span>Available Points: <strong className="text-white">{walletPoints} Points</strong></span>
                    {walletPoints >= 100 && (
                      <button 
                        type="button" 
                        onClick={() => setWithdrawPoints(walletPoints)}
                        className="text-[#FF2E3B] font-bold hover:underline cursor-pointer"
                      >
                        Withdraw Max ({walletPoints} Pts)
                      </button>
                    )}
                  </div>
                </div>

                {/* Form Input 2: Khalti ID / Phone Number */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                    Your Khalti ID / Mobile Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={withdrawKhaltiId}
                    onChange={(e) => setWithdrawKhaltiId(e.target.value)}
                    placeholder="e.g. 9841234567 or 9801234567"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#2D2D2D] text-white focus:border-[#E50914] focus:outline-none text-sm font-mono tracking-wider font-semibold"
                  />
                  <span className="text-[10px] text-neutral-500 mt-1 block">
                    Cash will be transferred to this Khalti account directly.
                  </span>
                </div>

                {withdrawError && (
                  <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{withdrawError}</span>
                  </div>
                )}

                {withdrawSuccess && (
                  <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>{withdrawSuccess}</span>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingWithdraw || walletPoints < 100}
                    className="btn-crimson w-full py-3.5 text-sm uppercase tracking-wider font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ArrowUpRight className="w-5 h-5 text-white" />
                    <span>
                      {isSubmittingWithdraw 
                        ? 'Submitting...' 
                        : `Submit Withdrawal Request (Status: PENDING)`}
                    </span>
                  </button>
                </div>

                <div className="text-[11px] text-neutral-500 text-center">
                  Funds will be credited to your Khalti within 15 minutes of admin authorization.
                </div>
              </form>
            )}

            {/* TAB 3: TRANSACTION REQUESTS & PROOFS HISTORY */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                
                {/* Admin Simulation Banner to test instant approval */}
                {pendingTransactionsCount > 0 && onApprovePendingTransaction && (
                  <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/40 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-purple-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-purple-400" />
                        <span>Admin Verification Demo Mode</span>
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        {pendingTransactionsCount} request(s) awaiting verification. You can test approving a deposit below to instantly credit points (1 NPR = 1 Point).
                      </div>
                    </div>
                  </div>
                )}

                {transactions.length === 0 ? (
                  <div className="text-center py-12 text-neutral-500 text-xs">
                    No transactions or deposit requests yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => {
                      const isPending = tx.status === 'pending';
                      const isCompleted = tx.status === 'completed';
                      const isDeposit = tx.type === 'deposit';

                      return (
                        <div 
                          key={tx.id} 
                          className="p-4 rounded-xl bg-[#0A0A0A] border border-[#242424] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              isPending
                                ? 'bg-amber-950/60 text-amber-400 border border-amber-500/30'
                                : isDeposit
                                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                                : 'bg-red-950/60 text-[#FF2E3B] border border-red-500/30'
                            }`}>
                              {isPending ? (
                                <Clock className="w-5 h-5 animate-pulse" />
                              ) : isDeposit ? (
                                <ArrowDownLeft className="w-5 h-5" />
                              ) : (
                                <ArrowUpRight className="w-5 h-5" />
                              )}
                            </div>

                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-white text-xs">
                                  {tx.note || `${tx.method} ${tx.type === 'deposit' ? 'Deposit' : 'Withdrawal'}`}
                                </span>
                                
                                {/* Status Badge */}
                                {isPending ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                                    PENDING
                                  </span>
                                ) : isCompleted ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                    COMPLETED
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/40">
                                    FAILED
                                  </span>
                                )}
                              </div>

                              <div className="text-[11px] text-neutral-400 font-mono flex items-center gap-2 flex-wrap">
                                <span>Ref: {tx.referenceId}</span>
                                {tx.txnId && (
                                  <>
                                    <span aria-hidden="true" className="text-neutral-600">·</span>
                                    <span className="text-purple-300">Khalti TxnID: {tx.txnId}</span>
                                  </>
                                )}
                                <span aria-hidden="true" className="text-neutral-600">·</span>
                                <span>{tx.date}</span>
                              </div>

                              {/* Uploaded Screenshot Proof trigger if present */}
                              {tx.screenshotUrl && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewScreenshot(tx.screenshotUrl!)}
                                  className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer mt-1"
                                >
                                  <ImageIconLucide className="w-3.5 h-3.5" />
                                  <span>View Uploaded Khalti Proof Screenshot</span>
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1C1C1C]">
                            <div className="text-right">
                              <div className={`font-gaming font-extrabold text-lg tabular-nums ${
                                isDeposit ? 'text-emerald-400' : 'text-[#FF2E3B]'
                              }`}>
                                {isDeposit ? '+' : '-'}{tx.points} Pts
                              </div>
                              <div className="text-[10px] text-neutral-500">
                                रू {tx.amount} NPR
                              </div>
                            </div>

                            {/* Admin Approve action for pending deposit requests */}
                            {isPending && onApprovePendingTransaction && (
                              <button
                                type="button"
                                onClick={() => onApprovePendingTransaction(tx.id)}
                                className="btn-crimson px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1"
                                title="Approve and credit points"
                              >
                                <CheckCheck className="w-3.5 h-3.5" />
                                <span>Approve & Credit</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            )}

          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-[#222222] bg-[#0F0F0F] flex items-center justify-between">
            <div className="text-xs text-neutral-400 flex items-center gap-1.5">
              <span>Admin Khalti Support:</span>
              <strong className="text-purple-400 font-mono">{ADMIN_KHALTI_NUMBER}</strong>
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

      {/* PROOF SCREENSHOT PREVIEW MODAL */}
      {previewScreenshot && (
        <div 
          onClick={() => setPreviewScreenshot(null)}
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-md w-full bg-[#141414] border border-[#2B2B2B] rounded-2xl p-4 shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between text-white border-b border-[#222222] pb-2">
              <div className="text-xs font-bold uppercase tracking-wider">
                Khalti Transfer Proof Screenshot
              </div>
              <button
                onClick={() => setPreviewScreenshot(null)}
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto rounded-xl bg-black flex items-center justify-center">
              <img
                src={previewScreenshot}
                alt="Proof screenshot"
                className="max-w-full max-h-[65vh] object-contain rounded-lg"
              />
            </div>

            <button
              onClick={() => setPreviewScreenshot(null)}
              className="btn-crimson w-full py-2 text-xs uppercase font-bold"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* FULL-SIZE QR CODE ZOOM MODAL */}
      {isQrZoomed && customQrImage && (
        <div 
          onClick={() => setIsQrZoomed(false)}
          className="fixed inset-0 z-60 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative max-w-sm w-full bg-[#111111] border border-[#2B2B2B] p-5 rounded-3xl text-center space-y-4 shadow-2xl select-none"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
              <div className="flex items-center gap-2 text-left">
                <QrCode className="w-5 h-5 text-[#E50914]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Admin Khalti QR
                </h3>
              </div>
              <button
                onClick={() => setIsQrZoomed(false)}
                className="p-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black border border-neutral-700 flex items-center justify-center">
              <img
                src={customQrImage}
                alt="Enlarged Khalti QR"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <button
              onClick={() => setIsQrZoomed(false)}
              className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
