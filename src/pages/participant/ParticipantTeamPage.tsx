import React from 'react';
import { useFest } from '../../context/FestContext';
import { Badge } from '../../components/common/Badge';
import {
  Users,
  Shield,
  UserCheck,
  Building,
  Megaphone,
  Sparkles,
  Phone,
  Mail,
  Award
} from 'lucide-react';

export const ParticipantTeamPage: React.FC = () => {
  const { activeParticipant, teams, participants, announcements, leaderboard } = useFest();

  const assignedTeam = teams.find((t) => t.id === activeParticipant?.teamId);
  const teamMembers = participants.filter((p) => p.teamId === activeParticipant?.teamId);
  const standing = leaderboard.find((l) => l.team.id === activeParticipant?.teamId);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          My Assigned House & Team Roster
        </h1>
        <p className="text-sm text-slate-500">
          Official house details, designated Team Leader contacts, and fellow verified team members.
        </p>
      </div>

      {/* House Identity Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-base shadow-xs"
              style={{ backgroundColor: assignedTeam?.colorHex || '#0f172a' }}
            >
              {assignedTeam?.code || 'TM'}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{assignedTeam?.name}</h2>
                <span className="text-xs font-mono text-slate-500 font-semibold">
                  ({assignedTeam?.code})
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {assignedTeam?.institution || 'Academic Department'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Championship Standing</div>
              <div className="text-lg font-bold text-amber-700 font-mono">
                {standing ? `Rank #${standing.rank}` : 'Unranked'}
              </div>
            </div>
            <div className="text-right pl-3 border-l border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Score</div>
              <div className="text-lg font-bold text-emerald-700 font-mono">
                {standing ? `${standing.totalPoints} pts` : '0 pts'}
              </div>
            </div>
          </div>
        </div>

        {/* Team Leader Contact Block */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Designated Team Leader
              </span>
              <span className="font-bold text-slate-900 text-sm">
                {assignedTeam?.teamLeaderName || 'Faculty Coordinator'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-600 font-mono">
            {assignedTeam?.teamLeaderContact && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{assignedTeam.teamLeaderContact}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Team Roster (Privacy Preserved: no public phone exposure) */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs space-y-3 p-5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Verified House Members ({teamMembers.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 italic">
            Privacy policy applied: phone numbers are masked
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-3">Competitor</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">College / Department</th>
                <th className="py-2.5 px-3 text-center">Allocated Events</th>
                <th className="py-2.5 px-3 text-center">Membership Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teamMembers.map((member) => (
                <tr
                  key={member.id}
                  className={`hover:bg-slate-50/50 ${
                    member.id === activeParticipant?.id ? 'bg-slate-50 font-medium' : ''
                  }`}
                >
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{member.name}</span>
                      {member.id === activeParticipant?.id && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-white font-mono font-normal">
                          You
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">ID: {member.id}</span>
                  </td>

                  <td className="py-3 px-3 text-slate-700 font-medium">
                    {member.category} Category
                  </td>

                  <td className="py-3 px-3 text-slate-600">
                    <div>{member.college || member.institution || '—'}</div>
                    {member.classOrDivision && (
                      <div className="text-[10px] text-slate-400">{member.classOrDivision}</div>
                    )}
                  </td>

                  <td className="py-3 px-3 text-center font-mono font-semibold text-slate-800">
                    {member.registeredProgrammes.length} events
                  </td>

                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Active Member
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

