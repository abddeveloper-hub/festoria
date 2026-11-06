import React, { useState } from 'react';
import { useFest } from '../../context/FestContext';
import {
  User,
  ShieldCheck,
  Phone,
  Mail,
  Award,
  Layers,
  LogOut,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Building,
  Key
} from 'lucide-react';
import { formatPhoneDisplay } from '../../services/authService';

export const ParticipantAccountPage: React.FC = () => {
  const {
    activeParticipant,
    teams,
    settings,
    setActiveParticipantId
  } = useFest();

  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const myTeam = teams.find((t) => t.id === activeParticipant?.teamId);

  const handleSignOut = () => {
    setActiveParticipantId('');
    localStorage.removeItem('festflow_active_participant_id');
    localStorage.setItem('festflow_portal', 'public');
    window.location.href = '/index.html';
  };

  const navigateTo = (url: string) => {
    window.location.href = url;
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Participant Account & Security
        </h1>
        <p className="text-sm text-slate-500">
          Account credentials, authenticated phone contact, registration metadata, and session management.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-lg text-slate-700">
              {activeParticipant?.photoUrl ? (
                <img
                  src={activeParticipant.photoUrl}
                  alt={activeParticipant.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                activeParticipant?.name.slice(0, 2).toUpperCase() || 'PT'
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {activeParticipant?.name}
                </h2>
                <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  Chest #{activeParticipant?.id}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeParticipant?.category} Category • {myTeam?.name || 'Unassigned House'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                activeParticipant?.approvalStatus === 'approved'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {activeParticipant?.approvalStatus === 'approved'
                ? 'Official Verified Competitor'
                : 'Registration Pending Approval'}
            </span>
          </div>
        </div>

        {/* Detailed Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Registered Phone (OTP Verified)
            </span>
            <div className="flex items-center gap-2 font-mono font-semibold text-slate-900 text-sm">
              <Phone className="w-4 h-4 text-slate-500" />
              <span>{formatPhoneDisplay(activeParticipant?.phone || '')}</span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                <ShieldCheck className="w-3 h-3" />
                Verified
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Used for 2-factor OTP participant portal sign-in.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Registered Email
            </span>
            <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
              <Mail className="w-4 h-4 text-slate-500" />
              <span>{activeParticipant?.email || 'Not specified'}</span>
            </div>
            <p className="text-[10px] text-slate-400">
              Official notifications and scorecard dispatches.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Assigned House / Team
            </span>
            <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
              <Building className="w-4 h-4 text-slate-500" />
              <span>{myTeam?.name || 'Assigned House'} ({myTeam?.code})</span>
            </div>
            <p className="text-[10px] text-slate-400">
              Institution: {activeParticipant?.college || myTeam?.institution || 'Campus Delegation'}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Registration Channel
            </span>
            <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
              <Award className="w-4 h-4 text-slate-500" />
              <span>
                {activeParticipant?.registrationSource === 'team_leader_invitation'
                  ? 'Team Leader Direct Invitation'
                  : 'Self-Registered via Fest Web Portal'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Created: {new Date(activeParticipant?.createdAt || '').toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Switch Portal Navigation */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Switch Application Portal
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quickly navigate to public festival views or privileged administration consoles (credentials required).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <button
            onClick={() => navigateTo('/index.html')}
            className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
          >
            <div>
              <span className="font-semibold text-slate-800 block">Main Public Fest Website</span>
              <span className="text-slate-500 text-[11px]">View stages, live feed and public leaderboard</span>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => navigateTo('/team-leader.html')}
            className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
          >
            <div>
              <span className="font-semibold text-slate-800 block">Team Leader Console</span>
              <span className="text-slate-500 text-[11px]">Manage house roster, substitutions & requests</span>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => navigateTo('/admin.html')}
            className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
          >
            <div>
              <span className="font-semibold text-slate-800 block">Fest Admin Panel</span>
              <span className="text-slate-500 text-[11px]">Manage events, scores, and team leaders</span>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => navigateTo('/super-admin.html')}
            className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
          >
            <div>
              <span className="font-semibold text-slate-800 block">Super Admin Panel</span>
              <span className="text-slate-500 text-[11px]">Platform-wide festivals and system configuration</span>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Sign Out Card */}
      <div className="bg-white border border-rose-200 rounded-lg p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Sign Out of Participant Portal
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Terminates your active session on this device. You can sign back in anytime using your phone OTP.
          </p>
        </div>

        {confirmSignOut ? (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setConfirmSignOut(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSignOut}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm"
            >
              Confirm Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmSignOut(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold rounded-lg transition-colors shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        )}
      </div>
    </div>
  );
};

