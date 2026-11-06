import React, { useState } from 'react';
import { ParticipantSidebar } from './ParticipantSidebar';
import { ParticipantHeader } from './ParticipantHeader';
import { useFest } from '../../context/FestContext';
import { PhoneAuthModal } from '../common/PhoneAuthModal';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
  Lock,
  UserCheck,
  ArrowRight,
  ShieldAlert,
  LogOut
} from 'lucide-react';

export const ParticipantLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { currentUser, activeParticipantId, setActiveParticipantId, participants, toasts, removeToast, switchPortal } = useFest();

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

  const isParticipantOrAdmin =
    (currentUser.role === 'participant' && (currentUser.phoneVerified || activeParticipantId)) ||
    currentUser.role === 'admin' ||
    currentUser.role === 'fest_admin' ||
    currentUser.role === 'super_admin';

  // Suspended/Disqualified Gate
  const currentParticipant = participants.find((p) => p.id === activeParticipantId);
  if (currentParticipant?.status === 'disqualified' || currentUser.status === 'suspended') {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-center items-center px-4 font-sans">
        <div className="max-w-md w-full bg-white border border-rose-200 rounded-xl p-8 shadow-sm text-center">
          <div className="w-14 h-14 bg-rose-50 border border-rose-200 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-5">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Access Restricted</h2>
          <p className="text-sm text-slate-600 mt-2">
            This participant registration has been disqualified or suspended by the fest administration.
          </p>
          <div className="mt-6">
            <a
              href="/index.html"
              onClick={() => {
                localStorage.removeItem('festflow_active_participant_id');
                localStorage.removeItem('festflow_current_user');
                window.location.href = '/index.html';
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Return to Public Website</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Unauthenticated Gate
  if (!isParticipantOrAdmin) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-center items-center px-4 font-sans">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-center">
          <div className="w-14 h-14 bg-slate-100 border border-slate-200 text-slate-800 rounded-full flex items-center justify-center mx-auto mb-5">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Participant Sign In Required</h2>
          <p className="text-sm text-slate-600 mt-2">
            Please sign in with your registered mobile phone number to view your events, chest number, attendance, and scores.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              <UserCheck className="w-4 h-4" />
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
          defaultRole="participant"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex font-sans antialiased">
      {/* Participant Sidebar */}
      <ParticipantSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Backdrop for Mobile */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <ParticipantHeader onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Toast Alerts */}
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
              <p className="text-xs font-bold">{toast.title}</p>
              <p className="text-xs text-slate-600 mt-0.5">{toast.message}</p>
            </div>
            
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5 shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
