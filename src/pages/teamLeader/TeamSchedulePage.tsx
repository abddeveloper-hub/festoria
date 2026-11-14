import React, { useState, useMemo } from 'react';
import { useFest } from '../../context/FestContext';
import { exportToCSV } from '../../services/storage';
import {
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  Download,
  Printer,
  Search,
  Filter,
  Users,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

export const TeamSchedulePage: React.FC = () => {
  const {
    programmes,
    participants,
    activeTeamId,
    activeTeam,
    assignments,
  } = useFest();

  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Team participants
  const teamMembers = useMemo(() => {
    return participants.filter((p) => p.teamId === activeTeamId);
  }, [participants, activeTeamId]);

  const teamMemberIds = useMemo(() => {
    return new Set(teamMembers.map((m) => m.id));
  }, [teamMembers]);

  // Team's assigned programmes
  const teamAssignments = useMemo(() => {
    return assignments.filter((a) => a.teamId === activeTeamId);
  }, [assignments, activeTeamId]);

  const assignedProgrammeIds = useMemo(() => {
    return new Set(teamAssignments.map((a) => a.programmeId));
  }, [teamAssignments]);

  // All programmes where team is assigned or has participants
  const teamProgrammes = useMemo(() => {
    return programmes.filter((prg) => {
      const hasAssignment = assignedProgrammeIds.has(prg.id);
      const hasMember = prg.registeredParticipantIds?.some((pid: string) => teamMemberIds.has(pid));
      return hasAssignment || hasMember;
    });
  }, [programmes, assignedProgrammeIds, teamMemberIds]);

  // Distinct dates in fest
  const dates = useMemo(() => {
    const set = new Set<string>();
    teamProgrammes.forEach((p) => {
      if (p.date) set.add(p.date);
    });
    return Array.from(set).sort();
  }, [teamProgrammes]);

  // Detect time clashes among team programmes
  const clashes = useMemo(() => {
    const list: { p1: typeof teamProgrammes[0]; p2: typeof teamProgrammes[0]; commonMembers: string[] }[] = [];
    for (let i = 0; i < teamProgrammes.length; i++) {
      for (let j = i + 1; j < teamProgrammes.length; j++) {
        const p1 = teamProgrammes[i];
        const p2 = teamProgrammes[j];
        if (p1.date === p2.date && p1.startTime === p2.startTime && p1.status !== 'cancelled' && p2.status !== 'cancelled') {
          // Find common team participants
          const asg1 = teamAssignments.find((a) => a.programmeId === p1.id);
          const asg2 = teamAssignments.find((a) => a.programmeId === p2.id);
          const parts1 = asg1 ? asg1.participantIds : (p1.registeredParticipantIds?.filter((id: string) => teamMemberIds.has(id)) || []);
          const parts2 = asg2 ? asg2.participantIds : (p2.registeredParticipantIds?.filter((id: string) => teamMemberIds.has(id)) || []);

          const common = parts1.filter((id: string) => parts2.includes(id));
          if (common.length > 0) {
            const commonNames = teamMembers.filter((m) => common.includes(m.id)).map((m) => m.name);
            list.push({ p1, p2, commonMembers: commonNames });
          }
        }
      }
    }
    return list;
  }, [teamProgrammes, teamAssignments, teamMemberIds, teamMembers]);

  // Filtered programmes
  const displayedProgrammes = useMemo(() => {
    return teamProgrammes
      .filter((prg) => {
        if (selectedDate !== 'all' && prg.date !== selectedDate) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return (
            (prg.name || '').toLowerCase().includes(q) ||
            (prg.venue || '').toLowerCase().includes(q) ||
            (prg.category || '').toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
      });
  }, [teamProgrammes, selectedDate, searchQuery]);

  const handleExportCSV = () => {
    const rows = displayedProgrammes.map((p) => {
      const asg = teamAssignments.find((a) => a.programmeId === p.id);
      return {
        Date: p.date,
        'Start Time': p.startTime,
        'End Time': p.endTime,
        'Programme Name': p.name,
        Category: p.category,
        Venue: p.venue,
        'Assigned Participants': asg ? asg.participantNames.join(', ') : 'Team Roster',
        Status: p.status,
      };
    });
    exportToCSV(`${activeTeam?.name || 'Team'}_Schedule`, rows);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Team Schedule & Venue Timetable
          </h1>
          <p className="text-sm text-slate-500">
            Event reporting schedules, venue locations, and clash monitoring for <strong className="text-slate-900">{activeTeam?.name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <Printer size={14} />
            <span>Print Timetable</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <Download size={14} />
            <span>Export Schedule</span>
          </button>
        </div>
      </div>

      {/* CLASH WARNING BANNER */}
      {clashes.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle size={18} className="text-amber-600 shrink-0" />
            <span>Schedule Conflict Alert ({clashes.length} Detected)</span>
          </div>
          <p className="text-xs text-amber-800">
            The following events overlap in the timetable and involve the same team participants:
          </p>
          <div className="space-y-1 pl-4 list-disc text-xs">
            {clashes.map((c, idx) => (
              <div key={idx} className="font-medium">
                • <strong>{c.commonMembers.join(', ')}</strong> is scheduled simultaneously in "{c.p1.name}" and "{c.p2.name}" at {c.p1.startTime} on {c.p1.date}.
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Date Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search event name, venue, discipline..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900 bg-white"
          />
        </div>

        {/* Date Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedDate('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedDate === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Dates ({teamProgrammes.length})
          </button>
          {dates.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDate(d)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                selectedDate === d
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Timeline List */}
      <div className="space-y-3">
        {displayedProgrammes.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-200 rounded-xl bg-white">
            <Calendar size={36} className="mx-auto text-slate-300 mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No events scheduled</h3>
            <p className="text-xs text-slate-500 mt-1">
              No programme entries found matching this date filter.
            </p>
          </div>
        ) : (
          displayedProgrammes.map((prg) => {
            const asg = teamAssignments.find((a) => a.programmeId === prg.id);
            const isCompleted = prg.status === 'completed';
            const isInProgress = prg.status === 'ongoing';

            return (
              <div
                key={prg.id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs"
              >
                {/* Time & Venue Column */}
                <div className="flex items-start gap-4">
                  <div className="w-24 shrink-0 text-center p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-xs font-bold text-slate-900 block">
                      {prg.startTime}
                    </span>
                    <span className="text-[10px] text-slate-500 block">to {prg.endTime}</span>
                    <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                      {prg.date}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {prg.category}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                          isCompleted
                            ? 'bg-slate-100 text-slate-600'
                            : isInProgress
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {isCompleted ? 'Completed' : isInProgress ? 'On Stage Now' : 'Upcoming'}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">{prg.name}</h3>

                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-600">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <MapPin size={13} className="text-slate-400" />
                        {prg.venue}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={13} className="text-slate-400" />
                        Stage Slot: {prg.startTime}
                      </span>
                    </div>

                    {/* Assigned Participants */}
                    <div className="mt-2 text-xs flex items-center gap-1.5 text-slate-700">
                      <Users size={13} className="text-slate-400 shrink-0" />
                      <span className="font-semibold">Team Contender:</span>
                      <span className="text-slate-600 truncate">
                        {asg ? asg.participantNames.join(', ') : 'Roster Registered'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Status / Instructions */}
                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 shrink-0 text-xs">
                  <div className="text-left md:text-right">
                    <span className="text-[11px] text-slate-500 block">Reporting Deadline:</span>
                    <span className="font-semibold text-slate-900">
                      30 mins before start
                    </span>
                  </div>
                  <span className="mt-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                    Green Room A
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
