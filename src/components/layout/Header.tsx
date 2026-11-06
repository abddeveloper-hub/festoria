import React, { useState } from 'react';
import { useFest, NavigationTab } from '../../context/FestContext';
import {
  Menu,
  Search,
  ExternalLink,
  RotateCcw,
  UserCheck,
  Check,
  Trophy,
  LogOut
} from 'lucide-react';

interface HeaderProps {
  setMobileOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ setMobileOpen }) => {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    switchCurrentUser,
    logout,
    users,
    resetToDefaultData,
    participants,
    programmes,
    teams,
    navigateToTabWithFilter,
    switchPortal,
  } = useFest();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const getPageTitle = (tab: NavigationTab) => {
    switch (tab) {
      case 'dashboard':
        return { title: 'Dashboard — Total Analysis', breadcrumb: 'Overview' };
      case 'participants':
        return { title: 'Participant Directory', breadcrumb: 'Registrations' };
      case 'judges':
        return { title: 'Judge Management & Assignments', breadcrumb: 'Adjudication' };
      case 'programmes':
        return { title: 'Programme & Event Roster', breadcrumb: 'Competitions' };
      case 'scores':
        return { title: 'Scores & Results Management', breadcrumb: 'Evaluation' };
      case 'teams':
        return { title: 'Teams & Standings', breadcrumb: 'Houses & Colleges' };
      case 'schedule':
        return { title: 'Fest Schedule & Timetable', breadcrumb: 'Logistics' };
      case 'team_leaders':
        return { title: 'Team Leader Management', breadcrumb: 'Team Management' };
      case 'users':
        return { title: 'User Accounts & Access Control', breadcrumb: 'Security' };
      case 'public':
        return { title: 'Visitor Public Portal', breadcrumb: 'Frontend' };
      case 'reports':
        return { title: 'Reports & Data Exports', breadcrumb: 'Analytics' };
      case 'settings':
        return { title: 'System & Fest Settings', breadcrumb: 'Configuration' };
      default:
        return { title: 'Dashboard — Total Analysis', breadcrumb: 'Overview' };
    }
  };

  const { title, breadcrumb } = getPageTitle(activeTab);

  // Global search matches
  const searchResults = searchQuery.trim().length > 1 ? {
    participants: participants.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 3),
    programmes: programmes.filter(
      (pr) =>
        pr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pr.code.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 3),
    teams: teams.filter(
      (t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.code.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 3),
  } : null;

  const totalMatches = searchResults
    ? searchResults.participants.length + searchResults.programmes.length + searchResults.teams.length
    : 0;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger & Page Title / Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded border border-slate-200 text-slate-600 hover:text-slate-900 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <span>Admin Portal</span>
            <span>/</span>
            <span className="text-slate-700">{breadcrumb}</span>
          </div>
          <h1 className="text-sm sm:text-base font-semibold text-slate-900 truncate">
            {title}
          </h1>
        </div>
      </div>

      {/* Middle: Universal Quick Search with dropdown */}
      <div className="relative hidden md:block w-72 lg:w-80">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search participants, events, teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:border-slate-400 text-slate-900 placeholder-slate-400"
          />
        </div>

        {/* Search Results Dropdown */}
        {searchFocused && searchQuery.trim().length > 1 && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg p-2 z-50 text-xs">
            {totalMatches === 0 ? (
              <div className="p-3 text-slate-400 text-center">No matching records found.</div>
            ) : (
              <div className="space-y-2">
                {searchResults!.programmes.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-slate-400 px-2 py-0.5">Programmes</div>
                    {searchResults!.programmes.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          navigateToTabWithFilter('programmes', { programmeId: p.id });
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-2 py-1 rounded hover:bg-slate-50 flex items-center justify-between"
                      >
                        <span className="font-medium text-slate-800">{p.name}</span>
                        <span className="text-[10px] font-mono text-slate-500">{p.code}</span>
                      </button>
                    ))}
                  </div>
                )}
                {searchResults!.participants.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-slate-400 px-2 py-0.5">Participants</div>
                    {searchResults!.participants.map((pt) => (
                      <button
                        key={pt.id}
                        onClick={() => {
                          navigateToTabWithFilter('participants');
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-2 py-1 rounded hover:bg-slate-50 flex items-center justify-between"
                      >
                        <span className="font-medium text-slate-800">{pt.name}</span>
                        <span className="text-[10px] font-mono text-slate-500">{pt.id}</span>
                      </button>
                    ))}
                  </div>
                )}
                {searchResults!.teams.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-slate-400 px-2 py-0.5">Teams</div>
                    {searchResults!.teams.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          navigateToTabWithFilter('teams');
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-2 py-1 rounded hover:bg-slate-50 flex items-center justify-between"
                      >
                        <span className="font-medium text-slate-800">{t.name}</span>
                        <span className="text-[10px] font-mono text-slate-500">{t.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Actions, Public Link, and Role Switcher */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Team Leader Portal Button */}
        <button
          onClick={() => switchPortal('team_leader')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 hover:border-slate-300 transition-colors"
          title="Open Team Leader Portal"
        >
          <Trophy className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Team Leader Portal</span>
        </button>

        {/* View Public Portal Button */}
        <button
          onClick={() => {
            if (window.location.pathname.includes('admin.html')) {
              window.location.href = '/index.html?tab=public';
            } else {
              setActiveTab('public');
            }
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 hover:border-slate-300 transition-colors"
          title="Open public visitor fest page"
        >
          <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Public Fest Site</span>
        </button>

        {/* Reset Database Button */}
        <button
          onClick={() => {
            if (window.confirm('Reset fest data to clean default demo records?')) {
              resetToDefaultData();
            }
          }}
          className="p-1.5 rounded border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          title="Reset database to default seed state"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-left transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-900 leading-tight">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-slate-500 capitalize flex items-center gap-1">
                <span>{currentUser.role.replace('_', ' ')}</span>
              </div>
            </div>
          </button>

          {showRoleMenu && (
            <div
              className="absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-50 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="font-semibold text-slate-800">{currentUser.name}</p>
                <p className="text-[11px] text-slate-500">{currentUser.email}</p>
                <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 capitalize">
                  {currentUser.role.replace('_', ' ')}
                </span>
              </div>

              <div className="px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  RBAC Active
                </span>
                <span className="font-mono text-[10px]">ID: {currentUser.id}</span>
              </div>

              <div className="p-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={async () => {
                    setShowRoleMenu(false);
                    await logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded transition-colors font-medium text-xs"
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
  );
};
