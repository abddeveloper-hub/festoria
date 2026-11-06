import React, { useState, useMemo } from 'react';
import { useFest } from '../../context/FestContext';
import {
  Clock,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building,
  Check,
  Download
} from 'lucide-react';
import { exportToCsv } from '../../services/storage';

export const PlatformSchedulePage: React.FC = () => {
  const { scheduleSlots, programmes, scheduleConflicts } = useFest();

  const [searchQuery, setSearchQuery] = useState('');
  const [venueFilter, setVenueFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  const venues = Array.from(new Set(scheduleSlots.map((s) => s.venue)));
  const dates = Array.from(new Set(scheduleSlots.map((s) => s.date)));

  const filteredSlots = useMemo(() => {
    return scheduleSlots.filter((slot) => {
      const pr = programmes.find((p) => p.id === slot.programmeId);
      const query = searchQuery.toLowerCase();
      const matchSearch =
        slot.id.toLowerCase().includes(query) ||
        slot.venue.toLowerCase().includes(query) ||
        slot.stage.toLowerCase().includes(query) ||
        (pr && pr.name.toLowerCase().includes(query));

      const matchVenue = venueFilter === 'all' || slot.venue === venueFilter;
      const matchDate = dateFilter === 'all' || slot.date === dateFilter;
      return matchSearch && matchVenue && matchDate;
    });
  }, [scheduleSlots, programmes, searchQuery, venueFilter, dateFilter]);

  const handleExport = () => {
    const exportData = filteredSlots.map((slot) => {
      const pr = programmes.find((p) => p.id === slot.programmeId);
      return {
        Slot_ID: slot.id,
        Programme: pr?.name || slot.programmeId,
        Venue: slot.venue,
        Stage: slot.stage,
        Date: slot.date,
        Start_Time: slot.startTime,
        End_Time: slot.endTime,
        Status: slot.status,
      };
    });
    exportToCsv('platform_schedule_slots', exportData);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200 rounded p-4 sm:p-5 bg-white">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Schedule & Timetable Logistics</h2>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {scheduleSlots.length} TIMETABLE SLOTS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Platform-wide timetable coordination, venue heatmaps, and automated concurrency collision detection.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded bg-white text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export Timetable (CSV)</span>
        </button>
      </div>

      {/* Conflict Alert Banner */}
      {scheduleConflicts.length > 0 ? (
        <div className="p-4 border border-amber-200 bg-amber-50 rounded text-amber-900 text-xs space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Scheduling Conflicts Detected ({scheduleConflicts.length})</span>
          </div>
          <div className="space-y-1">
            {scheduleConflicts.map((c, idx) => (
              <div key={idx} className="text-xs text-amber-800">
                • {c.message}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-3 border border-emerald-200 bg-emerald-50 rounded text-emerald-800 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Zero Timing Collisions: All stages and competition time slots are conflict-free.</span>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search venue, stage, programme title, or slot ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 border border-slate-200 rounded px-2.5 py-2 bg-white text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Date:</span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Dates</option>
              {dates.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 border border-slate-200 rounded px-2.5 py-2 bg-white text-slate-700">
            <span className="text-slate-400">Venue:</span>
            <select
              value={venueFilter}
              onChange={(e) => setVenueFilter(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Venues</option>
              {venues.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Schedule Table */}
      <div className="border border-slate-200 rounded overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Slot ID</th>
                <th className="px-4 py-3">Programme Title</th>
                <th className="px-4 py-3">Venue & Stage</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Scheduled Hours</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredSlots.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No timetable slots match your filters.
                  </td>
                </tr>
              ) : (
                filteredSlots.map((slot) => {
                  const pr = programmes.find((p) => p.id === slot.programmeId);
                  return (
                    <tr key={slot.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-slate-900">{slot.id}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{pr?.name || slot.programmeId}</td>
                      <td className="px-4 py-3 text-slate-700">{slot.venue} — {slot.stage}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600">{slot.date}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600">{slot.startTime} to {slot.endTime}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 capitalize">
                          {slot.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
