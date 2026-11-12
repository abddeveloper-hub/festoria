import React, { useState, useMemo } from 'react';
import { useFest } from '../../context/FestContext';
import { User, Fest } from '../../types';
import {
  UserCheck,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  Building,
  Shield,
  KeyRound,
  RotateCcw,
  Ban,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  Eye,
  X,
  History,
  Lock
} from 'lucide-react';

export const AdminManagementPage: React.FC = () => {
  const {
    users,
    fests,
    festRequests,
    addUser,
    updateUser,
    reassignFestAdmin,
    platformAuditLogs,
    addToast
  } = useFest();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedAdmin, setSelectedAdmin] = useState<User | null>(null);

  // Reassignment Modal State
  const [reassignFestModal, setReassignFestModal] = useState<Fest | null>(null);
  const [selectedNewAdminId, setSelectedNewAdminId] = useState('');

  // Create Admin Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDepartment, setNewDepartment] = useState('Fest Administration');
  const [newRole, setNewRole] = useState<'fest_admin' | 'super_admin' | 'programme_manager'>('fest_admin');

  // Filter Fest Admins with safety against null/undefined records
  const adminUsers = useMemo(() => {
    const directAdmins = users.filter((u) => u && (u.role === 'fest_admin' || u.role === 'admin' || u.role === 'super_admin'));
    const existingIds = new Set(directAdmins.map((u) => u.id));
    const existingEmails = new Set(directAdmins.map((u) => (u.email || '').toLowerCase()).filter(Boolean));

    const extraAdmins: User[] = [];

    // Synthesize admin accounts from active fests if not already present
    (fests || []).forEach((f) => {
      const fEmail = (f.adminEmail || '').toLowerCase();
      if (f.adminId && !existingIds.has(f.adminId) && (!fEmail || !existingEmails.has(fEmail))) {
        existingIds.add(f.adminId);
        if (fEmail) existingEmails.add(fEmail);
        extraAdmins.push({
          id: f.adminId,
          name: f.adminName || 'Fest Administrator',
          email: f.adminEmail || '',
          role: 'fest_admin',
          department: f.institution || 'Festival Committee',
          status: 'active',
          permissions: ['manage_fest', 'manage_programmes', 'manage_scores'],
          createdAt: f.createdAt || '2026-01-10',
        });
      }
    });

    // Synthesize admin accounts from fest applications
    (festRequests || []).forEach((r) => {
      const rEmail = (r.requestingAdminEmail || '').toLowerCase();
      if (r.requestingAdminId && !existingIds.has(r.requestingAdminId) && (!rEmail || !existingEmails.has(rEmail))) {
        existingIds.add(r.requestingAdminId);
        if (rEmail) existingEmails.add(rEmail);
        extraAdmins.push({
          id: r.requestingAdminId,
          name: r.requestingAdminName || 'Applicant Admin',
          email: r.requestingAdminEmail || '',
          role: 'fest_admin',
          department: r.institution || 'Institutional Applicant',
          status: 'active',
          permissions: ['manage_fest'],
          createdAt: r.submissionDate || '2026-01-10',
        });
      }
    });

    return [...directAdmins, ...extraAdmins];
  }, [users, fests, festRequests]);

  const filteredAdmins = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    return adminUsers.filter((u) => {
      if (!u) return false;
      const matchSearch =
        !q ||
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.id || '').toLowerCase().includes(q) ||
        (u.department ? u.department.toLowerCase().includes(q) : false);
      const matchStatus = statusFilter === 'all' || u.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [adminUsers, searchQuery, statusFilter]);

  // Find fests managed by a specific admin (null-safe)
  const getFestsForAdmin = (adminId?: string, adminEmail?: string) => {
    const aId = adminId || '';
    const aEmail = (adminEmail || '').trim().toLowerCase();
    return (fests || []).filter((f) => {
      if (!f) return false;
      const fId = f.adminId || '';
      const fEmail = (f.adminEmail || '').trim().toLowerCase();
      return (aId && fId === aId) || (aEmail && fEmail && fEmail === aEmail);
    });
  };

  // Find requests submitted by a specific admin (null-safe)
  const getRequestsForAdmin = (adminId?: string, adminEmail?: string) => {
    const aId = adminId || '';
    const aEmail = (adminEmail || '').trim().toLowerCase();
    return (festRequests || []).filter((r) => {
      if (!r) return false;
      const rId = r.requestingAdminId || '';
      const rEmail = (r.requestingAdminEmail || '').trim().toLowerCase();
      return (aId && rId === aId) || (aEmail && rEmail && rEmail === aEmail);
    });
  };

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    const success = addUser({
      name: newName,
      email: newEmail,
      role: newRole,
      department: newDepartment,
      status: 'active',
      permissions: ['manage_fest', 'manage_programmes', 'manage_scores'],
    });

    if (success) {
      setShowCreateModal(false);
      setNewName('');
      setNewEmail('');
    }
  };

  const handleToggleAdminStatus = (admin: User) => {
    const newStatus = admin.status === 'active' ? 'inactive' : 'active';
    updateUser(admin.id, { status: newStatus });
    addToast('info', 'Status Updated', `Account for ${admin.name} is now ${newStatus}.`);
  };

  const handleTriggerRecovery = (admin: User) => {
    addToast('success', 'Recovery Dispatched', `A secure single-use password reset link has been dispatched to ${admin.email}.`);
  };

  const handleConfirmReassign = () => {
    if (!reassignFestModal || !selectedNewAdminId) return;
    const targetAdmin = users.find((u) => u.id === selectedNewAdminId);
    if (!targetAdmin) return;

    reassignFestAdmin(reassignFestModal.id, targetAdmin.id, targetAdmin.name, targetAdmin.email);
    setReassignFestModal(null);
    setSelectedNewAdminId('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Invite Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200 rounded p-4 sm:p-5 bg-white">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Fest Admin Account Governance</h2>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {adminUsers.length} ADMINISTRATORS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Provision, review, and manage institutional Fest Admin credentials, access permissions, and fest leadership assignments.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800 transition-colors shrink-0 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Provision New Fest Admin</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search administrator name, email, department, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5 border border-slate-200 rounded px-2.5 py-2 bg-white text-slate-700">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Account Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-transparent font-medium focus:outline-none cursor-pointer"
          >
            <option value="all">All Accounts ({adminUsers.length})</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive / Suspended</option>
          </select>
        </div>
      </div>

      {/* Mobile Card List (shown on small screens) */}
      <div className="block lg:hidden space-y-3">
        {filteredAdmins.length === 0 ? (
          <div className="p-6 text-center text-slate-400 bg-white border border-slate-200 rounded text-xs">
            No administrator accounts match the query.
          </div>
        ) : (
          filteredAdmins.map((admin) => {
            const managedFests = getFestsForAdmin(admin.id, admin.email);
            const requests = getRequestsForAdmin(admin.id, admin.email);
            return (
              <div key={admin.id} className="p-4 bg-white border border-slate-200 rounded-lg space-y-3 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{admin.name || 'Unnamed Admin'}</div>
                    <div className="text-[11px] text-slate-500 truncate">{admin.email || 'No email specified'}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{admin.id}</div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize shrink-0 ${
                    admin.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {admin.status || 'active'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 border border-slate-100 rounded text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Department</span>
                    <span className="font-medium text-slate-800 truncate block">{admin.department || 'General Administration'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Platform Role</span>
                    <span className="font-medium text-slate-800 capitalize">{admin.role ? admin.role.replace('_', ' ') : 'Admin'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Assigned Fests</span>
                    <span className="font-medium text-slate-800">{managedFests.length} assigned</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Requests</span>
                    <span className="font-medium text-slate-800">{requests.length} submitted</span>
                  </div>
                </div>

                {managedFests.length > 0 && (
                  <div className="text-[11px] space-y-1">
                    <span className="text-slate-500 font-medium">Assigned: </span>
                    {managedFests.map((f) => (
                      <span key={f.id} className="inline-flex items-center gap-1 mr-2 px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">
                        {f.name}
                        <button
                          onClick={() => setReassignFestModal(f)}
                          className="text-[10px] text-indigo-600 underline font-medium"
                        >
                          Reassign
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">2FA Enforced</span>
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedAdmin(admin)}
                      className="px-2.5 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Profile</span>
                    </button>
                    <button
                      onClick={() => handleTriggerRecovery(admin)}
                      className="px-2 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs"
                      title="Dispatch Account Recovery Link"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleToggleAdminStatus(admin)}
                      className={`px-2 py-1 rounded border text-xs ${
                        admin.status === 'active'
                          ? 'border-slate-200 text-rose-600 hover:bg-rose-50'
                          : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                      }`}
                      title={admin.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
                    >
                      {admin.status === 'active' ? <Ban className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table of Admins */}
      <div className="hidden lg:block border border-slate-200 rounded overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Admin Account</th>
                <th className="px-4 py-3">Department & Affiliation</th>
                <th className="px-4 py-3">Platform Role</th>
                <th className="px-4 py-3">Assigned Fests</th>
                <th className="px-4 py-3">Proposals Submitted</th>
                <th className="px-4 py-3">Security & Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No administrator accounts match the query.
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => {
                  const managedFests = getFestsForAdmin(admin.id, admin.email);
                  const requests = getRequestsForAdmin(admin.id, admin.email);
                  return (
                    <tr key={admin.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{admin.name || 'Unnamed Admin'}</div>
                        <div className="text-[11px] text-slate-500">{admin.email || 'No email'}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{admin.id}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {admin.department || 'General Administration'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 capitalize">
                          {admin.role ? admin.role.replace('_', ' ') : 'Admin'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {managedFests.length === 0 ? (
                          <span className="text-slate-400 italic">None assigned</span>
                        ) : (
                          <div className="space-y-1">
                            {managedFests.map((f) => (
                              <div key={f.id} className="flex items-center gap-1.5">
                                <span className="font-medium text-slate-900">{f.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">({f.id})</span>
                                <button
                                  onClick={() => setReassignFestModal(f)}
                                  title="Reassign fest to another administrator"
                                  className="text-[10px] text-slate-500 hover:text-slate-900 underline ml-1"
                                >
                                  Reassign
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800">{requests.length} Requests</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                          admin.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {admin.status || 'active'}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">2FA Enforced</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => setSelectedAdmin(admin)}
                            title="View Full Profile & Governance History"
                            className="p-1 rounded border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleTriggerRecovery(admin)}
                            title="Dispatch Account Recovery Link"
                            className="p-1 rounded border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleAdminStatus(admin)}
                            title={admin.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
                            className={`p-1 rounded border ${
                              admin.status === 'active'
                                ? 'border-slate-200 text-rose-600 hover:bg-rose-50'
                                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            {admin.status === 'active' ? <Ban className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
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
      </div>

      {/* DETAIL MODAL / DRAWER */}
      {selectedAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col text-slate-900 text-xs">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{selectedAdmin.name}</h3>
                <p className="text-slate-500 mt-0.5">{selectedAdmin.email} • ID: {selectedAdmin.id}</p>
              </div>
              <button onClick={() => setSelectedAdmin(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 border border-slate-200 rounded bg-slate-50">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Role</span>
                  <span className="font-semibold text-slate-900 capitalize">{selectedAdmin.role ? selectedAdmin.role.replace('_', ' ') : 'Fest Admin'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Account Status</span>
                  <span className="font-semibold text-emerald-700 capitalize">{selectedAdmin.status || 'active'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Account Created</span>
                  <span className="font-mono text-slate-700">{selectedAdmin.createdAt || '2026-01-10'}</span>
                </div>
              </div>

              {/* Fests Managed */}
              <div className="border border-slate-200 rounded p-4 space-y-2">
                <h4 className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-slate-500" />
                  Assigned Fest Leadership
                </h4>
                {getFestsForAdmin(selectedAdmin.id, selectedAdmin.email).length === 0 ? (
                  <p className="text-slate-400 italic">No fests currently under this administrator's charge.</p>
                ) : (
                  <div className="space-y-2">
                    {getFestsForAdmin(selectedAdmin.id, selectedAdmin.email).map((f) => (
                      <div key={f.id} className="p-2 border border-slate-100 rounded bg-slate-50 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-900">{f.name} ({f.edition})</div>
                          <div className="text-[11px] text-slate-500">{f.institution} • {f.status}</div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedAdmin(null);
                            setReassignFestModal(f);
                          }}
                          className="px-2 py-1 text-[11px] border border-slate-200 rounded bg-white hover:bg-slate-50 font-medium text-slate-700"
                        >
                          Reassign Fest
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Proposal History */}
              <div className="border border-slate-200 rounded p-4 space-y-2">
                <h4 className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-slate-500" />
                  Historical Fest Applications
                </h4>
                {getRequestsForAdmin(selectedAdmin.id, selectedAdmin.email).length === 0 ? (
                  <p className="text-slate-400 italic">No applications submitted by this user.</p>
                ) : (
                  <div className="space-y-1.5">
                    {getRequestsForAdmin(selectedAdmin.id, selectedAdmin.email).map((r) => (
                      <div key={r.id} className="p-2 border border-slate-100 rounded flex items-center justify-between">
                        <div>
                          <span className="font-medium text-slate-900">{r.festName}</span>
                          <span className="text-[10px] text-slate-400 font-mono ml-2">({r.id})</span>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded capitalize bg-slate-100 text-slate-700">
                          {r.status.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                onClick={() => setSelectedAdmin(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded font-medium hover:bg-slate-800"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REASSIGN FEST MODAL */}
      {reassignFestModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded border border-slate-200 shadow-xl max-w-md w-full p-6 text-slate-900 text-xs">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2 mb-2">
              <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
              Reassign Fest Leadership
            </h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              Transfer administrative stewardship of <span className="font-semibold text-slate-900">"{reassignFestModal.name}"</span> to another qualified Fest Admin. All existing scoring, judges, and participant records remain preserved.
            </p>

            <div className="space-y-2 mb-4">
              <label className="font-semibold text-slate-700">Select New Fest Administrator:</label>
              <select
                value={selectedNewAdminId}
                onChange={(e) => setSelectedNewAdminId(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-400"
              >
                <option value="">-- Choose Authorized Admin --</option>
                {adminUsers
                  .filter((u) => u.id !== reassignFestModal.adminId)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email}) - {u.department || 'Fest Admin'}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setReassignFestModal(null)}
                className="px-3 py-1.5 border border-slate-200 rounded text-slate-700 hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReassign}
                disabled={!selectedNewAdminId}
                className="px-4 py-1.5 bg-slate-900 text-white rounded hover:bg-slate-800 disabled:opacity-50 font-medium shadow-xs"
              >
                Confirm Reassignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE ADMIN MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded border border-slate-200 shadow-xl max-w-md w-full p-6 text-slate-900 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-semibold text-slate-900">Provision Admin Account</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-3">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Kumar"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Official Institutional Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rajesh.kumar@university.edu"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Department / Organization</label>
                <input
                  type="text"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Assigned Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full p-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-400"
                >
                  <option value="fest_admin">Fest Admin (Individual Festival Manager)</option>
                  <option value="super_admin">Super Admin (Platform Governance)</option>
                  <option value="programme_manager">Programme Reviewer</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded hover:bg-slate-800 font-medium shadow-xs"
                >
                  Create & Dispatch Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
