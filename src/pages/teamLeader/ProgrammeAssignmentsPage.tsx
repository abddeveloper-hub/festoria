import React, { useState, useMemo } from 'react';
import { useFest } from '../../context/FestContext';
import { Programme, Participant } from '../../types';
import {
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Users,
  Search,
  Filter,
  Plus,
  Trash2,
  X,
  AlertCircle,
  Sparkles
} from 'lucide-react';

export const ProgrammeAssignmentsPage: React.FC = () => {
  const {
    programmes,
    participants,
    activeTeamId,
    activeTeam,
    activeFestId,
    assignments,
    assignParticipantToProgramme,
    withdrawAssignment,
  } = useFest();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal State
  const [assigningProgramme, setAssigningProgramme] = useState<Programme | null>(null);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [modalError, setModalError] = useState<string>('');
  const [clashWarning, setClashWarning] = useState<string>('');

  // Team members
  const teamMembers = useMemo(() => {
    return participants.filter((p) => p.teamId === activeTeamId);
  }, [participants, activeTeamId]);

  // Team assignments
  const teamAssignments = useMemo(() => {
    return assignments.filter((a) => a.teamId === activeTeamId);
  }, [assignments, activeTeamId]);

  // Programme assignment lookup map (programmeId -> ProgrammeAssignment)
  const assignmentMap = useMemo(() => {
    const map = new Map<string, typeof teamAssignments[0]>();
    teamAssignments.forEach((a) => map.set(a.programmeId, a));
    return map;
  }, [teamAssignments]);

  // Filtered programmes
  const filteredProgrammes = useMemo(() => {
    return programmes.filter((prg) => {
      const isAssigned = assignmentMap.has(prg.id);
      if (filterType === 'assigned' && !isAssigned) return false;
      if (filterType === 'unassigned' && isAssigned) return false;

      if (categoryFilter !== 'all' && prg.category !== categoryFilter) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          prg.name.toLowerCase().includes(query) ||
          prg.id.toLowerCase().includes(query) ||
          prg.venue.toLowerCase().includes(query) ||
          prg.category.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [programmes, assignmentMap, filterType, categoryFilter, searchQuery]);

  const categories = useMemo(() => {
    return Array.from(new Set(programmes.map((p) => p.category)));
  }, [programmes]);

  // Open modal
  const handleOpenAssignModal = (prg: Programme) => {
    setAssigningProgramme(prg);
    setModalError('');
    setClashWarning('');

    const existing = assignmentMap.get(prg.id);
    if (existing) {
      setSelectedParticipantIds(existing.participantIds);
    } else {
      setSelectedParticipantIds([]);
    }
  };

  // Toggle participant selection
  const handleToggleParticipant = (participant: Participant) => {
    if (!assigningProgramme) return;

    // Check category compatibility
    if (assigningProgramme.eligibleCategories && assigningProgramme.eligibleCategories.length > 0) {
      if (!assigningProgramme.eligibleCategories.includes(participant.category) && participant.category !== 'Open') {
        setModalError(
          `Notice: ${participant.name} is registered as "${participant.category}", while this event specifies [${assigningProgramme.eligibleCategories.join(', ')}].`
        );
      } else {
        setModalError('');
      }
    }

    let updated: string[];
    if (selectedParticipantIds.includes(participant.id)) {
      updated = selectedParticipantIds.filter((id) => id !== participant.id);
    } else {
      if (assigningProgramme.type === 'individual') {
        // Only 1 allowed
        updated = [participant.id];
      } else {
        // Group: check max participants
        const max = assigningProgramme.maxParticipantsPerTeam || 10;
        if (selectedParticipantIds.length >= max) {
          setModalError(`Maximum ${max} participants permitted for this group event.`);
          return;
        }
        updated = [...selectedParticipantIds, participant.id];
      }
    }

    setSelectedParticipantIds(updated);

    // Clash detection check: does this participant have another event overlapping this date & time?
    let clashFound = '';
    const otherProgrammes = programmes.filter(
      (p) =>
        p.id !== assigningProgramme.id &&
        p.date === assigningProgramme.date &&
        p.status !== 'cancelled'
    );

    for (const pid of updated) {
      const partObj = teamMembers.find((m) => m.id === pid);
      if (!partObj) continue;

      for (const otherPrg of otherProgrammes) {
        if (partObj.registeredProgrammes.includes(otherPrg.id)) {
          // Check time overlap
          if (assigningProgramme.startTime === otherPrg.startTime) {
            clashFound = `⚠️ Time Conflict Alert: ${partObj.name} is already registered in "${otherPrg.name}" at ${otherPrg.startTime} on ${otherPrg.date}!`;
            break;
          }
        }
      }
      if (clashFound) break;
    }

    setClashWarning(clashFound);
  };

  const handleConfirmAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningProgramme) return;

    if (selectedParticipantIds.length === 0) {
      setModalError('Please select at least one participant from your team.');
      return;
    }

    const min = assigningProgramme.type === 'individual' ? 1 : 2;
    if (selectedParticipantIds.length < min) {
      setModalError(`This event requires a minimum of ${min} participants.`);
      return;
    }

    const participantObjs = teamMembers.filter((m) => selectedParticipantIds.includes(m.id));
    const participantNames = participantObjs.map((m) => m.name);

    assignParticipantToProgramme({
      festId: activeFestId || 'fest-001',
      teamId: activeTeamId,
      programmeId: assigningProgramme.id,
      programmeName: assigningProgramme.name,
      participantIds: selectedParticipantIds,
      participantNames,
      isGroupEntry: assigningProgramme.type === 'group',
      status: 'registered',
      notes: clashWarning ? 'Approved with scheduling advisory note.' : undefined,
    });

    setAssigningProgramme(null);
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Programme Entries & Participant Assignments
          </h1>
          <p className="text-sm text-slate-500">
            Select eligible participants from <strong className="text-slate-900">{activeTeam?.name}</strong> to represent your team in solo and group events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
            {teamAssignments.length} Events Assigned
          </span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search event name, venue, code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900 bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Assignment Status Filter */}
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Events ({programmes.length})
            </button>
            <button
              onClick={() => setFilterType('assigned')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                filterType === 'assigned'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Assigned ({teamAssignments.length})
            </button>
            <button
              onClick={() => setFilterType('unassigned')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                filterType === 'unassigned'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Open ({programmes.length - teamAssignments.length})
            </button>
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
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

      {/* Programme Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProgrammes.map((prg) => {
          const assignment = assignmentMap.get(prg.id);
          const isAssigned = !!assignment;

          return (
            <div
              key={prg.id}
              className={`p-4 rounded-xl border bg-white flex flex-col justify-between transition-all ${
                isAssigned
                  ? 'border-emerald-200 shadow-2xs'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Header Tag */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {prg.category}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                      prg.type === 'individual'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {prg.type === 'individual' ? 'Solo Entry' : 'Group Entry'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{prg.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{prg.id}</p>

                {/* Details */}
                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-slate-400 shrink-0" />
                    <span>
                      {prg.date} • {prg.startTime} - {prg.endTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">{prg.venue}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users size={13} className="text-slate-400 shrink-0" />
                    <span>
                      {prg.type === 'individual'
                        ? '1 Participant'
                        : `Group Event (Max ${prg.maxParticipantsPerTeam || 10} Participants)`}
                    </span>
                  </div>
                </div>

                {/* Assigned Member List Box */}
                {isAssigned && (
                  <div className="mt-3.5 p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-800 mb-1">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        Assigned ({assignment.participantNames.length})
                      </span>
                      <span className="uppercase text-[10px] bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-bold">
                        {assignment.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 font-medium truncate">
                      {assignment.participantNames.join(', ')}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {isAssigned ? (
                  <>
                    <button
                      onClick={() => handleOpenAssignModal(prg)}
                      className="flex-1 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Change Participants
                    </button>
                    <button
                      onClick={() => withdrawAssignment(assignment.id)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Withdraw Entry"
                    >
                      <Trash2 size={15} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleOpenAssignModal(prg)}
                    className="w-full py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Plus size={14} />
                    <span>Assign Team Entry</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Participant Assignment Modal */}
      {assigningProgramme && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Assign Participants: {assigningProgramme.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {assigningProgramme.type === 'individual'
                    ? 'Select 1 member for this solo event'
                    : `Select up to ${assigningProgramme.maxParticipantsPerTeam || 10} members for this group entry`}
                </p>
              </div>
              <button
                onClick={() => setAssigningProgramme(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {clashWarning && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{clashWarning}</span>
              </div>
            )}

            {/* Members Selection List */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Select from {activeTeam?.name} Roster ({teamMembers.length} available)
              </label>

              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                {teamMembers.map((member) => {
                  const isSelected = selectedParticipantIds.includes(member.id);
                  return (
                    <div
                      key={member.id}
                      onClick={() => handleToggleParticipant(member)}
                      className={`p-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-slate-50/80 font-medium' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type={assigningProgramme.type === 'individual' ? 'radio' : 'checkbox'}
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded text-slate-900 focus:ring-0"
                        />
                        <div className="min-w-0">
                          <span className="text-xs text-slate-900 font-bold block truncate">
                            {member.name}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {member.id} • {member.category} • {member.registeredProgrammes.length} events
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Selected
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Count & Modal Footer */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
              <span className="text-slate-600">
                Selected: <strong>{selectedParticipantIds.length}</strong> participants
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAssigningProgramme(null)}
                  className="px-3.5 py-2 font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAssignment}
                  className="px-4 py-2 font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  Save Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
