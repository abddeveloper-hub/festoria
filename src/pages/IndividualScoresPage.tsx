import React, { useState, useMemo, useEffect } from 'react';
import { useFest } from '../context/FestContext';
import {
  Participant,
  Programme,
  Team,
  ScoreSubmission,
  ApprovedResult,
} from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { SummaryCard } from '../components/common/SummaryCard';
import {
  Trophy,
  Award,
  Search,
  Filter,
  Download,
  Printer,
  Eye,
  User,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpDown,
  ChevronRight,
  FileSpreadsheet,
  CalendarCheck,
  CheckSquare,
  X,
  RotateCcw,
} from 'lucide-react';

interface ParticipantProgrammeRecord {
  programme: Programme;
  scoreSubmission?: ScoreSubmission;
  result?: ApprovedResult;
  marksObtained: number;
  maxMarks: number;
  rank?: number;
  pointsAwarded: number;
  status: 'published' | 'approved' | 'submitted' | 'pending' | 'registered';
  judgeName?: string;
}

interface IndividualStanding {
  rank: number;
  participant: Participant;
  team?: Team;
  category: string;
  totalPoints: number;
  totalMarks: number;
  firstPlaceCount: number;
  secondPlaceCount: number;
  thirdPlaceCount: number;
  eventsParticipatedCount: number;
  eventsScoredCount: number;
  records: ParticipantProgrammeRecord[];
}

const getProgMaxMarks = (p?: Programme): number => {
  if (!p) return 100;
  if (p.criteria && p.criteria.length > 0) {
    return p.criteria.reduce((sum, c) => sum + (c.maxMarks || 0), 0);
  }
  return 100;
};

