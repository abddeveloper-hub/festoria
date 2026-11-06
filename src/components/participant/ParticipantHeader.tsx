import React, { useState } from 'react';
import { useFest } from '../../context/FestContext';
import { ParticipantNavigationTab } from '../../types';
import {
  Menu,
  Bell,
  Sparkles,
  Phone,
  ShieldCheck,
  LogOut,
  ChevronDown,
  User,
  Users,
  Building
} from 'lucide-react';

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

export const ParticipantHeader: React.FC<HeaderProps> = ({ onMobileMenuToggle }) => {
  const {
    participantTab,
    setParticipantTab,
    activeParticipant,
    teams,
    settings,
    platformNotifications,
    switchPortal,
    logout,
  } = useFest();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const assignedTeam = teams.find((t) => t.id === activeParticipant?.teamId);
  const unreadNotifs = platformNotifications.filter((n) => !n.read);

  const getPageTitle = (tab: ParticipantNavigationTab) => {
    switch (tab) {
      case 'participant_dashboard':
        return { title: 'Competitor Dashboard', breadcrumb: 'Overview' };
      case 'participant_profile':
        return { title: 'My Official Profile', breadcrumb: 'Competitor Information' };
      case 'participant_team':
        return { title: 'My Team & Leader', breadcrumb: 'Team Roster' };
      case 'participant_programmes':
        return { title: 'My Assigned Programmes', breadcrumb: 'Competitions' };
      case 'participant_schedule':
        return { title: 'My Competition Timetable', breadcrumb: 'Schedule & Venues' };
      case 'participant_results':
        return { title: 'Published Results & Points', breadcrumb: 'Performance' };
      case 'participant_notifications':
        return { title: 'Notifications & Alerts', breadcrumb: 'Communications' };
      case 'participant_help':
        return { title: 'Help & Grievance Desk', breadcrumb: 'Support' };
      case 'participant_account':
        return { title: 'Account Settings & Security', breadcrumb: 'Identity' };
      default:
        return { title: 'Participant Dashboard', breadcrumb: 'Competitor' };
    }
  };

  const { title, breadcrumb } = getPageTitle(participantTab);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            <span>{settings.festName}</span>
            <span>/</span>
            <span>{breadcrumb}</span>
          </div>
          <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-tight">
            {title}
          </h1>
        </div>
      </div>

      {/* Right: Team badge, Notifications, and Profile menu */}
      <div className="flex items-center gap-3">
        {/* Team Indicator */}
        {assignedTeam && (
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full border border-slate-300"
              style={{ backgroundColor: assignedTeam.colorHex || '#0f172a' }}
            />
            <span className="font-bold text-slate-800">{assignedTeam.name}</span>
            <span className="text-[10px] font-mono text-slate-400">({assignedTeam.code})</span>
          </div>
        )}

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifs.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg p-3 space-y-2 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">Notifications</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {unreadNotifs.length} unread
                </span>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1.5">
                {platformNotifications.slice(0, 4).map((n) => (
                  <div key={n.id} className="p-2 rounded bg-slate-50 text-[11px] space-y-0.5">
                    <div className="font-semibold text-slate-800">{n.title}</div>
                    <div className="text-slate-600 line-clamp-2">{n.message}</div>
                    <div className="text-[9px] text-slate-400 font-mono">{n.createdAt}</div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setNotifOpen(false);
                  setParticipantTab('participant_notifications');
                }}
                className="w-full text-center py-1 text-xs font-semibold text-slate-900 hover:underline"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>

        {/* Profile Pill & Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              {activeParticipant?.name?.charAt(0) || 'P'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-900 truncate max-w-[100px]">
                {activeParticipant?.name || 'Competitor'}
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                {activeParticipant?.id}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-2 space-y-1 z-50 text-xs">
              <div className="p-2 border-b border-slate-100">
                <div className="font-bold text-slate-900">{activeParticipant?.name}</div>
                <div className="text-[10px] text-slate-500 font-mono truncate">{activeParticipant?.email}</div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  setParticipantTab('participant_profile');
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-slate-700 hover:bg-slate-100 text-left font-medium"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>My Profile</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  setParticipantTab('participant_account');
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-slate-700 hover:bg-slate-100 text-left font-medium"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Account & Security</span>
              </button>

              <div className="pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={async () => {
                    setProfileOpen(false);
                    await logout();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-rose-600 hover:bg-rose-50 text-left font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

