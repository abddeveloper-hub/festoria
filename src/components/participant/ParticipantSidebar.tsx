import React from 'react';
import { useFest } from '../../context/FestContext';
import { ParticipantNavigationTab } from '../../types';
import {
  LayoutDashboard,
  User,
  Users,
  CalendarCheck,
  Clock,
  Sparkles,
  Bell,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  X
} from 'lucide-react';

interface SidebarItem {
  id: ParticipantNavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  badge?: number | string;
  badgeColor?: string;
}

export const ParticipantSidebar: React.FC<{ isOpen?: boolean; onClose?: () => void }> = ({
  isOpen = true,
  onClose,
}) => {
  const {
    participantTab,
    setParticipantTab,
    activeParticipant,
    teams,
    platformNotifications,
    programmes,
    switchPortal,
    currentUser,
  } = useFest();

  const assignedTeam = teams.find((t) => t.id === activeParticipant?.teamId);
  const unreadNotifs = platformNotifications.filter((n) => !n.read).length;
  const myProgrammesCount = activeParticipant?.registeredProgrammes?.length || 0;

  const navItems: SidebarItem[] = [
    {
      id: 'participant_dashboard',
      label: 'Dashboard Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'participant_profile',
      label: 'My Profile',
      icon: User,
    },
    {
      id: 'participant_team',
      label: 'My Team & Leader',
      icon: Users,
    },
    {
      id: 'participant_programmes',
      label: 'My Programmes',
      icon: CalendarCheck,
      badge: myProgrammesCount > 0 ? myProgrammesCount : undefined,
      badgeColor: 'bg-slate-100 text-slate-800 border border-slate-200 font-semibold',
    },
    {
      id: 'participant_schedule',
      label: 'My Schedule',
      icon: Clock,
    },
    {
      id: 'participant_results',
      label: 'My Results & Points',
      icon: Sparkles,
    },
    {
      id: 'participant_notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadNotifs > 0 ? unreadNotifs : undefined,
      badgeColor: 'bg-rose-100 text-rose-800 border border-rose-200 font-bold',
    },
    {
      id: 'participant_help',
      label: 'Help & Inquiries',
      icon: HelpCircle,
    },
    {
      id: 'participant_account',
      label: 'Account & Security',
      icon: ShieldCheck,
    },
  ];

  const handleSelectTab = (id: ParticipantNavigationTab) => {
    setParticipantTab(id);
    if (onClose) onClose();
  };

  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Sidebar Header / Team Branding */}
      <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs tracking-wider">
            PT
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span>Participant Portal</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium truncate max-w-[140px]">
              {assignedTeam?.name || 'Fest Competitor'}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1 text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Participant Identity Pill */}
      <div className="p-3 m-3 bg-slate-50 border border-slate-200 rounded-lg">
        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
          Logged-In Competitor
        </div>
        <div className="text-xs font-bold text-slate-900 mt-0.5 truncate">
          {activeParticipant?.name || 'Participant'}
        </div>
        <div className="text-[10px] font-mono text-slate-500 mt-0.5 flex items-center justify-between">
          <span>ID: {activeParticipant?.id}</span>
          <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
            {activeParticipant?.approvalStatus === 'approved' ? 'Verified Member' : 'Pending'}
          </span>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = participantTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white font-mono' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Switch Portals Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/50 space-y-1.5">
        <button
          type="button"
          onClick={() => switchPortal('public')}
          className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
        >
          <span>Return to Public Portal</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
        {(currentUser.role === 'team_leader' || currentUser.role === 'admin' || currentUser.role === 'super_admin') && (
          <button
            type="button"
            onClick={() => switchPortal('team_leader')}
            className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
          >
            <span>Switch to Team Leader</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </aside>
  );
};

