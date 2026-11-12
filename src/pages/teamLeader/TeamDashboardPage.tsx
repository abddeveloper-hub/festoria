import React from 'react';
import { useFest } from '../../context/FestContext';
import {
  Trophy,
  Award,
  Users,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  Clock,
  MapPin,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';

export const TeamDashboardPage: React.FC = () => {
  const {
    activeTeam,
    activeTeamId,
    leaderboard,
    results,
    programmes,
    participants,
    scheduleSlots,
    complaints,
    announcements,
    setTeamLeaderTab,
  } = useFest();

  // Active team's ranking entry
  const teamRankEntry = leaderboard.find((e) => e.team.id === activeTeamId);
  const currentRank = teamRankEntry?.rank || '-';
  const totalPoints = teamRankEntry?.totalPoints || 0;
  const rank1Points = leaderboard[0]?.totalPoints || 0;
  const pointGap = rank1Points - totalPoints;

  // Team participants
  const teamMembers = participants.filter((p) => p.teamId === activeTeamId);

  // Team results
  const teamResults = results
    .filter((r) => r.teamId === activeTeamId)
    .sort((a, b) => new Date(b.publishedAt || '').getTime() - new Date(a.publishedAt || '').getTime());

  // Recent 4 results
  const recentResults = teamResults.slice(0, 4);

  // Team's upcoming schedule
  const teamMemberIds = new Set(teamMembers.map((m) => m.id));
  const teamProgrammes = programmes.filter((prg) => {
    // Check if any team participant is registered in this programme
    return prg.registeredParticipantIds?.some((pid: string) => teamMemberIds.has(pid));
  });

  const upcomingProgrammes = teamProgrammes
    .filter((p) => p.status === 'scheduled' || p.status === 'ongoing')
    .slice(0, 4);

  // Complaints for this team
  const teamComplaints = complaints.filter((c) => c.teamId === activeTeamId);
  const pendingComplaints = teamComplaints.filter(
    (c) => c.status === 'submitted' || c.status === 'under_review' || c.status === 'escalated'
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Page Title & Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Live Fest Feed Active
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Team Scoreboard & Live Standings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time score tally, medal standing, and performance tracker for{' '}
            <strong className="text-slate-900">{activeTeam?.name || 'Your Team'}</strong>.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setTeamLeaderTab('team_assignments')}
            className="w-full sm:w-auto px-3.5 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs text-center"
          >
            Assign Member
          </button>
          <button
            onClick={() => setTeamLeaderTab('team_complaints')}
            className="w-full sm:w-auto px-3.5 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors shadow-2xs flex items-center justify-center gap-1.5"
          >
            <AlertTriangle size={14} />
            <span>File Appeal</span>
          </button>
        </div>
      </div>

      {/* PROMINENT LIVE SCORE & RANKING HERO */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-800/80 relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-5">
          {/* Top Status Strip */}
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Official Festival Standings
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-indigo-200">
              <Sparkles size={12} className="text-amber-400" />
              <span>{currentRank === 1 ? 'Championship Leader' : 'In Trophy Contention'}</span>
            </div>
          </div>

          {/* Core Score & Rank Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Rank Badge + Main Points */}
            <div className="md:col-span-7 flex items-center gap-4 sm:gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm flex flex-col items-center justify-center shrink-0 shadow-inner">
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                  Rank
                </span>
                <span className="text-2xl sm:text-3xl font-black text-white">
                  #{currentRank}
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                    {totalPoints}
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-emerald-400 uppercase tracking-wider">
                    Points
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 truncate">
                  {currentRank === 1
                    ? '🎉 Currently leading the fest championship!'
                    : `${pointGap} pts behind leader (${leaderboard[0]?.team?.name || '1st Place'})`}
                </p>
                <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-white/10 text-slate-200 border border-white/15">
                    {teamResults.length} Events Scored
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-white/10 text-slate-200 border border-white/15">
                    {teamMembers.length} Members
                  </span>
                </div>
              </div>
            </div>

            {/* Medals Tally Bar */}
            <div className="md:col-span-5 grid grid-cols-3 gap-2">
              <div className="bg-amber-400/10 border border-amber-400/25 rounded-xl p-2.5 text-center">
                <div className="text-base sm:text-lg mb-0.5">🥇</div>
                <div className="text-lg sm:text-xl font-black text-white leading-tight">
                  {teamRankEntry?.firstPlaceCount || 0}
                </div>
                <div className="text-[10px] text-amber-300 font-bold uppercase tracking-wide">
                  1st Place
                </div>
              </div>

              <div className="bg-slate-300/10 border border-slate-300/25 rounded-xl p-2.5 text-center">
                <div className="text-base sm:text-lg mb-0.5">🥈</div>
                <div className="text-lg sm:text-xl font-black text-white leading-tight">
                  {teamRankEntry?.secondPlaceCount || 0}
                </div>
                <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wide">
                  2nd Place
                </div>
              </div>

              <div className="bg-amber-700/15 border border-amber-600/25 rounded-xl p-2.5 text-center">
                <div className="text-base sm:text-lg mb-0.5">🥉</div>
                <div className="text-lg sm:text-xl font-black text-white leading-tight">
                  {teamRankEntry?.thirdPlaceCount || 0}
                </div>
                <div className="text-[10px] text-amber-200 font-bold uppercase tracking-wide">
                  3rd Place
                </div>
              </div>
            </div>
          </div>

          {/* Hero Bottom Action */}
          <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-xs text-slate-300 text-center sm:text-left">
              Official scores update continuously as jury evaluations are published.
            </span>
            <button
              onClick={() => setTeamLeaderTab('team_leaderboard')}
              className="w-full sm:w-auto py-2 px-4 text-xs font-bold bg-white text-slate-900 rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-1.5 shadow-sm shrink-0"
            >
              <span>View Full Leaderboard</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* QUICK STATS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Roster Card */}
        <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 hover:bg-indigo-50/70 transition-all">
          <div className="flex items-center justify-between text-indigo-700 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Registered Roster</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Users size={15} className="text-indigo-600" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{teamMembers.length}</div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Verified members</span>
            <button
              onClick={() => setTeamLeaderTab('team_members')}
              className="text-indigo-600 hover:text-indigo-800 font-bold"
            >
              Manage &rarr;
            </button>
          </div>
        </div>

        {/* Events Card */}
        <div className="p-4 rounded-2xl border border-purple-100 bg-purple-50/40 hover:bg-purple-50/70 transition-all">
          <div className="flex items-center justify-between text-purple-700 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Events Entered</span>
            <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
              <Sparkles size={15} className="text-purple-600" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{teamProgrammes.length}</div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Active events</span>
            <button
              onClick={() => setTeamLeaderTab('team_assignments')}
              className="text-purple-600 hover:text-purple-800 font-bold"
            >
              Assign &rarr;
            </button>
          </div>
        </div>

        {/* Upcoming Schedule Card */}
        <div className="p-4 rounded-2xl border border-sky-100 bg-sky-50/40 hover:bg-sky-50/70 transition-all">
          <div className="flex items-center justify-between text-sky-700 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Upcoming Schedule</span>
            <div className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center">
              <Calendar size={15} className="text-sky-600" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{upcomingProgrammes.length}</div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Next stages</span>
            <button
              onClick={() => setTeamLeaderTab('team_schedule')}
              className="text-sky-600 hover:text-sky-800 font-bold"
            >
              Timetable &rarr;
            </button>
          </div>
        </div>

        {/* Appeals Card */}
        <div className="p-4 rounded-2xl border border-amber-100 bg-amber-50/40 hover:bg-amber-50/70 transition-all">
          <div className="flex items-center justify-between text-amber-700 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Appeals</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangle size={15} className="text-amber-600" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {pendingComplaints.length}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className={pendingComplaints.length > 0 ? 'text-amber-700 font-bold' : 'text-slate-500 font-medium'}>
              {pendingComplaints.length > 0 ? 'Awaiting jury' : 'No open cases'}
            </span>
            <button
              onClick={() => setTeamLeaderTab('team_complaints')}
              className="text-amber-700 hover:text-amber-800 font-bold"
            >
              View &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* TWO COLUMN GRID: TOP 5 STANDINGS VS RECENT RESULTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Left: Overall Leaderboard Preview */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900">Top Team Standings</h2>
              <p className="text-xs text-slate-500">
                Official fest table with tie-break calculations
              </p>
            </div>
            <button
              onClick={() => setTeamLeaderTab('team_leaderboard')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Full Standings</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {leaderboard.slice(0, 5).map((entry) => {
              const isCurrentTeam = entry.team.id === activeTeamId;
              return (
                <div
                  key={entry.team.id}
                  className={`py-2.5 px-3 rounded-xl flex items-center justify-between transition-colors ${
                    isCurrentTeam
                      ? 'bg-indigo-50/60 border border-indigo-200 font-semibold'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                        entry.rank === 1
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : entry.rank === 2
                          ? 'bg-slate-200 text-slate-800'
                          : entry.rank === 3
                          ? 'bg-amber-50 text-amber-900 border border-amber-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {entry.rank}
                    </span>
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: entry.team.colorHex || '#3b82f6' }}
                    />
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-900 truncate">
                          {entry.team.name}
                        </span>
                        {isCurrentTeam && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-900 text-white font-bold tracking-tight">
                            YOU
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 truncate block">
                        {entry.team.institution}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-3">
                    <span className="text-sm font-black text-slate-900">
                      {entry.totalPoints} pts
                    </span>
                    <div className="text-[10px] text-slate-500 font-medium">
                      🥇{entry.firstPlaceCount} 🥈{entry.secondPlaceCount} 🥉{entry.thirdPlaceCount}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Recent Results for Active Team */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900">Recent Team Results</h2>
              <p className="text-xs text-slate-500">
                Latest scores awarded to {activeTeam?.name || 'Your Team'}
              </p>
            </div>
            <button
              onClick={() => setTeamLeaderTab('team_results')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>All Results</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {recentResults.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <Award size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">No results published yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Scores will appear here as soon as jury evaluations are approved.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentResults.map((res) => {
                const prg = programmes.find((p) => p.id === res.programmeId);
                return (
                  <div
                    key={res.id}
                    className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {prg?.name || res.programmeId}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-semibold">
                          {prg?.category || 'General'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        <span className="font-medium text-slate-700">{res.participantName || 'Team Entry'}</span>
                        <span>•</span>
                        <span>Score: {res.finalScore.toFixed(1)}/100</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-3">
                      <div className="flex items-center gap-1.5 justify-end">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                            res.rank === 1
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : res.rank === 2
                              ? 'bg-slate-200 text-slate-800'
                              : res.rank === 3
                              ? 'bg-amber-50 text-amber-900 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          Rank #{res.rank}
                        </span>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                          +{res.pointsAwarded} pts
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {res.publishedAt?.slice(0, 10)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM ROW: UPCOMING SCHEDULE & OFFICIAL ANNOUNCEMENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Upcoming Programme Timetable */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900">Upcoming Team Events</h2>
              <p className="text-xs text-slate-500">
                Scheduled stage slots and venues for your team members
              </p>
            </div>
            <button
              onClick={() => setTeamLeaderTab('team_schedule')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Full Schedule</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {upcomingProgrammes.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <Calendar size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">No pending events scheduled</p>
              <p className="text-xs text-slate-500 mt-1">
                All assigned team events have completed or are yet to be scheduled.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingProgrammes.map((prg) => (
                <div
                  key={prg.id}
                  className="p-3 rounded-xl border border-slate-200 flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{prg.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock size={12} className="text-slate-400" />
                        {prg.date} • {prg.startTime} - {prg.endTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} className="text-slate-400" />
                        {prg.venue}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 pl-3">
                    <span className="text-xs px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                      Reporting 30m prior
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fest Announcements & Notices */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900">Fest Bulletins</h2>
              <p className="text-xs text-slate-500">Official updates from fest coordinators</p>
            </div>
            <button
              onClick={() => setTeamLeaderTab('team_announcements')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>All Bulletins</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-2.5">
            {announcements.slice(0, 3).map((a) => (
              <div
                key={a.id}
                className={`p-3 rounded-xl border text-xs ${
                  a.category === 'urgent'
                    ? 'border-rose-200 bg-rose-50/50'
                    : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-slate-900 truncate">{a.title}</span>
                  <span className="text-[10px] text-slate-400 shrink-0 font-medium">{a.createdAt}</span>
                </div>
                <p className="text-slate-600 line-clamp-2">{a.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
