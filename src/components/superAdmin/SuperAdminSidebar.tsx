import React from 'react';
import { useFest } from '../../context/FestContext';
import { SuperAdminNavigationTab } from '../../types';
import {
  LayoutDashboard,
  Inbox,
  Landmark,
  Activity,
  UserCheck,
  Users,
  GraduationCap,
  CalendarCheck,
  CheckSquare,
  Clock,
  BarChart3,
  Bell,
  ScrollText,
  Settings,
  ShieldCheck,
  HelpCircle,
  X,
  ShieldAlert,
  ArrowRightLeft,
  ExternalLink
} from 'lucide-react';

interface SuperAdminSidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

interface NavItem {
  id: SuperAdminNavigationTab;
  label: string;
  icon: React.ElementType;
  badge?: number | string;
  badgeVariant?: 'warning' | 'info' | 'neutral' | 'danger';
}

export const SuperAdminSidebar: React.FC<SuperAdminSidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const {
    superAdminTab,
    setSuperAdminTab,
    festRequests,
    fests,
    platformNotifications,
    switchPortal,
    activeFest
  } = useFest();

  const pendingRequestsCount = festRequests.filter(
    (r) => ['pending', 'submitted', 'under_review', 'more_info_required', 'PENDING', 'UNDER_REVIEW', 'MORE_INFORMATION_REQUIRED'].includes(r.status)
  ).length;

  const unreadNotifsCount = platformNotifications.filter((n) => !n.read).length;

  const navItems: NavItem[] = [
    {
      id: 'super_dashboard',
      label: 'Dashboard — Total Analysis',
      icon: LayoutDashboard,
    },
    {
      id: 'fest_requests',
      label: 'Fest Requests',
      icon: Inbox,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
      badgeVariant: 'warning',
    },
    {
      id: 'all_fests',
      label: 'All Fests',
      icon: Landmark,
      badge: fests.length,
      badgeVariant: 'neutral',
    },
    {
      id: 'fest_monitoring',
      label: 'Fest Monitoring',
      icon: Activity,
    },
    {
      id: 'admin_management',
      label: 'Admin Management',
      icon: UserCheck,
    },
    {
      id: 'platform_users',
      label: 'Users',
      icon: Users,
    },
    {
      id: 'platform_participants',
      label: 'Participants',
      icon: GraduationCap,
    },
    {
      id: 'platform_programmes',
      label: 'Programmes',
      icon: CalendarCheck,
    },
    {
      id: 'platform_scores',
      label: 'Scores & Results',
      icon: CheckSquare,
    },
    {
      id: 'platform_schedule',
      label: 'Schedule Overview',
      icon: Clock,
    },
    {
      id: 'platform_reports',
      label: 'Reports & Analytics',
      icon: BarChart3,
    },
    {
      id: 'platform_notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadNotifsCount > 0 ? unreadNotifsCount : undefined,
      badgeVariant: 'danger',
    },
    {
      id: 'platform_audit_logs',
      label: 'Audit Logs',
      icon: ScrollText,
    },
    {
      id: 'platform_settings',
      label: 'Platform Settings',
      icon: Settings,
    },
    {
      id: 'security_permissions',
      label: 'Security & Permissions',
      icon: ShieldCheck,
    },
    {
      id: 'help_support',
      label: 'Help & Support',
      icon: HelpCircle,
    },
  ];

  const handleNavClick = (id: SuperAdminNavigationTab) => {
    setSuperAdminTab(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Persistent desktop sidebar & off-canvas mobile */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand & Platform Header */}
        <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/festoria-logo.jpg"
              alt="Festoria Logo"
              className="w-8 h-8 rounded-lg object-contain border border-slate-200/80 bg-white shadow-2xs"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-900 text-sm tracking-tight">Festoria</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300">
                  PLATFORM
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Super Admin Control</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded text-slate-400 hover:text-slate-600 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Platform Governance
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = superAdminTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded transition-colors text-left ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-semibold border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      item.badgeVariant === 'warning'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : item.badgeVariant === 'danger'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : item.badgeVariant === 'info'
                        ? 'bg-sky-100 text-sky-800 border border-sky-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Portal Switcher & Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/50 space-y-2">
          <div className="text-[11px] font-medium text-slate-600 px-2 flex items-center justify-between">
            <span>Fast Switch Portal</span>
            <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <button
            onClick={() => switchPortal('fest_admin', activeFest?.id || 'FEST-01')}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium bg-white text-slate-700 hover:text-slate-900 border border-slate-200 rounded hover:border-slate-300 transition-colors shadow-xs text-left"
          >
            <div className="truncate">
              <span className="block font-medium truncate">{activeFest?.name || 'Fest Admin'}</span>
              <span className="text-[10px] text-slate-400 block truncate">Individual Fest Panel</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1.5" />
          </button>

          <button
            onClick={() => switchPortal('public')}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors text-left"
          >
            <span>Public Visitor Portal</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </button>

          <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-400 px-2 flex items-center justify-between">
            <span>Platform Core v2.4</span>
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Healthy
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
