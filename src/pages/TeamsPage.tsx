import React, { useState, useMemo } from 'react';
import { useFest } from '../context/FestContext';
import { Team } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import {
  Search,
  Plus,
  Shield,
  Trophy,
  Users,
  Eye,
  Edit2,
  Trash2,
  Building,
  Mail,
  Medal,
  CalendarCheck
} from 'lucide-react';

export const TeamsPage: React.FC = () => {
  const {
    teams,
    participants,
    programmes,
    results,
    leaderboard,
    addTeam,
    updateTeam,
    deleteTeam,
    hasPermission,
    addToast,
    navigateToTabWithFilter,
  } = useFest();

  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [viewingTeam, setViewingTeam] = useState<Team | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    institution: '',
    teamLeaderName: '',
    teamLeaderContact: '',
    colorHex: '#3b82f6',
    status: 'active' as 'active' | 'inactive',
  });

  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      const s = search.toLowerCase();
      return (
        t.name.toLowerCase().includes(s) ||
        t.code.toLowerCase().includes(s) ||
        t.institution.toLowerCase().includes(s) ||
        t.teamLeaderName.toLowerCase().includes(s)
      );
    });
  }, [teams, search]);

  const handleOpenAdd = () => {
    setEditingTeam(null);
    setFormData({
      code: '',
      name: '',
      institution: '',
      teamLeaderName: '',
      teamLeaderContact: '',
      colorHex: '#3b82f6',
      status: 'active',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (t: Team) => {
    setEditingTeam(t);
    setFormData({
      code: t.code,
      name: t.name,
      institution: t.institution,
      teamLeaderName: t.teamLeaderName,
      teamLeaderContact: t.teamLeaderContact,
      colorHex: t.colorHex || '#3b82f6',
      status: t.status,
    });
    setIsAddModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code || !formData.institution) {
      addToast('error', 'Incomplete Form', 'Please fill all required team fields.');
      return;
    }

    if (editingTeam) {
      updateTeam(editingTeam.id, formData);
      setIsAddModalOpen(false);
    } else {
      const ok = addTeam(formData);
      if (ok) setIsAddModalOpen(false);
    }
  };

  const canManage = hasPermission(['super_admin', 'admin']);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Teams & Standings Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage house/college contingents, calculate automated leaderboard standings, and view rosters.
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register New Team</span>
          </button>
        )}
      </div>

      {/* Leaderboard Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Official Team Leaderboard & Trophies
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Auto-calculated from Ratified Results
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {leaderboard.slice(0, 3).map((entry, index) => {
            const isFirst = index === 0;
            return (
              <div
                key={entry.team.id}
                onClick={() => setViewingTeam(entry.team)}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  isFirst
                    ? 'border-amber-200 bg-amber-50/20 hover:bg-amber-50/40'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-mono text-xs font-bold ${
                      isFirst
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    #{entry.rank}
                  </span>
                  <span className="font-mono text-base font-black text-slate-900">
                    {entry.totalPoints} pts
                  </span>
                </div>

                <div className="mt-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: entry.team.colorHex || '#3b82f6' }}
                    />
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {entry.team.name}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {entry.team.institution}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-mono">
                  <span>1st: {entry.firstPlaceCount}</span>
                  <span>2nd: {entry.secondPlaceCount}</span>
                  <span>3rd: {entry.thirdPlaceCount}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search teams by name, code, leader, college..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:border-slate-400 text-slate-800"
          />
        </div>

        <div className="text-xs font-mono text-slate-500">
          {filteredTeams.length} Contingents Registered
        </div>
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredTeams.map((team) => {
          const leaderEntry = leaderboard.find((l) => l.team.id === team.id);
          const teamParticipants = participants.filter((p) => p.teamId === team.id);
          const teamProgrammes = programmes.filter((p) =>
            p.registeredTeamIds.includes(team.id) ||
            teamParticipants.some((pt) => pt.registeredProgrammes.includes(p.id))
          );

          return (
            <div
              key={team.id}
              className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors text-xs"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-8 rounded-xs"
                      style={{ backgroundColor: team.colorHex || '#64748b' }}
                    />
                    <div>
                      <span className="font-mono text-[10px] font-bold text-slate-500">
                        {team.code}
                      </span>
                      <h4 className="font-bold text-slate-900 leading-tight">
                        {team.name}
                      </h4>
                    </div>
                  </div>
                  <Badge variant={team.status} size="sm">
                    {team.status}
                  </Badge>
                </div>

                <div className="mt-3 text-slate-600 text-[11px] space-y-1">
                  <div className="truncate">
                    <span className="text-slate-400">Inst: </span>
                    {team.institution}
                  </div>
                  <div className="truncate">
                    <span className="text-slate-400">Leader: </span>
                    {team.teamLeaderName}
                  </div>
                </div>

                {/* Score & Roster Stats */}
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Points</span>
                    <p className="font-mono font-black text-slate-900 mt-0.5 text-sm">
                      {leaderEntry?.totalPoints || 0}
                    </p>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Members</span>
                    <p className="font-mono font-bold text-slate-900 mt-0.5">
                      {teamParticipants.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setViewingTeam(team)}
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Roster</span>
                </button>

                {canManage && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(team)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      title="Edit Team"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingId(team.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Deactivate / Delete"
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

      {/* Add / Edit Team Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingTeam ? `Edit Team: ${editingTeam.name}` : 'Register New Team'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Team Code *</label>
              <input
                type="text"
                required
                maxLength={4}
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-500 font-mono uppercase"
                placeholder="e.g. PHX"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Color Identifier</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.colorHex}
                  onChange={(e) => setFormData({ ...formData, colorHex: e.target.value })}
                  className="w-8 h-8 rounded border border-slate-300 p-0.5 cursor-pointer bg-white"
                />
                <input
                  type="text"
                  value={formData.colorHex}
                  onChange={(e) => setFormData({ ...formData, colorHex: e.target.value })}
                  className="flex-1 border border-slate-300 rounded px-2 py-1 font-mono text-xs"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">Team Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-500"
                placeholder="e.g. Phoenix House"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">
                Institution / Faculty *
              </label>
              <input
                type="text"
                required
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-500"
                placeholder="e.g. School of Engineering"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Team Leader Name</label>
              <input
                type="text"
                value={formData.teamLeaderName}
                onChange={(e) => setFormData({ ...formData, teamLeaderName: e.target.value })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                placeholder="e.g. Rahul Menon"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Leader Contact Email</label>
              <input
                type="email"
                value={formData.teamLeaderContact}
                onChange={(e) => setFormData({ ...formData, teamLeaderContact: e.target.value })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                placeholder="leader@example.com"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
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
              {editingTeam ? 'Save Team' : 'Create Team'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Team Details & Roster Modal */}
      {viewingTeam && (
        <Modal
          isOpen={!!viewingTeam}
          onClose={() => setViewingTeam(null)}
          title={`Team Dossier: ${viewingTeam.name} (${viewingTeam.code})`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded border border-slate-200 grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Institution</span>
                <p className="font-semibold text-slate-900">{viewingTeam.institution}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Leader</span>
                <p className="font-medium text-slate-800">{viewingTeam.teamLeaderName || 'Not designated'}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Points</span>
                <p className="font-mono font-bold text-slate-900">
                  {leaderboard.find((l) => l.team.id === viewingTeam.id)?.totalPoints || 0} pts
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Leaderboard Rank</span>
                <p className="font-mono font-bold text-slate-900">
                  #{leaderboard.find((l) => l.team.id === viewingTeam.id)?.rank || '-'}
                </p>
              </div>
            </div>

            {/* Registered Participants Roster */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Registered Contingent Members</h4>
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded divide-y divide-slate-100">
                {participants
                  .filter((p) => p.teamId === viewingTeam.id)
                  .map((p) => (
                    <div key={p.id} className="p-2 flex items-center justify-between">
                      <div>
                        <span className="font-medium text-slate-800">{p.name}</span>
                        <span className="text-[10px] font-mono text-slate-400 ml-2">({p.id})</span>
                      </div>
                      <Badge variant={p.status} size="sm">
                        {p.category}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewingTeam(null)}
                className="px-3 py-1.5 text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
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
          if (deletingId) deleteTeam(deletingId);
        }}
        title="Deactivate Team"
        message="Are you sure you want to deactivate this team? Team participants and points will be archived."
      />
    </div>
  );
};
