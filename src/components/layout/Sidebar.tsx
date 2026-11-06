import React from 'react';
import { useFest, NavigationTab } from '../../context/FestContext';
import {
  LayoutDashboard,
  Users,
  Award,
  CalendarCheck,
  CheckSquare,
  Shield,
  Clock,
  UserCog,
  UserCheck,
  Globe,
  FileSpreadsheet,
  Settings,
  X,
  AlertTriangle,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ElementType;
  badge?: number | string;
  badgeVariant?: 'warning' | 'info' | 'neutral';
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { activeTab, setActiveTab, summaryStats, settings, complaints } = useFest();
  const pendingComplaintsCount = complaints.filter(c => c.status === 'submitted' || c.status === 'under_review').length;

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard / Total Analysis',
      icon: LayoutDashboard,
    },
    {
      id: 'participants',
      label: 'Participants',
      icon: Users,
      badge: summaryStats.totalParticipants,
      badgeVariant: 'neutral',
    },
    {
      id: 'judges',
      label: 'Judges',
      icon: Award,
      badge: summaryStats.totalJudges,
      badgeVariant: 'neutral',
    },
    {
      id: 'programmes',
      label: 'Programmes',
      icon: CalendarCheck,
      badge: summaryStats.totalProgrammes,
      badgeVariant: 'neutral',
    },
    {
      id: 'scores',
      label: 'Scores',
      icon: CheckSquare,
      badge: summaryStats.pendingScores > 0 ? `${summaryStats.pendingScores} pending` : undefined,
      badgeVariant: 'warning',
    },
    {
      id: 'teams',
      label: 'Teams',
      icon: Shield,
      badge: summaryStats.totalTeams,
      badgeVariant: 'neutral',
    },
    {
      id: 'team_leaders',
      label: 'Team Leaders',
      icon: UserCheck,
      badgeVariant: 'neutral',
    },
    {
      id: 'schedule',
      label: 'Schedule',
      icon: Clock,
      badge: summaryStats.upcomingProgrammes > 0 ? `${summaryStats.upcomingProgrammes} live` : undefined,
      badgeVariant: 'info',
    },
    {
      id: 'users',
      label: 'Users',
      icon: UserCog,
    },
    {
      id: 'complaints',
      label: 'Complaints & Appeals',
      icon: AlertTriangle,
      badge: pendingComplaintsCount > 0 ? `${pendingComplaintsCount} pending` : undefined,
      badgeVariant: 'warning',
    },
    {
      id: 'public',
      label: 'Public Page',
      icon: Globe,
    },
    {
      id: 'reports',
      label: 'Reports & Exports',
      icon: FileSpreadsheet,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  const handleNavClick = (id: NavigationTab) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar container: persistent on lg, off-canvas on mobile */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded border border-slate-900 bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-wide">
              FL
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 tracking-tight leading-tight flex items-center gap-1.5">
                {settings.festName}
              </div>
              <div className="text-[10px] text-slate-500 font-medium truncate max-w-[140px]">
                Admin Management Portal
              </div>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded text-slate-400 hover:text-slate-600 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list in exact required order */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Fest Administration
          </div>
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors text-left group ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-[10px] text-slate-400 w-3 font-mono">{index + 1}.</span>
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium flex-shrink-0 ${
                      item.badgeVariant === 'warning'
                        ? 'bg-amber-100 text-amber-800'
                        : item.badgeVariant === 'info'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info in sidebar */}
        <div className="p-3 border-t border-slate-200 text-xs">
          <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-700">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-slate-500" />
                Fest Dates
              </span>
              <span className="font-mono text-[10px] text-slate-500">Live</span>
            </div>
            <div className="text-[11px] text-slate-600 font-mono mt-1">
              {settings.startDate} to {settings.endDate}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
