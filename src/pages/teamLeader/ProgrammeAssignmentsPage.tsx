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

    // Schedule conflict detection and time-overlap warnings
    const otherAssignments = myTeamAssignments.filter(
      (a) => a.participantIds.includes(participant.id) && a.programmeId !== assigningIndividualProg.id
    );
    for (const otherAsg of otherAssignments) {
      const otherPrg = programmes.find((p) => p.id === otherAsg.programmeId);
      if (
        otherPrg &&
        otherPrg.date === assigningIndividualProg.date &&
        otherPrg.startTime &&
        assigningIndividualProg.startTime &&
        otherPrg.startTime === assigningIndividualProg.startTime
      ) {
        addToast(
          'warning',
          'Time Conflict Alert',
          `${participant.name} is already assigned to "${otherPrg.name}" at the same scheduled time (${otherPrg.date} ${otherPrg.startTime}).`
        );
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Programme Entries & Roster Assignment
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Register eligible participants from <strong className="text-slate-900">{activeTeam?.name || 'Your Team'}</strong> for individual and group competitions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            {myTeamMembers.length} Registered Members
          </span>
        </div>
      </div>

      {/* Primary View Switcher: Individual Programmes vs Team Programmes */}
      <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl max-w-md w-full">
        <button
          onClick={() => {
            setActiveViewTab('individual');
            setStatusFilter('all');
          }}
          className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeViewTab === 'individual'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Solo Events</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-700 font-black">
            {individualProgrammes.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveViewTab('team');
            setStatusFilter('all');
          }}
          className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeViewTab === 'team'
              ? 'bg-white text-purple-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4 text-purple-600 shrink-0" />
          <span>Team Events</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] bg-purple-100 text-purple-800 font-black">
            {teamProgrammes.length}
          </span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search event, code, venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 text-slate-900 bg-white"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {/* Status Filter */}
          <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-50 text-xs shrink-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('assigned')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                statusFilter === 'assigned' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Registered
            </button>
            <button
              onClick={() => setStatusFilter('open')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                statusFilter === 'open' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Open Slots
            </button>
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs sm:text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-800 focus:outline-none shrink-0"
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
                className={`p-4 sm:p-5 rounded-2xl border bg-white flex flex-col justify-between transition-all ${
                  isFull ? 'border-emerald-300 shadow-2xs' : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      {prg.code}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      Solo Event
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug">{prg.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">{prg.category}</p>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{prg.date} • {prg.startTime} - {prg.endTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{prg.venue} ({prg.stage})</span>
                    </div>
                  </div>

                  {/* Eligible Categories */}
                  <div className="mt-3">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Eligible Categories:</span>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {prg.eligibleCategories.map((c) => (
                        <span
                          key={c}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            c === 'General'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* SLOT COUNTER (Requirement 4) */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white p-2 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Limit</span>
                        <span className="text-base font-black text-slate-800">{maxAllowed}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Registered</span>
                        <span className="text-base font-black text-blue-700">{registeredCount}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Available</span>
                        <span className={`text-base font-black ${remainingSlots > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {remainingSlots}
                        </span>
                      </div>
                    </div>

                    {registeredObjs.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200 space-y-1.5">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                          Assigned Contestants:
                        </span>
                        {registeredObjs.map((m) => {
                          const asg = currentAssignments.find((a) => a.participantIds.includes(m.id));
                          return (
                            <div key={m.id} className="flex items-center justify-between text-xs bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                              <span className="font-bold text-slate-800 truncate">
                                {m.name} <span className="text-slate-400 font-normal text-[11px]">(Chest #{m.chestNumber || m.id} • {m.category})</span>
                              </span>
                              {asg && (
                                <button
                                  type="button"
                                  onClick={() => withdrawAssignment(asg.id)}
                                  className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline ml-2"
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
                <div className="mt-4 pt-3 border-t border-slate-100">
                  {remainingSlots > 0 ? (
                    <button
                      type="button"
                      onClick={() => handleOpenIndividualAssign(prg)}
                      className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Register Participant ({remainingSlots} slot{remainingSlots > 1 ? 's' : ''} left)</span>
                    </button>
                  ) : (
                    <div className="text-center py-2.5 text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
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
                  className="p-4 sm:p-5 rounded-2xl border border-purple-200 bg-white shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                          {prg.code}
                        </span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900">
                          Team Programme
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-purple-800 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                        {registeredEntries.length}/{maxEntries} Entries
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug">{prg.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">{prg.category}</p>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 bg-purple-50/40 p-3 rounded-xl border border-purple-100">
                      <div>
                        <span className="text-[10px] text-purple-900 font-bold uppercase tracking-wider block">Team Size:</span>
                        <span className="font-bold text-slate-800">{minMembers} to {maxMembers} members</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-purple-900 font-bold uppercase tracking-wider block">Max Entries:</span>
                        <span className="font-bold text-slate-800">{maxEntries} per team</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-purple-900 font-bold uppercase tracking-wider block">Schedule:</span>
                        <span className="font-mono text-slate-800">{prg.date} • {prg.startTime}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-purple-900 font-bold uppercase tracking-wider block">Venue:</span>
                        <span className="truncate block font-medium text-slate-800">{prg.venue} ({prg.stage})</span>
                      </div>
                    </div>

                    {/* Eligible Categories */}
                    <div className="mt-3">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Eligible Categories:</span>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {prg.eligibleCategories.map((c) => (
                          <span
                            key={c}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              c === 'General'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Registered Entries List */}
                    <div className="mt-3.5 space-y-2">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                        Registered Team Entries ({registeredEntries.length}):
                      </span>

                      {registeredEntries.length === 0 ? (
                        <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-200">
                          No team entries registered yet. Click &quot;Register Team Entry&quot; to form an entry.
                        </p>
                      ) : (
                        registeredEntries.map((entry) => (
                          <div
                            key={entry.id}
                            className="p-3 rounded-xl border border-purple-200 bg-purple-50/30 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs sm:text-sm text-purple-950 flex items-center gap-1.5">
                                <Users className="w-4 h-4 text-purple-600" />
                                {entry.entryName}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                                  {entry.status}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenTeamEntryModal(prg, entry)}
                                  className="text-xs text-slate-600 hover:text-slate-900 p-1"
                                  title="Edit Entry"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteTeamProgrammeEntry(entry.id)}
                                  className="text-xs text-rose-600 hover:text-rose-800 p-1"
                                  title="Withdraw Entry"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="text-xs text-slate-600">
                              <span className="font-bold text-slate-800">Members ({entry.memberParticipantIds.length}):</span>{' '}
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
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    {canAddEntry ? (
                      <button
                        type="button"
                        onClick={() => handleOpenTeamEntryModal(prg)}
                        className="w-full py-2.5 bg-purple-700 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-purple-800 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Register Team Entry ({remainingEntries} available)</span>
                      </button>
                    ) : (
                      <div className="text-center py-2.5 text-xs sm:text-sm font-bold text-purple-800 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-purple-600" />
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
              <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
                Select Eligible Contestant from {activeTeam?.name || 'Your Team'}:
              </label>

              <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                {myTeamMembers.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
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
                        className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                          alreadyAssigned || !isEligibleCategory
                            ? 'opacity-50 bg-slate-50 cursor-not-allowed'
                            : isSelected
                            ? 'bg-blue-50/70 border-l-4 border-blue-600'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="individual_participant"
                            disabled={alreadyAssigned || !isEligibleCategory}
                            checked={isSelected}
                            onChange={() => {
                              setSelectedIndividualParticipantId(member.id);
                              setIndividualModalError('');
                            }}
                            className="w-4 h-4 text-blue-600 cursor-pointer"
                          />
                          <div>
                            <span className="font-bold text-sm text-slate-900 block">{member.name}</span>
                            <span className="text-xs text-slate-500 font-medium">
                              Chest #{member.chestNumber || member.id} • Category: {member.category}
                            </span>
                          </div>
                        </div>

                        <div>
                          {alreadyAssigned ? (
                            <span className="text-xs text-slate-400 italic font-medium">Already Registered</span>
                          ) : !isEligibleCategory ? (
                            <span className="text-xs text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded">Ineligible</span>
                          ) : (
                            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">Eligible</span>
                          )}
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAssigningIndividualProg(null)}
                className="px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedIndividualParticipantId}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-xs"
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
          <form onSubmit={handleSaveTeamEntry} className="space-y-4">
            {teamModalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs sm:text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{teamModalError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Team Entry Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Phoenix Choir Squad A"
                  value={entryName}
                  onChange={(e) => setEntryName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Selected Category *
                </label>
                <select
                  value={entryCategory}
                  onChange={(e) => setEntryCategory(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-purple-500"
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
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 flex flex-wrap items-center justify-between gap-2 text-xs text-purple-900">
              <div>
                Min Required: <strong className="font-bold">{targetTeamProgramme.minTeamMembers || 2} members</strong>
              </div>
              <div>
                Max Allowed: <strong className="font-bold">{targetTeamProgramme.maxTeamMembers || 20} members</strong>
              </div>
              <div>
                Selected:{' '}
                <strong
                  className={`font-bold ${
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
              <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
                Select Team Members for this Entry:
              </label>

              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                {myTeamMembers.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
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
                        className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                          isDisabled
                            ? 'opacity-40 bg-slate-50 cursor-not-allowed'
                            : isSelected
                            ? 'bg-purple-50/80 border-l-4 border-purple-600'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            disabled={isDisabled}
                            checked={isSelected}
                            onChange={() => handleToggleTeamMember(member)}
                            className="w-4 h-4 rounded text-purple-600 cursor-pointer"
                          />
                          <div>
                            <span className="font-bold text-sm text-slate-900 block">{member.name}</span>
                            <span className="text-xs text-slate-500 font-medium">
                              Chest #{member.chestNumber || member.id} • Category: {member.category}
                            </span>
                          </div>
                        </div>

                        <div>
                          {inAnotherEntry ? (
                            <span className="text-xs text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded">In other entry</span>
                          ) : inOtherTeamProg ? (
                            <span className="text-xs text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded">In another event</span>
                          ) : !isEligibleCategory ? (
                            <span className="text-xs text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded">Ineligible</span>
                          ) : isSelected ? (
                            <span className="text-xs text-purple-700 font-bold bg-purple-100 px-2 py-0.5 rounded">Selected</span>
                          ) : null}
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setTeamEntryModalOpen(false)}
                className="px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-purple-700 text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-purple-800 transition-colors shadow-xs"
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
