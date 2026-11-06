import React, { useState } from 'react';
import { useFest } from '../../context/FestContext';
import {
  Trophy,
  Award,
  Medal,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';

export const ParticipantResultsPage: React.FC = () => {
  const { activeParticipant, results, programmes, scores, teams } = useFest();
  const [filterMode, setFilterMode] = useState<'my' | 'all'>('my');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedProgrammeId, setExpandedProgrammeId] = useState<string | null>(null);

  // Participant's registered programmes
  const myProgrammeIds = activeParticipant?.registeredProgrammes || [];

  // Filtered results
  const filteredResults = results.filter((res) => {
    const prg = programmes.find((p) => p.id === res.programmeId);
    if (!prg) return false;

    // Filter mode
    if (filterMode === 'my') {
      const isMyParticipant = res.participantId === activeParticipant?.id;
      const isMyTeam = res.teamId === activeParticipant?.teamId;
      const isMyProgramme = myProgrammeIds.includes(res.programmeId);
      if (!isMyParticipant && !isMyTeam && !isMyProgramme) return false;
    }

    // Category filter
    if (selectedCategory !== 'all' && prg.category !== selectedCategory) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = prg.name.toLowerCase().includes(q);
      const matchParticipant = (res.participantName || '').toLowerCase().includes(q);
      const matchTeam = res.teamName.toLowerCase().includes(q);
      if (!matchName && !matchParticipant && !matchTeam) return false;
    }

    return true;
  });

  // Group results by programme
  const resultsByProgramme = filteredResults.reduce<Record<string, typeof results>>((acc, res) => {
    if (!acc[res.programmeId]) {
      acc[res.programmeId] = [];
    }
    acc[res.programmeId].push(res);
    return acc;
  }, {});

  // Summary stats for participant
  const myPodiumFinishes = results.filter(
    (r) =>
      (r.participantId === activeParticipant?.id ||
        (r.teamId === activeParticipant?.teamId && myProgrammeIds.includes(r.programmeId))) &&
      r.rank <= 3
  );

  const myTotalPoints = results
    .filter((r) => r.participantId === activeParticipant?.id)
    .reduce((sum, r) => sum + (r.pointsAwarded || 0), 0);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            1st Place (Gold)
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
            <Medal className="w-3.5 h-3.5 text-slate-500" />
            2nd Place (Silver)
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-orange-50 text-orange-800 border border-orange-200">
            <Medal className="w-3.5 h-3.5 text-orange-600" />
            3rd Place (Bronze)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
            Rank #{rank}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Competition Results & Scorecards
        </h1>
        <p className="text-sm text-slate-500">
          Official declared standings, rank positions, and criteria-level scoring reports.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Podium Placements
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {myPodiumFinishes.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Top 3 podium honors across your registered events
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Points Earned
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-600">
            {myTotalPoints} <span className="text-xs text-slate-500 font-normal">pts</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Contributed directly to your team championship tally
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Assigned Events
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {myProgrammeIds.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Total competitions in your active registration
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* View Toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50">
            <button
              onClick={() => setFilterMode('my')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                filterMode === 'my'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Events & Team
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                filterMode === 'all'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Published Results ({results.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search event, participant or team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Results Content */}
      {Object.keys(resultsByProgramme).length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-slate-500">
          <Trophy className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800">No Published Results Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {filterMode === 'my'
              ? 'Results for your registered competitions have not been declared yet. Check back once judges submit evaluations.'
              : 'No results match the specified criteria or no events have declared standings.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(resultsByProgramme).map(([progId, progResults]) => {
            const prg = programmes.find((p) => p.id === progId);
            if (!prg) return null;
            const isExpanded = expandedProgrammeId === progId;
            const isMyEvent = myProgrammeIds.includes(progId);

            // Sort results by rank
            const sortedResults = [...progResults].sort((a, b) => a.rank - b.rank);

            // Related score submissions for this programme
            const progScores = scores.filter((s) => s.programmeId === progId);

            return (
              <div
                key={progId}
                className={`bg-white border rounded-lg transition-all ${
                  isMyEvent ? 'border-blue-200 shadow-sm' : 'border-slate-200'
                }`}
              >
                {/* Header */}
                <div
                  onClick={() => setExpandedProgrammeId(isExpanded ? null : progId)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/60"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isMyEvent ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900">{prg.name}</span>
                        <span className="text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {prg.code}
                        </span>
                        {isMyEvent && (
                          <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                            Your Event
                          </span>
                        )}
                        <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {prg.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span>Venue: {prg.venue} ({prg.stage})</span>
                        <span>{sortedResults.length} Placed Competitors</span>
                        {prg.publishedAt && (
                          <span className="text-[11px] text-slate-400">
                            Declared: {new Date(prg.publishedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                      {isExpanded ? 'Hide Details' : 'View Scorecard'}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </span>
                  </div>
                </div>

                {/* Expanded Score Table */}
                {isExpanded && (
                  <div className="border-t border-slate-200 p-4 bg-slate-50/50 space-y-4">
                    {/* Standings Table */}
                    <div className="overflow-x-auto bg-white border border-slate-200 rounded-lg">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-2.5">Rank</th>
                            <th className="px-4 py-2.5">Participant / Team</th>
                            <th className="px-4 py-2.5">Team</th>
                            <th className="px-4 py-2.5 text-right">Score</th>
                            <th className="px-4 py-2.5 text-right">Points</th>
                            <th className="px-4 py-2.5">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {sortedResults.map((res) => {
                            const isMe = res.participantId === activeParticipant?.id;
                            const isMyHouse = res.teamId === activeParticipant?.teamId;

                            return (
                              <tr
                                key={res.id}
                                className={
                                  isMe
                                    ? 'bg-blue-50/70 font-semibold text-slate-900'
                                    : isMyHouse
                                    ? 'bg-slate-50/80 text-slate-800'
                                    : 'hover:bg-slate-50/40 text-slate-700'
                                }
                              >
                                <td className="px-4 py-3">
                                  {getRankBadge(res.rank)}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="font-semibold flex items-center gap-1.5">
                                    {res.participantName || res.teamName}
                                    {isMe && (
                                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded">
                                        YOU
                                      </span>
                                    )}
                                  </div>
                                  {res.participantId && (
                                    <div className="text-[10px] text-slate-400 font-mono">
                                      {res.participantId}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-slate-700">{res.teamName}</span>
                                </td>
                                <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                                  {res.finalScore.toFixed(1)}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <span className="font-bold text-blue-600">
                                    +{res.pointsAwarded} pts
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-500">
                                  {res.isTieBroken ? (
                                    <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                      Tie-Broken: {res.tieBreakNotes || 'Decided by Policy'}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-[11px]">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Criteria Details (if judge scores available) */}
                    {progScores.length > 0 && (
                      <div className="bg-white border border-slate-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-800">
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>Evaluation Criteria Weights</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          {prg.criteria.map((c) => (
                            <div key={c.id} className="p-2 bg-slate-50 rounded border border-slate-200">
                              <span className="font-medium text-slate-700 block">{c.name}</span>
                              <span className="text-slate-500 text-[11px]">
                                Max Marks: <strong className="text-slate-800">{c.maxMarks}</strong>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

