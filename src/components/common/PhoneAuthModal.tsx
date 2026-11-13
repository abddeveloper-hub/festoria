import React, { useState, useEffect } from 'react';
import { useFest } from '../../context/FestContext';
import { FESTORIA_LOGO, handleLogoError } from '../../utils/logo';
import {
  formatPhoneDisplay,
  normalizePhoneNumber,
  isEmailIdentifier,
} from '../../services/authService';
import {
  signInWithCredentials,
  registerParticipantWithCredentials,
  sendPasswordReset,
} from '../../firebase/authService';
import { Role, ParticipantCategory } from '../../types';
import {
  X,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Lock,
  User,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Building,
  GraduationCap,
  Users,
  Sparkles,
  KeyRound,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: Role | 'participant' | 'auto';
  initialMode?: 'signin' | 'register' | 'forgot';
  showSuperAdmin?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'auto',
  initialMode = 'signin',
  showSuperAdmin = false,
}) => {
  const {
    teams,
    categories,
    switchPortal,
    switchCurrentUser,
    setActiveTeamId,
    setActiveParticipantId,
    addToast,
    activeFestId,
  } = useFest();

  const isSuperAdminVisible = showSuperAdmin || defaultRole === 'super_admin';

  const [activeRole, setActiveRole] = useState<Role | 'participant' | 'auto'>(defaultRole);
  const [authMode, setAuthMode] = useState<'signin' | 'register' | 'forgot'>(initialMode);

  // Sign In Form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password state
  const [resetIdentifier, setResetIdentifier] = useState('');

  // Register Form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regCollege, setRegCollege] = useState('');
  const [regClass, setRegClass] = useState('');
  const [regCategory, setRegCategory] = useState<ParticipantCategory>('Senior');
  const [regTeamId, setRegTeamId] = useState(teams[0]?.id || 'TM-01');

  // UI status
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fillDemoCredentials = (role: Role | 'participant' | 'auto') => {
    const targetRole = role === 'auto' ? 'participant' : role;
    setActiveRole(targetRole);
    if (targetRole === 'super_admin') {
      setIdentifier('superadmin@festoria.app');
      setPassword('SuperAdmin@2025!');
    } else if (targetRole === 'admin' || targetRole === 'fest_admin') {
      setIdentifier('admin@festoria.app');
      setPassword('FestAdmin@2025!');
    } else if (targetRole === 'team_leader') {
      setIdentifier('leader@festoria.app');
      setPassword('TeamLeader@2025!');
    } else {
      setIdentifier('participant@festoria.app');
      setPassword('Participant@2025!');
    }
    setErrorMessage('');
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setActiveRole(defaultRole);
      setAuthMode(initialMode);
      setIdentifier('');
      setPassword('');
      setResetIdentifier('');
      setErrorMessage('');
      setSuccessMessage('');
      setShowPassword(false);
      setShowRegPassword(false);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [defaultRole, initialMode, isOpen]);

  if (!isOpen) return null;

  // --------------------------------------------------------------------------
  // HANDLER: Sign In
  // --------------------------------------------------------------------------
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!identifier.trim()) {
      setErrorMessage('Please enter your registered email address or mobile number.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithCredentials({
        identifier: identifier.trim(),
        password: password.trim(),
        intendedRole: activeRole,
      });

      if (result.success) {
        setSuccessMessage('Authenticated successfully!');
        if (result.user) {
          switchCurrentUser(result.user.id, result.user);
        }

        if (result.role === 'super_admin') {
          addToast('success', 'Authenticated', `Welcome back, Super Administrator ${result.user?.name || ''}!`);
          onClose();
          switchPortal('super_admin');
          return;
        }

        if (result.role === 'admin' || result.role === 'fest_admin') {
          addToast('success', 'Authenticated', `Welcome back, Fest Administrator ${result.user?.name || ''}!`);
          onClose();
          switchPortal('fest_admin');
          return;
        }

        if (result.role === 'team_leader') {
          if (result.user?.linkedTeamId) {
            setActiveTeamId(result.user.linkedTeamId);
          }
          addToast('success', 'Authenticated', `Welcome back, Team Leader ${result.user?.name || ''}!`);
          onClose();
          switchPortal('team_leader');
          return;
        }

        if (result.role === 'participant') {
          if (result.participant?.id) {
            setActiveParticipantId(result.participant.id);
          }
          addToast('success', 'Authenticated', `Welcome back, ${result.participant?.name || result.user?.name}!`);
          onClose();
          switchPortal('participant');
          return;
        }

        onClose();
        switchPortal('participant');
      } else {
        setErrorMessage(result.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // HANDLER: Register Participant
  // --------------------------------------------------------------------------
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!regName.trim() || regName.trim().length < 2) {
      setErrorMessage('Please enter your full legal name (at least 2 characters).');
      return;
    }
    if (!regEmail.trim() || !isEmailIdentifier(regEmail.trim())) {
      setErrorMessage('Please enter a valid official email address.');
      return;
    }
    const normPhone = normalizePhoneNumber(regPhone);
    if (!normPhone || normPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile phone number.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Password confirmation does not match.');
      return;
    }
    if (!regCollege.trim()) {
      setErrorMessage('Please enter your institution or college name.');
      return;
    }

    setLoading(true);
    try {
      const regResult = await registerParticipantWithCredentials({
        name: regName.trim(),
        email: regEmail.trim(),
        phone: normPhone,
        password: regPassword,
        confirmPassword: regConfirmPassword,
        college: regCollege.trim(),
        classOrDivision: regClass.trim(),
        category: regCategory,
        requestedTeamId: regTeamId,
        festId: activeFestId || 'FEST-01',
      });

      if (regResult.success) {
        if (regResult.user) {
          switchCurrentUser(regResult.user.id, regResult.user);
        }
        if (regResult.participantId) {
          setActiveParticipantId(regResult.participantId);
        }
        addToast(
          'success',
          'Registration Submitted',
          'Your participant registration was created and submitted for team verification.'
        );
        onClose();
        switchPortal('participant');
      } else {
        setErrorMessage(regResult.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to complete registration.');
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // HANDLER: Password Reset
  // --------------------------------------------------------------------------
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!resetIdentifier.trim()) {
      setErrorMessage('Please enter your registered email address or mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await sendPasswordReset(resetIdentifier.trim());
      if (res.success) {
        setSuccessMessage(res.message);
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-md animate-in fade-in duration-200">
      {/* Phone Screen Canvas Container */}
      <div className="w-full max-w-[420px] bg-[#0d5c58] shadow-[0_25px_60px_-15px_rgba(13,92,88,0.35)] rounded-[34px] overflow-hidden relative border border-teal-600/40 flex flex-col max-h-[94dvh]">
        {/* ==================================================================== */}
        {/* TOP TEAL SECTION (~220px) WITH ORGANIC BLOBS & BOTANICAL PLANT       */}
        {/* ==================================================================== */}
        <header className="relative w-full h-[220px] bg-[#0d5c58] px-7 flex flex-col justify-between overflow-hidden pt-6 shrink-0">
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-40 p-2 text-teal-200 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Decorative Abstract Mint Organic Blob (Top Left) */}
          <div className="absolute -top-10 -left-12 w-44 h-44 bg-[#8ee6d3] rounded-full opacity-80 mix-blend-screen pointer-events-none transform -rotate-12 blur-[0.5px]">
            <div className="w-full h-full rounded-full border-[10px] border-[#69d9c2] opacity-40"></div>
          </div>
          <div className="absolute -top-4 left-6 w-24 h-24 bg-[#76dec8] rounded-full opacity-60 pointer-events-none"></div>

          {/* Greeting Copy */}
          <div className="z-20 mt-2 mb-2">
            <h1 className="text-white text-3xl font-extrabold tracking-tight">
              {authMode === 'register' ? 'Join Us!' : authMode === 'forgot' ? 'Reset' : 'Hello!'}
            </h1>
            <p className="text-teal-100/90 text-sm font-medium mt-0.5">
              {authMode === 'register'
                ? 'Create your Festoria account'
                : authMode === 'forgot'
                ? 'Recover your account access'
                : 'Welcome to Festoria'}
            </p>
          </div>

          {/* Decorative Botanical Plant in Minimal Ceramic Pot */}
          <div
            className="absolute right-6 bottom-0 z-30 flex flex-col items-center plant-bounce pointer-events-none"
            style={{ transformOrigin: 'bottom center' }}
          >
            {/* Foliage / Leaves */}
            <svg className="w-20 h-32 drop-shadow-md" fill="none" viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg">
              {/* Center tall spear leaf */}
              <path d="M50 8C43 45 44 80 50 120C56 80 57 45 50 8Z" fill="#58c4aa"></path>
              <path d="M50 18C47 48 48 78 50 120C53 78 54 48 50 18Z" fill="#7de0ca"></path>
              {/* Left curved leaf */}
              <path d="M48 60C30 50 18 20 20 8C20 30 32 70 49 95Z" fill="#44b499"></path>
              {/* Right curved spear leaf */}
              <path d="M52 50C68 35 78 12 76 5C76 25 66 65 51 90Z" fill="#6ad2bc"></path>
              {/* Small accent foliage */}
              <path d="M50 75C40 70 32 55 35 48C38 60 44 75 50 85Z" fill="#88ebd6"></path>
            </svg>
            {/* Ceramic Pot */}
            <div className="w-12 h-10 bg-white rounded-b-xl rounded-t-xs shadow-md flex items-center justify-center border-t-2 border-slate-100 -mt-1 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-100 to-transparent"></div>
              <div className="w-2 h-1 bg-[#44b499]/20 rounded-full"></div>
            </div>
          </div>
        </header>

        {/* ==================================================================== */}
        {/* BOTTOM WHITE ROUNDED CARD (ROUNDED-T-[38PX])                         */}
        {/* ==================================================================== */}
        <section className="relative w-full flex-1 bg-white rounded-t-[38px] px-6 sm:px-8 pt-7 pb-6 flex flex-col justify-between shadow-[-10px_0_30px_rgba(0,0,0,0.05)] z-20 overflow-y-auto">
          <div className="space-y-4">
            {/* Card Title & Role Badge */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl font-bold text-[#0d5c58] tracking-tight">
                  {authMode === 'register' ? 'Sign Up' : authMode === 'forgot' ? 'Reset' : 'Login'}
                </h2>
                <span className="w-2 h-2 rounded-full bg-teal-500 inline-block animate-pulse"></span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#44b499]/20 text-[#0d5c58] border border-[#69d9c2]/50 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#0d5c58]" />
                {authMode === 'register' ? 'Participant Portal' : activeRole === 'admin' ? 'Admin Portal' : activeRole === 'team_leader' ? 'Leader Portal' : 'Organizer Portal'}
              </span>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <div className="leading-relaxed font-medium">{errorMessage}</div>
              </div>
            )}

            {/* Success Message Alert */}
            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-800 animate-in fade-in duration-150">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <div className="leading-relaxed font-medium">{successMessage}</div>
              </div>
            )}

            {/* ================================================================ */}
            {/* SCREEN 1: LOGIN FORM                                             */}
            {/* ================================================================ */}
            {authMode === 'signin' && (
              <div className="space-y-3.5">
                {/* Role Switcher Chips */}
                <div>
                  <div className={`grid gap-1 p-1 bg-[#f4f7f6] rounded-full border border-slate-200/80 text-[11px] font-bold ${
                    isSuperAdminVisible ? 'grid-cols-4' : 'grid-cols-3'
                  }`}>
                    <button
                      type="button"
                      onClick={() => setActiveRole('participant')}
                      className={`py-1.5 rounded-full transition-all ${
                        activeRole === 'participant'
                          ? 'bg-white text-[#0d5c58] shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Participant
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveRole('team_leader')}
                      className={`py-1.5 rounded-full transition-all ${
                        activeRole === 'team_leader'
                          ? 'bg-white text-[#0d5c58] shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Leader
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveRole('admin')}
                      className={`py-1.5 rounded-full transition-all ${
                        activeRole === 'admin'
                          ? 'bg-white text-[#0d5c58] shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Admin
                    </button>
                    {isSuperAdminVisible && (
                      <button
                        type="button"
                        onClick={() => setActiveRole('super_admin')}
                        className={`py-1.5 rounded-full transition-all ${
                          activeRole === 'super_admin'
                            ? 'bg-white text-[#0d5c58] shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Super
                      </button>
                    )}
                  </div>
                </div>

                {/* Demo Credentials Pill */}
                <div className="flex items-center justify-between px-3 py-2 bg-[#f4f7f6] rounded-2xl text-[11px]">
                  <span className="font-semibold text-slate-500 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    <span>Demo Credentials:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials(activeRole)}
                    className="font-bold text-[#0d5c58] hover:underline"
                  >
                    Auto-Fill {activeRole === 'admin' ? 'Admin' : activeRole === 'team_leader' ? 'Leader' : activeRole === 'super_admin' ? 'Super Admin' : 'Participant'}
                  </button>
                </div>

                <form onSubmit={handleSignIn} className="space-y-3">
                  {/* Identifier Input */}
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-slate-400">
                      <User className="w-5 h-5 text-slate-400" />
                    </span>
                    <input
                      type="text"
                      placeholder="Username, Email or Mobile"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      disabled={loading}
                      required
                      className="w-full bg-[#f4f7f6] hover:bg-[#edf3f1] focus:bg-white text-slate-700 placeholder-slate-400 text-sm font-medium rounded-full py-3.5 pl-12 pr-4 border border-transparent focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition duration-200"
                    />
                  </div>

                  {/* Password Input */}
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-slate-400">
                      <Lock className="w-5 h-5 text-slate-400" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                      className="w-full bg-[#f4f7f6] hover:bg-[#edf3f1] focus:bg-white text-slate-700 placeholder-slate-400 text-sm font-medium rounded-full py-3.5 pl-12 pr-12 border border-transparent focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Forgot Password */}
                  <div className="flex justify-end pr-1 pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('forgot');
                        setResetIdentifier(identifier);
                        setErrorMessage('');
                        setSuccessMessage('');
                      }}
                      className="text-xs font-semibold text-teal-800/80 hover:text-teal-900 transition"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {/* Primary Login Button */}
                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={loading || !identifier.trim() || !password.trim()}
                      className="w-full bg-[#0d5c58] hover:bg-[#094845] active:scale-[0.98] text-white font-semibold py-3.5 px-6 rounded-full shadow-md shadow-teal-950/20 text-sm tracking-wide transition-all duration-150 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                    >
                      <span>{loading ? 'Authenticating...' : 'Login'}</span>
                    </button>
                  </div>
                </form>

                {/* Social Login Divider & Buttons */}
                <div className="space-y-3 pt-1">
                  <div className="relative flex items-center justify-center">
                    <div className="border-t border-slate-200/80 w-full"></div>
                    <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      or
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      aria-label="Sign in with Facebook"
                      className="w-11 h-11 rounded-full border border-slate-200 hover:border-teal-300 bg-white hover:bg-slate-50 flex items-center justify-center shadow-xs hover:shadow transition transform active:scale-95"
                    >
                      <svg className="w-5 h-5 text-[#1877F2] fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path>
                      </svg>
                    </button>

                    <button
                      type="button"
                      aria-label="Sign in with Google"
                      className="w-11 h-11 rounded-full border border-slate-200 hover:border-teal-300 bg-white hover:bg-slate-50 flex items-center justify-center shadow-xs hover:shadow transition transform active:scale-95"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" fill="#4285F4"></path>
                        <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.26v3.15C3.26 21.36 7.34 24 12 24z" fill="#34A853"></path>
                        <path d="M5.28 14.26c-.25-.72-.38-1.49-.38-2.26s.13-1.54.38-2.26V6.59H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.41l4.02-3.15z" fill="#FBBC05"></path>
                        <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.26 6.59l4.02 3.15c.95-2.84 3.6-4.99 6.72-4.99z" fill="#EA4335"></path>
                      </svg>
                    </button>

                    <button
                      type="button"
                      aria-label="Sign in with Apple"
                      className="w-11 h-11 rounded-full border border-slate-200 hover:border-teal-300 bg-white hover:bg-slate-50 flex items-center justify-center shadow-xs hover:shadow transition transform active:scale-95"
                    >
                      <svg className="w-5 h-5 text-black fill-current" viewBox="0 0 24 24">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.64-.78 1.08-1.86.96-2.95-1 .04-2.16.66-2.83 1.45-.58.67-1.09 1.77-.96 2.82 1.12.09 2.21-.57 2.83-1.32z"></path>
                      </svg>
                    </button>
                  </div>

                  {/* Switch to Sign Up */}
                  <p className="text-center text-xs text-slate-500 font-medium pt-1">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('register');
                        setErrorMessage('');
                        setSuccessMessage('');
                      }}
                      className="text-[#116963] font-bold hover:underline ml-1 focus:outline-none"
                    >
                      Sign Up
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* ================================================================ */}
            {/* SCREEN 2: SIGN UP VIEW (FULL BOTANICAL TEAL & MINT DESIGN)        */}
            {/* ================================================================ */}
            {authMode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3">
                {/* Full Legal Name */}
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-slate-400">
                    <User className="w-5 h-5 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    placeholder="Full Legal Name"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    disabled={loading}
                    required
                    className="w-full bg-[#f4f7f6] hover:bg-[#edf3f1] focus:bg-white text-slate-700 placeholder-slate-400 text-sm font-medium rounded-full py-3.5 pl-12 pr-4 border border-transparent focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition duration-200"
                  />
                </div>

                {/* Email Address */}
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-slate-400">
                    <Mail className="w-5 h-5 text-slate-400" />
                  </span>
                  <input
                    type="email"
                    placeholder="Email Address (e.g. name@college.edu)"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    disabled={loading}
                    required
                    className="w-full bg-[#f4f7f6] hover:bg-[#edf3f1] focus:bg-white text-slate-700 placeholder-slate-400 text-sm font-medium rounded-full py-3.5 pl-12 pr-4 border border-transparent focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition duration-200"
                  />
                </div>

                {/* Mobile Phone Number */}
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-slate-400">
                    <Phone className="w-5 h-5 text-slate-400" />
                  </span>
                  <input
                    type="tel"
                    placeholder="Mobile Number (10 digits)"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    disabled={loading}
                    required
                    className="w-full bg-[#f4f7f6] hover:bg-[#edf3f1] focus:bg-white text-slate-700 placeholder-slate-400 text-sm font-medium rounded-full py-3.5 pl-12 pr-4 border border-transparent focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition duration-200"
                  />
                </div>

                {/* Password Input */}
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-slate-400">
                    <Lock className="w-5 h-5 text-slate-400" />
                  </span>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    placeholder="Password (Min 6 characters)"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    disabled={loading}
                    required
                    minLength={6}
                    className="w-full bg-[#f4f7f6] hover:bg-[#edf3f1] focus:bg-white text-slate-700 placeholder-slate-400 text-sm font-medium rounded-full py-3.5 pl-12 pr-12 border border-transparent focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-4 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Confirm Password */}
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-slate-400">
                    <Lock className="w-5 h-5 text-slate-400" />
                  </span>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    placeholder="Confirm Password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    disabled={loading}
                    required
                    minLength={6}
                    className="w-full bg-[#f4f7f6] hover:bg-[#edf3f1] focus:bg-white text-slate-700 placeholder-slate-400 text-sm font-medium rounded-full py-3.5 pl-12 pr-4 border border-transparent focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition duration-200"
                  />
                </div>

                {/* College / Institution */}
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-slate-400">
                    <Building className="w-5 h-5 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    placeholder="Institution / College Name"
                    value={regCollege}
                    onChange={(e) => setRegCollege(e.target.value)}
                    disabled={loading}
                    required
                    className="w-full bg-[#f4f7f6] hover:bg-[#edf3f1] focus:bg-white text-slate-700 placeholder-slate-400 text-sm font-medium rounded-full py-3.5 pl-12 pr-4 border border-transparent focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition duration-200"
                  />
                </div>

                {/* Team / House Selection */}
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-slate-400">
                    <Users className="w-5 h-5 text-slate-400" />
                  </span>
                  <select
                    value={regTeamId}
                    onChange={(e) => setRegTeamId(e.target.value)}
                    disabled={loading}
                    className="w-full bg-[#f4f7f6] hover:bg-[#edf3f1] focus:bg-white text-slate-700 text-sm font-medium rounded-full py-3.5 pl-12 pr-4 border border-transparent focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition duration-200 cursor-pointer"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Primary Sign Up Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#0d5c58] hover:bg-[#094845] active:scale-[0.98] text-white font-semibold py-3.5 px-6 rounded-full shadow-md shadow-teal-950/20 text-sm tracking-wide transition-all duration-150 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                  >
                    <span>{loading ? 'Creating Account...' : 'Sign Up'}</span>
                  </button>
                </div>

                {/* Social Sign Up Divider & Buttons */}
                <div className="space-y-3 pt-1">
                  <div className="relative flex items-center justify-center">
                    <div className="border-t border-slate-200/80 w-full"></div>
                    <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      or
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      aria-label="Sign up with Facebook"
                      className="w-11 h-11 rounded-full border border-slate-200 hover:border-teal-300 bg-white hover:bg-slate-50 flex items-center justify-center shadow-xs hover:shadow transition transform active:scale-95"
                    >
                      <svg className="w-5 h-5 text-[#1877F2] fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path>
                      </svg>
                    </button>

                    <button
                      type="button"
                      aria-label="Sign up with Google"
                      className="w-11 h-11 rounded-full border border-slate-200 hover:border-teal-300 bg-white hover:bg-slate-50 flex items-center justify-center shadow-xs hover:shadow transition transform active:scale-95"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" fill="#4285F4"></path>
                        <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.26v3.15C3.26 21.36 7.34 24 12 24z" fill="#34A853"></path>
                        <path d="M5.28 14.26c-.25-.72-.38-1.49-.38-2.26s.13-1.54.38-2.26V6.59H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.41l4.02-3.15z" fill="#FBBC05"></path>
                        <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.26 6.59l4.02 3.15c.95-2.84 3.6-4.99 6.72-4.99z" fill="#EA4335"></path>
                      </svg>
                    </button>

                    <button
                      type="button"
                      aria-label="Sign up with Apple"
                      className="w-11 h-11 rounded-full border border-slate-200 hover:border-teal-300 bg-white hover:bg-slate-50 flex items-center justify-center shadow-xs hover:shadow transition transform active:scale-95"
                    >
                      <svg className="w-5 h-5 text-black fill-current" viewBox="0 0 24 24">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.64-.78 1.08-1.86.96-2.95-1 .04-2.16.66-2.83 1.45-.58.67-1.09 1.77-.96 2.82 1.12.09 2.21-.57 2.83-1.32z"></path>
                      </svg>
                    </button>
                  </div>

                  {/* Switch to Login */}
                  <p className="text-center text-xs text-slate-500 font-medium pt-1">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signin');
                        setErrorMessage('');
                        setSuccessMessage('');
                      }}
                      className="text-[#116963] font-bold hover:underline ml-1 focus:outline-none"
                    >
                      Login
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* ================================================================ */}
            {/* SCREEN 3: FORGOT PASSWORD                                        */}
            {/* ================================================================ */}
            {authMode === 'forgot' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="p-1 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold text-slate-700">Back to Login</span>
                </div>

                <div className="p-3 bg-[#f4f7f6] rounded-2xl text-xs text-slate-600 leading-relaxed">
                  Enter your registered email address or mobile number. We will dispatch secure password reset instructions to your account.
                </div>

                <form onSubmit={handlePasswordReset} className="space-y-3.5">
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-slate-400">
                      <KeyRound className="w-5 h-5 text-slate-400" />
                    </span>
                    <input
                      type="text"
                      placeholder="Email Address or Mobile Number"
                      value={resetIdentifier}
                      onChange={(e) => setResetIdentifier(e.target.value)}
                      disabled={loading}
                      required
                      className="w-full bg-[#f4f7f6] hover:bg-[#edf3f1] focus:bg-white text-slate-700 placeholder-slate-400 text-sm font-medium rounded-full py-3.5 pl-12 pr-4 border border-transparent focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition duration-200"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !resetIdentifier.trim()}
                    className="w-full bg-[#0d5c58] hover:bg-[#094845] active:scale-[0.98] text-white font-semibold py-3.5 px-6 rounded-full shadow-md shadow-teal-950/20 text-sm tracking-wide transition-all duration-150 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                  >
                    <span>{loading ? 'Sending Link...' : 'Send Password Reset'}</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export { AuthModal as PhoneAuthModal };
