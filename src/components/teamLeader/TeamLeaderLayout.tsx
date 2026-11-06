import React, { useState, useEffect, ReactNode } from 'react';
import { TeamLeaderSidebar } from './TeamLeaderSidebar';
import { TeamLeaderHeader } from './TeamLeaderHeader';
import { useFest } from '../../context/FestContext';
import { PhoneAuthModal } from '../common/PhoneAuthModal';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
  ShieldAlert,
  Lock,
  LogOut,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const TeamLeaderLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { currentUser, activeTeamId, setActiveTeamId, switchPortal, toasts, removeToast } = useFest();

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
    if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
      window.location.href = '/?portal=public';
    } else {
      window.history.replaceState({}, '', '/?portal=public');
    }
  };

  // Enforce Team Isolation for Team Leaders:
  // Team Leaders are strictly locked to their authorized team
  useEffect(() => {
    if (currentUser.role === 'team_leader' && currentUser.linkedTeamId && activeTeamId !== currentUser.linkedTeamId) {
      setActiveTeamId(currentUser.linkedTeamId);
    }
  }, [currentUser, activeTeamId, setActiveTeamId]);

  // Authorization Check
  const isAuthorizedRole =
    currentUser.role === 'team_leader' ||
    currentUser.role === 'admin' ||
    currentUser.role === 'super_admin';

  // 1. Unauthorized Role Gate
  if (!isAuthorizedRole) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-center items-center px-4 font-sans">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-center">
          <div className="w-14 h-14 bg-slate-100 border border-slate-200 text-slate-800 rounded-full flex items-center justify-center mx-auto mb-5">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Team Leader Access Required</h2>
          <p className="text-sm text-slate-600 mt-2">
            This dashboard is reserved for authorized Team Leaders. Please sign in with your registered and verified mobile phone number.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Sign In with Phone OTP</span>
            </button>
            <a
              href="/?portal=public"
              onClick={handleBackToPublic}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <span>Back to Public Website</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <PhoneAuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          defaultRole="team_leader"
        />
      </div>
    );
  }

  // 2. Suspended Account Gate
  if (currentUser.status === 'suspended') {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-center items-center px-4 font-sans">
        <div className="max-w-md w-full bg-white border border-rose-200 rounded-xl p-8 shadow-sm text-center">
          <div className="w-14 h-14 bg-rose-50 border border-rose-200 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-5">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Account Suspended</h2>
          <p className="text-sm text-slate-600 mt-2">
            Your Team Leader account ({currentUser.name}) has been suspended by the fest administration. Access to team records and scoring appeals is disabled.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <a
              href="/index.html"
              onClick={() => {
                localStorage.removeItem('festflow_current_user');
                window.location.href = '/index.html';
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

  // 3. Unassigned Team Gate (for verified team leaders without a linked team)
  if (currentUser.role === 'team_leader' && !currentUser.linkedTeamId) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-center items-center px-4 font-sans">
        <div className="max-w-md w-full bg-white border border-amber-200 rounded-xl p-8 shadow-sm text-center">
          <div className="w-14 h-14 bg-amber-50 border border-amber-200 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Team Assignment Pending</h2>
          <p className="text-sm text-slate-600 mt-2">
            Your phone number is verified, but your account is not currently assigned to any participating team. Please contact the Fest Administrator to assign your house.
          </p>
          <div className="mt-6">
            <a
              href="/?portal=public"
              onClick={handleBackToPublic}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <span>Back to Public Website</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-slate-200">
      <div className="flex-1 flex overflow-hidden">
        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/30 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <TeamLeaderSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <TeamLeaderHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto bg-white">
            {children}
          </main>
        </div>
      </div>

      {/* Toast Notifications Overlay */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-lg bg-white text-slate-900 transition-all ${
              toast.type === 'success'
                ? 'border-emerald-200 bg-emerald-50/50'
                : toast.type === 'error'
                ? 'border-rose-200 bg-rose-50/50'
                : toast.type === 'warning'
                ? 'border-amber-200 bg-amber-50/50'
                : 'border-blue-200 bg-blue-50/50'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />}
            {toast.type === 'error' && <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />}
            {toast.type === 'warning' && <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />}

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-slate-900">{toast.title}</h4>
              <p className="text-xs text-slate-600 mt-0.5">{toast.message}</p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
