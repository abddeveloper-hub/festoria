import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '../common/ToastContainer';
import { useFest } from '../../context/FestContext';
import { PhoneAuthModal } from '../common/PhoneAuthModal';
import { Lock, ShieldCheck, ArrowRight, ShieldAlert, LogOut } from 'lucide-react';
import { navigateTo, getAppUrl } from '../../utils/navigation';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { currentUser, switchCurrentUser, users, switchPortal } = useFest();

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

  const isAuthorizedAdmin =
    (currentUser.role === 'admin' ||
      currentUser.role === 'fest_admin' ||
      currentUser.role === 'super_admin') &&
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

  // Unauthorized Gate
  if (!isAuthorizedAdmin) {
    return (
      <div className="min-h-screen min-h-dvh bg-white text-slate-900 flex flex-col justify-center items-center px-4 font-sans">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-center">
          <div className="w-14 h-14 bg-slate-100 border border-slate-200 text-slate-800 rounded-full flex items-center justify-center mx-auto mb-5">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Fest Admin Access Required</h2>
          <p className="text-sm text-slate-600 mt-2">
            This management console is reserved for authorized Fest Administrators. Please sign in with your registered credentials.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Sign In with Credentials</span>
            </button>
            <a
              href={getAppUrl('?portal=public')}
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