export const IndividualScoresPage: React.FC = () => {
  const {
    participants,
    programmes,
    scores,
    results,
    teams,
    judges,
    settings,
    activeFestId,
    addToast,
    dashboardFilters,
    setDashboardFilters,
  } = useFest();

  // Primary Tabs
  const [activeTab, setActiveTab] = useState<'standings' | 'programmes' | 'submissions'>('standings');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');
  const [onlyScored, setOnlyScored] = useState(false);
  const [sortBy, setSortBy] = useState<'points' | 'marks' | 'chest' | 'name'>('points');

  // Programme View Selection
  const [selectedProgrammeId, setSelectedProgrammeId] = useState<string>('');

  // Participant Detail Modal
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);

  // Criteria Details Modal for a Score Submission
  const [viewingScore, setViewingScore] = useState<ScoreSubmission | null>(null);

  // Filter individual programmes only
  const individualProgrammes = useMemo(() => {
    return programmes.filter((p) => {
      const isTeam = p.type === 'team' || p.type === 'group' || p.programmeType === 'team';
      return !isTeam;
    });
  }, [programmes]);

  // Set default programme for programme view and support navigation filters
  useEffect(() => {
    if (dashboardFilters?.programmeId && dashboardFilters.programmeId !== 'all') {
      setSelectedProgrammeId(dashboardFilters.programmeId);
      setActiveTab('programmes');
      setDashboardFilters((prev) => ({ ...prev, programmeId: 'all' }));
    } else if (!selectedProgrammeId && individualProgrammes.length > 0) {
      setSelectedProgrammeId(individualProgrammes[0].id);
    }
  }, [individualProgrammes, selectedProgrammeId, dashboardFilters?.programmeId, setDashboardFilters]);

  // Extract all categories present
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    participants.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    programmes.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [participants, programmes]);

  // Maps for rapid O(1) lookups
  const teamsMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const programmesMap = useMemo(() => new Map(programmes.map((p) => [p.id, p])), [programmes]);

  // Build Comprehensive Individual Standings
  const individualStandings = useMemo(() => {
    // 1. Group scores and results by participant
    const scoresByParticipant = new Map<string, ScoreSubmission[]>();
    scores.forEach((s) => {
      if (s.participantId) {
        const list = scoresByParticipant.get(s.participantId) || [];
        list.push(s);
        scoresByParticipant.set(s.participantId, list);
      }
    });

    const resultsByParticipant = new Map<string, ApprovedResult[]>();
    results.forEach((r) => {
      if (r.participantId && r.published) {
        const list = resultsByParticipant.get(r.participantId) || [];
        list.push(r);
        resultsByParticipant.set(r.participantId, list);
      }
    });

    // 2. Build standings for each participant
    const list: IndividualStanding[] = participants.map((p) => {
      const pScores = scoresByParticipant.get(p.id) || [];
      const pResults = resultsByParticipant.get(p.id) || [];

      // Collect all programme IDs associated with this participant
      const progIds = new Set<string>();
      (p.registeredProgrammes || []).forEach((id) => progIds.add(id));
      pScores.forEach((s) => progIds.add(s.programmeId));
      pResults.forEach((r) => progIds.add(r.programmeId));

      const records: ParticipantProgrammeRecord[] = [];
      let totalMarks = 0;
      let totalPoints = 0;
      let firsts = 0;
      let seconds = 0;
      let thirds = 0;
      let scoredEvents = 0;

      progIds.forEach((pId) => {
        const prog = programmesMap.get(pId);
        if (!prog) return;

        // Skip team programmes for individual standings
        const isTeam = prog.type === 'team' || prog.type === 'group' || prog.programmeType === 'team';
        if (isTeam) return;

        // Find score & result for this specific programme
        const s = pScores.find((sc) => sc.programmeId === pId);
        const r = pResults.find((res) => res.programmeId === pId);

        let marks = 0;
        let points = 0;
        let rankNum: number | undefined = undefined;
        let status: ParticipantProgrammeRecord['status'] = 'registered';

        if (r) {
          marks = r.finalScore || 0;
          points = r.pointsAwarded || 0;
          rankNum = r.rank;
          status = 'published';
          if (r.rank === 1) firsts++;
          else if (r.rank === 2) seconds++;
          else if (r.rank === 3) thirds++;
        } else if (s) {
          marks = s.totalScore || 0;
          status = s.status === 'approved' ? 'approved' : s.status === 'reviewed' ? 'submitted' : s.status as any;
        }

        if (s || r) {
          scoredEvents++;
        }

        totalMarks += marks;
        totalPoints += points;

        records.push({
          programme: prog,
          scoreSubmission: s,
          result: r,
          marksObtained: marks,
          maxMarks: getProgMaxMarks(prog),
          rank: rankNum,
          pointsAwarded: points,
          status,
          judgeName: s?.judgeName,
        });
      });

      return {
        rank: 0, // Assigned after sorting
        participant: p,
        team: teamsMap.get(p.teamId),
        category: p.category || 'General',
        totalPoints,
        totalMarks,
        firstPlaceCount: firsts,
        secondPlaceCount: seconds,
        thirdPlaceCount: thirds,
        eventsParticipatedCount: records.length,
        eventsScoredCount: scoredEvents,
        records: records.sort((a, b) => (b.pointsAwarded - a.pointsAwarded) || (b.marksObtained - a.marksObtained)),
      };
    });

    // 3. Sort Standings (Official Olympic/Fest tie-breaker: Points > 1st > 2nd > 3rd > Total Marks > Chest #)
    list.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.firstPlaceCount !== a.firstPlaceCount) return b.firstPlaceCount - a.firstPlaceCount;
      if (b.secondPlaceCount !== a.secondPlaceCount) return b.secondPlaceCount - a.secondPlaceCount;
      if (b.thirdPlaceCount !== a.thirdPlaceCount) return b.thirdPlaceCount - a.thirdPlaceCount;
      if (b.totalMarks !== a.totalMarks) return b.totalMarks - a.totalMarks;
      return (a.participant.chestNumber || '').localeCompare(b.participant.chestNumber || '', undefined, { numeric: true });
    });

    // 4. Assign Ranks
    let currentRank = 1;
    list.forEach((item, index) => {
      if (index > 0) {
        const prev = list[index - 1];
        const isTie =
          item.totalPoints === prev.totalPoints &&
          item.firstPlaceCount === prev.firstPlaceCount &&
          item.secondPlaceCount === prev.secondPlaceCount &&
          item.thirdPlaceCount === prev.thirdPlaceCount &&
          item.totalMarks === prev.totalMarks;
        if (!isTie) {
          currentRank = index + 1;
        }
      }
      item.rank = currentRank;
    });

    return list;
  }, [participants, scores, results, programmesMap, teamsMap]);

  // Filtered Standings
  const filteredStandings = useMemo(() => {
    let result = individualStandings;

    // Filter by Category
    if (selectedCategory !== 'all') {
      const catLower = selectedCategory.toLowerCase();
      result = result.filter((item) => (item.category || '').toLowerCase() === catLower);
    }

    // Filter by Team
    if (selectedTeamId !== 'all') {
      result = result.filter((item) => item.participant.teamId === selectedTeamId);
    }

    // Filter by Scored Only
    if (onlyScored) {
      result = result.filter((item) => item.eventsScoredCount > 0 || item.totalPoints > 0);
    }

    // Search Query (Chest, Name, Team, Category)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.participant.name.toLowerCase().includes(q) ||
          (item.participant.chestNumber && item.participant.chestNumber.toLowerCase().includes(q)) ||
          (item.team?.name && item.team.name.toLowerCase().includes(q)) ||
          (item.team?.code && item.team.code.toLowerCase().includes(q)) ||
          item.category.toLowerCase().includes(q)
      );
    }

    // User-selected sort
    if (sortBy === 'marks') {
      return [...result].sort((a, b) => b.totalMarks - a.totalMarks || b.totalPoints - a.totalPoints);
    }
    if (sortBy === 'chest') {
      return [...result].sort((a, b) =>
        (a.participant.chestNumber || '').localeCompare(b.participant.chestNumber || '', undefined, { numeric: true })
      );
    }
    if (sortBy === 'name') {
      return [...result].sort((a, b) => a.participant.name.localeCompare(b.participant.name));
    }

    return result;
  }, [individualStandings, selectedCategory, selectedTeamId, onlyScored, searchQuery, sortBy]);

  // Key Metrics
  const metrics = useMemo(() => {
    const totalScored = individualStandings.filter((s) => s.eventsScoredCount > 0).length;
    const totalPointsAwarded = individualStandings.reduce((sum, s) => sum + s.totalPoints, 0);
    const topPerformer = individualStandings[0]?.totalPoints > 0 ? individualStandings[0] : null;

    return {
      totalCandidates: participants.length,
      totalScored,
      totalPointsAwarded,
      individualEventsCount: individualProgrammes.length,
      topPerformer,
    };
  }, [individualStandings, participants, individualProgrammes]);

  // Selected participant for modal view
  const modalParticipant = useMemo(() => {
    if (!selectedParticipantId) return null;
    return individualStandings.find((s) => s.participant.id === selectedParticipantId) || null;
  }, [selectedParticipantId, individualStandings]);

  // Programme Mark Sheet View Data
  const activeProgramme = useMemo(
    () => programmes.find((p) => p.id === selectedProgrammeId),
    [programmes, selectedProgrammeId]
  );

  const activeProgrammeParticipants = useMemo(() => {
    if (!activeProgramme) return [];

    // Find all participants associated with this programme
    const enrolledIds = new Set<string>();
    (activeProgramme.registeredParticipantIds || []).forEach((id) => enrolledIds.add(id));
    participants.forEach((p) => {
      if (p.registeredProgrammes?.includes(activeProgramme.id)) enrolledIds.add(p.id);
    });

    const progScores = scores.filter((s) => s.programmeId === activeProgramme.id && s.participantId);
    const progResults = results.filter((r) => r.programmeId === activeProgramme.id && r.participantId);

    progScores.forEach((s) => {
      if (s.participantId) enrolledIds.add(s.participantId);
    });
    progResults.forEach((r) => {
      if (r.participantId) enrolledIds.add(r.participantId);
    });

    const list = participants
      .filter((p) => enrolledIds.has(p.id))
      .map((p) => {
        const s = progScores.find((sc) => sc.participantId === p.id);
        const r = progResults.find((res) => res.participantId === p.id);
        return {
          participant: p,
          team: teamsMap.get(p.teamId),
          score: s,
          result: r,
          marks: r?.finalScore ?? s?.totalScore ?? null,
          rank: r?.rank ?? null,
          points: r?.pointsAwarded ?? 0,
          status: r?.published ? 'published' : s?.status ?? 'unscored',
          judgeName: s?.judgeName,
        };
      });

    // Sort: Published rank first, then marks DESC, then chest #
    return list.sort((a, b) => {
      if (a.rank !== null && b.rank !== null) return a.rank - b.rank;
      if (a.rank !== null) return -1;
      if (b.rank !== null) return 1;
      if (a.marks !== null && b.marks !== null) return b.marks - a.marks;
      if (a.marks !== null) return -1;
      if (b.marks !== null) return 1;
      return (a.participant.chestNumber || '').localeCompare(b.participant.chestNumber || '', undefined, { numeric: true });
    });
  }, [activeProgramme, participants, scores, results, teamsMap]);

  // Master Raw Submissions List (Individual only)
  const individualRawScores = useMemo(() => {
    return scores
      .filter((s) => s.participantId)
      .map((s) => {
        const p = participants.find((part) => part.id === s.participantId);
        const prog = programmesMap.get(s.programmeId);
        const tm = p ? teamsMap.get(p.teamId) : undefined;
        return {
          score: s,
          participant: p,
          programme: prog,
          team: tm,
        };
      })
      .sort((a, b) => new Date(b.score.submittedAt).getTime() - new Date(a.score.submittedAt).getTime());
  }, [scores, participants, programmesMap, teamsMap]);

  // Export to CSV Function
  const handleExportCSV = () => {
    try {
      const headers = [
        'Rank',
        'Chest Number',
        'Participant Name',
        'Category',
        'Team Code',
        'Team Name',
        'Institution',
        'Gold (1st)',
        'Silver (2nd)',
        'Bronze (3rd)',
        'Total Marks',
        'Total Points',
      ];

      const rows = filteredStandings.map((s) => [
        s.totalPoints > 0 ? s.rank : '-',
        `"${s.participant.chestNumber || ''}"`,
        `"${s.participant.name.replace(/"/g, '""')}"`,
        `"${s.category}"`,
        `"${s.team?.code || ''}"`,
        `"${(s.team?.name || '').replace(/"/g, '""')}"`,
        `"${(s.team?.institution || '').replace(/"/g, '""')}"`,
        s.firstPlaceCount,
        s.secondPlaceCount,
        s.thirdPlaceCount,
        s.totalMarks,
        s.totalPoints,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `individual_scores_${activeFestId || 'fest'}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast('success', 'Export Successful', 'Individual scores CSV downloaded successfully.');
    } catch {
      addToast('error', 'Export Failed', 'Unable to generate CSV export.');
    }
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Trophy className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Individual Scores & Standings
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Detailed evaluation of all individual participants, chest mark sheets, event results, and champion leaderboards.
              </p>
            </div>
          </div>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition-colors"
            title="Download CSV of individual scores"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition-colors"
            title="Print or Save as PDF"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print View</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Candidates"
          value={metrics.totalCandidates}
          subtitle="Enrolled in fest"
          icon={Users}
          badgeText="Active"
          badgeVariant="neutral"
        />
        <SummaryCard
          title="Evaluated Candidates"
          value={metrics.totalScored}
          subtitle={`With marks or results (${Math.round((metrics.totalScored / (metrics.totalCandidates || 1)) * 100)}%)`}
          icon={CheckSquare}
          badgeText={metrics.totalScored > 0 ? `${metrics.totalScored} Scored` : 'Pending'}
          badgeVariant={metrics.totalScored > 0 ? 'success' : 'warning'}
        />
        <SummaryCard
          title="Points Awarded"
          value={`${metrics.totalPointsAwarded} pts`}
          subtitle={`Across ${metrics.individualEventsCount} individual events`}
          icon={Award}
          badgeText="Official"
          badgeVariant="info"
        />
        <SummaryCard
          title="Leading Champion"
          value={
            metrics.topPerformer
              ? `#${metrics.topPerformer.participant.chestNumber || ''} ${metrics.topPerformer.participant.name}`
              : 'None yet'
          }
          subtitle={
            metrics.topPerformer
              ? `${metrics.topPerformer.totalPoints} pts • ${metrics.topPerformer.team?.name || 'Independent'}`
              : 'Awaiting published results'
          }
          icon={Trophy}
          badgeText={metrics.topPerformer ? '🥇 #1 Rank' : 'Unranked'}
          badgeVariant={metrics.topPerformer ? 'success' : 'neutral'}
        />
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-lg px-2 pt-2 gap-2 shadow-2xs">
        <button
          onClick={() => setActiveTab('standings')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-md transition-all border-b-2 ${
            activeTab === 'standings'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Individual Standings / Leaderboard</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-600">
            {filteredStandings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('programmes')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-md transition-all border-b-2 ${
            activeTab === 'programmes'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Programme Mark Sheets</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-600">
            {individualProgrammes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('submissions')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-md transition-all border-b-2 ${
            activeTab === 'submissions'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Submissions Log</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-600">
            {individualRawScores.length}
          </span>
        </button>
      </div>

      {/* TAB 1: INDIVIDUAL STANDINGS / LEADERBOARD */}
      {activeTab === 'standings' && (
        <div className="space-y-4">
          {/* Controls & Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex-1 relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by participant name, chest number, team..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 py-1.5 px-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="all">All Categories</option>
                  {allCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Team Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Team:</span>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 py-1.5 px-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="all">All Teams</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.code ? `[${t.code}] ` : ''}{t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 py-1.5 px-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="points">Points (Highest First)</option>
                  <option value="marks">Total Marks (Highest First)</option>
                  <option value="chest">Chest Number</option>
                  <option value="name">Candidate Name (A-Z)</option>
                </select>
              </div>

              {/* Only Scored Toggle */}
              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer ml-1 select-none">
                <input
                  type="checkbox"
                  checked={onlyScored}
                  onChange={(e) => setOnlyScored(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                />
                <span>Scored only</span>
              </label>
            </div>
          </div>

          {/* Standings Table Card */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4 w-16 text-center">Rank</th>
                    <th className="py-3 px-4">Chest / Candidate</th>
                    <th className="py-3 px-4">Team / House</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3 text-center">Events</th>
                    <th className="py-3 px-3 text-center">🥇 1st</th>
                    <th className="py-3 px-3 text-center">🥈 2nd</th>
                    <th className="py-3 px-3 text-center">🥉 3rd</th>
                    <th className="py-3 px-4 text-center">Total Marks</th>
                    <th className="py-3 px-4 text-right">Official Points</th>
                    <th className="py-3 px-4 text-center w-28">Scorecard</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStandings.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Users className="w-8 h-8 text-slate-300" />
                          <p className="font-medium text-slate-600">No candidates match the selected filters.</p>
                          <p className="text-slate-400 text-xs">Try clearing your search query or category filters.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredStandings.map((item) => {
                      const hasPoints = item.totalPoints > 0;
                      return (
                        <tr
                          key={item.participant.id}
                          className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                          onClick={() => setSelectedParticipantId(item.participant.id)}
                        >
                          {/* Rank */}
                          <td className="py-3 px-4 text-center font-mono">
                            {hasPoints ? (
                              <div className="inline-flex items-center justify-center gap-1 font-bold">
                                {item.rank === 1 && <span className="text-base">🥇</span>}
                                {item.rank === 2 && <span className="text-base">🥈</span>}
                                {item.rank === 3 && <span className="text-base">🥉</span>}
                                <span className={item.rank <= 3 ? 'text-indigo-950 font-extrabold' : 'text-slate-700'}>
                                  #{item.rank}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>

                          {/* Candidate info */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              {item.participant.chestNumber ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-xs bg-indigo-50 text-indigo-700 border border-indigo-100">
                                  #{item.participant.chestNumber}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-400">
                                  No Chest
                                </span>
                              )}
                              <div>
                                <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                  {item.participant.name}
                                </span>
                                {item.participant.email && (
                                  <div className="text-[10px] text-slate-400">{item.participant.email}</div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Team */}
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-800">
                              {item.team?.name || 'Independent'}
                            </div>
                            {item.team?.institution && (
                              <div className="text-[10px] text-slate-400 line-clamp-1">
                                {item.team.institution}
                              </div>
                            )}
                          </td>

                          {/* Category */}
                          <td className="py-3 px-3">
                            <span className="inline-block px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-medium text-[11px]">
                              {item.category}
                            </span>
                          </td>

                          {/* Events Count */}
                          <td className="py-3 px-3 text-center">
                            <span className="font-mono text-slate-700">
                              {item.eventsScoredCount} / {item.eventsParticipatedCount}
                            </span>
                          </td>

                          {/* Medals */}
                          <td className="py-3 px-3 text-center font-mono font-bold text-amber-600">
                            {item.firstPlaceCount > 0 ? item.firstPlaceCount : <span className="text-slate-200 font-normal">0</span>}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-500">
                            {item.secondPlaceCount > 0 ? item.secondPlaceCount : <span className="text-slate-200 font-normal">0</span>}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-amber-800">
                            {item.thirdPlaceCount > 0 ? item.thirdPlaceCount : <span className="text-slate-200 font-normal">0</span>}
                          </td>

                          {/* Total Marks */}
                          <td className="py-3 px-4 text-center font-mono text-slate-800 font-semibold">
                            {item.totalMarks > 0 ? item.totalMarks : <span className="text-slate-300 font-normal">0</span>}
                          </td>

                          {/* Official Points */}
                          <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">
                            {hasPoints ? (
                              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md text-xs">
                                {item.totalPoints} pts
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs font-normal">0 pts</span>
                            )}
                          </td>

                          {/* Action */}
                          <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedParticipantId(item.participant.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 font-medium transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer info */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div>
                Showing <strong>{filteredStandings.length}</strong> individual participants.
                Tie-breaker order: <strong>Official Points &gt; 1st Places &gt; 2nd Places &gt; 3rd Places &gt; Total Marks</strong>.
              </div>
              <div className="text-slate-400">
                Click any row to open the complete candidate scorecard.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROGRAMME-WISE MARK SHEETS */}
      {activeTab === 'programmes' && (
        <div className="space-y-4">
          {/* Programme Selector Bar */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4 text-indigo-600" />
                <span>Select Individual Programme:</span>
              </label>
              <span className="text-xs text-slate-500">
                {individualProgrammes.length} Individual competitions registered
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                value={selectedProgrammeId}
                onChange={(e) => setSelectedProgrammeId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-900 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {individualProgrammes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code ? `[${p.code}] ` : ''}{p.name} ({p.category || 'General'})
                  </option>
                ))}
              </select>

              {activeProgramme && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant={activeProgramme.status === 'completed' ? 'success' : 'info'}>
                    Status: {activeProgramme.status.toUpperCase()}
                  </Badge>
                  <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 font-medium">
                    Category: {activeProgramme.category || 'General'}
                  </span>
                  <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 font-medium">
                    Max Marks: {getProgMaxMarks(activeProgramme)}
                  </span>
                  <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 font-medium">
                    {activeProgramme.stage ? `Stage: ${activeProgramme.stage}` : 'Off-Stage'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Programme Competitors & Mark Sheet */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {activeProgramme ? activeProgramme.name : 'Programme'} — Candidate Evaluation Sheet
                </h3>
                <p className="text-xs text-slate-500">
                  Showing all individual competitors registered or scored in this event.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                {activeProgrammeParticipants.length} Competitors
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4 w-16 text-center">Result Rank</th>
                    <th className="py-3 px-4">Chest / Competitor</th>
                    <th className="py-3 px-4">Team</th>
                    <th className="py-3 px-3">Adjudicator</th>
                    <th className="py-3 px-3 text-center">Marks / Score</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Points Awarded</th>
                    <th className="py-3 px-4 text-center">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeProgrammeParticipants.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No individual competitors found registered in this programme.
                      </td>
                    </tr>
                  ) : (
                    activeProgrammeParticipants.map((row) => (
                      <tr key={row.participant.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Rank */}
                        <td className="py-3 px-4 text-center font-mono">
                          {row.rank ? (
                            <span className="inline-flex items-center gap-1 font-bold text-slate-900">
                              {row.rank === 1 && '🥇'}
                              {row.rank === 2 && '🥈'}
                              {row.rank === 3 && '🥉'}
                              #{row.rank}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* Competitor */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {row.participant.chestNumber ? (
                              <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-indigo-50 text-indigo-700 border border-indigo-100">
                                #{row.participant.chestNumber}
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-400">
                                No Chest
                              </span>
                            )}
                            <span className="font-semibold text-slate-900">
                              {row.participant.name}
                            </span>
                          </div>
                        </td>

                        {/* Team */}
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-700">
                            {row.team?.name || 'Independent'}
                          </span>
                        </td>

                        {/* Judge */}
                        <td className="py-3 px-3 text-slate-600">
                          {row.judgeName || <span className="text-slate-400 italic">Not recorded</span>}
                        </td>

                        {/* Marks */}
                        <td className="py-3 px-3 text-center font-mono font-bold">
                          {row.marks !== null ? (
                            <span className="text-indigo-900 bg-indigo-50/80 px-2 py-0.5 rounded border border-indigo-100">
                              {row.marks} / {getProgMaxMarks(activeProgramme)}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-normal">Pending</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 text-center">
                          <Badge
                            variant={
                              row.status === 'published'
                                ? 'success'
                                : row.status === 'approved'
                                ? 'info'
                                : row.status === 'submitted'
                                ? 'warning'
                                : 'neutral'
                            }
                          >
                            {row.status.toUpperCase()}
                          </Badge>
                        </td>

                        {/* Points */}
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          {row.points > 0 ? (
                            <span className="text-emerald-700">+{row.points} pts</span>
                          ) : (
                            <span className="text-slate-300">0 pts</span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4 text-center">
                          {row.score ? (
                            <button
                              onClick={() => setViewingScore(row.score!)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                              <span>Criteria</span>
                            </button>
                          ) : (
                            <span className="text-slate-300 text-[11px]">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MASTER SUBMISSIONS AUDIT LOG */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Individual Score Submissions Ledger
              </h3>
              <p className="text-xs text-slate-500">
                Chronological list of all mark evaluations submitted by judges for individual candidates.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              Total {individualRawScores.length} Submissions
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Date / Time</th>
                    <th className="py-3 px-4">Candidate</th>
                    <th className="py-3 px-4">Programme</th>
                    <th className="py-3 px-3">Adjudicator</th>
                    <th className="py-3 px-3 text-center">Total Score</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Criteria Breakdown</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {individualRawScores.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No individual scores have been submitted yet.
                      </td>
                    </tr>
                  ) : (
                    individualRawScores.map(({ score, participant, programme, team }) => (
                      <tr key={score.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {new Date(score.submittedAt).toLocaleString()}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {participant?.chestNumber ? (
                              <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-100">
                                #{participant.chestNumber}
                              </span>
                            ) : null}
                            <span className="font-semibold text-slate-900">
                              {participant?.name || score.participantId}
                            </span>
                          </div>
                          {team && <div className="text-[10px] text-slate-400">{team.name}</div>}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">
                            {programme?.name || score.programmeId}
                          </div>
                          {programme?.code && (
                            <div className="font-mono text-[10px] text-slate-400">{programme.code}</div>
                          )}
                        </td>

                        <td className="py-3 px-3 text-slate-700">
                          {score.judgeName || 'Official Judge'}
                        </td>

                        <td className="py-3 px-3 text-center font-mono font-bold text-indigo-900">
                          {score.totalScore}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <Badge
                            variant={
                              score.status === 'approved'
                                ? 'success'
                                : score.status === 'reviewed'
                                ? 'info'
                                : score.status === 'submitted'
                                ? 'warning'
                                : 'neutral'
                            }
                          >
                            {score.status.toUpperCase()}
                          </Badge>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setViewingScore(score)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 font-medium text-xs transition-colors"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            <span>View Criteria</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: PARTICIPANT COMPLETE SCORECARD */}
      {modalParticipant && (
        <Modal
          isOpen={!!selectedParticipantId}
          onClose={() => setSelectedParticipantId(null)}
          title="Candidate Individual Scorecard & Dossier"
          maxWidth="2xl"
        >
          <div className="space-y-5">
            {/* Candidate Header Card */}
            <div className="p-4 bg-linear-to-r from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-lg shadow-sm">
                  {modalParticipant.participant.chestNumber ? `#${modalParticipant.participant.chestNumber}` : <User className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {modalParticipant.participant.name}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {modalParticipant.team?.name || 'Independent'} • Category: <strong>{modalParticipant.category}</strong>
                  </p>
                  {modalParticipant.participant.institution && (
                    <p className="text-[11px] text-slate-400">{modalParticipant.participant.institution}</p>
                  )}
                </div>
              </div>

              {/* Quick Standings Box */}
              <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-center px-2">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Rank</div>
                  <div className="text-base font-extrabold font-mono text-indigo-700">
                    {modalParticipant.totalPoints > 0 ? `#${modalParticipant.rank}` : '-'}
                  </div>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div className="text-center px-2">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Total Points</div>
                  <div className="text-base font-extrabold font-mono text-emerald-600">
                    {modalParticipant.totalPoints} pts
                  </div>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div className="text-center px-2">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Total Marks</div>
                  <div className="text-base font-extrabold font-mono text-slate-900">
                    {modalParticipant.totalMarks}
                  </div>
                </div>
              </div>
            </div>

            {/* Medals Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-center">
                <span className="text-xl">🥇</span>
                <div className="text-xs font-bold text-amber-900 mt-1">First Places</div>
                <div className="text-lg font-mono font-extrabold text-amber-700">{modalParticipant.firstPlaceCount}</div>
              </div>
              <div className="p-3 bg-slate-100/70 border border-slate-200 rounded-lg text-center">
                <span className="text-xl">🥈</span>
                <div className="text-xs font-bold text-slate-800 mt-1">Second Places</div>
                <div className="text-lg font-mono font-extrabold text-slate-600">{modalParticipant.secondPlaceCount}</div>
              </div>
              <div className="p-3 bg-amber-100/50 border border-amber-300/50 rounded-lg text-center">
                <span className="text-xl">🥉</span>
                <div className="text-xs font-bold text-amber-950 mt-1">Third Places</div>
                <div className="text-lg font-mono font-extrabold text-amber-900">{modalParticipant.thirdPlaceCount}</div>
              </div>
            </div>

            {/* Programmes Participated List */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Evaluated Events & Scores ({modalParticipant.records.length})
              </h4>

              {modalParticipant.records.length === 0 ? (
                <div className="py-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-lg">
                  No individual programmes recorded for this candidate.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-semibold">
                        <th className="py-2.5 px-3">Programme</th>
                        <th className="py-2.5 px-2">Judge</th>
                        <th className="py-2.5 px-2 text-center">Marks</th>
                        <th className="py-2.5 px-2 text-center">Rank</th>
                        <th className="py-2.5 px-2 text-center">Points</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {modalParticipant.records.map((rec) => (
                        <tr key={rec.programme.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900">{rec.programme.name}</div>
                            <div className="font-mono text-[10px] text-slate-400">
                              {rec.programme.code || rec.programme.id} • {rec.programme.category}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-slate-600 text-[11px]">
                            {rec.judgeName || 'Adjudicator'}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-900">
                            {rec.marksObtained > 0 ? `${rec.marksObtained} / ${rec.maxMarks}` : '-'}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono font-bold">
                            {rec.rank ? (
                              <span className="inline-flex items-center gap-0.5">
                                {rec.rank === 1 && '🥇'}
                                {rec.rank === 2 && '🥈'}
                                {rec.rank === 3 && '🥉'}
                                #{rec.rank}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono font-bold text-emerald-700">
                            {rec.pointsAwarded > 0 ? `+${rec.pointsAwarded}` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <Badge
                              variant={
                                rec.status === 'published'
                                  ? 'success'
                                  : rec.status === 'approved'
                                  ? 'info'
                                  : rec.status === 'submitted'
                                  ? 'warning'
                                  : 'neutral'
                              }
                            >
                              {rec.status.toUpperCase()}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedParticipantId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 2: CRITERIA BREAKDOWN MODAL */}
      {viewingScore && (
        <Modal
          isOpen={!!viewingScore}
          onClose={() => setViewingScore(null)}
          title="Judge Evaluation Criteria Details"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Judge / Adjudicator:</span>
                <span className="font-semibold text-slate-800">{viewingScore.judgeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Submission Date:</span>
                <span className="font-mono text-slate-800">
                  {new Date(viewingScore.submittedAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold uppercase text-indigo-700">{viewingScore.status}</span>
              </div>
            </div>

            {/* Criteria Scores Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-semibold">
                    <th className="py-2 px-3">Criterion Name</th>
                    <th className="py-2 px-3 text-right">Marks Obtained</th>
                    <th className="py-2 px-3 text-right">Max Marks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(viewingScore.scores || []).map((c, i) => (
                    <tr key={c.criterionId || i}>
                      <td className="py-2 px-3 font-medium text-slate-800">{c.criterionName}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-indigo-900">
                        {c.marksObtained}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-400">
                        {c.maxMarks}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50/80 font-bold border-t border-slate-200">
                    <td className="py-2.5 px-3 text-slate-900">Total Score</td>
                    <td className="py-2.5 px-3 text-right font-mono text-indigo-900 text-sm">
                      {viewingScore.totalScore}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                      {(viewingScore.scores || []).reduce((sum, c) => sum + (c.maxMarks || 0), 0) || 100}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {viewingScore.notes && (
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-xs">
                <span className="font-bold text-amber-900">Judge Notes:</span>
                <p className="text-amber-800 mt-1">{viewingScore.notes}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingScore(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
