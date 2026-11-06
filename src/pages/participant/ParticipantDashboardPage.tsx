import React, { useState, useEffect } from 'react';
import { useFest } from '../../context/FestContext';
import { Badge } from '../../components/common/Badge';
import { formatPhoneDisplay } from '../../services/authService';
import { subscribeToParticipantStatus } from '../../firebase/firestoreService';
import { Participant } from '../../types';
import {
  Trophy,
  Calendar,
  Clock,
  Sparkles,
  Award,
  Users,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  MapPin,
  CheckCircle2,
  Megaphone,
  UserCheck,
  XCircle,
  HelpCircle,
  ShieldAlert
} from 'lucide-react';

export const ParticipantDashboardPage: React.FC = () => {
  const {
    activeParticipant,
    teams,
    programmes,
    results,
    settings,
    announcements,
    leaderboard,
    setParticipantTab,
    verifyParticipantPhone,
    addToast,
  } = useFest();

  const [realtimeParticipant, setRealtimeParticipant] = useState<Participant | null>(null);

  // Subscribe to real-time status updates for this participant
  useEffect(() => {
    if (!activeParticipant?.id) return;

    const unsubscribe = subscribeToParticipantStatus(
      activeParticipant.id,
      (updated) => {
        if (updated) {
          setRealtimeParticipant(updated);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [activeParticipant?.id]);

  const currentParticipant = realtimeParticipant || activeParticipant;

  const assignedTeam = teams.find((t) => t.id === (currentParticipant?.teamId || currentParticipant?.requestedTeamId));
  const myProgrammes = programmes.filter((p) =>
    currentParticipant?.registeredProgrammes?.includes(p.id)
  );

  const myResults = results.filter(
    (r) => r.participantId === currentParticipant?.id || r.participantName === currentParticipant?.name
  );

  const totalPoints = myResults.reduce((acc, curr) => acc + (curr.pointsAwarded || 0), 0);
  const teamStanding = leaderboard.find((l) => l.team.id === (currentParticipant?.teamId || currentParticipant?.requestedTeamId));

  const handleVerifyPhoneSelf = () => {
    if (!currentParticipant?.id) return;
    const ok = verifyParticipantPhone(currentParticipant.id);
    if (ok) {
      addToast('success', 'Phone Verified', 'Your mobile phone number has been successfully verified.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Real-time Status Alert Banner */}
      {currentParticipant?.approvalStatus === 'pending_approval' && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 shadow-2xs flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 border border-amber-200">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-amber-950">Registration Request Pending Approval</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                  Live Syncing
                </span>
              </div>
              <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                Your registration request to represent <strong className="font-semibold text-amber-950">{assignedTeam?.name || currentParticipant?.requestedTeamId}</strong> has been submitted.
                Your Team Leader ({assignedTeam?.teamLeaderName || 'Team Leader'}) will review your request. This dashboard will update instantly upon review.
              </p>
            </div>
          </div>
        </div>
      )}

      {currentParticipant?.approvalStatus === 'pending_verification' && (
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/70 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 mt-0.5 border border-blue-200">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-blue-950">Phone OTP Verification Required</h3>
              <p className="text-xs text-blue-900 mt-0.5">
                Your Team Leader has invited you to join <strong className="font-semibold">{assignedTeam?.name}</strong>. Please confirm your mobile number ownership to activate your official status.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleVerifyPhoneSelf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs shrink-0"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verify Mobile OTP</span>
          </button>
        </div>
      )}

      {currentParticipant?.approvalStatus === 'rejected' && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/80 shadow-2xs flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center shrink-0 mt-0.5 border border-rose-200">
            <XCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-rose-950">Registration Request Rejected</h3>
            <p className="text-xs text-rose-900 mt-1">
              Your request to join team <strong className="font-semibold">{assignedTeam?.name || currentParticipant?.requestedTeamId}</strong> was not approved.
            </p>
            <div className="mt-2 p-2.5 bg-white/80 rounded border border-rose-200 text-xs text-rose-900 font-mono">
              <span className="font-bold font-sans">Reason provided by Team Leader:</span> {currentParticipant?.rejectionReason || 'No specific reason provided.'}
            </div>
          </div>
        </div>
      )}

      {currentParticipant?.approvalStatus === 'more_info_required' && (
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/80 shadow-2xs flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 mt-0.5 border border-blue-200">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-blue-950">More Information Requested</h3>
            <p className="text-xs text-blue-900 mt-1">
              Your Team Leader has requested additional details before finalizing your roster status:
            </p>
            <div className="mt-2 p-2.5 bg-white/80 rounded border border-blue-200 text-xs text-blue-900 font-mono">
              {currentParticipant?.moreInfoRequest || 'Please contact your Team Leader with student ID verification.'}
            </div>
          </div>
        </div>
      )}

      {/* Competitor Welcome & Status Hero */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                {currentParticipant?.id || 'PT-101'}
              </span>
              {currentParticipant?.approvalStatus === 'approved' ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Official Competitor
                </span>
              ) : currentParticipant?.approvalStatus === 'pending_approval' ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-600" />
                  Pending Approval
                </span>
              ) : currentParticipant?.approvalStatus === 'pending_verification' ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-blue-600" />
                  Pending Verification
                </span>
              ) : currentParticipant?.approvalStatus === 'rejected' ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1">
                  <XCircle className="w-3 h-3 text-rose-600" />
                  Rejected
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                  {currentParticipant?.approvalStatus || 'Registered'}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Welcome, {currentParticipant?.name}!
            </h1>
            <p className="text-xs text-slate-600">
              Competing for <strong className="text-slate-900">{assignedTeam?.name || 'Assigned Team'}</strong> in{' '}
              <strong className="text-slate-900">{settings.festName}</strong> ({currentParticipant?.category} Category).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setParticipantTab('participant_programmes')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>View My Events ({myProgrammes.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setParticipantTab('participant_schedule')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>My Timetable</span>
            </button>
          </div>
        </div>

        {/* Quick Identity strip */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <div className="text-slate-400 text-[10px] uppercase font-bold">Team Leader</div>
            <div className="font-semibold text-slate-800 mt-0.5 font-sans truncate">
              {assignedTeam?.teamLeaderName || 'Unassigned'}
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-[10px] uppercase font-bold">Leader Contact</div>
            <div className="text-slate-700 mt-0.5">
              {assignedTeam?.teamLeaderContact || 'Available on request'}
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-[10px] uppercase font-bold">College / Dept</div>
            <div className="text-slate-700 mt-0.5 font-sans truncate">
              {currentParticipant?.college || currentParticipant?.institution || 'Enrolled'}
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-[10px] uppercase font-bold">Phone Ownership</div>
            <div className={`mt-0.5 font-sans flex items-center gap-1 font-semibold ${currentParticipant?.phoneVerified ? 'text-emerald-700' : 'text-amber-700'}`}>
              {currentParticipant?.phoneVerified ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>OTP Verified</span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pending OTP</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Assigned Programmes
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {myProgrammes.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Official competitions</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Published Results
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {myResults.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Evaluated by jury</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Individual Points
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1 font-mono">
            {totalPoints} pts
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Earned for team</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Team Rank
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1 font-mono">
            {teamStanding ? `#${teamStanding.rank}` : '—'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {teamStanding ? `${teamStanding.totalPoints} total pts` : 'Calculating'}
          </div>
        </div>
      </div>

      {/* Main 2-column layout: Upcoming Events & Latest Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Assigned Programmes */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-bold text-slate-900">My Assigned Programmes</h2>
            </div>
            <button
              type="button"
              onClick={() => setParticipantTab('participant_programmes')}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900"
            >
              View all &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {myProgrammes.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                <Calendar className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
                <p className="font-semibold text-slate-700">No Programmes Assigned Yet</p>
                <p className="text-[11px] mt-0.5">
                  Your Team Leader ({assignedTeam?.teamLeaderName || 'Leader'}) will allocate events to you.
                </p>
              </div>
            ) : (
              myProgrammes.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-slate-500">{p.code}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 text-slate-700">
                      {p.status === 'completed'
                        ? 'Completed'
                        : p.status === 'ongoing'
                        ? 'Ongoing'
                        : 'Scheduled'}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 font-mono pt-1">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{p.venue}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{p.startTime} - {p.endTime}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Latest Results & Standings */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-900">Official Results & Points</h2>
            </div>
            <button
              type="button"
              onClick={() => setParticipantTab('participant_results')}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900"
            >
              View all &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {myResults.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                <Sparkles className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
                <p className="font-semibold text-slate-700">No Published Results Yet</p>
                <p className="text-[11px] mt-0.5">
                  Official scores will appear here after evaluation and admin ratification.
                </p>
              </div>
            ) : (
              myResults.slice(0, 3).map((r) => {
                const prog = programmes.find((pr) => pr.id === r.programmeId);
                return (
                  <div
                    key={r.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">
                        {prog?.name || r.programmeId}
                      </span>
                      <span className="font-bold text-sm text-emerald-700 font-mono">
                        +{r.pointsAwarded} pts
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Position: <strong>Rank #{r.rank}</strong></span>
                      <span className="font-mono text-[11px]">Score: {r.finalScore}/100</span>
                    </div>
                    {r.tieBreakNotes && (
                      <p className="text-[10px] text-slate-500 italic">
                        Note: {r.tieBreakNotes}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Announcements Bulletin */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
          <Megaphone className="w-4 h-4 text-slate-700" />
          <h2 className="text-sm font-bold text-slate-900">Fest Bulletins & Urgent Notices</h2>
        </div>
        <div className="space-y-2">
          {announcements.slice(0, 3).map((a) => (
            <div key={a.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">{a.title}</span>
                <span className="text-[10px] font-mono text-slate-400">{a.createdAt}</span>
              </div>
              <p className="text-xs text-slate-600">{a.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

