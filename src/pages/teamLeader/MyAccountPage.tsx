import React, { useState } from 'react';
import { useFest } from '../../context/FestContext';
import {
  User,
  Shield,
  Key,
  Smartphone,
  LogOut,
  CheckCircle2,
  Lock,
  Mail,
  Building,
  ArrowRight,
  Layers
} from 'lucide-react';

export const MyAccountPage: React.FC = () => {
  const { currentUser, activeTeam, switchPortal, addToast } = useFest();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [passwordState, setPasswordState] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordState.newPassword !== passwordState.confirmPassword) {
      addToast('error', 'Password Mismatch', 'New password and confirmation do not match.');
      return;
    }
    addToast('success', 'Password Updated', 'Your security credentials have been updated.');
    setShowPasswordModal(false);
    setPasswordState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          My Account & Credentials
        </h1>
        <p className="text-sm text-slate-500">
          Personal profile settings, login credentials, and session management for Team Leader.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-2xl shrink-0">
            {currentUser.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900">{currentUser.name}</h2>
            <p className="text-xs text-slate-500">{currentUser.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                Team Leader
              </span>
              <span className="text-xs text-slate-600">
                Assigned Team: <strong>{activeTeam?.name}</strong> ({activeTeam?.id})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Access Management */}
      <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-slate-700" />
          <h3 className="text-base font-bold text-slate-900">Security & Authentication</h3>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 block">Password</span>
              <span className="text-slate-500">Last changed 14 days ago</span>
            </div>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-3 py-1.5 font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Change Password
            </button>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 block">
                Two-Factor Authentication (2FA)
              </span>
              <span className="text-slate-500">
                Secure your team portal access with verification codes
              </span>
            </div>
            <button
              onClick={() => {
                setTwoFactorEnabled(!twoFactorEnabled);
                addToast(
                  'info',
                  '2FA Status Changed',
                  twoFactorEnabled ? 'Two-factor disabled.' : 'Two-factor enabled.'
                );
              }}
              className={`px-3 py-1.5 font-semibold rounded-lg border transition-colors ${
                twoFactorEnabled
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>
      </div>

      {/* Workspace Switcher / Sign Out */}
      <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-slate-700" />
          <h3 className="text-base font-bold text-slate-900">Switch Workspace & Portals</h3>
        </div>

        <p className="text-xs text-slate-500">
          Jump to administrative management or public view modes:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <button
            onClick={() => switchPortal('fest_admin')}
            className="p-3 rounded-lg border border-slate-200 hover:border-slate-400 bg-slate-50 text-left transition-all"
          >
            <span className="font-bold text-slate-900 text-xs block">Fest Admin Panel</span>
            <span className="text-[11px] text-slate-500">Organize programmes & judges</span>
          </button>
          <button
            onClick={() => switchPortal('super_admin')}
            className="p-3 rounded-lg border border-slate-200 hover:border-slate-400 bg-slate-50 text-left transition-all"
          >
            <span className="font-bold text-slate-900 text-xs block">Super Admin Portal</span>
            <span className="text-[11px] text-slate-500">Platform-wide governance</span>
          </button>
          <button
            onClick={() => switchPortal('public')}
            className="p-3 rounded-lg border border-blue-200 hover:border-blue-300 bg-blue-50/50 text-left transition-all"
          >
            <span className="font-bold text-blue-900 text-xs block">Public Fest View</span>
            <span className="text-[11px] text-blue-600">Spectator leaderboard & schedule</span>
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={() => switchPortal('public')}
            className="px-4 py-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors flex items-center gap-1.5"
          >
            <LogOut size={14} />
            <span>End Session / Sign Out</span>
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 border border-slate-200 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Change Password</h3>
            <form onSubmit={handleUpdatePassword} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={passwordState.currentPassword}
                  onChange={(e) => setPasswordState({ ...passwordState, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={passwordState.newPassword}
                  onChange={(e) => setPasswordState({ ...passwordState, newPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={passwordState.confirmPassword}
                  onChange={(e) => setPasswordState({ ...passwordState, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-3 py-1.5 font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 font-semibold text-white bg-slate-900 rounded-lg"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
