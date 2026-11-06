import React, { useState, useMemo } from 'react';
import { useFest } from '../context/FestContext';
import {
  Programme,
  ProgrammeCategory,
  ProgrammeType,
  ProgrammeStatus,
  ParticipantCategory,
  ScoringCriterion
} from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import {
  Search,
  Plus,
  Copy,
  CalendarCheck,
  Eye,
  Edit2,
  Trash2,
  MapPin,
  Clock,
  Users,
  Award,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const ProgrammesPage: React.FC = () => {
  const {
    programmes,
    judges,
    teams,
    participants,
    addProgramme,
    updateProgramme,
    deleteProgramme,
    duplicateProgramme,
    publishProgrammeResults,
    hasPermission,
    addToast,
    navigateToTabWithFilter,
  } = useFest();

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('all');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProgramme, setEditingProgramme] = useState<Programme | null>(null);
  const [viewingProgramme, setViewingProgramme] = useState<Programme | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    category: 'Music' as ProgrammeCategory,
    type: 'individual' as ProgrammeType,
    eligibleCategories: ['Senior', 'Junior'] as ParticipantCategory[],
    assignedJudgeIds: [] as string[],
    venue: 'Auditorium Hall A',
    stage: 'Stage 1 (Main Hall)',
    date: '2026-11-06',
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

  const distinctDates = useMemo(() => {
    return Array.from(new Set(programmes.map((p) => p.date))).sort();
  }, [programmes]);

  const distinctCategories = useMemo(() => {
    return Array.from(new Set(programmes.map((p) => p.category))).sort();
  }, [programmes]);

  const filteredProgrammes = useMemo(() => {
    return programmes.filter((p) => {
      const s = search.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(s) ||
        p.code.toLowerCase().includes(s) ||
        p.venue.toLowerCase().includes(s);
      if (!matchesSearch) return false;

      if (filterCategory !== 'all' && p.category !== filterCategory) return false;
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;
      if (filterDate !== 'all' && p.date !== filterDate) return false;

      return true;
    });
  }, [programmes, search, filterCategory, filterStatus, filterDate]);

  const handleOpenAdd = () => {
    setEditingProgramme(null);
    setFormData({
      code: `EVT-0${programmes.length + 1}`,
      name: '',
      description: '',
      category: 'Literary',
      type: 'individual',
      eligibleCategories: ['Senior', 'Junior'],
      assignedJudgeIds: judges.length > 0 ? [judges[0].id] : [],
      venue: 'Auditorium Hall A',
      stage: 'Stage 1',
      date: '2026-11-06',
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
    setFormData({
      code: p.code,
      name: p.name,
      description: p.description,
      category: p.category,
      type: p.type,
      eligibleCategories: [...p.eligibleCategories],
      assignedJudgeIds: [...p.assignedJudgeIds],
      venue: p.venue,
      stage: p.stage,
      date: p.date,
      startTime: p.startTime,
      endTime: p.endTime,
      maxCapacity: p.maxCapacity || 15,
      status: p.status,
      criteria: p.criteria.map((c) => ({ ...c })),
      registeredParticipantIds: [...p.registeredParticipantIds],
      registeredTeamIds: [...p.registeredTeamIds],
    });
    setIsAddModalOpen(true);
  };

  const handleAddCriterion = () => {
    const id = `c_${Date.now().toString().slice(-4)}`;
    setFormData({
      ...formData,
      criteria: [...formData.criteria, { id, name: 'New Criterion', maxMarks: 20 }],
    });
  };

  const handleRemoveCriterion = (id: string) => {
    setFormData({
      ...formData,
      criteria: formData.criteria.filter((c) => c.id !== id),
    });
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code || !formData.venue) {
      addToast('error', 'Incomplete Form', 'Please complete the required programme fields.');
      return;
    }

    if (editingProgramme) {
      updateProgramme(editingProgramme.id, formData);
      setIsAddModalOpen(false);
    } else {
      const ok = addProgramme(formData);
      if (ok) setIsAddModalOpen(false);
    }
  };

  const canManage = hasPermission(['super_admin', 'admin', 'programme_manager']);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Programme & Event Roster
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure competitions, venues, scoring rubrics, and judge assignments.
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Programme</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
          const assignedJudges = judges.filter((j) =>
            prog.assignedJudgeIds.includes(j.id)
          );
          const totalMarks = prog.criteria.reduce((s, c) => s + c.maxMarks, 0);

          return (
            <div
              key={prog.id}
              className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      {prog.code}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900 mt-1.5 leading-snug">
                      {prog.name}
                    </h3>
                  </div>
                  <Badge variant={prog.status} size="sm">
                    {prog.status}
                  </Badge>
                </div>

                <p className="mt-2 text-[11px] text-slate-500 line-clamp-2">
                  {prog.description}
                </p>

                <div className="mt-3 space-y-1 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{prog.venue} ({prog.stage})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="font-mono">{prog.date} • {prog.startTime} - {prog.endTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>
                      {assignedJudges.length > 0
                        ? assignedJudges.map((j) => j.name).join(', ')
                        : 'No judges assigned'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>
                      {prog.type === 'individual'
                        ? `${prog.registeredParticipantIds.length} participants`
                        : `${prog.registeredTeamIds.length} teams registered`}
                      {prog.maxCapacity ? ` (Max: ${prog.maxCapacity})` : ''}
                    </span>
                  </div>
                </div>

                {/* Criteria Pill & Publication Status */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-mono">
                    {prog.criteria.length} criteria ({totalMarks} marks)
                  </span>
                  {prog.resultPublished ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                      <CheckCircle2 className="w-3 h-3" /> Results Live
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[10px]">Unpublished</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setViewingProgramme(prog)}
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </button>

                {canManage && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => duplicateProgramme(prog.id)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      title="Clone/Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(prog)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingId(prog.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Delete"
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

      {/* Add / Edit Programme Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingProgramme ? `Edit Programme: ${editingProgramme.name}` : 'Create New Competition Programme'}
        maxWidth="xl"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Code *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-500 font-mono"
                placeholder="e.g. MUS-03"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">Programme Title *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-500"
                placeholder="e.g. Solo Classical Violin Recital"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block font-medium text-slate-700 mb-1">Description</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-slate-300 rounded p-2 focus:outline-none focus:border-slate-500"
                placeholder="Guidelines, time limits, and performance rules"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as ProgrammeCategory })
                }
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white"
              >
                <option value="Literary">Literary</option>
                <option value="Performing Arts">Performing Arts</option>
                <option value="Fine Arts">Fine Arts</option>
                <option value="Music">Music</option>
                <option value="Dance">Dance</option>
                <option value="Theatre">Theatre</option>
                <option value="Digital Media">Digital Media</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Competition Type</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as ProgrammeType })
                }
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white"
              >
                <option value="individual">Individual</option>
                <option value="group">Group (Points Multiplier Applied)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as ProgrammeStatus })
                }
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white"
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Venue *</label>
              <input
                type="text"
                required
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                placeholder="e.g. Auditorium Hall A"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Stage</label>
              <input
                type="text"
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                placeholder="e.g. Stage 1 (Main Hall)"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Max Capacity</label>
              <input
                type="number"
                value={formData.maxCapacity}
                onChange={(e) => setFormData({ ...formData, maxCapacity: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                placeholder="15"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Start Time *</label>
              <input
                type="time"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">End Time *</label>
              <input
                type="time"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono"
              />
            </div>
          </div>

          {/* Judges multi-select */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Assigned Judges ({formData.assignedJudgeIds.length} assigned)
            </label>
            <div className="max-h-28 overflow-y-auto border border-slate-200 rounded p-2 bg-slate-50/50 space-y-1">
              {judges.map((j) => {
                const checked = formData.assignedJudgeIds.includes(j.id);
                return (
                  <label key={j.id} className="flex items-center gap-2 cursor-pointer">
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

          {/* Scoring Rubric / Criteria Builder */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-medium text-slate-700">
                Evaluation Criteria & Maximum Marks
              </label>
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
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3 py-1.5 text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-white bg-slate-900 rounded hover:bg-slate-800 font-medium"
            >
              {editingProgramme ? 'Save Changes' : 'Create Programme'}
            </button>
          </div>
        </form>
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
                <p className="font-semibold text-slate-900 capitalize">{viewingProgramme.type}</p>
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
                  {viewingProgramme.criteria.map((c) => (
                    <div key={c.id} className="flex justify-between">
                      <span className="text-slate-800">{c.name}</span>
                      <span className="font-mono font-bold text-slate-700">{c.maxMarks} marks</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
              <button
                onClick={() => {
                  setViewingProgramme(null);
                  navigateToTabWithFilter('scores', { programmeId: viewingProgramme.id });
                }}
                className="text-xs font-semibold text-slate-800 hover:underline flex items-center gap-1"
              >
                Go to Scoring Sheet &rarr;
              </button>

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
    </div>
  );
};
