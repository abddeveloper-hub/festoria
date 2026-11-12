import React, { useState, useMemo } from 'react';
import { useFest } from '../context/FestContext';
import { User, Role, UserStatus } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import {
  Search,
  Plus,
  Shield,
  UserCheck,
  UserX,
  KeyRound,
  History,
  Lock,
  Edit2,
  Trash2,
  CheckCircle2,
  Activity
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const {
    users,
    currentUser,
    activityLogs,
    judges,
    teams,
    addUser,
    updateUser,
    deleteUser,
    hasPermission,
    addToast,
    switchCurrentUser,
  } = useFest();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resettingUser, setResettingUser] = useState<User | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'programme_manager' as Role,
    status: 'active' as UserStatus,
    linkedJudgeId: '',
    linkedTeamId: '',
  });

  const filteredUsers = useMemo(() => {
    const s = (search || '').trim().toLowerCase();
    return (users || []).filter((u) => {
      if (!u) return false;
      const matchesSearch =
        !s ||
        (u.name || '').toLowerCase().includes(s) ||
        (u.id || '').toLowerCase().includes(s) ||
        (u.email || '').toLowerCase().includes(s);
      if (!matchesSearch) return false;

      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;

      return true;
    });
  }, [users, search, roleFilter, statusFilter]);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'programme_manager',
      status: 'active',
      linkedJudgeId: '',
      linkedTeamId: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      linkedJudgeId: u.linkedJudgeId || '',
      linkedTeamId: u.linkedTeamId || '',
    });
    setIsAddModalOpen(true);
  };

  const handleSubmitUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      addToast('error', 'Incomplete Form', 'Please enter user name and email.');
      return;
    }

    if (editingUser) {
      updateUser(editingUser.id, formData);
      setIsAddModalOpen(false);
    } else {
      const ok = addUser(formData);
      if (ok) setIsAddModalOpen(false);
    }
  };

  const handlePasswordReset = () => {
    if (resettingUser) {
      addToast(
        'success',
        'Password Reset Triggered',
        `A secure one-time credentials reset link was dispatched to ${resettingUser.email}.`
      );
      setResettingUser(null);
    }
  };

  const canManageUsers = hasPermission(['super_admin', 'admin', 'fest_admin']);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            User Accounts & Access Control (RBAC)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Administer role-based permissions, link judges/teams, and inspect activity audit logs.
          </p>
        </div>

        {canManageUsers && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create User Account</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search users by name, email, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:border-slate-400 text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-800"
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="programme_manager">Programme Manager</option>
            <option value="score_manager">Score Manager</option>
            <option value="judge">Judge</option>
            <option value="team_leader">Team Leader</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-800"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Mobile Card List (shown on small screens) */}
      <div className="block lg:hidden space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="p-6 text-center text-slate-400 bg-white border border-slate-200 rounded-lg text-xs shadow-xs">
            No users match the search and filter criteria.
          </div>
        ) : (
          filteredUsers.map((user) => {
            const isCurrent = user.id === currentUser?.id;
            const linkedJudge = (judges || []).find((j) => j.id === user.linkedJudgeId);
            const linkedTeam = (teams || []).find((t) => t.id === user.linkedTeamId);

            return (
              <div key={user.id} className="p-4 bg-white border border-slate-200 rounded-lg space-y-3 text-xs shadow-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {(user.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5 truncate">
                        <span className="truncate">{user.name || 'Unnamed User'}</span>
                        {isCurrent && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 border border-emerald-200 rounded font-normal shrink-0">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{user.email || 'No email registered'}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{user.id}</div>
                    </div>
                  </div>

                  <Badge variant={user.status || 'active'} size="sm">
                    {user.status || 'active'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 border border-slate-100 rounded text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">System Role</span>
                    <span className="font-medium text-slate-800 capitalize">
                      {(user.role || 'user').replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Linked Entity</span>
                    <span className="font-medium text-slate-800 truncate block">
                      {linkedJudge ? `Judge: ${linkedJudge.name}` : linkedTeam ? `Team: ${linkedTeam.name}` : 'Direct Staff'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Last active: {user.lastLogin || 'Never'}
                  </span>
                  {canManageUsers && (
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => setResettingUser(user)}
                        className="px-2.5 py-1 text-xs border border-slate-200 rounded text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1"
                        title="Reset Password"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Reset</span>
                      </button>
                      <button
                        onClick={() => handleOpenEdit(user)}
                        className="px-2.5 py-1 text-xs border border-slate-200 rounded text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1"
                        title="Edit User"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      {!isCurrent && (
                        <button
                          onClick={() => setDeletingId(user.id)}
                          className="px-2 py-1 text-xs border border-slate-200 rounded text-rose-600 hover:bg-rose-50"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Users Table */}
      <div className="hidden lg:block bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3">User</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Linked Record</th>
                <th className="py-3 px-2 text-center">Status</th>
                <th className="py-3 px-3 font-mono">Last Active</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 px-4 text-center text-slate-400">
                    No users match the search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrent = user.id === currentUser?.id;
                  const linkedJudge = (judges || []).find((j) => j.id === user.linkedJudgeId);
                  const linkedTeam = (teams || []).find((t) => t.id === user.linkedTeamId);

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                            {(user.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>{user.name || 'Unnamed User'}</span>
                              {isCurrent && (
                                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 border border-emerald-200 rounded font-normal">
                                  Current Session
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">{user.email || 'No email registered'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold font-mono bg-slate-100 text-slate-800 border border-slate-200 capitalize">
                          {(user.role || 'user').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {linkedJudge && <span>Judge: {linkedJudge.name}</span>}
                        {linkedTeam && <span>Team: {linkedTeam.name}</span>}
                        {!linkedJudge && !linkedTeam && <span className="text-slate-400">Direct Staff</span>}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant={user.status || 'active'} size="sm">
                          {user.status || 'active'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                        {user.lastLogin || 'Never'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          {canManageUsers && (
                            <>
                              <button
                                onClick={() => setResettingUser(user)}
                                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                title="Reset Password"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(user)}
                                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                title="Edit User"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {!isCurrent && (
                                <button
                                  onClick={() => setDeletingId(user.id)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
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

      {/* Administrative Audit Activity Log Table */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Administrative Activity Audit Trail
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {(activityLogs || []).length} Logged Actions
          </span>
        </div>

        <div className="mt-3 divide-y divide-slate-100 max-h-72 overflow-y-auto">
          {(activityLogs || []).map((log) => (
            <div key={log.id} className="py-2.5 flex items-start justify-between text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{log.userName || 'System'}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ({(log.userRole || 'staff').replace('_', ' ')})
                  </span>
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {log.action}
                  </span>
                </div>
                <p className="mt-0.5 text-slate-700 text-[11px]">{log.details}</p>
              </div>
              <span className="font-mono text-[10px] text-slate-400 flex-shrink-0 ml-3">
                {log.timestamp}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingUser ? `Edit Account: ${editingUser.name}` : 'Create User Account'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmitUser} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-500"
              placeholder="e.g. John Doe"
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
              placeholder="johndoe@luminariafest.org"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">User Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white"
              >
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="programme_manager">Programme Manager</option>
                <option value="score_manager">Score Manager</option>
                <option value="judge">Judge</option>
                <option value="team_leader">Team Leader</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {formData.role === 'judge' && (
            <div>
              <label className="block font-medium text-slate-700 mb-1">Linked Judge Profile</label>
              <select
                value={formData.linkedJudgeId}
                onChange={(e) => setFormData({ ...formData, linkedJudgeId: e.target.value })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white"
              >
                <option value="">None / Unlinked</option>
                {judges.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.name} ({j.id})
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.role === 'team_leader' && (
            <div>
              <label className="block font-medium text-slate-700 mb-1">Linked Team</label>
              <select
                value={formData.linkedTeamId}
                onChange={(e) => setFormData({ ...formData, linkedTeamId: e.target.value })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white"
              >
                <option value="">None / Unlinked</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code})
                  </option>
                ))}
              </select>
            </div>
          )}

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
              {editingUser ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Password Reset Confirmation */}
      <ConfirmDialog
        isOpen={!!resettingUser}
        onClose={() => setResettingUser(null)}
        onConfirm={handlePasswordReset}
        title="Reset Account Password"
        message={`Send a password recovery email to ${resettingUser?.email}? The user will receive instructions to establish new authentication credentials.`}
        confirmLabel="Send Reset Link"
        isDestructive={false}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => {
          if (deletingId) deleteUser(deletingId);
        }}
        title="Deactivate User"
        message="Are you sure you want to remove this user account? Access tokens and active sessions will be revoked."
      />
    </div>
  );
};
