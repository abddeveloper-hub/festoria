import React, { useState, useEffect } from 'react';
import { useFest } from '../../context/FestContext';
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
  // HANDLER: Sign In (Email OR Mobile + Password)
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

        // Dispatch user session to context
        if (result.user) {
          switchCurrentUser(result.user.id, result.user);
        }

        // Role-based portal navigation
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

        // Fallback for general sign in
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
  // HANDLER: Register Participant (Full details + Password)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs tracking-wider">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {authMode === 'register'
                  ? 'Participant Registration'
                  : authMode === 'forgot'
                  ? 'Reset Your Password'
                  : 'Festoria Secure Sign-In'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {authMode === 'register'
                  ? 'Official Fest Participant Onboarding'
                  : authMode === 'forgot'
                  ? 'Account Security & Recovery'
                  : 'Sign in with your Email or Mobile + Password'}
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
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Error Message Banner */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex flex-col gap-2 text-xs text-red-700 animate-in fade-in duration-150">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <div className="leading-relaxed font-medium">{errorMessage}</div>
              </div>
              {errorMessage.includes('Firebase Console') && (
                <a
                  href="https://console.firebase.google.com/project/festoria-cd375/authentication/providers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-6.5 inline-flex items-center gap-1 text-[11px] font-bold text-red-800 underline hover:text-red-950"
                >
                  <span>Open Firebase Console Sign-in Providers</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {/* Success Message Banner */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2.5 text-xs text-emerald-800 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <div className="leading-relaxed font-medium">{successMessage}</div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 1: SIGN IN FORM                                             */}
          {/* ================================================================ */}
          {authMode === 'signin' && (
            <div className="space-y-4">
              {/* Role Tabs */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Signing In As:
                </label>
                <div className={`grid gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold ${
                  isSuperAdminVisible ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'
                }`}>
                  <button
                    type="button"
                    onClick={() => setActiveRole('participant')}
                    className={`py-1.5 rounded-md transition-all flex items-center justify-center gap-1 ${
                      activeRole === 'participant'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <User className="w-3 h-3" />
                    <span>Participant</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRole('team_leader')}
                    className={`py-1.5 rounded-md transition-all flex items-center justify-center gap-1 ${
                      activeRole === 'team_leader'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-3 h-3" />
                    <span>Team Leader</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRole('admin')}
                    className={`py-1.5 rounded-md transition-all flex items-center justify-center gap-1 ${
                      activeRole === 'admin'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Building className="w-3 h-3" />
                    <span>Fest Admin</span>
                  </button>
                  {isSuperAdminVisible && (
                    <button
                      type="button"
                      onClick={() => setActiveRole('super_admin')}
                      className={`py-1.5 rounded-md transition-all flex items-center justify-center gap-1 ${
                        activeRole === 'super_admin'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>Super Admin</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Demo Access Pill */}
              <div className="flex items-center justify-between px-3 py-2 bg-indigo-50/70 border border-indigo-100 rounded-lg text-xs">
                <span className="font-medium text-slate-600 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Demo Access:</span>
                </span>
                <button
                  type="button"
                  onClick={() => fillDemoCredentials(activeRole)}
                  className="font-bold text-indigo-700 hover:text-indigo-900 underline text-xs transition-colors"
                >
                  Fill {activeRole === 'admin' ? 'Fest Admin' : activeRole === 'team_leader' ? 'Team Leader' : activeRole === 'super_admin' ? 'Super Admin' : 'Participant'} Credentials
                </button>
              </div>

              {/* Sign In Form */}
              <form onSubmit={handleSignIn} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address or Mobile Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. name@college.edu or 98401 23001"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      disabled={loading}
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      {isEmailIdentifier(identifier) ? (
                        <Mail className="w-4 h-4" />
                      ) : (
                        <Phone className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Sign in with either your registered email address or 10-digit mobile number.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('forgot');
                        setResetIdentifier(identifier);
                        setErrorMessage('');
                        setSuccessMessage('');
                      }}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your account password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !identifier.trim() || !password.trim()}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  {loading ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Registration Link */}
              <div className="pt-3 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-600">
                  New participant?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('register');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="font-semibold text-slate-900 hover:underline"
                  >
                    Create a Participant Account
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 2: PARTICIPANT REGISTRATION FORM                            */}
          {/* ================================================================ */}
          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Legal Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Aditi Sharma"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Email *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="name@college.edu"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="98401 23001"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password * (Min 6 chars)
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      placeholder="Create password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                    <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                    <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    College / Institution *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Loyola College"
                      value={regCollege}
                      onChange={(e) => setRegCollege(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                    <Building className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Class / Division
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. III B.Sc Computer Science"
                      value={regClass}
                      onChange={(e) => setRegClass(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                    <GraduationCap className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={regCategory}
                    onChange={(e) => setRegCategory(e.target.value as ParticipantCategory)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="Senior">Senior (Undergraduate/PG)</option>
                    <option value="Junior">Junior (Higher Secondary)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select House / Team *
                  </label>
                  <select
                    value={regTeamId}
                    onChange={(e) => setRegTeamId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-xs mt-2"
              >
                {loading ? (
                  <span>Registering Account...</span>
                ) : (
                  <>
                    <span>Submit Participant Registration</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="text-xs text-slate-600 hover:text-slate-900 font-semibold"
                >
                  Already have an account? Sign In
                </button>
              </div>
            </form>
          )}

          {/* ================================================================ */}
          {/* TAB 3: FORGOT PASSWORD                                          */}
          {/* ================================================================ */}
          {authMode === 'forgot' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold text-slate-700">Back to Sign In</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 leading-relaxed">
                Enter your registered email address or mobile number. We will dispatch secure password reset instructions to your registered email account.
              </div>

              <form onSubmit={handlePasswordReset} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address or Mobile Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. name@college.edu or 98401 23001"
                      value={resetIdentifier}
                      onChange={(e) => setResetIdentifier(e.target.value)}
                      disabled={loading}
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                    />
                    <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !resetIdentifier.trim()}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  {loading ? (
                    <span>Sending Reset Link...</span>
                  ) : (
                    <>
                      <span>Send Password Reset Instructions</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Aliased export to preserve backwards compatibility across existing components
export { AuthModal as PhoneAuthModal };
