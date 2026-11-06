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
    <div className="space-y-6">
      {/* Page Title & Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Live Fest Feed Active
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Team Scoreboard & Live Standings
          </h1>
          <p className="text-sm text-slate-500">
            Real-time score tally, medal standing, and performance tracker for{' '}
            <strong className="text-slate-900">{activeTeam?.name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTeamLeaderTab('team_assignments')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Assign Member
          </button>
          <button
            onClick={() => setTeamLeaderTab('team_complaints')}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <AlertTriangle size={14} />
            <span>File Appeal</span>
          </button>
        </div>
      </div>

      {/* PROMINENT LIVE SCORE & RANKING HERO */}
      <div className="bg-slate-900 text-white rounded-xl p-5 md:p-6 shadow-sm border border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Main Score & Rank Display */}
          <div className="md:col-span-5 flex items-center gap-5 border-b md:border-b-0 md:border-r border-slate-800 pb-5 md:pb-0 md:pr-5">
            <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex flex-col items-center justify-center shrink-0">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Rank
              </span>
              <span className="text-3xl font-extrabold text-white">
                #{currentRank}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                  {totalPoints}
                </span>
                <span className="text-sm font-semibold text-emerald-400 uppercase tracking-wide">
                  Points
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {currentRank === 1
                  ? 'Currently leading the fest championship!'
                  : `${pointGap} points behind 1st position (${leaderboard[0]?.team.name})`}
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-slate-200 border border-white/15">
                  {teamResults.length} Events Scored
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-slate-200 border border-white/15">
                  {teamMembers.length} Members
                </span>
              </div>
            </div>
          </div>

          {/* Medals Tally */}
          <div className="md:col-span-4 flex items-center justify-around gap-2 border-b md:border-b-0 md:border-r border-slate-800 pb-5 md:pb-0 md:pr-4">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-lg mb-1">
                🥇
              </div>
              <p className="text-lg font-bold text-white">
                {teamRankEntry?.firstPlaceCount || 0}
              </p>
              <p className="text-[11px] text-slate-400 font-medium uppercase">1st Place</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-slate-300/20 border border-slate-300/30 flex items-center justify-center text-lg mb-1">
                🥈
              </div>
              <p className="text-lg font-bold text-white">
                {teamRankEntry?.secondPlaceCount || 0}
              </p>
              <p className="text-[11px] text-slate-400 font-medium uppercase">2nd Place</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-amber-700/20 border border-amber-600/30 flex items-center justify-center text-lg mb-1">
                🥉
              </div>
              <p className="text-lg font-bold text-white">
                {teamRankEntry?.thirdPlaceCount || 0}
              </p>
              <p className="text-[11px] text-slate-400 font-medium uppercase">3rd Place</p>
            </div>
          </div>

          {/* Leaderboard CTA & Standing summary */}
          <div className="md:col-span-3 flex flex-col justify-center space-y-2">
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-white">Championship Status:</span>{' '}
              {currentRank === 1 ? 'Contending for Trophy' : 'In Contention'}
            </div>
            <button
              onClick={() => setTeamLeaderTab('team_leaderboard')}
              className="w-full py-2 px-3 text-xs font-semibold bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>View Full Leaderboard</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* QUICK STATS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Registered Roster</span>
            <Users size={16} className="text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{teamMembers.length}</div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>Verified members</span>
            <button
              onClick={() => setTeamLeaderTab('team_members')}
              className="text-blue-600 hover:underline font-medium"
            >
              Manage
            </button>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Events Entered</span>
            <Sparkles size={16} className="text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{teamProgrammes.length}</div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>Active programmes</span>
            <button
              onClick={() => setTeamLeaderTab('team_assignments')}
              className="text-blue-600 hover:underline font-medium"
            >
              Assignments
            </button>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Upcoming Schedule</span>
            <Calendar size={16} className="text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{upcomingProgrammes.length}</div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>Next stages</span>
            <button
              onClick={() => setTeamLeaderTab('team_schedule')}
              className="text-blue-600 hover:underline font-medium"
            >
              Timetable
            </button>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Appeals & Inquiries</span>
            <AlertTriangle size={16} className="text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {pendingComplaints.length}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span className={pendingComplaints.length > 0 ? 'text-amber-600 font-medium' : 'text-slate-500'}>
              {pendingComplaints.length > 0 ? 'Awaiting jury review' : 'No open complaints'}
            </span>
            <button
              onClick={() => setTeamLeaderTab('team_complaints')}
              className="text-blue-600 hover:underline font-medium"
            >
              View
            </button>
          </div>
        </div>
      </div>

      {/* TWO COLUMN GRID: TOP 5 STANDINGS VS RECENT RESULTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Overall Leaderboard Preview */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Top Team Standings</h2>
              <p className="text-xs text-slate-500">
                Official fest table with tie-break calculations
              </p>
            </div>
            <button
              onClick={() => setTeamLeaderTab('team_leaderboard')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
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
                  className={`py-2.5 px-3 rounded-lg flex items-center justify-between transition-colors ${
                    isCurrentTeam
                      ? 'bg-slate-50 border border-slate-300 font-semibold'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        entry.rank === 1
                          ? 'bg-amber-100 text-amber-800'
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
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: entry.team.colorHex || '#3b82f6' }}
                    />
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm text-slate-900 truncate">
                          {entry.team.name}
                        </span>
                        {isCurrentTeam && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-white font-bold">
                            YOUR TEAM
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 truncate block">
                        {entry.team.institution}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-3">
                    <span className="text-sm font-bold text-slate-900">
                      {entry.totalPoints} pts
                    </span>
                    <div className="text-[10px] text-slate-500">
                      🥇{entry.firstPlaceCount} 🥈{entry.secondPlaceCount} 🥉{entry.thirdPlaceCount}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Recent Results for Active Team */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Team Results</h2>
              <p className="text-xs text-slate-500">
                Latest scores awarded to {activeTeam?.name}
              </p>
            </div>
            <button
              onClick={() => setTeamLeaderTab('team_results')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>All Results</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {recentResults.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 rounded-lg">
              <Award size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-700">No results published yet</p>
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
                    className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {prg?.name || res.programmeId}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                          {prg?.category || 'General'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>{res.participantName || 'Team Entry'}</span>
                        <span>•</span>
                        <span>Final Score: {res.finalScore.toFixed(1)}/100</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-3">
                      <div className="flex items-center gap-1.5 justify-end">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded ${
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
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upcoming Programme Timetable */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Upcoming Team Events</h2>
              <p className="text-xs text-slate-500">
                Scheduled stage slots and venues for your team members
              </p>
            </div>
            <button
              onClick={() => setTeamLeaderTab('team_schedule')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Full Schedule</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {upcomingProgrammes.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 rounded-lg">
              <Calendar size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-700">No pending events scheduled</p>
              <p className="text-xs text-slate-500 mt-1">
                All assigned team events have completed or are yet to be scheduled.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingProgrammes.map((prg) => (
                <div
                  key={prg.id}
                  className="p-3 rounded-lg border border-slate-200 flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 truncate">{prg.name}</p>
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
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                      Reporting 30m prior
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fest Announcements & Notices */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Fest Bulletins</h2>
              <p className="text-xs text-slate-500">Official updates from fest coordinators</p>
            </div>
            <button
              onClick={() => setTeamLeaderTab('team_announcements')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>All Bulletins</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {announcements.slice(0, 3).map((a) => (
              <div
                key={a.id}
                className={`p-3 rounded-lg border text-xs ${
                  a.category === 'urgent'
                    ? 'border-rose-200 bg-rose-50/40'
                    : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-slate-900">{a.title}</span>
                  <span className="text-[10px] text-slate-400 shrink-0">{a.createdAt}</span>
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
