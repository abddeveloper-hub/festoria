import React, { useState, useMemo } from 'react';
import { useFest } from '../../context/FestContext';
import { User, Role } from '../../types';
import {
  Users,
  Search,
  Filter,
  Plus,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  KeyRound,
  Edit2,
  Trash2,
  Lock,
  X,
  Check
} from 'lucide-react';

export const PlatformUsersPage: React.FC = () => {
  const { users, fests, teams, judges, addUser, updateUser, deleteUser, currentUser, addToast } = useFest();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<Role>('fest_admin');
  const [formDepartment, setFormDepartment] = useState('');

  const [viewTab, setViewTab] = useState<'directory' | 'permissions_matrix'>('directory');

  // Combined users list ensuring fests' admins, currentUser, judges and team leaders are included
  const allPlatformUsers = useMemo(() => {
    const rawUsers = Array.isArray(users) ? users.filter(Boolean) : [];
    const existingIds = new Set(rawUsers.map((u) => u?.id).filter(Boolean));
    const extra: User[] = [];

    // 1. Ensure current session super admin is present
    if (currentUser?.id && !existingIds.has(currentUser.id)) {
      existingIds.add(currentUser.id);
      extra.push(currentUser);
    }

    // 2. Include Fest administrators from fests
    (fests || []).forEach((f) => {
      if (f?.adminId && !existingIds.has(f.adminId)) {
        existingIds.add(f.adminId);
        extra.push({
          id: f.adminId,
          name: f.adminName || 'Fest Administrator',
          email: f.adminEmail || '',
          role: 'fest_admin',
          department: f.institution || 'Campus Administration',
          status: 'active',
          permissions: ['manage_fest', 'manage_programmes', 'manage_scores'],
          createdAt: f.createdAt || '2026-01-10',
        });
      }
    });

    // 3. Include Judges if registered
    (judges || []).forEach((j) => {
      if (j?.id && !existingIds.has(j.id)) {
        existingIds.add(j.id);
        extra.push({
          id: j.id,
          name: j.name || 'Platform Judge',
          email: j.email || '',
          phone: j.phone || '',
          role: 'judge',
          department: j.designation || 'Adjudication Panel',
          status: 'active',
          permissions: ['view_scores'],
          createdAt: '2026-01-15',
        });
      }
    });

    // 4. Include Team Leaders if registered
    (teams || []).forEach((t) => {
      const leaderKey = `TL-${t.id}`;
      if (t?.teamLeaderName && !existingIds.has(leaderKey)) {
        existingIds.add(leaderKey);
        extra.push({
          id: leaderKey,
          name: t.teamLeaderName,
          email: `${t.code?.toLowerCase() || 'leader'}@festoria.edu`,
          phone: t.teamLeaderContact || '',
          role: 'team_leader',
          department: t.institution || t.name,
          status: 'active',
          permissions: ['view_dashboard'],
          createdAt: t.createdAt || '2026-01-15',
        });
      }
    });

    return [...rawUsers, ...extra];
  }, [users, fests, judges, teams, currentUser]);

  const filteredUsers = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    return allPlatformUsers.filter((u) => {
      if (!u) return false;
      const matchSearch =
        !q ||
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.id || '').toLowerCase().includes(q);
      const matchRole =
        roleFilter === 'all' ||
        u.role === roleFilter ||
        (roleFilter === 'fest_admin' && (u.role === 'admin' || (u.role as string) === 'fest_admin'));
      const matchStatus = statusFilter === 'all' || u.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [allPlatformUsers, searchQuery, roleFilter, statusFilter]);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;

    const ok = addUser({
      name: formName.trim(),
      email: formEmail.trim(),
      role: formRole,
      department: formDepartment.trim() || 'Campus Operations',
      status: 'active',
      permissions: ['view_dashboard'],
    });

    if (ok !== false) {
      setShowAddModal(false);
      setFormName('');
      setFormEmail('');
      setFormDepartment('');
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    updateUser(editingUser.id, {
      name: formName.trim(),
      email: formEmail.trim(),
      role: formRole,
      department: formDepartment.trim(),
    });

    setEditingUser(null);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormName(user.name || '');
    setFormEmail(user.email || '');
    setFormRole(user.role || 'fest_admin');
    setFormDepartment(user.department || '');
  };

  const handleDeleteUser = (userId: string, userName?: string) => {
    if (!userId) return;
    if (currentUser?.id === userId) {
      if (typeof addToast === 'function') {
        addToast('error', 'Action Denied', 'You cannot delete your own active super admin account.');
      }
      return;
    }
    const confirmed = window.confirm(
      `Are you sure you want to delete user account "${userName || userId}"? This action will revoke their platform credentials.`
    );
    if (confirmed) {
      deleteUser(userId);
    }
  };

  // RBAC Matrix Definitions
  const rolesList: { role: Role; label: string }[] = [
    { role: 'super_admin', label: 'Super Admin' },
    { role: 'programme_manager', label: 'Platform Reviewer' },
    { role: 'fest_admin', label: 'Fest Admin' },
    { role: 'score_manager', label: 'Score Manager' },
    { role: 'judge', label: 'Judge' },
    { role: 'team_leader', label: 'Team Leader' },
    { role: 'participant', label: 'Participant' },
  ];

  const permissionsList = [
    { key: 'view_all_fests', label: 'View All Platform Fests' },
    { key: 'review_requests', label: 'Review Fest Requests' },
    { key: 'approve_reject_requests', label: 'Approve / Reject Requests' },
    { key: 'manage_admins', label: 'Manage Fest Admin Accounts' },
    { key: 'view_participants', label: 'View Participant Records' },
    { key: 'view_scores', label: 'View Scoring Sheets' },
    { key: 'publish_results', label: 'Ratify & Publish Results' },
    { key: 'manage_platform_settings', label: 'Control Platform Settings' },
    { key: 'view_audit_logs', label: 'Inspect Immutable Audit Logs' },
    { key: 'export_reports', label: 'Generate & Export Platform Reports' },
  ];

  const checkHasPermission = (role: Role, perm: string): boolean => {
    if (role === 'super_admin') return true;
    if (role === 'programme_manager') {
      return ['view_all_fests', 'review_requests', 'view_participants', 'view_scores', 'export_reports'].includes(perm);
    }
    if (role === 'fest_admin') {
      return ['view_participants', 'view_scores', 'publish_results', 'export_reports'].includes(perm);
    }
    if (role === 'score_manager') {
      return ['view_scores', 'publish_results'].includes(perm);
    }
    if (role === 'judge') {
      return ['view_scores'].includes(perm);
    }
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200 rounded p-4 sm:p-5 bg-white">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Platform User & RBAC Directory</h2>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {allPlatformUsers.length} ACCOUNTS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Global access identity registry, role-based capability boundaries, and authentication privileges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex border border-slate-200 rounded p-0.5 bg-slate-50 text-xs">
            <button
              onClick={() => setViewTab('directory')}
              className={`px-3 py-1.5 rounded font-medium transition-colors ${
                viewTab === 'directory' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              User Directory
            </button>
            <button
              onClick={() => setViewTab('permissions_matrix')}
              className={`px-3 py-1.5 rounded font-medium transition-colors ${
                viewTab === 'permissions_matrix' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              RBAC Permissions Matrix
            </button>
          </div>

          <button
            onClick={() => {
              setFormName('');
              setFormEmail('');
              setFormDepartment('');
              setFormRole('fest_admin');
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800 transition-colors shrink-0 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create User</span>
          </button>
        </div>
      </div>

      {viewTab === 'directory' ? (
        <>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search user name, email, or account ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 border border-slate-200 rounded px-2.5 py-2 bg-white text-slate-700">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400">Role:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-transparent font-medium focus:outline-none cursor-pointer"
                >
                  <option value="all">All Roles</option>
                  {rolesList.map((r) => (
                    <option key={r.role} value={r.role}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 border border-slate-200 rounded px-2.5 py-2 bg-white text-slate-700">
                <span className="text-slate-400">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent font-medium focus:outline-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Mobile Card List (shown on small screens) */}
          <div className="block lg:hidden space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-white border border-slate-200 rounded text-xs space-y-2">
                <p>No user accounts match your filters.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setRoleFilter('all');
                    setStatusFilter('all');
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredUsers.map((u, idx) => (
                <div key={u.id || `usr-m-${idx}`} className="p-4 bg-white border border-slate-200 rounded-lg space-y-3 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{u.name || 'Unnamed User'}</div>
                      <div className="text-[11px] text-slate-500 truncate">{u.email || 'No email registered'}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{u.id}</div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize shrink-0 ${
                      u.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {u.status || 'active'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 border border-slate-100 rounded text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Department</span>
                      <span className="font-medium text-slate-800 truncate block">{u.department || 'General'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">System Role</span>
                      <span className="font-medium text-slate-800 capitalize">
                        {typeof u.role === 'string' ? u.role.replace('_', ' ') : 'User'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Account Created</span>
                      <span className="font-mono text-slate-700 text-[10px]">{u.createdAt || '2026-01-15'}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(u)}
                      className="px-2.5 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium inline-flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    {currentUser?.id !== u.id && (
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="px-2.5 py-1 rounded border border-slate-200 text-rose-600 hover:bg-rose-50 text-xs font-medium inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Users Table */}
          <div className="hidden lg:block border border-slate-200 rounded overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Account ID</th>
                    <th className="px-4 py-3">Name & Email</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">System Role</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        No user accounts match your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u, idx) => (
                      <tr key={u.id || `usr-d-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-mono font-medium text-slate-900">{u.id}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{u.name || 'Unnamed User'}</div>
                          <div className="text-[11px] text-slate-500">{u.email || 'No email registered'}</div>
                        </td>
                        <td className="px-4 py-3">{u.department || 'General'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                            u.role === 'super_admin'
                              ? 'bg-slate-900 text-white'
                              : u.role === 'fest_admin' || u.role === 'admin'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}>
                            {typeof u.role === 'string' ? u.role.replace('_', ' ') : 'User'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{u.createdAt || '2026-01-15'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                            u.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {u.status || 'active'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(u)}
                              className="p-1 rounded border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                              title="Edit user details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {currentUser?.id !== u.id && (
                              <button
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                className="p-1 rounded border border-slate-200 text-rose-600 hover:bg-rose-50"
                                title="Delete user"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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
        </>
      ) : (
        /* RBAC PERMISSIONS MATRIX */
        <div className="border border-slate-200 rounded overflow-hidden bg-white">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-semibold text-slate-900 text-xs uppercase tracking-wider">
              Platform Role-Based Access Control (RBAC) Security Matrix
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">
              Enforced across backend routing and platform collections to protect against privilege escalation.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Capability / Operation</th>
                  {rolesList.map((r) => (
                    <th key={r.role} className="px-3 py-3 text-center">{r.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {permissionsList.map((perm) => (
                  <tr key={perm.key} className="hover:bg-slate-50/70">
                    <td className="px-4 py-2.5 font-medium text-slate-900">{perm.label}</td>
                    {rolesList.map((r) => {
                      const allowed = checkHasPermission(r.role, perm.key);
                      return (
                        <td key={r.role} className="px-3 py-2.5 text-center">
                          {allowed ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800">
                              <Check className="w-3 h-3" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-400">
                              <X className="w-3 h-3" />
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT USER MODAL */}
      {(showAddModal || editingUser) && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded border border-slate-200 shadow-xl max-w-md w-full p-6 text-slate-900 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-semibold text-slate-900">
                {editingUser ? `Edit User: ${editingUser.name}` : 'Provision New Platform User'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingUser(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={editingUser ? handleSaveEdit : handleCreateUser} className="space-y-3">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Iyer"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. maya@platform.edu"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Department / Campus Division</label>
                <input
                  type="text"
                  value={formDepartment}
                  onChange={(e) => setFormDepartment(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">System Role</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as any)}
                  className="w-full p-2 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-slate-400"
                >
                  {rolesList.map((r) => (
                    <option key={r.role} value={r.role}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingUser(null);
                  }}
                  className="px-3 py-1.5 border border-slate-200 rounded text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded hover:bg-slate-800 font-medium shadow-xs"
                >
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
