import React, { useState, useMemo } from 'react';
import { useFest } from '../../context/FestContext';
import { exportToCSV } from '../../services/storage';
import {
  Sparkles,
  Award,
  AlertTriangle,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ChevronDown,
  Info,
  ChevronRight
} from 'lucide-react';

export const ProgrammeResultsPage: React.FC = () => {
  const {
    results,
    programmes,
    teams,
    activeTeamId,
    activeTeam,
    setTeamLeaderTab,
  } = useFest();

  const [searchQuery, setSearchQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState<'team' | 'all'>('team');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedResultDetail, setSelectedResultDetail] = useState<typeof results[0] | null>(null);

  // Filter results
  const filteredResults = useMemo(() => {
    return results.filter((res) => {
      if (scopeFilter === 'team' && res.teamId !== activeTeamId) return false;

      const prg = programmes.find((p) => p.id === res.programmeId);
      if (selectedCategory !== 'all' && prg?.category !== selectedCategory) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesPrg = prg?.name.toLowerCase().includes(query) || res.programmeId.toLowerCase().includes(query);
        const matchesPart = res.participantName?.toLowerCase().includes(query);
        const matchesTeam = teams.find((t) => t.id === res.teamId)?.name.toLowerCase().includes(query);
        return matchesPrg || matchesPart || matchesTeam;
      }
      return true;
    });
  }, [results, scopeFilter, activeTeamId, selectedCategory, searchQuery, programmes, teams]);

  const categories = useMemo(() => {
    return Array.from(new Set(programmes.map((p) => p.category)));
  }, [programmes]);

  // Total points earned in displayed view
  const teamTotalEarned = useMemo(() => {
    return results
      .filter((r) => r.teamId === activeTeamId)
      .reduce((acc, r) => acc + r.pointsAwarded, 0);
  }, [results, activeTeamId]);

  const handleExportCSV = () => {
    const rows = filteredResults.map((r) => {
      const prg = programmes.find((p) => p.id === r.programmeId);
      const teamObj = teams.find((t) => t.id === r.teamId);
      return {
        'Programme ID': r.programmeId,
        'Programme Name': prg?.name || r.programmeId,
        Team: teamObj?.name || r.teamId,
        Participant: r.participantName || 'Group Entry',
        Rank: r.rank,
        'Final Score': r.finalScore,
        'Points Awarded': r.pointsAwarded,
        'Approval Date': r.publishedAt || 'Published',
      };
    });
    exportToCSV(`Programme_Results_${scopeFilter}`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Official Programme Results & Marks
          </h1>
          <p className="text-sm text-slate-500">
            Jury-verified results, scorecards, and points credited to{' '}
            <strong className="text-slate-900">{activeTeam?.name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <Download size={14} />
            <span>Export Results</span>
          </button>
        </div>
      </div>

      {/* Summary Banner for Active Team */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-200">
            <Award size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {activeTeam?.name} Performance Summary
            </h3>
            <p className="text-xs text-slate-500">
              {results.filter((r) => r.teamId === activeTeamId).length} events officially evaluated
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-slate-500 block">Total Points Won</span>
            <span className="text-lg font-extrabold text-emerald-700">
              +{teamTotalEarned} pts
            </span>
          </div>
          <div className="border-l border-slate-200 pl-4">
            <span className="text-slate-500 block">Podium Finishes</span>
            <span className="text-base font-bold text-slate-900">
              {results.filter((r) => r.teamId === activeTeamId && r.rank <= 3).length} Medals
            </span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search event, participant, or team..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900 bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Scope Toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
            <button
              onClick={() => setScopeFilter('team')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                scopeFilter === 'team'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Our Team Results
            </button>
            <button
              onClick={() => setScopeFilter('all')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                scopeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Fest Results
            </button>
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-800 focus:outline-none"
          >
            <option value="all">All Disciplines</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Programme & Category</th>
                <th className="py-3 px-4">Contender</th>
                <th className="py-3 px-4 text-center">Final Score</th>
                <th className="py-3 px-4 text-center">Place</th>
                <th className="py-3 px-4 text-center">Points</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    No results match your criteria.
                  </td>
                </tr>
              ) : (
                filteredResults.map((res) => {
                  const prg = programmes.find((p) => p.id === res.programmeId);
                  const isOurTeam = res.teamId === activeTeamId;
                  const teamObj = teams.find((t) => t.id === res.teamId);

                  return (
                    <tr
                      key={res.id}
                      className={`transition-colors ${
                        isOurTeam ? 'bg-slate-50/60 font-medium' : 'hover:bg-slate-50/50'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block truncate">
                          {prg?.name || res.programmeId}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {prg?.category} • {prg?.type === 'individual' ? 'Solo' : 'Group'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-900 block truncate">
                            {res.participantName || teamObj?.name}
                          </span>
                          <span className="text-[11px] text-slate-500 truncate block">
                            {teamObj?.name} {isOurTeam && '(Your Team)'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono font-bold text-slate-900">
                          {res.finalScore.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-slate-400 block">/ 100</span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            res.rank === 1
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : res.rank === 2
                              ? 'bg-slate-200 text-slate-900'
                              : res.rank === 3
                              ? 'bg-amber-50 text-amber-900 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {res.rank === 1 ? '🥇 1st' : res.rank === 2 ? '🥈 2nd' : res.rank === 3 ? '🥉 3rd' : `#${res.rank}`}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs">
                          +{res.pointsAwarded} pts
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 size={11} />
                          Approved
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedResultDetail(res)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-medium"
                            title="View Score Details"
                          >
                            Details
                          </button>
                          {isOurTeam && (
                            <button
                              onClick={() => setTeamLeaderTab('team_complaints')}
                              className="px-2 py-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors flex items-center gap-1"
                              title="Appeal this result if you believe there is a scoring error"
                            >
                              <AlertTriangle size={11} />
                              <span>Appeal</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Result Details Drawer / Modal */}
      {selectedResultDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Official Scorecard Breakdown
              </h3>
              <button
                onClick={() => setSelectedResultDetail(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Programme:</span>
                  <span className="font-bold text-slate-900">
                    {programmes.find((p) => p.id === selectedResultDetail.programmeId)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Participant / Team:</span>
                  <span className="font-bold text-slate-900">
                    {selectedResultDetail.participantName || selectedResultDetail.teamId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Rank Awarded:</span>
                  <span className="font-bold text-slate-900">
                    #{selectedResultDetail.rank}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Championship Points:</span>
                  <span className="font-bold text-emerald-700">
                    +{selectedResultDetail.pointsAwarded} pts
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Approval Timestamp:</span>
                  <span className="font-mono text-slate-600">
                    {selectedResultDetail.publishedAt || 'Published'}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1.5">Jury Evaluation Remarks</h4>
                <p className="p-3 rounded-lg border border-slate-200 bg-white text-slate-700 italic">
                  "{selectedResultDetail.tieBreakNotes || 'Performance scores verified and certified by Chief Evaluator and Jury Committee.'}"
                </p>
              </div>

              {selectedResultDetail.teamId === activeTeamId && (
                <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-amber-800 space-y-1">
                  <span className="font-bold block">Need to contest this score?</span>
                  <p className="text-[11px]">
                    You can lodge a formal appeal through the Complaints & Appeals portal within the standard window.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedResultDetail(null);
                      setTeamLeaderTab('team_complaints');
                    }}
                    className="mt-1 text-xs font-bold text-amber-900 underline block"
                  >
                    Open Complaints & Appeals →
                  </button>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedResultDetail(null)}
                className="w-full py-2 text-xs font-semibold text-slate-900 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
