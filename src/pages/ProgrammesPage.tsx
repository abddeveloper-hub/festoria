import React, { useState, useMemo, useEffect } from 'react';
import { useFest } from '../context/FestContext';
import {
  Programme,
  ProgrammeCategory,
  ProgrammeType,
  ProgrammeStatus,
  ParticipantCategory,
  ScoringCriterion,
  FestCategory,
  Participant
} from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import {
  Search,
  Plus,
  CalendarCheck,
  Eye,
  Edit2,
  Trash2,
  Copy,
  MapPin,
  Clock,
  Users,
  Award,
  Layers,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Shield,
  HelpCircle,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  AlertTriangle
} from 'lucide-react';

export const ProgrammesPage: React.FC = () => {
  const {
    programmes,
    judges,
    teams,
    participants,
    assignments,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    toggleGeneralCategory,
    teamProgrammeEntries,
    createTeamProgrammeEntry,
    updateTeamProgrammeEntry,
    deleteTeamProgrammeEntry,
    addProgramme,
    updateProgramme,
    deleteProgramme,
    updateParticipant,
    publishProgrammeResults,
    deleteProgrammeResults,
    hasPermission,
    addToast,
    navigateToTabWithFilter,
    activeFestId,
  } = useFest();

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState<'all' | 'individual' | 'team'>('all');
  const [filterStageType, setFilterStageType] = useState<'all' | 'stage' | 'off_stage'>('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingProgramme, setEditingProgramme] = useState<Programme | null>(null);
  const [copiedFromTitle, setCopiedFromTitle] = useState<string | null>(null);
  const [viewingProgramme, setViewingProgramme] = useState<Programme | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteResultsId, setConfirmDeleteResultsId] = useState<string | null>(null);

  // Dedicated Roster & Assignments Modal state
  const [managingRosterProg, setManagingRosterProg] = useState<Programme | null>(null);
  const [rosterTeamFilter, setRosterTeamFilter] = useState<string>('');
  const [rosterSearch, setRosterSearch] = useState<string>('');
  const [teamEntrySquadName, setTeamEntrySquadName] = useState<string>('');
  const [selectedSquadMemberIds, setSelectedSquadMemberIds] = useState<string[]>([]);

  const liveManagingRosterProg = useMemo(() => {
    if (!managingRosterProg) return null;
    return programmes.find((p) => p.id === managingRosterProg.id) || managingRosterProg;
  }, [managingRosterProg, programmes]);

  useEffect(() => {
    if (!rosterTeamFilter && teams.length > 0) {
      setRosterTeamFilter(teams[0].id);
    }
  }, [teams, rosterTeamFilter]);

  const handleRemoveParticipantFromProg = (participantId: string, progId: string) => {
    const p = participants.find((item) => item.id === participantId);
    if (!p) return;
    const prog = programmes.find((pr) => pr.id === progId);
    const isTeam = prog?.type === 'group' || prog?.type === 'team' || prog?.programmeType === 'team';

    const nextProgs = (p.registeredProgrammes || []).filter((id) => id !== progId);
    const success = updateParticipant(p.id, { registeredProgrammes: nextProgs });

    if (isTeam) {
      const affectedEntries = teamProgrammeEntries.filter(
        (e) => e.programmeId === progId && (e.memberParticipantIds || []).includes(p.id) && e.status !== 'withdrawn'
      );
      affectedEntries.forEach((entry) => {
        const remaining = entry.memberParticipantIds.filter((id) => id !== p.id);
        if (remaining.length === 0) {
          deleteTeamProgrammeEntry(entry.id);
        } else {
          updateTeamProgrammeEntry(entry.id, { memberParticipantIds: remaining });
        }
      });
    }

    if (success) {
      addToast('success', 'Participant Removed', `Removed ${p.name} from event.`);
    }
  };

  const handleAddParticipantToProg = (participantId: string, progId: string) => {
    const p = participants.find((item) => item.id === participantId);
    if (!p) return;
    const prog = programmes.find((pr) => pr.id === progId);
    const isTeam = prog?.type === 'group' || prog?.type === 'team' || prog?.programmeType === 'team';

    const currentProgs = p.registeredProgrammes || [];
    const nextProgs = currentProgs.includes(progId) ? currentProgs : [...currentProgs, progId];
    const success = updateParticipant(p.id, { registeredProgrammes: nextProgs });

    if (isTeam && prog) {
      const existingEntry = teamProgrammeEntries.find(
        (e) => e.programmeId === progId && e.teamId === p.teamId && e.status !== 'withdrawn'
      );
      if (existingEntry) {
        if (!existingEntry.memberParticipantIds.includes(p.id)) {
          const nextMemberIds = [...existingEntry.memberParticipantIds, p.id];
          updateTeamProgrammeEntry(existingEntry.id, {
            memberParticipantIds: nextMemberIds,
          });
        }
      } else {
        const teamObj = teams.find((t) => t.id === p.teamId);
        const entriesCount = teamProgrammeEntries.filter((e) => e.programmeId === progId && e.teamId === p.teamId).length;
        const letter = String.fromCharCode(65 + entriesCount);
        const entryName = `${teamObj?.name || 'Team'} Entry ${letter}`;
        createTeamProgrammeEntry({
          programmeId: prog.id,
          teamId: p.teamId,
          entryName,
          categoryId: p.category || prog.eligibleCategories?.[0] || 'General',
          memberParticipantIds: [p.id],
        });
      }
    }

    if (success) {
      addToast('success', 'Participant Assigned', `Assigned ${p.name} to event.`);
    }
  };

  // Form Step: 1 to 6
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    rules: '',
    category: 'Music' as ProgrammeCategory,
    type: 'individual' as ProgrammeType,
    stageType: 'stage' as 'stage' | 'off_stage',
    eligibleCategories: ['Senior', 'Junior'] as ParticipantCategory[],
    assignedJudgeIds: [] as string[],

    // Individual limits
    maxParticipantsPerTeam: 2,

    // Team limits
    minTeamMembers: 3,
    maxTeamMembers: 8,
    maxEntriesPerTeam: 1,
    allowMultiTeamProgrammeParticipation: true,
    allowMultiEntriesPerParticipant: false,

    venue: 'Auditorium Hall A',
    stage: 'Stage 1 (Main Hall)',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '12:00',
    maxCapacity: 15,
    status: 'scheduled' as ProgrammeStatus,
    criteria: [
      { id: 'c1', name: 'Originality & Concept', maxMarks: 40 },
      { id: 'c2', name: 'Technique & Execution', maxMarks: 35 },
      { id: 'c3', name: 'Stage Presence & Timing', maxMarks: 25 },
    ] as ScoringCriterion[],
    registeredParticipantIds: [] as string[],
    registeredTeamIds: [] as string[],
  });

  // Limit reduction warning state
  const [limitWarning, setLimitWarning] = useState<string | null>(null);
  const [confirmLimitReduction, setConfirmLimitReduction] = useState(false);

  // Category Manager State
  const [newCatName, setNewCatName] = useState('');
  const [newCatDescription, setNewCatDescription] = useState('');
  const [newCatMinAge, setNewCatMinAge] = useState<string>('');
  const [newCatMaxAge, setNewCatMaxAge] = useState<string>('');

  // Category Edit / Rename State
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatDescription, setEditCatDescription] = useState('');
  const [editCatMinAge, setEditCatMinAge] = useState<string>('');
  const [editCatMaxAge, setEditCatMaxAge] = useState<string>('');

  const distinctDates = useMemo(() => {
    return Array.from(new Set(programmes.map((p) => p.date).filter(Boolean))).sort();
  }, [programmes]);

  const distinctCategories = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => {
      if (c.name) map.set(c.name.trim().toLowerCase(), c.name.trim());
    });
    programmes.forEach((p) => {
      if (p.category) {
        const norm = p.category.trim().toLowerCase();
        if (!map.has(norm)) {
          map.set(norm, p.category.trim());
        }
      }
    });
    return Array.from(map.values()).sort();
  }, [categories, programmes]);

  const generalCat = useMemo(() => {
    return categories.find((c) => c.isGeneral || c.name.toLowerCase() === 'general');
  }, [categories]);

  const activeCategories = useMemo(() => {
    return categories.filter((c) => c.enabled);
  }, [categories]);

  // Filtered Programmes (Ordered strictly by Programme Code)
  const filteredProgrammes = useMemo(() => {
    const list = programmes.filter((p) => {
      const s = search.toLowerCase();
      const matchesSearch =
        (p.name || '').toLowerCase().includes(s) ||
        (p.code || '').toLowerCase().includes(s) ||
        (p.venue || '').toLowerCase().includes(s);
      if (!matchesSearch) return false;

      if (filterCategory !== 'all' && (p.category || '').trim().toLowerCase() !== filterCategory.trim().toLowerCase()) return false;
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;
      if (filterDate !== 'all' && p.date !== filterDate) return false;

      if (filterStageType !== 'all') {
        const pStageType = p.stageType || 'stage';
        if (pStageType !== filterStageType) return false;
      }

      const isTeam = p.type === 'group' || p.type === 'team' || p.programmeType === 'team';
      if (filterType === 'individual' && isTeam) return false;
      if (filterType === 'team' && !isTeam) return false;

      return true;
    });

    // Natural sort by Programme Code (P01, P02, P10...), with fallback to name
    return list.sort((a, b) =>
      (a.code || '').localeCompare(b.code || '', undefined, { numeric: true, sensitivity: 'base' }) ||
      (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
    );
  }, [programmes, search, filterCategory, filterType, filterStageType, filterStatus, filterDate]);

  const handleOpenAdd = () => {
    setEditingProgramme(null);
    setCopiedFromTitle(null);
    setCurrentStep(1);
    setLimitWarning(null);
    setConfirmLimitReduction(false);
    const defaultCat = activeCategories[0]?.name || (categories[0]?.name || 'Senior');
    setFormData({
      code: `EVT-0${programmes.length + 1}`,
      name: '',
      description: '',
      rules: '',
      category: defaultCat,
      type: 'individual',
      stageType: 'stage',
      eligibleCategories: [defaultCat],
      assignedJudgeIds: judges.length > 0 ? [judges[0].id] : [],
      maxParticipantsPerTeam: 2,
      minTeamMembers: 3,
      maxTeamMembers: 8,
      maxEntriesPerTeam: 1,
      allowMultiTeamProgrammeParticipation: true,
      allowMultiEntriesPerParticipant: false,
      venue: 'Auditorium Hall A',
      stage: 'Stage 1',
      date: '2026-11-22',
      startTime: '10:00',
      endTime: '12:00',
      maxCapacity: 16,
      status: 'scheduled',
      criteria: [
        { id: 'c1', name: 'Content & Originality', maxMarks: 40 },
        { id: 'c2', name: 'Technical Precision', maxMarks: 35 },
        { id: 'c3', name: 'Presentation & Timing', maxMarks: 25 },
      ],
      registeredParticipantIds: [],
      registeredTeamIds: [],
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (p: Programme) => {
    setEditingProgramme(p);
    setCopiedFromTitle(null);
    setCurrentStep(1);
    setLimitWarning(null);
    setConfirmLimitReduction(false);
    const isTeam = p.type === 'group' || p.type === 'team' || p.programmeType === 'team';
    setFormData({
      code: p.code,
      name: p.name,
      description: p.description,
      rules: p.rules || '',
      category: p.category,
      type: isTeam ? 'team' : 'individual',
      stageType: p.stageType || 'stage',
      eligibleCategories: p.eligibleCategories?.length ? [...p.eligibleCategories] : (p.category ? [p.category] : ['General']),
      assignedJudgeIds: p.assignedJudgeIds ? [...p.assignedJudgeIds] : (p.judgeIds ? [...p.judgeIds] : []),
      maxParticipantsPerTeam: p.maxParticipantsPerTeam || 2,
      minTeamMembers: p.minTeamMembers || 3,
      maxTeamMembers: p.maxTeamMembers || 8,
      maxEntriesPerTeam: p.maxEntriesPerTeam || 1,
      allowMultiTeamProgrammeParticipation: p.allowMultiTeamProgrammeParticipation ?? true,
      allowMultiEntriesPerParticipant: p.allowMultiEntriesPerParticipant ?? false,
      venue: p.venue,
      stage: p.stage,
      date: p.date,
      startTime: p.startTime,
      endTime: p.endTime,
      maxCapacity: p.maxCapacity || 15,
      status: p.status,
      criteria: (p.criteria || []).map((c) => ({ ...c })),
      registeredParticipantIds: p.registeredParticipantIds ? [...p.registeredParticipantIds] : [],
      registeredTeamIds: p.registeredTeamIds ? [...p.registeredTeamIds] : [],
    });
    setIsAddModalOpen(true);
  };

  const handleOpenCopy = (p: Programme) => {
    setEditingProgramme(null);
    setCopiedFromTitle(p.name);
    setCurrentStep(1);
    setLimitWarning(null);
    setConfirmLimitReduction(false);

    // Auto-generate next unique code based on copied programme code
    const baseCode = p.code.replace(/-COPY(\d*)$/i, '').trim();
    let suggestedCode = `${baseCode}-COPY`;
    let counter = 1;
    while (programmes.some((item) => item.code.trim().toUpperCase() === suggestedCode.toUpperCase())) {
      counter++;
      suggestedCode = `${baseCode}-COPY${counter}`;
    }

    const isTeam = p.type === 'group' || p.type === 'team' || p.programmeType === 'team';

    // Clone scoring criteria with fresh unique IDs
    const clonedCriteria = p.criteria && p.criteria.length > 0
      ? p.criteria.map((c, idx) => ({
          id: `c_${Date.now().toString().slice(-4)}_${idx}`,
          name: c.name,
          maxMarks: c.maxMarks,
        }))
      : [
          { id: 'c1', name: 'Content & Originality', maxMarks: 40 },
          { id: 'c2', name: 'Technical Precision', maxMarks: 35 },
          { id: 'c3', name: 'Presentation & Timing', maxMarks: 25 },
        ];

    setFormData({
      code: suggestedCode,
      name: `${p.name} (Copy)`,
      description: p.description || '',
      rules: p.rules || '',
      category: p.category,
      type: isTeam ? 'team' : 'individual',
      stageType: p.stageType || 'stage',
      eligibleCategories: p.eligibleCategories?.length ? [...p.eligibleCategories] : (p.category ? [p.category] : ['General']),
      assignedJudgeIds: p.assignedJudgeIds ? [...p.assignedJudgeIds] : (p.judgeIds ? [...p.judgeIds] : []),
      maxParticipantsPerTeam: p.maxParticipantsPerTeam || 2,
      minTeamMembers: p.minTeamMembers || 3,
      maxTeamMembers: p.maxTeamMembers || 8,
      maxEntriesPerTeam: p.maxEntriesPerTeam || 1,
      allowMultiTeamProgrammeParticipation: p.allowMultiTeamProgrammeParticipation ?? true,
      allowMultiEntriesPerParticipant: p.allowMultiEntriesPerParticipant ?? false,
      venue: p.venue || 'Auditorium Hall A',
      stage: p.stage || (p.stageType === 'off_stage' ? 'Off-Stage' : 'Stage 1'),
      date: p.date,
      startTime: p.startTime,
      endTime: p.endTime,
      maxCapacity: p.maxCapacity || 16,
      status: 'scheduled',
      criteria: clonedCriteria,
      registeredParticipantIds: [],
      registeredTeamIds: [],
    });
    setIsAddModalOpen(true);
  };

  const duplicateProgramme = handleOpenCopy;

  const handleAddCriterion = () => {
    const id = `c_${Date.now().toString().slice(-4)}`;
    setFormData((prev) => ({
      ...prev,
      criteria: [...prev.criteria, { id, name: 'New Criterion', maxMarks: 20 }],
    }));
  };

  const handleRemoveCriterion = (id: string) => {
    if (formData.criteria.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      criteria: prev.criteria.filter((c) => c.id !== id),
    }));
  };

  // Check for limit reduction issues when saving
  const checkLimitConflicts = (): boolean => {
    if (!editingProgramme) return false;
    const isTeam = formData.type === 'team' || formData.type === 'group';

    if (isTeam) {
      const existingEntries = teamProgrammeEntries.filter((e) => e.programmeId === editingProgramme.id);
      // Group by teamId
      const teamCounts = new Map<string, number>();
      existingEntries.forEach((e) => {
        teamCounts.set(e.teamId, (teamCounts.get(e.teamId) || 0) + 1);
      });
      for (const [tId, count] of teamCounts.entries()) {
        if (count > formData.maxEntriesPerTeam) {
          const tName = teams.find((t) => t.id === tId)?.name || tId;
          setLimitWarning(
            `Notice: Team "${tName}" currently has ${count} registered entries, which is greater than the new limit of ${formData.maxEntriesPerTeam}. Existing registrations will remain intact, but new entries will be blocked.`
          );
          return true;
        }
      }
    } else {
      // Check individual participant counts per team
      const teamCounts = new Map<string, number>();
      participants.forEach((pt) => {
        if (pt.registeredProgrammes.includes(editingProgramme.id)) {
          teamCounts.set(pt.teamId, (teamCounts.get(pt.teamId) || 0) + 1);
        }
      });
      for (const [tId, count] of teamCounts.entries()) {
        if (count > formData.maxParticipantsPerTeam) {
          const tName = teams.find((t) => t.id === tId)?.name || tId;
          setLimitWarning(
            `Notice: Team "${tName}" currently has ${count} participants registered for this event, exceeding the new limit of ${formData.maxParticipantsPerTeam}. Existing registrations will be preserved, but additional signups will be blocked.`
          );
          return true;
        }
      }
    }
    setLimitWarning(null);
    return false;
  };

  const handleSaveProgramme = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Check limit conflicts if editing
    if (editingProgramme && !confirmLimitReduction) {
      const hasConflict = checkLimitConflicts();
      if (hasConflict) {
        setConfirmLimitReduction(true);
        setCurrentStep(6); // Jump to Review step to see warning
        return;
      }
    }

    const isTeam = formData.type === 'team' || formData.type === 'group';
    const effectiveEligible = formData.eligibleCategories.length > 0
      ? formData.eligibleCategories
      : [formData.category];

    const payload = {
      code: formData.code.trim(),
      name: formData.name.trim(),
      description: formData.description.trim(),
      rules: formData.rules.trim(),
      category: formData.category,
      type: formData.type,
      programmeType: isTeam ? ('team' as const) : ('individual' as const),
      stageType: formData.stageType || 'stage',
      eligibleCategories: effectiveEligible,
      assignedJudgeIds: formData.assignedJudgeIds,
      maxParticipantsPerTeam: isTeam ? undefined : formData.maxParticipantsPerTeam,
      minTeamMembers: isTeam ? formData.minTeamMembers : undefined,
      maxTeamMembers: isTeam ? formData.maxTeamMembers : undefined,
      maxEntriesPerTeam: isTeam ? formData.maxEntriesPerTeam : undefined,
      allowMultiTeamProgrammeParticipation: isTeam ? formData.allowMultiTeamProgrammeParticipation : undefined,
      allowMultiEntriesPerParticipant: isTeam ? formData.allowMultiEntriesPerParticipant : undefined,
      venue: formData.venue.trim(),
      stage: formData.stage.trim(),
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      maxCapacity: formData.maxCapacity,
      status: formData.status,
      criteria: formData.criteria,
      registeredParticipantIds: formData.registeredParticipantIds,
      registeredTeamIds: formData.registeredTeamIds,
      festId: activeFestId,
    };

    if (editingProgramme) {
      updateProgramme(editingProgramme.id, payload);
      addToast('success', 'Programme Updated', `Saved configurations for ${payload.name}.`);
      setIsAddModalOpen(false);
      setCopiedFromTitle(null);
    } else {
      const ok = addProgramme(payload);
      if (ok) {
        if (copiedFromTitle) {
          addToast('success', 'Programme Duplicated', `Created "${payload.name}" copied from ${copiedFromTitle}.`);
        } else {
          addToast('success', 'Programme Created', `Added competition ${payload.name}.`);
        }
        setIsAddModalOpen(false);
        setCopiedFromTitle(null);
      }
    }
  };

  const handleCreateCustomCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const minA = newCatMinAge ? parseInt(newCatMinAge, 10) : undefined;
    const maxA = newCatMaxAge ? parseInt(newCatMaxAge, 10) : undefined;

    if (minA !== undefined && maxA !== undefined && minA > maxA) {
      addToast('error', 'Invalid Age Range', 'Minimum age cannot exceed maximum age.');
      return;
    }

    const success = await addCategory({
      festId: activeFestId,
      name: newCatName.trim(),
      description: newCatDescription.trim() || undefined,
      minAge: minA,
      maxAge: maxA,
      enabled: true,
      isSystem: false,
    });

    if (success) {
      setNewCatName('');
      setNewCatDescription('');
      setNewCatMinAge('');
      setNewCatMaxAge('');
    }
  };

  const handleStartEditCat = (cat: FestCategory) => {
    setEditingCatId(cat.id);
    setEditCatName(cat.name);
    setEditCatDescription(cat.description || '');
    setEditCatMinAge(cat.minAge !== undefined ? String(cat.minAge) : '');
    setEditCatMaxAge(cat.maxAge !== undefined ? String(cat.maxAge) : '');
  };

  const handleSaveEditCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCatId) return;
    const trimmed = editCatName.trim();
    if (!trimmed) {
      addToast('error', 'Category Name Required', 'Please provide a valid category name.');
      return;
    }
    const min = editCatMinAge !== '' ? parseInt(editCatMinAge, 10) : undefined;
    const max = editCatMaxAge !== '' ? parseInt(editCatMaxAge, 10) : undefined;

    await updateCategory(editingCatId, {
      name: trimmed,
      description: editCatDescription.trim(),
      minAge: min !== undefined && !isNaN(min) ? min : undefined,
      maxAge: max !== undefined && !isNaN(max) ? max : undefined,
    });
    setEditingCatId(null);
  };

  const canManage = hasPermission(['super_admin', 'admin', 'fest_admin', 'programme_manager']);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-900">Programmes & Competitions</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure competitions, participant limits, eligible categories, venues, and rubrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canManage && (
            <>
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span>Categories & Age Groups</span>
                {generalCat?.enabled && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="General Category Active" />
                )}
              </button>
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Programme</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search programme, code, venue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:border-slate-400 text-slate-800"
            />
          </div>

          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-400 text-slate-800"
            >
              <option value="all">All Types (Individual & Team)</option>
              <option value="individual">Individual Programmes Only</option>
              <option value="team">Team Programmes Only</option>
            </select>
          </div>

          <div>
            <select
              value={filterStageType}
              onChange={(e) => setFilterStageType(e.target.value as any)}
              className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-400 text-slate-800"
            >
              <option value="all">All Modes (Stage & Off-Stage)</option>
              <option value="stage">🎭 Stage (On-Stage)</option>
              <option value="off_stage">📝 Off-Stage</option>
            </select>
          </div>

          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-400 text-slate-800"
            >
              <option value="all">All Categories ({programmes.length})</option>
              {distinctCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-400 text-slate-800"
            >
              <option value="all">All Dates</option>
              {distinctDates.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-400 text-slate-800"
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="draft">Draft</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Programme Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProgrammes.map((prog) => {
          const assignedJudges = judges.filter((j) => (prog.assignedJudgeIds || prog.judgeIds || []).includes(j.id));
          const totalMarks = (prog.criteria || []).reduce((s, c) => s + c.maxMarks, 0);
          const isTeam = prog.type === 'group' || prog.type === 'team' || prog.programmeType === 'team';
          const teamEntries = teamProgrammeEntries.filter((e) => e.programmeId === prog.id && e.status !== 'withdrawn');
          const teamEntriesCount = teamEntries.length;
          const isOffStage = prog.stageType === 'off_stage';

          // Dynamically compute real registered participants across all sources:
          const registeredParticipantIdsSet = new Set<string>();
          participants.forEach((p) => {
            if (p.registeredProgrammes?.includes(prog.id) && p.status !== 'inactive') {
              registeredParticipantIdsSet.add(p.id);
            }
          });
          (prog.registeredParticipantIds || []).forEach((id) => registeredParticipantIdsSet.add(id));
          (assignments || []).forEach((asg) => {
            if (asg.programmeId === prog.id) {
              (asg.participantIds || []).forEach((pid) => registeredParticipantIdsSet.add(pid));
            }
          });
          teamEntries.forEach((e) => {
            (e.memberParticipantIds || []).forEach((pid) => registeredParticipantIdsSet.add(pid));
          });
          const registeredCount = registeredParticipantIdsSet.size;

          return (
            <div
              key={prog.id}
              className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {prog.code}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          isTeam
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {isTeam ? 'Team Event' : 'Individual'}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          isOffStage
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                        }`}
                      >
                        {isOffStage ? '📝 Off-Stage' : '🎭 Stage'}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 mt-1.5 leading-snug">
                      {prog.name}
                    </h3>
                  </div>
                  <Badge variant={prog.status} size="sm">
                    {prog.status}
                  </Badge>
                </div>

                <p className="mt-2 text-[11px] text-slate-500 line-clamp-2">
                  {prog.description || 'No description provided.'}
                </p>

                <div className="mt-3 space-y-1.5 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">
                      {prog.venue} ({prog.stage})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="font-mono">
                      {prog.date} • {prog.startTime} - {prog.endTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">
                      {assignedJudges.length > 0
                        ? assignedJudges.map((j) => j.name).join(', ')
                        : 'No judges assigned'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setManagingRosterProg(prog);
                      setRosterTeamFilter(teams[0]?.id || '');
                    }}
                    className="flex items-center gap-1.5 text-xs text-purple-700 hover:text-purple-900 font-semibold hover:underline text-left cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                    <span>
                      {isTeam
                        ? `${teamEntriesCount} team ${teamEntriesCount === 1 ? 'entry' : 'entries'} (${registeredCount} participants) • Roster &rarr;`
                        : `${registeredCount} participant${registeredCount === 1 ? '' : 's'} registered • Assign &rarr;`}
                    </span>
                  </button>
                </div>

                {/* Categories badges */}
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {(prog.eligibleCategories || (prog.category ? [prog.category] : ['General'])).map((cat) => (
                    <span
                      key={cat}
                      className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                        cat === 'General'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {cat}
                    </span>
                  ))}
                </div>

                {/* Criteria Pill & Publication Status */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-mono">
                    {(prog.criteria || []).length} criteria ({totalMarks} pts)
                  </span>
                  {prog.resultPublished ? (
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-[10px]">
                        <CheckCircle2 className="w-3 h-3" /> Results Live
                      </span>
                      {canManage && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteResultsId(prog.id);
                          }}
                          className="text-[10px] text-rose-600 hover:text-rose-800 hover:underline font-semibold"
                          title="Delete added results for this programme"
                        >
                          Delete Results
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400 text-[10px]">Unpublished</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewingProgramme(prog)}
                    className="text-xs font-semibold text-slate-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>

                  {canManage && (
                    <button
                      type="button"
                      onClick={() => {
                        setManagingRosterProg(prog);
                        setRosterTeamFilter(teams[0]?.id || '');
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                      title="Manage participants assigned to this event"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Roster ({isTeam ? `${teamEntriesCount} teams (${registeredCount} pts)` : registeredCount})</span>
                    </button>
                  )}
                </div>

                {canManage && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenCopy(prog)}
                      className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                      title="Duplicate / Copy Programme"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(prog)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      title="Edit Programme"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingId(prog.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Delete Programme"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* =========================================================================
          UPGRADED 6-SECTION PROGRAMME CREATION, EDIT & DUPLICATE MODAL
          ========================================================================= */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setCopiedFromTitle(null);
        }}
        title={
          editingProgramme
            ? `Edit Programme: ${editingProgramme.name}`
            : copiedFromTitle
            ? `Duplicate Programme: ${copiedFromTitle}`
            : 'Create New Competition Programme'
        }
        maxWidth="2xl"
      >
        <div className="space-y-4">
          {/* Duplicate Notice Banner */}
          {copiedFromTitle && !editingProgramme && (
            <div className="p-3 bg-indigo-50/90 border border-indigo-200 rounded-lg flex items-center justify-between text-indigo-950 text-xs shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 flex-shrink-0">
                  <Copy className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <span>Duplicating from:</span>
                    <span className="text-indigo-800 underline underline-offset-2">{copiedFromTitle}</span>
                  </div>
                  <div className="text-[11px] text-indigo-700 mt-0.5">
                    Function settings, stage mode, venue, rubric criteria, and participation limits have been pre-filled. Customize any fields below and publish.
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* 6-Step Navigation Header */}
          <div className="grid grid-cols-6 gap-1 pb-3 border-b border-slate-200">
            {[
              { num: 1, label: 'Basic' },
              { num: 2, label: 'Type' },
              { num: 3, label: 'Limits' },
              { num: 4, label: 'Rubric' },
              { num: 5, label: 'Schedule' },
              { num: 6, label: 'Review' },
            ].map((step) => {
              const isActive = currentStep === step.num;
              const isPast = currentStep > step.num;
              return (
                <button
                  key={step.num}
                  type="button"
                  onClick={() => setCurrentStep(step.num)}
                  className={`flex flex-col items-center py-1.5 px-1 rounded transition-colors text-center ${
                    isActive
                      ? 'bg-slate-900 text-white font-bold'
                      : isPast
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span className="text-[10px] uppercase font-mono tracking-tight">{step.num}. {step.label}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSaveProgramme} className="space-y-4">
            {/* SECTION 1: BASIC PROGRAMME DETAILS */}
            {currentStep === 1 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">1</span>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Basic Programme Details</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Programme Code *</label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono uppercase"
                      placeholder="e.g. EVT-01"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Programme Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs"
                      placeholder="e.g. Classical Solo Vocal"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Competition Category *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="text-[10px] text-indigo-600 hover:underline font-semibold flex items-center gap-1"
                    >
                      <Sliders className="w-3 h-3" /> Manage / Rename Categories
                    </button>
                  </div>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => {
                      const selected = e.target.value;
                      setFormData({
                        ...formData,
                        category: selected,
                        eligibleCategories: [selected],
                      });
                    }}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white font-medium text-slate-900"
                  >
                    {activeCategories.length === 0 ? (
                      <option value="">No active categories — Click Manage Categories</option>
                    ) : (
                      activeCategories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name} {c.isGeneral ? '(General / Any Age)' : c.minAge || c.maxAge ? `(Ages ${c.minAge || 0}-${c.maxAge || 'Open'})` : ''}
                        </option>
                      ))
                    )}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Programme competition category. Participants in this category will be eligible to register.
                  </p>
                </div>

                {/* STAGE VS OFF-STAGE FUNCTION SELECTION */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Programme Function / Venue Mode *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          stageType: 'stage',
                          stage: formData.stage === 'Off-Stage' ? 'Stage 1' : formData.stage,
                        })
                      }
                      className={`p-3 rounded-lg border-2 text-left transition-all flex items-center justify-between ${
                        formData.stageType === 'stage'
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">🎭</span>
                        <div>
                          <div className="text-xs font-bold leading-tight">Stage (On-Stage)</div>
                          <div className="text-[10px] text-slate-500 font-normal mt-0.5">Live performance on stage</div>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="stage_mode"
                        checked={formData.stageType === 'stage'}
                        onChange={() => {}}
                        className="text-indigo-600"
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          stageType: 'off_stage',
                          stage: 'Off-Stage',
                        })
                      }
                      className={`p-3 rounded-lg border-2 text-left transition-all flex items-center justify-between ${
                        formData.stageType === 'off_stage'
                          ? 'border-amber-600 bg-amber-50/70 text-amber-950 font-bold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">📝</span>
                        <div>
                          <div className="text-xs font-bold leading-tight">Off-Stage</div>
                          <div className="text-[10px] text-slate-500 font-normal mt-0.5">Written / arts / classroom / room</div>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="stage_mode"
                        checked={formData.stageType === 'off_stage'}
                        onChange={() => {}}
                        className="text-amber-600"
                      />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Description & Overview</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                    placeholder="Short description of this event"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Official Rules & Guidelines</label>
                  <textarea
                    rows={2}
                    value={formData.rules}
                    onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs"
                    placeholder="Time limit, accompaniment rules, prop allowances, etc."
                  />
                </div>
              </div>
            )}

            {/* SECTION 2: PROGRAMME TYPE */}
            {currentStep === 2 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">2</span>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Programme Type – Individual or Team</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <label
                    onClick={() => setFormData({ ...formData, type: 'individual' })}
                    className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.type === 'individual'
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Individual Programme</span>
                      <input
                        type="radio"
                        name="programme_type"
                        checked={formData.type === 'individual'}
                        onChange={() => setFormData({ ...formData, type: 'individual' })}
                        className="text-slate-900"
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-600 leading-relaxed">
                      One participant competes individually (e.g. Speech, Essay Writing, Quran Recitation, Singing).
                    </p>
                    <div className="mt-2 text-[10px] text-slate-400 font-mono">
                      Configures maximum participants from each team.
                    </div>
                  </label>

                  <label
                    onClick={() => setFormData({ ...formData, type: 'team' })}
                    className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.type === 'team' || formData.type === 'group'
                        ? 'border-purple-600 bg-purple-50/50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-950">Team Programme</span>
                      <input
                        type="radio"
                        name="programme_type"
                        checked={formData.type === 'team' || formData.type === 'group'}
                        onChange={() => setFormData({ ...formData, type: 'team' })}
                        className="text-purple-600"
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-600 leading-relaxed">
                      A group of participants from one team competes together (e.g. Group Song, Group Dance, Quiz Team, Mime, Drama).
                    </p>
                    <div className="mt-2 text-[10px] text-purple-700 font-mono">
                      Configures min/max members per entry, entries per team, and multi-team participation limits.
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* SECTION 3: PARTICIPANT AND TEAM LIMITS */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">3</span>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    {formData.type === 'individual' ? 'Individual Programme Limits Per Team' : 'Team Programme Participation Limits'}
                  </h3>
                </div>

                {formData.type === 'individual' ? (
                  /* INDIVIDUAL LIMITS */
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1">
                        Maximum Participants Per Team / Institution *
                      </label>
                      <p className="text-[11px] text-slate-500 mb-2">
                        How many individual participants can represent each team/institution in this event (e.g. Speech - 2, Essay - 3).
                      </p>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        required
                        value={formData.maxParticipantsPerTeam}
                        onChange={(e) =>
                          setFormData({ ...formData, maxParticipantsPerTeam: Math.max(1, parseInt(e.target.value, 10) || 1) })
                        }
                        className="w-32 border border-slate-300 rounded px-3 py-1.5 text-xs font-bold font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  /* TEAM PROGRAMME LIMITS */
                  <div className="bg-purple-50/40 p-3.5 rounded-lg border border-purple-200 space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-900 mb-1">
                          Minimum Members Per Entry *
                        </label>
                        <p className="text-[10px] text-slate-500 mb-1.5">Required min performers</p>
                        <input
                          type="number"
                          min={2}
                          max={50}
                          required
                          value={formData.minTeamMembers}
                          onChange={(e) =>
                            setFormData({ ...formData, minTeamMembers: Math.max(2, parseInt(e.target.value, 10) || 2) })
                          }
                          className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-900 mb-1">
                          Maximum Members Per Entry *
                        </label>
                        <p className="text-[10px] text-slate-500 mb-1.5">Max performers per entry</p>
                        <input
                          type="number"
                          min={formData.minTeamMembers}
                          max={100}
                          required
                          value={formData.maxTeamMembers}
                          onChange={(e) =>
                            setFormData({ ...formData, maxTeamMembers: Math.max(formData.minTeamMembers, parseInt(e.target.value, 10) || formData.minTeamMembers) })
                          }
                          className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-900 mb-1">
                          Max Entries Per Team *
                        </label>
                        <p className="text-[10px] text-slate-500 mb-1.5">Entries per house/college</p>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          required
                          value={formData.maxEntriesPerTeam}
                          onChange={(e) =>
                            setFormData({ ...formData, maxEntriesPerTeam: Math.max(1, parseInt(e.target.value, 10) || 1) })
                          }
                          className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-purple-200/60 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.allowMultiTeamProgrammeParticipation}
                          onChange={(e) =>
                            setFormData({ ...formData, allowMultiTeamProgrammeParticipation: e.target.checked })
                          }
                          className="rounded text-purple-600"
                        />
                        <span className="text-xs font-medium text-slate-800">
                          Allow participants to join more than one team programme across the festival
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.allowMultiEntriesPerParticipant}
                          onChange={(e) =>
                            setFormData({ ...formData, allowMultiEntriesPerParticipant: e.target.checked })
                          }
                          className="rounded text-purple-600"
                        />
                        <span className="text-xs font-medium text-slate-800">
                          Allow participants to join multiple entries within this same programme (if team has multiple entries)
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 4: SCORING CONFIGURATION */}
            {currentStep === 4 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">4</span>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Scoring Configuration & Rubrics</h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCriterion}
                    className="text-[11px] font-semibold text-slate-800 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Criterion
                  </button>
                </div>

                <div className="space-y-2 border border-slate-200 rounded p-2.5 bg-slate-50/40">
                  {formData.criteria.map((crit, idx) => (
                    <div key={crit.id} className="flex items-center gap-2">
                      <span className="font-mono text-slate-400 text-[10px] w-4">{idx + 1}.</span>
                      <input
                        type="text"
                        value={crit.name}
                        onChange={(e) => {
                          const updated = [...formData.criteria];
                          updated[idx].name = e.target.value;
                          setFormData({ ...formData, criteria: updated });
                        }}
                        placeholder="Criterion Name"
                        className="flex-1 border border-slate-300 rounded px-2 py-1 text-xs"
                      />
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={crit.maxMarks}
                          onChange={(e) => {
                            const updated = [...formData.criteria];
                            updated[idx].maxMarks = Number(e.target.value);
                            setFormData({ ...formData, criteria: updated });
                          }}
                          className="w-16 border border-slate-300 rounded px-2 py-1 text-xs font-mono text-right"
                        />
                        <span className="text-slate-400 text-[10px]">pts</span>
                      </div>
                      {formData.criteria.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCriterion(crit.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="text-right text-xs font-mono font-bold text-slate-700">
                  Total Evaluation Marks: {formData.criteria.reduce((s, c) => s + c.maxMarks, 0)} pts
                </div>
              </div>
            )}

            {/* SECTION 5: SCHEDULE */}
            {currentStep === 5 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">5</span>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Schedule & Venue</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Venue *</label>
                    <input
                      type="text"
                      required
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs"
                      placeholder="e.g. Auditorium Hall A"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      {formData.stageType === 'off_stage' ? 'Room / Hall / Venue Desk *' : 'Stage / Platform *'}
                    </label>
                    <input
                      type="text"
                      value={formData.stage}
                      onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs"
                      placeholder={formData.stageType === 'off_stage' ? 'e.g. Hall 2B, Library, Room 101' : 'e.g. Stage 1 (Main Hall)'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Start Time *</label>
                    <input
                      type="time"
                      required
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">End Time *</label>
                    <input
                      type="time"
                      required
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as ProgrammeStatus })}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white"
                    >
                      <option value="draft">Draft</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Overall Venue Capacity</label>
                    <input
                      type="number"
                      value={formData.maxCapacity}
                      onChange={(e) => setFormData({ ...formData, maxCapacity: Number(e.target.value) })}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs"
                      placeholder="15"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Assigned Judges ({formData.assignedJudgeIds.length} assigned)
                  </label>
                  <div className="max-h-28 overflow-y-auto border border-slate-200 rounded p-2 bg-slate-50/50 space-y-1">
                    {judges.map((j) => {
                      const checked = formData.assignedJudgeIds.includes(j.id);
                      return (
                        <label key={j.id} className="flex items-center gap-2 cursor-pointer text-xs">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const next = checked
                                ? formData.assignedJudgeIds.filter((id) => id !== j.id)
                                : [...formData.assignedJudgeIds, j.id];
                              setFormData({ ...formData, assignedJudgeIds: next });
                            }}
                            className="rounded border-slate-300 text-slate-900"
                          />
                          <span className="font-semibold text-slate-800">{j.name}</span>
                          <span className="text-slate-400 font-mono text-[10px]">({j.designation})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 6: REVIEW AND PUBLISH */}
            {currentStep === 6 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">6</span>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Review Configuration</h3>
                </div>

                {limitWarning && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-2.5 text-amber-900 text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Limit Conflict Notice</span>
                      <p className="mt-0.5 text-[11px]">{limitWarning}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Code & Name</span>
                    <p className="font-bold text-slate-900">{formData.code} - {formData.name}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Category & Mode</span>
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{formData.category}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                        formData.stageType === 'off_stage'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {formData.stageType === 'off_stage' ? '📝 Off-Stage' : '🎭 Stage'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Event Type</span>
                    <p className="font-bold text-slate-900 capitalize">
                      {formData.type === 'team' || formData.type === 'group' ? 'Team Event' : 'Individual Event'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Limits</span>
                    <p className="font-bold text-slate-900">
                      {formData.type === 'team' || formData.type === 'group'
                        ? `${formData.minTeamMembers}-${formData.maxTeamMembers} members, max ${formData.maxEntriesPerTeam} entries`
                        : `Max ${formData.maxParticipantsPerTeam} participants/team`}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Venue & Stage:</span>
                    <span className="font-semibold text-slate-800">{formData.venue} ({formData.stage})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Scheduled Date & Time:</span>
                    <span className="font-semibold text-slate-800 font-mono">{formData.date} • {formData.startTime} - {formData.endTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Evaluation Criteria:</span>
                    <span className="font-semibold text-slate-800">{formData.criteria.length} criteria ({formData.criteria.reduce((s, c) => s + c.maxMarks, 0)} total marks)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Assigned Judges:</span>
                    <span className="font-semibold text-slate-800">{formData.assignedJudgeIds.length} judges empanelled</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step Navigation Footer */}
            <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
              <div>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="px-3 py-1.5 text-xs text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 inline-flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Previous
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
                >
                  Cancel
                </button>

                {currentStep < 6 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="px-4 py-1.5 text-xs text-white bg-slate-900 rounded hover:bg-slate-800 font-medium inline-flex items-center gap-1"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSaveProgramme()}
                    className="px-4 py-1.5 text-xs text-white bg-slate-900 rounded hover:bg-slate-800 font-bold"
                  >
                    {editingProgramme
                      ? 'Save Changes'
                      : copiedFromTitle
                      ? 'Publish Copied Programme'
                      : 'Publish Programme'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </Modal>

      {/* =========================================================================
          CATEGORY MANAGER MODAL (General Category + Custom Categories with Age Limits)
          ========================================================================= */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Category Management – General & Custom Categories"
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs">
          {/* General Category Control Card */}
          <div className="p-3.5 rounded-lg border-2 border-amber-300 bg-amber-50/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold">
                  G
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">General Category</h4>
                  <p className="text-[11px] text-slate-600">
                    Participants of any age or class can participate in General Category programmes. No min or max age restriction.
                  </p>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => toggleGeneralCategory(!generalCat?.enabled)}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                    generalCat?.enabled
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {generalCat?.enabled ? 'Active / Enabled' : 'Disabled'}
                </button>
              </div>
            </div>
          </div>

          {/* Categories List */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Configured Categories ({categories.length})
            </h4>
            <div className="space-y-2">
              {categories.map((cat) => {
                const isGeneral = cat.isGeneral || cat.name.toLowerCase() === 'general';
                const isEditing = editingCatId === cat.id;

                if (isEditing) {
                  return (
                    <form
                      key={cat.id}
                      onSubmit={handleSaveEditCat}
                      className="p-3.5 rounded-lg border-2 border-indigo-500 bg-indigo-50/40 space-y-3"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-indigo-200">
                        <span className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                          <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
                          Rename & Edit Category: <strong className="text-slate-900">{cat.name}</strong>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {cat.id}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                            Category Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={editCatName}
                            onChange={(e) => setEditCatName(e.target.value)}
                            placeholder="e.g. Senior, College Division, Under-18"
                            className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs bg-white font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                            Min Age (Optional)
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={editCatMinAge}
                            onChange={(e) => setEditCatMinAge(e.target.value)}
                            placeholder="e.g. 15"
                            className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs bg-white focus:outline-none focus:border-indigo-600"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                            Max Age (Optional)
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={editCatMaxAge}
                            onChange={(e) => setEditCatMaxAge(e.target.value)}
                            placeholder="e.g. 25"
                            className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs bg-white focus:outline-none focus:border-indigo-600"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                          Description & Eligibility Criteria (Optional)
                        </label>
                        <input
                          type="text"
                          value={editCatDescription}
                          onChange={(e) => setEditCatDescription(e.target.value)}
                          placeholder="e.g. Open to higher secondary, pre-degree, or collegiate competitors"
                          className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs bg-white focus:outline-none focus:border-indigo-600"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-amber-700 font-medium">
                          Renaming will automatically update all programmes, participants, and scoreboards linked to this category.
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingCatId(null)}
                            className="px-2.5 py-1 rounded border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-medium"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-3 py-1 rounded bg-indigo-600 text-white font-bold hover:bg-indigo-700 text-xs shadow-2xs"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    </form>
                  );
                }

                return (
                  <div
                    key={cat.id}
                    className="p-3 rounded border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-slate-300 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{cat.name}</span>
                        {isGeneral ? (
                          <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                            Built-in (Any Age)
                          </span>
                        ) : cat.isSystem ? (
                          <span className="text-[9px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            Default Category
                          </span>
                        ) : (
                          <span className="text-[9px] font-semibold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
                            Custom
                          </span>
                        )}
                        <span
                          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                            cat.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {cat.enabled ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {cat.description ||
                          (cat.minAge || cat.maxAge
                            ? `Eligible ages: ${cat.minAge || 0} to ${cat.maxAge || 'unrestricted'}`
                            : 'No age restrictions.')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStartEditCat(cat)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-[11px] font-semibold transition-colors"
                        title="Change name, age limits, or description"
                      >
                        <Edit2 className="w-3 h-3 text-slate-600" />
                        <span>Rename / Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateCategory(cat.id, { enabled: !cat.enabled })}
                        className="text-[11px] font-medium text-slate-600 hover:text-slate-900 underline px-1"
                      >
                        {cat.enabled ? 'Disable' : 'Enable'}
                      </button>

                      {!cat.isSystem && (
                        <button
                          type="button"
                          onClick={() => deleteCategory(cat.id)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                          title="Delete Custom Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Custom Category Form */}
          <form onSubmit={handleCreateCustomCategory} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Add Custom Category (with Optional Age Limits)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kiddies, Super Senior"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Min Age (Optional)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="e.g. 18"
                  value={newCatMinAge}
                  onChange={(e) => setNewCatMinAge(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Max Age (Optional)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="e.g. 30"
                  value={newCatMaxAge}
                  onChange={(e) => setNewCatMaxAge(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Description (Optional)</label>
              <input
                type="text"
                placeholder="Guidelines or academic eligibility notes"
                value={newCatDescription}
                onChange={(e) => setNewCatDescription(e.target.value)}
                className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white"
              />
            </div>

            <div className="text-right">
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-bold hover:bg-slate-800"
              >
                Add Category
              </button>
            </div>
          </form>

          <div className="pt-2 text-right">
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(false)}
              className="px-4 py-1.5 bg-slate-200 text-slate-800 rounded font-medium text-xs hover:bg-slate-300"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* View Programme Details Modal */}
      {viewingProgramme && (
        <Modal
          isOpen={!!viewingProgramme}
          onClose={() => setViewingProgramme(null)}
          title={`Programme: ${viewingProgramme.name} (${viewingProgramme.code})`}
          maxWidth="xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-slate-50 rounded border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Category</span>
                <p className="font-semibold text-slate-900">{viewingProgramme.category}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Type</span>
                <p className="font-semibold text-slate-900 capitalize">
                  {viewingProgramme.type === 'team' || viewingProgramme.type === 'group' || viewingProgramme.programmeType === 'team'
                    ? 'Team Event'
                    : 'Individual'}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Status</span>
                <p className="mt-0.5">
                  <Badge variant={viewingProgramme.status} size="sm">
                    {viewingProgramme.status}
                  </Badge>
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Results Status</span>
                <p className="mt-0.5">
                  {viewingProgramme.resultPublished ? (
                    <Badge variant="published" size="sm">Published</Badge>
                  ) : (
                    <Badge variant="draft" size="sm">Unpublished</Badge>
                  )}
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Eligible Categories</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {(viewingProgramme.eligibleCategories || (viewingProgramme.category ? [viewingProgramme.category] : ['General'])).map((c) => (
                  <span key={c} className="px-2 py-0.5 rounded bg-white border border-slate-300 font-semibold text-slate-800 text-[10px]">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Description</span>
              <p className="mt-1 text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200">
                {viewingProgramme.description || 'No description provided.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-slate-900 mb-1.5">Schedule & Venue</h4>
                <div className="space-y-1 text-slate-700 border border-slate-200 rounded p-2.5 bg-slate-50">
                  <div>Venue: {viewingProgramme.venue}</div>
                  <div>Stage: {viewingProgramme.stage}</div>
                  <div className="font-mono">Date: {viewingProgramme.date}</div>
                  <div className="font-mono">Time: {viewingProgramme.startTime} - {viewingProgramme.endTime}</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-1.5">Scoring Rubric</h4>
                <div className="border border-slate-200 rounded p-2.5 bg-slate-50 space-y-1">
                  {(viewingProgramme.criteria || []).map((c) => (
                    <div key={c.id} className="flex justify-between">
                      <span className="text-slate-800">{c.name}</span>
                      <span className="font-mono font-bold text-slate-700">{c.maxMarks} marks</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Registered Participants & Contingent Entries Roster */}
            {(() => {
              const isViewingTeam = viewingProgramme.type === 'group' || viewingProgramme.type === 'team' || viewingProgramme.programmeType === 'team';
              const viewingPids = new Set<string>();
              participants.forEach((p) => {
                if (p.registeredProgrammes?.includes(viewingProgramme.id) && p.status !== 'inactive') {
                  viewingPids.add(p.id);
                }
              });
              (viewingProgramme.registeredParticipantIds || []).forEach((id) => viewingPids.add(id));
              (assignments || []).forEach((asg) => {
                if (asg.programmeId === viewingProgramme.id) {
                  (asg.participantIds || []).forEach((pid) => viewingPids.add(pid));
                }
              });
              teamProgrammeEntries
                .filter((e) => e.programmeId === viewingProgramme.id && e.status !== 'withdrawn')
                .forEach((e) => {
                  (e.memberParticipantIds || []).forEach((pid) => viewingPids.add(pid));
                });

              const viewingParticipants = participants
                .filter((p) => viewingPids.has(p.id))
                .sort((a, b) => {
                  if (a.chestNumber && b.chestNumber) {
                    return a.chestNumber.localeCompare(b.chestNumber, undefined, { numeric: true, sensitivity: 'base' });
                  }
                  if (a.chestNumber) return -1;
                  if (b.chestNumber) return 1;
                  return (a.name || '').localeCompare(b.name || '');
                });

              const viewingTeamEntries = teamProgrammeEntries.filter(
                (e) => e.programmeId === viewingProgramme.id && e.status !== 'withdrawn'
              );

              return (
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-600" />
                      {isViewingTeam
                        ? `Registered Team Entries (${viewingTeamEntries.length}) • ${viewingParticipants.length} Total Participants`
                        : `Registered Participants (${viewingParticipants.length}${viewingProgramme.maxCapacity ? ` / ${viewingProgramme.maxCapacity}` : ''})`}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {isViewingTeam
                        ? `Max ${viewingProgramme.maxEntriesPerTeam || 1}/team • ${viewingProgramme.minTeamMembers || 2}-${viewingProgramme.maxTeamMembers || 10} members`
                        : `Team Quota: Max ${viewingProgramme.maxParticipantsPerTeam || 1}/team`}
                    </span>
                  </div>

                  {isViewingTeam ? (
                    viewingTeamEntries.length === 0 && viewingParticipants.length === 0 ? (
                      <p className="text-slate-400 italic text-[11px] py-1.5 text-center">
                        No team entries or participants registered yet for this event.
                      </p>
                    ) : (
                      <div className="space-y-2.5 max-h-56 overflow-y-auto mt-2 pr-1">
                        {viewingTeamEntries.map((entry) => {
                          const tm = teams.find((t) => t.id === entry.teamId);
                          const memberList = (entry.memberParticipantIds || [])
                            .map((pid) => participants.find((p) => p.id === pid))
                            .filter(Boolean) as Participant[];

                          return (
                            <div key={entry.id} className="p-2.5 bg-white rounded-lg border border-slate-200">
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-slate-900">{entry.entryName || entry.teamName}</span>
                                    <span className="text-[10px] font-mono bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded font-bold">
                                      {tm?.code || entry.teamId}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-medium">
                                      {tm?.name}
                                    </span>
                                  </div>
                                </div>
                                <Badge variant={entry.status === 'verified' ? 'active' : 'pending'} size="sm">
                                  {entry.status}
                                </Badge>
                              </div>

                              {/* Members list */}
                              <div className="mt-2 pt-2 border-t border-slate-100">
                                <div className="text-[10px] font-semibold text-slate-500 mb-1">
                                  Squad Members ({memberList.length}):
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {memberList.length > 0 ? (
                                    memberList.map((m) => (
                                      <span
                                        key={m.id}
                                        className="inline-flex items-center gap-1 text-[10px] bg-slate-50 border border-slate-200 text-slate-800 px-1.5 py-0.5 rounded"
                                      >
                                        <strong className="text-purple-700 font-mono">
                                          {m.chestNumber ? `#${m.chestNumber}` : m.id}
                                        </strong>
                                        <span>{m.name}</span>
                                        <span className="text-[9px] text-slate-400">({m.category})</span>
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic">
                                      {entry.memberNames && entry.memberNames.length > 0
                                        ? entry.memberNames.join(', ')
                                        : 'No member records found'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Unassigned / Direct registered participants */}
                        {(() => {
                          const inEntriesIds = new Set(
                            viewingTeamEntries.flatMap((e) => e.memberParticipantIds || [])
                          );
                          const directMembers = viewingParticipants.filter((p) => !inEntriesIds.has(p.id));
                          if (directMembers.length === 0) return null;

                          return (
                            <div className="mt-3 pt-2.5 border-t border-dashed border-slate-300">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                                Direct Registered Participants ({directMembers.length})
                              </span>
                              <div className="space-y-1">
                                {directMembers.map((pt) => {
                                  const tm = teams.find((t) => t.id === pt.teamId);
                                  return (
                                    <div
                                      key={pt.id}
                                      className="p-1.5 bg-white rounded border border-slate-200 flex items-center justify-between text-[11px]"
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="font-mono font-bold text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded">
                                          {pt.chestNumber ? `#${pt.chestNumber}` : pt.id}
                                        </span>
                                        <span className="font-medium text-slate-900 truncate">{pt.name}</span>
                                        <span className="text-[10px] text-slate-500 bg-slate-100 px-1 rounded">
                                          {tm?.name || pt.teamId} • {pt.category}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )
                  ) : (
                    viewingParticipants.length === 0 ? (
                      <p className="text-slate-400 italic text-[11px] py-1.5 text-center">
                        No participants registered yet for this event.
                      </p>
                    ) : (
                      <div className="max-h-48 overflow-y-auto space-y-1 mt-2">
                        {viewingParticipants.map((pt) => {
                          const tm = teams.find((t) => t.id === pt.teamId);
                          return (
                            <div
                              key={pt.id}
                              className="p-1.5 bg-white rounded border border-slate-200 flex items-center justify-between text-[11px]"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {pt.chestNumber ? (
                                  <span className="font-mono font-bold text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded flex-shrink-0">
                                    #{pt.chestNumber}
                                  </span>
                                ) : (
                                  <span className="font-mono text-[10px] text-slate-400 bg-slate-50 px-1 rounded flex-shrink-0">
                                    —
                                  </span>
                                )}
                                <span className="font-medium text-slate-900 truncate">{pt.name}</span>
                                <span className="text-[10px] text-slate-500 bg-slate-100 px-1 rounded flex-shrink-0">
                                  {tm?.name || pt.teamId}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-[10px] text-slate-400 font-mono">{pt.category}</span>
                                <Badge variant={pt.status === 'verified' ? 'active' : 'pending'} size="sm">
                                  {pt.status}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )
                  )}
                </div>
              );
            })()}

            <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setViewingProgramme(null);
                    navigateToTabWithFilter('scores', { programmeId: viewingProgramme.id });
                  }}
                  className="text-xs font-semibold text-slate-800 hover:underline flex items-center gap-1"
                >
                  Go to Scoring Sheet &rarr;
                </button>
                {canManage && (
                  <button
                    onClick={() => {
                      const toCopy = viewingProgramme;
                      setViewingProgramme(null);
                      handleOpenCopy(toCopy);
                    }}
                    className="px-2.5 py-1 text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded font-semibold inline-flex items-center gap-1 transition-colors"
                    title="Duplicate this programme and customize"
                  >
                    <Copy className="w-3.5 h-3.5" /> Duplicate / Copy
                  </button>
                )}
                {canManage && viewingProgramme.resultPublished && (
                  <button
                    onClick={() => {
                      setConfirmDeleteResultsId(viewingProgramme.id);
                    }}
                    className="px-2.5 py-1 text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded font-semibold inline-flex items-center gap-1 transition-colors"
                    title="Delete and retract published results for this programme"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Results
                  </button>
                )}
              </div>

              <button
                onClick={() => setViewingProgramme(null)}
                className="px-3 py-1.5 text-xs text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Dedicated Roster & Assignments Modal */}
      {liveManagingRosterProg && (
        <Modal
          isOpen={!!liveManagingRosterProg}
          onClose={() => setManagingRosterProg(null)}
          title={`Event Roster & Participants: ${liveManagingRosterProg.code} - ${liveManagingRosterProg.name}`}
          description={`Category: ${liveManagingRosterProg.category} • Stage: ${liveManagingRosterProg.stage || 'Main'} • Type: ${liveManagingRosterProg.type === 'team' || liveManagingRosterProg.type === 'group' || liveManagingRosterProg.programmeType === 'team' ? 'Team Event' : 'Individual Competition'}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            {/* Event Summary Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-700 text-white shadow-2xs">
                  {liveManagingRosterProg.code}
                </span>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{liveManagingRosterProg.name}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span>
                      Rules:{' '}
                      <strong className="text-slate-800">
                        {liveManagingRosterProg.type === 'team' || liveManagingRosterProg.type === 'group' || liveManagingRosterProg.programmeType === 'team'
                          ? `Max ${liveManagingRosterProg.maxEntriesPerTeam || 1} team entry/squad (${liveManagingRosterProg.minTeamMembers || 2}-${liveManagingRosterProg.maxTeamMembers || 10} members)`
                          : `Max ${liveManagingRosterProg.maxParticipantsPerTeam || 1} participant(s) per team`}
                      </strong>
                    </span>
                    {liveManagingRosterProg.maxCapacity ? (
                      <span>• Fest Capacity: <strong>{liveManagingRosterProg.maxCapacity}</strong></span>
                    ) : null}
                  </div>
                </div>
              </div>

              {(() => {
                const isTeamEvent =
                  liveManagingRosterProg.type === 'team' ||
                  liveManagingRosterProg.type === 'group' ||
                  liveManagingRosterProg.programmeType === 'team';
                const pids = new Set<string>();
                participants.forEach((p) => {
                  if (p.registeredProgrammes?.includes(liveManagingRosterProg.id) && p.status !== 'inactive') {
                    pids.add(p.id);
                  }
                });
                (liveManagingRosterProg.registeredParticipantIds || []).forEach((id) => pids.add(id));
                (assignments || []).forEach((asg) => {
                  if (asg.programmeId === liveManagingRosterProg.id) {
                    (asg.participantIds || []).forEach((id) => pids.add(id));
                  }
                });
                const teamEntriesForProg = teamProgrammeEntries.filter(
                  (e) => e.programmeId === liveManagingRosterProg.id && e.status !== 'withdrawn'
                );
                teamEntriesForProg.forEach((e) => {
                  (e.memberParticipantIds || []).forEach((id) => pids.add(id));
                });
                const totalCount = pids.size;

                return (
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white border border-slate-200 text-purple-900 shadow-2xs">
                      {isTeamEvent && teamEntriesForProg.length > 0 ? `${teamEntriesForProg.length} Squads • ` : ''}
                      {totalCount} Registered
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* SECTION 1: CURRENTLY REGISTERED PARTICIPANTS */}
            <div className="border border-slate-200 rounded-xl p-3 bg-white">
              {(() => {
                const isTeamEvent =
                  liveManagingRosterProg.type === 'team' ||
                  liveManagingRosterProg.type === 'group' ||
                  liveManagingRosterProg.programmeType === 'team';

                const pids = new Set<string>();
                participants.forEach((p) => {
                  if (p.registeredProgrammes?.includes(liveManagingRosterProg.id) && p.status !== 'inactive') {
                    pids.add(p.id);
                  }
                });
                (liveManagingRosterProg.registeredParticipantIds || []).forEach((id) => pids.add(id));
                (assignments || []).forEach((asg) => {
                  if (asg.programmeId === liveManagingRosterProg.id) {
                    (asg.participantIds || []).forEach((id) => pids.add(id));
                  }
                });
                const teamEntriesForProg = teamProgrammeEntries.filter(
                  (e) => e.programmeId === liveManagingRosterProg.id && e.status !== 'withdrawn'
                );
                teamEntriesForProg.forEach((e) => {
                  (e.memberParticipantIds || []).forEach((id) => pids.add(id));
                });

                const registeredParticipants = participants
                  .filter((p) => pids.has(p.id) && p.status !== 'inactive')
                  .sort((a, b) => {
                    if (a.chestNumber && b.chestNumber) {
                      return a.chestNumber.localeCompare(b.chestNumber, undefined, { numeric: true, sensitivity: 'base' });
                    }
                    return (a.name || '').localeCompare(b.name || '');
                  });

                return (
                  <div>
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
                      <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Currently Registered Participants</span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          ({registeredParticipants.length})
                        </span>
                      </h5>
                    </div>

                    {/* Team Squads Summary for Group Events */}
                    {isTeamEvent && teamEntriesForProg.length > 0 && (
                      <div className="mb-3 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Registered Squad Entries ({teamEntriesForProg.length})
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {teamEntriesForProg.map((entry) => {
                            const tm = teams.find((t) => t.id === entry.teamId);
                            return (
                              <div key={entry.id} className="p-2 rounded-lg border border-purple-200 bg-purple-50/40 flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-900 text-xs">{entry.entryName}</span>
                                    <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-white text-purple-700 border border-purple-200">
                                      {tm?.code || entry.teamId}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-600 mt-0.5">
                                    <strong>{entry.memberParticipantIds?.length || 0}</strong> squad members • {entry.teamName}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => deleteTeamProgrammeEntry(entry.id)}
                                  className="text-[10px] text-rose-600 hover:text-rose-800 hover:underline font-semibold ml-2"
                                  title="Withdraw team entry"
                                >
                                  Withdraw
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {registeredParticipants.length === 0 ? (
                      <div className="py-6 text-center text-slate-400 italic bg-slate-50/70 rounded-lg border border-dashed border-slate-200">
                        No participants registered in this event yet. Select a team below to assign members.
                      </div>
                    ) : (
                      <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
                        {registeredParticipants.map((p) => {
                          const team = teams.find((t) => t.id === p.teamId);
                          const entry = teamEntriesForProg.find((e) => (e.memberParticipantIds || []).includes(p.id));
                          return (
                            <div key={p.id} className="pt-1.5 first:pt-0 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                                  {p.chestNumber ? `#${p.chestNumber}` : p.id}
                                </span>
                                <span className="font-bold text-slate-900 truncate">{p.name}</span>
                                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                  <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: team?.colorHex || '#94a3b8' }}
                                  />
                                  <span>{team?.name || p.teamId}</span>
                                  <span className="text-[10px] font-medium bg-slate-100 px-1 rounded text-slate-600">
                                    {p.category}
                                  </span>
                                  {isTeamEvent && (
                                    <span className="text-[9px] font-semibold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded border border-purple-200">
                                      {entry ? entry.entryName : 'Direct'}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveParticipantFromProg(p.id, liveManagingRosterProg.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                                title="Remove participant from this event"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* SECTION 2: ADD PARTICIPANTS FROM TEAM */}
            <div className="border border-purple-200/80 rounded-xl p-3 bg-purple-50/30">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-purple-600" />
                  <span>Assign Team Members to this Event</span>
                </h5>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <label className="text-[11px] font-semibold text-slate-600">Select Team:</label>
                  <select
                    value={rosterTeamFilter}
                    onChange={(e) => setRosterTeamFilter(e.target.value)}
                    className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Team Quota Progress Bar for Selected Team */}
              {(() => {
                const selectedTeam = teams.find((t) => t.id === rosterTeamFilter);
                const isTeamEvent =
                  liveManagingRosterProg.type === 'team' ||
                  liveManagingRosterProg.type === 'group' ||
                  liveManagingRosterProg.programmeType === 'team';
                const maxPerTeam = isTeamEvent
                  ? liveManagingRosterProg.maxTeamMembers || 25
                  : liveManagingRosterProg.maxParticipantsPerTeam || 1;

                const teamMembersInProg = participants.filter((p) => {
                  if (p.teamId !== rosterTeamFilter || p.status === 'inactive') return false;
                  if (p.registeredProgrammes?.includes(liveManagingRosterProg.id)) return true;
                  return teamProgrammeEntries.some(
                    (e) => e.programmeId === liveManagingRosterProg.id && e.teamId === rosterTeamFilter && e.status !== 'withdrawn' && (e.memberParticipantIds || []).includes(p.id)
                  );
                });
                const currentCount = teamMembersInProg.length;
                const isTeamFull = currentCount >= maxPerTeam;

                return (
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 mb-1.5">
                      <span>
                        Quota for <strong>{selectedTeam?.name || rosterTeamFilter}</strong>:
                      </span>
                      <span className={isTeamFull ? 'font-bold text-rose-700' : 'font-bold text-purple-700'}>
                        {currentCount} of {maxPerTeam} slots used {isTeamFull ? '(Quota Reached)' : `(${maxPerTeam - currentCount} available)`}
                      </span>
                    </div>

                    {/* Search members input */}
                    <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search team members by name or chest #..."
                        value={rosterSearch}
                        onChange={(e) => setRosterSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-600 text-slate-800"
                      />
                    </div>

                    {/* Team Members List */}
                    <div className="max-h-60 overflow-y-auto space-y-1.5 bg-white border border-slate-200 rounded-lg p-2">
                      {(() => {
                        const s = rosterSearch.toLowerCase().trim();
                        const fCat = (liveManagingRosterProg.category || '').toLowerCase().trim();
                        const eligibleCats = (liveManagingRosterProg.eligibleCategories || []).map((c) =>
                          c.toLowerCase().trim()
                        );

                        const teamMembers = participants.filter((p) => {
                          if (p.teamId !== rosterTeamFilter || p.status === 'inactive') return false;
                          if (s) {
                            const match =
                              (p.name || '').toLowerCase().includes(s) ||
                              (p.chestNumber ? p.chestNumber.toLowerCase().includes(s) : false);
                            if (!match) return false;
                          }
                          return true;
                        });

                        if (teamMembers.length === 0) {
                          return (
                            <div className="py-6 text-center text-slate-400 italic">
                              No participants found in team {selectedTeam?.name || rosterTeamFilter}.
                            </div>
                          );
                        }

                        return teamMembers.map((member) => {
                          const isAlreadyIn = (member.registeredProgrammes || []).includes(liveManagingRosterProg.id) ||
                            teamProgrammeEntries.some(
                              (e) => e.programmeId === liveManagingRosterProg.id && e.status !== 'withdrawn' && (e.memberParticipantIds || []).includes(member.id)
                            );

                          const mCat = (member.category || '').toLowerCase().trim();
                          const isCategoryEligible =
                            eligibleCats.length === 0 ||
                            eligibleCats.includes(mCat) ||
                            eligibleCats.includes('general') ||
                            fCat === mCat ||
                            fCat === 'general';

                          return (
                            <div
                              key={member.id}
                              className={`p-2 rounded-lg border flex items-center justify-between gap-2 ${
                                isAlreadyIn
                                  ? 'bg-purple-50/70 border-purple-200 text-purple-950 font-semibold'
                                  : 'bg-white border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                  {member.chestNumber ? `#${member.chestNumber}` : member.id}
                                </span>
                                <span className="font-medium text-xs text-slate-900 truncate">{member.name}</span>
                                <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                                  {member.category}
                                </span>
                              </div>

                              <div>
                                {isAlreadyIn ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
                                    <Check className="w-3 h-3" /> Registered
                                  </span>
                                ) : !isCategoryEligible ? (
                                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                    Ineligible Category
                                  </span>
                                ) : isTeamFull ? (
                                  <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                    Team Quota Full
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleAddParticipantToProg(member.id, liveManagingRosterProg.id)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add to Event</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setManagingRosterProg(null)}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => {
          if (deletingId) deleteProgramme(deletingId);
        }}
        title="Delete Programme"
        message="Are you sure you want to delete this programme? All registrations and associated schedule slots will be permanently unlinked."
      />

      {/* Delete Programme Results Confirmation */}
      <ConfirmDialog
        isOpen={!!confirmDeleteResultsId}
        onClose={() => setConfirmDeleteResultsId(null)}
        onConfirm={async () => {
          if (confirmDeleteResultsId) {
            await deleteProgrammeResults(confirmDeleteResultsId);
            if (viewingProgramme?.id === confirmDeleteResultsId) {
              setViewingProgramme(prev => prev ? { ...prev, resultPublished: false } : null);
            }
            setConfirmDeleteResultsId(null);
          }
        }}
        title="Delete Added Results"
        message="Are you sure you want to delete all added and published results for this programme? Ranks, positions, and points will be retracted and live leaderboards will be updated automatically."
        confirmLabel="Delete Results"
        isDestructive={true}
      />
    </div>
  );
};
