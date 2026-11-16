import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useFest } from '../context/FestContext';
import { Participant, ParticipantCategory, RegistrationStatus } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { exportToCSV } from '../services/storage';
import {
  Search,
  Plus,
  Download,
  Upload,
  Eye,
  Edit2,
  Trash2,
  Users,
  ChevronLeft,
  ChevronRight,
  Filter,
  Zap,
  CalendarCheck,
  Check,
  X,
  Layers,
  Shield,
  Sparkles,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  CheckSquare
} from 'lucide-react';

export const ParticipantsPage: React.FC = () => {
  const {
    participants,
    teams,
    programmes,
    results,
    categories,
    addParticipant,
    updateParticipant,
    deleteParticipant,
    bulkImportParticipants,
    addToast,
    teamProgrammeEntries,
  } = useFest();

  const getParticipantProgsCount = (p: Participant) => {
    const pids = new Set(p.registeredProgrammes || []);
    teamProgrammeEntries
      .filter((e) => e.status !== 'withdrawn' && (e.memberParticipantIds || []).includes(p.id))
      .forEach((e) => pids.add(e.programmeId));
    return pids.size;
  };

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterProgramme, setFilterProgramme] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [viewingParticipant, setViewingParticipant] = useState<Participant | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importCsvText, setImportCsvText] = useState('');

  // Suggested next numeric chest number
  const suggestedNextChest = useMemo(() => {
    let max = 100;
    participants.forEach((p) => {
      if (p.chestNumber) {
        const match = p.chestNumber.match(/\d+/g);
        if (match) {
          const num = parseInt(match[match.length - 1], 10);
          if (!isNaN(num) && num > max) max = num;
        }
      }
    });
    return String(max + 1);
  }, [participants]);

  // Quick Add Bar state
  const [quickName, setQuickName] = useState('');
  const [quickChest, setQuickChest] = useState('');
  const [quickTeamId, setQuickTeamId] = useState(teams[0]?.id || '');
  const [quickCategory, setQuickCategory] = useState(categories.filter((c) => c.enabled)[0]?.name || 'Senior');
  const quickNameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!quickTeamId && teams.length > 0) {
      setQuickTeamId(teams[0].id);
    }
  }, [teams, quickTeamId]);

  useEffect(() => {
    if (!quickCategory && categories.length > 0) {
      const defaultCat = categories.filter((c) => c.enabled)[0]?.name || 'Senior';
      setQuickCategory(defaultCat);
    }
  }, [categories, quickCategory]);

  useEffect(() => {
    if (!quickChest) {
      setQuickChest(suggestedNextChest);
    }
  }, [suggestedNextChest]);

  // Dedicated Quick Assign Modal state
  const [assigningParticipant, setAssigningParticipant] = useState<Participant | null>(null);
  const [assignSearch, setAssignSearch] = useState('');
  const [assignTab, setAssignTab] = useState<'all' | 'eligible' | 'assigned'>('eligible');

  const liveAssigningParticipant = useMemo(() => {
    if (!assigningParticipant) return null;
    return participants.find((p) => p.id === assigningParticipant.id) || assigningParticipant;
  }, [assigningParticipant, participants]);

  // Search & filter state inside the Add/Edit Modal
  const [modalProgSearch, setModalProgSearch] = useState('');
  const [modalProgTab, setModalProgTab] = useState<'all' | 'eligible' | 'selected'>('all');
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    chestNumber: '',
    email: '',
    phone: '',
    teamId: teams[0]?.id || '',
    category: 'Senior' as ParticipantCategory,
    status: 'verified' as RegistrationStatus,
    registeredProgrammes: [] as string[],
  });

  // Filtered & Searched Data (Ordered by Chest Number)
  const filteredData = useMemo(() => {
    const list = participants.filter((p) => {
      // Search
      const s = search.toLowerCase();
      const matchesSearch =
        (p.name || '').toLowerCase().includes(s) ||
        (p.id || '').toLowerCase().includes(s) ||
        (p.chestNumber ? p.chestNumber.toLowerCase().includes(s) : false) ||
        (p.email ? p.email.toLowerCase().includes(s) : false) ||
        (p.phone ? p.phone.includes(s) : false);
      if (!matchesSearch) return false;

      // Team
      if (filterTeam !== 'all' && p.teamId !== filterTeam) return false;

      // Category (case-insensitive)
      if (filterCategory !== 'all' && (p.category || '').trim().toLowerCase() !== filterCategory.trim().toLowerCase()) return false;

      // Status
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;

      // Programme
      if (filterProgramme !== 'all') {
        const inDirect = (p.registeredProgrammes || []).includes(filterProgramme);
        const inTeamEntry = teamProgrammeEntries.some(
          (e) => e.programmeId === filterProgramme && e.status !== 'withdrawn' && (e.memberParticipantIds || []).includes(p.id)
        );
        if (!inDirect && !inTeamEntry) return false;
      }

      return true;
    });

    // Natural sort by Chest Number (#1, #2, #10, C-01...), with fallback to Name
    return list.sort((a, b) => {
      if (a.chestNumber && b.chestNumber) {
        return a.chestNumber.localeCompare(b.chestNumber, undefined, { numeric: true, sensitivity: 'base' });
      }
      if (a.chestNumber) return -1;
      if (b.chestNumber) return 1;
      return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
    });
  }, [participants, search, filterTeam, filterCategory, filterProgramme, filterStatus]);

  // Paginated records
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  // Quick Add handler (inline top bar)
  const handleQuickAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedName = quickName.trim();
    if (!trimmedName) {
      addToast('error', 'Missing Name', 'Please enter a participant name.');
      quickNameInputRef.current?.focus();
      return;
    }
    const effectiveTeamId = quickTeamId || teams[0]?.id;
    if (!effectiveTeamId) {
      addToast('error', 'Missing Team', 'Please select a team.');
      return;
    }
    const effectiveCategory = (quickCategory || categories.filter((c) => c.enabled)[0]?.name || 'Senior') as ParticipantCategory;
    const effectiveChest = quickChest.trim();

    if (effectiveChest) {
      const chestTrimmed = effectiveChest.toLowerCase();
      const duplicateChest = participants.some(
        (p) => p.chestNumber && p.chestNumber.trim().toLowerCase() === chestTrimmed
      );
      if (duplicateChest) {
        addToast('error', 'Duplicate Chest Number', `Chest #${effectiveChest} is already assigned.`);
        return;
      }
    }

    const success = addParticipant({
      name: trimmedName,
      chestNumber: effectiveChest || undefined,
      email: '',
      phone: '',
      teamId: effectiveTeamId,
      category: effectiveCategory,
      status: 'verified',
      registeredProgrammes: [],
    });

    if (success) {
      setQuickName('');
      const currentNum = parseInt(effectiveChest, 10);
      if (!isNaN(currentNum)) {
        setQuickChest(String(currentNum + 1));
      } else {
        setQuickChest(suggestedNextChest);
      }
      setTimeout(() => {
        quickNameInputRef.current?.focus();
      }, 50);
    }
  };

  // Quick toggle programme from dedicated modal
  const handleToggleAssignProg = (progId: string) => {
    if (!liveAssigningParticipant) return;
    const currentProgs = liveAssigningParticipant.registeredProgrammes || [];
    const isAssigned = currentProgs.includes(progId);
    const nextProgs = isAssigned
      ? currentProgs.filter((id) => id !== progId)
      : [...currentProgs, progId];

    const success = updateParticipant(liveAssigningParticipant.id, {
      registeredProgrammes: nextProgs,
    });
    if (success) {
      setAssigningParticipant((prev) => (prev ? { ...prev, registeredProgrammes: nextProgs } : null));
    }
  };

  // Handle open add modal
  const handleOpenAdd = () => {
    setEditingParticipant(null);
    const defaultCat = categories.filter((c) => c.enabled)[0]?.name || 'Senior';
    setFormData({
      name: '',
      chestNumber: quickChest || suggestedNextChest,
      email: '',
      phone: '',
      teamId: quickTeamId || teams[0]?.id || '',
      category: (quickCategory || defaultCat) as ParticipantCategory,
      status: 'verified',
      registeredProgrammes: [],
    });
    setModalProgSearch('');
    setModalProgTab('all');
    setShowOptionalFields(false);
    setIsAddModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEdit = (p: Participant) => {
    setEditingParticipant(p);
    setFormData({
      name: p.name,
      chestNumber: p.chestNumber || '',
      email: p.email || '',
      phone: p.phone || '',
      teamId: p.teamId,
      category: p.category,
      status: p.status,
      registeredProgrammes: p.registeredProgrammes ? [...p.registeredProgrammes] : [],
    });
    setModalProgSearch('');
    setModalProgTab('all');
    setShowOptionalFields(Boolean(p.email || p.phone || p.status !== 'verified'));
    setIsAddModalOpen(true);
  };

  // Submit add or edit
  const handleSubmitForm = (e: React.FormEvent, andAddAnother = false) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.teamId) {
      addToast('error', 'Incomplete Form', 'Please enter a participant name and assign a team.');
      return;
    }

    // Check duplicate chest number if entered
    if (formData.chestNumber.trim()) {
      const chestTrimmed = formData.chestNumber.trim().toLowerCase();
      const duplicateChest = participants.some(
        (p) => p.id !== editingParticipant?.id && p.chestNumber && p.chestNumber.trim().toLowerCase() === chestTrimmed
      );
      if (duplicateChest) {
        addToast('error', 'Duplicate Chest Number', `Chest number "${formData.chestNumber}" is already assigned to another participant.`);
        return;
      }
    }

    // Check duplicate email if entered
    if (formData.email.trim()) {
      const emailTrimmed = formData.email.trim().toLowerCase();
      const duplicateEmail = participants.some(
        (p) => p.id !== editingParticipant?.id && p.email && p.email.trim().toLowerCase() === emailTrimmed
      );
      if (duplicateEmail) {
        addToast('error', 'Duplicate Email', `Participant with email "${formData.email}" already exists.`);
        return;
      }
    }

    // Validate restrictions on all selected programmes
    for (const progId of formData.registeredProgrammes) {
      const prog = programmes.find((pr) => pr.id === progId);
      if (!prog) continue;

      // 1. Category eligibility
      const fCat = (formData.category || '').toLowerCase().trim();
      const pCat = (prog.category || '').toLowerCase().trim();
      const eligibleCats = (prog.eligibleCategories || []).map((c) => c.toLowerCase().trim());
      const isEligible =
        !fCat ||
        eligibleCats.length === 0 ||
        eligibleCats.includes(fCat) ||
        eligibleCats.includes('general') ||
        pCat === fCat ||
        pCat === 'general';
      if (!isEligible) {
        addToast(
          'error',
          'Category Ineligible',
          `Participant category "${formData.category}" is not eligible for "${prog.name}". Eligible categories: [${(prog.eligibleCategories || []).join(', ')}].`
        );
        return;
      }

      // 2. Team Quota (maxParticipantsPerTeam / maxTeamMembers)
      const isTeam = prog.type === 'team' || prog.type === 'group' || prog.programmeType === 'team';
      const maxAllowed = isTeam ? (prog.maxTeamMembers || 25) : (prog.maxParticipantsPerTeam || 1);
      const otherTeamMembers = participants.filter(
        (p) =>
          p.teamId === formData.teamId &&
          p.id !== editingParticipant?.id &&
          p.status !== 'inactive' &&
          p.registeredProgrammes?.includes(prog.id)
      );
      if (otherTeamMembers.length >= maxAllowed) {
        const teamObj = teams.find((t) => t.id === formData.teamId);
        const teamName = teamObj ? `${teamObj.name} (${teamObj.code})` : formData.teamId;
        addToast(
          'error',
          'Team Limit Exceeded',
          isTeam
            ? `Team "${teamName}" already reached the maximum squad limit of ${maxAllowed} members for team event "${prog.name}".`
            : `Team "${teamName}" already has ${otherTeamMembers.length} of ${maxAllowed} allowed participant(s) registered in "${prog.name}" (${otherTeamMembers.map((p) => p.name).join(', ')}). Registration blocked.`
        );
        return;
      }

      // 4. Programme Capacity
      if (prog.maxCapacity && prog.maxCapacity > 0) {
        const totalInProg = participants.filter(
          (p) =>
            p.id !== editingParticipant?.id &&
            p.status !== 'inactive' &&
            p.registeredProgrammes?.includes(prog.id)
        ).length;
        if (totalInProg >= prog.maxCapacity) {
          addToast(
            'error',
            'Capacity Exceeded',
            `"${prog.name}" has reached maximum capacity of ${prog.maxCapacity} participants.`
          );
          return;
        }
      }
    }

    const payload = {
      name: formData.name.trim(),
      chestNumber: formData.chestNumber.trim() || undefined,
      email: formData.email.trim() || '',
      phone: formData.phone.trim() || '',
      teamId: formData.teamId,
      category: formData.category,
      status: formData.status,
      registeredProgrammes: formData.registeredProgrammes,
    };

    if (editingParticipant) {
      const success = updateParticipant(editingParticipant.id, payload);
      if (success) {
        setIsAddModalOpen(false);
      }
    } else {
      const success = addParticipant(payload);
      if (success) {
        if (andAddAnother) {
          const currentNum = parseInt(formData.chestNumber.trim(), 10);
          const nextChest = !isNaN(currentNum) ? String(currentNum + 1) : suggestedNextChest;
          setFormData((prev) => ({
            ...prev,
            name: '',
            chestNumber: nextChest,
            email: '',
            phone: '',
            registeredProgrammes: [],
          }));
          addToast('success', 'Participant Registered', `${payload.name} added! Ready for next participant.`);
        } else {
          setIsAddModalOpen(false);
        }
      }
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const exportRows = filteredData.map((p) => {
      const team = teams.find((t) => t.id === p.teamId);
      return {
        ChestNumber: p.chestNumber || '',
        Name: p.name,
        Email: p.email || '',
        Phone: p.phone || '',
        Team: team?.name || p.teamId,
        Category: p.category,
        Status: p.status,
        RegisteredProgrammesCount: getParticipantProgsCount(p),
        RegistrationDate: p.createdAt,
      };
    });
    exportToCSV(`festflow_participants_${new Date().toISOString().slice(0, 10)}`, exportRows);
  };

  // Bulk Import CSV
  const handleProcessImport = () => {
    if (!importCsvText.trim()) return;
    const lines = importCsvText.trim().split('\n');
    if (lines.length < 2) {
      addToast('error', 'Invalid CSV', 'CSV must contain a header line and at least one data line.');
      return;
    }

    const newParticipants: Omit<Participant, 'id' | 'createdAt'>[] = [];
    // Assume header format: Name,Email,Phone,TeamCode,Category,Status
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      if (cols.length >= 3 && cols[0] && cols[1]) {
        const teamMatch = teams.find(
          (t) => t.code.toLowerCase() === cols[3]?.toLowerCase() || t.name.toLowerCase() === cols[3]?.toLowerCase()
        );
        newParticipants.push({
          name: cols[0],
          email: cols[1],
          phone: cols[2] || '+91 98401 00000',
          teamId: teamMatch?.id || teams[0]?.id || 'TM-01',
          category: (cols[4] as ParticipantCategory) || 'Senior',
          status: (cols[5] as RegistrationStatus) || 'verified',
          registeredProgrammes: [],
        });
      }
    }

    bulkImportParticipants(newParticipants);
    setIsImportModalOpen(false);
    setImportCsvText('');
  };

  return (
    <div className="space-y-5">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              Participant Directory
            </h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-purple-100 text-purple-700 rounded-full border border-purple-200">
              {filteredData.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage registrations, verify badges, assign events, and handle team rosters.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 border border-transparent rounded hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Participant</span>
          </button>
        </div>
      </div>

      {/* Fast Participant Entry Bar */}
      <div className="bg-gradient-to-r from-purple-50 via-indigo-50/40 to-white border border-purple-200/90 rounded-xl p-3 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <Zap className="w-3.5 h-3.5 fill-current" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>Fast Participant Entry</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-purple-100 text-purple-700">
                  Rapid Mode
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Type name, verify chest number & team, then press <kbd className="px-1 py-0.5 text-[10px] font-mono bg-white border border-slate-300 rounded shadow-2xs font-semibold">Enter</kbd> to add instantly.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-medium">
              Next Chest:
            </span>
            <span className="font-mono text-xs font-bold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded border border-purple-200">
              #{suggestedNextChest}
            </span>
          </div>
        </div>

        <form onSubmit={handleQuickAdd} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
          {/* Full Name */}
          <div className="sm:col-span-4">
            <input
              ref={quickNameInputRef}
              type="text"
              placeholder="Participant Full Name (required) *"
              value={quickName}
              onChange={(e) => setQuickName(e.target.value)}
              className="w-full text-xs font-medium border border-slate-300 bg-white rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              required
            />
          </div>

          {/* Chest Number */}
          <div className="sm:col-span-2 relative">
            <input
              type="text"
              placeholder={`Chest #${suggestedNextChest}`}
              value={quickChest}
              onChange={(e) => setQuickChest(e.target.value)}
              className="w-full text-xs font-mono font-bold border border-slate-300 bg-white rounded-lg pl-3 pr-7 py-2 text-purple-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setQuickChest(suggestedNextChest)}
              title="Reset to next suggested chest number"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-600 p-1"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          {/* Team */}
          <div className="sm:col-span-3">
            <select
              value={quickTeamId}
              onChange={(e) => setQuickTeamId(e.target.value)}
              className="w-full text-xs font-medium border border-slate-300 bg-white rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="sm:col-span-2">
            <select
              value={quickCategory}
              onChange={(e) => setQuickCategory(e.target.value)}
              className="w-full text-xs font-medium border border-slate-300 bg-white rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              {categories.filter((c) => c.enabled).map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Add Button */}
          <div className="sm:col-span-1">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1 py-2 px-3 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-xs transition-colors cursor-pointer"
              title="Add participant (or press Enter)"
            >
              <Plus className="w-4 h-4" />
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </form>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, chest #, email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:border-slate-400 text-slate-800"
            />
          </div>

          {/* Team filter */}
          <div>
            <select
              value={filterTeam}
              onChange={(e) => {
                setFilterTeam(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-400 text-slate-800"
            >
              <option value="all">All Teams</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category filter */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-400 text-slate-800"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name} {c.isGeneral ? '(General)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Programme filter */}
          <div>
            <select
              value={filterProgramme}
              onChange={(e) => {
                setFilterProgramme(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-400 text-slate-800 truncate"
            >
              <option value="all">All Registered Programmes</option>
              {programmes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-400 text-slate-800"
            >
              <option value="all">All Statuses</option>
              <option value="verified">Verified</option>
              <option value="registered">Registered</option>
              <option value="disqualified">Disqualified</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Participants Data Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3 w-28">Chest #</th>
                <th className="py-3 px-3">Participant Name</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3">Team</th>
                <th className="py-3 px-2 text-center">Category</th>
                <th className="py-3 px-2 text-center">Programmes</th>
                <th className="py-3 px-2 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No participants matching current search/filter.
                  </td>
                </tr>
              ) : (
                paginatedData.map((participant) => {
                  const team = teams.find((t) => t.id === participant.teamId);
                  return (
                    <tr
                      key={participant.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="py-3 px-3">
                        {participant.chestNumber ? (
                          <span className="inline-flex items-center px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded font-mono text-xs font-bold shadow-2xs">
                            #{participant.chestNumber}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono italic">Not assigned</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">
                          {participant.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Reg: {participant.createdAt}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-slate-700">
                          {participant.email ? (
                            participant.email
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">No email</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {participant.phone ? (
                            participant.phone
                          ) : (
                            <span className="text-slate-400 italic font-sans">No phone</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: team?.colorHex || '#94a3b8' }}
                          />
                          <span className="font-medium text-slate-800">
                            {team?.name || participant.teamId}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {team?.institution}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {participant.category}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center font-mono">
                        <button
                          type="button"
                          onClick={() => setAssigningParticipant(participant)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 font-bold shadow-2xs transition-colors cursor-pointer"
                          title="Click to assign or manage programmes"
                        >
                          <CalendarCheck className="w-3.5 h-3.5 text-purple-600" />
                          <span>{getParticipantProgsCount(participant)} assigned</span>
                        </button>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant={participant.status} size="sm">
                          {participant.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setAssigningParticipant(participant)}
                            className="p-1 rounded text-purple-600 hover:text-purple-800 hover:bg-purple-50"
                            title="Assign Programmes"
                          >
                            <CalendarCheck className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewingParticipant(participant)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(participant)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(participant.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="p-3 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <div>
              Showing{' '}
              <span className="font-semibold text-slate-700">
                {filteredData.length === 0 ? 0 : (page - 1) * pageSize + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-700">
                {Math.min(page * pageSize, filteredData.length)}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-slate-700">
                {filteredData.length}
              </span>{' '}
              participants
            </div>

            <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
              <span className="text-slate-400">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="text-xs bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 font-medium focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={500}>All</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-slate-700">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Participant Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingParticipant ? `Edit Participant: ${editingParticipant.name}` : 'Register New Participant'}
        description="Fill out participant identity, contact details, assigned team, and competitions."
        maxWidth="lg"
      >
        <form onSubmit={(e) => handleSubmitForm(e, false)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full text-xs font-semibold border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-slate-900"
                placeholder="e.g. Aditi Sharma"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-700">
                  Chest Number (Bib / Code)
                </label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, chestNumber: suggestedNextChest })}
                  className="text-[10px] text-purple-700 hover:text-purple-900 font-bold inline-flex items-center gap-1 cursor-pointer"
                  title="Auto-fill next sequential chest number"
                >
                  <Zap className="w-2.5 h-2.5 fill-current" />
                  <span>Auto: #{suggestedNextChest}</span>
                </button>
              </div>
              <input
                type="text"
                value={formData.chestNumber}
                onChange={(e) => setFormData({ ...formData, chestNumber: e.target.value })}
                className="w-full text-xs font-mono font-bold border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-purple-950 bg-white"
                placeholder={`e.g. ${suggestedNextChest} (optional)`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Assigned Team *
              </label>
              <select
                value={formData.teamId}
                onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white text-slate-900 font-medium"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as ParticipantCategory })
                }
                className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white text-slate-900 font-medium"
              >
                {categories.filter((c) => c.enabled).map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} {c.isGeneral ? '(General / Any Age)' : c.minAge || c.maxAge ? `(Ages ${c.minAge || 0}-${c.maxAge || 'Open'})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Collapsible Optional Contact Details */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowOptionalFields(!showOptionalFields)}
              className="text-xs text-purple-700 hover:text-purple-900 font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <span>{showOptionalFields ? '− Hide' : '+ Show'} Optional Contact Details & Status</span>
              <span className="text-[10px] text-slate-400 font-normal">(Email, Phone, Status)</span>
            </button>

            {showOptionalFields && (
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg animate-in fade-in duration-150">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-500 bg-white"
                    placeholder="aditi@example.com (optional)"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-500 bg-white"
                    placeholder="+91 98401 23456 (optional)"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Registration Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as RegistrationStatus })
                    }
                    className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-500 bg-white"
                  >
                    <option value="verified">Verified</option>
                    <option value="registered">Registered</option>
                    <option value="disqualified">Disqualified</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Registered Programmes multi-select with search and filters */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-800">
                Assigned Programmes ({formData.registeredProgrammes.length} selected)
              </label>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-normal">
                {formData.teamId && (
                  <span>
                    Team: <strong className="text-slate-800">{teams.find((t) => t.id === formData.teamId)?.name || formData.teamId}</strong>
                  </span>
                )}
                {formData.category && (
                  <span>
                    • Category: <strong className="text-slate-800">{formData.category}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* In-Modal Search and Tab Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mb-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter programmes by name or code..."
                  value={modalProgSearch}
                  onChange={(e) => setModalProgSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-600 text-slate-800"
                />
                {modalProgSearch && (
                  <button
                    type="button"
                    onClick={() => setModalProgSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setModalProgTab('all')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    modalProgTab === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({programmes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setModalProgTab('eligible')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    modalProgTab === 'eligible'
                      ? 'bg-white text-purple-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Eligible
                </button>
                <button
                  type="button"
                  onClick={() => setModalProgTab('selected')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    modalProgTab === 'selected'
                      ? 'bg-white text-purple-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Selected ({formData.registeredProgrammes.length})
                </button>
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1.5 bg-slate-50/50">
              {(() => {
                const s = modalProgSearch.toLowerCase().trim();
                const fCat = (formData.category || '').toLowerCase().trim();

                const availableProgrammes = programmes.filter((prog) => {
                  if (s) {
                    const matchSearch =
                      (prog.code || '').toLowerCase().includes(s) ||
                      (prog.name || '').toLowerCase().includes(s) ||
                      (prog.category || '').toLowerCase().includes(s);
                    if (!matchSearch) return false;
                  }

                  const isChecked = formData.registeredProgrammes.includes(prog.id);
                  if (modalProgTab === 'selected') return isChecked;

                  const pCat = (prog.category || '').toLowerCase().trim();
                  const eligibleCats = (prog.eligibleCategories || []).map((c) => c.toLowerCase().trim());
                  const isEligible =
                    eligibleCats.length === 0 ||
                    eligibleCats.includes(fCat) ||
                    eligibleCats.includes('general') ||
                    pCat === fCat ||
                    pCat === 'general' ||
                    pCat.startsWith('general');

                  if (modalProgTab === 'eligible') {
                    return isEligible || isChecked;
                  }

                  return true;
                });

                if (availableProgrammes.length === 0) {
                  return (
                    <div className="py-6 text-center text-xs text-slate-400 italic">
                      No matching programmes found for category "{formData.category}".
                    </div>
                  );
                }

                // Natural sort by programme code
                const sortedProgrammes = [...availableProgrammes].sort((a, b) =>
                  (a.code || '').localeCompare(b.code || '', undefined, { numeric: true, sensitivity: 'base' }) ||
                  (a.name || '').localeCompare(b.name || '')
                );

                return sortedProgrammes.map((prog) => {
                  const checked = formData.registeredProgrammes.includes(prog.id);
                  const isTeamEvent = prog.type === 'team' || prog.type === 'group' || prog.programmeType === 'team';

                  // Category check
                  const pCat = (prog.category || '').toLowerCase().trim();
                  const eligibleCats = (prog.eligibleCategories || []).map((c) => c.toLowerCase().trim());
                  const isCategoryEligible =
                    !fCat ||
                    eligibleCats.length === 0 ||
                    eligibleCats.includes(fCat) ||
                    eligibleCats.includes('general') ||
                    pCat === fCat ||
                    pCat === 'general';

                  // Team quota check
                  const maxAllowedPerTeam = isTeamEvent ? (prog.maxTeamMembers || 25) : (prog.maxParticipantsPerTeam || 1);
                  const otherTeamMembers = participants.filter(
                    (p) =>
                      p.teamId === formData.teamId &&
                      p.id !== editingParticipant?.id &&
                      p.status !== 'inactive' &&
                      p.registeredProgrammes?.includes(prog.id)
                  );
                  const currentTeamCount = otherTeamMembers.length;
                  const isTeamQuotaFull = currentTeamCount >= maxAllowedPerTeam;

                  // Overall capacity check
                  const maxCap = prog.maxCapacity || 0;
                  const totalInProg = participants.filter(
                    (p) =>
                      p.id !== editingParticipant?.id &&
                      p.status !== 'inactive' &&
                      p.registeredProgrammes?.includes(prog.id)
                  ).length;
                  const isCapFull = maxCap > 0 && totalInProg >= maxCap;

                  // Can the checkbox be toggled on?
                  const canSelect = isCategoryEligible && !isTeamQuotaFull && !isCapFull;
                  const isBlocked = !checked && !canSelect;

                  const handleToggle = () => {
                    if (checked) {
                      setFormData({
                        ...formData,
                        registeredProgrammes: formData.registeredProgrammes.filter((id) => id !== prog.id),
                      });
                    } else {
                      if (!isCategoryEligible) {
                        addToast(
                          'error',
                          'Category Ineligible',
                          `Participant in "${formData.category}" is not eligible for "${prog.name}". Eligible: [${(prog.eligibleCategories || []).join(', ')}].`
                        );
                        return;
                      }
                      if (isTeamQuotaFull) {
                        const teamObj = teams.find((t) => t.id === formData.teamId);
                        const teamName = teamObj ? `${teamObj.name} (${teamObj.code})` : formData.teamId;
                        addToast(
                          'error',
                          'Team Quota Full',
                          isTeamEvent
                            ? `Team "${teamName}" already reached maximum squad limit of ${maxAllowedPerTeam} members for team event "${prog.name}".`
                            : `Team "${teamName}" already has ${currentTeamCount} of ${maxAllowedPerTeam} allowed participant(s) registered in "${prog.name}": ${otherTeamMembers.map((p) => p.name).join(', ')}.`
                        );
                        return;
                      }
                      if (isCapFull) {
                        addToast(
                          'error',
                          'Capacity Full',
                          `Programme "${prog.name}" has reached its maximum capacity of ${maxCap} participants.`
                        );
                        return;
                      }
                      setFormData({
                        ...formData,
                        registeredProgrammes: [...formData.registeredProgrammes, prog.id],
                      });
                    }
                  };

                  return (
                    <div
                      key={prog.id}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).tagName !== 'INPUT') {
                          handleToggle();
                        }
                      }}
                      className={`flex items-center justify-between gap-2 p-2 rounded-lg border transition-colors ${
                        checked
                          ? 'bg-purple-50/70 border-purple-200 text-slate-900 shadow-2xs'
                          : isBlocked
                          ? 'bg-slate-100/70 border-slate-200 text-slate-400 opacity-80 cursor-not-allowed'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={isBlocked}
                          onChange={handleToggle}
                          className={`rounded border-slate-300 text-purple-600 focus:ring-0 ${
                            isBlocked ? 'cursor-not-allowed' : 'cursor-pointer'
                          }`}
                        />
                        <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded flex-shrink-0">
                          {prog.code}
                        </span>
                        <span className={`text-xs font-medium truncate ${checked ? 'font-semibold text-purple-900' : ''}`}>
                          {prog.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                          ({prog.category})
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isTeamEvent && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200">
                            Team Event
                          </span>
                        )}
                        {!isCategoryEligible ? (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                            Ineligible
                          </span>
                        ) : isTeamQuotaFull && !checked ? (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200">
                            Team Full ({currentTeamCount}/${maxAllowedPerTeam})
                          </span>
                        ) : isCapFull && !checked ? (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200">
                            Cap Full ({totalInProg}/${maxCap})
                          </span>
                        ) : checked && currentTeamCount >= maxAllowedPerTeam ? (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200">
                            Team Over Limit ({currentTeamCount + 1}/${maxAllowedPerTeam})
                          </span>
                        ) : checked ? (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200">
                            Selected ({currentTeamCount + 1}/${maxAllowedPerTeam})
                          </span>
                        ) : (
                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {currentTeamCount}/{maxAllowedPerTeam} team slots
                          </span>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <div className="flex items-center gap-2">
              {!editingParticipant && (
                <button
                  type="button"
                  onClick={(e) => handleSubmitForm(e, true)}
                  className="px-3.5 py-1.5 text-xs text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded font-semibold transition-colors cursor-pointer"
                >
                  Save & Add Another
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-1.5 text-xs text-white bg-slate-900 rounded hover:bg-slate-800 font-semibold cursor-pointer shadow-xs"
              >
                {editingParticipant ? 'Save Changes' : 'Register & Close'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Participant Detail Drawer / View Modal */}
      {viewingParticipant && (
        <Modal
          isOpen={!!viewingParticipant}
          onClose={() => setViewingParticipant(null)}
          title={`Participant Profile: ${viewingParticipant.name}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            {/* Identity Grid */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Chest Number</span>
                <p className="font-mono font-bold text-sm text-purple-700">
                  {viewingParticipant.chestNumber ? `#${viewingParticipant.chestNumber}` : 'Not assigned'}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Registration Status</span>
                <p className="mt-0.5">
                  <Badge variant={viewingParticipant.status} size="sm">
                    {viewingParticipant.status}
                  </Badge>
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Category</span>
                <p className="font-medium text-slate-800">{viewingParticipant.category}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Team</span>
                <p className="font-medium text-slate-800">
                  {teams.find((t) => t.id === viewingParticipant.teamId)?.name}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Email</span>
                <p className="text-slate-800">{viewingParticipant.email || <span className="text-slate-400 italic">Not provided</span>}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Phone</span>
                <p className="font-mono text-slate-800">{viewingParticipant.phone || <span className="text-slate-400 italic font-sans">Not provided</span>}</p>
              </div>
            </div>

            {/* Registered Events and Achieved Results */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Registered Programmes & Results</h4>
              {(() => {
                const assignedProgIds = new Set(viewingParticipant.registeredProgrammes || []);
                teamProgrammeEntries
                  .filter((e) => e.status !== 'withdrawn' && (e.memberParticipantIds || []).includes(viewingParticipant.id))
                  .forEach((e) => assignedProgIds.add(e.programmeId));
                const progIdList = Array.from(assignedProgIds);

                if (progIdList.length === 0) {
                  return <p className="text-slate-400 italic">No programmes currently assigned.</p>;
                }

                return (
                  <div className="space-y-2">
                    {progIdList.map((progId) => {
                      const prog = programmes.find((p) => p.id === progId);
                      const isTeamProg = prog?.type === 'group' || prog?.type === 'team' || prog?.programmeType === 'team';
                      const squadEntry = isTeamProg
                        ? teamProgrammeEntries.find(
                            (e) => e.programmeId === progId && e.status !== 'withdrawn' && (e.memberParticipantIds || []).includes(viewingParticipant.id)
                          )
                        : null;
                      const result = results.find(
                        (r) => r.programmeId === progId && (r.participantId === viewingParticipant.id || (squadEntry && r.teamEntryId === squadEntry.id))
                      );

                      return (
                        <div
                          key={progId}
                          className="p-2.5 border border-slate-200 rounded flex items-center justify-between"
                        >
                          <div>
                            <div className="font-medium text-slate-900 flex items-center gap-1.5 flex-wrap">
                              <span>{prog?.name || progId}</span>
                              {squadEntry && (
                                <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded font-semibold">
                                  Squad: {squadEntry.entryName}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {prog?.category} • Venue: {prog?.venue}
                            </div>
                          </div>
                          <div>
                            {result ? (
                              <Badge variant="published" size="sm">
                                Rank #{result.rank} ({result.pointsAwarded} pts)
                              </Badge>
                            ) : (
                              <Badge variant={prog?.status || 'draft'} size="sm">
                                {prog?.status || 'Assigned'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewingParticipant(null)}
                className="px-3 py-1.5 text-xs text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Bulk CSV Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Bulk Import Participants from CSV"
        description="Paste raw CSV data with columns: Name,Email,Phone,TeamCode,Category,Status"
        maxWidth="lg"
      >
        <div className="space-y-3">
          <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-200 font-mono">
            Sample format:<br />
            Name,Email,Phone,TeamCode,Category,Status<br />
            Anjali Rao,anjali.r@example.com,+91 98401 99991,PHX,Senior,verified<br />
            Kavita Nair,kavita.n@example.com,+91 98401 99992,VAN,Junior,verified
          </div>

          <textarea
            rows={6}
            value={importCsvText}
            onChange={(e) => setImportCsvText(e.target.value)}
            placeholder="Paste your CSV content here..."
            className="w-full text-xs font-mono border border-slate-300 rounded p-2.5 focus:outline-none focus:border-slate-500"
          />

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
            <button
              onClick={() => setIsImportModalOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleProcessImport}
              className="px-4 py-1.5 text-xs text-white bg-slate-900 rounded hover:bg-slate-800 font-medium"
            >
              Process Import
            </button>
          </div>
        </div>
      </Modal>

      {/* Dedicated Quick Assign Programmes Modal */}
      {liveAssigningParticipant && (
        <Modal
          isOpen={!!liveAssigningParticipant}
          onClose={() => setAssigningParticipant(null)}
          title={`Assign Programmes: ${liveAssigningParticipant.name}`}
          description="Instantly toggle events for this participant. Quota limits and category rules are enforced in real time."
          maxWidth="2xl"
        >
          <div className="space-y-3.5 text-xs">
            {/* Participant Identity Summary Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-purple-50/70 border border-purple-200/80 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-700 text-white shadow-2xs">
                  {liveAssigningParticipant.chestNumber ? `#${liveAssigningParticipant.chestNumber}` : 'No Chest #'}
                </span>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{liveAssigningParticipant.name}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span>
                      Team: <strong className="text-slate-800">{teams.find((t) => t.id === liveAssigningParticipant.teamId)?.name || liveAssigningParticipant.teamId}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Category: <strong className="text-slate-800">{liveAssigningParticipant.category}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white border border-purple-200 text-purple-900 shadow-2xs">
                  {(liveAssigningParticipant.registeredProgrammes || []).length} Events Assigned
                </span>
              </div>
            </div>

            {/* Search and Category Filter Tabs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search programmes by name or code..."
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900 placeholder:text-slate-400"
                />
                {assignSearch && (
                  <button
                    type="button"
                    onClick={() => setAssignSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setAssignTab('eligible')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    assignTab === 'eligible'
                      ? 'bg-white text-purple-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Eligible ({
                    programmes.filter((prog) => {
                      const fCat = (liveAssigningParticipant.category || '').toLowerCase().trim();
                      const pCat = (prog.category || '').toLowerCase().trim();
                      const eligibleCats = (prog.eligibleCategories || []).map((c) => c.toLowerCase().trim());
                      return (
                        eligibleCats.length === 0 ||
                        eligibleCats.includes(fCat) ||
                        eligibleCats.includes('general') ||
                        pCat === fCat ||
                        pCat === 'general'
                      );
                    }).length
                  })
                </button>
                <button
                  type="button"
                  onClick={() => setAssignTab('assigned')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    assignTab === 'assigned'
                      ? 'bg-white text-purple-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Assigned ({(liveAssigningParticipant.registeredProgrammes || []).length})
                </button>
                <button
                  type="button"
                  onClick={() => setAssignTab('all')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    assignTab === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({programmes.length})
                </button>
              </div>
            </div>

            {/* List of Programme Cards */}
            <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
              {(() => {
                const s = assignSearch.toLowerCase().trim();
                const fCat = (liveAssigningParticipant.category || '').toLowerCase().trim();

                const filtered = programmes.filter((prog) => {
                  const matchesSearch =
                    !s ||
                    (prog.code || '').toLowerCase().includes(s) ||
                    (prog.name || '').toLowerCase().includes(s) ||
                    (prog.category || '').toLowerCase().includes(s);
                  if (!matchesSearch) return false;

                  const isAssigned = (liveAssigningParticipant.registeredProgrammes || []).includes(prog.id);
                  if (assignTab === 'assigned') return isAssigned;

                  if (assignTab === 'eligible') {
                    const pCat = (prog.category || '').toLowerCase().trim();
                    const eligibleCats = (prog.eligibleCategories || []).map((c) => c.toLowerCase().trim());
                    const isEligible =
                      eligibleCats.length === 0 ||
                      eligibleCats.includes(fCat) ||
                      eligibleCats.includes('general') ||
                      pCat === fCat ||
                      pCat === 'general';
                    return isEligible || isAssigned;
                  }

                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="py-8 text-center text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No matching programmes found for this filter.
                    </div>
                  );
                }

                return filtered.map((prog) => {
                  const isAssigned = (liveAssigningParticipant.registeredProgrammes || []).includes(prog.id);
                  const isTeamEvent = prog.type === 'team' || prog.type === 'group' || prog.programmeType === 'team';

                  // Category check
                  const pCat = (prog.category || '').toLowerCase().trim();
                  const eligibleCats = (prog.eligibleCategories || []).map((c) => c.toLowerCase().trim());
                  const isCategoryEligible =
                    eligibleCats.length === 0 ||
                    eligibleCats.includes(fCat) ||
                    eligibleCats.includes('general') ||
                    pCat === fCat ||
                    pCat === 'general';

                  // Team quota check
                  const maxAllowedPerTeam = isTeamEvent ? (prog.maxTeamMembers || 25) : (prog.maxParticipantsPerTeam || 1);
                  const otherTeamMembers = participants.filter(
                    (p) =>
                      p.teamId === liveAssigningParticipant.teamId &&
                      p.id !== liveAssigningParticipant.id &&
                      p.status !== 'inactive' &&
                      p.registeredProgrammes?.includes(prog.id)
                  );
                  const currentTeamCount = otherTeamMembers.length;
                  const isTeamQuotaFull = currentTeamCount >= maxAllowedPerTeam;

                  // Overall capacity check
                  const maxCap = prog.maxCapacity || 0;
                  const totalInProg = participants.filter(
                    (p) =>
                      p.id !== liveAssigningParticipant.id &&
                      p.status !== 'inactive' &&
                      p.registeredProgrammes?.includes(prog.id)
                  ).length;
                  const isCapFull = maxCap > 0 && totalInProg >= maxCap;

                  return (
                    <div
                      key={prog.id}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isAssigned
                          ? 'bg-purple-50/80 border-purple-300 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {prog.code}
                          </span>
                          <span className="font-bold text-slate-900 text-xs">
                            {prog.name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                            {prog.category}
                          </span>
                          {isTeamEvent && (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                              Team Event
                            </span>
                          )}
                          {prog.stageType && (
                            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              {prog.stageType === 'stage' ? 'Stage' : 'Off-Stage'}
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500">
                          <span>
                            Team Slots:{' '}
                            <strong className={currentTeamCount >= maxAllowedPerTeam ? 'text-rose-600' : 'text-slate-700'}>
                              {currentTeamCount + (isAssigned ? 1 : 0)} / {maxAllowedPerTeam}
                            </strong>
                          </span>
                          {maxCap > 0 && (
                            <span>
                              Total Cap: {totalInProg + (isAssigned ? 1 : 0)} / {maxCap}
                            </span>
                          )}
                          {!isCategoryEligible && (
                            <span className="text-amber-700 font-semibold text-[10px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              Ineligible Category
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        {isAssigned ? (
                          <button
                            type="button"
                            onClick={() => handleToggleAssignProg(prog.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-purple-700 hover:bg-rose-700 rounded-lg shadow-2xs transition-colors cursor-pointer group"
                            title="Click to remove from this event"
                          >
                            <Check className="w-3.5 h-3.5 group-hover:hidden" />
                            <X className="w-3.5 h-3.5 hidden group-hover:inline" />
                            <span className="group-hover:hidden">Assigned</span>
                            <span className="hidden group-hover:inline">Remove</span>
                          </button>
                        ) : isCategoryEligible && !isTeamQuotaFull && !isCapFull ? (
                          <button
                            type="button"
                            onClick={() => handleToggleAssignProg(prog.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-900 bg-white hover:bg-purple-50 border border-slate-300 hover:border-purple-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 text-purple-600" />
                            <span>Assign</span>
                          </button>
                        ) : isTeamQuotaFull ? (
                          <span className="px-2.5 py-1 text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">
                            Team Full
                          </span>
                        ) : isCapFull ? (
                          <span className="px-2.5 py-1 text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">
                            Capacity Full
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 text-slate-500 rounded-lg">
                            Ineligible
                          </span>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setAssigningParticipant(null)}
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
          if (deletingId) deleteParticipant(deletingId);
        }}
        title="Delete Participant Record"
        message="Are you sure you want to remove this participant? This action cannot be undone and will unregister them from assigned events."
      />
    </div>
  );
};
