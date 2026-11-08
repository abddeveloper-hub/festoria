import React, { useState } from 'react';
import { SuperAdminSidebar } from './SuperAdminSidebar';
import { SuperAdminHeader } from './SuperAdminHeader';
import { ToastContainer } from '../common/ToastContainer';
import { useFest } from '../../context/FestContext';
import { PhoneAuthModal } from '../common/PhoneAuthModal';
import { Lock, ShieldCheck, ArrowRight, ShieldAlert, LogOut } from 'lucide-react';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

export const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { currentUser, switchCurrentUser, users, switchPortal } = useFest();

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

  const isSuperAdmin = currentUser.role === 'super_admin' && currentUser.status === 'active';

  // Suspended Account Gate
  if (currentUser.status === 'suspended') {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-center items-center px-4 font-sans">
        <div className="max-w-md w-full bg-white border border-rose-200 rounded-xl p-8 shadow-sm text-center">
          <div className="w-14 h-14 bg-rose-50 border border-rose-200 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-5">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Account Suspended</h2>
          <p className="text-sm text-slate-600 mt-2">
            Your Super Administrator account has been suspended. Platform level access is restricted.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                try {
                  localStorage.removeItem('festflow_current_user');
                  localStorage.setItem('festflow_portal', 'public');
                } catch {
                  // ignore
                }
                if (typeof switchPortal === 'function') {
                  switchPortal('public');
                }
                window.location.href = '/';
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
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
  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-center items-center px-4 font-sans">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-center">
          <div className="w-14 h-14 bg-slate-100 border border-slate-200 text-slate-800 rounded-full flex items-center justify-center mx-auto mb-5">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Super Admin Access Required</h2>
          <p className="text-sm text-slate-600 mt-2">
            This console is reserved exclusively for Platform Super Administrators. Please sign in with your verified Super Admin credentials.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Sign In as Super Admin</span>
            </button>
            <a
              href="/"
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
          defaultRole="super_admin"
          showSuperAdmin={true}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex">
      {/* Persistent desktop sidebar & collapsible mobile navigation */}
      <SuperAdminSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Sticky Super Admin Header */}
        <SuperAdminHeader setMobileOpen={setMobileOpen} />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-white max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Floating System Notifications */}
      <ToastContainer />
    </div>
  );
};
