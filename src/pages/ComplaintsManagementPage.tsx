import React, { useState, useMemo } from 'react';
import { useFest } from '../context/FestContext';
import { Complaint, ComplaintCategory, ComplaintStatus } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  AlertTriangle,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowUpRight,
  Clock,
  Send,
  MessageSquare,
  ShieldAlert,
  FileText,
  User,
  Building,
  CalendarCheck,
  Check,
  AlertCircle
} from 'lucide-react';

export const ComplaintsManagementPage: React.FC = () => {
  const {
    complaints,
    teams,
    programmes,
    updateComplaintStatus,
    resolveComplaint,
    hasPermission,
    currentUser,
    addToast,
  } = useFest();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Selected complaint for review modal
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Review action form state
  const [actionType, setActionType] = useState<'status_update' | 'resolve' | 'reject' | 'request_info'>('status_update');
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus>('under_review');
  const [reviewNote, setReviewNote] = useState('');
  const [calibratedScore, setCalibratedScore] = useState<string>('');
  const [formError, setFormError] = useState('');

  const canManage = hasPermission(['admin', 'fest_admin', 'super_admin']);

  // Filtered complaints
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      const q = search.toLowerCase();
      const team = teams.find((t) => t.id === c.teamId);
      const matchesSearch =
        c.id.toLowerCase().includes(q) ||
        c.programmeName.toLowerCase().includes(q) ||
        (team?.name.toLowerCase().includes(q) ?? false) ||
        c.description.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (filterStatus !== 'all' && c.status !== filterStatus) return false;
      if (filterCategory !== 'all' && (c.category || '').trim().toLowerCase() !== filterCategory.trim().toLowerCase()) return false;

      return true;
    });
  }, [complaints, search, filterStatus, filterCategory, teams]);

  // Counts
  const pendingCount = complaints.filter((c) => c.status === 'submitted' || c.status === 'under_review').length;
  const resolvedCount = complaints.filter((c) => c.status === 'resolved').length;
  const escalatedCount = complaints.filter((c) => c.status === 'escalated').length;
  const rejectedCount = complaints.filter((c) => c.status === 'rejected').length;

  const handleOpenReview = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setActionType('status_update');
    setSelectedStatus(complaint.status);
    setReviewNote('');
    setCalibratedScore(complaint.calibratedScore ? String(complaint.calibratedScore) : '');
    setFormError('');
    setShowReviewModal(true);
  };

  const handleApplyDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    if (!reviewNote.trim()) {
      setFormError('Please enter an official review response or audit note.');
      return;
    }

    if (actionType === 'resolve') {
      const parsedScore = calibratedScore.trim() ? parseFloat(calibratedScore) : undefined;
      if (calibratedScore.trim() && isNaN(parsedScore!)) {
        setFormError('Calibrated score must be a valid number.');
        return;
      }

      resolveComplaint(selectedComplaint.id, reviewNote.trim(), parsedScore);
      setShowReviewModal(false);
      return;
    }

    if (actionType === 'reject') {
      updateComplaintStatus(selectedComplaint.id, 'rejected', reviewNote.trim());
      setShowReviewModal(false);
      return;
    }

    if (actionType === 'request_info') {
      updateComplaintStatus(selectedComplaint.id, 'more_info_required', reviewNote.trim());
      setShowReviewModal(false);
      return;
    }

    // Default status update
    updateComplaintStatus(selectedComplaint.id, selectedStatus, reviewNote.trim());
    setShowReviewModal(false);
  };

  const getStatusBadge = (status: ComplaintStatus) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="warning">Submitted</Badge>;
      case 'under_review':
        return <Badge variant="info">Under Review</Badge>;
      case 'more_info_required':
        return <Badge variant="info">More Info Required</Badge>;
      case 'escalated':
        return <Badge variant="error">Escalated</Badge>;
      case 'resolved':
        return <Badge variant="success">Resolved</Badge>;
      case 'rejected':
        return <Badge variant="neutral">Rejected</Badge>;
      case 'withdrawn':
        return <Badge variant="neutral">Withdrawn</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const getCategoryLabel = (category: ComplaintCategory) => {
    switch (category) {
      case 'score_entry_error':
        return 'Score Entry Error';
      case 'incorrect_score_calc':
        return 'Score Calculation Error';
      case 'incorrect_result':
        return 'Incorrect Result';
      case 'missing_result':
        return 'Missing Result';
      case 'eligibility_dispute':
        return 'Eligibility Dispute';
      case 'judging_procedure':
        return 'Judging Procedure';
      case 'schedule_issue':
        return 'Schedule Issue';
      default:
        return 'General Grievance';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Appeals & Complaint Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review scoring appeals and grievances submitted by authorized Team Leaders with auditable resolutions.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Pending Review
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1 font-mono">
            {pendingCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Submitted or in evaluation</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Resolved Appeals
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1 font-mono">
            {resolvedCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Closed with jury notes</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Escalated Cases
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-1 font-mono">
            {escalatedCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Chief jury deliberation</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Rejected
          </div>
          <div className="text-2xl font-bold text-slate-500 mt-1 font-mono">
            {rejectedCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Deemed unsubstantiated</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, programme, team..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="more_info_required">More Info Required</option>
            <option value="escalated">Escalated</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">All Categories</option>
            <option value="score_entry_error">Score Entry Error</option>
            <option value="incorrect_score_calc">Score Calculation Error</option>
            <option value="incorrect_result">Incorrect Result</option>
            <option value="missing_result">Missing Result</option>
            <option value="eligibility_dispute">Eligibility Dispute</option>
            <option value="judging_procedure">Judging Procedure</option>
            <option value="schedule_issue">Schedule Issue</option>
            <option value="other">Other Grievance</option>
          </select>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Ref #</th>
                <th className="py-3 px-4">Team & House</th>
                <th className="py-3 px-4">Programme</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Lodged Date</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No complaints matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((c) => {
                  const teamObj = teams.find((t) => t.id === c.teamId);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {c.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{teamObj?.name || c.teamName}</div>
                        <div className="text-[11px] text-slate-500">{teamObj?.institution || 'Institution'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{c.programmeName}</div>
                        {c.resultReference && (
                          <div className="text-[10px] font-mono text-slate-400">Result ref: {c.resultReference}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {getCategoryLabel(c.category)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                        {c.submittedAt}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {getStatusBadge(c.status)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenReview(c)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review</span>
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

      {/* Review & Resolution Modal */}
      {showReviewModal && selectedComplaint && (
        <Modal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          title={`Official Review: ${selectedComplaint.id}`}
        >
          <form onSubmit={handleApplyDecision} className="space-y-4">
            {/* Header info */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between font-bold text-slate-900">
                <span>{selectedComplaint.programmeName}</span>
                <span>{getStatusBadge(selectedComplaint.status)}</span>
              </div>
              <div className="text-slate-600">
                Team: <strong>{selectedComplaint.teamName}</strong> | Category: <strong>{getCategoryLabel(selectedComplaint.category)}</strong>
              </div>
              <div className="text-slate-600">
                Submitted on: <span className="font-mono">{selectedComplaint.submittedAt}</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Grievance Description
              </label>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 leading-relaxed font-sans">
                {selectedComplaint.description}
              </div>
            </div>

            {selectedComplaint.expectedCorrection && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Expected Resolution by Team
                </label>
                <div className="p-2.5 bg-amber-50/60 border border-amber-200 rounded text-xs text-amber-900">
                  {selectedComplaint.expectedCorrection}
                </div>
              </div>
            )}

            {/* Status History Timeline */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Audit Timeline & History
              </label>
              <div className="max-h-32 overflow-y-auto space-y-2 p-2 border border-slate-200 rounded bg-white text-xs">
                {selectedComplaint.statusHistory.map((h, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[11px] pb-1 border-b border-slate-100 last:border-0">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-mono font-semibold text-slate-700">{h.date}</span> — <strong className="text-slate-900">{h.actor}</strong>: {h.note}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Review Decision Selector */}
            <div className="pt-2 border-t border-slate-200">
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Review Decision
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setActionType('status_update')}
                  className={`px-2.5 py-1.5 rounded text-xs font-semibold border transition-colors ${
                    actionType === 'status_update'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Status Update
                </button>
                <button
                  type="button"
                  onClick={() => setActionType('resolve')}
                  className={`px-2.5 py-1.5 rounded text-xs font-semibold border transition-colors ${
                    actionType === 'resolve'
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Resolve & Calibrate
                </button>
                <button
                  type="button"
                  onClick={() => setActionType('request_info')}
                  className={`px-2.5 py-1.5 rounded text-xs font-semibold border transition-colors ${
                    actionType === 'request_info'
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Request Info
                </button>
                <button
                  type="button"
                  onClick={() => setActionType('reject')}
                  className={`px-2.5 py-1.5 rounded text-xs font-semibold border transition-colors ${
                    actionType === 'reject'
                      ? 'bg-rose-700 text-white border-rose-700'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Reject
                </button>
              </div>
            </div>

            {actionType === 'status_update' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Change Status To
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as ComplaintStatus)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="under_review">Under Review</option>
                  <option value="escalated">Escalated to Chief Jury</option>
                  <option value="submitted">Submitted</option>
                </select>
              </div>
            )}

            {actionType === 'resolve' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Calibrated Score (Optional)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={calibratedScore}
                  onChange={(e) => setCalibratedScore(e.target.value)}
                  placeholder="e.g. 88.5 (Leave blank if no score adjustment needed)"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Entering a calibrated score will automatically adjust official score submissions with an auditable change record.
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Review Response / Note <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Explain the jury decision or reason for the status update..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            {formError && (
              <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors shadow-2xs"
              >
                Confirm & Apply Decision
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
