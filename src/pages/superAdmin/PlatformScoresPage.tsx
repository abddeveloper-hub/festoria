import React, { useState, useMemo } from 'react';
import { useFest } from '../../context/FestContext';
import { ScoreSubmission, ApprovedResult } from '../../types';
import {
  CheckSquare,
  Search,
  Filter,
  Download,
  Award,
  CheckCircle2,
  Clock,
  History,
  AlertCircle,
  Eye,
  X
} from 'lucide-react';
import { exportToCsv } from '../../services/storage';

export const PlatformScoresPage: React.FC = () => {
  const { scores, results, programmes, teams, participants, judges } = useFest();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedScore, setSelectedScore] = useState<ScoreSubmission | null>(null);

  const filteredScores = useMemo(() => {
    return scores.filter((s) => {
      const pr = programmes.find((p) => p.id === s.programmeId);
      const jd = judges.find((j) => j.id === s.judgeId);
      const tm = teams.find((t) => t.id === s.teamId);
      const pt = participants.find((p) => p.id === s.participantId);

      const query = searchQuery.toLowerCase();
      const matchSearch =
        s.id.toLowerCase().includes(query) ||
        (pr && pr.name.toLowerCase().includes(query)) ||
        (jd && jd.name.toLowerCase().includes(query)) ||
        (tm && tm.name.toLowerCase().includes(query)) ||
        (pt && pt.name.toLowerCase().includes(query));

      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [scores, searchQuery, statusFilter, programmes, judges, teams, participants]);

  const handleExport = () => {
    const exportData = filteredScores.map((s) => {
      const pr = programmes.find((p) => p.id === s.programmeId);
      const jd = judges.find((j) => j.id === s.judgeId);
      const tm = teams.find((t) => t.id === s.teamId);
      const pt = participants.find((p) => p.id === s.participantId);
      return {
        Score_ID: s.id,
        Programme: pr?.name || s.programmeId,
        Judge: jd?.name || s.judgeId,
        Candidate: pt?.name || tm?.name || s.teamId,
        Total_Score: s.totalScore,
        Status: s.status,
        Submitted_At: s.submittedAt,
        Revisions_Count: s.revisionHistory?.length || 0,
      };
    });
    exportToCsv('platform_scores_records', exportData);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200 rounded p-4 sm:p-5 bg-white">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Scores & Evaluation Oversight</h2>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {scores.length} SUBMISSIONS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Audit evaluation sheets, examine score revision logs, and inspect ratified leaderboard points across all competitions.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded bg-white text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export Scores (CSV)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search score ID, programme, judge, or contestant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5 border border-slate-200 rounded px-2.5 py-2 bg-white text-slate-700">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Score Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent font-medium focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="approved">Approved</option>
            <option value="reviewed">Reviewed</option>
            <option value="submitted">Submitted</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="border border-slate-200 rounded overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Score ID</th>
                <th className="px-4 py-3">Competition Event</th>
                <th className="px-4 py-3">Evaluating Judge</th>
                <th className="px-4 py-3">Candidate / Team</th>
                <th className="px-4 py-3">Score Total</th>
                <th className="px-4 py-3">Revision Trail</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredScores.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No score records match your search query.
                  </td>
                </tr>
              ) : (
                filteredScores.map((sc) => {
                  const pr = programmes.find((p) => p.id === sc.programmeId);
                  const jd = judges.find((j) => j.id === sc.judgeId);
                  const tm = teams.find((t) => t.id === sc.teamId);
                  const pt = participants.find((p) => p.id === sc.participantId);
                  const revisions = sc.revisionHistory || [];

                  return (
                    <tr key={sc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-slate-900">{sc.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{pr?.name || sc.programmeId}</div>
                        <div className="text-[11px] text-slate-500">{pr?.category}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{jd?.name || sc.judgeId}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {pt ? pt.name : tm?.name || sc.teamId}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 text-sm">{sc.totalScore}</td>
                      <td className="px-4 py-3">
                        {revisions.length > 0 ? (
                          <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {revisions.length} Edit(s)
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Original</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                          sc.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : sc.status === 'approved'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {sc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedScore(sc)}
                          className="px-2.5 py-1 text-xs font-medium border border-slate-200 rounded text-slate-700 hover:text-slate-900 hover:bg-slate-50 inline-flex items-center gap-1 shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Audit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SCORE AUDIT MODAL */}
      {selectedScore && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded border border-slate-200 shadow-2xl max-w-lg w-full p-6 text-slate-900 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Score Audit Record</h3>
                <p className="text-slate-500 mt-0.5">ID: {selectedScore.id} • Submitted {selectedScore.submittedAt}</p>
              </div>
              <button onClick={() => setSelectedScore(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 p-3 border border-slate-200 rounded bg-slate-50">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Programme</span>
                  <span className="font-semibold text-slate-900">
                    {programmes.find((p) => p.id === selectedScore.programmeId)?.name || selectedScore.programmeId}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Judge</span>
                  <span className="font-semibold text-slate-900">
                    {judges.find((j) => j.id === selectedScore.judgeId)?.name || selectedScore.judgeId}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Contestant</span>
                  <span className="font-medium text-slate-900">
                    {participants.find((p) => p.id === selectedScore.participantId)?.name ||
                     teams.find((t) => t.id === selectedScore.teamId)?.name || selectedScore.teamId}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Score</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedScore.totalScore} marks</span>
                </div>
              </div>

              {/* Criteria Scores */}
              <div className="border border-slate-200 rounded p-4 space-y-2">
                <h4 className="font-semibold text-slate-900">Criteria Marks Breakdown</h4>
                <div className="space-y-1.5">
                  {selectedScore.scores.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-b-0">
                      <span className="text-slate-700">{item.criterionName}</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {item.marksObtained} / {item.maxMarks}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Revision History */}
              <div className="border border-slate-200 rounded p-4 space-y-2">
                <h4 className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-slate-500" />
                  Score Calibration Audit Trail
                </h4>
                {(!selectedScore.revisionHistory || selectedScore.revisionHistory.length === 0) ? (
                  <p className="text-slate-400 italic">No revisions have been made. Original judge marks remain untouched.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedScore.revisionHistory.map((rev, idx) => (
                      <div key={idx} className="p-2 border border-slate-100 rounded bg-slate-50 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">Revised by {rev.revisedBy}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{rev.revisedAt}</span>
                        </div>
                        <div className="text-[11px] text-slate-600">Previous Total: {rev.previousTotal} &rarr; Reason: {rev.reason}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-end">
              <button
                onClick={() => setSelectedScore(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded font-medium hover:bg-slate-800"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
