import React, { useState } from 'react';
import { useFest } from '../../context/FestContext';
import {
  Menu,
  Bell,
  ChevronDown,
  Trophy,
  Award,
  Users,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  LogOut,
  ExternalLink,
} from 'lucide-react';

export const TeamLeaderHeader: React.FC<{ onMenuToggle: () => void }> = ({ onMenuToggle }) => {
  const {
    activeTeam,
    activeTeamId,
    setActiveTeamId,
    teams,
    leaderboard,
    currentUser,
    switchCurrentUser,
    logout,
    users,
    setTeamLeaderTab,
    platformNotifications,
    markNotificationAsRead,
    switchPortal,
    resetToDefaultData,
  } = useFest();

  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Find active team's leaderboard stats
  const teamRankEntry = leaderboard.find((e) => e.team.id === activeTeamId);
  const unreadNotifs = platformNotifications.filter((n) => !n.read);

  // Available team leaders in users list
  const teamLeaderUsers = users.filter((u) => u.role === 'team_leader');

  return (
    <header className="sticky top-0 z-20 h-14 sm:h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Toggle & Team Identifier */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg md:hidden min-w-[36px] min-h-[36px] flex items-center justify-center"
          title="Toggle Navigation Menu"
        >
          <Menu size={20} />
        </button>

        {/* Team Selector & Badge */}
        <div className="relative">
          <button
            onClick={() => {
              setShowTeamDropdown(!showTeamDropdown);
              setShowNotifDropdown(false);
              setShowProfileDropdown(false);
            }}
            className="flex items-center gap-2 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors bg-white text-left"
          >
            <span
              className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full shrink-0"
              style={{ backgroundColor: activeTeam?.colorHex || '#3b82f6' }}
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-bold text-slate-900 leading-tight truncate max-w-[110px] sm:max-w-none">
                  {activeTeam?.name || 'Solar Flare'}
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono text-slate-500 bg-slate-100 px-1 py-0.2 rounded hidden xs:inline">
                  {activeTeam?.id || 'TM-01'}
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-slate-500 hidden md:inline truncate max-w-[170px]">
                {activeTeam?.institution || 'National Institute of Arts'}
              </span>
            </div>
            <ChevronDown size={13} className="text-slate-400 ml-0.5 sm:ml-1" />
          </button>

          {/* Team Switcher Dropdown (for evaluation / demo) */}
          {showTeamDropdown && (
            <div className="absolute left-0 mt-2 w-72 bg-white rounded-lg border border-slate-200 shadow-lg py-1.5 z-50">
              <div className="px-3 py-1.5 border-b border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select Team Workspace
                </p>
                <p className="text-xs text-slate-500">
                  Switch team context for testing & review
                </p>
              </div>
              <div className="max-h-60 overflow-y-auto py-1">
                {teams.map((t) => {
                  const isSelected = t.id === activeTeamId;
                  const rankInfo = leaderboard.find((e) => e.team.id === t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setActiveTeamId(t.id);
                        setShowTeamDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-slate-50 font-semibold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: t.colorHex || '#3b82f6' }}
                        />
                        <div className="truncate">
                          <p className="text-sm text-slate-900 truncate">{t.name}</p>
                          <p className="text-xs text-slate-500 truncate">{t.institution}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 pl-2">
                        <span className="text-xs font-semibold text-slate-700">
                          {rankInfo ? `${rankInfo.totalPoints} pts` : '0 pts'}
                        </span>
                        {isSelected && (
                          <div className="text-[10px] text-emerald-600 font-bold">ACTIVE</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Compact Score Pill */}
        <div className="flex lg:hidden items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50/80 border border-emerald-200 text-xs">
          <span className="font-bold text-slate-800 font-mono text-[11px]">
            {teamRankEntry ? `#${teamRankEntry.rank}` : '#-'}
          </span>
          <span className="text-emerald-300">·</span>
          <span className="font-bold text-emerald-800 text-[11px]">
            {teamRankEntry?.totalPoints || 0} pts
          </span>
        </div>

        {/* Live Score & Rank Metric Pill (Desktop) */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <Trophy size={15} className="text-amber-500 shrink-0" />
          <span className="text-slate-600 font-medium">Standings:</span>
          <span className="font-bold text-slate-900">
            {teamRankEntry ? `Rank #${teamRankEntry.rank}` : 'Unranked'}
          </span>
          <span className="text-slate-300">•</span>
          <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            {teamRankEntry?.totalPoints || 0} Points
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-600">
            🥇 {teamRankEntry?.firstPlaceCount || 0} 🥈 {teamRankEntry?.secondPlaceCount || 0} 🥉 {teamRankEntry?.thirdPlaceCount || 0}
          </span>
        </div>
      </div>

      {/* Right Controls: Notifications & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifDropdown(!showNotifDropdown);
              setShowTeamDropdown(false);
              setShowProfileDropdown(false);
            }}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg relative transition-colors"
            title="Notifications"
          >
            <Bell size={18} />
            {unreadNotifs.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg border border-slate-200 shadow-xl py-2 z-50">
              <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Notifications</span>
                <span className="text-[11px] text-slate-500">
                  {unreadNotifs.length} unread
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {platformNotifications.slice(0, 5).map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 text-xs hover:bg-slate-50 transition-colors ${
                      !n.read ? 'bg-slate-50/70' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-slate-900">{n.title}</p>
                      {!n.read && (
                        <button
                          onClick={() => markNotificationAsRead(n.id)}
                          className="text-[10px] text-blue-600 hover:underline shrink-0"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                    <p className="text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {n.createdAt}
                    </span>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-slate-100 text-center">
                <button
                  onClick={() => {
                    setTeamLeaderTab('team_notifications');
                    setShowNotifDropdown(false);
                  }}
                  className="text-xs font-semibold text-slate-900 hover:underline"
                >
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileDropdown(!showProfileDropdown);
              setShowTeamDropdown(false);
              setShowNotifDropdown(false);
            }}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              {currentUser.name ? currentUser.name.charAt(0) : 'R'}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 truncate max-w-[120px]">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-slate-500 capitalize">
                {currentUser.role.replace('_', ' ')}
              </span>
            </div>
            <ChevronDown size={14} className="text-slate-400 hidden md:inline" />
          </button>

          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg border border-slate-200 shadow-xl py-1.5 z-50">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded">
                    Team Leader
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {activeTeam?.name}
                  </span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setTeamLeaderTab('team_account');
                    setShowProfileDropdown(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                >
                  Account Settings
                </button>
                <button
                  onClick={() => {
                    setTeamLeaderTab('team_profile');
                    setShowProfileDropdown(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                >
                  Manage Team Info
                </button>
                <button
                  onClick={() => {
                    resetToDefaultData();
                    setShowProfileDropdown(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-50 flex items-center gap-1.5"
                >
                  <RefreshCw size={12} />
                  <span>Reset Demo Data</span>
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={async () => {
                    setShowProfileDropdown(false);
                    await logout();
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-1.5"
                >
                  <LogOut size={13} />
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
