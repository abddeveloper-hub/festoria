import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '../common/ToastContainer';
import { useFest } from '../../context/FestContext';
import { PhoneAuthModal } from '../common/PhoneAuthModal';
import { Lock, ShieldCheck, ArrowRight, ShieldAlert, LogOut, Award, KeyRound, AlertCircle } from 'lucide-react';
import { navigateTo, getAppUrl } from '../../utils/navigation';
import { validateInvitationToken, acceptFestInvitation } from '../../firebase/firestoreService';
import { User } from '../../types';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [loginMode, setLoginMode] = useState<'admin' | 'judge'>('admin');
  const [judgeTokenInput, setJudgeTokenInput] = useState('');
  const [judgeTokenLoading, setJudgeTokenLoading] = useState(false);
  const [judgeTokenError, setJudgeTokenError] = useState<string | null>(null);

  const { currentUser, switchCurrentUser, users, switchPortal, setActiveTab, setActiveFestId, addToast } = useFest();

  const authenticateJudgeToken = async (rawToken: string) => {
    const cleanToken = rawToken.trim();
    if (!cleanToken) {
      setJudgeTokenError('Please enter your judge access token or paste your invitation link.');
      return;
    }

    // Extract token if user pasted a full URL
    let extracted = cleanToken;
    if (cleanToken.includes('token=')) {
      try {
        const url = new URL(cleanToken.startsWith('http') ? cleanToken : `https://festoria.app/${cleanToken}`);
        extracted = url.searchParams.get('token') || cleanToken;
      } catch {
        extracted = cleanToken.split('token=')[1].split('&')[0];
      }
    }

    try {
      setJudgeTokenLoading(true);
      setJudgeTokenError(null);

      const check = await validateInvitationToken(extracted);
      if (!check.valid || !check.invitation) {
        setJudgeTokenError(check.error || 'Invalid or expired judge token.');
        return;
      }

      const inv = check.invitation;
      if (inv.role !== 'judge') {
        setJudgeTokenError('This invitation token is not for a Judge role.');
        return;
      }

      const judgeName = inv.recipientName || inv.assignedJudgeName || 'Official Judge';
      const judgeId = inv.assignedJudgeId || `judge-${Date.now()}`;
      const judgeUser: User = {
        id: `usr-${judgeId}`,
        name: judgeName,
        email: inv.recipientContact?.includes('@') ? inv.recipientContact : `judge-${judgeId}@festoria.app`,
        phone: !inv.recipientContact?.includes('@') ? inv.recipientContact : '',
        role: 'judge',
        festId: inv.festId,
        status: 'active',
        linkedJudgeId: inv.assignedJudgeId,
        invitationStatus: 'active',
        createdAt: new Date().toISOString()
      };

      const claimRes = await acceptFestInvitation(extracted, judgeUser);
      if (!claimRes.success) {
        setJudgeTokenError(claimRes.message);
        return;
      }

      try {
        localStorage.setItem('festflow_portal', 'fest_admin');
        localStorage.setItem('festflow_current_user', JSON.stringify(claimRes.updatedUser || judgeUser));
      } catch {}

      switchCurrentUser(judgeUser.id, claimRes.updatedUser || judgeUser);
      if (typeof switchPortal === 'function') {
        switchPortal('fest_admin');
      }
      setActiveTab('scores');
      setActiveFestId(inv.festId);
      addToast('success', 'Judge Portal Activated', `Welcome ${judgeName}! Opening adjudication score sheet.`);
      navigateTo(`admin.html?fest=${inv.festId}&tab=scores`);
    } catch (err: any) {
      setJudgeTokenError(err.message || 'Failed to authenticate judge token.');
    } finally {
      setJudgeTokenLoading(false);
    }
  };

  // Check URL if a token parameter was passed directly to admin.html (e.g. admin.html?token=...)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token') || params.get('t');
      if (token) {
        setJudgeTokenInput(token);
        setLoginMode('judge');
        // Auto-authenticate judge token directly on visit
        authenticateJudgeToken(token);
      }
    }
  }, []);

  // Lock body scroll when mobile navigation sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const handleBackToPublic = (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('festflow_portal', 'public');
    } catch {
      // ignore
    }
    if (typeof switchPortal === 'function') {
      switchPortal('public');
    }
    navigateTo('?portal=public');
  };

  const handleJudgeTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await authenticateJudgeToken(judgeTokenInput);
  };

  const isAuthorizedAdmin =
    (currentUser.role === 'admin' ||
      currentUser.role === 'fest_admin' ||
      currentUser.role === 'super_admin' ||
      currentUser.role === 'judge') &&
      currentUser.status === 'active';

  // Suspended Account Gate
  if (currentUser.status === 'suspended') {
    return (
      <div className="min-h-screen min-h-dvh bg-white text-slate-900 flex flex-col justify-center items-center px-4 font-sans">
        <div className="max-w-md w-full bg-white border border-rose-200 rounded-xl p-8 shadow-sm text-center">
          <div className="w-14 h-14 bg-rose-50 border border-rose-200 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-5">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Account Suspended</h2>
          <p className="text-sm text-slate-600 mt-2">
            Your Fest Administrator account ({currentUser.name}) has been suspended. Access to fest management tools is disabled.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <a
              href={getAppUrl()}
              onClick={(e) => {
                e.preventDefault();
                localStorage.removeItem('festflow_current_user');
                localStorage.setItem('festflow_portal', 'public');
                navigateTo('?portal=public');
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out & Return Home</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Unauthorized Gate (Admin or Judge Authentication)
  if (!isAuthorizedAdmin) {
    return (
      <div className="min-h-screen min-h-dvh bg-slate-50 text-slate-900 flex flex-col justify-center items-center px-4 py-8 font-sans">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm text-center space-y-4">
          <div className="flex items-center justify-center gap-2 pb-2">
            <button
              type="button"
              onClick={() => {
                setLoginMode('admin');
                setJudgeTokenError(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                loginMode === 'admin'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Fest Administrator
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMode('judge');
                setJudgeTokenError(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                loginMode === 'judge'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Judge Token Access</span>
            </button>
          </div>

          {loginMode === 'admin' ? (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="w-12 h-12 bg-slate-100 border border-slate-200 text-slate-800 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Fest Admin Console</h2>
                <p className="text-xs text-slate-600 mt-1">
                  Fest Admin Access Required. Reserved for authorized Fest Administrators. Please sign in with your registered credentials.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sign In with Credentials</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMode('judge')}
                  className="text-xs text-purple-700 hover:underline font-semibold"
                >
                  Are you an invited Judge? Enter with Token &rarr;
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="w-12 h-12 bg-purple-50 border border-purple-200 text-purple-700 rounded-full flex items-center justify-center mx-auto">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Official Judge Access</h2>
                <p className="text-xs text-slate-600 mt-1">
                  Enter your Judge Invitation Token to access your evaluation score sheet directly.
                </p>
              </div>

              <form onSubmit={handleJudgeTokenSubmit} className="space-y-3 pt-1 text-left">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Judge Access Token or Invite Link
                  </label>
                  <input
                    type="text"
                    required
                    value={judgeTokenInput}
                    onChange={(e) => setJudgeTokenInput(e.target.value)}
                    placeholder="e.g. INV-JUDGE-XXXX or paste link"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono text-slate-900"
                  />
                </div>

                {judgeTokenError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{judgeTokenError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={judgeTokenLoading}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Award className="w-4 h-4" />
                  <span>{judgeTokenLoading ? 'Authenticating...' : 'Enter Adjudication Portal'}</span>
                </button>
              </form>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100">
            <a
              href={getAppUrl('?portal=public')}
              onClick={handleBackToPublic}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
            >
              <span>Back to Public Festival Home</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <PhoneAuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          defaultRole="admin"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-dvh bg-white text-slate-900 flex">
      {/* Persistent desktop sidebar & collapsible mobile navigation */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Sticky Header */}
        <Header setMobileOpen={setMobileOpen} />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-white max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Floating Notifications */}
      <ToastContainer />
    </div>
  );
};
