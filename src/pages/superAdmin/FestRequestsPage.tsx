import React, { useState, useMemo } from 'react';
import { useFest } from '../../context/FestContext';
import { FestRequest, FestRequestStatus } from '../../types';
import {
  Inbox,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  UserCheck,
  Eye,
  Calendar,
  Building,
  User,
  Mail,
  Phone,
  FileText,
  Clock,
  History,
  AlertCircle,
  Check,
  X,
  Plus
} from 'lucide-react';

export const FestRequestsPage: React.FC = () => {
  const {
    festRequests,
    users,
    approveFestRequest,
    rejectFestRequest,
    requestMoreInfo,
    assignReviewer,
    submitFestRequest,
    currentUser,
    setSuperAdminTab,
    setActiveFestId
  } = useFest();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Selected request for detail review
  const [selectedRequest, setSelectedRequest] = useState<FestRequest | null>(null);

  // Modal dialog states
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'more_info' | 'assign' | null>(null);
  const [internalNote, setInternalNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [moreInfoMessage, setMoreInfoMessage] = useState('');
  const [selectedReviewerId, setSelectedReviewerId] = useState('');

  // New Request Submission Modal (for end-to-end testing of Workflow A)
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [newFestName, setNewFestName] = useState('');
  const [newEdition, setNewEdition] = useState('2026');
  const [newInstitution, setNewInstitution] = useState('');
  const [newCategory, setNewCategory] = useState('Cultural & Arts');
  const [newVenue, setNewVenue] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newExpectedParticipants, setNewExpectedParticipants] = useState(600);
  const [newPlannedProgrammes, setNewPlannedProgrammes] = useState(25);
  const [newDescription, setNewDescription] = useState('');

  const filteredRequests = useMemo(() => {
    return festRequests.filter((r) => {
      const matchSearch =
        r.festName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.institution.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.requestingAdminName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchCategory = categoryFilter === 'all' || r.category === categoryFilter;
      return matchSearch && matchStatus && matchCategory;
    });
  }, [festRequests, searchQuery, statusFilter, categoryFilter]);

  const uniqueCategories = Array.from(new Set(festRequests.map((r) => r.category)));

  // Reviewers list (Super Admins and Reviewers)
  const availableReviewers = users.filter((u) => u.role === 'super_admin' || u.role === 'programme_manager');

  const handleApproveConfirm = () => {
    if (!selectedRequest) return;
    approveFestRequest(selectedRequest.id, internalNote);
    setActionType(null);
    setInternalNote('');
    // refresh selectedRequest
    const updated = festRequests.find((r) => r.id === selectedRequest.id);
    if (updated) setSelectedRequest(updated);
  };

  const handleRejectConfirm = () => {
    if (!selectedRequest || !rejectionReason.trim()) return;
    rejectFestRequest(selectedRequest.id, rejectionReason, internalNote);
    setActionType(null);
    setRejectionReason('');
    setInternalNote('');
    const updated = festRequests.find((r) => r.id === selectedRequest.id);
    if (updated) setSelectedRequest(updated);
  };

  const handleMoreInfoConfirm = () => {
    if (!selectedRequest || !moreInfoMessage.trim()) return;
    requestMoreInfo(selectedRequest.id, moreInfoMessage);
    setActionType(null);
    setMoreInfoMessage('');
    const updated = festRequests.find((r) => r.id === selectedRequest.id);
    if (updated) setSelectedRequest(updated);
  };

  const handleAssignConfirm = () => {
    if (!selectedRequest || !selectedReviewerId) return;
    const revUser = users.find((u) => u.id === selectedReviewerId);
    if (!revUser) return;
    assignReviewer(selectedRequest.id, revUser.id, revUser.name);
    setActionType(null);
    setSelectedReviewerId('');
    const updated = festRequests.find((r) => r.id === selectedRequest.id);
    if (updated) setSelectedRequest(updated);
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFestName || !newInstitution || !newStartDate || !newEndDate) return;

    submitFestRequest({
      festName: newFestName,
      edition: newEdition,
      description: newDescription || `Annual inter-collegiate festival for ${newInstitution}.`,
      institution: newInstitution,
      category: newCategory,
      venue: newVenue || 'Main Campus Auditorium & Grounds',
      startDate: newStartDate,
      endDate: newEndDate,
      expectedParticipants: Number(newExpectedParticipants) || 500,
      plannedProgrammesCount: Number(newPlannedProgrammes) || 20,
      requestingAdminId: currentUser.id,
      requestingAdminName: currentUser.name,
      requestingAdminEmail: currentUser.email,
      requestingAdminPhone: '+91 98765 43210',
      supportingDocs: ['institutional_approval_letter.pdf', 'budget_proposal_2026.pdf'],
    });

    setShowNewRequestModal(false);
    setNewFestName('');
    setNewInstitution('');
    setNewStartDate('');
    setNewEndDate('');
  };

  return (
    <div className="space-y-6">
      {/* Header & New Request Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200 rounded p-4 sm:p-5 bg-white">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Fest Application Approvals</h2>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
              GOVERNANCE PIPELINE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review, scrutinise, and authorize official Fest operating proposals submitted by institutional admins.
          </p>
        </div>

        <button
          onClick={() => setShowNewRequestModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800 transition-colors shrink-0 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Submit New Fest Application</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search request ID, fest, institution, or applicant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 border border-slate-200 rounded px-2.5 py-2 bg-white text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses ({festRequests.length})</option>
              <option value="pending">Pending</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="more_info_required">More Info Required</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 border border-slate-200 rounded px-2.5 py-2 bg-white text-slate-700">
            <span className="text-slate-400">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="border border-slate-200 rounded overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Request ID</th>
                <th className="px-4 py-3">Fest Name & Category</th>
                <th className="px-4 py-3">Institution</th>
                <th className="px-4 py-3">Requesting Admin</th>
                <th className="px-4 py-3">Requested Dates</th>
                <th className="px-4 py-3">Submission Date</th>
                <th className="px-4 py-3">Reviewer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    No fest requests match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-900 font-medium">
                      {req.id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{req.festName} {req.edition}</div>
                      <div className="text-[11px] text-slate-500">{req.category}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-800 font-medium truncate max-w-xs">{req.institution}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">{req.venue}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{req.requestingAdminName}</div>
                      <div className="text-[11px] text-slate-500">{req.requestingAdminEmail}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                      {req.startDate} to {req.endDate}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {req.submissionDate}
                    </td>
                    <td className="px-4 py-3">
                      {req.assignedReviewerName ? (
                        <span className="font-medium text-slate-800">{req.assignedReviewerName}</span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                        req.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : req.status === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : req.status === 'more_info_required'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : req.status === 'under_review'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : req.status === 'pending'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {req.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="px-2.5 py-1 text-xs font-medium border border-slate-200 rounded text-slate-700 hover:text-slate-900 hover:bg-slate-50 inline-flex items-center gap-1 shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED REQUEST REVIEW DRAWER / MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col text-slate-900">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-900">
                    Application Review: {selectedRequest.festName} ({selectedRequest.edition})
                  </h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                    {selectedRequest.id}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Submitted {selectedRequest.submissionDate} by {selectedRequest.requestingAdminName}
                </p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Status Banner */}
              <div className="p-3 border rounded flex items-center justify-between bg-slate-50 border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">Application Status:</span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded capitalize ${
                    selectedRequest.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedRequest.status === 'rejected'
                      ? 'bg-rose-100 text-rose-800'
                      : selectedRequest.status === 'more_info_required'
                      ? 'bg-amber-100 text-amber-800'
                      : selectedRequest.status === 'under_review'
                      ? 'bg-indigo-100 text-indigo-800'
                      : selectedRequest.status === 'pending'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-slate-100 text-slate-800'
                  }`}>
                    {selectedRequest.status.replace('_', ' ')}
                  </span>
                </div>
                {selectedRequest.assignedReviewerName && (
                  <div className="text-slate-500">
                    Assigned Reviewer: <span className="font-semibold text-slate-900">{selectedRequest.assignedReviewerName}</span>
                  </div>
                )}
              </div>

              {/* Fest Information Card */}
              <div className="border border-slate-200 rounded p-4 space-y-3 bg-white">
                <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-slate-500" />
                  Fest & Institutional Identity
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Fest Name & Edition</span>
                    <span className="font-medium text-slate-900">{selectedRequest.festName} {selectedRequest.edition}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Category</span>
                    <span className="font-medium text-slate-900">{selectedRequest.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Institution</span>
                    <span className="font-medium text-slate-900">{selectedRequest.institution}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Venue & Campus</span>
                    <span className="font-medium text-slate-900">{selectedRequest.institutionAddress || selectedRequest.venue}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Proposed Dates</span>
                    <span className="font-medium text-slate-900">{selectedRequest.startDate} to {selectedRequest.endDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Scale & Projections</span>
                    <span className="font-medium text-slate-900">
                      {selectedRequest.expectedParticipants} Participants • {selectedRequest.plannedProgrammesCount} Programmes
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Description & Stated Objectives</span>
                  <p className="text-slate-700 leading-relaxed mt-0.5">{selectedRequest.description}</p>
                </div>
              </div>

              {/* Requesting Admin Information Card */}
              <div className="border border-slate-200 rounded p-4 space-y-3 bg-white">
                <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-500" />
                  Applicant & Fest Admin Profile
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Contact Person</span>
                    <span className="font-medium text-slate-900">{selectedRequest.contactPersonName || selectedRequest.requestingAdminName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Registered Email</span>
                    <span className="font-medium text-slate-900">{selectedRequest.requestingAdminEmail}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Contact Phone</span>
                    <span className="font-medium text-slate-900">{selectedRequest.requestingAdminPhone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Verification Status</span>
                    <span className="font-medium text-emerald-700">Firebase Phone Verified</span>
                  </div>
                </div>
              </div>

              {/* Supporting Documents & Notes */}
              <div className="border border-slate-200 rounded p-4 space-y-2 bg-white">
                <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-500" />
                  Supporting Institutional Documents
                </h4>
                {selectedRequest.supportingDocumentUrl && (
                  <div className="pt-1">
                    <a
                      href={selectedRequest.supportingDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 underline font-medium"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{selectedRequest.supportingDocumentUrl}</span>
                    </a>
                  </div>
                )}
                {selectedRequest.supportingDocs && selectedRequest.supportingDocs.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedRequest.supportingDocs.map((doc, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-slate-200 bg-slate-50 text-slate-700">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>{doc}</span>
                      </div>
                    ))}
                  </div>
                ) : !selectedRequest.supportingDocumentUrl && (
                  <p className="text-slate-400 italic">No external documents attached.</p>
                )}
              </div>

              {/* Reason / Notes if rejected or more info requested */}
              {selectedRequest.rejectionReason && (
                <div className="p-3 border border-rose-200 rounded bg-rose-50 text-rose-900 space-y-1">
                  <div className="font-semibold text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    Rejection Reason
                  </div>
                  <p className="text-xs">{selectedRequest.rejectionReason}</p>
                </div>
              )}

              {selectedRequest.moreInfoMessage && (
                <div className="p-3 border border-amber-200 rounded bg-amber-50 text-amber-900 space-y-1">
                  <div className="font-semibold text-xs flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-amber-600" />
                    More Information Requested
                  </div>
                  <p className="text-xs">{selectedRequest.moreInfoMessage}</p>
                </div>
              )}

              {/* Application Lifecycle & Audit History */}
              <div className="border border-slate-200 rounded p-4 space-y-2 bg-white">
                <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-4 h-4 text-slate-500" />
                  Application Audit Trail
                </h4>
                <div className="space-y-2 pt-1">
                  {selectedRequest.history.map((entry, idx) => (
                    <div key={idx} className="text-xs border-l-2 border-slate-300 pl-3 py-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{entry.action}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{entry.date}</span>
                      </div>
                      <div className="text-slate-500 text-[11px]">Actor: {entry.actor}</div>
                      {entry.note && <div className="text-slate-700 mt-0.5">{entry.note}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActionType('assign')}
                  className="px-3 py-1.5 text-xs font-medium border border-slate-200 bg-white rounded text-slate-700 hover:text-slate-900 hover:bg-slate-50"
                >
                  Assign Reviewer
                </button>
                <button
                  onClick={() => setActionType('more_info')}
                  className="px-3 py-1.5 text-xs font-medium border border-amber-200 bg-amber-50 text-amber-800 rounded hover:bg-amber-100"
                >
                  Request More Info
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActionType('reject')}
                  className="px-3 py-1.5 text-xs font-medium border border-rose-200 bg-rose-50 text-rose-700 rounded hover:bg-rose-100"
                >
                  Reject Request
                </button>
                <button
                  onClick={() => setActionType('approve')}
                  className="px-4 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700 flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve & Activate Fest</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG: APPROVE */}
      {actionType === 'approve' && selectedRequest && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-slate-200 shadow-xl max-w-md w-full p-6 text-slate-900">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2 text-emerald-700 mb-2">
              <CheckCircle2 className="w-5 h-5" />
              Confirm Approval of Fest Request
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Approving "{selectedRequest.festName}" will generate an active Fest record, assign operational ownership to {selectedRequest.requestingAdminName}, initialize platform milestones, and notify the admin.
            </p>

            <div className="space-y-1 mb-4 text-xs">
              <label className="font-medium text-slate-700">Internal Approval Note (Optional):</label>
              <textarea
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="e.g., Reviewed venue capacity and institutional clearance. Charter granted."
                rows={3}
                className="w-full p-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setActionType(null)}
                className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveConfirm}
                className="px-4 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700"
              >
                Confirm & Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG: REJECT */}
      {actionType === 'reject' && selectedRequest && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-slate-200 shadow-xl max-w-md w-full p-6 text-slate-900">
            <h3 className="text-base font-semibold text-rose-700 flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5" />
              Decline Fest Request
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              A clear reason must be provided to the applicant explaining why this fest request is declined.
            </p>

            <div className="space-y-3 mb-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Rejection Reason (Required):</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Clashes with existing regional university calendar; insufficient safety planning."
                  rows={3}
                  className="w-full p-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-400 mt-1"
                />
              </div>

              <div>
                <label className="font-medium text-slate-600">Internal Audit Note (Optional):</label>
                <input
                  type="text"
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="Super Admin review notes..."
                  className="w-full p-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-400 mt-1"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setActionType(null)}
                className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!rejectionReason.trim()}
                className="px-4 py-1.5 text-xs font-medium bg-rose-600 text-white rounded hover:bg-rose-700 disabled:opacity-50"
              >
                Decline Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG: MORE INFO */}
      {actionType === 'more_info' && selectedRequest && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-slate-200 shadow-xl max-w-md w-full p-6 text-slate-900">
            <h3 className="text-base font-semibold text-amber-700 flex items-center gap-2 mb-2">
              <HelpCircle className="w-5 h-5" />
              Request Additional Information
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Enter the specific details or institutional paperwork required before a final approval decision can be rendered.
            </p>

            <div className="space-y-1 mb-4 text-xs">
              <label className="font-medium text-slate-700">Information Required (Message to Admin):</label>
              <textarea
                value={moreInfoMessage}
                onChange={(e) => setMoreInfoMessage(e.target.value)}
                placeholder="e.g., Please provide the signed venue reservation NOC from Dean of Student Affairs."
                rows={3}
                className="w-full p-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setActionType(null)}
                className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMoreInfoConfirm}
                disabled={!moreInfoMessage.trim()}
                className="px-4 py-1.5 text-xs font-medium bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG: ASSIGN REVIEWER */}
      {actionType === 'assign' && selectedRequest && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-slate-200 shadow-xl max-w-md w-full p-6 text-slate-900">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2 mb-2">
              <UserCheck className="w-5 h-5 text-indigo-600" />
              Assign Reviewer
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Delegate examination of this fest application to a platform reviewer.
            </p>

            <div className="space-y-2 mb-4 text-xs">
              <label className="font-medium text-slate-700">Select Reviewer:</label>
              <select
                value={selectedReviewerId}
                onChange={(e) => setSelectedReviewerId(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-400"
              >
                <option value="">-- Choose an Authorized Reviewer --</option>
                {availableReviewers.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.role.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setActionType(null)}
                className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignConfirm}
                disabled={!selectedReviewerId}
                className="px-4 py-1.5 text-xs font-medium bg-slate-900 text-white rounded hover:bg-slate-800 disabled:opacity-50"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW FEST REQUEST SUBMISSION MODAL */}
      {showNewRequestModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col text-slate-900">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Submit New Fest Application</h3>
                <p className="text-xs text-slate-500 mt-0.5">Initiate review workflow for a new festival charter</p>
              </div>
              <button
                onClick={() => setShowNewRequestModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="font-medium text-slate-700 block mb-1">Fest Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Synergy Fest"
                    value={newFestName}
                    onChange={(e) => setNewFestName(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="font-medium text-slate-700 block mb-1">Edition</label>
                  <input
                    type="text"
                    value={newEdition}
                    onChange={(e) => setNewEdition(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Host Institution / University *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. National Institute of Design"
                  value={newInstitution}
                  onChange={(e) => setNewInstitution(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-400"
                  >
                    <option value="Cultural & Arts">Cultural & Arts</option>
                    <option value="Technical & Engineering">Technical & Engineering</option>
                    <option value="Management & Commerce">Management & Commerce</option>
                    <option value="Literary & Debating">Literary & Debating</option>
                    <option value="Sports & Athletics">Sports & Athletics</option>
                  </select>
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Campus Venue</label>
                  <input
                    type="text"
                    placeholder="e.g. North Grounds"
                    value={newVenue}
                    onChange={(e) => setNewVenue(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Expected Participants</label>
                  <input
                    type="number"
                    value={newExpectedParticipants}
                    onChange={(e) => setNewExpectedParticipants(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Planned Programmes</label>
                  <input
                    type="number"
                    value={newPlannedProgrammes}
                    onChange={(e) => setNewPlannedProgrammes(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Festival Description</label>
                <textarea
                  rows={2}
                  placeholder="Outline purpose, scope, and target participation..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewRequestModal(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded font-medium hover:bg-slate-800 shadow-xs"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
