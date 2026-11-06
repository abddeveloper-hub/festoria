import React, { useState, useMemo } from 'react';
import { useFest } from '../../context/FestContext';
import { Participant, ParticipantCategory } from '../../types';
import { exportToCSV } from '../../services/storage';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Download,
  Edit,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles
} from 'lucide-react';

export const TeamMembersPage: React.FC = () => {
  const {
    participants,
    activeTeamId,
    activeTeam,
    addTeamMember,
    updateTeamMember,
    programmes,
  } = useFest();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Participant | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'Senior' as ParticipantCategory,
  });
  const [formError, setFormError] = useState('');

  // Team's members
  const teamMembers = useMemo(() => {
    return participants.filter((p) => p.teamId === activeTeamId);
  }, [participants, activeTeamId]);

  // Filtered members
  const filteredMembers = useMemo(() => {
    return teamMembers.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = categoryFilter === 'all' || m.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [teamMembers, searchQuery, categoryFilter]);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      category: 'Senior',
    });
    setFormError('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (member: Participant) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone,
      category: member.category,
    });
    setFormError('');
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Member full name is required');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFormError('A valid email address is required');
      return;
    }

    if (editingMember) {
      updateTeamMember(editingMember.id, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        category: formData.category,
      });
      setEditingMember(null);
    } else {
      const success = addTeamMember({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        teamId: activeTeamId,
        category: formData.category,
        registeredProgrammes: [],
        status: 'registered',
      });
      if (success) {
        setShowAddModal(false);
      }
    }
  };

  const handleExportCSV = () => {
    const rows = teamMembers.map((m) => ({
      ID: m.id,
      Name: m.name,
      Email: m.email,
      Phone: m.phone,
      Category: m.category,
      Status: m.status,
      'Registered Events Count': m.registeredProgrammes.length,
      'Created Date': m.createdAt,
    }));
    exportToCSV(`${activeTeam?.name || 'Team'}_Roster`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Team Members & Official Roster
          </h1>
          <p className="text-sm text-slate-500">
            Registered participants for <strong className="text-slate-900">{activeTeam?.name}</strong> eligible to be assigned to programmes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <Download size={14} />
            <span>Export Roster</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <UserPlus size={14} />
            <span>Add Team Member</span>
          </button>
        </div>
      </div>

      {/* Roster Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Total Members
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{teamMembers.length}</div>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Junior Category
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {teamMembers.filter((m) => m.category === 'Junior').length}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Senior Category
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {teamMembers.filter((m) => m.category === 'Senior').length}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Open Category
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {teamMembers.filter((m) => m.category === 'Open').length}
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, ID, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Filter size={13} />
            Category:
          </span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-800 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="Junior">Junior</option>
            <option value="Senior">Senior</option>
            <option value="Open">Open</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4 text-center">Assigned Events</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    No team members found matching your search.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const assignedProgrammes = programmes.filter((p) =>
                    member.registeredProgrammes.includes(p.id)
                  );
                  return (
                    <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{member.name}</span>
                            <span className="text-[11px] font-mono text-slate-500">{member.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-medium ${
                            member.category === 'Junior'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : member.category === 'Senior'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {member.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 space-y-0.5">
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate">{member.email}</span>
                        </div>
                        {member.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone size={12} className="text-slate-400 shrink-0" />
                            <span>{member.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {member.registeredProgrammes.length} events
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 size={11} />
                          Verified
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right pr-6">
                        <button
                          onClick={() => handleOpenEdit(member)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Member Information"
                        >
                          <Edit size={14} />
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

      {/* Add / Edit Member Modal */}
      {(showAddModal || editingMember) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingMember ? 'Edit Team Member' : 'Register New Team Member'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingMember(null);
                }}
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

            <form onSubmit={handleSaveMember} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ananya Rao"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="ananya.rao@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Participation Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as ParticipantCategory })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900 bg-white"
                >
                  <option value="Junior">Junior (Under 18 / 1st Year)</option>
                  <option value="Senior">Senior (18+ / 2nd-4th Year)</option>
                  <option value="Sub-Junior">Sub-Junior</option>
                  <option value="Open">Open (All Eligible Participants)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingMember(null);
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  {editingMember ? 'Update Member' : 'Add to Roster'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
