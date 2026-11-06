import React, { useState, useMemo } from 'react';
import { useFest } from '../../context/FestContext';
import { Complaint, ComplaintCategory, ComplaintStatus } from '../../types';
import {
  AlertTriangle,
  Plus,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  Filter,
  X,
  AlertCircle,
  ArrowRight,
  Eye,
  Sparkles
} from 'lucide-react';

export const ComplaintsPage: React.FC = () => {
  const {
    complaints,
    activeTeamId,
    activeTeam,
    activeFestId,
    programmes,
    participants,
    submitComplaint,
    updateComplaintStatus,
    resolveComplaint,
    currentUser,
  } = useFest();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // New Complaint Form State
  const [formData, setFormData] = useState({
    programmeId: '',
    participantId: '',
    category: 'score_entry_error' as ComplaintCategory,
    resultReference: '',
    description: '',
    expectedCorrection: '',
  });
  const [formError, setFormError] = useState('');

  // Team's complaints
  const teamComplaints = useMemo(() => {
    return complaints.filter((c) => c.teamId === activeTeamId);
  }, [complaints, activeTeamId]);

  // Filtered complaints
  const filteredComplaints = useMemo(() => {
    return teamComplaints.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          c.id.toLowerCase().includes(q) ||
          c.programmeName.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [teamComplaints, statusFilter, searchQuery]);

  // Team members for participant dropdown
  const teamMembers = useMemo(() => {
    return participants.filter((p) => p.teamId === activeTeamId);
  }, [participants, activeTeamId]);

  // Open modal
  const handleOpenNewModal = () => {
    setFormData({
      programmeId: programmes[0]?.id || '',
      participantId: '',
      category: 'score_entry_error',
      resultReference: '',
      description: '',
      expectedCorrection: '',
    });
    setFormError('');
    setShowNewModal(true);
  };

  const handleCreateComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.programmeId) {
      setFormError('Please select the programme in question.');
      return;
    }
    if (!formData.description.trim()) {
      setFormError('Please detail the specific scoring error or grievance.');
      return;
    }
    if (!formData.expectedCorrection.trim()) {
      setFormError('Please specify the expected relief / correction.');
      return;
    }

    const prg = programmes.find((p) => p.id === formData.programmeId);
    const part = teamMembers.find((m) => m.id === formData.participantId);

    submitComplaint({
      festId: activeFestId || 'fest-001',
      teamId: activeTeamId,
      teamName: activeTeam?.name || 'Solar Flare',
      programmeId: formData.programmeId,
      programmeName: prg?.name || formData.programmeId,
      participantId: formData.participantId || undefined,
      participantName: part?.name || undefined,
      category: formData.category,
      resultReference: formData.resultReference || undefined,
      description: formData.description.trim(),
      expectedCorrection: formData.expectedCorrection.trim(),
      status: 'submitted',
    });

    setShowNewModal(false);
  };

  // Status simulation buttons for demonstration / testing
  const handleSimulateStatus = (complaintId: string, status: ComplaintStatus) => {
    if (status === 'resolved') {
      resolveComplaint(
        complaintId,
        'Jury re-evaluated the score sheets and verified evidence. Adjustment confirmed and approved by Chief Judge.',
        89.5
      );
    } else {
      updateComplaintStatus(
        complaintId,
        status,
        `Status transitioned to ${status.replace('_', ' ')} during review workflow.`
      );
    }
    // Update local selected state
    if (selectedComplaint && selectedComplaint.id === complaintId) {
      const updated = complaints.find((c) => c.id === complaintId);
      if (updated) setSelectedComplaint(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Complaints, Appeals & Scoring Inquiries
          </h1>
          <p className="text-sm text-slate-500">
            Submit and track formal appeals regarding scoring discrepancies, rule interpretations, or result adjustments for <strong className="text-slate-900">{activeTeam?.name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenNewModal}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Lodge Formal Appeal</span>
          </button>
        </div>
      </div>

      {/* INTEGRITY SAFEGUARD ADVISORY BANNER */}
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
        <ShieldAlert size={20} className="text-slate-700 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 space-y-1">
          <h4 className="font-bold text-slate-900">
            Championship Evaluation Safeguard & Protocol
          </h4>
          <p>
            In accordance with fest integrity policies, Team Leaders cannot directly alter scores. All appeals are routed directly to the Chief Jury Panel and recorded with cryptographic audit timestamps. Scores are calibrated only upon verified jury consensus.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Total Lodged
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{teamComplaints.length}</div>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Under Jury Review
          </span>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {teamComplaints.filter((c) => c.status === 'under_review' || c.status === 'submitted').length}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Resolved / Approved
          </span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {teamComplaints.filter((c) => c.status === 'resolved').length}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Closed / Rejected
          </span>
          <div className="text-2xl font-bold text-slate-500 mt-1">
            {teamComplaints.filter((c) => c.status === 'rejected' || c.status === 'withdrawn').length}
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search complaint ID, programme, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900 bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Filter size={13} />
            Status:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-800 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="more_info_required">More Info Required</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Appeal Ref</th>
                <th className="py-3 px-4">Programme & Category</th>
                <th className="py-3 px-4">Issue Description</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Submitted At</th>
                <th className="py-3 px-4 text-right pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    No complaints or appeals found.
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((c) => {
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-900 block text-xs">
                          {c.id}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {c.participantName || 'Team Entry'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block text-xs truncate max-w-xs">
                          {c.programmeName}
                        </span>
                        <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 inline-block mt-0.5 capitalize">
                          {c.category.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-xs text-slate-700 line-clamp-2">
                          {c.description}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize ${
                            c.status === 'resolved'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : c.status === 'under_review'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : c.status === 'submitted'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : c.status === 'rejected'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {c.status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center text-xs text-slate-500 font-mono">
                        {c.submittedAt.slice(0, 16)}
                      </td>

                      <td className="py-3.5 px-4 text-right pr-6">
                        <button
                          onClick={() => setSelectedComplaint(c)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
                        >
                          Inspect Timeline
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Appeal Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Lodge Formal Appeal / Scoring Complaint
                </h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateComplaint} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Programme Contested <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.programmeId}
                  onChange={(e) => setFormData({ ...formData, programmeId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900 bg-white"
                >
                  <option value="">Select Programme</option>
                  {programmes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Team Member Involved (Optional if team entry)
                </label>
                <select
                  value={formData.participantId}
                  onChange={(e) => setFormData({ ...formData, participantId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900 bg-white"
                >
                  <option value="">Team Group Entry (All Members)</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Grievance Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ComplaintCategory })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900 bg-white"
                >
                  <option value="score_entry_error">Score Entry / Clerical Error</option>
                  <option value="incorrect_score_calc">Incorrect Sub-criterion Calculation</option>
                  <option value="judging_procedure">Judging Procedure / Penalty Misapplication</option>
                  <option value="incorrect_result">Incorrect Rank or Medal Published</option>
                  <option value="eligibility_dispute">Opponent Eligibility Dispute</option>
                  <option value="schedule_issue">Unannounced Schedule Alteration</option>
                  <option value="missing_result">Missing Score Record</option>
                  <option value="other">Other Grievance</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Detailed Description & Evidence Reference <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detail the exact sub-criterion, stage timing mark, audio timestamp, or score discrepancy observed..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Expected Relief / Correction <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Recalculate 2-point time penalty and adjust team standing"
                  value={formData.expectedCorrection}
                  onChange={(e) => setFormData({ ...formData, expectedCorrection: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3.5 py-2 font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  Submit Appeal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Complaint Detail Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs text-slate-400 block">{selectedComplaint.id}</span>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedComplaint.programmeName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Category:</span>
                  <span className="font-bold text-slate-800 capitalize">
                    {selectedComplaint.category.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Contender:</span>
                  <span className="font-bold text-slate-800">
                    {selectedComplaint.participantName || 'Team Entry'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Status:</span>
                  <span className="font-bold text-slate-900 uppercase">
                    {selectedComplaint.status.replace(/_/g, ' ')}
                  </span>
                </div>
                {selectedComplaint.calibratedScore !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Calibrated Score:</span>
                    <span className="font-bold text-emerald-700">
                      {selectedComplaint.calibratedScore} pts
                    </span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Issue Description</h4>
                <p className="p-2.5 rounded-lg border border-slate-200 bg-white text-slate-700">
                  {selectedComplaint.description}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Relief Requested</h4>
                <p className="p-2.5 rounded-lg border border-slate-200 bg-white text-slate-700">
                  {selectedComplaint.expectedCorrection}
                </p>
              </div>

              {selectedComplaint.resolutionNote && (
                <div>
                  <h4 className="font-bold text-emerald-900 mb-1">Official Jury Resolution</h4>
                  <p className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 font-medium">
                    {selectedComplaint.resolutionNote}
                  </p>
                </div>
              )}

              {/* Status History Timeline */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Audit & Review Timeline</h4>
                <div className="border border-slate-200 rounded-lg p-3 space-y-2.5 bg-slate-50/50">
                  {selectedComplaint.statusHistory.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[11px]">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">{step.actor}</span>
                          <span className="text-slate-400 font-mono">{step.date}</span>
                        </div>
                        <span className="text-slate-600 block">{step.note || `Status: ${step.status}`}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evaluator Simulation Bar */}
              <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/50 space-y-2">
                <span className="text-[11px] font-bold text-blue-900 block">
                  🧪 Evaluator / Jury Simulation Controls
                </span>
                <p className="text-[11px] text-blue-700">
                  Simulate jury decision transitions to test resolution lifecycle:
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleSimulateStatus(selectedComplaint.id, 'under_review')}
                    className="px-2 py-1 bg-white border border-blue-300 text-blue-800 rounded font-semibold text-[10px] hover:bg-blue-100"
                  >
                    Set "Under Review"
                  </button>
                  <button
                    onClick={() => handleSimulateStatus(selectedComplaint.id, 'resolved')}
                    className="px-2 py-1 bg-emerald-600 text-white rounded font-semibold text-[10px] hover:bg-emerald-700"
                  >
                    Simulate "Resolved"
                  </button>
                  <button
                    onClick={() => handleSimulateStatus(selectedComplaint.id, 'rejected')}
                    className="px-2 py-1 bg-rose-600 text-white rounded font-semibold text-[10px] hover:bg-rose-700"
                  >
                    Simulate "Rejected"
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedComplaint(null)}
                className="w-full py-2 text-xs font-semibold text-slate-900 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Close Timeline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
