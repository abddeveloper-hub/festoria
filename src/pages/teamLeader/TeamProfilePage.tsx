import React, { useState } from 'react';
import { useFest } from '../../context/FestContext';
import {
  ShieldCheck,
  Building,
  Mail,
  Phone,
  User,
  Award,
  Trophy,
  CheckCircle2,
  Save,
  Palette
} from 'lucide-react';

export const TeamProfilePage: React.FC = () => {
  const { activeTeam, activeTeamId, leaderboard, participants, results, updateTeam, addToast } = useFest();

  const [leaderContact, setLeaderContact] = useState(activeTeam?.teamLeaderContact || '+91 98401 23456');
  const [leaderEmail, setLeaderEmail] = useState('teamleader@example.com');
  const [teamBio, setTeamBio] = useState(
    'Competing with distinction in arts, dance, music, and literary championships representing our institute.'
  );

  const teamRankEntry = leaderboard.find((e) => e.team.id === activeTeamId);
  const teamMembers = participants.filter((p) => p.teamId === activeTeamId);
  const teamResults = results.filter((r) => r.teamId === activeTeamId);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTeam) {
      updateTeam(activeTeam.id, {
        teamLeaderContact: leaderContact,
      });
      addToast('success', 'Team Profile Updated', 'Contact information saved successfully.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Team Profile & Institutional Accreditation
        </h1>
        <p className="text-sm text-slate-500">
          Official identity, performance standing, and leader liaison coordinates for{' '}
          <strong className="text-slate-900">{activeTeam?.name}</strong>.
        </p>
      </div>

      {/* Main Team Identity Card */}
      <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-white text-2xl shadow-sm shrink-0"
            style={{ backgroundColor: activeTeam?.colorHex || '#3b82f6' }}
          >
            {activeTeam?.name?.slice(0, 2).toUpperCase() || 'TM'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{activeTeam?.name}</h2>
              <span className="text-xs font-mono font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                {activeTeam?.id}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <Building size={13} className="text-slate-400" />
              <span>{activeTeam?.institution}</span>
            </div>
          </div>
        </div>

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-center">
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-500 text-[11px] uppercase font-semibold">Championship Rank</span>
            <div className="text-lg font-extrabold text-slate-900 mt-0.5">
              #{teamRankEntry?.rank || '-'}
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-500 text-[11px] uppercase font-semibold">Total Points</span>
            <div className="text-lg font-extrabold text-emerald-700 mt-0.5">
              {teamRankEntry?.totalPoints || 0} pts
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-500 text-[11px] uppercase font-semibold">Medal Count</span>
            <div className="text-lg font-extrabold text-slate-900 mt-0.5">
              🥇{teamRankEntry?.firstPlaceCount || 0} 🥈{teamRankEntry?.secondPlaceCount || 0} 🥉{teamRankEntry?.thirdPlaceCount || 0}
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-500 text-[11px] uppercase font-semibold">Registered Roster</span>
            <div className="text-lg font-extrabold text-slate-900 mt-0.5">
              {teamMembers.length} Members
            </div>
          </div>
        </div>
      </div>

      {/* Editable Contact Info Form */}
      <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-5">
        <h3 className="text-base font-bold text-slate-900">
          Leader Liaison & Emergency Coordinates
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Designated Team Leader Name
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  disabled
                  value={activeTeam?.teamLeaderName || 'Rahul Menon'}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Official leader credentials registered with Fest Admin
              </span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Institution / College Name
              </label>
              <div className="relative">
                <Building size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  disabled
                  value={activeTeam?.institution || ''}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Liaison Email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={leaderEmail}
                  onChange={(e) => setLeaderEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Emergency Phone Hotline
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={leaderContact}
                  onChange={(e) => setLeaderContact(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Team Bio & Mission Tagline
            </label>
            <textarea
              rows={3}
              value={teamBio}
              onChange={(e) => setTeamBio(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <Save size={14} />
              <span>Save Contact Details</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
