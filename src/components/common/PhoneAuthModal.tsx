import React, { useState, useEffect } from 'react';
import { useFest } from '../../context/FestContext';
import {
  formatPhoneDisplay,
  maskPhoneNumber,
  normalizePhoneNumber,
  checkAccountEligibility,
} from '../../services/authService';
import {
  requestFirebasePhoneOtp,
  verifyFirebasePhoneOtp,
} from '../../firebase/authService';
import { Role, ParticipantCategory } from '../../types';
import {
  X,
  Phone,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Lock,
  RefreshCw,
  User,
  Sparkles,
  Building,
  GraduationCap,
  Users,
  Info
} from 'lucide-react';

interface PhoneAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: Role | 'participant' | 'auto';
}

export const PhoneAuthModal: React.FC<PhoneAuthModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'auto',
}) => {
  const {
    users,
    participants,
    teams,
    switchPortal,
    switchCurrentUser,
    setActiveTeamId,
    setActiveParticipantId,
    registerParticipantSelf,
    addToast,
  } = useFest();

  const [activeRole, setActiveRole] = useState<Role | 'participant' | 'auto'>(defaultRole);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'register_details'>('phone');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Self-Registration Form fields (for Method A)
  const [regData, setRegData] = useState({
    name: '',
    email: '',
    college: '',
    classOrDivision: '',
    category: 'Senior' as ParticipantCategory,
    requestedTeamId: teams[0]?.id || 'TM-01',
  });

  useEffect(() => {
    setActiveRole(defaultRole);
    setStep('phone');
    setPhoneNumber('');
    setOtpCode('');
    setErrorMessage('');
    setSuccessMessage('');
  }, [defaultRole, isOpen]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!isOpen) return null;

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!phoneNumber.trim()) {
      setErrorMessage('Please enter your mobile phone number.');
      return;
    }

    setLoading(true);
    try {
      const result = await requestFirebasePhoneOtp(phoneNumber, activeRole, 'recaptcha-container');
      if (result.success) {
        setStep('otp');
        setSuccessMessage(result.message);
        if (result.cooldownSeconds) setCooldown(result.cooldownSeconds);
      } else {
        setErrorMessage(result.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send verification OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    setErrorMessage('');
    try {
      const result = await requestFirebasePhoneOtp(phoneNumber, activeRole, 'recaptcha-container');
      if (result.success) {
        setSuccessMessage('A new verification code has been dispatched.');
        if (result.cooldownSeconds) setCooldown(result.cooldownSeconds);
      } else {
        setErrorMessage(result.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error resending OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!otpCode || otpCode.trim().length !== 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyFirebasePhoneOtp(phoneNumber, otpCode, activeRole);
      if (result.success) {
        setSuccessMessage('Phone verified successfully!');

        // If this is a new participant wanting to register
        if (result.isNewUser || (!result.user && !result.participant)) {
          setStep('register_details');
          setLoading(false);
          return;
        }

        // Existing User / Participant: Dispatch to correct dashboard!
        if (result.role === 'super_admin') {
          if (result.user) switchCurrentUser(result.user.id, result.user);
          addToast('success', 'Authenticated', `Welcome back, ${result.user?.name}!`);
          onClose();
          switchPortal('super_admin');
          return;
        }

        if (result.role === 'admin' || result.role === 'fest_admin') {
          if (result.user) switchCurrentUser(result.user.id, result.user);
          addToast('success', 'Authenticated', `Welcome back, Fest Administrator ${result.user?.name}!`);
          onClose();
          switchPortal('fest_admin');
          return;
        }

        if (result.role === 'team_leader') {
          if (result.user) switchCurrentUser(result.user.id, result.user);
          if (result.user?.linkedTeamId) {
            setActiveTeamId(result.user.linkedTeamId);
          }
          addToast('success', 'Authenticated', `Welcome back, Team Leader ${result.user?.name}!`);
          onClose();
          switchPortal('team_leader');
          return;
        }

        if (result.role === 'participant') {
          if (result.user) switchCurrentUser(result.user.id, result.user);
          if (result.participant?.id) {
            setActiveParticipantId(result.participant.id);
          }
          addToast('success', 'Authenticated', `Welcome back, ${result.participant?.name || result.user?.name}!`);
          onClose();
          switchPortal('participant');
          return;
        }

        // Fallback for judge / other roles
        onClose();
        switchPortal('fest_admin');
      } else {
        setErrorMessage(result.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!regData.name.trim()) {
      setErrorMessage('Please enter your full legal name.');
      return;
    }

    if (!regData.email.trim() || !regData.email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!regData.college.trim()) {
      setErrorMessage('Please enter your institution or college name.');
      return;
    }

    const regResult = registerParticipantSelf({
      name: regData.name.trim(),
      phone: phoneNumber,
      email: regData.email.trim(),
      college: regData.college.trim(),
      classOrDivision: regData.classOrDivision.trim(),
      category: regData.category,
      requestedTeamId: regData.requestedTeamId,
    });

    if (regResult.success) {
      setActiveParticipantId(regResult.participantId);
      addToast(
        'success',
        'Registration Submitted',
        'Your request has been submitted to the Team Leader for approval.'
      );
      onClose();
      switchPortal('participant');
    } else {
      setErrorMessage(regResult.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs tracking-wider">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {step === 'register_details'
                  ? 'Complete Participant Registration'
                  : 'FestFlow Secure Sign-In'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {step === 'otp'
                  ? 'Verify 6-digit SMS OTP'
                  : step === 'register_details'
                  ? 'Official Fest Participant Onboarding'
                  : 'Phone-number OTP Verification'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Role Tabs (Only on initial Phone Step) */}
          {step === 'phone' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">
                Signing In As:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveRole('participant')}
                  className={`py-1.5 px-2 rounded text-center transition-all ${
                    activeRole === 'participant' || activeRole === 'auto'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Participant
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRole('team_leader')}
                  className={`py-1.5 px-2 rounded text-center transition-all ${
                    activeRole === 'team_leader'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Team Leader
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRole('admin')}
                  className={`py-1.5 px-2 rounded text-center transition-all ${
                    activeRole === 'admin'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRole('super_admin')}
                  className={`py-1.5 px-2 rounded text-center transition-all ${
                    activeRole === 'super_admin'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Super Admin
                </button>
              </div>
            </div>
          )}

          {/* Error & Info Alerts */}
          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{successMessage}</div>
            </div>
          )}

          {/* STEP 1: Phone Number Input */}
          {step === 'phone' && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Registered Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-mono placeholder:font-sans placeholder:text-slate-400 text-slate-900"
                    autoFocus
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Enter your registered 10-digit mobile number with country code. We will send a secure 6-digit OTP verification code.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white font-semibold text-xs rounded-lg hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: OTP Verification Input */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center pb-2">
                <span className="text-xs text-slate-500">Code dispatched to:</span>
                <div className="text-sm font-mono font-bold text-slate-900">
                  {formatPhoneDisplay(phoneNumber)}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setOtpCode('');
                  }}
                  className="text-[11px] text-slate-500 hover:text-slate-900 underline mt-1"
                >
                  Change phone number
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-center">
                  Enter 6-Digit OTP <span className="text-rose-500">*</span>
                </label>
                <div className="relative max-w-[220px] mx-auto">
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full text-center py-2.5 text-2xl font-mono tracking-widest bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-slate-900"
                    autoFocus
                  />
                </div>
                <p className="text-center mt-2 text-[11px] text-slate-500">
                  OTP is cryptographically verified. Valid for 5 minutes.
                </p>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500">Didn't receive code?</span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={cooldown > 0 || loading}
                  className="font-semibold text-slate-900 hover:underline disabled:opacity-50 disabled:no-underline"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || otpCode.length !== 6}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white font-semibold text-xs rounded-lg hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Verify & Continue</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Participant Self-Registration Form (Method A) */}
          {step === 'register_details' && (
            <form onSubmit={handleCompleteRegistration} className="space-y-4">
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Phone number <strong className="font-mono">{formatPhoneDisplay(phoneNumber)}</strong>{' '}
                  verified! Please complete your participant details.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Legal Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={regData.name}
                    onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                    placeholder="e.g. Siddharth Iyer"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={regData.email}
                    onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                    placeholder="participant@example.com"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Participant Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={regData.category}
                    onChange={(e) =>
                      setRegData({ ...regData, category: e.target.value as ParticipantCategory })
                    }
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                  >
                    <option value="Senior">Senior</option>
                    <option value="Junior">Junior</option>
                    <option value="Sub-Junior">Sub-Junior</option>
                    <option value="Open">Open</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Institution / College <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Building className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={regData.college}
                      onChange={(e) => setRegData({ ...regData, college: e.target.value })}
                      placeholder="e.g. Madras Arts College"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Class / Division
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={regData.classOrDivision}
                      onChange={(e) =>
                        setRegData({ ...regData, classOrDivision: e.target.value })
                      }
                      placeholder="e.g. BTech III CSE - A"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Requested Team <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <select
                    value={regData.requestedTeamId}
                    onChange={(e) => setRegData({ ...regData, requestedTeamId: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 font-medium"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.code}) — {t.teamLeaderName || 'Leader Assigned'}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  Membership is finalized only after approval by the selected Team Leader.
                </p>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white font-semibold text-xs rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Registration Request</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
