import React, { useState } from 'react';
import { useFest } from '../../context/FestContext';
import { SuperAdminNavigationTab } from '../../types';
import {
  Menu,
  Search,
  Bell,
  CheckCheck,
  RotateCcw,
  Shield,
  ExternalLink,
  ChevronDown,
  Building2,
  AlertTriangle,
  Info,
  CheckCircle2,
  X,
  Trophy,
  LogOut
} from 'lucide-react';

interface SuperAdminHeaderProps {
  setMobileOpen: (open: boolean) => void;
}

export const SuperAdminHeader: React.FC<SuperAdminHeaderProps> = ({ setMobileOpen }) => {
  const {
    superAdminTab,
    setSuperAdminTab,
    currentUser,
    switchCurrentUser,
    logout,
    users,
    fests,
    festRequests,
    platformNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    resetToDefaultData,
    switchPortal,
    activeFestId,
    setActiveFestId
  } = useFest();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showFestSelector, setShowFestSelector] = useState(false);

  const getPageInfo = (tab: SuperAdminNavigationTab) => {
    switch (tab) {
      case 'super_dashboard':
        return { title: 'Dashboard — Platform-Wide Total Analysis', category: 'Overview & Intelligence' };
      case 'fest_requests':
        return { title: 'Fest Requests — Approval Management', category: 'Platform Governance' };
      case 'all_fests':
        return { title: 'All Fests — Central Fest Directory', category: 'Operations' };
      case 'fest_monitoring':
        return { title: 'Fest Monitoring — Lifecycle & Operational Progress', category: 'Oversight' };
      case 'admin_management':
        return { title: 'Admin Management — Fest Admin Accounts', category: 'Personnel' };
      case 'platform_users':
        return { title: 'Platform Users & RBAC Directory', category: 'Identity & Access' };
      case 'platform_participants':
        return { title: 'Cross-Fest Participant Directory', category: 'Registrations' };
      case 'platform_programmes':
        return { title: 'Platform Programmes & Event Roster', category: 'Competitions' };
      case 'platform_scores':
        return { title: 'Platform Scores & Ratified Results', category: 'Adjudication' };
      case 'platform_schedule':
        return { title: 'Schedule Overview & Logistics Heatmap', category: 'Operations' };
      case 'platform_reports':
        return { title: 'Reports & Analytics Intelligence', category: 'Exports' };
      case 'platform_notifications':
        return { title: 'Platform Notification Centre', category: 'Communications' };
      case 'platform_audit_logs':
        return { title: 'Platform Audit Logs — Immutable Records', category: 'Compliance' };
      case 'platform_settings':
        return { title: 'Platform Settings & Governance Rules', category: 'Configuration' };
      case 'security_permissions':
        return { title: 'Security, Session & Access Policies', category: 'Platform Defense' };
      case 'help_support':
        return { title: 'Platform Documentation & System Diagnostics', category: 'Support' };
    }
  };

  const { title, category } = getPageInfo(superAdminTab);

  const unreadNotifs = platformNotifications.filter((n) => !n.read);

  // Global search across Fests, Requests, and Admins
  const trimmed = searchQuery.trim().toLowerCase();
  const searchResults = trimmed.length > 1 ? {
    fests: fests.filter((f) => f.name.toLowerCase().includes(trimmed) || f.id.toLowerCase().includes(trimmed) || f.institution.toLowerCase().includes(trimmed)).slice(0, 3),
    requests: festRequests.filter((r) => r.festName.toLowerCase().includes(trimmed) || r.id.toLowerCase().includes(trimmed) || r.requestingAdminName.toLowerCase().includes(trimmed)).slice(0, 3),
    admins: users.filter((u) => u.name.toLowerCase().includes(trimmed) || u.email.toLowerCase().includes(trimmed)).slice(0, 3),
  } : null;

  const totalSearchResults = searchResults
    ? searchResults.fests.length + searchResults.requests.length + searchResults.admins.length
    : 0;

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded border border-slate-200 text-slate-600 hover:text-slate-900 lg:hidden"
            title="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
              <span className="font-semibold text-slate-700">Platform Control</span>
              <span>/</span>
              <span>{category}</span>
            </div>
            <h1 className="text-sm sm:text-base font-semibold text-slate-900 truncate">
              {title}
            </h1>
          </div>
        </div>

        {/* Middle: Universal Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-2 relative">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search fests, requests, admins, IDs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
            />
          </div>

          {/* Search Dropdown Results */}
          {searchFocused && searchResults && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded shadow-lg p-2 z-50 max-h-80 overflow-y-auto">
              {totalSearchResults === 0 ? (
                <div className="p-3 text-xs text-slate-400 text-center">No platform records match "{searchQuery}"</div>
              ) : (
                <div className="space-y-3 text-xs">
                  {searchResults.fests.length > 0 && (
                    <div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-0.5">Fests</div>
                      {searchResults.fests.map((f) => (
                        <button
                          key={f.id}
                          onMouseDown={() => {
                            setActiveFestId(f.id);
                            setSuperAdminTab('fest_monitoring');
                            setSearchQuery('');
                          }}
                          className="w-full text-left px-2 py-1.5 hover:bg-slate-50 rounded flex items-center justify-between"
                        >
                          <div>
                            <span className="font-medium text-slate-900">{f.name}</span>
                            <span className="text-[10px] text-slate-500 ml-2">{f.institution}</span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">{f.status}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.requests.length > 0 && (
                    <div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-0.5">Requests</div>
                      {searchResults.requests.map((r) => (
                        <button
                          key={r.id}
                          onMouseDown={() => {
                            setSuperAdminTab('fest_requests');
                            setSearchQuery('');
                          }}
                          className="w-full text-left px-2 py-1.5 hover:bg-slate-50 rounded flex items-center justify-between"
                        >
                          <div>
                            <span className="font-medium text-slate-900">{r.festName}</span>
                            <span className="text-[10px] text-slate-500 ml-2">by {r.requestingAdminName}</span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">{r.status}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.admins.length > 0 && (
                    <div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-0.5">Users & Admins</div>
                      {searchResults.admins.map((u) => (
                        <button
                          key={u.id}
                          onMouseDown={() => {
                            setSuperAdminTab('admin_management');
                            setSearchQuery('');
                          }}
                          className="w-full text-left px-2 py-1.5 hover:bg-slate-50 rounded flex items-center justify-between"
                        >
                          <div>
                            <span className="font-medium text-slate-900">{u.name}</span>
                            <span className="text-[10px] text-slate-500 ml-2">{u.email}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 capitalize">
                            {typeof u.role === 'string' ? u.role.replace('_', ' ') : 'User'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Actions, Notifications, Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Fest Selector for Fest Admin jump */}
          <div className="relative hidden xl:block">
            <button
              onClick={() => setShowFestSelector(!showFestSelector)}
              className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Fest Admin Mode</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showFestSelector && (
              <div className="absolute right-0 mt-1.5 w-60 bg-white border border-slate-200 rounded shadow-lg p-1 z-50 text-xs">
                <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase">
                  Select Fest to Manage
                </div>
                {fests.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setShowFestSelector(false);
                      switchPortal('fest_admin', f.id);
                    }}
                    className="w-full text-left px-2 py-1.5 hover:bg-slate-50 rounded flex items-center justify-between"
                  >
                    <div className="truncate">
                      <div className="font-medium text-slate-900 truncate">{f.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{f.institution}</div>
                    </div>
                    <span className="text-[10px] font-mono px-1 rounded bg-slate-100 text-slate-600 ml-1.5">{f.id}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Team Leader Portal Jump */}
          <button
            onClick={() => switchPortal('team_leader')}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Open Team Leader Portal"
          >
            <Trophy className="w-3.5 h-3.5 text-slate-500" />
            <span>Team Leader</span>
          </button>

          {/* Notifications Popover */}
          <div className="relative">
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative p-1.5 rounded border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              title="Platform Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadNotifs.length}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded shadow-lg z-50 p-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-slate-900">Platform Alerts</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                      {unreadNotifs.length} new
                    </span>
                  </div>
                  {unreadNotifs.length > 0 && (
                    <button
                      onClick={() => markAllNotificationsAsRead()}
                      className="text-[11px] text-slate-600 hover:text-slate-900 flex items-center gap-1"
                    >
                      <CheckCheck className="w-3 h-3" />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2">
                  {platformNotifications.slice(0, 6).map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markNotificationAsRead(notif.id)}
                      className={`p-2 rounded text-xs border transition-colors cursor-pointer ${
                        notif.read ? 'bg-white border-slate-100 opacity-70' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          {notif.severity === 'critical' ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          ) : notif.severity === 'warning' ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          ) : notif.severity === 'success' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <Info className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                          )}
                          <span className="font-semibold text-slate-900">{notif.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">{notif.createdAt.slice(5, 16)}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 mt-2 pt-2 text-center">
                  <button
                    onClick={() => {
                      setSuperAdminTab('platform_notifications');
                      setShowNotifMenu(false);
                    }}
                    className="text-xs text-slate-700 hover:text-slate-900 font-medium"
                  >
                    View All Platform Notifications &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Active User / Role Badge Menu */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded border border-slate-200 hover:border-slate-300 bg-white transition-colors text-left"
            >
              <div className="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-medium text-slate-900 leading-tight">{currentUser.name}</div>
                <div className="text-[10px] text-slate-500 capitalize">{currentUser.role.replace('_', ' ')}</div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded shadow-lg p-2 z-50 text-xs">
                <div className="px-2 py-1.5 border-b border-slate-100 mb-1">
                  <div className="font-semibold text-slate-800">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-400">{currentUser.email}</div>
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 capitalize">
                    {currentUser.role.replace('_', ' ')}
                  </span>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={async () => {
                      setShowRoleMenu(false);
                      await logout();
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors font-medium text-xs"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
