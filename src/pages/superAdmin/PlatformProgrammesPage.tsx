import React, { useState, useMemo } from 'react';
import { useFest } from '../../context/FestContext';
import { Programme } from '../../types';
import {
  CalendarCheck,
  Search,
  Filter,
  Download,
  AlertTriangle,
  Award,
  Clock,
  CheckCircle2,
  Eye,
  X,
  Users
} from 'lucide-react';
import { exportToCsv } from '../../services/storage';

export const PlatformProgrammesPage: React.FC = () => {
  const { programmes, judges, fests, participants } = useFest();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [judgeMissingOnly, setJudgeMissingOnly] = useState<boolean>(false);

  const [selectedProgramme, setSelectedProgramme] = useState<Programme | null>(null);

  const filteredProgrammes = useMemo(() => {
    return programmes.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.venue.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
      const matchType = typeFilter === 'all' || p.type === typeFilter;
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchJudge = !judgeMissingOnly || (!p.assignedJudgeIds || p.assignedJudgeIds.length === 0);
      return matchSearch && matchCategory && matchType && matchStatus && matchJudge;
    });
  }, [programmes, searchQuery, categoryFilter, typeFilter, statusFilter, judgeMissingOnly]);

  const uniqueCategories = Array.from(new Set(programmes.map((p) => p.category)));
  const programmesWithoutJudgesCount = programmes.filter((p) => !p.assignedJudgeIds || p.assignedJudgeIds.length === 0).length;

  const handleExport = () => {
    const exportData = filteredProgrammes.map((p) => ({
      Code: p.code,
      Name: p.name,
      Category: p.category,
      Type: p.type,
      Venue: p.venue,
      Stage: p.stage,
      Date: p.date,
      Start_Time: p.startTime,
      End_Time: p.endTime,
      Judges_Assigned_Count: p.assignedJudgeIds ? p.assignedJudgeIds.length : 0,
      Status: p.status,
      Results_Published: p.resultPublished ? 'Yes' : 'No',
    }));
    exportToCsv('platform_programmes_catalog', exportData);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200 rounded p-4 sm:p-5 bg-white">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Platform Competition Programmes</h2>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {programmes.length} PROGRAMMES
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Central repository of competition rules, judging assignments, venue scheduling, and publication readiness.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded bg-white text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export Programmes (CSV)</span>
        </button>
      </div>

      {/* Warning banner if judges missing */}
      {programmesWithoutJudgesCount > 0 && (
        <div className="p-3 border border-amber-200 bg-amber-50 rounded text-amber-900 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Adjudication Gap:</strong> {programmesWithoutJudgesCount} competitions have no judges assigned. Assign evaluators before scheduling.
            </span>
          </div>
          <button
            onClick={() => setJudgeMissingOnly(!judgeMissingOnly)}
            className="text-[11px] font-semibold underline text-amber-800 shrink-0"
          >
            {judgeMissingOnly ? 'Show All' : 'Filter Missing Judges'}
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search code, programme title, venue, or stage..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 border border-slate-200 rounded px-2.5 py-2 bg-white text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 border border-slate-200 rounded px-2.5 py-2 bg-white text-slate-700">
            <span className="text-slate-400">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All</option>
              <option value="individual">Individual</option>
              <option value="group">Group</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 border border-slate-200 rounded px-2.5 py-2 bg-white text-slate-700">
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All</option>
              <option value="scheduled">Scheduled</option>
              <option value="ongoing">Live / Ongoing</option>
              <option value="completed">Completed</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Programmes Table */}
      <div className="border border-slate-200 rounded overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Programme Title</th>
                <th className="px-4 py-3">Category & Format</th>
                <th className="px-4 py-3">Venue & Stage</th>
                <th className="px-4 py-3">Timing</th>
                <th className="px-4 py-3">Judges Assigned</th>
                <th className="px-4 py-3">Results Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredProgrammes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No competition programmes match the query.
                  </td>
                </tr>
              ) : (
                filteredProgrammes.map((pr) => {
                  const assignedCount = pr.assignedJudgeIds ? pr.assignedJudgeIds.length : 0;
                  return (
                    <tr key={pr.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-slate-900">{pr.code}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{pr.name}</div>
                        <div className="text-[11px] text-slate-500">{pr.description?.slice(0, 50)}...</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800">{pr.category}</span>
                        <div className="text-[10px] text-slate-500 capitalize">{pr.type} format</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {pr.venue} - {pr.stage}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px] text-slate-600">
                        {pr.date} • {pr.startTime} - {pr.endTime}
                      </td>
                      <td className="px-4 py-3">
                        {assignedCount === 0 ? (
                          <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Unassigned
                          </span>
                        ) : (
                          <span className="font-medium text-slate-900">{assignedCount} Assigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {pr.resultPublished ? (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Ratified & Live
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            Pending Scores
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedProgramme(pr)}
                          className="px-2.5 py-1 text-xs font-medium border border-slate-200 rounded text-slate-700 hover:text-slate-900 hover:bg-slate-50 inline-flex items-center gap-1 shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
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

      {/* DETAIL MODAL */}
      {selectedProgramme && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded border border-slate-200 shadow-2xl max-w-lg w-full p-6 text-slate-900 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{selectedProgramme.name}</h3>
                <p className="text-slate-500 mt-0.5">Code: {selectedProgramme.code} • {selectedProgramme.category}</p>
              </div>
              <button onClick={() => setSelectedProgramme(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 p-3 border border-slate-200 rounded bg-slate-50">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Format & Limit</span>
                  <span className="font-semibold text-slate-900 capitalize">{selectedProgramme.type} (Max {selectedProgramme.maxParticipantsPerTeam}/team)</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Schedule</span>
                  <span className="font-mono text-slate-900">{selectedProgramme.date} • {selectedProgramme.startTime}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Venue & Stage</span>
                  <span className="font-medium text-slate-900">{selectedProgramme.venue} ({selectedProgramme.stage})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Publication State</span>
                  <span className="font-semibold text-slate-900">{selectedProgramme.resultPublished ? 'Ratified & Live' : 'Unpublished'}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Official Description & Guidelines</span>
                <p className="p-3 border border-slate-200 rounded bg-white text-slate-700 leading-relaxed">
                  {selectedProgramme.description}
                </p>
              </div>

              {/* Judges Assigned */}
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Assigned Judging Panel</span>
                {(!selectedProgramme.assignedJudgeIds || selectedProgramme.assignedJudgeIds.length === 0) ? (
                  <div className="p-3 border border-amber-200 bg-amber-50 rounded text-amber-800 text-xs">
                    No judges have been assigned to this competition.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {selectedProgramme.assignedJudgeIds.map((jid: string) => {
                      const jd = judges.find((j) => j.id === jid);
                      return (
                        <div key={jid} className="p-2 border border-slate-200 rounded bg-slate-50 flex items-center justify-between">
                          <span className="font-medium text-slate-900">{jd?.name || jid}</span>
                          <span className="text-[10px] text-slate-500">{jd?.designation || jd?.institution || 'Adjudicator'}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-end">
              <button
                onClick={() => setSelectedProgramme(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded font-medium hover:bg-slate-800"
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
