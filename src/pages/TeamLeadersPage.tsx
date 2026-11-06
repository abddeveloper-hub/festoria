import React, { useState, useMemo } from 'react';
import { useFest } from '../context/FestContext';
import { User, Team } from '../types';
import { Badge } from '../components/common/Badge';
import { formatPhoneDisplay } from '../services/authService';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Building,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Edit,
  RotateCw,
  Ban,
  Unlock,
  ExternalLink,
  History,
  X,
  Sparkles,
  Info
} from 'lucide-react';

export const TeamLeadersPage: React.FC = () => {
  const {
    users,
    teams,
    activeFestId,
    activeFest,
    teamLeaderInvitations,
    createTeamLeaderAccount,
    updateTeamLeaderAccount,
    reassignTeamLeader,
    toggleTeamLeaderStatus,
    resendTeamLeaderInvite,
    activityLogs,
    addToast,
  } = useFest();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLeader, setSelectedLeader] = useState<User | null>(null);

  // Create Form State
  const [createForm, setCreateForm] = useState({
    name: '',
    phone: '',
    email: '',
    teamId: teams[0]?.id || '',
    institution: '',
    status: 'active' as 'active' | 'suspended' | 'inactive',
    remarks: '',
  });
  const [createError, setCreateError] = useState('');

  // Edit Form State
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    institution: '',
    remarks: '',
  });

  // Reassign Form State
  const [targetTeamId, setTargetTeamId] = useState('');
  const [reassignError, setReassignError] = useState('');

  // Team leaders for current fest
  const teamLeaders = useMemo(() => {
    return users.filter(
      (u) => u.role === 'team_leader' && (!u.festId || u.festId === activeFestId)
    );
  }, [users, activeFestId]);

  // Filtered leaders
  const filteredLeaders = useMemo(() => {
    return teamLeaders.filter((leader) => {
      const matchesSearch =
        leader.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (leader.phone && leader.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
        leader.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (leader.institution && leader.institution.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'all' ||
        leader.status === statusFilter ||
        (statusFilter === 'pending' && leader.invitationStatus === 'pending_verification');

      const matchesTeam = teamFilter === 'all' || leader.linkedTeamId === teamFilter;

      return matchesSearch && matchesStatus && matchesTeam;
    });
  }, [teamLeaders, searchQuery, statusFilter, teamFilter]);

  const handleOpenCreate = () => {
    // Pick the first team without an active leader if possible
    const unassignedTeam = teams.find(
      (t) => !teamLeaders.some((l) => l.linkedTeamId === t.id && l.status === 'active')
    );
    setCreateForm({
      name: '',
      phone: '',
      email: '',
      teamId: unassignedTeam?.id || teams[0]?.id || '',
      institution: '',
      status: 'active',
      remarks: '',
    });
    setCreateError('');
    setShowCreateModal(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!createForm.name.trim()) {
      setCreateError('Full name is required.');
      return;
    }
    if (!createForm.phone.trim()) {
      setCreateError('Registered mobile number is required.');
      return;
    }
    if (!createForm.email.trim() || !createForm.email.includes('@')) {
      setCreateError('A valid email address is required.');
      return;
    }
    if (!createForm.teamId) {
      setCreateError('Please assign a valid fest team.');
      return;
    }

    const res = createTeamLeaderAccount({
      name: createForm.name.trim(),
      phone: createForm.phone.trim(),
      email: createForm.email.trim(),
      teamId: createForm.teamId,
      institution: createForm.institution.trim(),
      status: createForm.status,
      remarks: createForm.remarks.trim(),
    });

    if (res.success) {
      setShowCreateModal(false);
    } else {
      setCreateError(res.message);
    }
  };

  const handleOpenEdit = (leader: User) => {
    setSelectedLeader(leader);
    setEditForm({
      name: leader.name,
      phone: leader.phone || '',
      email: leader.email,
      institution: leader.institution || '',
      remarks: leader.remarks || '',
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeader) return;

    updateTeamLeaderAccount(selectedLeader.id, {
      name: editForm.name.trim(),
      phone: editForm.phone.trim(),
      email: editForm.email.trim(),
      institution: editForm.institution.trim(),
      remarks: editForm.remarks.trim(),
    });
    setShowEditModal(false);
  };

  const handleOpenReassign = (leader: User) => {
    setSelectedLeader(leader);
    const otherTeam = teams.find((t) => t.id !== leader.linkedTeamId);
    setTargetTeamId(otherTeam?.id || '');
    setReassignError('');
    setShowReassignModal(true);
  };

  const handleReassignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeader || !targetTeamId) return;

    const res = reassignTeamLeader(selectedLeader.id, targetTeamId);
    if (res.success) {
      setShowReassignModal(false);
    } else {
      setReassignError(res.message);
    }
  };

  const handleOpenDetails = (leader: User) => {
    setSelectedLeader(leader);
    setShowDetailsModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header and Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Team Leader Account Management
          </h1>
          <p className="text-sm text-slate-500">
            Create, verify, assign teams, and manage credentials for all authorized Team Leaders in{' '}
            <strong className="text-slate-900">{activeFest?.name || 'Current Fest'}</strong>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Team Leader</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Total Team Leaders
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {teamLeaders.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across {teams.length} participating houses
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Active & Verified
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1 font-mono">
            {teamLeaders.filter((l) => l.status === 'active' && l.phoneVerified).length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">OTP phone authenticated</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Pending Phone OTP
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1 font-mono">
            {teamLeaders.filter((l) => !l.phoneVerified).length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Invited, awaiting sign-in</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Suspended Accounts
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-1 font-mono">
            {teamLeaders.filter((l) => l.status === 'suspended').length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Access restricted</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, institution..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="pending">Pending Verification</option>
              <option value="suspended">Suspended Only</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Team:</span>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 font-medium"
            >
              <option value="all">All Teams</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Team Leaders Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Leader Name & Contacts</th>
                <th className="py-3 px-4">Assigned House / Team</th>
                <th className="py-3 px-4">Institution / Dept</th>
                <th className="py-3 px-3 text-center">Phone Status</th>
                <th className="py-3 px-3 text-center">Account Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeaders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-700">No Team Leaders Found</p>
                    <p className="text-[11px] mt-0.5">
                      Try adjusting your search criteria or create a new Team Leader.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLeaders.map((leader) => {
                  const assignedTeam = teams.find((t) => t.id === leader.linkedTeamId);
                  return (
                    <tr key={leader.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{leader.name}</span>
                          <span className="font-mono text-[10px] text-slate-400 font-normal">
                            ({leader.id})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{leader.phone || 'No Phone Registered'}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{leader.email}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {assignedTeam ? (
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0 border border-slate-300"
                              style={{ backgroundColor: assignedTeam.colorHex || '#0f172a' }}
                            />
                            <div>
                              <div className="font-bold text-slate-900">{assignedTeam.name}</div>
                              <div className="text-[10px] font-mono text-slate-500">
                                Code: {assignedTeam.code}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Unassigned
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">
                          {leader.institution || assignedTeam?.institution || '—'}
                        </div>
                        {leader.department && (
                          <div className="text-[10px] text-slate-500">{leader.department}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {leader.phoneVerified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            Pending OTP
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {leader.status === 'active' && (
                          <Badge variant="success">Active</Badge>
                        )}
                        {leader.status === 'suspended' && (
                          <Badge variant="error">Suspended</Badge>
                        )}
                        {leader.status === 'inactive' && (
                          <Badge variant="neutral">Inactive</Badge>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(leader)}
                            title="View Account Details & Audit"
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(leader)}
                            title="Edit Details"
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenReassign(leader)}
                            title="Reassign Team"
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>

                          {!leader.phoneVerified && (
                            <button
                              type="button"
                              onClick={() => resendTeamLeaderInvite(leader.id)}
                              title="Resend SMS Invite / Verification"
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {leader.status === 'active' ? (
                            <button
                              type="button"
                              onClick={() => toggleTeamLeaderStatus(leader.id, 'suspended')}
                              title="Suspend Account"
                              className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleTeamLeaderStatus(leader.id, 'active')}
                              title="Reactivate Account"
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded transition-colors"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE TEAM LEADER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-slate-900" />
                <h3 className="text-base font-bold text-slate-900">
                  Create New Team Leader Account
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 overflow-y-auto space-y-4">
              {createError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Team Leader Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g. Prof. Rajesh Varma"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registered Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="+91 98400 XXXXX"
                    className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                  />
                  <p className="mt-1 text-[10px] text-slate-500">
                    Leader will sign in using this phone and verify via OTP.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="leader@college.edu"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Fest Team / House <span className="text-rose-500">*</span>
                </label>
                <select
                  value={createForm.teamId}
                  onChange={(e) => setCreateForm({ ...createForm, teamId: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 font-medium"
                >
                  {teams.map((t) => {
                    const currentLeader = teamLeaders.find(
                      (l) => l.linkedTeamId === t.id && l.status === 'active'
                    );
                    return (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.code}) {currentLeader ? `— [Leader: ${currentLeader.name}]` : '— [Vacant]'}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Institution / Organization
                  </label>
                  <input
                    type="text"
                    value={createForm.institution}
                    onChange={(e) => setCreateForm({ ...createForm, institution: e.target.value })}
                    placeholder="e.g. Dept of Physics"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Account Status
                  </label>
                  <select
                    value={createForm.status}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        status: e.target.value as 'active' | 'suspended' | 'inactive',
                      })
                    }
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                  >
                    <option value="active">Active (Pending Phone Verification)</option>
                    <option value="inactive">Inactive / Draft</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admin Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  value={createForm.remarks}
                  onChange={(e) => setCreateForm({ ...createForm, remarks: e.target.value })}
                  placeholder="Optional internal remarks or faculty authorization reference..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
                >
                  Create & Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REASSIGN TEAM MODAL */}
      {showReassignModal && selectedLeader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <RotateCw className="w-5 h-5 text-slate-900" />
                <h3 className="text-base font-bold text-slate-900">Reassign Team Leader</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReassignModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Reassign <strong className="text-slate-900">{selectedLeader.name}</strong> to a different
              fest team. This updates both team and leader relationships in the database.
            </p>

            {reassignError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium">
                {reassignError}
              </div>
            )}

            <form onSubmit={handleReassignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select New Target Team
                </label>
                <select
                  value={targetTeamId}
                  onChange={(e) => setTargetTeamId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 font-medium"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code}) {t.id === selectedLeader.linkedTeamId ? '— [Current]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReassignModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 shadow-xs"
                >
                  Confirm Reassignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && selectedLeader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Edit Team Leader: {selectedLeader.name}
              </h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Institution / College
                </label>
                <input
                  type="text"
                  value={editForm.institution}
                  onChange={(e) => setEditForm({ ...editForm, institution: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks</label>
                <textarea
                  rows={2}
                  value={editForm.remarks}
                  onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILS & AUDIT MODAL */}
      {showDetailsModal && selectedLeader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-slate-900" />
                <h3 className="text-base font-bold text-slate-900">
                  Team Leader Account & Audit Log
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Name:</span>
                  <span className="font-bold text-slate-900">{selectedLeader.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">User ID:</span>
                  <span className="font-mono text-slate-700">{selectedLeader.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mobile Number:</span>
                  <span className="font-mono text-slate-900 font-bold">{selectedLeader.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone Verification:</span>
                  <span className={selectedLeader.phoneVerified ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                    {selectedLeader.phoneVerified ? 'Verified via OTP' : 'Pending Verification'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned Team:</span>
                  <span className="font-bold text-slate-900">
                    {teams.find((t) => t.id === selectedLeader.linkedTeamId)?.name || 'None'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Login:</span>
                  <span className="text-slate-700">{selectedLeader.lastLogin || 'Never logged in'}</span>
                </div>
                {teamLeaderInvitations.find((inv) => inv.phone && selectedLeader.phone && (inv.phone.includes(selectedLeader.phone.replace(/[^0-9]/g, '')) || inv.teamId === selectedLeader.linkedTeamId)) && (
                  <div className="flex justify-between pt-1 border-t border-slate-200/80">
                    <span className="text-slate-500">Invitation Record:</span>
                    <span className="font-mono text-slate-800 font-semibold">
                      {teamLeaderInvitations.find((inv) => inv.phone && selectedLeader.phone && (inv.phone.includes(selectedLeader.phone.replace(/[^0-9]/g, '')) || inv.teamId === selectedLeader.linkedTeamId))?.id}
                      {' '}({teamLeaderInvitations.find((inv) => inv.phone && selectedLeader.phone && (inv.phone.includes(selectedLeader.phone.replace(/[^0-9]/g, '')) || inv.teamId === selectedLeader.linkedTeamId))?.status})
                    </span>
                  </div>
                )}
                {selectedLeader.remarks && (
                  <div className="pt-1.5 border-t border-slate-200 text-slate-600">
                    <strong>Admin Remarks:</strong> {selectedLeader.remarks}
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-slate-600" />
                  Recent Audit & Activity Records
                </h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {activityLogs
                    .filter((l) => l.targetId === selectedLeader.id || l.details.includes(selectedLeader.name))
                    .map((log) => (
                      <div key={log.id} className="p-2 bg-slate-50 rounded border border-slate-200 text-[11px]">
                        <div className="flex justify-between text-slate-500 font-mono text-[10px]">
                          <span>{log.action}</span>
                          <span>{log.timestamp}</span>
                        </div>
                        <p className="text-slate-800 mt-0.5">{log.details}</p>
                      </div>
                    ))}
                  {activityLogs.filter(
                    (l) => l.targetId === selectedLeader.id || l.details.includes(selectedLeader.name)
                  ).length === 0 && (
                    <p className="text-slate-400 italic">No specific audit entries recorded yet.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
