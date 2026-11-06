import React from 'react';
import { useFest } from '../../context/FestContext';
import { TeamLeaderNavigationTab } from '../../types';
import {
  Trophy,
  Users,
  Calendar,
  AlertTriangle,
  Award,
  Bell,
  User,
  ShieldCheck,
  ChevronRight,
  ClipboardList,
  Sparkles,
  Megaphone,
  Layers,
  UserCheck,
  ArrowRight
} from 'lucide-react';

interface SidebarItem {
  id: TeamLeaderNavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  badge?: number | string;
  badgeColor?: string;
  description?: string;
}

export const TeamLeaderSidebar: React.FC<{ isOpen?: boolean; onClose?: () => void }> = ({
  isOpen = true,
  onClose,
}) => {
  const {
    teamLeaderTab,
    setTeamLeaderTab,
    activeTeam,
    complaints,
    announcements,
    platformNotifications,
    activeTeamId,
    participants,
    switchPortal,
  } = useFest();

  const pendingRequestsCount = participants.filter(
    (p) => (p.requestedTeamId === activeTeamId || p.teamId === activeTeamId) && p.approvalStatus === 'pending_approval'
  ).length;

  const teamComplaints = complaints.filter((c) => c.teamId === activeTeamId);
  const activeComplaintsCount = teamComplaints.filter(
    (c) => c.status === 'submitted' || c.status === 'under_review' || c.status === 'escalated'
  ).length;

  const urgentAnnouncementsCount = announcements.filter((a) => a.category === 'urgent').length;
  const unreadNotifsCount = platformNotifications.filter((n) => !n.read).length;

  const navItems: SidebarItem[] = [
    {
      id: 'team_dashboard',
      label: 'Live Scores',
      icon: Trophy,
      badge: 'LIVE',
      badgeColor: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    },
    {
      id: 'team_leaderboard',
      label: 'Team Leaderboard',
      icon: Award,
    },
    {
      id: 'team_members',
      label: 'Team Members',
      icon: Users,
    },
    {
      id: 'team_requests',
      label: 'Participant Requests',
      icon: UserCheck,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border border-amber-200 font-bold',
    },
    {
      id: 'team_assignments',
      label: 'Programme Assignments',
      icon: ClipboardList,
    },
    {
      id: 'team_results',
      label: 'Programme Results',
      icon: Sparkles,
    },
    {
      id: 'team_schedule',
      label: 'Schedule & Venues',
      icon: Calendar,
    },
    {
      id: 'team_complaints',
      label: 'Complaints & Appeals',
      icon: AlertTriangle,
      badge: activeComplaintsCount > 0 ? activeComplaintsCount : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border border-amber-200 font-semibold',
    },
    {
      id: 'team_announcements',
      label: 'Announcements',
      icon: Megaphone,
      badge: urgentAnnouncementsCount > 0 ? 'Urgent' : undefined,
      badgeColor: 'bg-rose-100 text-rose-800 border border-rose-200 font-medium',
    },
    {
      id: 'team_profile',
      label: 'Team Profile',
      icon: ShieldCheck,
    },
    {
      id: 'team_notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadNotifsCount > 0 ? unreadNotifsCount : undefined,
      badgeColor: 'bg-slate-100 text-slate-700 border border-slate-200',
    },
    {
      id: 'team_account',
      label: 'My Account',
      icon: User,
    },
  ];

  const handleSelectTab = (id: TeamLeaderNavigationTab) => {
    setTeamLeaderTab(id);
    if (onClose) onClose();
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white shadow-sm shrink-0"
            style={{ backgroundColor: activeTeam?.colorHex || '#3b82f6' }}
          >
            {activeTeam?.name ? activeTeam.name.substring(0, 2).toUpperCase() : 'TM'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wide">
                Team Leader
              </span>
            </div>
            <h2 className="text-sm font-bold text-slate-900 truncate mt-0.5">
              {activeTeam?.name || 'Solar Flare'}
            </h2>
            <p className="text-xs text-slate-500 truncate">
              {activeTeam?.institution || 'National Institute of Arts'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        <div className="px-2 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Team Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = teamLeaderTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  size={18}
                  className={`shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-500'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {item.badge && (
                  <span
                    className={`text-[11px] px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badgeColor || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight size={14} className="text-slate-300" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Portal Switcher Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-1">
          Switch Workspace
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => switchPortal('fest_admin')}
            className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100 transition-colors shadow-2xs"
          >
            <Layers size={13} className="text-slate-500" />
            <span>Fest Admin</span>
          </button>
          <button
            onClick={() => switchPortal('super_admin')}
            className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100 transition-colors shadow-2xs"
          >
            <ShieldCheck size={13} className="text-slate-500" />
            <span>Super Admin</span>
          </button>
        </div>
        <button
          onClick={() => switchPortal('public')}
          className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50/60 border border-blue-200 rounded-md hover:bg-blue-100/70 transition-colors"
        >
          <span>View Public Fest Portal</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </aside>
  );
};
