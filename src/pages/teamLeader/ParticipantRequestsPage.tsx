import React, { useState, useMemo, useEffect } from 'react';
import { useFest } from '../../context/FestContext';
import { Participant, ParticipantApprovalStatus } from '../../types';
import { maskPhoneNumber, formatPhoneDisplay } from '../../services/authService';
import { subscribeToTeamRequests } from '../../firebase/firestoreService';
import { Badge } from '../../components/common/Badge';
import {
  UserCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Phone,
  Mail,
  Building,
  GraduationCap,
  Sparkles,
  Info,
  X,
  AlertTriangle,
  Send,
  Eye
} from 'lucide-react';

export const ParticipantRequestsPage: React.FC = () => {
  const {
    participants,
    activeFestId,
    activeTeamId,
    activeTeam,
    approveParticipantRequest,
    rejectParticipantRequest,
    requestMoreInfoForParticipant,
    addToast,
  } = useFest();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending_approval');

  // Real-time listener state
  const [realtimeRequests, setRealtimeRequests] = useState<Participant[] | null>(null);
  const [isLiveListening, setIsLiveListening] = useState(false);
  const [listenerError, setListenerError] = useState<string | null>(null);

  // Subscribe to real-time Firestore updates for authorized team only
  useEffect(() => {
    if (!activeTeamId) return;

    setIsLiveListening(true);
    setListenerError(null);

    const unsubscribe = subscribeToTeamRequests(
      activeTeamId,
      activeFestId || 'FEST-01',
      (items) => {
        setRealtimeRequests(items);
        setIsLiveListening(true);
      },
      (err) => {
        setListenerError(err.message || 'Error subscribing to real-time team requests.');
      }
    );

    return () => {
      unsubscribe();
    };
  }, [activeTeamId, activeFestId]);

  // Modals
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showMoreInfoModal, setShowMoreInfoModal] = useState(false);

  // Form states
  const [rejectionReason, setRejectionReason] = useState('');
  const [moreInfoMessage, setMoreInfoMessage] = useState('');
  const [actionError, setActionError] = useState('');

  // Requests relevant to the logged in Team Leader's team (merging real-time listener if available)
  const activeSource = realtimeRequests !== null ? realtimeRequests : participants;
  const teamRequests = useMemo(() => {
    return activeSource.filter(
      (p) =>
        (p.requestedTeamId === activeTeamId || p.teamId === activeTeamId) &&
        (p.approvalStatus || p.registrationSource === 'self_registration' || p.registrationSource === 'team_leader_invitation')
    );
  }, [activeSource, activeTeamId]);

  // Counts
  const pendingCount = teamRequests.filter((p) => p.approvalStatus === 'pending_approval' || p.approvalStatus === 'pending_verification').length;
  const approvedCount = teamRequests.filter((p) => p.approvalStatus === 'approved').length;
  const moreInfoCount = teamRequests.filter((p) => p.approvalStatus === 'more_info_required').length;
  const rejectedCount = teamRequests.filter((p) => p.approvalStatus === 'rejected').length;

  // Filtered
  const filteredRequests = useMemo(() => {
    return teamRequests.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.phone && p.phone.includes(searchQuery)) ||
        (p.college && p.college.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'all' || (p.approvalStatus || 'approved') === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [teamRequests, searchQuery, statusFilter]);

  const handleApprove = (participant: Participant) => {
    const res = approveParticipantRequest(participant.id);
    if (res.success) {
      if (showDetailsModal && selectedParticipant?.id === participant.id) {
        setShowDetailsModal(false);
      }
    }
  };

  const handleOpenReject = (participant: Participant) => {
    setSelectedParticipant(participant);
    setRejectionReason('');
    setActionError('');
    setShowRejectModal(true);
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipant) return;
    if (!rejectionReason.trim()) {
      setActionError('Please provide a reason for rejection.');
      return;
    }

    const res = rejectParticipantRequest(selectedParticipant.id, rejectionReason.trim());
    if (res.success) {
      setShowRejectModal(false);
      if (showDetailsModal) setShowDetailsModal(false);
    }
  };

  const handleOpenMoreInfo = (participant: Participant) => {
    setSelectedParticipant(participant);
    setMoreInfoMessage('');
    setActionError('');
    setShowMoreInfoModal(true);
  };

  const handleConfirmMoreInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipant) return;
    if (!moreInfoMessage.trim()) {
      setActionError('Please provide the details or documents requested.');
      return;
    }

    const res = requestMoreInfoForParticipant(selectedParticipant.id, moreInfoMessage.trim());
    if (res.success) {
      setShowMoreInfoModal(false);
      if (showDetailsModal) setShowDetailsModal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Participant Membership Requests
          </h1>
          <p className="text-sm text-slate-500">
            Review and approve registration requests for <strong className="text-slate-900">{activeTeam?.name}</strong>.
            Verified participants will join your official competition roster.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {listenerError ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              Live Sync Paused
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Real-Time Synced
            </span>
          )}
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
          <div className="text-[11px] text-slate-500 mt-1">Requires your decision</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Approved Members
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1 font-mono">
            {approvedCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Active on team roster</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            More Info Requested
          </div>
          <div className="text-2xl font-bold text-blue-700 mt-1 font-mono">
            {moreInfoCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Awaiting candidate reply</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Rejected Requests
          </div>
          <div className="text-2xl font-bold text-slate-500 mt-1 font-mono">
            {rejectedCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Ineligible or duplicate</div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, ID, phone, college..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs w-full sm:w-auto">
          <span className="text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 font-medium"
          >
            <option value="all">All Requests</option>
            <option value="pending_approval">Pending Approval ({pendingCount})</option>
            <option value="more_info_required">More Info Required ({moreInfoCount})</option>
            <option value="approved">Approved ({approvedCount})</option>
            <option value="rejected">Rejected ({rejectedCount})</option>
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Participant Details</th>
                <th className="py-3 px-4">College & Division</th>
                <th className="py-3 px-3 text-center">Category</th>
                <th className="py-3 px-3 text-center">Source</th>
                <th className="py-3 px-3 text-center">Phone Verified</th>
                <th className="py-3 px-3 text-center">Approval Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <UserCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-700">No Membership Requests Found</p>
                    <p className="text-[11px] mt-0.5">
                      New registration requests from candidates will appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{req.name}</span>
                        <span className="font-mono text-[10px] text-slate-400 font-normal">
                          ({req.id})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{maskPhoneNumber(req.phone)}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{req.email}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">
                        {req.college || req.institution || '—'}
                      </div>
                      {req.classOrDivision && (
                        <div className="text-[10px] text-slate-500">{req.classOrDivision}</div>
                      )}
                      <div className="text-[10px] text-slate-400 mt-0.5">Applied: {req.createdAt}</div>
                    </td>

                    <td className="py-3.5 px-3 text-center font-medium">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[11px]">
                        {req.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      {req.registrationSource === 'team_leader_invitation' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                          Team Invite
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                          Self-Registration
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      {req.phoneVerified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Pending OTP
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      {req.approvalStatus === 'approved' && (
                        <Badge variant="success">Approved</Badge>
                      )}
                      {req.approvalStatus === 'pending_approval' && (
                        <Badge variant="warning">Pending Review</Badge>
                      )}
                      {req.approvalStatus === 'pending_verification' && (
                        <Badge variant="warning">Pending Verification</Badge>
                      )}
                      {req.approvalStatus === 'more_info_required' && (
                        <Badge variant="info">More Info Needed</Badge>
                      )}
                      {req.approvalStatus === 'rejected' && (
                        <Badge variant="error">Rejected</Badge>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedParticipant(req);
                            setShowDetailsModal(true);
                          }}
                          title="View Details"
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {req.approvalStatus !== 'approved' && (
                          <button
                            type="button"
                            onClick={() => handleApprove(req)}
                            title="Approve Member"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-2xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                        )}

                        {req.approvalStatus === 'pending_approval' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenMoreInfo(req)}
                              title="Request More Info"
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            >
                              <HelpCircle className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenReject(req)}
                              title="Reject Request"
                              className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW DETAILS MODAL */}
      {showDetailsModal && selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Participant Registration Application
              </h3>
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Full Name:</span>
                  <span className="font-bold text-slate-900">{selectedParticipant.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Participant ID:</span>
                  <span className="font-mono text-slate-700">{selectedParticipant.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Mobile Number:</span>
                  <span className="font-mono text-slate-900">{formatPhoneDisplay(selectedParticipant.phone)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Email:</span>
                  <span className="text-slate-800">{selectedParticipant.email || 'Not provided'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Category:</span>
                  <span className="font-semibold text-slate-900">{selectedParticipant.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">College / Institution:</span>
                  <span className="text-slate-900">{selectedParticipant.college || selectedParticipant.institution}</span>
                </div>
                {selectedParticipant.classOrDivision && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Class / Division:</span>
                    <span className="text-slate-900">{selectedParticipant.classOrDivision}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Requested Team:</span>
                  <span className="font-bold text-slate-900">{activeTeam?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Phone Ownership Verification:</span>
                  <span className={selectedParticipant.phoneVerified ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                    {selectedParticipant.phoneVerified ? 'Verified via SMS OTP' : 'Pending Verification'}
                  </span>
                </div>
                {selectedParticipant.moreInfoRequest && (
                  <div className="p-2 bg-blue-50 border border-blue-200 rounded text-blue-900 mt-2">
                    <strong>More Info Request Note:</strong> {selectedParticipant.moreInfoRequest}
                  </div>
                )}
                {selectedParticipant.rejectionReason && (
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-900 mt-2">
                    <strong>Rejection Reason:</strong> {selectedParticipant.rejectionReason}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="px-3.5 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Close
              </button>

              {selectedParticipant.approvalStatus !== 'approved' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenReject(selectedParticipant)}
                    className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold hover:bg-rose-100"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(selectedParticipant)}
                    className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
                  >
                    Approve Application
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {showRejectModal && selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Reject Membership Request
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              You are about to reject the registration request from{' '}
              <strong className="text-slate-900">{selectedParticipant.name}</strong>. Please provide a clear explanation for this decision.
            </p>

            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium">
                {actionError}
              </div>
            )}

            <form onSubmit={handleConfirmReject} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Rejection <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Quota full for this category / Not enrolled in the eligible department..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-3.5 py-1.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 shadow-xs"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MORE INFO MODAL */}
      {showMoreInfoModal && selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Request More Information
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMoreInfoModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Ask <strong className="text-slate-900">{selectedParticipant.name}</strong> to clarify their eligibility or provide supplementary documentation.
            </p>

            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium">
                {actionError}
              </div>
            )}

            <form onSubmit={handleConfirmMoreInfo} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Required Details / Clarification Note <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={moreInfoMessage}
                  onChange={(e) => setMoreInfoMessage(e.target.value)}
                  placeholder="e.g. Please provide student ID card copy or proof of semester enrollment..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMoreInfoModal(false)}
                  className="px-3.5 py-1.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 shadow-xs"
                >
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
