import React, { useState, useMemo } from 'react';
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
  Filter
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
  } = useFest();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterProgramme, setFilterProgramme] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [viewingParticipant, setViewingParticipant] = useState<Participant | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importCsvText, setImportCsvText] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    teamId: teams[0]?.id || '',
    category: 'Senior' as ParticipantCategory,
    status: 'verified' as RegistrationStatus,
    registeredProgrammes: [] as string[],
  });

  // Filtered & Searched Data
  const filteredData = useMemo(() => {
    return participants.filter((p) => {
      // Search
      const s = search.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(s) ||
        p.id.toLowerCase().includes(s) ||
        p.email.toLowerCase().includes(s) ||
        p.phone.includes(s);
      if (!matchesSearch) return false;

      // Team
      if (filterTeam !== 'all' && p.teamId !== filterTeam) return false;

      // Category (case-insensitive)
      if (filterCategory !== 'all' && (p.category || '').trim().toLowerCase() !== filterCategory.trim().toLowerCase()) return false;

      // Status
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;

      // Programme
      if (filterProgramme !== 'all' && !p.registeredProgrammes.includes(filterProgramme)) {
        return false;
      }

      return true;
    });
  }, [participants, search, filterTeam, filterCategory, filterProgramme, filterStatus]);

  // Paginated records
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  // Handle open add modal
  const handleOpenAdd = () => {
    setEditingParticipant(null);
    const defaultCat = categories.filter((c) => c.enabled)[0]?.name || 'Senior';
    setFormData({
      name: '',
      email: '',
      phone: '',
      teamId: teams[0]?.id || '',
      category: defaultCat,
      status: 'verified',
      registeredProgrammes: [],
    });
    setIsAddModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEdit = (p: Participant) => {
    setEditingParticipant(p);
    setFormData({
      name: p.name,
      email: p.email,
      phone: p.phone,
      teamId: p.teamId,
      category: p.category,
      status: p.status,
      registeredProgrammes: [...p.registeredProgrammes],
    });
    setIsAddModalOpen(true);
  };

  // Submit add or edit
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.teamId) {
      addToast('error', 'Incomplete Form', 'Please fill all required participant fields.');
      return;
    }

    if (editingParticipant) {
      updateParticipant(editingParticipant.id, formData);
      setIsAddModalOpen(false);
    } else {
      const success = addParticipant(formData);
      if (success) {
        setIsAddModalOpen(false);
      }
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const exportRows = filteredData.map((p) => {
      const team = teams.find((t) => t.id === p.teamId);
      return {
        ID: p.id,
        Name: p.name,
        Email: p.email,
        Phone: p.phone,
        Team: team?.name || p.teamId,
        Category: p.category,
        Status: p.status,
        RegisteredProgrammesCount: p.registeredProgrammes.length,
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
          <h2 className="text-base font-bold text-slate-900">
            Participant Directory
          </h2>
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

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, ID, email..."
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
                <th className="py-3 px-3 w-24">ID</th>
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
                      <td className="py-3 px-3 font-mono font-medium text-slate-700">
                        {participant.id}
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
                        <div className="text-slate-700">{participant.email}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {participant.phone}
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
                          onClick={() => setViewingParticipant(participant)}
                          className="px-2 py-0.5 rounded text-[11px] bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold"
                        >
                          {participant.registeredProgrammes.length} assigned
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
                            onClick={() => setViewingParticipant(participant)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(participant)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
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
        <form onSubmit={handleSubmitForm} className="space-y-4">
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
                className="w-full text-xs border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:border-slate-500"
                placeholder="e.g. Aditi Sharma"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:border-slate-500"
                placeholder="aditi@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:border-slate-500"
                placeholder="+91 98401 23456"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Assigned Team *
              </label>
              <select
                value={formData.teamId}
                onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-500 bg-white"
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
                className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-500 bg-white"
              >
                {categories.filter((c) => c.enabled).map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} {c.isGeneral ? '(General / Any Age)' : c.minAge || c.maxAge ? `(Ages ${c.minAge || 0}-${c.maxAge || 'Open'})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
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

          {/* Registered Programmes multi-select checkboxes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-700">
                Assigned Programmes ({formData.registeredProgrammes.length} selected)
              </label>
              {formData.category && (
                <span className="text-[10px] text-slate-500 font-normal">
                  Showing programmes for: <strong className="text-slate-800">{formData.category}</strong>
                </span>
              )}
            </div>
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded p-2.5 space-y-1 bg-slate-50/50">
              {(() => {
                const availableProgrammes = programmes.filter((prog) => {
                  if (!formData.category) return true;
                  const pCat = (prog.category || '').toLowerCase().trim();
                  const fCat = (formData.category || '').toLowerCase().trim();
                  // Show only programmes allotted to this category, general events, or already checked
                  return (
                    pCat === fCat ||
                    pCat === 'general' ||
                    pCat.startsWith('general') ||
                    formData.registeredProgrammes.includes(prog.id)
                  );
                });

                if (availableProgrammes.length === 0) {
                  return (
                    <div className="py-4 text-center text-xs text-slate-400 italic">
                      No competition programmes allotted to category "{formData.category}".
                    </div>
                  );
                }

                return availableProgrammes.map((prog) => {
                  const checked = formData.registeredProgrammes.includes(prog.id);
                  return (
                    <label
                      key={prog.id}
                      className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-slate-900 hover:bg-slate-100/60 p-1 rounded transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const newProgList = checked
                            ? formData.registeredProgrammes.filter((id) => id !== prog.id)
                            : [...formData.registeredProgrammes, prog.id];
                          setFormData({ ...formData, registeredProgrammes: newProgList });
                        }}
                        className="rounded border-slate-300 text-slate-900 focus:ring-0"
                      />
                      <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">{prog.code}</span>
                      <span className="font-medium text-slate-800">{prog.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono ml-auto">({prog.category})</span>
                    </label>
                  );
                });
              })()}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs text-white bg-slate-900 rounded hover:bg-slate-800 font-medium"
            >
              {editingParticipant ? 'Save Changes' : 'Register Participant'}
            </button>
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
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Participant ID</span>
                <p className="font-mono font-bold text-slate-900">{viewingParticipant.id}</p>
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
                <p className="text-slate-800">{viewingParticipant.email}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Phone</span>
                <p className="font-mono text-slate-800">{viewingParticipant.phone}</p>
              </div>
            </div>

            {/* Registered Events and Achieved Results */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Registered Programmes & Results</h4>
              {viewingParticipant.registeredProgrammes.length === 0 ? (
                <p className="text-slate-400 italic">No programmes currently assigned.</p>
              ) : (
                <div className="space-y-2">
                  {viewingParticipant.registeredProgrammes.map((progId) => {
                    const prog = programmes.find((p) => p.id === progId);
                    const result = results.find(
                      (r) => r.programmeId === progId && r.participantId === viewingParticipant.id
                    );

                    return (
                      <div
                        key={progId}
                        className="p-2.5 border border-slate-200 rounded flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium text-slate-900">
                            {prog?.name || progId}
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
              )}
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
