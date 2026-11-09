import React, { useState, useEffect } from 'react';
import { useFest } from '../../context/FestContext';
import { FestInvitation, User } from '../../types';
import { navigateTo } from '../../utils/navigation';
import {
  validateInvitationToken,
  acceptFestInvitation
} from '../../firebase/firestoreService';
import {
  signInWithCredentials,
  registerParticipantWithCredentials
} from '../../firebase/authService';
import {
  ShieldCheck,
  Award,
  Shield,
  Clock,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  ExternalLink,
  UserCheck,
  Sparkles,
  Calendar,
  Building,
  Mail,
  Phone
} from 'lucide-react';

interface InvitationAcceptPageProps {
  tokenProp?: string;
}

export const InvitationAcceptPage: React.FC<InvitationAcceptPageProps> = ({ tokenProp }) => {
  const { currentUser, switchCurrentUser, switchPortal, fests, addToast } = useFest();

  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<FestInvitation | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Authentication & Claiming Form State
  const [authTab, setAuthTab] = useState<'signin' | 'register'>('signin');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Claim Success State
  const [claimedRole, setClaimedRole] = useState<'judge' | 'team_leader' | null>(null);
  const [claimSuccessMessage, setClaimSuccessMessage] = useState<string | null>(null);

  // Extract token from URL
  useEffect(() => {
    let extractedToken = tokenProp || '';
    if (!extractedToken && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      extractedToken = params.get('token') || params.get('t') || '';
    }
    setToken(extractedToken);

    if (!extractedToken) {
      setLoading(false);
      setError('No invitation token provided. Please verify your invitation link.');
      return;
    }

    // Validate token
    (async () => {
      try {
        setLoading(true);
        const res = await validateInvitationToken(extractedToken);
        if (!res.valid || !res.invitation) {
          setError(res.error || 'Invalid invitation token.');
        } else {
          setInvitation(res.invitation);
          if (res.invitation.recipientContact) {
            setIdentifier(res.invitation.recipientContact);
          }
          if (res.invitation.recipientName) {
            setName(res.invitation.recipientName);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to validate invitation token.');
      } finally {
        setLoading(false);
      }
    })();
  }, [tokenProp]);

  // Handle Claiming with Authenticated User
  const handleClaim = async (userToClaim: User) => {
    try {
      setSubmitting(true);
      setFormError(null);

      const res = await acceptFestInvitation(token, userToClaim);
      if (!res.success) {
        setFormError(res.message);
        return;
      }

      setClaimedRole(res.role);
      setClaimSuccessMessage(res.message);
      if (res.updatedUser) {
        switchCurrentUser(res.updatedUser.id, res.updatedUser);
      }
      addToast('success', 'Invitation Claimed', `You are now active as ${res.role === 'judge' ? 'Official Judge' : 'Team Leader'}.`);
    } catch (err: any) {
      setFormError(err.message || 'Failed to claim invitation.');
    } finally {
      setSubmitting(false);
    }
  };

  // Sign In & Claim
  const handleSignInAndClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setFormError('Please enter your email or phone and password.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const authRes = await signInWithCredentials({ identifier: identifier.trim(), password });
      if (!authRes.success || !authRes.user) {
        setFormError(authRes.message || 'Sign in failed. Check your credentials.');
        return;
      }

      await handleClaim(authRes.user);
    } catch (err: any) {
      setFormError(err.message || 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Register & Claim
  const handleRegisterAndClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !identifier.trim() || !password) {
      setFormError('Please fill in all required registration fields.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const isEmail = identifier.includes('@');
      const email = isEmail ? identifier.trim() : `${identifier.replace(/[^0-9]/g, '')}@festoria.app`;
      const phone = !isEmail ? identifier.trim() : '+919876543210';

      const regRes = await registerParticipantWithCredentials({
        name: name.trim(),
        email,
        phone,
        password,
        confirmPassword,
        college: invitation?.assignedTeamName || 'University',
        festId: invitation?.festId || 'FEST-01'
      });

      if (!regRes.success || !regRes.user) {
        setFormError(regRes.message || 'Registration failed.');
        return;
      }

      await handleClaim(regRes.user);
    } catch (err: any) {
      setFormError(err.message || 'Failed to register account.');
    } finally {
      setSubmitting(false);
    }
  };

  // Find Fest info
  const targetFest = fests.find((f) => f.id === invitation?.festId);
  const festTitle = targetFest?.name || invitation?.festId || 'Collegiate Festival';

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-indigo-500 selection:text-white font-sans">
      {/* Top Header */}
      <nav className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-black text-sm tracking-widest shadow-md">
            F
          </div>
          <span className="text-base font-black tracking-tight text-white">
            Festoria <span className="text-indigo-400 text-xs font-semibold">| Invitation Portal</span>
          </span>
        </a>

        <a
          href="/"
          className="text-xs font-semibold text-slate-400 hover:text-white transition-colors flex items-center gap-1"
        >
          <span>Festoria Home</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </nav>

      {/* Main Content Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full">
          {/* State 1: Loading */}
          {loading && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3 shadow-xl">
              <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <h2 className="text-sm font-bold text-white">Validating Invitation Token...</h2>
              <p className="text-xs text-slate-400">Verifying secure token signature against festival database</p>
            </div>
          )}

          {/* State 2: Error (Token invalid, expired, revoked) */}
          {!loading && error && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-xl">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Invitation Unavailable</h2>
                <p className="text-xs text-slate-400 mt-1.5">{error}</p>
              </div>
              <div className="pt-2">
                <a
                  href="/"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                >
                  Return to Home
                </a>
              </div>
            </div>
          )}

          {/* State 3: Claim Success */}
          {!loading && !error && claimedRole && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-5 shadow-2xl">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Access Granted
                </span>
                <h2 className="text-xl font-black text-white mt-2">
                  Welcome to {festTitle}!
                </h2>
                <p className="text-xs text-slate-400 mt-1.5">{claimSuccessMessage}</p>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs text-slate-300 space-y-1 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-400">Assigned Role:</span>
                  <span className="font-bold text-white uppercase">{claimedRole}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Festival ID:</span>
                  <span className="font-mono text-indigo-400 font-bold">{invitation?.festId}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (claimedRole === 'team_leader') {
                      navigateTo(`team-leader.html?fest=${invitation?.festId}`);
                    } else {
                      navigateTo(`admin.html?fest=${invitation?.festId}`);
                    }
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold text-xs shadow-lg transition-all"
                >
                  <span>
                    Proceed to {claimedRole === 'team_leader' ? 'Team Leader Portal' : 'Adjudication Portal'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* State 4: Valid Invitation — Ready to Claim */}
          {!loading && !error && !claimedRole && invitation && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              {/* Card Banner */}
              <div className="p-6 border-b border-slate-800 bg-linear-to-br from-slate-900 via-indigo-950/40 to-slate-900 space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      invitation.role === 'judge'
                        ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                        : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                    }`}
                  >
                    {invitation.role === 'judge' ? <Award className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                    Official {invitation.role === 'judge' ? 'Judge' : 'Team Leader'} Invitation
                  </span>

                  <span className="text-[11px] font-mono text-slate-400">
                    {invitation.festId}
                  </span>
                </div>

                <div>
                  <h2 className="text-xl font-black text-white">{festTitle}</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    You have been invited by the Fest Admin to join the official festival operations.
                  </p>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs space-y-1">
                  {invitation.role === 'team_leader' && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Assigned House / Team:</span>
                      <strong className="text-blue-400">{invitation.assignedTeamName || invitation.assignedTeamId}</strong>
                    </div>
                  )}
                  {invitation.role === 'judge' && invitation.assignedJudgeName && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Assigned Profile:</span>
                      <strong className="text-purple-400">{invitation.assignedJudgeName}</strong>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Invited Recipient:</span>
                    <span className="text-slate-300 font-medium">{invitation.recipientName || invitation.recipientContact}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Invitation Valid Until:</span>
                    <span className="text-slate-300">{new Date(invitation.expiresAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Already Authenticated Fast-Claim Option */}
              {currentUser && currentUser.id !== 'guest' && (
                <div className="p-4 bg-indigo-950/30 border-b border-indigo-900/30 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Signed in as:</span>{' '}
                    <strong className="text-white">{currentUser.name}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleClaim(currentUser)}
                    disabled={submitting}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-[11px]"
                  >
                    {submitting ? 'Claiming...' : 'Claim as Current User'}
                  </button>
                </div>
              )}

              {/* Auth Claim Tabs (Sign In or Register) */}
              <div className="p-6 space-y-4">
                <div className="flex border-b border-slate-800 pb-px text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('signin');
                      setFormError(null);
                    }}
                    className={`pb-2.5 px-3 border-b-2 transition-colors ${
                      authTab === 'signin'
                        ? 'border-indigo-500 text-white'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    1. Sign In to Claim
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('register');
                      setFormError(null);
                    }}
                    className={`pb-2.5 px-3 border-b-2 transition-colors ${
                      authTab === 'register'
                        ? 'border-indigo-500 text-white'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    2. Create New Account
                  </button>
                </div>

                {formError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-300 flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                      <span className="leading-relaxed">{formError}</span>
                    </div>
                    {formError.includes('Firebase Console') && (
                      <a
                        href="https://console.firebase.google.com/project/festoria-cd375/authentication/providers"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-6 inline-flex items-center gap-1 text-[11px] font-bold text-rose-300 underline hover:text-white"
                      >
                        <span>Open Firebase Console Sign-in Providers</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}

                {/* SIGN IN FORM */}
                {authTab === 'signin' && (
                  <form onSubmit={handleSignInAndClaim} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Email Address or Mobile Number
                      </label>
                      <input
                        type="text"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="e.g. user@college.edu or 9876543210"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-hidden focus:border-indigo-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-2.5 rounded-lg bg-linear-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                      >
                        {submitting ? 'Verifying & Claiming...' : `Sign In & Claim ${invitation.role === 'judge' ? 'Judge' : 'Team Leader'} Access`}
                      </button>
                    </div>
                  </form>
                )}

                {/* REGISTER FORM */}
                {authTab === 'register' && (
                  <form onSubmit={handleRegisterAndClaim} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Dr. Anita Sharma"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-hidden focus:border-indigo-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Email Address or Mobile Number
                      </label>
                      <input
                        type="text"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="e.g. user@college.edu or 9876543210"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-hidden focus:border-indigo-500 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Password
                        </label>
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min. 6 chars"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-hidden focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat password"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-hidden focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-2.5 rounded-lg bg-linear-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                      >
                        {submitting ? 'Registering & Claiming...' : `Create Account & Activate ${invitation.role === 'judge' ? 'Judge' : 'Team Leader'}`}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 text-center text-xs text-slate-500">
        Festoria Secure Festival Management System • Password-Authenticated Role Access
      </footer>
    </div>
  );
};
