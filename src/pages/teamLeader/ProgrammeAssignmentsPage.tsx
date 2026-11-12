import React, { useState, useMemo } from 'react';
import { useFest } from '../../context/FestContext';
import { Programme, Participant, TeamProgrammeEntry } from '../../types';
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
  Sparkles,
  Edit2,
  Shield,
  Layers,
  Award,
  ChevronRight,
  Info
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';

export const ProgrammeAssignmentsPage: React.FC = () => {
  const {
    programmes,
    participants,
    categories,
    activeTeamId,
    activeTeam,
    activeFestId,
    assignments,
    assignParticipantToProgramme,
    withdrawAssignment,
    teamProgrammeEntries,
    createTeamProgrammeEntry,
    updateTeamProgrammeEntry,
    deleteTeamProgrammeEntry,
    addToast,
  } = useFest();

  // Primary Tab View: Individual Programmes vs Team Programmes
  const [activeViewTab, setActiveViewTab] = useState<'individual' | 'team'>('individual');

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'assigned' | 'open'>('all');

  // Individual Assignment Modal State
  const [assigningIndividualProg, setAssigningIndividualProg] = useState<Programme | null>(null);
  const [selectedIndividualParticipantId, setSelectedIndividualParticipantId] = useState<string>('');
  const [individualModalError, setIndividualModalError] = useState<string>('');

  // Team Programme Entry Modal State
  const [teamEntryModalOpen, setTeamEntryModalOpen] = useState(false);
  const [targetTeamProgramme, setTargetTeamProgramme] = useState<Programme | null>(null);
  const [editingEntry, setEditingEntry] = useState<TeamProgrammeEntry | null>(null);
  const [entryName, setEntryName] = useState('');
  const [entryCategory, setEntryCategory] = useState('');
  const [selectedTeamMemberIds, setSelectedTeamMemberIds] = useState<string[]>([]);
  const [teamModalError, setTeamModalError] = useState('');

  // Authorised team members for this Team Leader
  const myTeamMembers = useMemo(() => {
    return participants.filter((p) => p.teamId === activeTeamId && p.status !== 'inactive');
  }, [participants, activeTeamId]);

  // Team assignments for this team
  const myTeamAssignments = useMemo(() => {
    return assignments.filter((a) => a.teamId === activeTeamId);
  }, [assignments, activeTeamId]);

  // Team programme entries registered by this team
  const myTeamProgrammeEntries = useMemo(() => {
    return teamProgrammeEntries.filter((e) => e.teamId === activeTeamId && e.status !== 'withdrawn');
  }, [teamProgrammeEntries, activeTeamId]);

  // Individual programmes filter
  const individualProgrammes = useMemo(() => {
    return programmes.filter((p) => {
      const isTeam = p.type === 'group' || p.type === 'team' || p.programmeType === 'team';
      return !isTeam;
    });
  }, [programmes]);

  // Team programmes filter
  const teamProgrammes = useMemo(() => {
    return programmes.filter((p) => {
      const isTeam = p.type === 'group' || p.type === 'team' || p.programmeType === 'team';
      return isTeam;
    });
  }, [programmes]);

  // Distinct categories available in fest
  const availableCategories = useMemo(() => {
    return categories.filter((c) => c.enabled);
  }, [categories]);

  // Filtered displayed programmes according to current view tab
  const displayedProgrammes = useMemo(() => {
    const list = activeViewTab === 'individual' ? individualProgrammes : teamProgrammes;

    return list.filter((prg) => {
      if (categoryFilter !== 'all') {
        const matchesCategory =
          prg.eligibleCategories.includes(categoryFilter) ||
          prg.category === categoryFilter;
        if (!matchesCategory) return false;
      }

      if (statusFilter !== 'all') {
        if (activeViewTab === 'individual') {
          const registeredCount = myTeamAssignments.filter((a) => a.programmeId === prg.id).length;
          const maxAllowed = prg.maxParticipantsPerTeam || 1;
          const isFilled = registeredCount >= maxAllowed;
          if (statusFilter === 'assigned' && registeredCount === 0) return false;
          if (statusFilter === 'open' && isFilled) return false;
        } else {
          const entriesCount = myTeamProgrammeEntries.filter((e) => e.programmeId === prg.id).length;
          const maxEntries = prg.maxEntriesPerTeam || 1;
          const isFilled = entriesCount >= maxEntries;
          if (statusFilter === 'assigned' && entriesCount === 0) return false;
          if (statusFilter === 'open' && isFilled) return false;
        }
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          prg.name.toLowerCase().includes(q) ||
          prg.code.toLowerCase().includes(q) ||
          prg.venue.toLowerCase().includes(q) ||
          prg.category.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [
    activeViewTab,
    individualProgrammes,
    teamProgrammes,
    categoryFilter,
    statusFilter,
    searchQuery,
    myTeamAssignments,
    myTeamProgrammeEntries,
  ]);

  // Open Individual Assignment Modal
  const handleOpenIndividualAssign = (prg: Programme) => {
    setAssigningIndividualProg(prg);
    setSelectedIndividualParticipantId('');
    setIndividualModalError('');
  };

  // Submit Individual Assignment
  const handleConfirmIndividualAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningIndividualProg || !selectedIndividualParticipantId) {
      setIndividualModalError('Please select a participant.');
      return;
    }

    const participant = myTeamMembers.find((p) => p.id === selectedIndividualParticipantId);
    if (!participant) {
      setIndividualModalError('Selected participant not found in your team.');
      return;
    }

    // Check duplicate
    const alreadyAssigned = myTeamAssignments.some(
      (a) => a.programmeId === assigningIndividualProg.id && a.participantIds.includes(participant.id)
    );
    if (alreadyAssigned) {
      setIndividualModalError(`${participant.name} is already registered for this event.`);
      return;
    }

    // Check remaining slots
    const maxAllowed = assigningIndividualProg.maxParticipantsPerTeam || 1;
    const currentAssignments = myTeamAssignments.filter((a) => a.programmeId === assigningIndividualProg.id);
    const registeredCount = new Set(currentAssignments.flatMap((a) => a.participantIds)).size;
    if (registeredCount >= maxAllowed) {
      setIndividualModalError(
        `All ${maxAllowed} participant slot(s) for your team in "${assigningIndividualProg.name}" are already filled.`
      );
      return;
    }

    // Check category eligibility
    if (assigningIndividualProg.eligibleCategories && assigningIndividualProg.eligibleCategories.length > 0) {
      const allowed = assigningIndividualProg.eligibleCategories.map((c) => c.toLowerCase());
      const allowsGeneral = allowed.includes('general');
      const memCat = (participant.category || '').toLowerCase();
      if (!allowed.includes(memCat) && !(allowsGeneral && memCat === 'general')) {
        setIndividualModalError(
          `${participant.name} is registered as "${participant.category}", but this event requires [${assigningIndividualProg.eligibleCategories.join(', ')}].`
        );
        return;
      }
    }

    assignParticipantToProgramme({
      festId: activeFestId || 'FEST-01',
      teamId: activeTeamId,
      programmeId: assigningIndividualProg.id,
      programmeName: assigningIndividualProg.name,
      participantIds: [participant.id],
      participantNames: [participant.name],
      isGroupEntry: false,
      status: 'registered',
    });

    setAssigningIndividualProg(null);
  };

  // Open Team Entry Modal (New or Edit)
  const handleOpenTeamEntryModal = (prg: Programme, existingEntry?: TeamProgrammeEntry) => {
    setTargetTeamProgramme(prg);
    setTeamModalError('');

    if (existingEntry) {
      setEditingEntry(existingEntry);
      setEntryName(existingEntry.entryName);
      setEntryCategory(existingEntry.categoryId || prg.eligibleCategories[0] || 'General');
      setSelectedTeamMemberIds([...existingEntry.memberParticipantIds]);
    } else {
      setEditingEntry(null);
      const teamExistingEntries = myTeamProgrammeEntries.filter((e) => e.programmeId === prg.id);
      const nextLetter = String.fromCharCode(65 + teamExistingEntries.length); // 'A', 'B', etc.
      setEntryName(`${activeTeam?.name || 'Team'} Entry ${nextLetter}`);
      setEntryCategory(prg.eligibleCategories[0] || 'General');
      setSelectedTeamMemberIds([]);
    }

    setTeamEntryModalOpen(true);
  };

  // Toggle member selection in team entry modal
  const handleToggleTeamMember = (member: Participant) => {
    if (!targetTeamProgramme) return;

    if (selectedTeamMemberIds.includes(member.id)) {
      setSelectedTeamMemberIds(selectedTeamMemberIds.filter((id) => id !== member.id));
    } else {
      const maxAllowed = targetTeamProgramme.maxTeamMembers || 20;
      if (selectedTeamMemberIds.length >= maxAllowed) {
        setTeamModalError(`Maximum ${maxAllowed} members allowed for this team entry.`);
        return;
      }
      setSelectedTeamMemberIds([...selectedTeamMemberIds, member.id]);
    }
  };

  // Submit Team Programme Entry
  const handleSaveTeamEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTeamProgramme) return;

    if (!entryName.trim()) {
      setTeamModalError('Entry name is required.');
      return;
    }

    const minMembers = targetTeamProgramme.minTeamMembers || 2;
    const maxMembers = targetTeamProgramme.maxTeamMembers || 20;

    if (selectedTeamMemberIds.length < minMembers) {
      setTeamModalError(
        `Requires at least ${minMembers} members (you have selected ${selectedTeamMemberIds.length}).`
      );
      return;
    }

    if (selectedTeamMemberIds.length > maxMembers) {
      setTeamModalError(
        `Maximum ${maxMembers} members allowed (you have selected ${selectedTeamMemberIds.length}).`
      );
      return;
    }

    if (editingEntry) {
      // Update existing
      const res = updateTeamProgrammeEntry(editingEntry.id, {
        entryName: entryName.trim(),
        categoryId: entryCategory,
        memberParticipantIds: selectedTeamMemberIds,
        memberNames: myTeamMembers
          .filter((m) => selectedTeamMemberIds.includes(m.id))
          .map((m) => m.name),
      });
      if (!res.success) {
        setTeamModalError(res.error || 'Failed to update team entry.');
        return;
      }
    } else {
      // Create new
      const res = createTeamProgrammeEntry({
        programmeId: targetTeamProgramme.id,
        teamId: activeTeamId,
        entryName: entryName.trim(),
        categoryId: entryCategory,
        memberParticipantIds: selectedTeamMemberIds,
      });
      if (!res.success) {
        setTeamModalError(res.error || 'Failed to create team entry.');
        return;
      }
    }

    setTeamEntryModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Programme Entries & Team Roster Assignment
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Register eligible participants from <strong className="text-slate-900">{activeTeam?.name}</strong> for individual and group competitions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
            {myTeamMembers.length} Team Members Registered
          </span>
        </div>
      </div>

      {/* Primary View Switcher: Individual Programmes vs Team Programmes */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => {
            setActiveViewTab('individual');
            setStatusFilter('all');
          }}
          className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 ${
            activeViewTab === 'individual'
              ? 'text-slate-900 border-b-2 border-slate-900'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Award className="w-4 h-4 text-blue-600" />
          <span>Individual Programmes</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700 font-mono">
            {individualProgrammes.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveViewTab('team');
            setStatusFilter('all');
          }}
          className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 ${
            activeViewTab === 'team'
              ? 'text-purple-900 border-b-2 border-purple-900'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4 text-purple-600" />
          <span>Team Programmes</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 text-purple-800 font-mono">
            {teamProgrammes.length}
          </span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search programme, venue, code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:border-slate-400 text-slate-900 bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Status Filter */}
          <div className="inline-flex rounded border border-slate-200 p-0.5 bg-slate-50 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                statusFilter === 'all' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('assigned')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                statusFilter === 'assigned' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500'
              }`}
            >
              Registered
            </button>
            <button
              onClick={() => setStatusFilter('open')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                statusFilter === 'open' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-500'
              }`}
            >
              Open Slots
            </button>
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {availableCategories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name} {c.isGeneral ? '(General / Any Age)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* =========================================================================
          VIEW A: INDIVIDUAL PROGRAMMES LIST
          ========================================================================= */}
      {activeViewTab === 'individual' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedProgrammes.map((prg) => {
            const maxAllowed = prg.maxParticipantsPerTeam || 1;
            const currentAssignments = myTeamAssignments.filter((a) => a.programmeId === prg.id);
            const registeredParticipantIds = Array.from(new Set(currentAssignments.flatMap((a) => a.participantIds)));
            const registeredCount = registeredParticipantIds.length;
            const remainingSlots = Math.max(0, maxAllowed - registeredCount);
            const isFull = remainingSlots === 0;

            const registeredObjs = myTeamMembers.filter((m) => registeredParticipantIds.includes(m.id));

            return (
              <div
                key={prg.id}
                className={`p-4 rounded-lg border bg-white flex flex-col justify-between transition-all ${
                  isFull ? 'border-emerald-300 shadow-2xs' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      {prg.code}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      Solo Event
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 leading-snug">{prg.name}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">{prg.category}</p>

                  <div className="mt-2.5 space-y-1 text-[11px] text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{prg.date} • {prg.startTime} - {prg.endTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{prg.venue} ({prg.stage})</span>
                    </div>
                  </div>

                  {/* Eligible Categories */}
                  <div className="mt-2.5">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Eligible Categories:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {prg.eligibleCategories.map((c) => (
                        <span
                          key={c}
                          className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                            c === 'General'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* SLOT COUNTER (Requirement 4) */}
                  <div className="mt-3 p-2.5 rounded bg-slate-50 border border-slate-200 text-xs">
                    <div className="grid grid-cols-3 gap-1 text-center font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Max Allowed</span>
                        <span className="font-bold text-slate-800">{maxAllowed}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Registered</span>
                        <span className="font-bold text-blue-700">{registeredCount}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Remaining</span>
                        <span className={`font-bold ${remainingSlots > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {remainingSlots}
                        </span>
                      </div>
                    </div>

                    {registeredObjs.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200 space-y-1">
                        <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                          Assigned Contestants:
                        </span>
                        {registeredObjs.map((m) => {
                          const asg = currentAssignments.find((a) => a.participantIds.includes(m.id));
                          return (
                            <div key={m.id} className="flex items-center justify-between text-[11px] bg-white px-2 py-1 rounded border border-slate-200">
                              <span className="font-medium text-slate-800 truncate">
                                {m.name} <span className="text-slate-400 text-[10px]">({m.category})</span>
                              </span>
                              {asg && (
                                <button
                                  type="button"
                                  onClick={() => withdrawAssignment(asg.id)}
                                  className="text-[10px] text-rose-600 hover:text-rose-800 hover:underline ml-2"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-100">
                  {remainingSlots > 0 ? (
                    <button
                      type="button"
                      onClick={() => handleOpenIndividualAssign(prg)}
                      className="w-full py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Register Participant ({remainingSlots} slot{remainingSlots > 1 ? 's' : ''} left)</span>
                    </button>
                  ) : (
                    <div className="text-center py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded border border-emerald-200 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>All Team Slots Filled</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          VIEW B: TEAM PROGRAMMES LIST (Group Competitions)
          ========================================================================= */}
      {activeViewTab === 'team' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedProgrammes.map((prg) => {
              const maxEntries = prg.maxEntriesPerTeam || 1;
              const minMembers = prg.minTeamMembers || 2;
              const maxMembers = prg.maxTeamMembers || 10;
              const registeredEntries = myTeamProgrammeEntries.filter((e) => e.programmeId === prg.id);
              const remainingEntries = Math.max(0, maxEntries - registeredEntries.length);
              const canAddEntry = remainingEntries > 0;

              return (
                <div
                  key={prg.id}
                  className="p-4 rounded-lg border border-purple-200 bg-white shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                          {prg.code}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-900">
                          Team Programme
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-purple-700">
                        {registeredEntries.length}/{maxEntries} Entries Registered
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 leading-snug">{prg.name}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">{prg.category}</p>

                    <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-purple-50/40 p-2.5 rounded border border-purple-100">
                      <div>
                        <span className="text-[10px] text-purple-900 font-semibold uppercase block">Team Size:</span>
                        <span className="font-bold text-slate-800">{minMembers} to {maxMembers} members</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-purple-900 font-semibold uppercase block">Max Entries:</span>
                        <span className="font-bold text-slate-800">{maxEntries} per team</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-purple-900 font-semibold uppercase block">Schedule:</span>
                        <span className="font-mono">{prg.date} • {prg.startTime}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-purple-900 font-semibold uppercase block">Venue:</span>
                        <span className="truncate block">{prg.venue} ({prg.stage})</span>
                      </div>
                    </div>

                    {/* Eligible Categories */}
                    <div className="mt-2.5">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Eligible Categories:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {prg.eligibleCategories.map((c) => (
                          <span
                            key={c}
                            className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                              c === 'General'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Registered Entries List */}
                    <div className="mt-3 space-y-2">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">
                        Registered Team Entries ({registeredEntries.length}):
                      </span>

                      {registeredEntries.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic bg-slate-50 p-2 rounded border border-slate-200">
                          No team entries registered yet. Click &quot;Register Team Entry&quot; to form an entry.
                        </p>
                      ) : (
                        registeredEntries.map((entry) => (
                          <div
                            key={entry.id}
                            className="p-2.5 rounded border border-purple-200 bg-purple-50/30 space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-purple-950 flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-purple-600" />
                                {entry.entryName}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                                  {entry.status}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenTeamEntryModal(prg, entry)}
                                  className="text-[11px] text-slate-600 hover:text-slate-900"
                                  title="Edit Entry"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteTeamProgrammeEntry(entry.id)}
                                  className="text-[11px] text-rose-600 hover:text-rose-800"
                                  title="Withdraw Entry"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="text-[11px] text-slate-600">
                              <span className="font-semibold text-slate-800">Members ({entry.memberParticipantIds.length}):</span>{' '}
                              {entry.memberNames && entry.memberNames.length > 0
                                ? entry.memberNames.join(', ')
                                : entry.memberParticipantIds.join(', ')}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Add Entry Button */}
                  <div className="mt-3.5 pt-2.5 border-t border-slate-100">
                    {canAddEntry ? (
                      <button
                        type="button"
                        onClick={() => handleOpenTeamEntryModal(prg)}
                        className="w-full py-1.5 bg-purple-700 text-white rounded text-xs font-semibold hover:bg-purple-800 flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Register Team Entry ({remainingEntries} available)</span>
                      </button>
                    ) : (
                      <div className="text-center py-1.5 text-xs font-semibold text-purple-800 bg-purple-50 rounded border border-purple-200 flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                        <span>Maximum Entries Reached ({maxEntries}/{maxEntries})</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: REGISTER INDIVIDUAL PARTICIPANT
          ========================================================================= */}
      {assigningIndividualProg && (
        <Modal
          isOpen={!!assigningIndividualProg}
          onClose={() => setAssigningIndividualProg(null)}
          title={`Assign Participant: ${assigningIndividualProg.name}`}
          maxWidth="lg"
        >
          <form onSubmit={handleConfirmIndividualAssign} className="space-y-4 text-xs">
            {individualModalError && (
              <div className="p-2.5 bg-rose-50 border border-rose-300 rounded text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{individualModalError}</span>
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1 text-slate-700">
              <div>Event: <strong className="text-slate-900">{assigningIndividualProg.name} ({assigningIndividualProg.code})</strong></div>
              <div>Eligible Categories: <strong className="text-slate-900">{assigningIndividualProg.eligibleCategories.join(', ')}</strong></div>
              <div>Max Allowed Per Team: <strong className="text-slate-900">{assigningIndividualProg.maxParticipantsPerTeam || 1}</strong></div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Select Eligible Contestant from {activeTeam?.name}:
              </label>

              <div className="max-h-56 overflow-y-auto border border-slate-200 rounded divide-y divide-slate-100">
                {myTeamMembers.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">
                    No active participants found in your team roster.
                  </div>
                ) : (
                  myTeamMembers.map((member) => {
                    const alreadyAssigned = myTeamAssignments.some(
                      (a) => a.programmeId === assigningIndividualProg.id && a.participantIds.includes(member.id)
                    );
                    const allowedCats = assigningIndividualProg.eligibleCategories.map((c) => c.toLowerCase());
                    const allowsGeneral = allowedCats.includes('general');
                    const memCat = (member.category || '').toLowerCase();
                    const isEligibleCategory = allowedCats.includes(memCat) || (allowsGeneral && memCat === 'general');

                    const isSelected = selectedIndividualParticipantId === member.id;

                    return (
                      <label
                        key={member.id}
                        className={`flex items-center justify-between p-2.5 cursor-pointer transition-colors ${
                          alreadyAssigned || !isEligibleCategory
                            ? 'opacity-50 bg-slate-50 cursor-not-allowed'
                            : isSelected
                            ? 'bg-blue-50/70 border-l-4 border-blue-600'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="individual_participant"
                            disabled={alreadyAssigned || !isEligibleCategory}
                            checked={isSelected}
                            onChange={() => {
                              setSelectedIndividualParticipantId(member.id);
                              setIndividualModalError('');
                            }}
                            className="text-blue-600"
                          />
                          <div>
                            <span className="font-semibold text-slate-900">{member.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono ml-2">
                              {member.id} • {member.category}
                            </span>
                          </div>
                        </div>

                        <div>
                          {alreadyAssigned ? (
                            <span className="text-[10px] text-slate-400 italic">Already Registered</span>
                          ) : !isEligibleCategory ? (
                            <span className="text-[10px] text-rose-600 font-semibold">Ineligible Category</span>
                          ) : (
                            <span className="text-[10px] text-emerald-700 font-semibold">Eligible</span>
                          )}
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAssigningIndividualProg(null)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedIndividualParticipantId}
                className="px-4 py-1.5 bg-slate-900 text-white rounded font-bold hover:bg-slate-800 disabled:opacity-50"
              >
                Confirm Registration
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* =========================================================================
          MODAL 2: REGISTER / EDIT TEAM PROGRAMME ENTRY
          ========================================================================= */}
      {teamEntryModalOpen && targetTeamProgramme && (
        <Modal
          isOpen={teamEntryModalOpen}
          onClose={() => setTeamEntryModalOpen(false)}
          title={`${editingEntry ? 'Edit Team Entry' : 'Register Team Entry'}: ${targetTeamProgramme.name}`}
          maxWidth="xl"
        >
          <form onSubmit={handleSaveTeamEntry} className="space-y-4 text-xs">
            {teamModalError && (
              <div className="p-2.5 bg-rose-50 border border-rose-300 rounded text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{teamModalError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Team Entry Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Phoenix Choir Squad A"
                  value={entryName}
                  onChange={(e) => setEntryName(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Selected Category *
                </label>
                <select
                  value={entryCategory}
                  onChange={(e) => setEntryCategory(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white"
                >
                  {targetTeamProgramme.eligibleCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Limits Callout */}
            <div className="p-2.5 bg-purple-50 rounded border border-purple-200 flex items-center justify-between text-[11px] text-purple-900">
              <div>
                Minimum Required: <strong className="font-mono">{targetTeamProgramme.minTeamMembers || 2} members</strong>
              </div>
              <div>
                Maximum Allowed: <strong className="font-mono">{targetTeamProgramme.maxTeamMembers || 20} members</strong>
              </div>
              <div>
                Currently Selected:{' '}
                <strong
                  className={`font-mono font-bold ${
                    selectedTeamMemberIds.length < (targetTeamProgramme.minTeamMembers || 2)
                      ? 'text-rose-600'
                      : selectedTeamMemberIds.length > (targetTeamProgramme.maxTeamMembers || 20)
                      ? 'text-rose-600'
                      : 'text-emerald-700'
                  }`}
                >
                  {selectedTeamMemberIds.length} members
                </strong>
              </div>
            </div>

            {/* Member Selector Checklist */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Select Team Members for this Entry:
              </label>

              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded divide-y divide-slate-100">
                {myTeamMembers.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">
                    No active members in your team.
                  </div>
                ) : (
                  myTeamMembers.map((member) => {
                    const isSelected = selectedTeamMemberIds.includes(member.id);

                    // Duplicate check: already in another entry of this same programme
                    let inAnotherEntry = false;
                    if (!targetTeamProgramme.allowMultiEntriesPerParticipant) {
                      inAnotherEntry = myTeamProgrammeEntries.some(
                        (e) => e.programmeId === targetTeamProgramme.id && e.id !== editingEntry?.id && e.memberParticipantIds.includes(member.id)
                      );
                    }

                    // Multi team programme participation check
                    let inOtherTeamProg = false;
                    if (targetTeamProgramme.allowMultiTeamProgrammeParticipation === false) {
                      inOtherTeamProg = teamProgrammeEntries.some(
                        (e) => e.programmeId !== targetTeamProgramme.id && e.status !== 'withdrawn' && e.memberParticipantIds.includes(member.id)
                      );
                    }

                    // Category eligibility check
                    const allowed = targetTeamProgramme.eligibleCategories.map((c) => c.toLowerCase());
                    const allowsGeneral = allowed.includes('general');
                    const memCat = (member.category || '').toLowerCase();
                    const isEligibleCategory = allowed.includes(memCat) || (allowsGeneral && memCat === 'general');

                    const isDisabled = inAnotherEntry || inOtherTeamProg || !isEligibleCategory;

                    return (
                      <label
                        key={member.id}
                        className={`flex items-center justify-between p-2.5 cursor-pointer transition-colors ${
                          isDisabled
                            ? 'opacity-40 bg-slate-50 cursor-not-allowed'
                            : isSelected
                            ? 'bg-purple-50/80'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            disabled={isDisabled}
                            checked={isSelected}
                            onChange={() => handleToggleTeamMember(member)}
                            className="rounded text-purple-600"
                          />
                          <div>
                            <span className="font-semibold text-slate-900">{member.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono ml-2">
                              {member.id} • {member.category}
                            </span>
                          </div>
                        </div>

                        <div>
                          {inAnotherEntry ? (
                            <span className="text-[10px] text-amber-600 font-semibold">Already in another entry</span>
                          ) : inOtherTeamProg ? (
                            <span className="text-[10px] text-rose-600 font-semibold">In another team event</span>
                          ) : !isEligibleCategory ? (
                            <span className="text-[10px] text-rose-600 font-semibold">Ineligible category</span>
                          ) : isSelected ? (
                            <span className="text-[10px] text-purple-700 font-bold">Selected</span>
                          ) : null}
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTeamEntryModalOpen(false)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-purple-700 text-white rounded font-bold hover:bg-purple-800"
              >
                {editingEntry ? 'Update Team Entry' : 'Save Team Entry'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
