import React, { useState, useMemo } from 'react';
import { useFest } from '../../context/FestContext';
import { Participant } from '../../types';
import {
  GraduationCap,
  Search,
  Filter,
  Download,
  AlertTriangle,
  Building,
  Eye,
  CheckCircle2,
  X,
  Mail,
  Phone,
  Shield
} from 'lucide-react';
import { exportToCsv } from '../../services/storage';

export const PlatformParticipantsPage: React.FC = () => {
  const { participants, teams, programmes, fests } = useFest();

  const [searchQuery, setSearchQuery] = useState('');
  const [festFilter, setFestFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

  // Cross-fest duplicate detection (e.g. same email registered across fests or multiple IDs)
  const duplicates = useMemo(() => {
    const emailCounts: Record<string, number> = {};
    participants.forEach((p) => {
      const email = p.email.toLowerCase();
      emailCounts[email] = (emailCounts[email] || 0) + 1;
    });
    return Object.keys(emailCounts).filter((email) => emailCounts[email] > 1);
  }, [participants]);

  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.college || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [participants, searchQuery, categoryFilter, statusFilter]);

  const uniqueCategories = Array.from(new Set(participants.map((p) => p.category)));

  const handleExport = () => {
    const exportData = filteredParticipants.map((p) => {
      const teamObj = teams.find((t) => t.id === p.teamId);
      return {
        Participant_ID: p.id,
        Name: p.name,
        Email: p.email,
        Phone: p.phone,
        College: p.college,
        Category: p.category,
        Team: teamObj?.name || p.teamId,
        Registered_Events_Count: p.registeredProgrammes.length,
        Status: p.status,
        Registered_Date: p.createdAt,
      };
    });
    exportToCsv('platform_cross_fest_participants', exportData);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200 rounded p-4 sm:p-5 bg-white">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Cross-Fest Participant Directory</h2>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {participants.length} REGISTERED
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Platform-wide registry of registered collegiate competitors, category categorisation, and eligibility tracking.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded bg-white text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export Roster (CSV)</span>
        </button>
      </div>

      {/* Duplicate warning alert if detected */}
      {duplicates.length > 0 && (
        <div className="p-3 border border-amber-200 bg-amber-50 rounded text-amber-900 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Cross-Registration Warning:</strong> {duplicates.length} email addresses appear multiple times across registration rosters.
            </span>
          </div>
          <button
            onClick={() => setSearchQuery(duplicates[0])}
            className="text-[11px] font-semibold underline text-amber-800 shrink-0"
          >
            Inspect Duplicate
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search participant name, email, college, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 border border-slate-200 rounded px-2.5 py-2 bg-white text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Fest:</span>
            <select
              value={festFilter}
              onChange={(e) => setFestFilter(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Fests</option>
              {fests.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 border border-slate-200 rounded px-2.5 py-2 bg-white text-slate-700">
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
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Participants Table */}
      <div className="border border-slate-200 rounded overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Participant ID</th>
                <th className="px-4 py-3">Full Name & Contact</th>
                <th className="px-4 py-3">College / Institution</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Team Allocation</th>
                <th className="px-4 py-3">Events Registered</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No participants found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((p) => {
                  const teamObj = teams.find((t) => t.id === p.teamId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-slate-900">{p.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <div className="text-[11px] text-slate-500">{p.email}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{p.college}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">{teamObj?.name || p.teamId}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-900">{p.registeredProgrammes.length}</span> programmes
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                          p.status === 'verified' || p.status === 'registered'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedParticipant(p)}
                          className="px-2.5 py-1 text-xs font-medium border border-slate-200 rounded text-slate-700 hover:text-slate-900 hover:bg-slate-50 inline-flex items-center gap-1 shadow-2xs"
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
      </div>

      {/* PARTICIPANT DETAIL MODAL */}
      {selectedParticipant && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded border border-slate-200 shadow-2xl max-w-lg w-full p-6 text-slate-900 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{selectedParticipant.name}</h3>
                <p className="text-slate-500 mt-0.5">{selectedParticipant.college} • ID: {selectedParticipant.id}</p>
              </div>
              <button onClick={() => setSelectedParticipant(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 p-3 border border-slate-200 rounded bg-slate-50">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Email</span>
                  <span className="font-medium text-slate-900">{selectedParticipant.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Phone</span>
                  <span className="font-mono text-slate-900">{selectedParticipant.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Category</span>
                  <span className="font-semibold text-slate-900">{selectedParticipant.category}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Team Allocation</span>
                  <span className="font-semibold text-slate-900">
                    {teams.find((t) => t.id === selectedParticipant.teamId)?.name || selectedParticipant.teamId}
                  </span>
                </div>
              </div>

              {/* Registered Events List */}
              <div className="border border-slate-200 rounded p-4 space-y-2">
                <h4 className="font-semibold text-slate-900">Registered Competition Events</h4>
                <div className="space-y-1.5">
                  {selectedParticipant.registeredProgrammes.map((prgId) => {
                    const prg = programmes.find((p) => p.id === prgId);
                    return (
                      <div key={prgId} className="p-2 border border-slate-100 rounded bg-slate-50 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-900">{prg?.name || prgId}</span>
                          <span className="text-slate-400 text-[10px] ml-2">({prg?.code})</span>
                        </div>
                        <span className="text-[10px] text-slate-500 capitalize">{prg?.category}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-end">
              <button
                onClick={() => setSelectedParticipant(null)}
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
