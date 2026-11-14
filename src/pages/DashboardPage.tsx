import React, { useMemo } from 'react';
import { useFest } from '../context/FestContext';
import { SummaryCard } from '../components/common/SummaryCard';
import { Badge } from '../components/common/Badge';
import {
  Users,
  Shield,
  CalendarCheck,
  Award,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck2,
  Filter,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Flame,
  Calendar
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const {
    summaryStats,
    teams,
    participants,
    programmes,
    scores,
    results,
    activityLogs,
    scheduleConflicts,
    leaderboard,
    navigateToTabWithFilter,
    dashboardFilters,
    setDashboardFilters,
  } = useFest();

  // Filtered programmes based on global filters
  const filteredProgrammes = useMemo(() => {
    return programmes.filter((p) => {
      if (dashboardFilters.category !== 'all' && p.category !== dashboardFilters.category) {
        return false;
      }
      if (dashboardFilters.date !== 'all' && p.date !== dashboardFilters.date) {
        return false;
      }
      if (dashboardFilters.teamId !== 'all' && !p.registeredTeamIds.includes(dashboardFilters.teamId)) {
        return false;
      }
      if (dashboardFilters.programmeId !== 'all' && p.id !== dashboardFilters.programmeId) {
        return false;
      }
      return true;
    });
  }, [programmes, dashboardFilters]);

  // Derived filtered participant count
  const filteredParticipantsCount = useMemo(() => {
    return participants.filter((p) => {
      if (dashboardFilters.teamId !== 'all' && p.teamId !== dashboardFilters.teamId) {
        return false;
      }
      if (dashboardFilters.category !== 'all') {
        // Match participant's registered programmes category
        const registeredProgs = programmes.filter((pr) => p.registeredProgrammes.includes(pr.id));
        if (!registeredProgs.some((pr) => (pr.category || '').trim().toLowerCase() === dashboardFilters.category.trim().toLowerCase())) {
          return false;
        }
      }
      return true;
    }).length;
  }, [participants, programmes, dashboardFilters]);

  // Distinct dates for the filter
  const distinctDates = useMemo(() => {
    const dates = Array.from(new Set(programmes.map((p) => p.date))).sort();
    return dates;
  }, [programmes]);

  // Distinct categories for the filter (deduplicated case-insensitively)
  const distinctCategories = useMemo(() => {
    const catMap = new Map<string, string>();
    programmes.forEach((p) => {
      if (p.category) {
        const norm = p.category.trim().toLowerCase();
        if (!catMap.has(norm)) {
          catMap.set(norm, p.category.trim());
        }
      }
    });
    return Array.from(catMap.values()).sort();
  }, [programmes]);

  // Category distribution
  const categoryStats = useMemo(() => {
    const map = new Map<string, { count: number; completed: number }>();
    distinctCategories.forEach((cat) => map.set(cat.toLowerCase(), { count: 0, completed: 0 }));

    programmes.forEach((p) => {
      const key = (p.category || '').trim().toLowerCase();
      const current = map.get(key) || { count: 0, completed: 0 };
      current.count += 1;
      if (p.status === 'completed') current.completed += 1;
      map.set(key, current);
    });

    return Array.from(map.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      completed: data.completed,
      percentage: Math.round((data.count / (programmes.length || 1)) * 100),
    }));
  }, [programmes, distinctCategories]);

  // Programme status breakdown
  const statusBreakdown = useMemo(() => {
    const total = programmes.length || 1;
    const completed = programmes.filter((p) => p.status === 'completed').length;
    const ongoing = programmes.filter((p) => p.status === 'ongoing').length;
    const scheduled = programmes.filter((p) => p.status === 'scheduled').length;
    const draft = programmes.filter((p) => p.status === 'draft').length;

    return {
      completed,
      ongoing,
      scheduled,
      draft,
      completedPercent: Math.round((completed / total) * 100),
      ongoingPercent: Math.round((ongoing / total) * 100),
      scheduledPercent: Math.round((scheduled / total) * 100),
      draftPercent: Math.round((draft / total) * 100),
    };
  }, [programmes]);

  // Recent scores
  const recentScores = useMemo(() => {
    return [...scores]
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
      .slice(0, 5);
  }, [scores]);

  // Upcoming programmes
  const upcomingEvents = useMemo(() => {
    return programmes
      .filter((p) => p.status === 'scheduled' || p.status === 'ongoing')
      .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`))
      .slice(0, 5);
  }, [programmes]);

  // Recent 5 participants
  const recentRegistrations = useMemo(() => {
    return [...participants]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5);
  }, [participants]);

  const hasActiveFilters =
    dashboardFilters.date !== 'all' ||
    dashboardFilters.category !== 'all' ||
    dashboardFilters.teamId !== 'all' ||
    dashboardFilters.programmeId !== 'all';

  const resetFilters = () => {
    setDashboardFilters({
      date: 'all',
      category: 'all',
      teamId: 'all',
      programmeId: 'all',
    });
  };

  return (
    <div className="space-y-6">
      {/* Schedule Conflict Alert Banner (if conflicts exist) */}
      {scheduleConflicts.length > 0 && (
        <div className="p-4 bg-white border border-amber-300 rounded-lg shadow-xs flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-1 rounded bg-amber-50 text-amber-700 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                {scheduleConflicts.length} Schedule Conflict(s) Detected
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Overlapping venues or double-booked judges/participants detected. Inspect the timetable to resolve clashes.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigateToTabWithFilter('schedule')}
            className="flex-shrink-0 text-xs font-semibold text-amber-800 hover:text-amber-950 underline flex items-center gap-1"
          >
            Review Schedule &rarr;
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Filter className="w-4 h-4 text-slate-500" />
            <span>Filter Dashboard Analytics</span>
            {hasActiveFilters && (
              <span className="ml-1 text-[11px] font-normal text-slate-500">
                (Filtered: {filteredProgrammes.length} programmes, {filteredParticipantsCount} participants)
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Date Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">
              Fest Date
            </label>
            <select
              value={dashboardFilters.date}
              onChange={(e) =>
                setDashboardFilters((prev) => ({ ...prev, date: e.target.value }))
              }
              className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-400 text-slate-800"
            >
              <option value="all">All Dates ({distinctDates.length} Days)</option>
              {distinctDates.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">
              Programme Category
            </label>
            <select
              value={dashboardFilters.category}
              onChange={(e) =>
                setDashboardFilters((prev) => ({ ...prev, category: e.target.value }))
              }
              className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-400 text-slate-800"
            >
              <option value="all">All Categories</option>
              {distinctCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Team Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">
              Team / House
            </label>
            <select
              value={dashboardFilters.teamId}
              onChange={(e) =>
                setDashboardFilters((prev) => ({ ...prev, teamId: e.target.value }))
              }
              className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-400 text-slate-800"
            >
              <option value="all">All Teams ({teams.length})</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
          </div>

          {/* Programme Filter */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">
              Specific Programme
            </label>
            <select
              value={dashboardFilters.programmeId}
              onChange={(e) =>
                setDashboardFilters((prev) => ({ ...prev, programmeId: e.target.value }))
              }
              className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-400 text-slate-800 truncate"
            >
              <option value="all">All Programmes ({programmes.length})</option>
              {programmes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 8 SUMMARY CARDS REQUIRED BY SPECIFICATION */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Participants */}
        <SummaryCard
          title="Total Participants"
          value={hasActiveFilters ? filteredParticipantsCount : summaryStats.totalParticipants}
          subtitle="Registered & verified"
          icon={Users}
          badgeText={hasActiveFilters ? 'Filtered' : 'Active'}
          badgeVariant="neutral"
          onClick={() => navigateToTabWithFilter('participants')}
        />

        {/* 2. Total Teams */}
        <SummaryCard
          title="Total Teams"
          value={summaryStats.totalTeams}
          subtitle="Competing houses & colleges"
          icon={Shield}
          badgeText="Active"
          badgeVariant="neutral"
          onClick={() => navigateToTabWithFilter('teams')}
        />

        {/* 3. Total Programmes */}
        <SummaryCard
          title="Total Programmes"
          value={hasActiveFilters ? filteredProgrammes.length : summaryStats.totalProgrammes}
          subtitle="Competitions & events"
          icon={CalendarCheck}
          badgeText={hasActiveFilters ? 'Filtered' : 'Roster'}
          badgeVariant="neutral"
          onClick={() => navigateToTabWithFilter('programmes')}
        />

        {/* 4. Total Judges */}
        <SummaryCard
          title="Total Judges"
          value={summaryStats.totalJudges}
          subtitle="Adjudicators & jurors"
          icon={Award}
          badgeText="Empanelled"
          badgeVariant="neutral"
          onClick={() => navigateToTabWithFilter('judges')}
        />

        {/* 5. Completed Programmes */}
        <SummaryCard
          title="Completed Programmes"
          value={hasActiveFilters ? filteredProgrammes.filter(p => p.status === 'completed').length : summaryStats.completedProgrammes}
          subtitle="Finished evaluations"
          icon={CheckCircle2}
          badgeText="Concluded"
          badgeVariant="success"
          onClick={() => navigateToTabWithFilter('programmes', { status: 'completed' })}
        />

        {/* 6. Upcoming Programmes */}
        <SummaryCard
          title="Upcoming Programmes"
          value={hasActiveFilters ? filteredProgrammes.filter(p => p.status === 'scheduled' || p.status === 'ongoing').length : summaryStats.upcomingProgrammes}
          subtitle="Scheduled & active"
          icon={Clock}
          badgeText="In Progress"
          badgeVariant="info"
          onClick={() => navigateToTabWithFilter('schedule')}
        />

        {/* 7. Pending Score Entries */}
        <SummaryCard
          title="Pending Scores"
          value={summaryStats.pendingScores}
          subtitle="Awaiting submission/review"
          icon={AlertCircle}
          badgeText={summaryStats.pendingScores > 0 ? 'Action Req.' : 'Clear'}
          badgeVariant={summaryStats.pendingScores > 0 ? 'warning' : 'success'}
          onClick={() => navigateToTabWithFilter('scores')}
        />

        {/* 8. Published Results */}
        <SummaryCard
          title="Published Results"
          value={summaryStats.publishedResults}
          subtitle="Official ratified scores"
          icon={FileCheck2}
          badgeText="Public"
          badgeVariant="success"
          onClick={() => navigateToTabWithFilter('scores')}
        />
      </div>

      {/* Main Analysis Section: Team Leaderboard & Programme Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Team Leaderboard (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Overall Team Rankings & Points
                </h3>
              </div>
              <button
                onClick={() => navigateToTabWithFilter('teams')}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                Full Leaderboard <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Standings table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-2 px-2 w-12 text-center">Rank</th>
                    <th className="py-2 px-3">Team / Institution</th>
                    <th className="py-2 px-2 text-center">1st</th>
                    <th className="py-2 px-2 text-center">2nd</th>
                    <th className="py-2 px-2 text-center">3rd</th>
                    <th className="py-2 px-3 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaderboard.slice(0, 5).map((entry) => (
                    <tr
                      key={entry.team.id}
                      onClick={() => navigateToTabWithFilter('teams')}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-800">
                        {entry.rank === 1 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs">
                            1
                          </span>
                        ) : (
                          `#${entry.rank}`
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: entry.team.colorHex || '#64748b' }}
                          />
                          <div>
                            <div className="font-semibold text-slate-900">
                              {entry.team.name}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {entry.team.institution}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-700">
                        {entry.firstPlaceCount}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-700">
                        {entry.secondPlaceCount}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-700">
                        {entry.thirdPlaceCount}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 text-sm">
                        {entry.totalPoints} pts
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Points calculated from approved results.</span>
            <span>Multiplier: 2x on Group Events</span>
          </div>
        </div>

        {/* Programme Completion Status Breakdown */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">
                Programme Completion
              </h3>
              <span className="text-xs font-mono font-medium text-slate-500">
                {programmes.length} Total
              </span>
            </div>

            {/* Segmented Progress bar */}
            <div className="mt-4 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1.5">
                  <span>Overall Progress</span>
                  <span className="font-mono">{statusBreakdown.completedPercent}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex border border-slate-200">
                  <div
                    className="bg-emerald-500 h-2.5 transition-all duration-500"
                    style={{ width: `${statusBreakdown.completedPercent}%` }}
                    title={`Completed: ${statusBreakdown.completed}`}
                  />
                  <div
                    className="bg-indigo-500 h-2.5 transition-all duration-500"
                    style={{ width: `${statusBreakdown.ongoingPercent}%` }}
                    title={`Ongoing: ${statusBreakdown.ongoing}`}
                  />
                  <div
                    className="bg-blue-400 h-2.5 transition-all duration-500"
                    style={{ width: `${statusBreakdown.scheduledPercent}%` }}
                    title={`Scheduled: ${statusBreakdown.scheduled}`}
                  />
                  <div
                    className="bg-slate-300 h-2.5 transition-all duration-500"
                    style={{ width: `${statusBreakdown.draftPercent}%` }}
                    title={`Draft: ${statusBreakdown.draft}`}
                  />
                </div>
              </div>

              {/* Status categories */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                <div
                  onClick={() => navigateToTabWithFilter('programmes', { status: 'completed' })}
                  className="p-2.5 rounded border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Completed
                  </div>
                  <div className="text-base font-bold font-mono text-slate-900 mt-1">
                    {statusBreakdown.completed}
                  </div>
                </div>

                <div
                  onClick={() => navigateToTabWithFilter('programmes', { status: 'ongoing' })}
                  className="p-2.5 rounded border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    Ongoing
                  </div>
                  <div className="text-base font-bold font-mono text-slate-900 mt-1">
                    {statusBreakdown.ongoing}
                  </div>
                </div>

                <div
                  onClick={() => navigateToTabWithFilter('programmes', { status: 'scheduled' })}
                  className="p-2.5 rounded border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    Scheduled
                  </div>
                  <div className="text-base font-bold font-mono text-slate-900 mt-1">
                    {statusBreakdown.scheduled}
                  </div>
                </div>

                <div
                  onClick={() => navigateToTabWithFilter('programmes', { status: 'draft' })}
                  className="p-2.5 rounded border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    Drafts
                  </div>
                  <div className="text-base font-bold font-mono text-slate-900 mt-1">
                    {statusBreakdown.draft}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            Click any status to filter the programme roster.
          </div>
        </div>
      </div>

      {/* Row 2: Programme-wise Participation by Category & Upcoming Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Participation Distribution */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">
              Participation by Programme Category
            </h3>
            <span className="text-xs text-slate-500">Breakdown</span>
          </div>

          <div className="mt-4 space-y-3">
            {categoryStats.map((item) => (
              <div
                key={item.name}
                onClick={() => navigateToTabWithFilter('programmes', { category: item.name })}
                className="group cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-slate-800 group-hover:text-slate-900">
                    {item.name}
                  </span>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                    <span>{item.completed}/{item.count} done</span>
                    <span className="font-semibold text-slate-700">{item.count} events</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                  <div
                    className="bg-slate-700 h-2 group-hover:bg-slate-900 transition-colors"
                    style={{ width: `${Math.max(10, item.percentage * 2)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Programme Schedule */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Upcoming Programme Schedule
                </h3>
              </div>
              <button
                onClick={() => navigateToTabWithFilter('schedule')}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                Full Timetable <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {upcomingEvents.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No upcoming programmes scheduled.
                </div>
              ) : (
                upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => navigateToTabWithFilter('schedule')}
                    className="p-3 border border-slate-100 rounded-md hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-slate-500 font-semibold">
                          {event.code}
                        </span>
                        <span className="text-xs font-semibold text-slate-900">
                          {event.name}
                        </span>
                        <Badge variant={event.status} size="sm">
                          {event.status}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                        <span>{event.venue} ({event.stage})</span>
                        <span>•</span>
                        <span className="font-mono">{event.date}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-medium text-xs text-slate-800">
                        {event.startTime} - {event.endTime}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {event.type}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Automated venue conflict monitoring active.</span>
            <span className="font-medium text-slate-700">Next event: {upcomingEvents[0]?.startTime || 'None'}</span>
          </div>
        </div>
      </div>

      {/* Row 3: Recent Score Entries & Administrative Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Score Entries */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">
              Recent Score Entries
            </h3>
            <button
              onClick={() => navigateToTabWithFilter('scores')}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              All Scores <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {recentScores.map((score) => {
              const prog = programmes.find((p) => p.id === score.programmeId);
              const team = teams.find((t) => t.id === score.teamId);
              const participant = participants.find((pt) => pt.id === score.participantId);

              return (
                <div
                  key={score.id}
                  onClick={() => navigateToTabWithFilter('scores')}
                  className="py-2.5 flex items-center justify-between hover:bg-slate-50/50 cursor-pointer px-1 rounded transition-colors"
                >
                  <div className="min-w-0 pr-3">
                    <div className="text-xs font-semibold text-slate-900 truncate">
                      {prog?.name || score.programmeId}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                      Entry by {score.judgeName} • {participant?.name || team?.name}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-mono font-bold text-xs text-slate-800">
                      {score.totalScore} pts
                    </span>
                    <Badge variant={score.status} size="sm">
                      {score.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Administrative Activity Log */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">
              Recent Administrative Activities
            </h3>
            <button
              onClick={() => navigateToTabWithFilter('users')}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              Audit Trail <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 space-y-2.5">
            {activityLogs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="text-xs p-2.5 rounded border border-slate-100 bg-slate-50/40"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-medium text-slate-700">
                    {log.userName} ({log.userRole.replace('_', ' ')})
                  </span>
                  <span className="font-mono">{log.timestamp.slice(5, 16)}</span>
                </div>
                <p className="mt-1 text-slate-800 leading-snug">{log.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
