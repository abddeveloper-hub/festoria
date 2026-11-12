import React, { useState, useMemo } from 'react';
import { useFest } from '../../context/FestContext';
import { exportToCSV } from '../../services/storage';
import {
  Trophy,
  Award,
  Download,
  Info,
  ChevronDown,
  Filter,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const TeamLeaderboardPage: React.FC = () => {
  const { leaderboard, activeTeamId, settings, results, programmes, categories: festCategories, getCategoryScoreboard } = useFest();
  const [viewTab, setViewTab] = useState<'team' | 'individual'>('team');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedIndivCategory, setSelectedIndivCategory] = useState<string>('Senior');
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);

  // Categories list from custom/built-in categories or programmes
  const categories = useMemo(() => {
    if (festCategories && festCategories.length > 0) {
      return festCategories.map((c) => c.name);
    }
    const set = new Set<string>();
    programmes.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [festCategories, programmes]);

  // If a category filter is selected, recalculate filtered points
  const displayedLeaderboard = useMemo(() => {
    if (selectedCategory === 'all') {
      return leaderboard;
    }

    // Filter results by category
    const categoryProgrammes = new Set(
      programmes.filter((p) => p.category === selectedCategory).map((p) => p.id)
    );

    const teamPointsMap = new Map<string, { points: number; first: number; second: number; third: number }>();
    leaderboard.forEach((entry) => {
      teamPointsMap.set(entry.team.id, { points: 0, first: 0, second: 0, third: 0 });
    });

    results.forEach((r) => {
      if (categoryProgrammes.has(r.programmeId)) {
        const current = teamPointsMap.get(r.teamId);
        if (current) {
          current.points += r.pointsAwarded;
          if (r.rank === 1) current.first += 1;
          else if (r.rank === 2) current.second += 1;
          else if (r.rank === 3) current.third += 1;
        }
      }
    });

    const filtered = leaderboard.map((entry) => {
      const stats = teamPointsMap.get(entry.team.id) || { points: 0, first: 0, second: 0, third: 0 };
      return {
        ...entry,
        totalPoints: stats.points,
        firstPlaceCount: stats.first,
        secondPlaceCount: stats.second,
        thirdPlaceCount: stats.third,
      };
    });

    // Re-sort
    filtered.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.firstPlaceCount !== a.firstPlaceCount) return b.firstPlaceCount - a.firstPlaceCount;
      return b.secondPlaceCount - a.secondPlaceCount;
    });

    return filtered.map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
    }));
  }, [leaderboard, selectedCategory, programmes, results]);

  const handleExportCSV = () => {
    const rows = displayedLeaderboard.map((entry) => ({
      Rank: entry.rank,
      Team: entry.team.name,
      College: entry.team.institution,
      'Total Points': entry.totalPoints,
      'Gold Medals (1st)': entry.firstPlaceCount,
      'Silver Medals (2nd)': entry.secondPlaceCount,
      'Bronze Medals (3rd)': entry.thirdPlaceCount,
      'Events Scored': entry.totalResults,
    }));
    exportToCSV(`Fest_Leaderboard_${selectedCategory}`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Championship Leaderboards & Scoreboards
          </h1>
          <p className="text-sm text-slate-500">
            Real-time standings for {settings.festName} with official medal tallies & scoring rules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Main Tab Toggle: Team vs Individual */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-semibold mr-2">
            <button
              onClick={() => setViewTab('team')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                viewTab === 'team'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Team Standings
            </button>
            <button
              onClick={() => setViewTab('individual')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                viewTab === 'individual'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Individual Scoreboards
            </button>
          </div>

          <button
            onClick={() => setShowRulesModal(true)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <Info size={14} className="text-slate-500" />
            <span>Rules</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {viewTab === 'team' ? (
        <>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="font-semibold text-slate-500 mr-1 flex items-center gap-1">
          <Filter size={13} />
          Filter:
        </span>
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            selectedCategory === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Overall Championship
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Standings Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4 w-16 text-center">Rank</th>
                <th className="py-3 px-4">Team</th>
                <th className="py-3 px-4 hidden md:table-cell">Institution</th>
                <th className="py-3 px-4 text-center">🥇 1st</th>
                <th className="py-3 px-4 text-center">🥈 2nd</th>
                <th className="py-3 px-4 text-center">🥉 3rd</th>
                <th className="py-3 px-4 text-center hidden sm:table-cell">Events</th>
                <th className="py-3 px-4 text-right pr-6">Total Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedLeaderboard.map((entry) => {
                const isCurrentTeam = entry.team.id === activeTeamId;
                return (
                  <tr
                    key={entry.team.id}
                    className={`transition-colors ${
                      isCurrentTeam
                        ? 'bg-blue-50/40 font-semibold border-l-4 border-l-blue-600'
                        : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                          entry.rank === 1
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : entry.rank === 2
                            ? 'bg-slate-200 text-slate-900'
                            : entry.rank === 3
                            ? 'bg-amber-50 text-amber-900 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {entry.rank}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0"
                          style={{ backgroundColor: entry.team.colorHex || '#3b82f6' }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 truncate">
                              {entry.team.name}
                            </span>
                            {isCurrentTeam && (
                              <span className="text-[10px] bg-slate-900 text-white px-1.5 py-0.2 rounded font-bold">
                                YOU
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 md:hidden block truncate">
                            {entry.team.institution}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 hidden md:table-cell text-slate-600 text-xs truncate max-w-xs">
                      {entry.team.institution}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-800 font-semibold">
                      {entry.firstPlaceCount}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-800 font-semibold">
                      {entry.secondPlaceCount}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-800 font-semibold">
                      {entry.thirdPlaceCount}
                    </td>
                    <td className="py-3.5 px-4 text-center hidden sm:table-cell text-slate-500 text-xs">
                      {entry.totalResults}
                    </td>
                    <td className="py-3.5 px-4 text-right pr-6 font-bold text-base text-slate-900">
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {entry.totalPoints} pts
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  ) : (
    /* INDIVIDUAL CATEGORY SCOREBOARDS VIEW */
    <div className="space-y-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="font-semibold text-slate-500 mr-1 flex items-center gap-1">
          <Filter size={13} />
          Category:
        </span>
        {(festCategories && festCategories.length > 0 ? festCategories : [{ id: 'senior', name: 'Senior', isGeneral: false }]).map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedIndivCategory(c.name)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedIndivCategory.toLowerCase() === c.name.toLowerCase()
                ? c.isGeneral
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-900 text-white'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {c.name} {c.isGeneral ? '(General / Any Age)' : ''}
          </button>
        ))}
      </div>

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-center justify-between">
        <span>
          Individual standings for <strong>{selectedIndivCategory} Category</strong>. Team programme points are not distributed to individuals.
        </span>
        <span className="font-mono text-slate-500 text-[11px]">Tie-break: Points &gt; 1st &gt; 2nd &gt; Marks</span>
      </div>

      {(() => {
        const scoreboard = getCategoryScoreboard(selectedIndivCategory);
        if (scoreboard.length === 0) {
          return (
            <div className="p-12 text-center border border-slate-200 rounded-xl bg-white text-slate-400 text-xs">
              No participants registered or scored in {selectedIndivCategory} category yet.
            </div>
          );
        }

        return (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 w-16 text-center">Rank</th>
                    <th className="py-3 px-4">Contestant</th>
                    <th className="py-3 px-4">Team</th>
                    <th className="py-3 px-3 text-center">Category</th>
                    <th className="py-3 px-2 text-center">🥇 1st</th>
                    <th className="py-3 px-2 text-center">🥈 2nd</th>
                    <th className="py-3 px-2 text-center">🥉 3rd</th>
                    <th className="py-3 px-2 text-center">Total Marks</th>
                    <th className="py-3 px-4 text-right pr-6">Individual Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {scoreboard.map((entry) => {
                    const isMyTeam = entry.team?.id === activeTeamId;
                    return (
                      <tr
                        key={entry.participant.id}
                        className={`transition-colors ${
                          isMyTeam
                            ? 'bg-blue-50/50 font-semibold border-l-4 border-l-blue-600'
                            : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="py-3 px-4 text-center font-mono font-bold">
                          {entry.totalPoints > 0 ? (
                            <span className="inline-flex items-center gap-1">
                              {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : ''}
                              #{entry.rank}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{entry.participant.name}</div>
                          <div className="font-mono text-[10px] text-slate-400">{entry.participant.id}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-800">{entry.team?.name || 'Independent'}</div>
                          {isMyTeam && (
                            <span className="inline-block px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                              Your Team
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-medium">
                            {entry.category}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center font-mono font-bold text-amber-700">
                          {entry.firstPlaceCount}
                        </td>
                        <td className="py-3 px-2 text-center font-mono font-bold text-slate-500">
                          {entry.secondPlaceCount}
                        </td>
                        <td className="py-3 px-2 text-center font-mono font-bold text-amber-800">
                          {entry.thirdPlaceCount}
                        </td>
                        <td className="py-3 px-2 text-center font-mono text-slate-700">
                          {entry.totalMarks}
                        </td>
                        <td className="py-3 px-4 text-right pr-6 font-mono font-bold text-slate-900 text-sm">
                          {entry.totalPoints} pts
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}
    </div>
  )}

      {/* Point Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">
                  Scoring & Point Distribution Rules
                </h3>
              </div>
              <button
                onClick={() => setShowRulesModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                Points are awarded for officially approved programme results according to the fest charter:
              </p>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-800">
                <div>🥇 1st Place: <strong>{settings.pointRules.firstPlace} pts</strong></div>
                <div>🥈 2nd Place: <strong>{settings.pointRules.secondPlace} pts</strong></div>
                <div>🥉 3rd Place: <strong>{settings.pointRules.thirdPlace} pts</strong></div>
                <div>4th Place: <strong>{settings.pointRules.fourthPlace} pts</strong></div>
                <div>5th Place: <strong>{settings.pointRules.fifthPlace} pt</strong></div>
                <div>Group Multiplier: <strong>{settings.pointRules.groupMultiplier}x</strong></div>
              </div>

              <div className="pt-2">
                <h4 className="font-bold text-slate-900 mb-1">Tie-Break Policy</h4>
                <p>
                  Ties on total points are broken by:
                </p>
                <ol className="list-decimal pl-4 space-y-0.5 mt-1">
                  <li>Highest count of 1st Place (Gold) awards.</li>
                  <li>Highest count of 2nd Place (Silver) awards.</li>
                  <li>Highest count of 3rd Place (Bronze) awards.</li>
                  <li>Higher average overall percentage marks across all contested events.</li>
                </ol>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowRulesModal(false)}
                className="w-full py-2 text-xs font-semibold text-slate-900 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
