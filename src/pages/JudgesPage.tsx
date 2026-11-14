import React, { useState, useMemo } from 'react';
import { useFest } from '../context/FestContext';
import { Judge, JudgeStatus } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import {
  Search,
  Plus,
  Award,
  Eye,
  Edit2,
  Trash2,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  Building2
} from 'lucide-react';

export const JudgesPage: React.FC = () => {
  const {
    judges,
    programmes,
    scores,
    addJudge,
    updateJudge,
    deleteJudge,
    hasPermission,
    addToast,
  } = useFest();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingJudge, setEditingJudge] = useState<Judge | null>(null);
  const [viewingJudge, setViewingJudge] = useState<Judge | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    designation: '',
    institution: '',
    status: 'active' as JudgeStatus,
    notes: '',
    assignedProgrammes: [] as string[],
  });

  // Filtered judges
  const filteredJudges = useMemo(() => {
    return judges.filter((j) => {
      const s = search.toLowerCase();
      const matchesSearch =
        j.name.toLowerCase().includes(s) ||
        j.id.toLowerCase().includes(s) ||
        (j.email || '').toLowerCase().includes(s) ||
        (j.designation || '').toLowerCase().includes(s);
      if (!matchesSearch) return false;

      if (statusFilter !== 'all' && j.status !== statusFilter) return false;

      return true;
    });
  }, [judges, search, statusFilter]);

  const handleOpenAdd = () => {
    setEditingJudge(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      designation: '',
      institution: '',
      status: 'active',
      notes: '',
      assignedProgrammes: [],
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (j: Judge) => {
    setEditingJudge(j);
    setFormData({
      name: j.name,
      email: j.email,
      phone: j.phone,
      designation: j.designation,
      institution: j.institution || '',
      status: j.status,
      notes: j.notes || '',
      assignedProgrammes: [...j.assignedProgrammes],
    });
    setIsAddModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.designation) {
      addToast('error', 'Incomplete Form', 'Please fill all required judge fields.');
      return;
    }

    if (editingJudge) {
      updateJudge(editingJudge.id, formData);
      setIsAddModalOpen(false);
    } else {
      const success = addJudge(formData);
      if (success) setIsAddModalOpen(false);
    }
  };

  const canManage = hasPermission(['super_admin', 'admin', 'programme_manager']);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Judges Panel Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Empanel adjudicators, allocate competitions, and track evaluation completion.
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Judge</span>
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search judge by name, ID, domain..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:border-slate-400 text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-slate-500">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-400 text-slate-800"
          >
            <option value="all">All Statuses ({judges.length})</option>
            <option value="active">Active</option>
            <option value="on_break">On Break</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Judge Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredJudges.map((judge) => {
          // Compute pending vs completed assignments
          const judgeScores = scores.filter((s) => s.judgeId === judge.id);
          const assignedProgs = programmes.filter((p) =>
            judge.assignedProgrammes.includes(p.id)
          );
          const completedCount = assignedProgs.filter((p) => p.status === 'completed').length;
          const pendingCount = assignedProgs.length - completedCount;

          return (
            <div
              key={judge.id}
              className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                      {judge.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">
                        {judge.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-mono">{judge.id}</p>
                    </div>
                  </div>
                  <Badge variant={judge.status} size="sm">
                    {judge.status}
                  </Badge>
                </div>

                <div className="mt-3 space-y-1 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1.5 truncate">
                    <Award className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{judge.designation}</span>
                  </div>
                  {judge.institution && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{judge.institution}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{judge.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="font-mono">{judge.phone}</span>
                  </div>
                </div>

                {/* Assignment Stats Box */}
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Assigned</span>
                    <p className="font-mono font-bold text-slate-900 mt-0.5">
                      {judge.assignedProgrammes.length} events
                    </p>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Evaluations</span>
                    <p className="font-mono font-bold text-slate-900 mt-0.5">
                      {completedCount} done / {pendingCount} pend.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setViewingJudge(judge)}
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Profile</span>
                </button>

                {canManage && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(judge)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingId(judge.id)}
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

      {/* Add / Edit Judge Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingJudge ? `Edit Judge: ${editingJudge.name}` : 'Empanel New Judge'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-500"
                placeholder="e.g. Dr. K. Ramanathan"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-500"
                placeholder="ramanathan@example.com"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-500"
                placeholder="+91 98451 12345"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as JudgeStatus })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-500 bg-white"
              >
                <option value="active">Active</option>
                <option value="on_break">On Break</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">
                Designation / Area of Expertise *
              </label>
              <input
                type="text"
                required
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-500"
                placeholder="e.g. Senior Professor of Classical Carnatic Music"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">
                Institution / Affiliation
              </label>
              <input
                type="text"
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-500"
                placeholder="e.g. National Music Academy"
              />
            </div>
          </div>

          {/* Assigned Competitions Selection */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Assigned Competitions ({formData.assignedProgrammes.length} assigned)
            </label>
            <div className="max-h-36 overflow-y-auto border border-slate-200 rounded p-2.5 space-y-1.5 bg-slate-50/50">
              {programmes.map((p) => {
                const isAssigned = formData.assignedProgrammes.includes(p.id);
                return (
                  <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAssigned}
                      onChange={() => {
                        const next = isAssigned
                          ? formData.assignedProgrammes.filter((id) => id !== p.id)
                          : [...formData.assignedProgrammes, p.id];
                        setFormData({ ...formData, assignedProgrammes: next });
                      }}
                      className="rounded border-slate-300 text-slate-900"
                    />
                    <span className="font-mono text-[10px] text-slate-500">{p.code}</span>
                    <span className="text-slate-800">{p.name}</span>
                    <span className="text-slate-400 font-mono text-[10px]">({p.category})</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Private Notes / Credentials</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full border border-slate-300 rounded p-2 focus:outline-none focus:border-slate-500"
              placeholder="e.g. State jury member, requires acoustic monitor"
            />
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
              {editingJudge ? 'Save Changes' : 'Empanel Judge'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Judge Profile & History Modal */}
      {viewingJudge && (
        <Modal
          isOpen={!!viewingJudge}
          onClose={() => setViewingJudge(null)}
          title={`Judge Dossier: ${viewingJudge.name}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded border border-slate-200 grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Judge ID</span>
                <p className="font-mono font-bold text-slate-900">{viewingJudge.id}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Status</span>
                <p className="mt-0.5">
                  <Badge variant={viewingJudge.status} size="sm">
                    {viewingJudge.status}
                  </Badge>
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Expertise</span>
                <p className="font-medium text-slate-800">{viewingJudge.designation}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Institution</span>
                <p className="font-medium text-slate-800">{viewingJudge.institution || 'Independent'}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Assigned Competitions & Timetable</h4>
              <div className="space-y-2">
                {viewingJudge.assignedProgrammes.map((pId) => {
                  const prog = programmes.find((p) => p.id === pId);
                  const scoreCount = scores.filter(
                    (s) => s.judgeId === viewingJudge.id && s.programmeId === pId
                  ).length;

                  return (
                    <div
                      key={pId}
                      className="p-2.5 border border-slate-200 rounded flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">
                          {prog?.name || pId}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {prog?.date} • {prog?.startTime}-{prog?.endTime} • {prog?.venue}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={prog?.status || 'draft'} size="sm">
                          {prog?.status}
                        </Badge>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {scoreCount} scores submitted
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {viewingJudge.notes && (
              <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                <span className="font-semibold">Internal Admin Note: </span>
                {viewingJudge.notes}
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewingJudge(null)}
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
          if (deletingId) deleteJudge(deletingId);
        }}
        title="Remove Judge"
        message="Are you sure you want to remove this judge? Their assignments will be unlinked from competitions."
      />
    </div>
  );
};
